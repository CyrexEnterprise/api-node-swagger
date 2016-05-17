# api-node-swagger

Boilerplate for API Layer - Node.JS - Swagger

The API layer services the Business Logic Module
([blm-node-sequelize](https://github.com/Cloudoki/blm-node-sequelize))
through the Message Queue layer ([mq-node-amqp](https://github.com/Cloudoki/mq-node-amqp)),
in a scalable and balanced matter. It is built on top of [swagger-tools](https://github.com/apigee-127/swagger-tools) ([openAPI](https://openapis.org/)) and [express](http://expressjs.com/)
to provide an design driven API construction. It includes already implemented the
a OAuth2 Module implicit flow for client-side authentication.
Includes the Superadmin API aliased routing inside the main API allowing endpoint reuse.

* [Features](#features)
* [How to Install](#how-to-install)
* [Launching the application](#launching-the-application)
    - [Cluster mode](#cluster-mode)
    - [Single node](#single-node)
    - [Graceful reload](#graceful-reload)
    - [Debug mode](#debug-mode)
* [Usage](#usage)
    - [Swagger-UI](#swagger-ui)
    - [How to add a new endpoint](#how-to-add-a-new-endpoint)
    - [How to add a new view](#how-to-add-a-new-view)
    - [How to build a custom router](#how-to-build-a-custom-router)
    - [How to use the api builder](#how-to-use-the-api-builder)
    - [Dispatch](#dispatch)
      * [How to build a custom message payload](#how-to-build-a-custom-message-payload)
      * [How to build a custom response handler](#how-to-build-a-custom-response-handler)
    - [Error handling](#error-handling)
    - [Configuration](#configuration)
    - [Logging](#logging)
    - [Debugging](#debugging)
* [API Reference](#api-reference)
* [Testing and Coverage](#testing-and-coverage)
* [Check linting](#check-linting)
* [Roadmap](#roadmap)

## Features

- Integrates with the **3-layered architecture**:
    * Message Queue Layer [mq-node-amqp](https://github.com/Cloudoki/mq-node-amqp)
    * Business Logic Module [blm-node-sequelize](https://github.com/Cloudoki/blm-node-sequelize)
- **Design Driven** API construction
    * Generated UI website for interactive endpoints from documentation: Swagger UI
    * Auto generated swagger documentation from inline comments or from yaml files ([swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc))
    * Auto validation of content, params and query of your swagger documented endpoints
    * Auto routing based on swagger documentation
    * Auto message payload construction based on swagger documentation
    * Auto response validation
- **OAuth2** Module
    * Implicit flow for client-side authentication (with invitation, reset password)
    * Views for client-side authentication with the API that are styled using a customizable UI package
    * Token parsing from query parameters or body
- Superadmin
    * Aliased routing for endpoint reuse
    * Separated Swagger-UI site and documentation from main API
- **Flexible**: allows custom routing and payload construction
- **Highly configurable** with [config](https://github.com/lorenwest/node-config)
- Explicit and customizable **error handling** with normalized json output
- **Clustered** mode, graceful shutdown or reload with [PM2](https://github.com/Unitech/pm2)
- Integration and unit tests (with [mocha](https://mochajs.org/) and [supertest](https://github.com/visionmedia/supertest))
- Test code coverage ([istanbul](https://github.com/gotwarlost/istanbul) and generated report)
- Asynchronous logging with multi transport support ([winston](https://github.com/winstonjs/winston)) and promised logging
- Debug synchronously with diff timing ([debug](https://github.com/visionmedia/debug))
- [bluebird](https://github.com/petkaantonov/bluebird) promises

## How to Install

Requirements:

- node: >5.10
- npm: >3.3
- RabbitMQ: >3.6.1 (or equivalent AMQP broker)

You will need the Message Queue Layer setup before you attempt to start the api as
it will try connect to it and abort (see: [mq-node-amqp](https://github.com/Cloudoki/mq-node-amqp)).

Install dependencies:

```
npm install [--production]
```

Install PM2 globally to manage your node cluster

- [PM2](https://github.com/Unitech/pm2)

```
sudo npm install -g pm2
```

Create your local configuration file:

You will need to add a local configuration file: `./config/local.yaml` that
will overwrite the configuration, check the [configuration](#configuration) section
 for details on how the configuration is setup.

## Launching the application


#### Cluster mode

```
pm2 start ecosystem.json -env <development|production>
```

#### Single node

```
NODE_ENV=<production|development> npm run start -s
```

#### Graceful reload

For continuous integration with no downtime

```
pm2 gracefulReload api
```

#### Debug mode

```
npm run debug -s
```

## Usage

#### Swagger-UI

On development enviroment the api will serve an utility page Swagger-UI with the
swagger documented endpoints and allow you to generate requests. After sucessfully
starting the api you may on your browser open the following links:

 - API: [http://localhost:8000/0/docs](http://localhost:8000/0/docs)
 - Superadmin: [http://localhost:8000/0/superadmin-docs](http://localhost:8000/0/superadmin-docs)

#### How to add a new endpoint

To add an endpoint to the API you will need to start by providing the endpoint
 documentation following the [openAPI specification](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md).
Create a new yaml file at `./src/api/routes` with the endpoint documentation.
You may use one of the already defined models at `./src/api/definitions`,
responses `./src/api/responses.yaml`, parameters `./src/api/parameters.yaml`.

And that's it: your documentation will automatically be picked up by the
([swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)) module,
this will produce an object and output it to `./api-docs.json` which will be
validated, if it fails this you may import the output json on the
[http://editor.swagger.io/](http://editor.swagger.io/) for more advanced error
descriptions and warnings.

This process of loading documentation, building the express router and mounting
swagger validation and so on is done at `./src/api/index.js`

#### How to add a new view

You might want this layer to provide other views besides the ones already provided
for the OAuth2 implicit flow. For this you will need lookup the
[express-handlebars](https://github.com/ericf/express-handlebars) documentation
this module is used to generate the views for the application.
Also look into express documentation on [using template engines](http://expressjs.com/en/guide/using-template-engines.html).

This configuration and setup is done on the init script (`./bin/start.js`)

#### How to build a custom router

You may instead of using the already builtin router that uses the swagger
documentation provided you may want to build your own for more advanced use.

- Build an [express router](http://expressjs.com/en/guide/routing.html)
- Add the endpoint property: a string that will be given to `app.use(router.endpoint, router)`
- If setup is needed implement a setup method that takes in an object built
with the configuration file and mixed in dependencies (logging, caller, ...)

```javascript
express.Router {
  endpoint: '/test',
  setup: function(configuration) {
    // your setup here
  }
}
```

- If you need your router to dispatch messages to the Business Logic Module
you will need to build the message payload (see:
  [how to build a custom message payload](#how-to-build-a-custom-message-payload))
  and handle the response (see: [how to build a custom response handler](#how-to-build-a-custom-response-handler)).

- You will then need to alter the init script (`./bin/start.js`) to if the router
requires setup:

```javascript
// example that provides a logger and caller to the router through setup
api.routes.yourCustomRouter.setup({
  logger,
  caller
});
```

An example of a custom router is the router for the OAuth2 endpoints (`./src/oauth2.js`),
however this router is mounted on the oauth2 api and not the base api.

#### How to use the api builder

To namespace different apis on the same application you may use the api builder (`./src/api/index.js`)
module that for a given configuration setups the router, logger and swagger tooling.
If no application is provided it will generate its own express application, useful
for testing only a specific api.

```javascript
// express application
const app = require('./src/express-server')();
const apiBuilder = require('./src/api');
// api built on top of app (app.api === api)
const api = apiBuilder(app, 'api');

// configuration that loads all the routes defined, and the swagger documentation
// and validates it. Also initializes the logger middleware if configured to do so.
api.config({
    ...
}).then(() => {
    ...
    // object containing all loaded routers
    // (eg: api.routes.swagger === require('./src/api/routes/swagger'); )
    console.log(api.routes);

    // you should setup your custom routes here
    api.routes.yourCustomRoute.setup({
        ...
    })

    // utility method to mount all the routers associated (by the configuration) with this api
    api.pipe();
})
```

Check the API reference (or inline comments) for detailed interfaces.

#### Dispatch

Remote Procedural Call to Business Logic Module through the Message Queue

The dispatch is done with the caller provided by the [mq-node-amqp](https://github.com/Cloudoki/mq-node-amqp)
module.

```javascript
const amqp = require('mq-node-amqp');
amqp.createCaller({
  connection: {
    url: 'amqp://localhost'
  },
  queue: {
    name: 'rpc'
  }
}).then(caller => caller.call(payload))
  .then(response => console.log(response));
```

The routers are injected with the caller and, after building the payload from the
received HTTP request, dispatch the payload to the BLM and await an response
which will used to reply to the request.

##### How to build a custom message payload

If your build the api serving the router with swagger documentation the request
object will have available an object descriptive of the endpoint called `req.swagger`
that you can use to assist you in building the payload. This object will only be
available if the endpoint was match with the documentation and parsed correctly.

```javascript
const payload = {
  // (required) method of the operation
  method: req.method,
  // authorization token
  token: req.token,
  // (required) apiPath corresponds to the endpoint path
  apiPath: swagger.apiPath, // (eg: '/users/{id}')
  // basePath corresponds to the api mount path (eg: '/0')
  basePath: swagger.swaggerObject.basepath,
  // (required) operationId (eg. 'getUser')
  operationId: swagger.operation.operationId,
  // array of names of security definitions associated with the operation
  // (eg: ['oauth2'])
  security: swagger.security,
  // parameters other than body parsed
  params: _.mapValues(
    _.pick(swagger.params, (value, key) => key !== 'body' ),
    o => o.value)
});

// only build the payload body with properties described on the documentation
if (req.swagger.params.body) {
  payload.body = _.pick(req.body,
    Object.keys(req.swagger.params.body.schema.schema.properties)
  );
}
```

You may build your own without using swagger as long it builds the required
fields. Also you may not use some properties that will be overwritten by the caller:
`id`, `ts`.

##### How to build a custom response handler

A proper response from the BLM even in case of error will have at least the
following properties:

 - id {string}: matches the payload id (required)
 - statusCode {integer}: HTTP response status code (required)
 - body {object}: response body data (required except for 204 status)

In order to build a handler for responses from the caller you will need to handle
bad BLM responses (just in case) may use the process error already defined in
`./src/api/errors.js`.

You may use for reference the swagger handler (`./src/api/routes/swagger.js`) which
additionally also sets responses headers if provided in the response.

 - headers {object}: HTTP response headers

Or even the oauth2 response handler (`./src/oauth2.js`) which will redirect
HTTP requests if response has a redirect property.

- redirect {string}: HTTP redirect url

#### Error handling

All errors on the express routes if not handled are propagated to the
application error handler defined at `./src/api/errors.js` or if the a route
is not found it will generate the not found response. This handler is mounted
on the application in the init script `./bin/start.js`.

It will generate an json response with the following format:
```javascript
{
  errors: [{
      code: 'NOT_FOUND',
      message: 'Not Found'
  }]
}
```

If you want to propagate an error make sure it is created with code property so
that it will not throw an unexpected error instead.

```javascript
// error in a route handler
  if (conditionNotMet) {
    const err = new Error('your message');
    err.code = 'YOUR_CODE';
    throw err;
  }
```

For swagger documented routes it will generated proper request validation errors array
with if applicable multiple errors. It may also generate response validation errors,
that is when the response from the router does not match the defined response model
on the documentation (enable response validation on development mode).
It generates for swagger documented routes the 406 Not Acceptable HTTP request on
invalid Accept headers.

#### Configuration

For configuration the [config](https://github.com/lorenwest/node-config) module
that allows for configuration on specific enviroments:

 - `./config/development.yaml` for `NODE_ENV=development` or if `NODE_ENV` is not set
 - `./config/production.yaml` for `NODE_ENV=production`
 - `./config/test.yaml` for `NODE_ENV=test`

If needed you can create a local configuration: create an `local.yaml` file
that replaces the default configuration on sensitive or server specific configuration.

Your deployed `local.yaml` file should at least have the following configurations:

```yaml
oauth2:
  authorizationUrl: http://api.domain.com/oauth2/login

api:
  swagger:
    swagger-ui:
      # this might not be needed if the swagger-ui page properly setups the url
      # prefixed with /0
      swaggerUiPrefix: '/0'
    swaggerDefinition:
      host: api.domain.com
    oauth2:
      authorizationUrl: http://api.domain.com/oauth2/login

superadmin:
  swagger:
    swagger-ui:
      swaggerUiPrefix: '/0'
    swaggerDefinition:
      host: api.domain.com
    oauth2:
      authorizationUrl: http://api.domain.com/oauth2/login
```

Note that you should use secure HTTP and change the corresponding configurations.

#### Logging

For logging you may use the provided log builder `./src/log.js` it uses the
[winston](https://github.com/winstonjs/winston) module that provides asynchronous
 logging and multiple transports. The builder provides an easy way to setup
 multiple transports from a single configuration. You will want to keep them
 to two arguments: message and data object. Avoid doing computation intensive
 actions to generate this data object.

 ```javascript
logger.info('your message here', {
  time: new Date().toISOString()
  something: yourvariable
})
```

If you want to wait on logging callback you can use the promise api:

```javascript
logger.promise.info('log this please').then(() => doSomethingAfterLogging())
```

The [api builder](#how-to-use-the-api-builder) uses the created logger middleware
`logger.middleware` which if enabled in the configuration will log incoming requests and
the corresponding responses if is built using the [express-winston](https://github.com/bithavoc/express-winston)
module.


#### Debugging

For debugging your application you should use the [debug](https://github.com/visionmedia/debug)
module which namepscaes different of your code and diffs the time between debug sections
it will only be active for namespaces provided in the DEBUG environment variable.

`DEBUG=app:*` is the one used for npm debug script (`npm run debug`).

But you may want to debug specific sections (eg: `DEBUG:oauth,app:api:*`)

As long as your are not doing a compute intensive task to produce the object to debug
you may leave the debug statment there since it will be converted to noop function
(`() => ()`) if not in debugging mode and shouldn't affect performance.

## API Reference

- [jsDoc](http://usejsdoc.org/)

```
npm run docs -s
```

API Reference Documentation will be generated at `./docs`


To inspect `./coverage` and `./docs` you may want to serve your local files.
You can use `http-server` for that:

```
npm install -g http-server
http-server
```

## Testing and Coverage

 - [mocha](https://mochajs.org/)
 - [istanbul](https://github.com/gotwarlost/istanbul)

```
npm run test -s
```

Coverage reports will be generated at `./coverage`

## Check linting

- [eslint](http://eslint.org/)

```
npm run lint -s
```

## Roadmap

- Auto generated endpoint tests from swagger documentation
