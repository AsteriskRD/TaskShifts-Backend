import express  from "express";
import { getReviews, submitReview, updateReview } from "../controllers/reviewController";

const router = express.Router();

router.post("/submit/review", submitReview);

router.get("/reviews", getReviews); 

router.put("/update/review/:id", updateReview);

export default router;