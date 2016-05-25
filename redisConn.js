var redis = require('redis');
var Promise = require('bluebird');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

var env = process.env.NODE_ENV || 'development';

var client;
if (env === 'development') { // 开发环境连接本机 Redis Server
  client = redis.createClient();
} else { // 其他环境使用环境变量的链接字符串连接 Redis Server
  client = redis.createClient(process.env.REDIS_URL_test);
}

// 建议增加 client 的 on error 事件处理，否则可能因为网络波动或 redis server 主从切换等原因造成短暂不可用导致应用进程退出。
client.on('error', function(err) {
  return console.error('redis err: %s', err);
});

module.exports = client;
