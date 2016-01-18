const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.should();
chai.use(sinonChai);

describe('log', () => {
  const log = require('../src/log');
  const logger = log.createLogger({
    levels: {
      debug: 1,
      verbose: 0
    },
    middleware: {
      requestWhitelist: ['ip']
    },
    transports: [
      {
        type: 'Console',
        options: {
          name: 'debug',
          level: 'debug',
          silent: true
        }
      },
      {
        type: 'File',
        options: {
          filename: 'test.log',
          level: 'verbose',
          silent: true
        }
      }
    ]
  });

  it('should throw error on missing transports', () => {
    expect(log.createLogger).to.throw('missing configuration transports');
  });
  it('should throw error on missing transport options', () => {
    expect(log.createLogger.bind(null, {transports: [{}]}))
      .to.throw('missing transport options or type');
  });
  it('should throw error on missing transport type', () => {
    expect(log.createLogger.bind(null, {
      transports: [{
        type: 'notThere',
        options: {}
      }]
    })).to.throw('missing transport type: notThere');
  });
  describe('.promise[level] promised logging', function promised() {
    const self = this;
    self.timeout(40);


    it('should be called once for single transport for given level', done => {
      const spy = sinon.spy();
      logger.on('logging', spy);
      logger.promise.debug('debug test').then(() => {
        spy.should.have.callCount(1);
        setTimeout(() => {
          spy.should.have.callCount(1);
          done();
        }, 25);
      });
    });
    it('should resolve immediately on no transports', function insta(done) {
      this.timeout(0);
      const spy = sinon.spy();
      const otherLogger = log.createLogger({
        levels: {
          debug: 1,
          verbose: 0
        },
        transports: [
          {
            type: 'Console',
            options: {
              name: 'other',
              level: 'debug',
              silent: true
            }
          }
        ]
      });
      Object.keys(otherLogger.transports).should.have.length(1);
      otherLogger.remove(otherLogger.transports.other);
      Object.keys(otherLogger.transports).should.have.length(0);
      otherLogger.promise.debug('debug test').then(() => {
        spy();
        spy.should.have.callCount(1);
        done();
      });
      spy.should.have.callCount(0);
    });

    it('should be called twice for level with both transports', done => {
      const spy = sinon.spy();
      logger.on('logging', spy);
      logger.promise.verbose('verbose test').then(() => {
        spy.should.have.callCount(2);
        setTimeout(() => {
          spy.should.have.callCount(2);
          done();
        }, 25);
      });
    });
  });

  describe('.middleware', () => {
    it('should return function', () => {
      logger.middleware().should.be.a('function');
    });
  });

  describe('.middlewareError', () => {
    it('should return function', () => {
      logger.middlewareError().should.be.a('function');
    });
  });
});
