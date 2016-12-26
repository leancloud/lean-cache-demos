var router = require('express').Router();
var _ = require('underscore');
var bluebird = require('bluebird');
var debug = require('debug')('app');

var AV = require('leanengine');
var redisConn = require('../redis').redisClient;

var MoneyPackage = AV.Object.extend('MoneyPackage');
var User = AV.Object.extend('_User');

router.get('/', function(req, res, next) {
  var query = new AV.Query(MoneyPackage);
  query.limit(10);
  query.addDescending('createdAt');
  query.find().then(function(pkgs) {
    res.render('money-package', {
      moneyPackages: pkgs
    });
  }).catch(function(err) {
    if (err.code === 101) {
      res.render('money-package/index', {
        moneyPackages: []
      });
    }
    next(err);
  });
});

router.post('/generate', function(req, res, next) {
  var pkgs = generateMoneyPackages(parseFloat(req.body.total), parseFloat(req.body.count));
  new MoneyPackage().save({
    total: req.body.total,
    count: req.body.count,
    packages: pkgs,
    status: 'init'
  }).then(function() {
    res.redirect('/money-package');
  });
});

/**
 * 将指定红包置于“就绪”状态。
 * 将需要的信息都保存在 Redis 中，保证抢红包期间不会有任何存储服务的操作，
 * 这样可以极大提高应用在高并发时的响应速度。
 */
router.post('/:id/ready', function(req, res, next) {
  var query = new AV.Query(MoneyPackage);
  query.get(req.params.id).then(function(moneyPackage) {
    return redisConn.hsetAsync('moneyPackages', req.params.id, JSON.stringify({
      id: moneyPackage.id,
      total: moneyPackage.get('total'),
      count: moneyPackage.get('count'),
      packages: moneyPackage.get('packages')
    }));
  }).then(function() {
    var moneyPackage = AV.Object.createWithoutData('MoneyPackage', req.params.id);
    moneyPackage.set('status', 'ready');
    return moneyPackage.save();
  }).then(function() {
    res.redirect('/money-package');
  }).catch(next);
});

router.get('/:id/rush', function(req, res, next) {
  AV.Promise.when([
    redisConn.hgetAsync('moneyPackages', req.params.id),
    new AV.Query(User).find() // 查询 User 只是为了再抢红包时模拟用户身份
  ]).then(function(moneyPackage, users) {
    res.render('money-package/rush', {
      moneyPackage: JSON.parse(moneyPackage),
      users: users
    });
  });
});

router.post('/:id/rush', function(req, res, next) {
  var moneyPackage;
  var multi = redisConn.multi();
  var userId = req.body.user;
  multi.hget('moneyPackages', req.params.id);
  multi.llen('moneyPackages:' + req.params.id);
  multi.execAsync().then(function(datas) {
    moneyPackage = JSON.parse(datas[0]);
    if (moneyPackage.count < datas[1]) { // 如果红包数量小于抢红包队列长度，则说明红包已经抢完
      var err = new Error('红包已抢完');
      err.status = 400;
      throw err;
    }
    return redisConn.rpushAsync('moneyPackages:' + req.params.id, userId);
  }).then(function(newLength) {
    // 即使插入队列成功也不代表抢到红包，因为在上面查询队列长度到添加队列期间可能队列已经被别的请求增加了，
    // 所以根据 Redis 返回的长度判断抢红包是否有效。
    if (moneyPackage.count < newLength) {
      var err = new Error('红包已抢完');
      err.status = 400;
      throw err;
    }
    res.send('恭喜，抢到红包 ' + moneyPackage.packages[newLength - 1] + ' 元');
  }).catch(next);
});

router.post('/:id/done', function(req, res, next) {
  var id = req.params.id;
  bluebird.all([
    new AV.Query(MoneyPackage).get(id),
    redisConn.lrangeAsync('moneyPackages:' + id, 0, -1)
  ]).spread(function(moneyPackage, users) {
    users = users.map(function(id) {
      return AV.Object.createWithoutData('_User', id);
    })
    moneyPackage.set('users', users.slice(0, moneyPackage.get('count')));
    moneyPackage.set('status', 'done');
    return moneyPackage.save();
  }).then(function() {
    return redisConn.delAsync('moneyPackages:' + id);
  }).then(function() {
    res.redirect('/money-package');
  }).catch(next);
})

router.get('/:id/result', function(req, res, next) {
  var id = req.params.id;
  new AV.Query(MoneyPackage).include('users').get(id)
  .then(function(moneyPackage) {
    res.send(moneyPackage);
  })
  .catch(next);
})

var generateMoneyPackages = function(total, count) {
  var result = [];
  var leftMoney = total;
  var leftCount = count;
  var min = 0.01;
  while (leftCount > 1) {
    var max = leftMoney / leftCount * 2;
    var current = Math.random() * (max - min) + min;
    current = current.toFixed(2);
    result.push(current);
    leftMoney -= current;
    leftCount--;
  }
  result.push(leftMoney.toFixed(2));
  debug('generate: total=%d, count=%s, result=%j', total, count, result);
  return result;
};

module.exports = router;
