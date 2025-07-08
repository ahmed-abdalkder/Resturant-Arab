"use strict";
export const asyncHandeler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => {
      next(err);
    });
  };
};

export const globleHandler = (err, req, res, next) => {
  res.status(err.statusCode || 500).json( err.message );

  next();
};
 