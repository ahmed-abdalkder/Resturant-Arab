 "use strict";
import reviewModel from "../../../db/models/review.model.js";
import { asyncHandeler } from "../../utils/asyncHandeler.js";
import { AppError } from "../../utils/classAppError.js";

export const createReview = asyncHandeler(async (req, res, next) => {
  const { comment, rate } = req.body;

  const exists = await reviewModel.findOne({ createdBy: req.user._id });
  if (exists) return next(new AppError("You already added a review"));

  const review = await reviewModel.create({
    comment,
    rate,
    createdBy: req.user._id,
  });

  const result = await reviewModel.aggregate([
    {
      $group: {
        _id: null,
        averageRate: { $avg: "$rate" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);
  const averageRate = result.length ? result[0].averageRate.toFixed(1) : 0;
  const totalReviews = result.length ? result[0].totalReviews : 0;

  res.status(201).json({
    msg: "Review",
    review,
    averageRate,
    totalReviews,
  });
});

export const deleteReview = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;
  const deletedReview = await reviewModel.findOneAndDelete({
    _id: id,
    createdBy: req.user._id,
  });

  if (!deletedReview) {
    return next(new AppError("Review not found"));
  }

  const result = await reviewModel.aggregate([
    {
      $group: {
        _id: null,
        averageRate: { $avg: "$rate" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const averageRate = result.length ? result[0].averageRate.toFixed(1) : "0.00";
  const totalReviews = result.length ? result[0].totalReviews : 0;

  res.status(200).json({
    message: "Review",
    deletedReview,
    averageRate,
    totalReviews,
  });
});

export const getReviews = asyncHandeler(async (req, res, next) => {
  const reviews = await reviewModel
    .find()
    .populate({ path: "createdBy", select: "name picture -_id" });

  const result = await reviewModel.aggregate([
    {
      $group: {
        _id: null,
        averageRate: { $avg: "$rate" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const averageRate = result.length ? result[0].averageRate.toFixed(1) : "0.00";
  const totalReviews = result.length ? result[0].totalReviews : 0;

  res.status(200).json({
    msg: "reviews",
    reviews,
    averageRate,
    totalReviews,
  });
});

export const getReview = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;
  const review = await reviewModel
    .findById({ _id: id, createdBy: req.user._id })
    .populate({ path: "createdBy", select: "name picture -_id" });

  if (!review) {
    return next(new AppError("Review not found"));
  }
  res.status(200).json({
    msg: "Review",
    review,
  });
});

export const updateReview = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;
  const { comment, rate } = req.body;

  const review = await reviewModel.findOne({
    _id: id,
    createdBy: req.user._id,
  });

  if (!review) {
    return next(new AppError("Review not found or not authorized"));
  }

  if (comment) review.comment = comment;
  if (rate !== undefined) review.rate = rate;

  await review.save();

  const stats = await reviewModel.aggregate([
    {
      $group: {
        _id: null,
        averageRate: { $avg: "$rate" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const averageRate = stats.length ? stats[0].averageRate.toFixed(1) : 0;
  const totalReviews = stats.length ? stats[0].totalReviews : 0;

  res.status(200).json({
    msg: "Review",
    review,
    averageRate,
    totalReviews,
  });
});
