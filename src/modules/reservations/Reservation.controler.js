 "use strict";
import reservationModel from "../../../db/models/reservation.model.js";
import tableModel from "../../../db/models/table.model.js";
import { sendEmail } from "../../service/sendemail.js";
import jwt from "jsonwebtoken";
import { asyncHandeler } from "../../utils/asyncHandeler.js";
import { AppError } from "../../utils/classAppError.js";
import { DateTime } from "luxon";

export const createReservation = asyncHandeler(async (req, res, next) => {
  
  const {
    customerName,
    phoneNumber,
    peopleCount,
    reservationDate,
    duration,
    email,
    branchId,
    timezone,
  } = req.body;

  if (!timezone) {
    return next(new AppError("Timezone is required."));
  }

  const finalDuration = duration || 120;

  const startTimeLuxon = DateTime.fromISO(reservationDate, { zone: timezone });
  const endTimeLuxon = startTimeLuxon.plus({ minutes: finalDuration });

  const startTimeUTC = startTimeLuxon.toUTC().toJSDate();
  const endTimeUTC = endTimeLuxon.toUTC().toJSDate();

  const nowLuxon = DateTime.now().setZone(timezone);
  const minAllowed = nowLuxon.plus({ hours: 2 });

  if (startTimeLuxon < minAllowed) {
    return res.status(400).json({
      message: "Reservations must be at least 2 hours in advance.",
      currentTime: nowLuxon.toFormat("yyyy-MM-dd HH:mm"),
      mustBeAfter: minAllowed.toFormat("yyyy-MM-dd HH:mm"),
    });
  }

  const tables = await tableModel
    .find({ capacity: { $gte: peopleCount }, branchId })
    .sort({ capacity: 1 });

  let availableTable = null;
  let nearestEnd = null;

  for (let table of tables) {
    const conflict = await reservationModel.findOne({
      tableId: table._id,
      status: "active",
      reservationDate: { $lt: endTimeUTC },
      endTime: { $gt: startTimeUTC },
    });

    if (!conflict) {
      availableTable = table;
      break;
    } else {
      if (!nearestEnd || conflict.endTime < nearestEnd) {
        nearestEnd = conflict.endTime;
      }
    }
  }

  if (availableTable) {
    const reservation = await reservationModel.create({
      customerName,
      phoneNumber,
      email,
      peopleCount,
      tableId: availableTable._id,
      reservationDate: startTimeUTC,
      endTime: endTimeUTC,
      duration: finalDuration,
      status: "pending",
      branchId,
      timezone,
      userId: req.user._id,
    });

    const token = jwt.sign({ reservationId: reservation._id }, "yummy", {
       
    });
    const link = `${req.protocol}://${req.headers.host}/reservations/confirm/${token}`;

    const localTimeStr = startTimeLuxon.toFormat("yyyy-MM-dd HH:mm");

    await sendEmail(
      email,
      "Confirm Your Reservation",
      `<p>Hello ${customerName},</p>
      <p>You requested a reservation on <strong>${localTimeStr}</strong> for ${finalDuration / 60} hours.</p>
      <p>Please confirm your reservation:</p>
      <a href="${link}">Confirm Reservation</a>`,
    );

    setTimeout(
      async () => {
        const stillPending = await reservationModel.findById(reservation._id);
        if (stillPending?.status === "pending") {
          await sendEmail(
            email,
            "Reminder: Confirm Your Reservation",
            `<p>Don't forget to confirm your reservation:</p>
          <a href="${link}">Confirm Now</a>`,
          );
        }
      },
      30 * 60 * 1000,
    );

    setTimeout(
      async () => {
        const stillPending = await reservationModel.findById(reservation._id);
        if (stillPending?.status === "pending") {
          stillPending.status = "canceled";
          await stillPending.save();
          await sendEmail(
            email,
            "Reservation Canceled",
            `<p>Your reservation was canceled due to no confirmation in time.</p>`,
          );
        }
      },
      40 * 60 * 1000,
    );

    return res.status(201).json({
      message: "Reservation created. Confirmation email sent.",
      reservation: {
        ...reservation.toObject(),
        reservationDate: startTimeLuxon.toFormat("yyyy-MM-dd HH:mm"),
        endTime: endTimeLuxon.toFormat("yyyy-MM-dd HH:mm"),
        timezone,
      },
    });
  } else {
    const nextAvailableLocal = nearestEnd? DateTime.fromJSDate(nearestEnd).setZone(timezone).toFormat("yyyy-MM-dd HH:mm"): null;

    return res.status(409).json({
      message: "No table available at this time.",
      nextAvailableAt: nextAvailableLocal,
    });
  }
});

export const confirm = asyncHandeler(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(new AppError("token not found "));
  }
  const decoded = jwt.verify(token, "yummy");
  if (!decoded) {
    return next(new AppError("invalid token"));
  }
  await reservationModel.findOneAndUpdate(
    { _id: decoded.reservationId, status: "pending" },
    { status: "active" },
    { new: true },
  );
  return res.redirect("https://restaurant-yummy-yum.vercel.app/allReservations");
});

