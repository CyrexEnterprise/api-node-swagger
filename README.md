# api-node-swagger

Boilerplate for API Layer - Node.JS - Swagger

The API layer services the Business Logic Module ([blm-node-sequelize](https://github.com/Cloudoki/blm-node-sequelize)) through the Message Queue layer ([mq-node-amqp](https://github.com/Cloudoki/mq-node-amqp)),
in a scalable and balanced matter. It is built on top of [Swagger-Tools](https://github.com/apigee-127/swagger-tools) ([openAPI](https://openapis.org/)) and [express](http://expressjs.com/)
to provide an design driven API construction. It includes already implemented the
a OAuth2 Module implicit flow for client-side authentication.
Includes the Superadmin API aliased routing inside the main API allowing endpoint reuse.

* [Features](#features)
* [How to Install](#how-to-install)
* [Launching the application](#launching-the-application)
  - [Cluster mode](#cluster-mode)
  - [Single node](#single-node)
  - [Gracefull reload](#gracefull-reload)
  - [Debug mode](#debug-mode)
* [Testing and Coverage](#testing-and-coverage)
* [Check linting](#check-linting)
* [API Reference](#api-reference)
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

#### Gracefull reload

For continuous integration with no downtime

```
pm2 gracefulReload api
```

#### Debug mode

```
npm run debug -s
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

## Roadmap

- Auto generated endpoint tests from swagger documentation
- Auto mocking of endpoints from swagger documentation
