import { Router } from "express";
import { controller } from "../controller/reviewcontroller.js";
const reviewRoutes = Router()

reviewRoutes.post('/addreview', controller.addReview)
reviewRoutes.get('/:id', controller.allReviewList)


export default reviewRoutes