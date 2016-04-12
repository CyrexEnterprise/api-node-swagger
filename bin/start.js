#!/usr/bin/env node
'use strict';

const debug = require('debug')('app:start');
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
debug('run');

const _ = require('lodash');
const config = require('config');
const Promise = require('bluebird');
const cors = require('cors');

const app = require('../src/express-server')();
const apiBuilder = require('../src/api');
const api = apiBuilder(app, 'api');
const errors = require('../src/api/errors');

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

if (config.get('server.cors')) {
  app.use(cors(_.cloneDeep(config.server.cors)));
}

api.config(config.get('api')).then(resolved => {
  debug('config api');
  logger = resolved.logger;
  const swaggerSpec = resolved.swaggerSpec;

  debug('logger resolved', !!logger);
  debug('swaggerSpec resolved', !!swaggerSpec);

  const version = config.get('version');

  debug('app version: ', version);
  app.use('/version', (req, res) => {
    res.json(version);
  });

  // if you need to setup routes (dependency injection)
  // you should do that here

  // pipe then after routes ready
  const pipes = api.pipe();
  debug('api pipes', pipes);

  // Mount router to mountPath
  const mountPath = config.get('api.mountPath');
  debug('mount api to ' + mountPath);
  app.use(mountPath, api.router);

  app.deferMount(errors.catchUnhandled());
  app.deferMount(errors.handler(logger));

  // start server when ready
  return app.start(config.get('server'));
}).then(server => {
  appServer = server;
  logger.info('app start');
  debug('start server on port: ' + config.get('server.port'));
}).catch(err => {
  debug('error', err);
  Promise.resolve()
    .then(() => appServer ?
      new Promise((resolve, reject) =>
        appServer.close(error => error ? reject(error) : resolve())
      ) : null
    ).catch(error => {
      if (!~error.message.indexOf('Not running')) {
        return logger.promise.warn('server', error);
      }
    })
    .then(() => logger ?
      logger.promise.error('servers stopped on error: ' + err) : null)
    .then(() => debug('server stop'))
    .catch(error => logger.promise.error('stopping error', error)
      .then(() => debug('stop')
    ));
});

let SIGINTListener;

const gracefulShutdown = msg => {
  if (msg === 'shutdown' || msg === 'SIGINT') {
    process.removeListener('message', gracefulShutdown);
    if (msg !== 'SIGINT') {
      process.removeListener('SIGINT', SIGINTListener);
    }
    Promise.resolve()
      .then(() => appServer ?
        new Promise((resolve, reject) =>
          appServer.close(err => err ? reject(err) : resolve())
        ) : null
      ).catch(err => {
        if (!~err.message.indexOf('Not running')) {
          return logger.promise.warn('server', err);
        }
      }).then(() => logger.promise.info('servers stopped on message: ' + msg))
      .then(() => debug('server stop'))
      .catch(err => logger.promise.error('shutdown error', err)
        .then(() => {
          throw err;
        }));
  } else {
    logger.warn('unexpected process msg', msg);
  }
};

SIGINTListener = gracefulShutdown.bind(null, 'SIGINT');

process.once('SIGINT', SIGINTListener);
process.on('message', gracefulShutdown);

module.exports = app;
