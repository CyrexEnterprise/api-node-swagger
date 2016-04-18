#!/usr/bin/env node
'use strict';

const debug = require('debug')('app:start');
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
debug('run');

const path = require('path');
const _ = require('lodash');
const config = require('config');
const Promise = require('bluebird');
const cors = require('cors');

const app = require('../src/express-server')();
const apiBuilder = require('../src/api');
const api = apiBuilder(app, 'api');
const superadmin = apiBuilder(app, 'sa');
const oauth2 = apiBuilder(app, 'oauth2');
const tokenCheck = require('../src/tokenCheck');
const errors = require('../src/errors');
const amqp = require('mq-node-amqp');

const exphbs = require('express-handlebars');

let appServer;
let logger;
let caller;

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

const hbs = exphbs.create(config.get('server.views'));

app.engine(config.get('server.views.extname'), hbs.engine);
// set default engine
app.set('view engine', config.get('server.views.extname'));

if (config.has('server.trustProxy')) {
  app.set('trust proxy', config.get('server.trustProxy'));
}
app.set('views', path.resolve(process.cwd(),
  config.get('server.views.path')));


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

  app.use(tokenCheck(config.get('server.strictToken')));

  app.deferMount(errors.catchUnhandled());
  app.deferMount(errors.handler(logger));

  return amqp.createCaller(config.get('caller'));
}).then(amqpCaller => {
  caller = amqpCaller;
  // if you need to setup routes (dependency injection)
  // you should do that here

  api.routes.swagger.setup({
    logger,
    caller
  });

  // pipe then after routes ready
  const pipes = api.pipe();
  debug('api pipes', pipes);

  // Mount router to mountPath
  const mountPath = config.get('api.mountPath');
  debug('mount api to ' + mountPath);
  app.use(mountPath, api.router);

  const cfgSuperadmin = config.get('superadmin');
  if (cfgSuperadmin.logger && !cfgSuperadmin.logger.transports) {
    cfgSuperadmin.logging = logger;
  }
  return superadmin.config(cfgSuperadmin);
}).then(() => {
  debug('config superadmin');

  const saPipes = superadmin.pipe();
  debug('sa pipes', saPipes);

  const mountPath = config.get('superadmin.mountPath');
  debug('mount superadmin to ' + mountPath);
  app.use(mountPath, superadmin.router);
  const cfgOauth2 = config.get('oauth2');
  if (cfgOauth2.logger && !cfgOauth2.logger.transports) {
    cfgOauth2.logging = logger;
  }
  return oauth2.config(cfgOauth2);
}).then(resolved => {
  debug('config oauth2');

  oauth2.routes.oauth2.setup({
    logger: resolved.logger,
    caller,
    authorizationUrl: config.get('oauth2.authorizationUrl'),
    mountPath: config.get('oauth2.mountPath')
  });

  const oauth2Pipes = oauth2.pipe();
  debug('oauth2 pipes', oauth2Pipes);

  const mountPath = config.get('oauth2.mountPath');
  debug('mount oauth2 to ' + mountPath);

  app.use(mountPath, oauth2.router);

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
    .then(() => caller ? caller.close() : null)
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
      })
      .then(() => caller ? caller.close() : null)
      .then(() => logger.promise.info('servers stopped on message: ' + msg))
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
