"use strict";
import multer from "multer";
import { nanoid } from "nanoid";
import path from "path";
const uploads = path.resolve("uploads");
export const dataValidation = {
  image: ["image/JFIF", "image/jpeg", "image/jpg", "image/webp"],
  pdf: ["application/pdf"],
  video: ["video/mp4"],
};

export const localMulter = (customvalidation) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploads);
    },
    filename: function (req, file, cb) {
      cb(null, nanoid(5) + file.originalname);
    },
  });
  const fileFilter = function (req, file, cb) {
    if (customvalidation.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error("I do not have a clue!"));
  };
  const upload = multer({ storage, fileFilter });
  return upload;
};

export const globalMulter = () => {
  const storage = multer.diskStorage({});

  const upload = multer({ storage });

  return upload;
};
