

'use strict';
const router = require('express').Router();

router.endpoint = '/ping';

/**
 * @swagger
 * /ping:
 *   get:
 *     tags:
 *       - meta
 *     description: Returns 'pong' to the caller
 *     responses:
 *       204:
 *         $ref: "#/responses/noContent"
 *       500:
 *         $ref: "#/responses/unexpected"
 */
router.get('/', (req, res) => res.status(204).send());

module.exports = router;
