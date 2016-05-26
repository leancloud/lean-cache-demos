var router = require('express').Router();
var AV = require('leanengine');
var moment = require('moment');

var redisClient = require('../redisConn');

/*
 * 排行榜缓存示例
 *
 * 排行榜的查询会比较频繁，而且被查询的都是同一份数据，且数据变化则较少，比较适合维护在 LeanCache 中。
 * 这个例子中我们将允许用户提交自己的游戏分数，然后在 LeanCache 中维护一个全部用户的排行榜，
 * 每天凌晨会将前一天的排行归档到云存储中，并清空排行榜。
*/

var Leaderboard = AV.Object.extend('Leaderboard');

/* 提供给用户提交分数的接口 */
router.post('/submit', function(req, res, next) {
  redisClient.zaddAsync(redisLeaderboardKey(), req.body.score, req.body.userId).then(function() {
    res.send();
  }).catch(next);
});

/* 查询排行榜前若干名的接口 */
router.get('/top', function(req, res, next) {
  var limit = req.query.limit || 100;
  redisClient.zrevrangeAsync(redisLeaderboardKey(), 0, limit - 1, 'WITHSCORES').then(function(leaderboard) {
    res.json(parseLeaderboard(leaderboard));
  }).catch(next);
});

/* 用于归档前一天排行榜的定时任务，请在控制台上新建一个每天凌晨一点的定时任务 */
AV.Cloud.define('archiveLeaderboard', function(request, response) {
  var yesterday = moment().subtract(1, 'day');
  // 查询前一天的整个排行榜
  redisClient.zrevrangeAsync(redisLeaderboardKey(yesterday), 0, -1, 'WITHSCORES').then(function(leaderboard) {
    // 保存排行榜到云存储
    return new Leaderboard().save({
      date: yesterday.format('YYYYMMDD'),
      users: parseLeaderboard(leaderboard)
    });
  }).then(function() {
    // 删除 LeanCache 中昨天的排行榜
    return redisClient.delAsync(redisLeaderboardKey(yesterday));
  }).then(function() {
    response.success();
  }, console.error);
});

/* 排行榜存储在 LeanCache 中的键名，按照当前日期存储为一个 ZSET，值是用户 ID */
function redisLeaderboardKey(time) {
  return 'leaderboard:' + moment(time).format('YYYYMMDD');
}

// 将 ZRANGE 的结果解析为 {ranking, userId, score} 这样的对象
function parseLeaderboard(leaderboard) {
  return chunk(leaderboard, 2).map(function(item, index) {
    return {
      ranking: index + 1,
      userId: item[0],
      score: parseInt(item[1])
    };
  });
}

// 将 array 中每 size 个元素包装为一个数组
function chunk(array, size) {
  return array.reduce(function(res, item, index) {
    if (index % size === 0) { res.push([]); }
    res[res.length-1].push(item);
    return res;
  }, []);
}

/*
 * 更进一步
 *
 * - 这个排行榜中只有用户 ID, 你可能需要结合「缓存关联数据示例」来一并显示用户的昵称等信息。
 * - 这个例子中比较的是「最高分」，如果要比较「累计分数」，可以为 ZADD 传递一个 INCR 参数。
 * - 为了防止 archiveLeaderboard 被重复调用，建议在 Leaderboard 的 date 字段上设置唯一索引。
*/

module.exports = router;
