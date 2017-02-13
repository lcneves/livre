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
var UI = require('./ui.js');

var Surface = ReactCanvas.Surface;
var Image = ReactCanvas.Image;
var Text = ReactCanvas.Text;

const WIDTH = 800;

var panel = new THREE.Object3D();

let setup = {
  surface: {
    type: 'surface',
    style: { width: WIDTH, height: WIDTH / 2 }
  },
  image: {
    type: 'image',
    style: {
      width: WIDTH,
      height: WIDTH / 4
    },
    src: 'images/ghouls.jpg'
  },
  textA: {
    type: 'text',
    style: {
      top: WIDTH / 4,
      color: 'red',
      fontSize: 30,
      lineHeight: 36 }
  },
  textB: {
    type: 'text',
    style: {
      top: WIDTH / 3,
      left: WIDTH / 3,
      color: 'yellow',
      fontSize: 24,
      lineHeight: 28 }
  }
};

Livre3D.getProps(setup, function (props) {

  class MyComponent extends React.Component {
    render() {
      return React.createElement(
        Surface,
        props.surface,
        React.createElement(Image, props.image),
        React.createElement(
          Text,
          props.textA,
          'Take this!'
        ),
        React.createElement(
          Text,
          props.textB,
          'And this!'
        )
      );
    }
  };

  Livre3D.render(MyComponent, panel, {
    width: WIDTH,
    height: WIDTH / 2
  });
});

// Buttons
let geometry = new THREE.SphereGeometry(0.1, 32, 32);

let redMaterial = new THREE.MeshPhongMaterial({
  color: 0x880000,
  specular: 0x444444
});
let redSphere = new THREE.Mesh(geometry, redMaterial);
redSphere.position.x = 2.4;
redSphere.position.y = 1.5;

let greenMaterial = new THREE.MeshPhongMaterial({
  color: 0x008800,
  specular: 0x444444
});
let greenSphere = new THREE.Mesh(geometry, greenMaterial);
greenSphere.position.x = 2.7;
greenSphere.position.y = 1.5;
greenSphere.onClick = function () {
  console.log('I have been clicked!');
  Livre3D.objects.remove(panel, UI);
};

Livre3D.objects.add(redSphere, panel);
Livre3D.objects.add(greenSphere, panel);

Livre3D.objects.add(panel, UI);