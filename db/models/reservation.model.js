"use strict";
import mongoose, { Types } from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    peopleCount: {
      type: Number,
      required: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    reservationDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      default: 120,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "pending", "canceled", "complete"],
      default: "pending",
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    branchId: {
      type: Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    userId: {
      type: Types.ObjectId,
      ref: "user",
      required: true,
    },
    timezone: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
const reservationModel = mongoose.model("Reservation", reservationSchema);
export default reservationModel;
