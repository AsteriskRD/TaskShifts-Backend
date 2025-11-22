import mongoose, { Schema } from "mongoose";
import { Review } from "../interfaces/review";

const reviewSchema = new Schema<Review>(
    {
        ratings: { type: Number, required: true },
        review: { type: String, required: true, trim: true}
    }
)

const reviewModel = mongoose.model<Review>("reviewModel", reviewSchema);
export default reviewModel;