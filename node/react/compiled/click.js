/*
 * click.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Handles clicks on 3D objects to the object's 'onClick' function.
 * Part of the Livre3D project.
 * Adapted from https://threejs.org/examples/canvas_interactive_cubes.html .
 */

'use strict';

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var clickables = [];

document.addEventListener('mousedown', onDocumentMouseDown, false);

function onDocumentMouseDown(event) {
  event.preventDefault();

  mouse.x = event.clientX / renderer.domElement.clientWidth * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(clickables);
  console.dir(intersects);

  if (intersects.length > 0 && typeof intersects[0].object.onClick === 'function') {
    intersects[0].object.onClick();
  }
};

var addToClickables = function (object) {
  clickables.push(object);
};

var removeFromClickables = function (object) {
  let index = clickables.indexOf(object);
  if (index !== -1) clickables.splice(index, 1);
};

module.exports = {
  add: addToClickables,
  remove: removeFromClickables
};