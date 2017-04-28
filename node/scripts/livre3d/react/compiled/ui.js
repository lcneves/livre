const THREE = require('three');
var scene = require('../../engine.js').scene;

const POSITION_Z = 0;

var ui = new THREE.Object3D();
ui.position.z = POSITION_Z;

scene.add(ui);

module.exports = ui;