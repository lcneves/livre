/*
 * objects.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Adds and removes 3D objects to other objects.
 * Also handles clicks to these objects.
 * Part of the Livre3D project.
 * Click handling adapted from:
 * https://threejs.org/examples/canvas_interactive_cubes.html .
 */

'use strict';

const THREE = require('three');
var engine = require('../../engine.js');
var renderer = engine.renderer;
var camera = engine.camera;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var clickables = [];

document.addEventListener( 'click', onDocumentClick, false );

function onDocumentClick (event) {
  event.preventDefault();

  mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

  raycaster.setFromCamera( mouse, camera );

  var intersects = raycaster.intersectObjects( clickables );

  if ( intersects.length > 0 &&
      typeof intersects[0].object.onClick === 'function' ) {
    intersects[0].object.onClick();
  }
};

var addObject = function (object, parent) {
  if (typeof object.onClick === 'function')
    addToClickables(object);

  parent.add(object);
};

var removeObject = function (object, parent) {
  let index = parent.children.indexOf(object);
  if (index !== -1) {
    removeFromClickables(object);
    parent.children.splice(index, 1);
  }
};


function addToClickables (object) {
  clickables.push(object);
};

function removeFromClickables (object) {

  for (let i = 0; i < object.children.length; i++)
    removeFromClickables(object.children[i]);

  if (typeof object.onClick === 'function') { //Optimization
    let index = clickables.indexOf(object);
    if (index !== -1)
      clickables.splice(index, 1);
  }
};

module.exports = {
  add: addObject,
  remove: removeObject
};
