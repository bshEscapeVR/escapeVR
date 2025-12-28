// middleware/errorMiddleware.js
const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // בסביבת פיתוח נרצה לראות את כל הפרטים
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // בסביבת ייצור (Production) נסתיר פרטים טכניים מהלקוח
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // שגיאה לא צפויה (באג בקוד)
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong on our side.',
      });
    }
  }
};

module.exports = errorMiddleware;