'use strict';

var ambientLight = new THREE.AmbientLight();
scene.add(ambientLight);
var planeGeometry = new THREE.PlaneGeometry( 5, 5 );
var parent = document.getElementById('exampleReactContainer');
var planeCanvas = parent.childNodes[0];
planeCanvas.getContext('2d');
var planeTexture = new THREE.Texture(planeCanvas);
var planeMaterial = new THREE.MeshBasicMaterial({
  map: planeTexture,
  side: THREE.DoubleSide
});
planeMaterial.transparent = true;
var planeMesh = new THREE.Mesh( planeGeometry, planeMaterial );
planeMesh.position.z = 13;
scene.add(planeMesh);

planeTexture.needsUpdate = true;

document.body.removeChild(parent);

window.setInterval(function () {
      planeMesh.rotateX(0.02);
      planeMesh.rotateY(0.01);
      planeMesh.rotateZ(0.015);
}, 50);
