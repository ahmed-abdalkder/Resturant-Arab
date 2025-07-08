 "use strict";
import jwt from "jsonwebtoken";
import userModel from "../../../db/models/user.model.js";
import bcrypt from "bcrypt";
import { customAlphabet } from "nanoid";
import { sendEmail } from "../../service/sendemail.js";
import { asyncHandeler } from "../../utils/asyncHandeler.js";
import { AppError } from "../../utils/classAppError.js";

export const signupadmin = asyncHandeler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const userExist = await userModel.findOne({ email });
  if (userExist) {
    return next(new AppError("user allredy exist"));
  }
  const hash = bcrypt.hashSync(password, 10);

  const token = jwt.sign({ email }, "yummy");
  const link = `${req.protocol}://${req.headers.host}/users/confirm/${token}`;
  await sendEmail(
    email,
    "Email Confirmation",
    `
     <h1>Confirm your email</h1>
      <p>Please click the link below to confirm your account:</p>
     <a href="${link}" target="_blank" rel="noopener noreferrer">Click here to confirm</a>`,
  );
  if (req.user && req.user._id) {
    if (req.user.role !== "superadmin") {
      return next(
        new AppError("Only superadmin can create admin or superadmin"),
      );
    }
    const admin = await userModel.create({
      name,
      email,
      password: hash,
      role: "admin",
    });
    return res.status(201).json({ msg: "admin", admin });
  } else {
    const newUser = await userModel.create({
      name,
      email,
      password: hash,
      role: "user",
    });

    return res.status(201).json({ message: "User ", newUser });
  }
});

export const confirm = asyncHandeler(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(new AppError("token not found "));
  }
  const decoded = jwt.verify(token, process.env.signatuer);
  if (!decoded) {
    return next(new AppError("invalid token"));
  }
  const admin = await userModel.findOneAndUpdate(
    { email: decoded.email, confirmed: false },
    { confirmed: true },
  );
  return res.redirect("http://localhost:5173/");
});

export const signinadmin = asyncHandeler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email, confirmed: true });

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return next(new AppError("invalid password or email"));
  }
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.signatuer,
  );
  await userModel.updateOne({ email }, { loggedIn: true });
  return res.status(201).json({ msg: "token", token, role: user.role });
});

export const forgetpassword = asyncHandeler(async (req, res, next) => {
  const { email } = req.body;
  const admin = await userModel.findOne({ email });
  if (!admin) {
    return next(new AppError("admin not found"));
  }
  const code = customAlphabet("0123456789", 5);
  const newCode = code();
  await sendEmail(email, "Code", `<h1>your code is ${newCode}</h1>`);
  const user = await userModel.updateOne({ email }, { code: newCode });
  return res.status(201).json("done");
});

export const resetPassword = asyncHandeler(async (req, res, next) => {
  const { email, password, code } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new AppError("user not found"));
  }
  if (code !== user.code) {
    return next(new AppError("invalid code"));
  }
  const hash = bcrypt.hashSync(password, 10);
  const admin = await userModel.updateOne(
    { email },
    { password: hash, code: "" },
  );
  return res.status(201).json("done");
});

export const updateUser = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;
  const { name, email } = req.body;

  const user = await userModel.findById(id);
  if (!user) {
    return next(new AppError("User not found"));
  }

  user.name = name || user.name;
  user.email = email || user.email;

  await user.save();

  res.status(200).json({ msg: "User", user });
});

export const deleteUser = asyncHandeler(async (req, res, next) => {
  const { id } = req.params;

  const user = await userModel.findByIdAndDelete(id);
  if (!user || user.role === "superadmin") {
    return next(new AppError("User not found"));
  }

  res.status(200).json({ msg: "User", user });
});

export const getUsers = asyncHandeler(async (req, res,next) => {
  const users = await userModel.find({}).select("-password");
  if (!users) {
    return next(new AppError("User not found"));
  }
  res.status(200).json({ msg: "users", users });
});
