import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';

// Configure once at app startup (e.g., in app.ts)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (filePath: string, folder: string) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `taskshift/${folder}`,
    resource_type: 'image',
    quality: 'auto',
    fetch_format: 'auto',
  });

  // Delete temp file cleanup
  await fs.unlink(filePath).catch(() => {});

  return result;
};
