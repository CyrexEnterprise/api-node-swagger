'use strict';
const debug = require('debug')('app:api');
debug('run');

const path = require('path');
const fs = require('fs');

const Promise = require('bluebird');
const _ = require('lodash');
const express = require('express');
const expressServer = require('../express-server');
const log = require('../log');
const swagger = require('../swagger');

const resolvePath = relative => path.resolve(process.cwd(), relative);

const loadRouteDir = (store, fileDir) => fs.readdirSync(fileDir)
  .map(path.parse)
  .filter(file =>
  file.name &&
  file.name.indexOf('.') === -1 &&
  file.name !== 'index' &&
  file.ext === '.js')
  .forEach(file => store[file.name] = require(path.join(fileDir, file.base)));

const loadDocsDirs = (docsDirs, extensions) => {
  if (!docsDirs) {
    return [];
  }
  const exts = extensions || ['.js', '.jsdoc', '.yaml', '.yml'];
  const dirs = docsDirs.map(resolvePath).map(fs.readdirSync)
    .map((filenames, i) => filenames.map(path.parse)
      .filter(
        file => file.name &&
        file.name.indexOf('.') === -1 &&
        (exts.indexOf(file.ext) !== -1)
      ).map(file => path.join(docsDirs[i], file.base)));
  return _.flatten(dirs);
};

// TODO: enum error codes in specification

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
    route = express.Router();
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

    if (config.logger || (config.logger && config.logging)) {
      if (config.logging) {
        logger = config.logging;
      } else {
        debug('create logger');
        logger = log.createLogger(config.logger);
      }

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
      config.swagger.apis = loadDocsDirs(config.swagger.docsDirs,
        config.swagger.exts);

      if (config.swagger.docs) {
        config.swagger.apis = config.swagger.apis
          .concat(config.swagger.docs.map(resolvePath));
      }

      debug('apis', config.swagger.apis);

      swaggerSpec = swagger.fromJSDoc(config.swagger);

      if (config.swagger.oauth2) {
        const oauth2 = swaggerSpec.securityDefinitions.oauth2;
        oauth2.authorizationUrl = config.get('swagger.oauth2.authorizationUrl');
        if (config.has('swagger.oauth2.tokenUrl')) {
          oauth2.tokenUrl = config.get('swagger.oauth2.tokenUrl');
        }
      }

      if (config.swagger.outputSpec) {
        fs.writeFileSync(config.swagger.outputSpec,
          JSON.stringify(swaggerSpec, null, 2), 'utf-8');
      }

      if (config.swagger.serveDocs) {
        route.get(config.swagger.serveDocs, (req, res) => {
          res.json(swaggerSpec);
        });
      }

      swaggerMount = swagger.middleware(swaggerSpec)
        .tap(middleware => {
          debug('swagger middleware metadata mount');
          server.use(middleware.swaggerMetadata());

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

    route.options('*', (req, res) => res.status(204).send());

    // Routes loading
    if (config.routes) {
      config.routes.map(resolvePath).forEach(filePath =>
        api.routes[path.parse(filePath).name] = require(filePath));
    }

    if (config.routesDirs) {
      config.routesDirs.map(resolvePath)
        .forEach(dir => loadRouteDir(api.routes, dir));
    }

    return Promise.resolve(swaggerMount).then(swaggerMiddleware => ({
      logger,
      swaggerSpec,
      swaggerMiddleware
    }));
  };

  api.pipe = routes => {
    let pipes;

    if (!routes) {
      pipes = Object.keys(api.routes);
    } else {
      pipes = routes;
    }

    _.forEach(pipes, pipe => route.use((api.routes[pipe].endpoint ?
      api.routes[pipe].endpoint : ('/' + pipe)), api.routes[pipe])
    );

    return pipes;
  };

  return api;
};
