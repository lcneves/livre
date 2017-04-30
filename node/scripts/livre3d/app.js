/*
 * app.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Entry point for the Livre client.
 * Initializes the UI with the engine contained in this directory.
 *
 */

'use strict';

require('babel-polyfill');

require('../ui.js')({
  engine: require('./engine.js')
});

