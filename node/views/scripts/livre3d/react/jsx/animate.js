/*
 * animate.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * 3D animations for Livre3D objects.
 * Part of the Livre3D project.
 */

'use strict';

const DEFAULT = {
  duration: 200
};

var outRotateFade = function (object, options, callback) {
  // Adapted from
  // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame

  // Check parameters
  if (typeof options === 'object') {
    if (typeof options.duration !== 'number')
      options.duration = DEFAULT.duration;
  } else if (typeof options === 'function') {
    callback = options;
    options = DEFAULT;
  } else
    options = DEFAULT;


  var start = null;

  function fadeOut (object, percentage) {
    if (object.children && object.children.length > 0) {
      for (let child of object.children) {
        if (child.material) {
          child.material.transparent = true;
          child.material.opacity = 1 - percentage/100;
        }
        fadeOut(child);
      }
    }
  };

  function step (timestamp) {
    if (!start) start = timestamp;
    var progress = timestamp - start;
    object.rotation.x = progress * 20 / options.duration * (Math.PI / 180);

    fadeOut(object, progress * 100 / options.duration);

    if (progress < options.duration)
      window.requestAnimationFrame(step);
    else
      callback();
  }

  window.requestAnimationFrame(step);

};

module.exports = {
  outRotateFade: outRotateFade
};
