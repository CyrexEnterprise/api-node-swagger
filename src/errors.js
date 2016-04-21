'use strict';
const debug = require('debug')('app:errors');
const errors = {};

errors.badRequest = msg => {
  const err = new Error(msg || 'Bad request');
  err.code = 'BAD_REQUEST';
  err.status = 400;
  return err;
};

errors.notFound = () => {
  const err = new Error('Not found');
  err.code = 'NOT_FOUND';
  err.status = 404;
  return err;
};

errors.unauthorized = () => {
  const err = new Error('Token invalid or missing');
  err.code = 'UNAUTHORIZED';
  err.status = 401;
  return err;
};

/* eslint-disable no-unused-vars */
errors.handler = logger => (err, req, res, next) => {
  /* eslint-enable no-unused-vars */
  let errs = [];
  debug('code', err.code);
  debug('msg', err.message);
  debug('status', err.status);
  if (err.failedValidation && err.results && err.results.errors) {
    res.status(400);
    errs = errs.concat(err.results.errors)
      .map(e => ({code: e.code, message: e.message}));
  } else {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(err.status || 500);
    }

    if (!err.code) {
      if (err.message.indexOf('Invalid content type') === 0) {
        err.code = 'INVALID_CONTENT_TYPE';
        res.status(406);
      } else {
        err.code = 'UNEXPECTED_ERROR';
      }
    }

    errs.push({
      message: err.message,
      code: err.code
    });
  }
  debug('errors', errors);
  res.json({
    errors: errs
  });
};

errors.catchUnhandled = () => (req, res, next) => {
  next(errors.notFound());
};

module.exports = errors;
