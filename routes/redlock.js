var router = require('express').Router();
var Promise = require('bluebird');
var AV = require('leanengine');

var redisClient = require('../redis').redisClient;

router.get('/', function(req, res, next) {
  redisClient.getAsync('some-lock').then(function(workerId) {
    res.json({
      lockedBy: workerId
    });
  }).catch(next);
});

function worker() {
  var workerId = ['some-lock', os.hostname(), process.pid, _.uniqueId()].join(':');

  redisClient.setAsync('some-lock', taskId, 'EX', 5, 'NX').then(function(result) {
    if (result) {
      console.log(workerId, 'got lock');
      return Promise.delay(Math.random() * 1000).then(function() {
        console.log(workerId, 'release lock');
      }).finally(function() {
        redisClient.delAsync('some-lock').catch(function(err) {
          console.error(err.stack);
        });
      });
    } else {
      console.log(workerId, 'fail to get lock');
    }
  }).catch(function(err) {
    console.error(err.stack);
  });
}

setInterval(worker, 500);
setInterval(worker, 1000);

module.exports = router;
