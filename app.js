'use strict';
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var AV = require('leanengine');

var app = express();

// 设置 view 引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(AV.express());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', require('./routes/index'));
app.use('/money-package', require('./routes/money-package'));
app.use('/associated-data', require('./routes/associated-data'));
app.use('/leaderboard', require('./routes/leaderboard'));
app.use('/task-queue', require('./routes/task-queue'));
app.use('/redlock', require('./routes/redlock'));
app.use('/readonly', require('./routes/readonly'));
app.use('/captcha', require('./routes/captcha'));

app.use(function(err, req, res, next) { // jshint ignore:line
  var statusCode = err.status || 500;
  if (statusCode === 500) {
    console.error(err.stack || err);
  }
  res.status(statusCode).render('error', {
    message: err.message || err,
    error: err
  });
});

module.exports = app;
