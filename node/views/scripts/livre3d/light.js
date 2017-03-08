const THREE = require('three');
var engine = require('./engine.js');

engine.scene.add(new THREE.AmbientLight());

engine.scene.add(new THREE.DirectionalLight({
  position: (1, 1, 1),
  color: 0xffffff
}));
