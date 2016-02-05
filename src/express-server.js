'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');

const express = require('express');
const Promise = require('bluebird');

module.exports = () => {
  const app = express();

  // deferred middleware mounts
  app._deferred = [];

  // defer a middle ware mount to the start of the application
  app.deferMount = (middleware, route) =>
     app._deferred.push([middleware, route]);

  // create server in with secure https or simple http mode
  app.createServer = secure => secure ? https.createServer({
    key: fs.readFileSync(secure.key, 'utf8'),
    cert: fs.readFileSync(secure.cert, 'utf8')
  }, app) : http.createServer(app);


  // promise listen
  app.promiseListen = (server, port) => new Promise((resolve, reject) =>
    server.listen(port, err => err ? reject(err) : resolve(server)));

  // mount all the deferred middleware
  app.mountDeferred = () => {
    let deferred;
    let route;
    let middleware;
    while (app._deferred.length) {
      deferred = app._deferred.shift();
      middleware = deferred[0];
      route = deferred[1];
      if (route) {
        route.use(middleware);
      } else {
        app.use(middleware);
      }
    }
  };

  // start application by mounting the deferred middleware and promise the
  // server listen start
  app.start = options => {
    app.mountDeferred();
    return app.promiseListen(app.createServer(options.secure), options.port);
  };

  return app;
};
