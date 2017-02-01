'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var ReactCanvas = require('react-canvas');

var Surface = ReactCanvas.Surface;
var Image = ReactCanvas.Image;
var Layer = ReactCanvas.Layer;
var Text = ReactCanvas.Text;

var MyComponent = React.createClass({
  displayName: 'MyComponent',


  render: function () {
    var surfaceWidth = 400;
    var surfaceHeight = 400;
    var imageStyle = this.getImageStyle();
    var textStyle = this.getTextStyle();
    var layerStyle = this.getLayerStyle();

    return React.createElement(
      Surface,
      { width: surfaceWidth, height: surfaceHeight, left: 0, top: 0 },
      React.createElement(Image, { style: imageStyle, src: 'http://images.mentalfloss.com/sites/default/files/styles/article_640x430/public/catffaceheader.jpg' }),
      React.createElement(
        Text,
        { style: textStyle },
        'Here is some text below an image.'
      )
    );
  },

  getImageHeight: function () {
    return 200;
  },

  getImageStyle: function () {
    return {
      top: 0,
      left: 0,
      width: 400,
      height: this.getImageHeight()
    };
  },

  getLayerStyle: function () {
    return {
      backgroundColor: '#ffdddd'
    };
  },

  getTextStyle: function () {
    return {
      top: this.getImageHeight() + 20,
      left: 0,
      width: 400,
      height: 40,
      lineHeight: 40,
      fontSize: 24,
      color: 'pink'
    };
  }

});

var reactContainer = document.createElement('div');
reactContainer.id = 'exampleReactContainer';
reactContainer.className = 'reactContainer';
document.body.appendChild(reactContainer);

ReactDOM.render(React.createElement(MyComponent, null), document.getElementById('exampleReactContainer'));