export const cancelReservation = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;

  const reservation = await reservationModel.findById(id);

  if (!reservation) {
    return next(new AppError("Reservation not found"));
  }

  reservation.status = "canceled";
  reservation.canceledBy = "manual";
  reservation.canceledAt = new Date();
  await reservation.save();

  await sendEmail(
    reservation.email,
    "Reservation Canceled",

    `<p>Hello ${reservation.customerName},</p>
    <p>We regret to inform you that your reservation on ${new Date(reservation.reservationDate).toLocaleString()} has been canceled.</p>
    <p>If you have any questions, please contact us.</p>
    <p>Thank you.</p>
  `,
  );
  await tableModel.findByIdAndUpdate(reservation.tableId, { reserved: false });

  return res.status(200).json({ message: "Reservation canceled successfully" });
});

export const updateReservation = asyncHandeler(async (req, res, next) => {
  const { reservationId } = req.params;
  const {
    customerName,
    phoneNumber,
    peopleCount,
    reservationDate,
    duration,
    status,
    email,
  } = req.body;

  const existing = await reservationModel.findById(reservationId);
  if (!existing) return next(new AppError("Reservation not found"));

  const zone = existing.timezone || "UTC";

  let startTimeLuxon;

  if (reservationDate) {
    startTimeLuxon = DateTime.fromISO(reservationDate, { zone });
  } else {
    startTimeLuxon = DateTime.fromJSDate(existing.reservationDate).setZone(
      zone,
    );
  }

  const finalDuration = duration || existing.duration;
  const endTimeLuxon = startTimeLuxon.plus({ minutes: finalDuration });

  const startDate = startTimeLuxon.toUTC().toJSDate();
  const endDate = endTimeLuxon.toUTC().toJSDate();

  const reservedTables = await reservationModel
    .find({
      _id: { $ne: reservationId },
      reservationDate: { $lt: endDate },
      $expr: {
        $gt: [
          { $add: ["$reservationDate", { $multiply: ["$duration", 60000] }] },
          startDate,
        ],
      },
      status: { $ne: "canceled" },
    })
    .distinct("tableId");

  const allTables = await tableModel.find();

  const availableTable = allTables.find(
    (table) =>
      !reservedTables.map((t) => t.toString()).includes(table._id.toString()),
  );

  if (!availableTable) {
    return next(new AppError("No available tables for the new time"));
  }

  const updatedReservation = await reservationModel.findByIdAndUpdate(
    reservationId,
    {
      ...(customerName && { customerName }),
      ...(phoneNumber && { phoneNumber }),
      ...(peopleCount && { peopleCount }),
      ...(status && { status }),
      ...(email && { email }),
      reservationDate: startDate,
      duration: finalDuration,
      endTime: endDate,
      tableId: availableTable._id,
    },
    { new: true },
  );

  res.status(200).json({
    message: "Reservation updated and assigned to a free table",
    reservation: {
      ...updatedReservation.toObject(),
      reservationDate: startTimeLuxon.toFormat("yyyy-MM-dd HH:mm"),
      endTime: endTimeLuxon.toFormat("yyyy-MM-dd HH:mm"),
      timezone: zone,
    },
  });
});

export const getReservation = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;

  const reservation = await reservationModel
    .findOne({ _id: id, userId: req.user._id })
    .populate("tableId")
    .populate("branchId");

  if (!reservation) return next(new AppError("Reservation not found"));

  const timezone = reservation.timezone || "UTC";

  const reservationDateLocal = DateTime.fromJSDate(reservation.reservationDate)
    .setZone(timezone)
    .toFormat("yyyy-MM-dd HH:mm");
  const endTimeLocal = DateTime.fromJSDate(reservation.endTime)
    .setZone(timezone)
    .toFormat("yyyy-MM-dd HH:mm");

  res.status(200).json({
    message: "Reservation details",
    reservation: {
      ...reservation.toObject(),
      reservationDate: reservationDateLocal,
      endTime: endTimeLocal,
      timezone,
    },
  });
});

export const getReservations = asyncHandeler(async (req, res, next) => {
 const reservations = await reservationModel
  .find({ userId: req.user._id })
  .populate("tableId")
  .populate("branchId")
  .sort({ createdAt: -1 });

  const updatedReservations = reservations.map((reservation) => {
    const timezone = reservation.timezone || "UTC";

    const reservationDateLocal = DateTime.fromJSDate(
      reservation.reservationDate,
    )
      .setZone(timezone)
      .toFormat("yyyy-MM-dd HH:mm");

    const endTimeLocal = DateTime.fromJSDate(reservation.endTime)
      .setZone(timezone)
      .toFormat("yyyy-MM-dd HH:mm");

    return {
      ...reservation.toObject(),
      reservationDate: reservationDateLocal,
      endTime: endTimeLocal,
      timezone,
    };
  });

 if (updatedReservations.length === 0) {
  return res.status(200).json({
    message: "No reservations found",
    reservations: [],
  });
}

res.status(200).json({
  message: "Reservations",
  reservations: updatedReservations,
});
})
export const reservationStatus = asyncHandeler(async (req, res, next) => {
  const timezone = req.headers["x-timezone"] || "UTC";

  const nowLocal = DateTime.now().setZone(timezone);

  const nowUTC = nowLocal.toUTC().toJSDate();

  const result = await reservationModel.updateMany(
    { status: "active", endTime: { $lte: nowUTC } },
    { $set: { status: "complete" } },
  );

  res.json({
    message: `${result.modifiedCount} reservations marked as complete.`,
    checkedAt: nowLocal.toFormat("yyyy-MM-dd HH:mm"),
    zone: timezone,
  });
});
