'use strict';

const DEFAULT_WIDTH = 512;
const DEFAULT_HEIGHT = 128;
// TODO: Probably a good idea to change this.
const DEFAULT_SRC = 'scripts/livre3d/ghouls.jpg';

var React = require('react');
var ReactCanvas = require('react-canvas');

var Image = ReactCanvas.Image;

module.exports = function (options) {
  let config = options ? options : {};
  if (!config.style) {
    config.style = {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT
    };
  }
  if (!config.src) config.src = DEFAULT_SRC;

  var LivreImage = React.createClass({
    displayName: 'LivreImage',

    render: function () {
      return React.createElement(Image, { style: this.props.style, src: this.props.src });
    }
  });

  return {
    component: LivreImage,
    options: config
  };
};