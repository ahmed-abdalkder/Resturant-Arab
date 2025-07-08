 "use strict";
import { Router } from "express";
import * as RC from "./review.controler.js";
import { auth } from "../../middleware/auth.js";
import { systemroles } from "../../utils/systemroles.js";

const router = Router();

router.post("/", auth([systemroles.user]), RC.createReview);
router.delete("/delete/:id", auth([systemroles.user]), RC.deleteReview);
router.get("/Review/:id", RC.getReview);
router.get("/Reviews", RC.getReviews);
router.put("/update/:id", auth([systemroles.user]), RC.updateReview);

export default router;
