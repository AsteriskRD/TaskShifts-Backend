import { Request, Response } from 'express';
import { BookingModel } from '../models/booking';
import { findProviderById, findClientById } from '../utils/userUtils';
import { sendEmail } from "../utils/sendEmail";
import { bookingConfirmationTemplate } from "../emailTemplates/bookingConfirmationTemplate";
import { bookingRescheduleTemplate } from "../emailTemplates/bookingRescheduleTemplate";
import { bookingCancellationTemplate } from "../emailTemplates/bookingCancellationTemplate";
import { bookingAcceptanceTemplate } from "../emailTemplates/bookingAcceptanceTemplate";
import { bookingCompletionTemplate } from "../emailTemplates/bookingCompletionTemplate";

// POST /api/bookings - Client creates a booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    const clientId = (req as any).user.id;
    const { providerId, serviceId, date, duration, notes } = req.body;

    if (!providerId || !serviceId || !date || !duration) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const client = await findClientById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const provider = await findProviderById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Check if provider is available (optional business logic)
    if (!provider.availability) {
      return res.status(400).json({ message: 'Provider is currently unavailable' });
    }

    // Validate date is in future
    const bookingDate = new Date(date);
    if (bookingDate <= new Date()) {
      return res.status(400).json({ message: 'Booking date must be in the future' });
    }

    const booking = new BookingModel({
      clientId,
      providerId,
      serviceId,
      date: bookingDate,
      duration,
      notes,
      status: 'pending',
    });

    await booking.save();

    // For provider notification
    await sendEmail({
      to: provider.email,
      subject: `TaskShifts - New Booking Request from ${client.firstName}`,
      html: bookingConfirmationTemplate({
        clientName: client.firstName + ' ' + client.lastName,
        providerName: provider.firstName + ' ' + provider.lastName,
        bookingDate: bookingDate,
        duration: duration,
        note: notes,
        bookingId: booking._id.toString(),
        status: "Pending",
        supportEmail: "support@taskshifts.com"
      }, true)  // true = for provider
    });

    // For client confirmation
    await sendEmail({
      to: client.email,
      subject: `TaskShifts - Your Booking with ${provider.firstName} is pending`,
      html: bookingConfirmationTemplate({
        clientName: client.firstName + ' ' + client.lastName,
        providerName: provider.firstName + ' ' + provider.lastName,
        bookingDate: bookingDate,
        duration: duration,
        note: notes,
        bookingId: booking._id.toString(),
        status: "Pending",
        supportEmail: "support@taskshifts.com"
      }, flase)  // false = for client
    });

    return res.status(201).json({
      success: true,
      message: 'Booking request sent',
      booking,
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/bookings/my - Get my bookings (client or provider)
export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userType = (req as any).user.userType;

    const query = userType === 'provider' 
      ? { providerId: userId } 
      : { clientId: userId };

    const bookings = await BookingModel.find(query)
      .populate('clientId', 'firstName lastName profilePicture')
      .populate('providerId', 'firstName lastName profilePicture')
      .populate('serviceId')
      .sort({ date: -1 })
      .lean();

    return res.json({
      success: true,
      bookings,
      total: bookings.length,
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/bookings/:bookingId/reschedule - Client or provider reschedules
export const rescheduleBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userType = (req as any).user.userType;
    const { bookingId } = req.params;
    const { newDate, reason } = req.body;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.clientId.toString() !== userId && booking.providerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (new Date(newDate) <= new Date()) {
      return res.status(400).json({ message: 'New date must be in the future' });
    }

    // Check userType
    let isProvider: Boolean;
    if (userType === 'provider') {
      is4Provider = false;
    } else {
      is4Provider = true;
    }

    // Fetch client
    const client = await findClientById(booking.clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Fetch provider
    const provider = await findProviderById(booking.providerId);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    // Update booking
    booking.oldDate = booking.bookingDate;
    booking.bookingDate = new Date(newDate);
    booking.status = 'rescheduled';
    booking.rescheduleReason = reason;
    await booking.save();

    // Notify other party via email
    const details = {
      clientName: booking.clientName,
      providerName: booking.providerName,
      bookingDate: booking.bookingDate,
      oldDate: booking.oldDate,
      duration: booking.duration,
      note: booking.rescheduleReason,
      bookingId: booking._id.toString(),
      status: booking.status,
      supportEmail: "support@taskshifts.com"
    };

    // send reschedule message
    await sendEmail({
      to: is4Provider ? provider.email : client.email,
      subject: `Booking Rescheduled - ${booking._id}`,
      html: bookingRescheduleTemplate(details, isProvider)
    });


    return res.json({
      success: true,
      message: 'Booking rescheduled',
      booking,
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/bookings/:bookingId/cancel - Client or provider cancels
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userType = (req as any).user.userType;
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.clientId.toString() !== userId && booking.providerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed booking' });
    }

    // Check userType
    let isProvider: Boolean;
    if (userType === 'provider') {
      is4Provider = false;
    } else {
      is4Provider = true;
    }

    // Fetch client
    const client = await findClientById(booking.clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Fetch provider
    const provider = await findProviderById(booking.providerId);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    await booking.save();

    // Notify other party via email
    const details = {
      clientName: booking.clientName,
      providerName: booking.providerName,
      bookingDate: booking.bookingDate,
      duration: booking.duration,
      note: booking.cancellationReason,
      bookingId: booking._id.toString(),
      status: booking.status,
      supportEmail: "support@taskshifts.com",
      cancelledBy: userType
    };

    // send cancellation message
    await sendEmail({
      to: is4Provider ? provider.email : client.email,
      subject: `Booking cancelled - ${booking._id}`,
      html: bookingCancellationTemplate(details, isProvider)
    });

    return res.json({
      success: true,
      message: 'Booking cancelled',
      booking,
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/bookings/:bookingId/accept - Provider accepts
export const acceptBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userType = (req as any).user.userType;
    const { bookingId } = req.params;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.clientId.toString() !== userId && booking.providerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.providerId.toString() !== providerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking is not pending' });
    }

    // Check userType
    let isProvider: Boolean;
    if (userType === 'provider') {
      is4Provider = false;
    } else {
      is4Provider = true;
    }

    // Fetch client
    const client = await findClientById(booking.clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Fetch provider
    const provider = await findProviderById(booking.providerId);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    booking.status = 'accepted';
    await booking.save();
    
    // Notify other party via email
    const details = {
      clientName: booking.clientName,
      providerName: booking.providerName,
      bookingDate: booking.bookingDate,
      duration: booking.duration,
      note: booking.note,
      bookingId: booking._id.toString(),
      status: booking.status,
      supportEmail: "support@taskshifts.com",
    };

    // send acceptance message
    await sendEmail({
      to: is4Provider ? provider.email : client.email,
      subject: `Booking accepted - ${booking._id}`,
      html: bookingAcceptanceTemplate(details, isProvider)
    });

    return res.json({
      success: true,
      message: 'Booking accepted',
      booking,
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/bookings/:bookingId/complete - Provider marks as complete
export const completeBooking = async (req: Request, res: Response) => {
  try {
    const providerId = (req as any).user.id;
    const userType = (req as any).user.userType;
    const { bookingId } = req.params;

    const booking = await BookingModel.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.providerId.toString() !== providerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check userType
    let isProvider: Boolean;
    if (userType === 'provider') {
      is4Provider = false;
    } else {
      is4Provider = true;
    }

    // Fetch client
    const client = await findClientById(booking.clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Fetch provider
    const provider = await findProviderById(booking.providerId);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    if (booking.status !== 'accepted') {
      return res.status(400).json({ message: 'Booking must be accepted first' });
    }

    booking.status = 'completed';
    await booking.save();

    // Notify other party via email
    const details = {
      clientName: booking.clientName,
      providerName: booking.providerName,
      bookingDate: booking.bookingDate,                                                                                                                               duration: booking.duration,
      note: booking.note,
      bookingId: booking._id.toString(),
      status: booking.status,
      supportEmail: "support@taskshifts.com",
    };

    // send acceptance message
    await sendEmail({
      to: is4Provider ? provider.email : client.email,
      subject: `Booking completed - ${booking._id}`,
      html: bookingCompletionTemplate(details, is4Provider)
    });

    return res.json({
      success: true,
      message: 'Booking completed',
      booking,
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error' });
  }
};
