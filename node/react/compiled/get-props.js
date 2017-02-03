/*
 * get-props.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Calls back with properties for react-canvas components, with default settings
 * This function is asynchronous because image component props should only be
 * passed over after the image has loaded.
 */

'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const DEFAULT_WIDTH = 512;
const DEFAULT_HEIGHT = 128;
const DEFAULT_COLOR = 'black';
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_LINE_HEIGHT = 20;
const DEFAULT_TOP = 0;
const DEFAULT_LEFT = 0;

module.exports = function (setup, callback) {

  var props = {};

  for (let key in setup) {

    let type = setup[key].type;

    let config = {
      style: typeof setup[key].style === 'object' ? setup[key].style : {}
    };

    if (setup[key].src) {
      toDataUrl(setup[key].src, function (dataUrl) {
        config.src = dataUrl;
        props[key] = makeProps(type, config);
        if (Object.keys(props).length === Object.keys(setup).length) callback(props);
      });
    } else {
      props[key] = makeProps(type, config);
      if (Object.keys(props).length === Object.keys(setup).length) callback(props);
    }
  }
};

function deconstruct(props) {
  let allProps = _objectWithoutProperties(props, []);
  return _extends({}, allProps);
};

function makeProps(type, config) {

  let style = config.style || {};

  switch (type) {

    case 'surface':
      config.top = style.top || DEFAULT_TOP;
      config.left = style.left || DEFAULT_LEFT;
      config.width = style.width || DEFAULT_WIDTH;
      config.height = style.height || DEFAULT_HEIGHT;

      if (config.style) delete config.style;
      break;

    case 'image':
    case 'text':
      config.style = style || {};
      config.style.top = style.top || DEFAULT_TOP;
      config.style.left = style.left || DEFAULT_LEFT;
      config.style.width = style.width || DEFAULT_WIDTH;
      config.style.height = style.height || DEFAULT_HEIGHT;

      if (type === 'text') {
        config.style.lineHeight = style.lineHeight || DEFAULT_LINE_HEIGHT;
        config.style.fontSize = style.fontSize || DEFAULT_FONT_SIZE;
        config.style.color = style.color || DEFAULT_COLOR;
      }
      break;
  }

  return deconstruct(config);
};

// Copied from http://stackoverflow.com/questions/6150289/how-to-convert-image-into-base64-string-using-javascript
function toDataUrl(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    var reader = new FileReader();
    reader.onloadend = function () {
      callback(reader.result);
    };
    reader.readAsDataURL(xhr.response);
  };
  xhr.open('GET', url);
  xhr.responseType = 'blob';
  xhr.send();
};