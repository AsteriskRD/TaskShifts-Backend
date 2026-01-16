import { Request, Response } from 'express';
import { ProviderModel } from '../models/user';
import { AuditLogModel } from '../models/auditLog';
import { Resend } from 'resend';
import { findProviderById } from '../utils/userUtils';

const resend = new Resend(process.env.RESEND_API_KEY!);

// Helper: Send email via Resend
const sendKycEmail = async (email: string, subject: string, html: string) => {
  try {
    await resend.emails.send({
      from: 'TaskShifts <no-reply@taskshifts.com>',
      to: email,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email failed:', err);
  }
};

// 1. GET /api/admin/kyc/pending
export const getPendingKyc = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const [providers, total] = await Promise.all([
      ProviderModel.find({
        userType: 'provider',
        kycStatus: 'pending',
      })
        .select('userId email firstName lastName phone kycStatus kycProgress createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProviderModel.countDocuments({ userType: 'provider', kycStatus: 'pending' }),
    ]);

    return res.json({
      success: true,
      data: providers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 2. GET /api/admin/kyc/:providerId/details
export const getKycDetails = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const provider = await findProviderById(providerId);

    if (!provider || provider.userType !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    return res.json({
      success: true,
      data: {
        personal: {
          firstName: provider.firstName,
          lastName: provider.lastName,
          phone: provider.phone,
          gender: provider.gender,
          dateOfBirth: provider.dateOfBirth,
          bio: provider.bio,
          profilePicture: provider.profilePicture,
        },
        documents: provider.documents || [], // assuming this field was added in step2
        services: provider.servicesRender || [],
        kycStatus: provider.kycStatus,
        kycProgress: provider.kycProgress,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// 3. PATCH /api/admin/kyc/:providerId/approve
export const approveKyc = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const admin = (req as any).user;
    const { step, comment } = req.body;

    const provider = await findProviderById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    if (provider.kycStatus !== 'pending') {
      return res.status(400).json({ message: 'KYC is not pending' });
    }

    let message = 'KYC fully approved';

    if (step) {
      // Approve specific step
      if (step === 1) provider.kycProgress.step1Completed = true;
      if (step === 2) provider.kycProgress.step2Completed = true;
      if (step === 3) provider.kycProgress.step3Completed = true;

      provider.kycProgress.currentStep = step + 1;

      if (step === 3) {
        provider.kycStatus = 'verified';
        message = 'KYC fully approved';
      } else {
        message = `Step ${step} approved`;
      }
    } else {
      // Approve entire KYC
      provider.kycStatus = 'verified';
      provider.kycProgress = {
        currentStep: 3,
        step1Completed: true,
        step2Completed: true,
        step3Completed: true,
      };
    }

    await provider.save();

    // Audit log
    await AuditLogModel.create({
      adminId: admin._id,
      action: step ? `kyc_approve_step_${step}` : 'kyc_approve_full',
      targetId: provider._id,
      details: { step, comment },
      reason: comment,
    });

    // Email notification
    await sendKycEmail(
      provider.email,
      'Your TaskShifts KYC has been approved!',
      `<p>Dear ${provider.firstName},</p>
       <p>Your KYC has been ${step ? `step ${step}` : 'fully'} approved.</p>
       <p>${comment || ''}</p>
       <p>You can now start offering services on TaskShifts.</p>`
    );

    return res.json({ success: true, message, kycStatus: provider.kycStatus });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 4. PATCH /api/admin/kyc/:providerId/reject
export const rejectKyc = async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const admin = (req as any).user;
    const { reason, comment, step } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const provider = await findProviderById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    provider.kycStatus = 'rejected';
    if (step) {
      // Optional: reset specific step progress
      if (step === 1) provider.kycProgress.step1Completed = false;
      if (step === 2) provider.kycProgress.step2Completed = false;
      if (step === 3) provider.kycProgress.step3Completed = false;
    }

    await provider.save();

    // Audit log
    await AuditLogModel.create({
      adminId: admin._id,
      action: step ? `kyc_reject_step_${step}` : 'kyc_reject_full',
      targetId: provider._id,
      details: { step, reason, comment },
      reason,
    });

    // Email notification
    await sendKycEmail(
      provider.email,
      'Your TaskShifts KYC has been rejected',
      `<p>Dear ${provider.firstName},</p>
       <p>Your KYC was rejected for the following reason:</p>
       <p><strong>${reason}</strong></p>
       <p>${comment || ''}</p>
       <p>Please update and resubmit your documents.</p>`
    );

    return res.json({ success: true, message: 'KYC rejected', kycStatus: 'rejected' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
