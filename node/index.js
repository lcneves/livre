/*
 * index.js
 * Node.js entry-point for the Livre app.
 *
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0:
 *   http://www.apache.org/licenses/LICENSE-2.0
 */

'use strict';

// Requirements
const path = require('path');
var express = require('express');
var app = express();

// Constant definitions
const PORT = 34567;
const STATIC_PATHS = [
  {
    get: '/world',
    dir: path.join(__dirname, '..', 'resources', 'geo', 'ThreeGeoJSON')
  },
  {
    get: '/scripts',
    dir: path.join(__dirname, 'public', 'scripts')
  },
  {
    get: '/stylesheets',
    dir: path.join(__dirname, 'public', 'stylesheets')
  },
  {
    get: '/images',
    dir: path.join(__dirname, 'public', 'images')
  }
];

// Setup of utilities
app.set('view engine', 'pug');

// Router begins here
app.get('/', function (req, res) {
  res.render('index', {});
});

for (let path of STATIC_PATHS) {
  app.use(path['get'], express.static(path['dir']));
}

// All set, let's listen!
app.listen(PORT, function () {
    console.log('Livre listening on port ' + PORT);
});
