'use strict';

const debug = require('debug')('oauth2');
const _ = require('lodash');
// const path = require('path');
const bodyParser = require('body-parser');
const errors = require('./errors');

const path = require('path');

const router = require('express').Router();

router.endpoint = '/';

const queryParams = ['redirect_uri', 'response_type', 'client_id'];
const invitationParams = queryParams.concat(['invitation_token']);
const resetParams = queryParams.concat(['reset_token']);

let logger;
let caller;
let authorizationUrl;
let basePath;

router.setup = config => {
  debug('setup');
  caller = config.caller;
  logger = config.logger;
  basePath = config.mountPath;
  authorizationUrl = config.authorizationUrl;
};

const checkMissingQuery = (fields, req, res, next) => {
  const missing = fields.find(m =>
    (!req.query[m] || req.query[m] === ''));
  if (missing) {
    return next(errors.badRequest('Missing query parameter: ' + missing));
  }
  return next();
};

const checkCredentials = (req, res, next) => {
  const missing = ['password', 'email'].find(m =>
    (!req.body[m] || req.body[m] === ''));
  if (missing) {
    return next(errors.badRequest('Missing: ' + missing));
  }
  return next();
};

const checkMail = (req, res, next) => {
  const missing = !req.body.email || req.body.email === '';
  if (missing) {
    return next(errors.badRequest('Missing: email'));
  }
  return next();
};

const checkPassword = (req, res, next) => {
  const missing = !req.body.password || req.body.password === '';
  if (missing) {
    return next(errors.badRequest('Missing: password'));
  }
  return next();
};

const buildPayload = (req, queryFields, apiPath, operationId) => ({
  token: req.token,
  body: req.body,
  method: req.method,
  params: _.pick(req.query, queryFields),
  basePath,
  authorizationUrl,
  apiPath,
  operationId
});


const handler = (res, view, response) => {
  if (!response) {
    throw errors.process('no response');
  }

  logger.info('process done', response.id);

  if (response.statusCode === 204) {
    return res.status(response.statusCode).end();
  } else if (!response.statusCode) {
    throw errors.process('no statusCode');
  }

  res.status(response.statusCode);

  if (response.headers) {
    Object.keys(response.headers).forEach(h =>
      res.setHeader(h, response.headers[h]));
  }

  if (response.redirect) {
    return res.redirect(response.statusCode, response.redirect);
  }

  if (view && response.body) {
    return res.render(view, response.body);
  }

  if (response.body) {
    return res.json(response.body);
  }

  throw errors.process('unexpected response');
};

router.route('/login')
  .all(checkMissingQuery.bind(null, queryParams))
  .get((req, res) => res.render('login', {
    data: _.pick(req.query, queryParams),
  }))
  .post(bodyParser.urlencoded({
    extended: true
  }))
  .post(checkCredentials,
    (req, res) => caller.call(buildPayload(req, queryParams, '/login', 'login'))
    .then(response => handler(res, 'login', response))
  );

router.route('/forgot')
  .all(checkMissingQuery.bind(null, queryParams))
  .get((req, res) => res.render('forgot', {
    data: _.pick(req.query, queryParams),
  }))
  .post(bodyParser.urlencoded({
    extended: true
  }))
  .post(checkMail,
    (req, res) => caller.call(buildPayload(req, queryParams, '/forgot', 'forgot'))
    .then(response => handler(res, 'forgot', response))
  );

router.route('/resetpassword')
  .all(checkMissingQuery.bind(null, resetParams))
  .get((req, res) => res.render('resetpassword', {
    data: _.pick(req.query, resetParams),
  }))
  .post(bodyParser.urlencoded({
    extended: true
  }))
  .post(checkPassword,
    (req, res) => caller.call(buildPayload(req, resetParams, '/resetpassword',
      'resetpassword'))
    .then(response => handler(res, 'resetpassword', response))
  );


router.route('/invitation')
  .all(checkMissingQuery.bind(null, invitationParams))
  .get((req, res) =>
    caller.call(buildPayload(req, invitationParams, '/invitation',
      'getInvitation'))
    .then(response => handler(res, 'signup', response))
  )
  .post(bodyParser.urlencoded({
    extended: true
  }))
  .post((req, res) => caller.call(buildPayload(req, invitationParams, '/invitation',
      'postInvitation'))
    .then(response => handler(res, 'signup', response))
  );

router.get('/css/main.css', (req, res) =>
  res.sendFile(path.resolve(process.cwd(),
    './node_modules/hyper-ui-donderstarter/dist/css/main.css')));

module.exports = router;
