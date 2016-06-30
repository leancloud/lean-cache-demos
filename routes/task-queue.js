var Promise = require('bluebird');
var router = require('express').Router();

var redisClient = require('../redis').redisClient;
var createClient = require('../redis').createClient;

/*
 * 任务队列示例
 *
 * 这个例子实现了一个跨实例的任务队列，借助 Redis 来分派任务，可以确保同一时间只有指定数量的任务并发执行。
 * 例如我们的程序需要访问一个耗时较长的外部的服务，但为了不给这个外部服务造成过大的压力，我们希望同一时间的并发任务不超过 2 个。
 */

router.post('/createTask', function(req, res, next) {
  redisClient.rpushAsync('task-queue', req.body.name).then(function(length) {
    res.json({
      taskLength: length
    });
  }).catch(next);
});

function createWorker(handler) {
  var redisClient = createClient();

  var worker = function() {
    redisClient.blpopAsync('task-queue', 0).then(function(result) {
      if (result[0]) {
        return handler(result[1]);
      }
    }).catch(function(err) {
      console.error(err.stack);
    }).then(function() {
      worker();
    });
  };

  worker();
}

function handler(name) {
  console.log('begin task', name);
  return Promise.delay(Math.random() * 1000).then(function() {
    console.log('finished task', name);
  });
}

// 创建两个 Worker, 同一时间只会并发执行两个任务。
createWorker(handler);
createWorker(handler);

module.exports = router;
