var router = require('express').Router();
var AV = require('leanengine');

router.get('/', function(req, res) {
  var query = new AV.Query('_User');
  query.find().then(function(datas) {
    res.render('index', { isInitUsers: datas.length >= 8 });
  });
});

router.post('/initUsers', function(req, res, next) {
  var users = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十'].map(function(username) {
    var user = new AV.Object('_User');
    user.set('username', username);
    user.set('password', '123@abc');
    return user;
  });
  AV.Object.saveAll(users).then(function() {
    res.redirect('/');
  }).catch(function(err) {
    next(err);
  });
});

module.exports = router;
