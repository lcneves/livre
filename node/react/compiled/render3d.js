'use strict';

const DEFAULT_WIDTH = 512;
const DEFAULT_HEIGHT = 128;
// The canvas size in pixels will be divided by this factor to obtain the
// geometry dimensions
const DEFAULT_SIZE_RATIO = 100;
const DEFAULT_POSITION = {
  x: 0,
  y: 0,
  z: 13
};

var React = require('react');
var ReactDOM = require('react-dom');

module.exports = function (Component, options) {

  var reactContainer;
  var texture;

  // Configurations
  let config = options ? options : {};
  if (!config.width) config.width = DEFAULT_WIDTH;
  if (!config.height) config.height = DEFAULT_HEIGHT;
  if (!config.sizeRatio) config.sizeRatio = DEFAULT_SIZE_RATIO;
  if (!config.position) config.position = DEFAULT_POSITION;

  class Component3D extends Component {
    componentDidMount() {
      // Create and render three.js object based on the canvas just rendered
      let canvas = reactContainer.childNodes[0];
      texture = new THREE.Texture(canvas);

      let geometry = new THREE.PlaneGeometry(config.width / config.sizeRatio, config.height / config.sizeRatio);

      let material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
      });
      material.transparent = true;

      let mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = config.position.x;
      mesh.position.y = config.position.y;
      mesh.position.z = config.position.z;

      scene.add(mesh);

      texture.needsUpdate = true;

      // We don't need the hidden container any longer
      document.body.removeChild(reactContainer);
    }

    componentDidUpdate() {
      texture.needsUpdate = true;
    }
  };

  // Create hidden container and pass it to react for rendering
  reactContainer = document.createElement('div');
  reactContainer.className = 'reactContainer';
  document.body.appendChild(reactContainer);
  ReactDOM.render(React.createElement(Component3D, null), reactContainer);
};