import { Request, Response } from "express";
import reviewModel from "../models/review";

/**
 * =================================
 *              REVIEW
 * =================================
 */


export const submitReview = async (req: Request, res: Response) => {
    try {
         const { ratings, review } = req.body;

    const newReview = new reviewModel(
        ratings,
        review
    )

    await newReview.save();

    res.status(201).json({
        success: true,
        message: "Details saved successfully",
        data: newReview
    })
    } catch(error: any) {
        console.error("Details not saved");
        res.status(500).json({
            success: false,
            message: "Details not saved",
            error: error.message
        })
    }
}

export const getReviews = async (req: Request, res: Response) => {
    try {
        const reviews = await reviewModel.find();
        res.status(200).json({
            success: true,
            message: "Reviews fetched successfully",
            data: reviews
        });
    }   
    catch (error: any) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching reviews",
            error: error.message
        });
    }
}

export const updateReview = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { ratings, review } = req.body;
        const updatedReview = await reviewModel.findByIdAndUpdate(
            id,
            { ratings, review },
            { new: true }
        );
        if (!updatedReview) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: updatedReview
        });
    }
    catch (error: any) {
        console.error("Error updating review:", error);
        res.status(500).json({
            success: false,
            message: "Error updating review",
            error: error.message
        });
    }
}
