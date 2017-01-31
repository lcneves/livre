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
const worldPath = path.join(__dirname,
    '..', 'resources', 'geo', 'ThreeGeoJSON');
const scriptsPath = path.join(__dirname, 'public', 'scripts');
const stylesheetsPath = path.join(__dirname, 'public', 'stylesheets');

// Setup of utilities
app.set('view engine', 'pug');

// Router begins here
app.get('/', function (req, res) {
  res.render('index', {});
});

app.use('/scripts', express.static(scriptsPath));
app.use('/stylesheets', express.static(stylesheetsPath));

app.use('/world', express.static(worldPath));

// All set, let's listen!
app.listen(PORT, function () {
    console.log('Livre listening on port ' + PORT);
});
