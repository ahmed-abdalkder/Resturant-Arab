"use strict";
import mongoose from "mongoose";

const connectiondb = () => {
  mongoose
    .connect(process.env.DB_url)
    .then(() => {
      console.log("connection mongo");
    })
    .catch((err) => {
      console.log(err);
    });
};
export default connectiondb;
