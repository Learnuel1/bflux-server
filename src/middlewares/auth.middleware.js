const { config } = require("../config");
const { APIError } = require("./errorApi");
const jwt = require("jsonwebtoken");

exports.userRequired = (req, res, next) => {
  try {
    let token = req.cookie?.bflux;
    if(!token) token = req.headers?.authorization?.split(" ")[1];
    if(!token) token = req.headers?.cookie?.split("=")[1];
    if(!token) token = req.body?.token;
    if(!token) return next(APIError.unauthenticated());
    const payload = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
    req.userId = payload.id;
    req.uerEmail = payload.email;
    req.userRole = payload.role;
next();
  } catch (error) {
    next(error);
  }
}
exports.adminRequired = (req, res, next) => {
  try {
    let token = req.cookie?.bflux;
    if(!token) token = req.headers?.authorization?.split(" ")[1];
    if(!token) token = req.headers?.cookie?.split("=")[1];
    if(!token) token = req.body?.token;
    if(!token) return next(APIError.unauthenticated());
    const payload = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
   if(payload.role !== "admin") return next(APIError.unauthorized);
   req.userId = payload.id;
   req.uerEmail = payload.email;
   req.userRole = payload.role;
    next();
  } catch (error) {
    next(error);
  }
}