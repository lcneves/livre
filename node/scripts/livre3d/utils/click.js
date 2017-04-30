/*
 * click.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Handles clicks to 3D objects.
 * Part of the Livre3D project.
 * Click handling adapted from:
 * https://threejs.org/examples/canvas_interactive_cubes.html .
 */

'use strict';

module.exports = function (THREE, renderer, camera, body) {

  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();

  document.addEventListener( 'click', onDocumentClick, false );

  function onDocumentClick (event) {
    event.preventDefault();

    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    // true means recursive to children
    var intersects = raycaster.intersectObjects(body.children, true);

    // TODO: Handle cases that a clickable object is hidden behind a
    // non-clickable object
    if ( intersects.length > 0 &&
        typeof intersects[0].object.onClick === 'function' ) {
      intersects[0].object.onClick();
    }
  }

};
