var Captchapng = require('captchapng');
var router = require('express').Router();

var redisClient = require('../redis').redisClient;

router.get('/image', function(req, res, next) {
  var code = parseInt(Math.random() * 9000 + 1000)
  var picture = new Captchapng(80, 30, code);
  picture.color(0, 0, 0, 0);
  picture.color(80, 80, 80, 255);
  var buffer = new Buffer(picture.getBase64(), 'base64');
  console.log(code);
  res.header('Content-Type', 'image/png');
  res.send(buffer);
});

router.post('/verify', function(req, res, next) {

});

module.exports = router;
