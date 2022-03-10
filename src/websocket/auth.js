import jwt from 'jsonwebtoken';
import config from "../config";
import { logError } from "../utils/log";

const verifyToken = (token) => {
  if (!token) return false;
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (err) {
    logError("Cannot decode websocket token", err)
    return false;
  }
}

export const verifySocketClient = (info, cb) => {
  const token = info.req.headers.token;

  const validationResult = verifyToken(token);
  if (validationResult) {
    info.req.info = validationResult;
    cb(true);
  }
  else cb(false, 401, 'Unauthorized')
};

