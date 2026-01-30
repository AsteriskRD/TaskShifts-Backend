import { Request, Response } from 'express';
import { BookingModel } from '../models/booking';

/**
 * ======================
 *     BOOKING
 * ======================
 */
export const booking = async (req: Request, res: Response) => {
    try {
        const clientId = (req as any).user.id;

        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: 'TaskShifts: Authentication required',
                error: 'User not authenticated'
            });
        }

        const {providerId, clientLocation, clientName, dateOfBooking, providerService} = req.body;

        if (!providerId || !clientLocation || !clientName || !providerService) {
            return res.status(400).json({
                success: false,
                message: 'TaskShifts: Missing required fields',
                error: 'Please provide all required booking information'
            });
        }

        const newBooking = new BookingModel({
            clientId,
            providerId,
            clientLocation,
            clientName,
            dateOfBooking: dateOfBooking || new Date,
            providerService
        });

        await newBooking.save();

        res.status(201).json({
            success: true,
            message: 'TaskShifts: Booking successful',
            data: {
                bookingId: newBooking._id,
                clientId: newBooking.clientId,
                providerId: newBooking.providerId,
                clientName: newBooking.clientName,
                clientLocation: newBooking.clientLocation,
                dateOfBooking: newBooking.dateOfBooking,
                providerService: newBooking.providerService
            }
        });
    } catch(error) {
        console.error('TaskShifts: Booking error', error);

        if (error instanceof Error && error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'TaskShifts: Booking validation failed',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'TaskShifts: Booking failed',
            error: 'Server error'
        });
    }
};