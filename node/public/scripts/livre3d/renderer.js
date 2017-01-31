/*
 * livre3d.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * The GUI for the Livre project, based on WebGL and three.js
 */

'use strict';

// Constant definitions
const FIELD_OF_VIEW = 75;
const NEAR = 0.1;
const FAR = 1000;
const CAMERA_INITIAL_DISTANCE = 20;

// Setup scene, camera and render
var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(
  FIELD_OF_VIEW,
  window.innerWidth / window.innerHeight,
  NEAR,
  FAR
);
camera.position.z = CAMERA_INITIAL_DISTANCE;

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

function render() {
  requestAnimationFrame( render );
  renderer.render( scene, camera );
}
render();

// Resize canvas on window resize
// adapted from http://www.rioki.org/2015/04/19/threejs-resize-and-canvas.html
window.addEventListener('resize', function () {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
