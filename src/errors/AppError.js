class AppError extends Error {
  constructor(message, httpStatus) {
    super(message);
    this.httpStatus = httpStatus || undefined;
  };
}

module.exports = AppError;