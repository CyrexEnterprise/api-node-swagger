#!/usr/bin/env node
'use strict';
const debug = require('debug')('app:start');
debug('run');
const _ = require('lodash');

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

const config = require('config');

const app = require('../src/express-server')();
const api = require('../src/api')(app, 'api');

let appServer;
let logger;

debug('environment', _.pick(process.env,
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

api.config(config.get('api')).then(resolved => {
  debug('config api');
  logger = resolved.logger;
  const swaggerSpec = resolved.swaggerSpec;

  debug('logger resolved', !!logger);
  debug('swaggerSpec resolved', !!swaggerSpec);

  // if you need to setup routes (dependency injection)
  // you should do that here

  // pipe then after routes ready
  const pipes = api.pipe();
  debug('api pipes', pipes);

  // Mount router to mountPath
  const mountPath = config.get('api.mountPath');
  debug('mount api to ' + mountPath);
  app.use(mountPath, api.router);

  // start server when ready
  return app.start(config.get('server'));
}).then(server => {
  appServer = server;
  logger.info('app start');
  debug('start server on port: ' + config.get('server.port'));
}).catch(err => {
  debug('error', err);
  if (appServer) {
    appServer.close(() => {
      logger.promise.error('server stop on error', err).then(() => {
        debug('server stop');
      });
    });
  } else {
    if (logger) {
      return logger.promise.error('app error', err).then(() => {
        debug('stop');
        throw err;
      });
    }

    throw err;
  }
});

const gracefulShutdown = msg => {
  if (msg === 'shutdown' || msg === 'SIGINT') {
    if (msg === 'shutdown') {
      process.removeListener('message', gracefulShutdown);
    }
    if (appServer) {
      appServer.close(() => {
        logger.promise.info('server stop on message: ' + msg).then(() => {
          debug('server stop');
        });
      });
    } else {
      logger.promise.info('stop on message: ' + msg).then(() => {
        debug('stop');
      });
    }
  } else {
    logger.warn('unexpected process msg', msg);
  }
};

process.once('SIGINT', gracefulShutdown.bind(null, 'SIGINT'));
process.on('message', gracefulShutdown);

module.exports = app;
