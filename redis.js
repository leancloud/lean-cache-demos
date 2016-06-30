var redis = require('redis');
var Promise = require('bluebird');

// 使用 bluebird 为 node-redis 添加 Promise 接口
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

function createClient() {
  // 本地环境下此环境变量为 undefined, node-redis 会链接到默认的 127.0.0.1:6379
  var redisClient = redis.createClient(process.env.REDIS_URL_test);

  // 建议增加 redisClient 的 on error 事件处理，否则可能因为网络波动或 redis server 主从切换等原因造成短暂不可用导致应用进程退出。
  redisClient.on('error', function(err) {
    return console.error('redis err: %s', err);
  });

  return redisClient;
}

module.exports = {
  redisClient: createClient(),
  createClient: createClient
};
