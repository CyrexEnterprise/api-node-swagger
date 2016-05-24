'use strict';
var chai = require('chai');
var ZSchema = require('z-schema');
var validator = new ZSchema({});
var supertest = require('supertest');
var api = supertest('http://localhost:8000'); // supertest init;

chai.should();

require('dotenv').load();

describe('/accounts', function() {
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
                "name"
              ],
              "properties": {
                "id": {
                  "type": "integer",
                  "format": "int32",
                  "example": 42
                },
                "name": {
                  "type": "string",
                  "example": "AccountName"
                }
              }
            }
          }
        }
      };

      /*eslint-enable*/
      api.get('/0/accounts')
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
      api.get('/0/accounts')
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
