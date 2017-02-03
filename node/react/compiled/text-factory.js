'use strict';

const DEFAULT_WIDTH = 512;
const DEFAULT_HEIGHT = 128;
const DEFAULT_COLOR = 'black';
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_LINE_HEIGHT = 20;
const DEFAULT_TOP = 0;
const DEFAULT_LEFT = 0;

var React = require('react');
var ReactCanvas = require('react-canvas');

var Text = ReactCanvas.Text;

module.exports = function (options) {
  let config = options ? options : {};
  if (!config.style) config.style = {};
  if (!config.style.width) config.style.width = DEFAULT_WIDTH;
  if (!config.style.height) config.style.height = DEFAULT_HEIGHT;
  if (!config.style.color) config.style.color = DEFAULT_COLOR;
  if (!config.style.fontSize) config.style.fontSize = DEFAULT_FONT_SIZE;
  if (!config.style.lineHeight) config.style.lineHeight = DEFAULT_LINE_HEIGHT;
  if (!config.style.top) config.style.top = DEFAULT_TOP;
  if (!config.style.left) config.style.left = DEFAULT_LEFT;

  var LivreText = React.createClass({
    displayName: 'LivreText',

    render: function () {
      return React.createElement(
        Text,
        { style: this.props.style },
        'Take this text!'
      );
    }
  });

  return {
    component: LivreText,
    options: config
  };
};