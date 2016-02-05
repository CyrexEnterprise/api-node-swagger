'use strict';
const debug = require('debug')('app:api:hello');
const util = require('util');

const router = require('express').Router();

router.endpoint = '/hello';

/**
 * @swagger
 *  /hello:
 *    get:
 *      tags:
 *        - interact
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
 *        500:
 *          $ref: "#/responses/unexpected"
 *
 * definition:
 *   HelloResponse:
 *     required:
 *       - data
 *     properties:
 *       data:
 *         type: string
 *         example: "Hello, Stranger!"
 */

router.get('/', (req, res) => {
  debug('get request with name', req.query.name);
  const name = req.query.name || 'stranger';
  const hello = util.format('Hello, %s!', name);
  res.json({
    data: hello
  });
});

module.exports = router;
