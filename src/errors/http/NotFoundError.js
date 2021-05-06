import AppError from './../AppError';

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}


module.exports = NotFoundError;