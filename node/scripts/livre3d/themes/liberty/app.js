/*
 * app.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Liberty theme for Livre's Livre3D engine.
 * Uses three.js and react-canvas.
 */

'use strict';


const THREE = require('three');

const fontLoader = new THREE.FontLoader();
const jsonLoader = new THREE.JSONLoader();

// Constant definitions
const WORLD_WIDTH = 100;
const CAMERA_FOV = 30;
// At z=0, the screen fits x=WORLD_WIDTH.
const CAMERA_DISTANCE =
    WORLD_WIDTH / (2 * Math.tan(CAMERA_FOV / 2 * Math.PI / 180 ));
const CAMERA_FAR = 2 * CAMERA_DISTANCE;
const CAMERA_NEAR = 0.5 * CAMERA_DISTANCE;

class Camera extends THREE.PerspectiveCamera {
  constructor(width, height) {
    const aspectRatio = width / height;

    super(
      CAMERA_FOV,
      aspectRatio,
      CAMERA_NEAR,
      CAMERA_FAR
    );

    console.dir(this);

    this.position.z = CAMERA_DISTANCE;
  }

  update(width, height) {
    const aspectRatio = width / height;
    this.aspect = aspectRatio;
    this.updateProjectionMatrix();
  }
}

class Scene extends THREE.Scene {
  constructor() {
    super();
    this.background = new THREE.Color(0xffffff);
  }
}

class Body extends THREE.Object3D {
  constructor() {
    const POSITION_Z = 0;

    super();
    this.position.z = POSITION_Z;
  }
}

class Lights extends THREE.Object3D {
  constructor() {
    super();

    this.add(new THREE.AmbientLight());
    this.add(new THREE.DirectionalLight({
      position: (1, 1, 1),
      color: 0xffffff
    }));
  }
}

var makeLogo = new Promise((resolve, reject) => {
  fontLoader.load('/public/liberty/fonts/gentilis_regular.typeface.json',
      (font) => {
    var geometry = new THREE.TextGeometry('Livre', {
      font: font,
      size: 4,
      height: 1,
      curveSegments: 12
    });
    var material = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
    var logo = new THREE.Mesh( geometry, material );

    logo.position.x = -100;

    resolve(logo);
  });
});

var makeMenu = new Promise((resolve, reject) => {
  jsonLoader.load('/public/liberty/objects/menu_icon.json',
      (geometry, materials) => {
    var material = new THREE.MeshPhongMaterial( { color: 0x333333 } );
    var icon = new THREE.Mesh( geometry, material );

    resolve(icon);
  });
});


module.exports = {
  Scene: Scene,
  Body: Body,
  Camera: Camera,
  Lights: Lights,
  makeLogo: makeLogo,
  makeMenu: makeMenu
};

