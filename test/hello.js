const should = require('chai').should();
const request = require('supertest');

describe('hello', () => {
  const hello = require('../src/hello');
  const app = require('express')();
  hello.mount(app);

  describe('GET /', () => {
    it('should return a default string', done => {
      request(app).get('/')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body.should.eql('Hello, stranger!');
          done();
        });
    });
    it('should accept a name parameter', done => {
      request(app)
        .get('/')
        .query({
          name: 'Scott'
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body.should.eql('Hello, Scott!');
          done();
        });
    });
  });
});
