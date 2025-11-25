import { Document } from "mongoose";

export interface Review extends Document {
    ratings?: Number;
    review?: String;
}