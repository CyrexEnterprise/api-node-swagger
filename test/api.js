'use strict';
const config = require('config');

describe('api', () => {
  const api = require('../src/api/index')();
  // logger mock to noop
  const logger = {};
  ['error', 'warn', 'info', 'debug', 'verbose'].forEach(level =>
    logger[level] = () => {});

  let server;
  // building only a specific api of your server
  before(done => api.config(config.get('api'))
    .then(() => {
      api.pipe();
      return api.start(config.get('server'));
    }).then(apiServer => {
      server = apiServer;
      done();
    })
  );

  after(done => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });
  describe('api.hello', () => {
    require('./api/hello')(api);
  });
  describe('api.ping', () => {
    require('./api/ping')(api);
  });
});
