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
    - [How to add a new endpoint](#how-to-add-a-new-endpoint)
    - [How to add a new view](#how-to-add-a-new-view)
    - [How to build a custom router](#how-to-build-a-custom-router)
    - [How to use the api builder](#how-to-use-the-api-builder)
    - [API Dispatch](#api-dispatch)
      * [How to build a custom message payload](#how-to-build-a-custom-message-payload)
      * [How to build a custom response handler](#how-to-build-a-custom-response-handler)
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
- Test code coverage ([istanbul](https://github.com/gotwarlost/istanbul) and generated report
- Asynchronous logging with multi transport support ([winston](https://github.com/winstonjs/winston)) and promised logging
- Debug synchronously with diff timing ([debug](https://github.com/visionmedia/debug))
- [bluebird](https://github.com/petkaantonov/bluebird) promises

## How to Install

Requirements:

- node: >5.10
- npm: >3.3

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
will overwrite the configuration, check
[node-config](https://github.com/lorenwest/node-config) for details on how the configuration is setup.

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

#### API Dispatch

Remote Procedural Call to Business Logic Module through the Message Queue

The dispatch is done with the caller provided by the [mq-node-amqp](https://github.com/Cloudoki/mq-node-amqp)
module.

```javascript
const amqp = require('mq-node-amqp');
amqp.createCaller({ ... })
.then(caller => caller.call(payload))
.then(response => console.log(response));
```

The routers are injected with the caller and, after building the paylaod from the
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
