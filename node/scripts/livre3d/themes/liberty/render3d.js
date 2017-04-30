'use strict';

const DEFAULT_WIDTH = 20;
const DEFAULT_HEIGHT = 10;
// In the future, we might want to scale things down
const DEFAULT_SIZE_RATIO = 1;
const DEFAULT_POSITION = {
  x: 0,
  y: 0,
  z: 0
};

const THREE = require('three');
var React = require('react');
var ReactDOM = require('react-dom');

module.exports = function (Component, parentObject, options) {

  var reactContainer;
  var texture;

  // Configurations
  let config = options ? options : {};
  if (!config.width)
    config.width = DEFAULT_WIDTH;
  if (!config.height)
    config.height = DEFAULT_HEIGHT;
  if (!config.sizeRatio)
    config.sizeRatio = DEFAULT_SIZE_RATIO;
  if (!config.position)
    config.position = DEFAULT_POSITION;

  class Component3D extends Component {
    componentDidMount () {
      console.log('componentDidMount');
      // Create and render three.js object based on the canvas just rendered
      let canvas = reactContainer.childNodes[0];
      texture = new THREE.Texture(canvas);
      // The lines above are needed so that dimensions other than
      // powers of two are accepted as texture
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;

      let geometry = new THREE.PlaneGeometry(
          config.width / config.sizeRatio,
          config.height / config.sizeRatio);

      let material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
      });
      material.transparent = true;

      let mesh = new THREE.Mesh( geometry, material );
      mesh.position.x = config.position.x;
      mesh.position.y = config.position.y;
      mesh.position.z = config.position.z;

      parentObject.add(mesh);

      texture.needsUpdate = true;

      // We don't need the hidden container any longer
      document.body.removeChild(reactContainer);
    }; 

    componentDidUpdate () {
      console.log('componentDidUpdate');
      texture.needsUpdate = true;
    };

    componentWillUpdate () {
      console.log('componentWillUpdate');
    };
    componentWillUnmount () {
      console.log('componentWillUnmount');
    };
  };

  // Create hidden container and pass it to react for rendering
  reactContainer = document.createElement('div');
  reactContainer.className = 'reactContainer';
  document.body.appendChild(reactContainer);
  ReactDOM.render(<Component3D />, reactContainer);
};

