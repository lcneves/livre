'use strict';

const DEFAULT_WIDTH = 512;
const DEFAULT_HEIGHT = 128;

var React = require('react');
var ReactCanvas = require('react-canvas');

var Surface = ReactCanvas.Surface;

var LivreSurface = React.createClass({
  displayName: 'LivreSurface',

  render: function () {
    return React.createElement(Surface, {
      width: this.props.width,
      height: this.props.height,
      left: 0,
      top: 0
    });
  }
});

module.exports = function (options) {
  let config = options ? options : {};
  if (!config.width) config.width = DEFAULT_WIDTH;
  if (!config.height) config.height = DEFAULT_HEIGHT;

  return {
    component: LivreSurface,
    options: config
  };
};