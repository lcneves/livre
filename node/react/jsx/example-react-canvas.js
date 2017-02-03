/*
 * example-react-canvas.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Illustrates the making and rendering of a react-canvas
 * component using Livre3D.
 */
'use strict';

var React = require('react');
var ReactCanvas = require('react-canvas');
var Livre3D = require('./livre3d.js');

var Surface = ReactCanvas.Surface;
var Image = ReactCanvas.Image;
var Text = ReactCanvas.Text;

let setup = {
  surface: {
    type: 'surface',
    style: { width: 512, height: 256 }
  },
  image: {
    type: 'image',
    style: { height: 128 },
    src: 'images/ghouls.jpg'
  },
  textA: {
    type: 'text',
    style: { top: 128, color: 'red' }
  },
  textB: {
    type: 'text',
    style: { top: 150, color: 'yellow', left: 200 }
  }
};

Livre3D.getProps(setup, function (props) {

  class MyComponent extends React.Component {
    render () {
      return (
        <Surface {...props.surface}>
          <Image {...props.image} />
          <Text {...props.textA}>
            Take this!
          </Text>
          <Text {...props.textB}>
            And this!
          </Text>
        </Surface>
      );
    }
  };

  Livre3D.render(MyComponent, { height: 256 });
});

