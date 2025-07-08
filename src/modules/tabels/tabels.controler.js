 "use strict";
import reservationModel from "../../../db/models/reservation.model.js";
import tableModel from "../../../db/models/table.model.js";
import { asyncHandeler } from "../../utils/asyncHandeler.js";
import { AppError } from "../../utils/classAppError.js";

export const createTable = asyncHandeler(async (req, res, next) => {
  const { number, capacity, branchId } = req.body;

  const exist = await tableModel.findOne({ number, branchId });
  if (exist) {
    return next(new AppError("Table already exists with this number"));
  }

  const table = new tableModel({ number, capacity, branchId });
  await table.save();

  return res.status(201).json({ msg: "Table", table });
});

export const getTables = asyncHandeler(async (req, res) => {
  const tables = await tableModel.find().populate({
    path: "branchId",
    select: "name",
  });

  res.status(200).json({ msg: "All tables", tables });
});

export const updateTable = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;
  const { number, capacity, branchId } = req.body;

  const table = await tableModel.findById(id);
  if (!table) {
    return next(new AppError("Table not found"));
  }

  const existingReservation = await reservationModel.findOne({ tableId: id });
  if (existingReservation) {
    return next(new AppError("Cannot update: Table has active reservations"));
  }
  table.number = number || table.number;
  table.capacity = capacity || table.capacity;
  table.branchId = branchId || table.branchId;

  await table.save();

  res.status(200).json({ msg: "Table", table });
});

export const deleteTable = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;

  const existingReservation = await reservationModel.findOne({ tableId: id });
  if (existingReservation) {
    return next(new AppError("Cannot delete: Table has active reservations"));
  }

  const table = await tableModel.findByIdAndDelete(id);
  if (!table) {
    return next(new AppError("Table not found"));
  }

  res.status(200).json({ msg: "Table", table });
});
