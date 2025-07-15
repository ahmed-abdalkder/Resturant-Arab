 "use strict";
import reservationModel from "../../../db/models/reservation.model.js";
import tableModel from "../../../db/models/table.model.js";
import { asyncHandeler } from "../../utils/asyncHandeler.js";
import { AppError } from "../../utils/classAppError.js";

function toArabicNumbers(input) {
  if (input === undefined || input === null) return "٠";  
  return input.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

function toEnglishNumbers(str) {
  return str
    .toString()
    .replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

// export const createTable = asyncHandeler(async (req, res, next) => {
//   const { number, capacity, branchId } = req.body;

//   const exist = await tableModel.findOne({ number, branchId });
//   if (exist) {
//     return next(new AppError("Table already exists with this number"));
//   }

//   const table = new tableModel({ number, capacity, branchId });
//   await table.save();

//   return res.status(201).json({ msg: "Table", table });
// });

export const createTable = asyncHandeler(async (req, res, next) => {
  const { number, capacity, branchId } = req.body;

  
  const parsedNumber = Number(toEnglishNumbers(number));
  const parsedCapacity = Number(toEnglishNumbers(capacity));

  if (isNaN(parsedNumber) || isNaN(parsedCapacity)) {
    return next(new AppError("Number and capacity must be valid numbers"));
  }

  const exist = await tableModel.findOne({ number: parsedNumber, branchId });
  if (exist) {
    return next(new AppError("Table already exists with this number"));
  }

  const table = new tableModel({
    number: parsedNumber,
    capacity: parsedCapacity,
    branchId
  });

  await table.save();

  
  const arabicTable = {
    ...table.toObject(),
    number: toArabicNumbers(table.number),
    capacity: toArabicNumbers(table.capacity),
  };

  return res.status(201).json({
    msg: "تم إنشاء الطاولة بنجاح",
    table: arabicTable
  });
});

export const getTables = asyncHandeler(async (req, res) => {
  const tables = await tableModel.find().populate({
    path: "branchId",
    select: "name",
  });

  res.status(200).json({ msg: "All tables", tables });
});

// export const updateTable = asyncHandeler(async (req, res, next) => {
//   const { id } = req.params;
//   const { number, capacity, branchId } = req.body;

//   const table = await tableModel.findById(id);
//   if (!table) {
//     return next(new AppError("Table not found"));
//   }

//   const existingReservation = await reservationModel.findOne({ tableId: id });
//   if (existingReservation) {
//     return next(new AppError("Cannot update: Table has active reservations"));
//   }
//   table.number = number || table.number;
//   table.capacity = capacity || table.capacity;
//   table.branchId = branchId || table.branchId;

//   await table.save();

//   res.status(200).json({ msg: "Table", table });
// });

export const updateTable = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;
  let { number, capacity, branchId } = req.body;

  const table = await tableModel.findById(id);
  if (!table) {
    return next(new AppError("Table not found"));
  }

  const existingReservation = await reservationModel.findOne({ tableId: id });
  if (existingReservation) {
    return next(new AppError("Cannot update: Table has active reservations"));
  }

  // تحويل الأرقام من عربية إلى إنجليزية
  if (number !== undefined) {
    const parsedNumber = Number(toEnglishNumbers(number));
    if (isNaN(parsedNumber)) {
      return next(new AppError("Number must be a valid number"));
    }
    table.number = parsedNumber;
  }

  if (capacity !== undefined) {
    const parsedCapacity = Number(toEnglishNumbers(capacity));
    if (isNaN(parsedCapacity)) {
      return next(new AppError("Capacity must be a valid number"));
    }
    table.capacity = parsedCapacity;
  }

  if (branchId !== undefined) {
    table.branchId = branchId;
  }

  await table.save();

  // تجهيز البيانات بالأرقام العربية للعرض
  const arabicTable = {
    ...table.toObject(),
    number: toArabicNumbers(table.number),
    capacity: toArabicNumbers(table.capacity),
  };

  res.status(200).json({ msg: "تم تعديل الطاولة بنجاح", table: arabicTable });
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
