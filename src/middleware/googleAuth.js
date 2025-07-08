"use strict";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve("config/.env") });
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import userModel from "../../db/models/user.model.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL:  "https://yumyum-server-six.vercel.app/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await userModel.findOne({ email });

        if (!user) {
          user = await userModel.create({
            name: profile.displayName,
            email,
            googleId: profile.id,
            picture: profile.photos[0].value,
            confirmed: true,
            loggedIn: true,
            role: "user",
          });
        }
        const token = jwt.sign(
          { id: user._id, role: user.role },
          process.env.signatuer,
        );

        return done(null, { user, token });
      } catch (err) {
        return done(err, false);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});
