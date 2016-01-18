'use strict';
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerTools = require('swagger-tools');
const Promise = require('bluebird');
/**
 * @module swagger - Swagger Specification Tools
 */
/**
 * @external swaggerMiddleware
 * @see {@link https://github.com/apigee-127/swagger-tools/blob/master/docs/Middleware.md}
 * @type object
 * @property {swaggerMetadata} swaggerMetadata - required middleware to use other
 *                                               swagger middlewares
 * @property {swaggerValidator} swaggerValidator - validate incoming requests
 *                                              and outgoing responses
 * @property {swaggerRouter} swaggerRouter - automatically route to controllers
 * @property {swaggerSecurity} swaggerSecurity - validate authentication
 * @property {swaggerUi} swaggerUi - server documentation and swaggerUi
 */
/**
 * @typedef swaggerDefinition
 * @type {object}
 * @property {object} info - information about the api
 * @property {string} info.title - api title
 * @property {string} info.version - api version
 * @property {string} [info.description] - api description
 * @property {string} [host] - api hostname:port
 * @property {string} [basePath] - api base path
 * @example
 * info: {
 *   title: 'Hello World', // Title (required)
 *   version: '0.0.1', // Version (required)
 *   description: 'A sample API' // Description (optional)
 * },
 * host: 'localhost:8000', // Host (optional)
 * basePath: '/' // Base path (optional)
 */
/**
 * @typedef validationError
 * @type Error
 * @property {object[]} errors - validation errors
 * @property {boolean} failedValidation - Indicating the error is a validation error
 * @property {*} originalResponse - The original response payload sent via
 *  res.end that triggered the response validation failure (All other response
 *  related fields like headers, status code, etc. are already avaliable on the
 *  res available to all downstream middlewares like the error handlers.)
 * @property {object[]} warnings - The validation warnings
 */
/**
 * Generates the swagger spec from [JSDoc]{@link https://github.com/Surnet/swagger-jsdoc}
 * @function
 * @param {object} options - Configuration options
 * @param {swaggerDefinition} options.swaggerDefinition - swagger definition
 * @param {string[]} options.apis - spec documention paths
 * @returns {object} swaggerSpec
 */
const fromJSDoc = options => swaggerJSDoc(options);

/**
 * Initialize swagger middleware
 * @function
 * @param {object} spec - complete api swagger specification
 * @returns {Promise<swaggerMiddleware>} middlewarePromise
 */
const middleware = spec => new Promise(resolve => {
  swaggerTools.initializeMiddleware(spec, resolve);
});

module.exports = {
  fromJSDoc,
  middleware
};
