var router = require('express').Router();
var AV = require('leanengine');

var redisClient = require('../redis').redisClient;

var Category = AV.Object.extend('category');

router.put('/:name', function(req, res, next) {
  new AV.Query(Category).equalTo(name, req.params.name).find().then(function(category) {
    if (category) {
      return category.save(req.body);
    } else {
      return new Category().save(req.body);
    }
  }).catch(next);
});

router.get('/', function(req, res, next) {
  redisClient.hgetallAsync('categories').then(function(categories) {
    res.json(_.map(categories, JSON.parse));
  }).catch(next);
});

AV.Cloud.afterUpdate('Category', function(request) {
  redisClient.hsetAsync('categories', request.object.name, JSON.stringify(request.object)).catch(function(err) {
    console.error(err.stack);
  });
});

AV.Cloud.afterSave('Category', function(request) {
  redisClient.hsetAsync('categories', request.object.name, JSON.stringify(request.object)).catch(function(err) {
    console.error(err.stack);
  });
});

AV.Cloud.define('refreshCategories', function(request, response) {
  new AV.Query(Category).find().then(function(categories) {
    redisClient.hmsetAsync('categories', _.mapObject(_.indexBy(categories, name), JSON.stringify)).then(function() {
      response.success();
    }, function(err) {
      response.error(err.stack);
    });
  }).catch(next);
});
