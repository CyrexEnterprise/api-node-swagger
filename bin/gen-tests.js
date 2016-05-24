const stt = require('swagger-test-templates');
const Promise = require('bluebird');
const debug = require('debug')('gen-tests');
const deref = Promise.promisify(require('json-schema-deref'));
const fs = require('fs');
const path = require('path');
const swagger = require('../api-docs.json');
const writeFile = Promise.promisify(fs.writeFile);
const mkdir = Promise.promisify(fs.mkdir);
const rmdir = Promise.promisify(require('rimraf'));

const config = {
  assertionFormat: 'should',
  testModule: 'supertest',
  pathName: [],
  maxLen: 80,
  pathParams: {
    id: 1
  }
};
const swaggerPath = path.join(__dirname, '../test/swagger');

rmdir(swaggerPath)
  .then(() => mkdir(swaggerPath))
  .then(() => debug('new folder'))
  .then(() => deref(swagger))
  .tap(() => debug('deref spec'))
  // Generates an array of JavaScript test files following specified configuration
  .then(fullSchema => stt.testGen(fullSchema, config))
  .tap(() => debug('tests generated'))
  .then(tests => Promise.all(tests.map(t =>
    writeFile(path.join(swaggerPath, t.name), t.test, 'utf8')
      .then(() => debug('generated: ' + t.name))
  )));
