'use strict';
const debug = require('debug')('api:main');
debug('run');

const path = require('path');
const fs = require('fs');

const Promise = require('bluebird');
const cors = require('cors');
const _ = require('lodash');
const express = require('express');
const expressServer = require('../express-server');
const log = require('../log');
const swagger = require('../swagger');

// TODO: enum error codes in specification

/* eslint-disable no-unused-vars */
const errorHandler = (err, req, res, next) => {
  /* eslint-enable no-unused-vars */
  let errors = [];
  debug('error', err);
  debug('error stack', err.stack);
  if (err.failedValidation && err.results && err.results.errors) {
    res.status(400);
    errors = errors.concat(err.results.errors)
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

    errors.push({
      message: err.message,
      code: err.code
    });
  }
  debug('errors', errors);
  res.json({
    errors
  });
};

module.exports = (app, namespace) => {
  let api = app;
  let route = app;
  let server = app;

  if (!app) {
    api = expressServer();
    server = api;
    route = api;
  }

  if (app && namespace) {
    server = app;
    app[namespace] = Object.create(null);
    api = app[namespace];
    /* eslint-disable new-cap */
    route = express.Router();
    /* eslint-enable new-cap */
    api.router = route;
  } else if (!app && namespace) {
    throw new Error('invalid arguments');
  }

  // routes store
  api.routes = Object.create(null);

  api.config = config => {
    let logger;
    let swaggerMount;
    let swaggerSpec;

    if (typeof config.etag !== 'undefined') {
      server.set('etag', config.etag);
    }

    if (config.cors) {
      route.use(cors(_.cloneDeep(config.cors)));
    }

    if (config.logger) {
      debug('create logger');
      logger = log.createLogger(config.logger);

      if (config.logger.middleware) {
        debug('logger middleware mount');
        route.use(logger.middleware());
      }

      if (config.logger.erroHandler) {
        debug('logger middlewareError mount deferred');
        server.deferMount(logger.middlewareError(),
          namespace ? route : undefined);
      }
    }

    if (config.swagger) {
      if (config.swagger.apisDirs) {
        const exts = config.swagger.exts || ['.js', '.jsdoc', '.yaml', '.yml'];
        const dirs = config.swagger.apisDirs
          .map(dir => path.resolve(process.cwd(), dir))
          .map(fs.readdirSync)
          .map((filenames, i) => filenames.map(path.parse)
            .filter(
              file => file.name &&
              file.name.indexOf('.') === -1 &&
              (exts.indexOf(file.ext) !== -1)
            ).map(file => path.join(config.swagger.apisDirs[i], file.base)));
        config.swagger.apis = _.flatten(dirs);
        debug('apis', config.swagger.apis);
      }
      swaggerSpec = swagger.fromJSDoc(config.swagger);
      debug('swaggerSpec', swaggerSpec);
      if (config.swagger.outputSpec) {
        fs.writeFileSync(config.swagger.outputSpec,
          JSON.stringify(swaggerSpec, null, 2),
          'utf-8');
      }
      swaggerMount = swagger.middleware(swaggerSpec)
        .tap(middleware => {
          debug('swagger middleware metadata mount');
          server.use(middleware.swaggerMetadata());

          // TODO: config.security (config to fetch handlers) to initialize
          //  middleware.swaggerSecurity()

          if (config.swagger.validator) {
            debug('swagger middleware validator mount');
            server.use(middleware.swaggerValidator(config.swagger.validator));
          }

          if (config.swagger.ui) {
            debug('swagger middleware ui mount');
            route.use(middleware.swaggerUi(config.swagger.ui));
          }
        });
    }

    // catch unhandled requests 404
    server.deferMount((req, res, next) => {
      const err = new Error('Not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      next(err);
    }, namespace ? route : undefined);

    debug('handleError mount deferred');
    server.deferMount(errorHandler);

    // Routes loading
    if (config.routes) {
      const filePath = path.resolve(process.cwd(), config.routes);
      fs.readdirSync(filePath)
        .map(path.parse)
        .filter(file =>
        file.name &&
        file.name.indexOf('.') === -1 &&
        file.name !== 'index' &&
        file.ext === '.js')
        .forEach(file => {
          debug('route', file.name);
          api.routes[file.name] = require(path.join(filePath, file.base));
        });
    }

    const version = config.mountPath.replace('/', '');

    debug('api version: ', version);
    server.use('/version', (req, res) => {
      res.send(version);
    });

    return Promise.resolve(swaggerMount).then(swaggerMiddleware => ({
      logger,
      swaggerSpec,
      swaggerMiddleware
    }));
  };

  api.pipe = routes => {
    let pipes = Object.keys(api.routes);

    if (Array.isArray(routes)) {
      pipes = pipes.filter(routes);
    } else if (typeof routes === 'string') {
      pipes = pipes.filter([routes]);
    }

    // push '*' endpoint to the end of the pipes
    const allIndex = _.findIndex(pipes,
      pipe => api.routes[pipe].endpoint === '*');
    if (allIndex >= 0 && allIndex !== pipes.length - 1) {
      pipes.push(_.pullAt(pipes, allIndex)[0]);
    }

    _.forEach(pipes, pipe => route.use((api.routes[pipe].endpoint ?
      api.routes[pipe].endpoint : ('/' + pipe)), api.routes[pipe])
    );

    return pipes;
  };

  return api;
};
