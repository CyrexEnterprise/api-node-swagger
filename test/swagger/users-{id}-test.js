'use strict';
var chai = require('chai');
var ZSchema = require('z-schema');
var validator = new ZSchema({});
var supertest = require('supertest');
var api = supertest('http://localhost:8000'); // supertest init;

chai.should();

require('dotenv').load();

describe('/users/{id}', function() {
  describe('patch', function() {
    it('should respond with 200 Successful', function(done) {
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
      api.patch('/0/users/1')
      .set('Content-Type', 'application/json')
      .set('Authorization', process.env.API_KEY)
      .send({
        body: 'DATA GOES HERE'
      })
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);

        validator.validate(res.body, schema).should.be.true;
        done();
      });
    });

    it('should respond with 404 Resource Not Found', function(done) {
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
                  "example": "NOT_FOUND"
                },
                "message": {
                  "type": "string",
                  "example": "Not found"
                }
              }
            }
          }
        }
      };

      /*eslint-enable*/
      api.patch('/0/users/1')
      .set('Content-Type', 'application/json')
      .set('Authorization', process.env.API_KEY)
      .send({
        body: 'DATA GOES HERE'
      })
      .expect(404)
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
      api.patch('/0/users/1')
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

  describe('delete', function() {
    it('should respond with 204 Successful, returns no...', function(done) {
      api.del('/0/users/1')
      .set('Content-Type', 'application/json')
      .set('Authorization', process.env.API_KEY)
      .expect(204)
      .end(function(err, res) {
        if (err) return done(err);

        res.body.should.equal(null); // non-json response or no schema
        done();
      });
    });

    it('should respond with 404 Resource Not Found', function(done) {
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
                  "example": "NOT_FOUND"
                },
                "message": {
                  "type": "string",
                  "example": "Not found"
                }
              }
            }
          }
        }
      };

      /*eslint-enable*/
      api.del('/0/users/1')
      .set('Content-Type', 'application/json')
      .set('Authorization', process.env.API_KEY)
      .expect(404)
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
      api.del('/0/users/1')
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
