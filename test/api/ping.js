'use strict';

const should = require('chai').should();
const request = require('supertest');

module.exports = api => {
  describe('GET /', () => {
    it('should return a default string', done => {
      request(api).get('/ping')
        .set('Accept', 'application/json')
        .expect(204)
        .end((err, res) => {
          should.not.exist(err);
          res.body.should.eql({});
          done();
        });
    });
  });
};
