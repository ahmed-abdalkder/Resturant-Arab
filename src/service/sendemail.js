"use strict";
import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html, attachments = []) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.email_name,
      pass: process.env.email_key,
    },
  });
  const info = await transporter.sendMail({
    from: process.env.email_name,
    to: to ? to : "",

    subject: subject ? subject : "Hello ✔",

    html: html ? html : "<b>Hello world?</b>",

    attachments,
  });
};
