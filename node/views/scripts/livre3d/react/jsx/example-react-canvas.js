/*
 * example-react-canvas.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Illustrates the making and rendering of a react-canvas
 * component using Livre3D.
 */
'use strict';

const THREE = require('three');
var React = require('react');
var ReactCanvas = require('react-canvas');
var Livre3D = require('./livre3d.js');
var UI = require('./ui.js');

var engine = require('../../engine.js');

var Surface = ReactCanvas.Surface;
var Image = ReactCanvas.Image;
var Text = ReactCanvas.Text;

const WORLD_WIDTH = 50;
const WORLD_HEIGHT = 40;
const WIDTH = WORLD_WIDTH * engine.pixelToWorldRatio;
const HEIGHT = WORLD_HEIGHT * engine.pixelToWorldRatio;

var panel = new THREE.Object3D();

let setup = {
  surface: {
    type: 'surface',
    style: { width: WIDTH, height: HEIGHT }
  },
  image: {
    type: 'image',
    style: {
      width: WIDTH,
      height: WIDTH/4
    },
    src: 'images/ghouls.jpg'
  },
  textA: {
    type: 'text',
    style: {
      top: WIDTH/4,
      color: 'red',
      fontSize: 30,
      lineHeight: 36 }
  },
  textB: {
    type: 'text',
    style: {
      top: 35 * engine.pixelToWorldRatio,
      left: WIDTH/3,
      color: 'yellow',
      fontSize: 24,
      lineHeight: 28 }
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

  Livre3D.render(MyComponent, panel, {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT
  });
});

// Buttons
var buttonRadius = 1;
let geometry = new THREE.SphereGeometry(buttonRadius, 32, 32);

let redMaterial = new THREE.MeshPhongMaterial( {
  color: 0x880000,
  specular: 0x444444
} );
let redSphere = new THREE.Mesh( geometry, redMaterial );
redSphere.position.x = WORLD_WIDTH/2 - buttonRadius;
redSphere.position.y = WORLD_HEIGHT/2 -buttonRadius;

redSphere.onClick = function () {
  console.log('I have been clicked!');
  Livre3D.animate.outRotateFade(panel, function () {
    Livre3D.objects.remove(panel, UI);
  });
};


let greenMaterial = new THREE.MeshPhongMaterial( {
  color: 0x008800,
  specular: 0x444444
});
let greenSphere = new THREE.Mesh( geometry, greenMaterial );
greenSphere.position.x = WORLD_WIDTH/2 - 5 * buttonRadius;
greenSphere.position.y = WORLD_HEIGHT/2 - buttonRadius;
Livre3D.objects.add(redSphere, panel);
Livre3D.objects.add(greenSphere, panel);

Livre3D.objects.add(panel, UI);
