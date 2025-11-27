import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';


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
