'use strict';

var React = require('react');

const Render3D = require('./render3d.js');

const SurfaceFactory = require('./surface-factory.js');
const ImageFactory = require('./image-factory.js');

var surface = SurfaceFactory();
var image = ImageFactory();

var Component = React.createClass({
  displayName: 'Component',

  render: function () {
    return React.createElement(
      surface.component,
      {
        width: surface.options.width,
        height: surface.options.height
      },
      React.createElement(image.component, { style: image.options.style, src: image.options.src })
    );
  }
});

Render3D(React.createElement(Component, null));