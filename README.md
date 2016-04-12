# Express Starter Kit

Boilerplate for express web applications.

## Features

- Clustered mode, gracefull shudown or reload with [PM2](https://github.com/Unitech/pm2)
- Integration and unit tests (with [mocha](https://mochajs.org/) and [supertest](https://github.com/visionmedia/supertest))
- Test code coverage ([istanbul](https://github.com/gotwarlost/istanbul) and generated report
- Generated documentation site from inline comments ([jsDoc](http://usejsdoc.org/))
- Auto generated swagger documentation from inline comments or from yaml files
- Auto validation of content, params and query of your swagger documented endpoints
- Asynchronous logging with multi transport support ([winston](https://github.com/winstonjs/winston)) and promised logging
- Debug synchronously with diff timing between outputs and namespaced ([debug](https://github.com/visionmedia/debug))
- Additional express features for with promised api start and deferred middleware
mounts
- [bluebird](https://github.com/petkaantonov/bluebird) promises
- Highly configurable and customizable with [config](https://github.com/lorenwest/node-config) for different enviroments
- Modular approach to api mount allowing to serve diverse apis and unit test
specific routers

## Installation

### Requirements

- node: >5.10
- npm: >3.3

#### Install dependencies

```
npm install [--production]
```

#### Install [PM2](https://github.com/Unitech/pm2) globally to manage your
node cluster

```
sudo npm install -g pm2
```

#### Create your local configuration file

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
pm2 gracefulReload app
```

#### Debug mode

```
npm run debug -s
```

## [mocha](https://mochajs.org/) Testing and [istanbul](https://github.com/gotwarlost/istanbul) Coverage

```
npm run test -s
```

Coverage reports will be generated at `./coverage`

## [eslint](http://eslint.org/) linting check

```
npm run lint -s

```
## [jsDoc](http://usejsdoc.org/) Documentation

```
npm run docs -s
```

Documentation will be generated at `./docs`


To inspect `./coverage` and `./docs` you may want to serve your local files.
You can use `http-server` for that:

```
npm install -g http-server
http-server
```
