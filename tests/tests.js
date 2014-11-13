describe('logger tests', function(){
  var net = require('net');
  var should = require('should');
  var plugin = require('../index');
  var schema = require('./schema');
  var joi = require('joi');
  var events = [];
  var logs = [];
  var p = {
    events: {
      on: function(type, handler){
        events.push({ type: type, handler: handler })
      }
    },
    log: function(){}
  };

  before(function(done){
    plugin.register(p, {}, done);
  });

  it('should register the plugin', function(){
    events.length.should.eql(3);
    events[0].type.should.eql('tail');
    events[1].type.should.eql('log');
    events[2].type.should.eql('internalError');
  });

  it('should handle a request', function(done){
    var log = console.log
    console.log = function(l){ logs.push(JSON.parse(l)); };
    events[0].handler({
      method: 'get',
      path: '/foo',
      query: {
        flarg: 'glarg'
      },
      response: {
        statusCode: 200
      },
      info: {
        received: Date.now()
      },
      getLog: function(){ return []; },
      headers: {
        "ot-requestid": "abcd-1234-abcd-1234",
        "user-agent": "tests",
        "ot-userid": "user1234",
        "ot-sessionid": "1234-abcd-1234-abcd",
        "ot-referringhost": "referringhost",
        "ot-referringservice": "referringservice",
        "accept-language": "en-GB,en;q=0.8"
      }
    });

    joi.validate(logs[0], schema.request, function(err){
      console.log = log;
      done(err);
    });
  });

  it('should handle a log', function(done){
    var log = console.log
    console.log = function(l){ logs.push(JSON.parse(l)); };
    events[1].handler({
      data: {
        somestuff: 'blarg'
      },
      tags: ['tag1', 'tag2']
    });

    joi.validate(logs[1], schema.log, function(err){
      console.log = log;
      done(err);
    });
  });

  it('should handle an error', function(done){
    var log = console.log
    console.log = function(l){ logs.push(JSON.parse(l)); };
    events[2].handler({}, {
      message: 'ohes noes it borked'
    });

    joi.validate(logs[2], schema.error, function(err){
      console.log = log;
      done(err);
    });
  });
});
