import { Request, Response } from "express";
import KycModel from "../models/kyc";
import { uploadToCloudinary } from "./uploadController";

/**
 * ======================================
 *         SUBMIT KYC INFORMATION
 * ======================================
 */

export const submitKyc = async (req: Request, res: Response) => {
    try {
        const kycData = req.body;

        // Create a new KYC document
        const newKyc = new KycModel(kycData);

        newKyc.personalInformation.imageUrl = (await uploadToCloudinary(newKyc.personalInformation.imageUrl || '', 'image')).url;
        newKyc.documentVerification.businessRegDocumentUrl = (await uploadToCloudinary(newKyc.documentVerification.businessRegDocumentUrl || '', 'raw')).url;
        newKyc.businessAddressVerification.documentUrl = (await uploadToCloudinary(newKyc.businessAddressVerification.documentUrl || '', 'raw')).url;
        newKyc.identityVerification.frontImageUrl = (await uploadToCloudinary(newKyc.identityVerification.frontImageUrl || '', 'image')).url;
        newKyc.identityVerification.backImageUrl = (await uploadToCloudinary(newKyc.identityVerification.backImageUrl || '', 'image')).url;

        await newKyc.save();

        res.status(201).json({
            success: true,
            message: "KYC information submitted successfully.",
            data: newKyc,
        });
    } catch (error : any) {
        console.error("Error submitting KYC:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit KYC information.",
            error: error.message,
        });
    }
};
