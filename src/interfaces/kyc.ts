import { Document } from "mongoose";

export interface IKyc extends Document {
    personalInformation: {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        email?: string;
        bio?: string;
        imageUrl?: string;
        isActive: boolean;
    };

    documentVerification: {
        type?: string;
        registrationNumber?: string;
        businessRegDocumentUrl?: string;
    }

    businessAddressVerification: {
        type?: string;
        documentUrl?: string;
    }

    identityVerification: {
        type?: string;
        documentNumber?: string;
        frontImageUrl?: string;
        backImageUrl?: string;
        confirmationStatus?: boolean;
    }
}