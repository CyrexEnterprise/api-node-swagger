'use strict';
var chai = require('chai');
var ZSchema = require('z-schema');
var validator = new ZSchema({});
var supertest = require('supertest');
var api = supertest('http://localhost:8000'); // supertest init;

chai.should();

require('dotenv').load();

describe('/accounts/{account_id}/users', function() {
  describe('post', function() {
    it('should respond with 201 Successful', function(done) {
      /*eslint-disable*/
      var schema = {
        "type": "object",
        "required": [
          "data"
        ],
        "properties": {
          "data": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "id",
              "firstname",
              "lastname",
              "email"
            ],
            "properties": {
              "id": {
                "type": "integer",
                "format": "int32",
                "example": 42
              },
              "firstname": {
                "type": "string",
                "example": "John"
              },
              "lastname": {
                "type": "string",
                "example": "Smith"
              },
              "email": {
                "type": "string",
                "example": "john.smith@example.com"
              }
            }
          }
        }
      };

      /*eslint-enable*/
      api.post('/0/accounts/{account_id PARAM GOES HERE}/users')
      .set('Content-Type', 'application/json')
      .set('Authorization', process.env.API_KEY)
      .send({
        body: 'DATA GOES HERE'
      })
      .expect(201)
      .end(function(err, res) {
        if (err) return done(err);

        validator.validate(res.body, schema).should.be.true;
        done();
      });
    });

    it('should respond with 204 Successful user...', function(done) {
      api.post('/0/accounts/{account_id PARAM GOES HERE}/users')
      .set('Content-Type', 'application/json')
      .set('Authorization', process.env.API_KEY)
      .send({
        body: 'DATA GOES HERE'
      })
      .expect(204)
      .end(function(err, res) {
        if (err) return done(err);

        res.body.should.equal(null); // non-json response or no schema
        done();
      });
    });

    it('should respond with default Unexpected Internal...', function(done) {
      /*eslint-disable*/
      var schema = {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "errors": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "code",
                "message"
              ],
              "properties": {
                "code": {
                  "type": "string",
                  "example": "UNEXPECTED_ERROR"
                },
                "message": {
                  "type": "string",
                  "example": "Internal Server error"
                }
              }
            }
          }
        }
      };

      /*eslint-enable*/
      api.post('/0/accounts/{account_id PARAM GOES HERE}/users')
      .set('Content-Type', 'application/json')
      .set('Authorization', process.env.API_KEY)
      .send({
        body: 'DATA GOES HERE'
      })
      .expect('DEFAULT RESPONSE CODE HERE')
      .end(function(err, res) {
        if (err) return done(err);

        validator.validate(res.body, schema).should.be.true;
        done();
      });
    });

  });

  describe('get', function() {
    it('should respond with 200 Successful', function(done) {
      /*eslint-disable*/
      var schema = {
        "type": "object",
        "required": [
          "data"
        ],
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "id",
                "firstname",
                "lastname",
                "email"
              ],
              "properties": {
                "id": {
                  "type": "integer",
                  "format": "int32",
                  "example": 42
                },
                "firstname": {
                  "type": "string",
                  "example": "John"
                },
                "lastname": {
                  "type": "string",
                  "example": "Smith"
                },
                "email": {
                  "type": "string",
                  "example": "john.smith@example.com"
                }
              }
            }
          }
        }
      };

      /*eslint-enable*/
      api.get('/0/accounts/{account_id PARAM GOES HERE}/users')
      .query({
        name: 'DATA GOES HERE',
        limit: 'DATA GOES HERE'
      })
      .set('Content-Type', 'application/json')
      .set('Authorization', process.env.API_KEY)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);

        validator.validate(res.body, schema).should.be.true;
        done();
      });
    });

    it('should respond with default Unexpected Internal...', function(done) {
      /*eslint-disable*/
      var schema = {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "errors": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "code",
                "message"
              ],
              "properties": {
                "code": {
                  "type": "string",
                  "example": "UNEXPECTED_ERROR"
                },
                "message": {
                  "type": "string",
                  "example": "Internal Server error"
                }
              }
            }
          }
        }
      };

      /*eslint-enable*/
      api.get('/0/accounts/{account_id PARAM GOES HERE}/users')
      .query({
        name: 'DATA GOES HERE',
        limit: 'DATA GOES HERE'
      })
      .set('Content-Type', 'application/json')
      .set('Authorization', process.env.API_KEY)
      .expect('DEFAULT RESPONSE CODE HERE')
      .end(function(err, res) {
        if (err) return done(err);

        validator.validate(res.body, schema).should.be.true;
        done();
      });
    });

  });

});
