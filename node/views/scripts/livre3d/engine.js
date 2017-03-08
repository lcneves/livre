/*
 * livre3d.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * The GUI for the Livre project, based on WebGL and three.js
 */

'use strict';

const THREE = require('three');

// Constant definitions
const NEAR = 1;
const FAR = 100;
const CAMERA_INITIAL_DISTANCE = 50;
const WORLD_WIDTH = 100;

var width, height, aspectRatio, pixelToWorldRatio;

function setViewportParameters () {
  width = window.innerWidth;
  height = window.innerHeight;
  aspectRatio = width / height;
  pixelToWorldRatio = width / WORLD_WIDTH;
};
setViewportParameters();

// Setup scene, camera and render
var scene = new THREE.Scene();

var camera = new THREE.OrthographicCamera(
  -WORLD_WIDTH / 2,
  WORLD_WIDTH / 2,
  WORLD_WIDTH / (2 * aspectRatio),
  -WORLD_WIDTH / (2 * aspectRatio),
  NEAR,
  FAR
);
camera.position.z = CAMERA_INITIAL_DISTANCE;

var renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize( width, height );
document.body.appendChild( renderer.domElement );

function render() {
  requestAnimationFrame( render );
  renderer.render( scene, camera );
}
render();

// Resize canvas on window resize
window.addEventListener('resize', function () {
  setViewportParameters();
  renderer.setSize(width, height);
  camera.left = -WORLD_WIDTH / 2;
  camera.right = WORLD_WIDTH / 2;
  camera.top = WORLD_WIDTH / (2 * aspectRatio);
  camera.bottom = -WORLD_WIDTH / (2 * aspectRatio);
  camera.updateProjectionMatrix();
});

module.exports = {
  scene: scene,
  camera: camera,
  renderer: renderer,
  worldWidth: WORLD_WIDTH,
  pixelToWorldRatio: pixelToWorldRatio
};
