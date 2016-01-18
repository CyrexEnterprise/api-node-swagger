#!/usr/bin/env node
'use strict';
const debug = require('debug')('app:start');
debug('run');
const http = require('http');
const _ = require('lodash');
const config = require('config');
const express = require('express');
const app = express();
const hello = require('../src/hello');
const log = require('../src/log');
const swagger = require('../src/swagger');

debug('enviroment', _.pick(process.env,
  'NODE_ENV',
  'NODE_DEBUG',
  'cwd',
  // https://github.com/lorenwest/node-config/wiki/Environment-Variables
  'NODE_APP_INSTANCE',
  'NODE_CONFIG',
  'NODE_CONFIG_DIR',
  'NODE_CONFIG_STRICT_MODE',
  'SUPPRESS_NO_CONFIG_WARNING',
  'ALLOW_CONFIG_MUTATIONS',
  'HOST',
  'HOSTNAME',
  // custom enviroment variables
  'PORT'
));
debug('configuration', config);

const logger = log.createLogger(config.get('logger'));
debug('logger created');

app.use(logger.middleware());

// TODO: express app configuration

const swaggerSpec = swagger.fromJSDoc(config.get('swagger'));

const swaggerMount = swagger.middleware(swaggerSpec).then(swaggerMiddleware => {
  debug('swagger middlerware metadata mount');
  app.use(swaggerMiddleware.swaggerMetadata());
  debug('swagger middlerware validator mount');
  app.use(swaggerMiddleware.swaggerValidator(config.get('swagger.validator')));
  debug('swagger middlerware ui mount');
  app.use(swaggerMiddleware.swaggerUi(config.get('swagger.ui')));
});

swaggerMount.catch(err => logger.error(err));

swaggerMount.then(() => {
  // hello mounted to app
  hello.mount(app);
  debug('hello mounted');

  app.use('/error', () => {
    throw new Error('test error');
  });

  debug('logger.middlewareError');
  app.use(logger.middlewareError());

  /* eslint-disable no-unused-vars */
  app.use((err, req, res, next) => {
    /* eslint-enable no-unused-vars */
    res.status(err.status || 500);
    res.json({
      message: err.message
    });
  });

  debug('create server');
  http.createServer(app).listen(config.get('server.port'), () => {
    logger.info('server started');
  });
});
