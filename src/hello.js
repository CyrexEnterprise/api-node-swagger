'use strict';
/** @module hello */
const debug = require('debug')('app:hello');
const util = require('util');

module.exports = {
  mount: app => {
    /**
     * @swagger
     *  /:
     *    get:
     *      description: Returns 'Hello' to the caller
     *      parameters:
     *        - name: name
     *          in: query
     *          description: The name of the person to whom to say hello
     *          required: false
     *          type: string
     *      responses:
     *        200:
     *          description: Success
     *          schema:
     *            $ref: "#/definitions/HelloResponse"
     *        default:
     *          description: Error
     *          schema:
     *            $ref: "#/definitions/ErrorResponse"
     *
     * definition:
     *   HelloResponse:
     *     required:
     *       - message
     *     properties:
     *       message:
     *         type: string
     *   ErrorResponse:
     *     required:
     *       - message
     *     properties:
     *       message:
     *         type: string
     */
    app.get('/', (req, res) => {
      debug('get request with name', req.query.name);
      const name = req.query.name || 'stranger';
      const hello = util.format('Hello, %s!', name);
      res.json(hello);
    });
  }
};
