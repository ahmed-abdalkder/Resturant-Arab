"use strict";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve("config/.env") });
import express from "express";
import connectiondb from "./db/connectionDB.js";
import cors from "cors";
import categoryrouter from "./src/modules/Categories/category.routes.js";
import foodRouter from "./src/modules/foods/food.routes.js";
import userRouter from "./src/modules/users/user.routes.js";
import branchrouter from "./src/modules/branches/branch.routes.js";
import cartrouter from "./src/modules/carts/cart.routes.js";
import tabelrouter from "./src/modules/tabels/table.routes.js";
import Reservationrouter from "./src/modules/reservations/Reservation.routes.js";
import reviewrouter from "./src/modules/reviews/review.routes.js";
import orderrouter from "./src/modules/orders/order.routes.js";
import { globleHandler } from "./src/utils/asyncHandeler.js";
import passport from "passport";
import session from "express-session";
import "./src/middleware/googleAuth.js";
import { webkook } from "./src/modules/orders/order.controler.js";
 
import { apiLimiter } from "./src/middleware/rateLimiter.js";
import securityHeaders from "./src/middleware/securityHeaders.js";

const app = express();
const port = 5000;
app.post("/orders/webhook", express.raw({ type: "application/json" }), webkook);

app.use(express.json());
app.use(cors());
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
connectiondb();

app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const { token } = req.user;
    res.redirect(`https://restaurant-yummy-yum.vercel.app/auth?token=${token}`);
  },
);


 
 

app.use('/api', apiLimiter);
app.use(securityHeaders);

app.use(express.urlencoded({ extended: true }));

app.use("/categories", categoryrouter);
app.use("/foods", foodRouter);
app.use("/users", userRouter);
app.use("/branches", branchrouter);
app.use("/carts", cartrouter);
app.use("/tabels", tabelrouter);
app.use("/reservations", Reservationrouter);
app.use("/reviews", reviewrouter);
app.use("/orders", orderrouter);

app.get("/", (req, res, next) => {
  res.json("Hello World!");
 
});

 app.use(globleHandler);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
