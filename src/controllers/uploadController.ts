import { v2 as cloudinary } from 'cloudinary';

export const uploadToCloudinary = async (filePath: string, resourceType: 'image' | 'raw' = 'image') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: resourceType,
            folder: 'my-app-uploads'
        });
        return { url: result.secure_url, publicId: result.public_id };
    } catch (error) {
        console.error('Cloudinary upload error', error);
        throw new Error('Failed to upload to cloudinary');
    }
};