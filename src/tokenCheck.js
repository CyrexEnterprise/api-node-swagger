'use strict';
const debug = require('debug')('app:token');
const errors = require('./errors');

module.exports = strict => (req, res, next) => {
  debug('token check');
  let token;
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2) {
      const scheme = parts[0];
      const credentials = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        token = credentials;
      }
    } else {
      return next(errors.badRequest('Malformed authorization header'));
    }
  }

  if (!strict) {
    if (req.query.api_key) {
      if (token) {
        return next(errors.badRequest('Multiple tokens'));
      }
      token = req.query.api_key;
    }

    if (req.query.access_token) {
      if (token) {
        return next(errors.badRequest('Multiple tokens'));
      }
      token = req.query.access_token;
    }
  }

  debug('got token', !!token);

  req.token = token;
  next();
};
