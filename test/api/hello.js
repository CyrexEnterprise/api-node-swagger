'use strict';

const should = require('chai').should();
const request = require('supertest');

module.exports = api => {
  describe('GET /', () => {
    it('should return a default string', done => {
      request(api).get('/hello')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body.should.eql({
            message: 'Hello, stranger!'
          });
          done();
        });
    });
    it('should accept a name parameter', done => {
      request(api)
        .get('/hello')
        .query({
          name: 'Scott'
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body.should.eql({
            message: 'Hello, Scott!'
          });
          done();
        });
    });
  });
};
