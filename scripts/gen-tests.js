const stt = require('swagger-test-templates');
const Promise = require('bluebird');
const debug = require('debug')('gen-tests');
const fs = require('fs');
const path = require('path');
const swagger = require('../api-docs.json');
const saSwagger = require('../sa-api-docs.json');
const writeFile = Promise.promisify(fs.writeFile);
const mkdir = Promise.promisify(fs.mkdir);
const rmdir = Promise.promisify(require('rimraf'));

const config = {
  assertionFormat: 'should',
  testModule: 'supertest',
  pathName: [],
  maxLen: 80
};

const swaggerPath = path.join(__dirname, '../test/swagger');
const saSwaggerPath = path.join(__dirname, '../test/saSwagger');

const removeDefaultResponse = (swg) => {
  Object.keys(swg.paths).forEach(p =>
    Object.keys(swg.paths[p]).forEach(o => {
      debug('path', p);
      debug('operation', o);
      debug('deleted default response', !!swg.paths[p][o].responses.default);
      delete swg.paths[p][o].responses.default;
    }));
  return swg;
};

const parse = swg => removeDefaultResponse(swg);

[{
  dir: swaggerPath,
  swagger: swagger
}, {
  dir: saSwaggerPath,
  swagger: saSwagger
}].forEach(x =>
  rmdir(x.dir)
    .then(() => mkdir(x.dir))
    .then(() => debug('new folder'))
    .then(() => parse(x.swagger))
    // Generates an array of JavaScript test files following specified configuration
    .then(parsed => stt.testGen(parsed, config))
    .tap(() => debug('tests generated'))
    .then(tests => Promise.all(tests.map(t =>
      writeFile(path.join(x.dir, t.name), t.test, 'utf8')
      .then(() => debug('generated: ' + t.name))
    )))
);
