'use strict';

const WIDTH = 512;
const HEIGHT = 128;

var React = require('react');
var ReactDOM = require('react-dom');
var ReactCanvas = require('react-canvas');

var Surface = ReactCanvas.Surface;
var Text = ReactCanvas.Text;

var TextCanvas = React.createClass({

  render: function () {
    let surfaceWidth = WIDTH;
    let surfaceHeight = HEIGHT;
    let textStyle = this.getTextStyle();

    return (
      <Surface width={surfaceWidth} height={surfaceHeight} left={0} top={0}>
        <Text style={textStyle}>
          {this.props.text}
        </Text>
      </Surface>
    );
  },

  getTextStyle: function () {
    return {
      top: 0,
      left: 0,
      width: WIDTH,
      height: HEIGHT,
      lineHeight: 40,
      fontSize: 24,
      color: 'pink'
    };
  }
});

module.exports = function (text) {
  // Create hidden container and pass it to react-canvas for rendering
  let reactContainer = document.createElement('div');
  reactContainer.className = 'reactContainer';
  document.body.appendChild(reactContainer);
  ReactDOM.render(<TextCanvas text={text} />, reactContainer);
  let canvas = reactContainer.childNodes[0];

  // Create and render three.js object based on the canvas rendered above
  let texture = new THREE.Texture(canvas);
  let geometry = new THREE.PlaneGeometry( WIDTH/100, HEIGHT/100 );
  let material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
  });
  material.transparent = true;
  let mesh = new THREE.Mesh( geometry, material );
  mesh.position.z = 13;
  scene.add(mesh);

  texture.needsUpdate = true;

  // We don't need the hidden container any longer
  document.body.removeChild(reactContainer);
};
