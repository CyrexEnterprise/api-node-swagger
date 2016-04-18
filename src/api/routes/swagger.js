'use strict';

const debug = require('debug')('api:swagger');
const _ = require('lodash');
const errors = require('../../errors');

const router = require('express').Router();

router.endpoint = '*';

router.fields = ['method', 'token'];

let logger;
let caller;

router.setup = config => {
  debug('setup');
  logger = config.logger;
  caller = config.caller;
};

const parseSwagger = swagger => ({
  apiPath: swagger.apiPath,
  operationId: swagger.operation.operationId,
  basePath: swagger.swaggerObject.basepath,
  security: swagger.security,
  params: _.mapValues(
    _.pick(swagger.params, (value, key) => key !== 'body' ),
    o => o.value)
});

// TODO: when message sent to MQ version it!

router.all('/', (req, res, next) => {
  if (!req.swagger || !req.swagger.path[req.method.toLowerCase()]) {
    debug('ignore');
    return next();
  }

  if (req.swagger.security.length && !req.token) {
    debug('token check failed');
    return next(errors.unauthorized());
  }

  const payload = _.pick(req, router.fields);

  // debug(require('util').inspect(req.swagger, {depth: 5}));
  _.merge(payload, parseSwagger(req.swagger));

  if (req.swagger.params.body) {
    payload.body = _.pick(req.body,
      Object.keys(req.swagger.params.body.schema.schema.properties)
    );
  }

  caller.call(payload).then(response => {
    logger.info('process done', response.id);
    debug('status', response.statusCode);
    debug('response', response && response.body ? response.body : response);

    if (!response) {
      throw errors.process('no response');
    }

    if (response.statusCode === 204) {
      return res.status(response.statusCode).end();
    } else if (!response.statusCode) {
      throw errors.process('no statusCode');
    }

    res.status(response.statusCode);

    if (response.headers) {
      Object.keys(response.headers).forEach(h =>
        res.setHeader(h, response.headers[h]));
    }

    if (response.body) {
      return res.json(response.body);
    }

    throw errors.process('unexpected response');
  }).catch(next);
});

module.exports = router;
