import mongoose from 'mongoose';
import { ProviderModel, ClientModel } from '../models/user';
import { IProvider } from '../interfaces/user';
import { IClient } from '../interfaces/user';

/**
 * Find any user (client or provider) by email
 */
export const findUserByEmail = async (email: string) => {
  return (
    (await ProviderModel.findOne({ email })) ||
    (await ClientModel.findOne({ email }))
  );
};

/**
 * Find any user (client or provider) by ID
 */
export const findUserById = async (id: mongoose.Types.ObjectId | string) => {
  return (
    (await ProviderModel.findById(id)) ||
    (await ClientModel.findById(id))
  );
};

/**
 * Find only provider by ID (for KYC, services, etc.)
 */
export const findProviderById = async (id: mongoose.Types.ObjectId | string): Promise<IProvider | null> => {
  return await ProviderModel.findById(id);
};

/**
 * Find only client by ID
 */
export const findClientById = async (id: mongoose.Types.ObjectId | string): Promise<IClient | null> => {
  return await ClientModel.findById(id);
};

/**
 * Find any user by reset token
*/
export const findUserByResetToken = async (hashedToken: string) => {
  return (
    (await ProviderModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    })) ||
    (await ClientModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }))
  );
};
