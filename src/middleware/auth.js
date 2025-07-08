"use strict";
import jwt from "jsonwebtoken";
import userModel from "../../db/models/user.model.js";

export const auth = (roles = []) => {
  return async (req, res, next) => {
    const { token } = req.headers;
    if (!token) {
      return res.status(401).json("token not found");
    }
    if (!token.startsWith("ymym__")) {
      return res.status(401).json("token invalid");
    }
    const newToken = token.split("ymym__")[1];
    if (!newToken) {
      return res.status(401).json("newToken invalid");
    }
    const decoded = jwt.verify(newToken, process.env.signatuer);
    if (!decoded?.id) {
      return res.status(401).json("token is valid");
    }
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json("user not exist");
    }
    if (roles.length && !roles.includes(user.role)) {
      return res.status(401).json("user not permation");
    }
    req.user = user;
    next();
  };
};

export const authOptional = (roles = []) => {
  return async (req, res, next) => {
    const { token } = req.headers;
    if (!token) {
      return next();
    }
    if (!token.startsWith("ymym__")) {
      return res.status(401).json("token invalid");
    }
    const newToken = token.split("ymym__")[1];
    if (!newToken) {
      return res.status(401).json("newToken invalid");
    }
    const decoded = jwt.verify(newToken, process.env.signatuer);
    if (!decoded?.id) {
      return res.status(401).json("token is valid");
    }
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json("user not exist");
    }
    if (!roles.includes(user.role)) {
      return res.status(401).json("user not permation");
    }
    req.user = user;
    next();
  };
};
