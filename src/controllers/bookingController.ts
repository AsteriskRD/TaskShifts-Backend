import { Request, Response } from 'express';
import { BookingModel } from '../models/booking';

/**
 * ======================
 *     BOOKING
 * ======================
 */
export const booking = async (req: Request, res: Response) => {
    try {
        const {clientId} = req.query;
        const {providerId, clientLocation, clientName, DateofBooking, providerService} = req.body;

        const newBooking = new BookingModel({
            clientId,
            providerId,
            clientLocation,
            clientName,
            DateofBooking,
            providerService
        });

        await newBooking.save();

        res.status(201).json({
            success: true,
            message: 'TaskShifts: Booking successful',
            data: {clientId, providerId, clientName, clientLocation, DateofBooking, providerService}
        });
    } catch(error) {
        console.error('TaskShifts: Booking error', error);
        res.status(500).json({
            success: false,
            message: 'TaskShifts: Booking failed',
            error: 'Server error'
        });
    }
};