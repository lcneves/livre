(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

// Note that this class intentionally does not use PooledClass.
// DrawingUtils manages <canvas> pooling for more fine-grained control.

function Canvas (width, height, scale) {
  // Re-purposing an existing canvas element.
  if (!this._canvas) {
    this._canvas = document.createElement('canvas');
  }

  this.width = width;
  this.height = height;
  this.scale = scale || window.devicePixelRatio;

  this._canvas.width = this.width * this.scale;
  this._canvas.height = this.height * this.scale;
  this._canvas.getContext('2d').scale(this.scale, this.scale);
}

Object.assign(Canvas.prototype, {

  getRawCanvas: function () {
    return this._canvas;
  },

  getContext: function () {
    return this._canvas.getContext('2d');
  }

});

// PooledClass:

// Be fairly conserative - we are potentially drawing a large number of medium
// to large size images.
Canvas.poolSize = 30;

module.exports = Canvas;

},{}],2:[function(require,module,exports){
'use strict';

var FontFace = require('./FontFace');
var clamp = require('./clamp');
var measureText = require('./measureText');

/**
 * Draw an image into a <canvas>. This operation requires that the image
 * already be loaded.
 *
 * @param {CanvasContext} ctx
 * @param {Image} image The source image (from ImageCache.get())
 * @param {Number} x The x-coordinate to begin drawing
 * @param {Number} y The y-coordinate to begin drawing
 * @param {Number} width The desired width
 * @param {Number} height The desired height
 * @param {Object} options Available options are:
 *   {Number} originalWidth
 *   {Number} originalHeight
 *   {Object} focusPoint {x,y}
 *   {String} backgroundColor
 */
function drawImage (ctx, image, x, y, width, height, options) {
  options = options || {};

  if (options.backgroundColor) {
    ctx.save();
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }

  var dx = 0;
  var dy = 0;
  var dw = 0;
  var dh = 0;
  var sx = 0;
  var sy = 0;
  var sw = 0;
  var sh = 0;
  var scale;
  var scaledSize;
  var actualSize;
  var focusPoint = options.focusPoint;

  actualSize = {
    width: image.getWidth(),
    height: image.getHeight()
  };

  scale = Math.max(
    width / actualSize.width,
    height / actualSize.height
  ) || 1;
  scale = parseFloat(scale.toFixed(4), 10);

  scaledSize = {
    width: actualSize.width * scale,
    height: actualSize.height * scale
  };

  if (focusPoint) {
    // Since image hints are relative to image "original" dimensions (original != actual),
    // use the original size for focal point cropping.
    if (options.originalHeight) {
      focusPoint.x *= (actualSize.height / options.originalHeight);
      focusPoint.y *= (actualSize.height / options.originalHeight);
    }
  } else {
    // Default focal point to [0.5, 0.5]
    focusPoint = {
      x: actualSize.width * 0.5,
      y: actualSize.height * 0.5
    };
  }

  // Clip the image to rectangle (sx, sy, sw, sh).
  sx = Math.round(clamp(width * 0.5 - focusPoint.x * scale, width - scaledSize.width, 0)) * (-1 / scale);
  sy = Math.round(clamp(height * 0.5 - focusPoint.y * scale, height - scaledSize.height, 0)) * (-1 / scale);
  sw = Math.round(actualSize.width - (sx * 2));
  sh = Math.round(actualSize.height - (sy * 2));

  // Scale the image to dimensions (dw, dh).
  dw = Math.round(width);
  dh = Math.round(height);

  // Draw the image on the canvas at coordinates (dx, dy).
  dx = Math.round(x);
  dy = Math.round(y);

  ctx.drawImage(image.getRawImage(), sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * @param {CanvasContext} ctx
 * @param {String} text The text string to render
 * @param {Number} x The x-coordinate to begin drawing
 * @param {Number} y The y-coordinate to begin drawing
 * @param {Number} width The maximum allowed width
 * @param {Number} height The maximum allowed height
 * @param {FontFace} fontFace The FontFace to to use
 * @param {Object} options Available options are:
 *   {Number} fontSize
 *   {Number} lineHeight
 *   {String} textAlign
 *   {String} color
 *   {String} backgroundColor
 */
function drawText (ctx, text, x, y, width, height, fontFace, options) {
  var textMetrics;
  var currX = x;
  var currY = y;
  var currText;
  var options = options || {};

  options.fontSize = options.fontSize || 16;
  options.lineHeight = options.lineHeight || 18;
  options.textAlign = options.textAlign || 'left';
  options.backgroundColor = options.backgroundColor || 'transparent';
  options.color = options.color || '#000';

  textMetrics = measureText(
    text,
    width,
    fontFace,
    options.fontSize,
    options.lineHeight
  );

  ctx.save();

  // Draw the background
  if (options.backgroundColor !== 'transparent') {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = options.color;
  ctx.font = fontFace.attributes.style + ' ' + fontFace.attributes.weight + ' ' + options.fontSize + 'px ' + fontFace.family;

  textMetrics.lines.forEach(function (line, index) {
    currText = line.text;
    currY = (index === 0) ? y + options.fontSize :
      (y + options.fontSize + options.lineHeight * index);

    // Account for text-align: left|right|center
    switch (options.textAlign) {
      case 'center':
        currX = x + (width / 2) - (line.width / 2);
        break;
      case 'right':
        currX = x + width - line.width;
        break;
      default:
        currX = x;
    }

    if ((index < textMetrics.lines.length - 1) &&
      ((options.fontSize + options.lineHeight * (index + 1)) > height)) {
      currText = currText.replace(/\,?\s?\w+$/, '…');
    }

    if (currY <= (height + y)) {
      ctx.fillText(currText, currX, currY);
    }
  });

  ctx.restore();
}

/**
 * Draw a linear gradient
 *
 * @param {CanvasContext} ctx
 * @param {Number} x1 gradient start-x coordinate
 * @param {Number} y1 gradient start-y coordinate
 * @param {Number} x2 gradient end-x coordinate
 * @param {Number} y2 gradient end-y coordinate
 * @param {Array} colorStops Array of {(String)color, (Number)position} values
 * @param {Number} x x-coordinate to begin fill
 * @param {Number} y y-coordinate to begin fill
 * @param {Number} width how wide to fill
 * @param {Number} height how tall to fill
 */
function drawGradient(ctx, x1, y1, x2, y2, colorStops, x, y, width, height) {
  var grad;

  ctx.save();
  grad = ctx.createLinearGradient(x1, y1, x2, y2);

  colorStops.forEach(function (colorStop) {
    grad.addColorStop(colorStop.position, colorStop.color);
  });

  ctx.fillStyle = grad;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}

module.exports = {
  drawImage: drawImage,
  drawText: drawText,
  drawGradient: drawGradient,
};


},{"./FontFace":7,"./clamp":22,"./measureText":26}],3:[function(require,module,exports){
'use strict';

// Adapted from ReactART:
// https://github.com/reactjs/react-art

var React = require('react');
var ReactMultiChild = require('react/lib/ReactMultiChild');
var emptyObject = require('fbjs/lib/emptyObject');

var ContainerMixin = Object.assign({}, ReactMultiChild.Mixin, {

  /**
   * Moves a child component to the supplied index.
   *
   * @param {ReactComponent} child Component to move.
   * @param {number} toIndex Destination index of the element.
   * @protected
   */
  moveChild: function(child, toIndex) {
    var childNode = child._mountImage;
    var mostRecentlyPlacedChild = this._mostRecentlyPlacedChild;
    if (mostRecentlyPlacedChild == null) {
      // I'm supposed to be first.
      if (childNode.previousSibling) {
        if (this.node.firstChild) {
          childNode.injectBefore(this.node.firstChild);
        } else {
          childNode.inject(this.node);
        }
      }
    } else {
      // I'm supposed to be after the previous one.
      if (mostRecentlyPlacedChild.nextSibling !== childNode) {
        if (mostRecentlyPlacedChild.nextSibling) {
          childNode.injectBefore(mostRecentlyPlacedChild.nextSibling);
        } else {
          childNode.inject(this.node);
        }
      }
    }
    this._mostRecentlyPlacedChild = childNode;
  },

  /**
   * Creates a child component.
   *
   * @param {ReactComponent} child Component to create.
   * @param {object} childNode ART node to insert.
   * @protected
   */
  createChild: function(child, childNode) {
    child._mountImage = childNode;
    var mostRecentlyPlacedChild = this._mostRecentlyPlacedChild;
    if (mostRecentlyPlacedChild == null) {
      // I'm supposed to be first.
      if (this.node.firstChild) {
        childNode.injectBefore(this.node.firstChild);
      } else {
        childNode.inject(this.node);
      }
    } else {
      // I'm supposed to be after the previous one.
      if (mostRecentlyPlacedChild.nextSibling) {
        childNode.injectBefore(mostRecentlyPlacedChild.nextSibling);
      } else {
        childNode.inject(this.node);
      }
    }
    this._mostRecentlyPlacedChild = childNode;
  },

  /**
   * Removes a child component.
   *
   * @param {ReactComponent} child Child to remove.
   * @protected
   */
  removeChild: function(child) {
    child._mountImage.remove();
    child._mountImage = null;
    this.node.invalidateLayout();
  },

  updateChildrenAtRoot: function(nextChildren, transaction) {
    this.updateChildren(nextChildren, transaction, emptyObject);
  },

  mountAndInjectChildrenAtRoot: function(children, transaction) {
    this.mountAndInjectChildren(children, transaction, emptyObject);
  },

  /**
   * Override to bypass batch updating because it is not necessary.
   *
   * @param {?object} nextChildren.
   * @param {ReactReconcileTransaction} transaction
   * @internal
   * @override {ReactMultiChild.Mixin.updateChildren}
   */
  updateChildren: function(nextChildren, transaction, context) {
    this._mostRecentlyPlacedChild = null;
    this._updateChildren(nextChildren, transaction, context);
  },

  // Shorthands

  mountAndInjectChildren: function(children, transaction, context) {
    var mountedImages = this.mountChildren(
      children,
      transaction,
      context
    );

    // Each mount image corresponds to one of the flattened children
    var i = 0;
    for (var key in this._renderedChildren) {
      if (this._renderedChildren.hasOwnProperty(key)) {
        var child = this._renderedChildren[key];
        child._mountImage = mountedImages[i];
        mountedImages[i].inject(this.node);
        i++;
      }
    }
  }

});

module.exports = ContainerMixin;

},{"fbjs/lib/emptyObject":undefined,"react":undefined,"react/lib/ReactMultiChild":undefined}],4:[function(require,module,exports){
'use strict';

var ImageCache = require('./ImageCache');
var FontUtils = require('./FontUtils');
var FontFace = require('./FontFace');
var FrameUtils = require('./FrameUtils');
var CanvasUtils = require('./CanvasUtils');
var Canvas = require('./Canvas');

// Global backing store <canvas> cache
var _backingStores = [];

/**
 * Maintain a cache of backing <canvas> for RenderLayer's which are accessible
 * through the RenderLayer's `backingStoreId` property.
 *
 * @param {String} id The unique `backingStoreId` for a RenderLayer
 * @return {HTMLCanvasElement}
 */
function getBackingStore (id) {
  for (var i=0, len=_backingStores.length; i < len; i++) {
    if (_backingStores[i].id === id) {
      return _backingStores[i].canvas;
    }
  }
  return null;
}

/**
 * Purge a layer's backing store from the cache.
 *
 * @param {String} id The layer's backingStoreId
 */
function invalidateBackingStore (id) {
  for (var i=0, len=_backingStores.length; i < len; i++) {
    if (_backingStores[i].id === id) {
      _backingStores.splice(i, 1);
      break;
    }
  }
}

/**
 * Purge the entire backing store cache.
 */
function invalidateAllBackingStores () {
  _backingStores = [];
}

/**
 * Find the nearest backing store ancestor for a given layer.
 *
 * @param {RenderLayer} layer
 */
function getBackingStoreAncestor (layer) {
  while (layer) {
    if (layer.backingStoreId) {
      return layer;
    }
    layer = layer.parentLayer;
  }
  return null;
}

/**
 * Check if a layer is using a given image URL.
 *
 * @param {RenderLayer} layer
 * @param {String} imageUrl
 * @return {Boolean}
 */
function layerContainsImage (layer, imageUrl) {
  // Check the layer itself.
  if (layer.type === 'image' && layer.imageUrl === imageUrl) {
    return layer;
  }

  // Check the layer's children.
  if (layer.children) {
    for (var i=0, len=layer.children.length; i < len; i++) {
      if (layerContainsImage(layer.children[i], imageUrl)) {
        return layer.children[i];
      }
    }
  }

  return false;
}

/**
 * Check if a layer is using a given FontFace.
 *
 * @param {RenderLayer} layer
 * @param {FontFace} fontFace
 * @return {Boolean}
 */
function layerContainsFontFace (layer, fontFace) {
  // Check the layer itself.
  if (layer.type === 'text' && layer.fontFace && layer.fontFace.id === fontFace.id) {
    return layer;
  }

  // Check the layer's children.
  if (layer.children) {
    for (var i=0, len=layer.children.length; i < len; i++) {
      if (layerContainsFontFace(layer.children[i], fontFace)) {
        return layer.children[i];
      }
    }
  }

  return false;
}

/**
 * Invalidates the backing stores for layers which contain an image layer
 * associated with the given imageUrl.
 *
 * @param {String} imageUrl
 */
function handleImageLoad (imageUrl) {
  _backingStores.forEach(function (backingStore) {
    if (layerContainsImage(backingStore.layer, imageUrl)) {
      invalidateBackingStore(backingStore.id);
    }
  });
}

/**
 * Invalidates the backing stores for layers which contain a text layer
 * associated with the given font face.
 *
 * @param {FontFace} fontFace
 */
function handleFontLoad (fontFace) {
  _backingStores.forEach(function (backingStore) {
    if (layerContainsFontFace(backingStore.layer, fontFace)) {
      invalidateBackingStore(backingStore.id);
    }
  });
}

/**
 * Draw a RenderLayer instance to a <canvas> context.
 *
 * @param {CanvasRenderingContext2d} ctx
 * @param {RenderLayer} layer
 */
function drawRenderLayer (ctx, layer) {
  var customDrawFunc;

  // Performance: avoid drawing hidden layers.
  if (typeof layer.alpha === 'number' && layer.alpha <= 0) {
    return;
  }

  switch (layer.type) {
    case 'image':
      customDrawFunc = drawImageRenderLayer;
      break;

    case 'text':
      customDrawFunc = drawTextRenderLayer;
      break;

    case 'gradient':
      customDrawFunc = drawGradientRenderLayer;
      break;
  }

  // Establish drawing context for certain properties:
  // - alpha
  // - translate
  var saveContext = (layer.alpha !== null && layer.alpha < 1) ||
                    (layer.translateX || layer.translateY);

  if (saveContext) {
    ctx.save();

    // Alpha:
    if (layer.alpha !== null && layer.alpha < 1) {
      ctx.globalAlpha = layer.alpha;
    }

    // Translation:
    if (layer.translateX || layer.translateY) {
      ctx.translate(layer.translateX || 0, layer.translateY || 0);
    }
  }

  // If the layer is bitmap-cacheable, draw in a pooled off-screen canvas.
  // We disable backing stores on pad since we flip there.
  if (layer.backingStoreId) {
    drawCacheableRenderLayer(ctx, layer, customDrawFunc);
  } else {
    // Draw default properties, such as background color.
    ctx.save();
    drawBaseRenderLayer(ctx, layer);

    // Draw custom properties if needed.
    customDrawFunc && customDrawFunc(ctx, layer);
    ctx.restore();

    // Draw child layers, sorted by their z-index.
    if (layer.children) {
      layer.children.slice().sort(sortByZIndexAscending).forEach(function (childLayer) {
        drawRenderLayer(ctx, childLayer);
      });
    }
  }

  // Pop the context state if we established a new drawing context.
  if (saveContext) {
    ctx.restore();
  }
}

/**
 * Draw base layer properties into a rendering context.
 * NOTE: The caller is responsible for calling save() and restore() as needed.
 *
 * @param {CanvasRenderingContext2d} ctx
 * @param {RenderLayer} layer
 */
function drawBaseRenderLayer (ctx, layer) {
  var frame = layer.frame;

  // Border radius:
  if (layer.borderRadius) {
    ctx.beginPath();
    ctx.moveTo(frame.x + layer.borderRadius, frame.y);
    ctx.arcTo(frame.x + frame.width, frame.y, frame.x + frame.width, frame.y + frame.height, layer.borderRadius);
    ctx.arcTo(frame.x + frame.width, frame.y + frame.height, frame.x, frame.y + frame.height, layer.borderRadius);
    ctx.arcTo(frame.x, frame.y + frame.height, frame.x, frame.y, layer.borderRadius);
    ctx.arcTo(frame.x, frame.y, frame.x + frame.width, frame.y, layer.borderRadius);
    ctx.closePath();

    // Create a clipping path when drawing an image or using border radius.
    if (layer.type === 'image') {
      ctx.clip();
    }

    // Border with border radius:
    if (layer.borderColor) {
      ctx.lineWidth = layer.borderWidth || 1;
      ctx.strokeStyle = layer.borderColor;
      ctx.stroke();
    }
  }

  // Border color (no border radius):
  if (layer.borderColor && !layer.borderRadius) {
    ctx.lineWidth = layer.borderWidth || 1;
    ctx.strokeStyle = layer.borderColor;
    ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
  }

  // Shadow:
  ctx.shadowBlur = layer.shadowBlur;
  ctx.shadowColor = layer.shadowColor;
  ctx.shadowOffsetX = layer.shadowOffsetX;
  ctx.shadowOffsetY = layer.shadowOffsetY;

  // Background color:
  if (layer.backgroundColor) {
    ctx.fillStyle = layer.backgroundColor;
    if (layer.borderRadius) {
      // Fill the current path when there is a borderRadius set.
      ctx.fill();
    } else {
      ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
    }
  }
}

/**
 * Draw a bitmap-cacheable layer into a pooled <canvas>. The result will be
 * drawn into the given context. This will populate the layer backing store
 * cache with the result.
 *
 * @param {CanvasRenderingContext2d} ctx
 * @param {RenderLayer} layer
 * @param {Function} customDrawFunc
 * @private
 */
function drawCacheableRenderLayer (ctx, layer, customDrawFunc) {
  // See if there is a pre-drawn canvas in the pool.
  var backingStore = getBackingStore(layer.backingStoreId);
  var backingStoreScale = layer.scale || window.devicePixelRatio;
  var frameOffsetY = layer.frame.y;
  var frameOffsetX = layer.frame.x;
  var backingContext;

  if (!backingStore) {
    if (_backingStores.length >= Canvas.poolSize) {
      // Re-use the oldest backing store once we reach the pooling limit.
      backingStore = _backingStores[0].canvas;
      Canvas.call(backingStore, layer.frame.width, layer.frame.height, backingStoreScale);

      // Move the re-use canvas to the front of the queue.
      _backingStores[0].id = layer.backingStoreId;
      _backingStores[0].canvas = backingStore;
      _backingStores.push(_backingStores.shift());
    } else {
      // Create a new backing store, we haven't yet reached the pooling limit
      backingStore = new Canvas(layer.frame.width, layer.frame.height, backingStoreScale);
      _backingStores.push({
        id: layer.backingStoreId,
        layer: layer,
        canvas: backingStore
      });
    }

    // Draw into the backing <canvas> at (0, 0) - we will later use the
    // <canvas> to draw the layer as an image at the proper coordinates.
    backingContext = backingStore.getContext('2d');
    layer.translate(-frameOffsetX, -frameOffsetY);

    // Draw default properties, such as background color.
    backingContext.save();
    drawBaseRenderLayer(backingContext, layer);

    // Custom drawing operations
    customDrawFunc && customDrawFunc(backingContext, layer);
    backingContext.restore();

    // Draw child layers, sorted by their z-index.
    if (layer.children) {
      layer.children.slice().sort(sortByZIndexAscending).forEach(function (childLayer) {
        drawRenderLayer(backingContext, childLayer);
      });
    }

    // Restore layer's original frame.
    layer.translate(frameOffsetX, frameOffsetY);
  }

  // We have the pre-rendered canvas ready, draw it into the destination canvas.
  if (layer.clipRect) {
    // Fill the clipping rect in the destination canvas.
    var sx = (layer.clipRect.x - layer.frame.x) * backingStoreScale;
    var sy = (layer.clipRect.y - layer.frame.y) * backingStoreScale;
    var sw = layer.clipRect.width * backingStoreScale;
    var sh = layer.clipRect.height * backingStoreScale;
    var dx = layer.clipRect.x;
    var dy = layer.clipRect.y;
    var dw = layer.clipRect.width;
    var dh = layer.clipRect.height;

    // No-op for zero size rects. iOS / Safari will throw an exception.
    if (sw > 0 && sh > 0) {
      ctx.drawImage(backingStore.getRawCanvas(), sx, sy, sw, sh, dx, dy, dw, dh);
    }
  } else {
    // Fill the entire canvas
    ctx.drawImage(backingStore.getRawCanvas(), layer.frame.x, layer.frame.y, layer.frame.width, layer.frame.height);
  }
}

/**
 * @private
 */
function sortByZIndexAscending (layerA, layerB) {
  return (layerA.zIndex || 0) - (layerB.zIndex || 0);
}

/**
 * @private
 */
function drawImageRenderLayer (ctx, layer) {
  if (!layer.imageUrl) {
    return;
  }

  // Don't draw until loaded
  var image = ImageCache.get(layer.imageUrl);
  if (!image.isLoaded()) {
    return;
  }

  CanvasUtils.drawImage(ctx, image, layer.frame.x, layer.frame.y, layer.frame.width, layer.frame.height);
}

/**
 * @private
 */
function drawTextRenderLayer (ctx, layer) {
  // Fallback to standard font.
  var fontFace = layer.fontFace || FontFace.Default();

  // Don't draw text until loaded
  if (!FontUtils.isFontLoaded(fontFace)) {
    return;
  }

  CanvasUtils.drawText(ctx, layer.text, layer.frame.x, layer.frame.y, layer.frame.width, layer.frame.height, fontFace, {
    fontSize: layer.fontSize,
    lineHeight: layer.lineHeight,
    textAlign: layer.textAlign,
    color: layer.color
  });
}

/**
 * @private
 */
function drawGradientRenderLayer (ctx, layer) {
  // Default to linear gradient from top to bottom.
  var x1 = layer.x1 || layer.frame.x;
  var y1 = layer.y1 || layer.frame.y;
  var x2 = layer.x2 || layer.frame.x;
  var y2 = layer.y2 || layer.frame.y + layer.frame.height;
  CanvasUtils.drawGradient(ctx, x1, y1, x2, y2, layer.colorStops, layer.frame.x, layer.frame.y, layer.frame.width, layer.frame.height);
}

module.exports = {
  drawRenderLayer: drawRenderLayer,
  invalidateBackingStore: invalidateBackingStore,
  invalidateAllBackingStores: invalidateAllBackingStores,
  handleImageLoad: handleImageLoad,
  handleFontLoad: handleFontLoad,
  layerContainsImage: layerContainsImage,
  layerContainsFontFace: layerContainsFontFace
};

},{"./Canvas":1,"./CanvasUtils":2,"./FontFace":7,"./FontUtils":8,"./FrameUtils":9,"./ImageCache":13}],5:[function(require,module,exports){
// Penner easing equations
// https://gist.github.com/gre/1650294

var Easing = {

  linear: function (t) {
    return t;
  },

  easeInQuad: function (t) {
    return Math.pow(t, 2);
  },

  easeOutQuad: function (t) {
    return t * (2-t);
  },

  easeInOutQuad: function (t) {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },

  easeInCubic: function (t) {
    return t * t * t;
  },

  easeOutCubic: function (t) {
    return (--t) * t * t + 1;
  },

  easeInOutCubic: function (t) {
    return t < .5 ? 4 * t * t * t : (t-1) * (2*t - 2) * (2*t - 2) + 1;
  }

};

module.exports = Easing;

},{}],6:[function(require,module,exports){
'use strict';

// Supported events that RenderLayer's can subscribe to.

module.exports = {
  onTouchStart: 'touchstart',
  onTouchMove: 'touchmove',
  onTouchEnd: 'touchend',
  onTouchCancel: 'touchcancel',
  onClick: 'click',
  onContextMenu: 'contextmenu',
  onDoubleClick: 'dblclick'
};

},{}],7:[function(require,module,exports){
'use strict';

var _fontFaces = {};

/**
 * @param {String} family The CSS font-family value
 * @param {String} url The remote URL for the font file
 * @param {Object} attributes Font attributes supported: style, weight
 * @return {Object}
 */
function FontFace (family, url, attributes) {
  var fontFace;
  var fontId;

  attributes = attributes || {};
  attributes.style = attributes.style || 'normal';
  attributes.weight = attributes.weight || 400;

  fontId = getCacheKey(family, url, attributes);
  fontFace = _fontFaces[fontId];

  if (!fontFace) {
    fontFace = {};
    fontFace.id = fontId;
    fontFace.family = family;
    fontFace.url = url;
    fontFace.attributes = attributes;
    _fontFaces[fontId] = fontFace;
  }

  return fontFace;
}

/**
 * Helper for retrieving the default family by weight.
 *
 * @param {Number} fontWeight
 * @return {FontFace}
 */
FontFace.Default = function (fontWeight) {
  return FontFace('sans-serif', null, {weight: fontWeight});
};

/**
 * @internal
 */
function getCacheKey (family, url, attributes) {
  return family + url + Object.keys(attributes).sort().map(function (key) {
    return attributes[key];
  });
}

module.exports = FontFace;

},{}],8:[function(require,module,exports){
'use strict';

var FontFace = require('./FontFace');

var _useNativeImpl = (typeof window.FontFace !== 'undefined');
var _pendingFonts = {};
var _loadedFonts = {};
var _failedFonts = {};

var kFontLoadTimeout = 3000;

/**
 * Check if a font face has loaded
 * @param {FontFace} fontFace
 * @return {Boolean}
 */
function isFontLoaded (fontFace) {
  // For remote URLs, check the cache. System fonts (sans url) assume loaded.
  return _loadedFonts[fontFace.id] !== undefined || !fontFace.url;
}

/**
 * Load a remote font and execute a callback.
 * @param {FontFace} fontFace The font to Load
 * @param {Function} callback Function executed upon font Load
 */
function loadFont (fontFace, callback) {
  var defaultNode;
  var testNode;
  var checkFont;

  // See if we've previously loaded it.
  if (_loadedFonts[fontFace.id]) {
    return callback(null);
  }

  // See if we've previously failed to load it.
  if (_failedFonts[fontFace.id]) {
    return callback(_failedFonts[fontFace.id]);
  }

  // System font: assume already loaded.
  if (!fontFace.url) {
    return callback(null);
  }

  // Font load is already in progress:
  if (_pendingFonts[fontFace.id]) {
    _pendingFonts[fontFace.id].callbacks.push(callback);
    return;
  }

  // Create the test <span>'s for measuring.
  defaultNode = createTestNode('Helvetica', fontFace.attributes);
  testNode = createTestNode(fontFace.family, fontFace.attributes);
  document.body.appendChild(testNode);
  document.body.appendChild(defaultNode);

  _pendingFonts[fontFace.id] = {
    startTime: Date.now(),
    defaultNode: defaultNode,
    testNode: testNode,
    callbacks: [callback]
  };

  // Font watcher
  checkFont = function () {
    var currWidth = testNode.getBoundingClientRect().width;
    var defaultWidth = defaultNode.getBoundingClientRect().width;
    var loaded = currWidth !== defaultWidth;

    if (loaded) {
      handleFontLoad(fontFace, null);
    } else {
      // Timeout?
      if (Date.now() - _pendingFonts[fontFace.id].startTime >= kFontLoadTimeout) {
        handleFontLoad(fontFace, true);
      } else {
        requestAnimationFrame(checkFont);
      }
    }
  };

  // Start watching
  checkFont();
}

// Internal
// ========

/**
 * Native FontFace loader implementation
 * @internal
 */
function loadFontNative (fontFace, callback) {
  var theFontFace;

  // See if we've previously loaded it.
  if (_loadedFonts[fontFace.id]) {
    return callback(null);
  }

  // See if we've previously failed to load it.
  if (_failedFonts[fontFace.id]) {
    return callback(_failedFonts[fontFace.id]);
  }

  // System font: assume it's installed.
  if (!fontFace.url) {
    return callback(null);
  }

  // Font load is already in progress:
  if (_pendingFonts[fontFace.id]) {
    _pendingFonts[fontFace.id].callbacks.push(callback);
    return;
  }

  _pendingFonts[fontFace.id] = {
    startTime: Date.now(),
    callbacks: [callback]
  };

  // Use font loader API
  theFontFace = new window.FontFace(fontFace.family,
    'url(' + fontFace.url + ')', fontFace.attributes);

  theFontFace.load().then(function () {
    _loadedFonts[fontFace.id] = true;
    callback(null);
  }, function (err) {
    _failedFonts[fontFace.id] = err;
    callback(err);
  });
}

/**
 * Helper method for created a hidden <span> with a given font.
 * Uses TypeKit's default test string, which is said to result
 * in highly varied measured widths when compared to the default font.
 * @internal
 */
function createTestNode (family, attributes) {
  var span = document.createElement('span');
  span.setAttribute('data-fontfamily', family);
  span.style.cssText = 'position:absolute; left:-5000px; top:-5000px; visibility:hidden;' +
    'font-size:100px; font-family:"' + family + '", Helvetica;font-weight: ' + attributes.weight + ';' +
    'font-style:' + attributes.style + ';';
  span.innerHTML = 'BESs';
  return span;
}

/**
 * @internal
 */
function handleFontLoad (fontFace, timeout) {
  var error = timeout ? 'Exceeded load timeout of ' + kFontLoadTimeout + 'ms' : null;

  if (!error) {
    _loadedFonts[fontFace.id] = true;
  } else {
    _failedFonts[fontFace.id] = error;
  }

  // Execute pending callbacks.
  _pendingFonts[fontFace.id].callbacks.forEach(function (callback) {
    callback(error);
  });

  // Clean up DOM
  if (_pendingFonts[fontFace.id].defaultNode) {
    document.body.removeChild(_pendingFonts[fontFace.id].defaultNode);
  }
  if (_pendingFonts[fontFace.id].testNode) {
    document.body.removeChild(_pendingFonts[fontFace.id].testNode);
  }

  // Clean up waiting queue
  delete _pendingFonts[fontFace.id];
}

module.exports = {
  isFontLoaded: isFontLoaded,
  loadFont: _useNativeImpl ? loadFontNative : loadFont
};

},{"./FontFace":7}],9:[function(require,module,exports){
'use strict';

function Frame (x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}

/**
 * Get a frame object
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @return {Frame}
 */
function make (x, y, width, height) {
  return new Frame(x, y, width, height);
}

/**
 * Return a zero size anchored at (0, 0).
 *
 * @return {Frame}
 */
function zero () {
  return make(0, 0, 0, 0);
}

/**
 * Return a cloned frame
 *
 * @param {Frame} frame
 * @return {Frame}
 */
function clone (frame) {
  return make(frame.x, frame.y, frame.width, frame.height);
}

/**
 * Creates a new frame by a applying edge insets. This method accepts CSS
 * shorthand notation e.g. inset(myFrame, 10, 0);
 *
 * @param {Frame} frame
 * @param {Number} top
 * @param {Number} right
 * @param {?Number} bottom
 * @param {?Number} left
 * @return {Frame}
 */
function inset (frame, top, right, bottom, left) {
  var frameCopy = clone(frame);

  // inset(myFrame, 10, 0) => inset(myFrame, 10, 0, 10, 0)
  if (typeof bottom === 'undefined') {
    bottom = top;
    left = right;
  }

  // inset(myFrame, 10) => inset(myFrame, 10, 10, 10, 10)
  if (typeof right === 'undefined') {
    right = bottom = left = top;
  }

  frameCopy.x += left;
  frameCopy.y += top;
  frameCopy.height -= (top + bottom);
  frameCopy.width -= (left + right);

  return frameCopy;
}

/**
 * Compute the intersection region between 2 frames.
 *
 * @param {Frame} frame
 * @param {Frame} otherFrame
 * @return {Frame}
 */
function intersection (frame, otherFrame) {
  var x = Math.max(frame.x, otherFrame.x);
  var width = Math.min(frame.x + frame.width, otherFrame.x + otherFrame.width);
  var y = Math.max(frame.y, otherFrame.y);
  var height = Math.min(frame.y + frame.height, otherFrame.y + otherFrame.height);
  if (width >= x && height >= y) {
    return make(x, y, width - x, height - y);
  }
  return null;
}

/**
 * Compute the union of two frames
 *
 * @param {Frame} frame
 * @param {Frame} otherFrame
 * @return {Frame}
 */
function union (frame, otherFrame) {
  var x1 = Math.min(frame.x, otherFrame.x);
  var x2 = Math.max(frame.x + frame.width, otherFrame.x + otherFrame.width);
  var y1 = Math.min(frame.y, otherFrame.y);
  var y2 = Math.max(frame.y + frame.height, otherFrame.y + otherFrame.height);
  return make(x1, y1, x2 - x1, y2 - y1);
}

/**
 * Determine if 2 frames intersect each other
 *
 * @param {Frame} frame
 * @param {Frame} otherFrame
 * @return {Boolean}
 */
function intersects (frame, otherFrame) {
  return !(otherFrame.x > frame.x + frame.width ||
           otherFrame.x + otherFrame.width < frame.x ||
           otherFrame.y > frame.y + frame.height ||
           otherFrame.y + otherFrame.height < frame.y);
}

module.exports = {
  make: make,
  zero: zero,
  clone: clone,
  inset: inset,
  intersection: intersection,
  intersects: intersects,
  union: union
};


},{}],10:[function(require,module,exports){
'use strict';

var React = require('react');
var createComponent = require('./createComponent');
var LayerMixin = require('./LayerMixin');

var Gradient = createComponent('Gradient', LayerMixin, {

  applyGradientProps: function (prevProps, props) {
    var layer = this.node;
    layer.type = 'gradient';
    layer.colorStops = props.colorStops || [];
    this.applyLayerProps(prevProps, props);
  },

  mountComponent: function (rootID, transaction, context) {
    var props = this._currentElement.props;
    var layer = this.node;
    this.applyGradientProps({}, props);
    return layer;
  },

  receiveComponent: function (nextComponent, transaction, context) {
    var prevProps = this._currentElement.props;
    var props = nextComponent.props;
    this.applyGradientProps({}, props);
    this._currentElement = nextComponent;
    this.node.invalidateLayout();
  },

});


module.exports = Gradient;

},{"./LayerMixin":15,"./createComponent":23,"react":undefined}],11:[function(require,module,exports){
'use strict';

var createComponent = require('./createComponent');
var ContainerMixin = require('./ContainerMixin');
var LayerMixin = require('./LayerMixin');
var RenderLayer = require('./RenderLayer');

var Group = createComponent('Group', LayerMixin, ContainerMixin, {

  mountComponent: function (rootID, transaction, context) {
    var props = this._currentElement.props;
    var layer = this.node;

    this.applyLayerProps({}, props);
    this.mountAndInjectChildren(props.children, transaction, context);

    return layer;
  },

  receiveComponent: function (nextComponent, transaction, context) {
    var props = nextComponent.props;
    var prevProps = this._currentElement.props;
    this.applyLayerProps(prevProps, props);
    this.updateChildren(props.children, transaction, context);
    this._currentElement = nextComponent;
    this.node.invalidateLayout();
  },

  unmountComponent: function () {
    LayerMixin.unmountComponent.call(this);
    this.unmountChildren();
  }

});

module.exports = Group;

},{"./ContainerMixin":3,"./LayerMixin":15,"./RenderLayer":19,"./createComponent":23}],12:[function(require,module,exports){
'use strict';

var React = require('react');
var createComponent = require('./createComponent');
var LayerMixin = require('./LayerMixin');
var Layer = require('./Layer');
var Group = require('./Group');
var ImageCache = require('./ImageCache');
var Easing = require('./Easing');
var clamp = require('./clamp');

var FADE_DURATION = 200;

var RawImage = createComponent('Image', LayerMixin, {

  applyImageProps: function (prevProps, props) {
    var layer = this.node;

    layer.type = 'image';
    layer.imageUrl = props.src;
  },

  mountComponent: function (rootID, transaction, context) {
    var props = this._currentElement.props;
    var layer = this.node;
    this.applyLayerProps({}, props);
    this.applyImageProps({}, props);
    return layer;
  },

  receiveComponent: function (nextComponent, transaction, context) {
    var prevProps = this._currentElement.props;
    var props = nextComponent.props;
    this.applyLayerProps(prevProps, props);
    this.applyImageProps(prevProps, props);
    this._currentElement = nextComponent;
    this.node.invalidateLayout();
  },

});

var Image = React.createClass({

  propTypes: {
    src: React.PropTypes.string.isRequired,
    style: React.PropTypes.object,
    useBackingStore: React.PropTypes.bool,
    fadeIn: React.PropTypes.bool,
    fadeInDuration: React.PropTypes.number
  },

  getInitialState: function () {
    var loaded = ImageCache.get(this.props.src).isLoaded();
    return {
      loaded: loaded,
      imageAlpha: loaded ? 1 : 0
    };
  },

  componentDidMount: function () {
    ImageCache.get(this.props.src).on('load', this.handleImageLoad);
  },

  componentWillUpdate: function(nextProps, nextState) {
    if(nextProps.src !== this.props.src) {
      ImageCache.get(this.props.src).removeListener('load', this.handleImageLoad);
      ImageCache.get(nextProps.src).on('load', this.handleImageLoad);
      var loaded = ImageCache.get(nextProps.src).isLoaded();
      this.setState({loaded: loaded});
    }
  },

  componentWillUnmount: function () {
    if (this._pendingAnimationFrame) {
      cancelAnimationFrame(this._pendingAnimationFrame);
    }
    ImageCache.get(this.props.src).removeListener('load', this.handleImageLoad);
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (this.refs.image) {
      this.refs.image.invalidateLayout();
    }
  },

  render: function () {
    var rawImage;
    var imageStyle = Object.assign({}, this.props.style);
    var style = Object.assign({}, this.props.style);
    var backgroundStyle = Object.assign({}, this.props.style);
    var useBackingStore = this.state.loaded ? this.props.useBackingStore : false;

    // Hide the image until loaded.
    imageStyle.alpha = this.state.imageAlpha;

    // Hide opaque background if image loaded so that images with transparent
    // do not render on top of solid color.
    style.backgroundColor = imageStyle.backgroundColor = null;
    backgroundStyle.alpha = clamp(1 - this.state.imageAlpha, 0, 1);

    return (
      React.createElement(Group, {ref: 'main', style: style},
        React.createElement(Layer, {ref: 'background', style: backgroundStyle}),
        React.createElement(RawImage, {ref: 'image', src: this.props.src, style: imageStyle, useBackingStore: useBackingStore})
      )
    );
  },

  handleImageLoad: function () {
    var imageAlpha = 1;
    if (this.props.fadeIn) {
      imageAlpha = 0;
      this._animationStartTime = Date.now();
      this._pendingAnimationFrame = requestAnimationFrame(this.stepThroughAnimation);
    }
    this.setState({ loaded: true, imageAlpha: imageAlpha });
  },

  stepThroughAnimation: function () {
    var fadeInDuration = this.props.fadeInDuration || FADE_DURATION;
    var alpha = Easing.easeInCubic((Date.now() - this._animationStartTime) / fadeInDuration);
    alpha = clamp(alpha, 0, 1);
    this.setState({ imageAlpha: alpha });
    if (alpha < 1) {
      this._pendingAnimationFrame = requestAnimationFrame(this.stepThroughAnimation);
    }
  }

});

module.exports = Image;

},{"./Easing":5,"./Group":11,"./ImageCache":13,"./Layer":14,"./LayerMixin":15,"./clamp":22,"./createComponent":23,"react":undefined}],13:[function(require,module,exports){
'use strict';

var EventEmitter = require('events');

var NOOP = function () {};

function Img (src) {
  this._originalSrc = src;
  this._img = new Image();
  this._img.onload = this.emit.bind(this, 'load');
  this._img.onerror = this.emit.bind(this, 'error');
  this._img.crossOrigin = true;
  this._img.src = src;

  // The default impl of events emitter will throw on any 'error' event unless
  // there is at least 1 handler. Logging anything in this case is unnecessary
  // since the browser console will log it too.
  this.on('error', NOOP);

  // Default is just 10.
  this.setMaxListeners(100);
}

Object.assign(Img.prototype, EventEmitter.prototype, {

  /**
   * Pooling owner looks for this
   */
  destructor: function () {
    // Make sure we aren't leaking callbacks.
    this.removeAllListeners();
  },

  /**
   * Retrieve the original image URL before browser normalization
   *
   * @return {String}
   */
  getOriginalSrc: function () {
    return this._originalSrc;
  },

  /**
   * Retrieve a reference to the underyling <img> node.
   *
   * @return {HTMLImageElement}
   */
  getRawImage: function () {
    return this._img;
  },

  /**
   * Retrieve the loaded image width
   *
   * @return {Number}
   */
  getWidth: function () {
    return this._img.naturalWidth;
  },

  /**
   * Retrieve the loaded image height
   *
   * @return {Number}
   */
  getHeight: function () {
    return this._img.naturalHeight;
  },

  /**
   * @return {Bool}
   */
  isLoaded: function () {
    return this._img.naturalHeight > 0;
  }

});

var kInstancePoolLength = 300;

var _instancePool = {
  length: 0,
  // Keep all the nodes in memory.
  elements: {
    
  },
  
  // Push with 0 frequency
  push: function (hash, data) {
    this.length++;
    this.elements[hash] = {
      hash: hash, // Helps identifying 
      freq: 0,
      data: data
    };
  },
  
  get: function (path) {
    var element = this.elements[path];
    
    if( element ){
      element.freq++;
      return element.data;
    }
    
    return null;
  },
  
  // used to explicitely remove the path
  removeElement: function (path) {
    // Now almighty GC can claim this soul
    var element = this.elements[path];
    delete this.elements[path];
    this.length--;
    return element;
  },
  
  _reduceLeastUsed: function (least, currentHash) {
    var current = _instancePool.elements[currentHash];
    
    if( least.freq > current.freq ){
      return current;
    }
    
    return least;
  },
  
  popLeastUsed: function () {
    var reducer = _instancePool._reduceLeastUsed;
    var minUsed = Object.keys(this.elements).reduce(reducer, { freq: Infinity });
    
    if( minUsed.hash ){
      return this.removeElement(minUsed.hash);  
    }
    
    return null;
  }
};

var ImageCache = {

  /**
   * Retrieve an image from the cache
   *
   * @return {Img}
   */
  get: function (src) {
    var image = _instancePool.get(src);
    if (!image) {
      // Awesome LRU
      image = new Img(src);
      if (_instancePool.length >= kInstancePoolLength) {
        _instancePool.popLeastUsed().destructor();
      }
      _instancePool.push(image.getOriginalSrc(), image);
    }
    return image;
  }

};

module.exports = ImageCache;

},{"events":undefined}],14:[function(require,module,exports){
'use strict';

var createComponent = require('./createComponent');
var LayerMixin = require('./LayerMixin');

var Layer = createComponent('Layer', LayerMixin, {

  mountComponent: function (rootID, transaction, context) {
    var props = this._currentElement.props;
    var layer = this.node;
    this.applyLayerProps({}, props);
    return layer;
  },

  receiveComponent: function (nextComponent, transaction, context) {
    var prevProps = this._currentElement.props;
    var props = nextComponent.props;
    this.applyLayerProps(prevProps, props);
    this._currentElement = nextComponent;
    this.node.invalidateLayout();
  }

});

module.exports = Layer;

},{"./LayerMixin":15,"./createComponent":23}],15:[function(require,module,exports){
'use strict';

// Adapted from ReactART:
// https://github.com/reactjs/react-art

var FrameUtils = require('./FrameUtils');
var DrawingUtils = require('./DrawingUtils');
var EventTypes = require('./EventTypes');

var LAYER_GUID = 0;

var LayerMixin = {

  construct: function(element) {
    this._currentElement = element;
    this._layerId = LAYER_GUID++;
  },

  getPublicInstance: function() {
    return this.node;
  },

  putEventListener: function(type, listener) {
    var subscriptions = this.subscriptions || (this.subscriptions = {});
    var listeners = this.listeners || (this.listeners = {});
    listeners[type] = listener;
    if (listener) {
      if (!subscriptions[type]) {
        subscriptions[type] = this.node.subscribe(type, listener, this);
      }
    } else {
      if (subscriptions[type]) {
        subscriptions[type]();
        delete subscriptions[type];
      }
    }
  },

  handleEvent: function(event) {
    // TODO
  },

  destroyEventListeners: function() {
    // TODO
  },

  applyLayerProps: function (prevProps, props) {
    var layer = this.node;
    var style = (props && props.style) ? props.style : {};
    layer._originalStyle = style;

    // Common layer properties
    layer.alpha = style.alpha;
    layer.backgroundColor = style.backgroundColor;
    layer.borderColor = style.borderColor;
    layer.borderWidth = style.borderWidth;
    layer.borderRadius = style.borderRadius;
    layer.clipRect = style.clipRect;
    layer.frame = FrameUtils.make(style.left || 0, style.top || 0, style.width || 0, style.height || 0);
    layer.scale = style.scale;
    layer.translateX = style.translateX;
    layer.translateY = style.translateY;
    layer.zIndex = style.zIndex;

    // Shadow
    layer.shadowColor = style.shadowColor;
    layer.shadowBlur = style.shadowBlur;
    layer.shadowOffsetX = style.shadowOffsetX;
    layer.shadowOffsetY = style.shadowOffsetY;

    // Generate backing store ID as needed.
    if (props.useBackingStore) {
      layer.backingStoreId = this._layerId;
    }

    // Register events
    for (var type in EventTypes) {
      this.putEventListener(EventTypes[type], props[type]);
    }
  },

  mountComponentIntoNode: function(rootID, container) {
    throw new Error(
      'You cannot render a Canvas component standalone. ' +
      'You need to wrap it in a Surface.'
    );
  },

  unmountComponent: function() {
    this.destroyEventListeners();
  }

};

module.exports = LayerMixin;

},{"./DrawingUtils":4,"./EventTypes":6,"./FrameUtils":9}],16:[function(require,module,exports){
// https://github.com/facebook/css-layout

/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var computeLayout = (function() {

  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function getSpacing(node, type, suffix, location) {
    var key = type + capitalizeFirst(location) + suffix;
    if (key in node.style) {
      return node.style[key];
    }

    key = type + suffix;
    if (key in node.style) {
      return node.style[key];
    }

    return 0;
  }

  function getPositiveSpacing(node, type, suffix, location) {
    var key = type + capitalizeFirst(location) + suffix;
    if (key in node.style && node.style[key] >= 0) {
      return node.style[key];
    }

    key = type + suffix;
    if (key in node.style && node.style[key] >= 0) {
      return node.style[key];
    }

    return 0;
  }

  function isUndefined(value) {
    return value === undefined;
  }

  function getMargin(node, location) {
    return getSpacing(node, 'margin', '', location);
  }

  function getPadding(node, location) {
    return getPositiveSpacing(node, 'padding', '', location);
  }

  function getBorder(node, location) {
    return getPositiveSpacing(node, 'border', 'Width', location);
  }

  function getPaddingAndBorder(node, location) {
    return getPadding(node, location) + getBorder(node, location);
  }

  function getMarginAxis(node, axis) {
    return getMargin(node, leading[axis]) + getMargin(node, trailing[axis]);
  }

  function getPaddingAndBorderAxis(node, axis) {
    return getPaddingAndBorder(node, leading[axis]) + getPaddingAndBorder(node, trailing[axis]);
  }

  function getJustifyContent(node) {
    if ('justifyContent' in node.style) {
      return node.style.justifyContent;
    }
    return 'flex-start';
  }

  function getAlignItem(node, child) {
    if ('alignSelf' in child.style) {
      return child.style.alignSelf;
    }
    if ('alignItems' in node.style) {
      return node.style.alignItems;
    }
    return 'stretch';
  }

  function getFlexDirection(node) {
    if ('flexDirection' in node.style) {
      return node.style.flexDirection;
    }
    return 'column';
  }

  function getPositionType(node) {
    if ('position' in node.style) {
      return node.style.position;
    }
    return 'relative';
  }

  function getFlex(node) {
    return node.style.flex;
  }

  function isFlex(node) {
    return (
      getPositionType(node) === CSS_POSITION_RELATIVE &&
      getFlex(node) > 0
    );
  }

  function isFlexWrap(node) {
    return node.style.flexWrap === 'wrap';
  }

  function getDimWithMargin(node, axis) {
    return node.layout[dim[axis]] + getMarginAxis(node, axis);
  }

  function isDimDefined(node, axis) {
    return !isUndefined(node.style[dim[axis]]) && node.style[dim[axis]] >= 0;
  }

  function isPosDefined(node, pos) {
    return !isUndefined(node.style[pos]);
  }

  function isMeasureDefined(node) {
    return 'measure' in node.style;
  }

  function getPosition(node, pos) {
    if (pos in node.style) {
      return node.style[pos];
    }
    return 0;
  }

  // When the user specifically sets a value for width or height
  function setDimensionFromStyle(node, axis) {
    // The parent already computed us a width or height. We just skip it
    if (!isUndefined(node.layout[dim[axis]])) {
      return;
    }
    // We only run if there's a width or height defined
    if (!isDimDefined(node, axis)) {
      return;
    }

    // The dimensions can never be smaller than the padding and border
    node.layout[dim[axis]] = fmaxf(
      node.style[dim[axis]],
      getPaddingAndBorderAxis(node, axis)
    );
  }

  // If both left and right are defined, then use left. Otherwise return
  // +left or -right depending on which is defined.
  function getRelativePosition(node, axis) {
    if (leading[axis] in node.style) {
      return getPosition(node, leading[axis]);
    }
    return -getPosition(node, trailing[axis]);
  }

  var leading = {
    row: 'left',
    column: 'top'
  };
  var trailing = {
    row: 'right',
    column: 'bottom'
  };
  var pos = {
    row: 'left',
    column: 'top'
  };
  var dim = {
    row: 'width',
    column: 'height'
  };

  function fmaxf(a, b) {
    if (a > b) {
      return a;
    }
    return b;
  }

  var CSS_UNDEFINED = undefined;

  var CSS_FLEX_DIRECTION_ROW = 'row';
  var CSS_FLEX_DIRECTION_COLUMN = 'column';

  var CSS_JUSTIFY_FLEX_START = 'flex-start';
  var CSS_JUSTIFY_CENTER = 'center';
  var CSS_JUSTIFY_FLEX_END = 'flex-end';
  var CSS_JUSTIFY_SPACE_BETWEEN = 'space-between';
  var CSS_JUSTIFY_SPACE_AROUND = 'space-around';

  var CSS_ALIGN_FLEX_START = 'flex-start';
  var CSS_ALIGN_CENTER = 'center';
  var CSS_ALIGN_FLEX_END = 'flex-end';
  var CSS_ALIGN_STRETCH = 'stretch';

  var CSS_POSITION_RELATIVE = 'relative';
  var CSS_POSITION_ABSOLUTE = 'absolute';

  return function layoutNode(node, parentMaxWidth) {
    var/*css_flex_direction_t*/ mainAxis = getFlexDirection(node);
    var/*css_flex_direction_t*/ crossAxis = mainAxis === CSS_FLEX_DIRECTION_ROW ?
      CSS_FLEX_DIRECTION_COLUMN :
      CSS_FLEX_DIRECTION_ROW;

    // Handle width and height style attributes
    setDimensionFromStyle(node, mainAxis);
    setDimensionFromStyle(node, crossAxis);

    // The position is set by the parent, but we need to complete it with a
    // delta composed of the margin and left/top/right/bottom
    node.layout[leading[mainAxis]] += getMargin(node, leading[mainAxis]) +
      getRelativePosition(node, mainAxis);
    node.layout[leading[crossAxis]] += getMargin(node, leading[crossAxis]) +
      getRelativePosition(node, crossAxis);

    if (isMeasureDefined(node)) {
      var/*float*/ width = CSS_UNDEFINED;
      if (isDimDefined(node, CSS_FLEX_DIRECTION_ROW)) {
        width = node.style.width;
      } else if (!isUndefined(node.layout[dim[CSS_FLEX_DIRECTION_ROW]])) {
        width = node.layout[dim[CSS_FLEX_DIRECTION_ROW]];
      } else {
        width = parentMaxWidth -
          getMarginAxis(node, CSS_FLEX_DIRECTION_ROW);
      }
      width -= getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_ROW);

      // We only need to give a dimension for the text if we haven't got any
      // for it computed yet. It can either be from the style attribute or because
      // the element is flexible.
      var/*bool*/ isRowUndefined = !isDimDefined(node, CSS_FLEX_DIRECTION_ROW) &&
        isUndefined(node.layout[dim[CSS_FLEX_DIRECTION_ROW]]);
      var/*bool*/ isColumnUndefined = !isDimDefined(node, CSS_FLEX_DIRECTION_COLUMN) &&
        isUndefined(node.layout[dim[CSS_FLEX_DIRECTION_COLUMN]]);

      // Let's not measure the text if we already know both dimensions
      if (isRowUndefined || isColumnUndefined) {
        var/*css_dim_t*/ measure_dim = node.style.measure(
          /*(c)!node->context,*/
          width
        );
        if (isRowUndefined) {
          node.layout.width = measure_dim.width +
            getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_ROW);
        }
        if (isColumnUndefined) {
          node.layout.height = measure_dim.height +
            getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_COLUMN);
        }
      }
      return;
    }

    // Pre-fill some dimensions straight from the parent
    for (var/*int*/ i = 0; i < node.children.length; ++i) {
      var/*css_node_t**/ child = node.children[i];
      // Pre-fill cross axis dimensions when the child is using stretch before
      // we call the recursive layout pass
      if (getAlignItem(node, child) === CSS_ALIGN_STRETCH &&
          getPositionType(child) === CSS_POSITION_RELATIVE &&
          !isUndefined(node.layout[dim[crossAxis]]) &&
          !isDimDefined(child, crossAxis)) {
        child.layout[dim[crossAxis]] = fmaxf(
          node.layout[dim[crossAxis]] -
            getPaddingAndBorderAxis(node, crossAxis) -
            getMarginAxis(child, crossAxis),
          // You never want to go smaller than padding
          getPaddingAndBorderAxis(child, crossAxis)
        );
      } else if (getPositionType(child) == CSS_POSITION_ABSOLUTE) {
        // Pre-fill dimensions when using absolute position and both offsets for the axis are defined (either both
        // left and right or top and bottom).
        for (var/*int*/ ii = 0; ii < 2; ii++) {
          var/*css_flex_direction_t*/ axis = (ii != 0) ? CSS_FLEX_DIRECTION_ROW : CSS_FLEX_DIRECTION_COLUMN;
          if (!isUndefined(node.layout[dim[axis]]) &&
              !isDimDefined(child, axis) &&
              isPosDefined(child, leading[axis]) &&
              isPosDefined(child, trailing[axis])) {
            child.layout[dim[axis]] = fmaxf(
              node.layout[dim[axis]] -
              getPaddingAndBorderAxis(node, axis) -
              getMarginAxis(child, axis) -
              getPosition(child, leading[axis]) -
              getPosition(child, trailing[axis]),
              // You never want to go smaller than padding
              getPaddingAndBorderAxis(child, axis)
            );
          }
        }
      }
    }

    var/*float*/ definedMainDim = CSS_UNDEFINED;
    if (!isUndefined(node.layout[dim[mainAxis]])) {
      definedMainDim = node.layout[dim[mainAxis]] -
          getPaddingAndBorderAxis(node, mainAxis);
    }

    // We want to execute the next two loops one per line with flex-wrap
    var/*int*/ startLine = 0;
    var/*int*/ endLine = 0;
    var/*int*/ nextOffset = 0;
    var/*int*/ alreadyComputedNextLayout = 0;
    // We aggregate the total dimensions of the container in those two variables
    var/*float*/ linesCrossDim = 0;
    var/*float*/ linesMainDim = 0;
    while (endLine < node.children.length) {
      // <Loop A> Layout non flexible children and count children by type

      // mainContentDim is accumulation of the dimensions and margin of all the
      // non flexible children. This will be used in order to either set the
      // dimensions of the node if none already exist, or to compute the
      // remaining space left for the flexible children.
      var/*float*/ mainContentDim = 0;

      // There are three kind of children, non flexible, flexible and absolute.
      // We need to know how many there are in order to distribute the space.
      var/*int*/ flexibleChildrenCount = 0;
      var/*float*/ totalFlexible = 0;
      var/*int*/ nonFlexibleChildrenCount = 0;
      for (var/*int*/ i = startLine; i < node.children.length; ++i) {
        var/*css_node_t**/ child = node.children[i];
        var/*float*/ nextContentDim = 0;

        // It only makes sense to consider a child flexible if we have a computed
        // dimension for the node.
        if (!isUndefined(node.layout[dim[mainAxis]]) && isFlex(child)) {
          flexibleChildrenCount++;
          totalFlexible += getFlex(child);

          // Even if we don't know its exact size yet, we already know the padding,
          // border and margin. We'll use this partial information to compute the
          // remaining space.
          nextContentDim = getPaddingAndBorderAxis(child, mainAxis) +
            getMarginAxis(child, mainAxis);

        } else {
          var/*float*/ maxWidth = CSS_UNDEFINED;
          if (mainAxis === CSS_FLEX_DIRECTION_ROW) {
            // do nothing
          } else if (isDimDefined(node, CSS_FLEX_DIRECTION_ROW)) {
            maxWidth = node.layout[dim[CSS_FLEX_DIRECTION_ROW]] -
              getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_ROW);
          } else {
            maxWidth = parentMaxWidth -
              getMarginAxis(node, CSS_FLEX_DIRECTION_ROW) -
              getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_ROW);
          }

          // This is the main recursive call. We layout non flexible children.
          if (alreadyComputedNextLayout === 0) {
            layoutNode(child, maxWidth);
          }

          // Absolute positioned elements do not take part of the layout, so we
          // don't use them to compute mainContentDim
          if (getPositionType(child) === CSS_POSITION_RELATIVE) {
            nonFlexibleChildrenCount++;
            // At this point we know the final size and margin of the element.
            nextContentDim = getDimWithMargin(child, mainAxis);
          }
        }

        // The element we are about to add would make us go to the next line
        if (isFlexWrap(node) &&
            !isUndefined(node.layout[dim[mainAxis]]) &&
            mainContentDim + nextContentDim > definedMainDim &&
            // If there's only one element, then it's bigger than the content
            // and needs its own line
            i !== startLine) {
          alreadyComputedNextLayout = 1;
          break;
        }
        alreadyComputedNextLayout = 0;
        mainContentDim += nextContentDim;
        endLine = i + 1;
      }

      // <Loop B> Layout flexible children and allocate empty space

      // In order to position the elements in the main axis, we have two
      // controls. The space between the beginning and the first element
      // and the space between each two elements.
      var/*float*/ leadingMainDim = 0;
      var/*float*/ betweenMainDim = 0;

      // The remaining available space that needs to be allocated
      var/*float*/ remainingMainDim = 0;
      if (!isUndefined(node.layout[dim[mainAxis]])) {
        remainingMainDim = definedMainDim - mainContentDim;
      } else {
        remainingMainDim = fmaxf(mainContentDim, 0) - mainContentDim;
      }

      // If there are flexible children in the mix, they are going to fill the
      // remaining space
      if (flexibleChildrenCount !== 0) {
        var/*float*/ flexibleMainDim = remainingMainDim / totalFlexible;

        // The non flexible children can overflow the container, in this case
        // we should just assume that there is no space available.
        if (flexibleMainDim < 0) {
          flexibleMainDim = 0;
        }
        // We iterate over the full array and only apply the action on flexible
        // children. This is faster than actually allocating a new array that
        // contains only flexible children.
        for (var/*int*/ i = startLine; i < endLine; ++i) {
          var/*css_node_t**/ child = node.children[i];
          if (isFlex(child)) {
            // At this point we know the final size of the element in the main
            // dimension
            child.layout[dim[mainAxis]] = flexibleMainDim * getFlex(child) +
              getPaddingAndBorderAxis(child, mainAxis);

            var/*float*/ maxWidth = CSS_UNDEFINED;
            if (mainAxis === CSS_FLEX_DIRECTION_ROW) {
              // do nothing
            } else if (isDimDefined(node, CSS_FLEX_DIRECTION_ROW)) {
              maxWidth = node.layout[dim[CSS_FLEX_DIRECTION_ROW]] -
                getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_ROW);
            } else {
              maxWidth = parentMaxWidth -
                getMarginAxis(node, CSS_FLEX_DIRECTION_ROW) -
                getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_ROW);
            }

            // And we recursively call the layout algorithm for this child
            layoutNode(child, maxWidth);
          }
        }

      // We use justifyContent to figure out how to allocate the remaining
      // space available
      } else {
        var/*css_justify_t*/ justifyContent = getJustifyContent(node);
        if (justifyContent === CSS_JUSTIFY_FLEX_START) {
          // Do nothing
        } else if (justifyContent === CSS_JUSTIFY_CENTER) {
          leadingMainDim = remainingMainDim / 2;
        } else if (justifyContent === CSS_JUSTIFY_FLEX_END) {
          leadingMainDim = remainingMainDim;
        } else if (justifyContent === CSS_JUSTIFY_SPACE_BETWEEN) {
          remainingMainDim = fmaxf(remainingMainDim, 0);
          if (flexibleChildrenCount + nonFlexibleChildrenCount - 1 !== 0) {
            betweenMainDim = remainingMainDim /
              (flexibleChildrenCount + nonFlexibleChildrenCount - 1);
          } else {
            betweenMainDim = 0;
          }
        } else if (justifyContent === CSS_JUSTIFY_SPACE_AROUND) {
          // Space on the edges is half of the space between elements
          betweenMainDim = remainingMainDim /
            (flexibleChildrenCount + nonFlexibleChildrenCount);
          leadingMainDim = betweenMainDim / 2;
        }
      }

      // <Loop C> Position elements in the main axis and compute dimensions

      // At this point, all the children have their dimensions set. We need to
      // find their position. In order to do that, we accumulate data in
      // variables that are also useful to compute the total dimensions of the
      // container!
      var/*float*/ crossDim = 0;
      var/*float*/ mainDim = leadingMainDim +
        getPaddingAndBorder(node, leading[mainAxis]);

      for (var/*int*/ i = startLine; i < endLine; ++i) {
        var/*css_node_t**/ child = node.children[i];

        if (getPositionType(child) === CSS_POSITION_ABSOLUTE &&
            isPosDefined(child, leading[mainAxis])) {
          // In case the child is position absolute and has left/top being
          // defined, we override the position to whatever the user said
          // (and margin/border).
          child.layout[pos[mainAxis]] = getPosition(child, leading[mainAxis]) +
            getBorder(node, leading[mainAxis]) +
            getMargin(child, leading[mainAxis]);
        } else {
          // If the child is position absolute (without top/left) or relative,
          // we put it at the current accumulated offset.
          child.layout[pos[mainAxis]] += mainDim;
        }

        // Now that we placed the element, we need to update the variables
        // We only need to do that for relative elements. Absolute elements
        // do not take part in that phase.
        if (getPositionType(child) === CSS_POSITION_RELATIVE) {
          // The main dimension is the sum of all the elements dimension plus
          // the spacing.
          mainDim += betweenMainDim + getDimWithMargin(child, mainAxis);
          // The cross dimension is the max of the elements dimension since there
          // can only be one element in that cross dimension.
          crossDim = fmaxf(crossDim, getDimWithMargin(child, crossAxis));
        }
      }

      var/*float*/ containerMainAxis = node.layout[dim[mainAxis]];
      // If the user didn't specify a width or height, and it has not been set
      // by the container, then we set it via the children.
      if (isUndefined(node.layout[dim[mainAxis]])) {
        containerMainAxis = fmaxf(
          // We're missing the last padding at this point to get the final
          // dimension
          mainDim + getPaddingAndBorder(node, trailing[mainAxis]),
          // We can never assign a width smaller than the padding and borders
          getPaddingAndBorderAxis(node, mainAxis)
        );
      }

      var/*float*/ containerCrossAxis = node.layout[dim[crossAxis]];
      if (isUndefined(node.layout[dim[crossAxis]])) {
        containerCrossAxis = fmaxf(
          // For the cross dim, we add both sides at the end because the value
          // is aggregate via a max function. Intermediate negative values
          // can mess this computation otherwise
          crossDim + getPaddingAndBorderAxis(node, crossAxis),
          getPaddingAndBorderAxis(node, crossAxis)
        );
      }

      // <Loop D> Position elements in the cross axis

      for (var/*int*/ i = startLine; i < endLine; ++i) {
        var/*css_node_t**/ child = node.children[i];

        if (getPositionType(child) === CSS_POSITION_ABSOLUTE &&
            isPosDefined(child, leading[crossAxis])) {
          // In case the child is absolutely positionned and has a
          // top/left/bottom/right being set, we override all the previously
          // computed positions to set it correctly.
          child.layout[pos[crossAxis]] = getPosition(child, leading[crossAxis]) +
            getBorder(node, leading[crossAxis]) +
            getMargin(child, leading[crossAxis]);

        } else {
          var/*float*/ leadingCrossDim = getPaddingAndBorder(node, leading[crossAxis]);

          // For a relative children, we're either using alignItems (parent) or
          // alignSelf (child) in order to determine the position in the cross axis
          if (getPositionType(child) === CSS_POSITION_RELATIVE) {
            var/*css_align_t*/ alignItem = getAlignItem(node, child);
            if (alignItem === CSS_ALIGN_FLEX_START) {
              // Do nothing
            } else if (alignItem === CSS_ALIGN_STRETCH) {
              // You can only stretch if the dimension has not already been set
              // previously.
              if (!isDimDefined(child, crossAxis)) {
                child.layout[dim[crossAxis]] = fmaxf(
                  containerCrossAxis -
                    getPaddingAndBorderAxis(node, crossAxis) -
                    getMarginAxis(child, crossAxis),
                  // You never want to go smaller than padding
                  getPaddingAndBorderAxis(child, crossAxis)
                );
              }
            } else {
              // The remaining space between the parent dimensions+padding and child
              // dimensions+margin.
              var/*float*/ remainingCrossDim = containerCrossAxis -
                getPaddingAndBorderAxis(node, crossAxis) -
                getDimWithMargin(child, crossAxis);

              if (alignItem === CSS_ALIGN_CENTER) {
                leadingCrossDim += remainingCrossDim / 2;
              } else { // CSS_ALIGN_FLEX_END
                leadingCrossDim += remainingCrossDim;
              }
            }
          }

          // And we apply the position
          child.layout[pos[crossAxis]] += linesCrossDim + leadingCrossDim;
        }
      }

      linesCrossDim += crossDim;
      linesMainDim = fmaxf(linesMainDim, mainDim);
      startLine = endLine;
    }

    // If the user didn't specify a width or height, and it has not been set
    // by the container, then we set it via the children.
    if (isUndefined(node.layout[dim[mainAxis]])) {
      node.layout[dim[mainAxis]] = fmaxf(
        // We're missing the last padding at this point to get the final
        // dimension
        linesMainDim + getPaddingAndBorder(node, trailing[mainAxis]),
        // We can never assign a width smaller than the padding and borders
        getPaddingAndBorderAxis(node, mainAxis)
      );
    }

    if (isUndefined(node.layout[dim[crossAxis]])) {
      node.layout[dim[crossAxis]] = fmaxf(
        // For the cross dim, we add both sides at the end because the value
        // is aggregate via a max function. Intermediate negative values
        // can mess this computation otherwise
        linesCrossDim + getPaddingAndBorderAxis(node, crossAxis),
        getPaddingAndBorderAxis(node, crossAxis)
      );
    }

    // <Loop E> Calculate dimensions for absolutely positioned elements

    for (var/*int*/ i = 0; i < node.children.length; ++i) {
      var/*css_node_t**/ child = node.children[i];
      if (getPositionType(child) == CSS_POSITION_ABSOLUTE) {
        // Pre-fill dimensions when using absolute position and both offsets for the axis are defined (either both
        // left and right or top and bottom).
        for (var/*int*/ ii = 0; ii < 2; ii++) {
          var/*css_flex_direction_t*/ axis = (ii !== 0) ? CSS_FLEX_DIRECTION_ROW : CSS_FLEX_DIRECTION_COLUMN;
          if (!isUndefined(node.layout[dim[axis]]) &&
              !isDimDefined(child, axis) &&
              isPosDefined(child, leading[axis]) &&
              isPosDefined(child, trailing[axis])) {
            child.layout[dim[axis]] = fmaxf(
              node.layout[dim[axis]] -
              getPaddingAndBorderAxis(node, axis) -
              getMarginAxis(child, axis) -
              getPosition(child, leading[axis]) -
              getPosition(child, trailing[axis]),
              // You never want to go smaller than padding
              getPaddingAndBorderAxis(child, axis)
            );
          }
        }
        for (var/*int*/ ii = 0; ii < 2; ii++) {
          var/*css_flex_direction_t*/ axis = (ii !== 0) ? CSS_FLEX_DIRECTION_ROW : CSS_FLEX_DIRECTION_COLUMN;
          if (isPosDefined(child, trailing[axis]) &&
              !isPosDefined(child, leading[axis])) {
            child.layout[leading[axis]] =
              node.layout[dim[axis]] -
              child.layout[dim[axis]] -
              getPosition(child, trailing[axis]);
          }
        }
      }
    }
  };
})();

if (typeof module === 'object') {
  module.exports = computeLayout;
}

},{}],17:[function(require,module,exports){
'use strict';

var React = require('react');
var Scroller = require('scroller');
var Group = require('./Group');
var clamp = require('./clamp');

var ListView = React.createClass({

  propTypes: {
    style: React.PropTypes.object,
    numberOfItemsGetter: React.PropTypes.func.isRequired,
    itemHeightGetter: React.PropTypes.func.isRequired,
    itemGetter: React.PropTypes.func.isRequired,
    snapping: React.PropTypes.bool,
    scrollingDeceleration: React.PropTypes.number,
    scrollingPenetrationAcceleration: React.PropTypes.number,
    onScroll: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      style: { left: 0, top: 0, width: 0, height: 0 },
      snapping: false,
      scrollingDeceleration: 0.95,
      scrollingPenetrationAcceleration: 0.08
    };
  },

  getInitialState: function () {
    return {
      scrollTop: 0
    };
  },

  componentDidMount: function () {
    this.createScroller();
    this.updateScrollingDimensions();
  },

  render: function () {
    var items = this.getVisibleItemIndexes().map(this.renderItem);
    return (
      React.createElement(Group, {
        style: this.props.style,
        onTouchStart: this.handleTouchStart,
        onTouchMove: this.handleTouchMove,
        onTouchEnd: this.handleTouchEnd,
        onTouchCancel: this.handleTouchEnd},
        items
      )
    );
  },

  renderItem: function (itemIndex) {
    var item = this.props.itemGetter(itemIndex, this.state.scrollTop);
    var itemHeight = this.props.itemHeightGetter();
    var style = {
      top: 0,
      left: 0,
      width: this.props.style.width,
      height: itemHeight,
      translateY: (itemIndex * itemHeight) - this.state.scrollTop,
      zIndex: itemIndex
    };

    return (
      React.createElement(Group, {style: style, key: itemIndex},
        item
      )
    );
  },

  // Events
  // ======

  handleTouchStart: function (e) {
    if (this.scroller) {
      this.scroller.doTouchStart(e.touches, e.timeStamp);
    }
  },

  handleTouchMove: function (e) {
    if (this.scroller) {
      e.preventDefault();
      this.scroller.doTouchMove(e.touches, e.timeStamp, e.scale);
    }
  },

  handleTouchEnd: function (e) {
    if (this.scroller) {
      this.scroller.doTouchEnd(e.timeStamp);
      if (this.props.snapping) {
        this.updateScrollingDeceleration();
      }
    }
  },

  handleScroll: function (left, top) {
    this.setState({ scrollTop: top });
    if (this.props.onScroll) {
      this.props.onScroll(top);
    }
  },

  // Scrolling
  // =========

  createScroller: function () {
    var options = {
      scrollingX: false,
      scrollingY: true,
      decelerationRate: this.props.scrollingDeceleration,
      penetrationAcceleration: this.props.scrollingPenetrationAcceleration,
    };
    this.scroller = new Scroller(this.handleScroll, options);
  },

  updateScrollingDimensions: function () {
    var width = this.props.style.width;
    var height = this.props.style.height;
    var scrollWidth = width;
    var scrollHeight = this.props.numberOfItemsGetter() * this.props.itemHeightGetter();
    this.scroller.setDimensions(width, height, scrollWidth, scrollHeight);
  },

  getVisibleItemIndexes: function () {
    var itemIndexes = [];
    var itemHeight = this.props.itemHeightGetter();
    var itemCount = this.props.numberOfItemsGetter();
    var scrollTop = this.state.scrollTop;
    var itemScrollTop = 0;

    for (var index=0; index < itemCount; index++) {
      itemScrollTop = (index * itemHeight) - scrollTop;

      // Item is completely off-screen bottom
      if (itemScrollTop >= this.props.style.height) {
        continue;
      }

      // Item is completely off-screen top
      if (itemScrollTop <= -this.props.style.height) {
        continue;
      }

      // Part of item is on-screen.
      itemIndexes.push(index);
    }

    return itemIndexes;
  },

  updateScrollingDeceleration: function () {
    var currVelocity = this.scroller.__decelerationVelocityY;
    var currScrollTop = this.state.scrollTop;
    var targetScrollTop = 0;
    var estimatedEndScrollTop = currScrollTop;

    while (Math.abs(currVelocity).toFixed(6) > 0) {
      estimatedEndScrollTop += currVelocity;
      currVelocity *= this.props.scrollingDeceleration;
    }

    // Find the page whose estimated end scrollTop is closest to 0.
    var closestZeroDelta = Infinity;
    var pageHeight = this.props.itemHeightGetter();
    var pageCount = this.props.numberOfItemsGetter();
    var pageScrollTop;

    for (var pageIndex=0, len=pageCount; pageIndex < len; pageIndex++) {
      pageScrollTop = (pageHeight * pageIndex) - estimatedEndScrollTop;
      if (Math.abs(pageScrollTop) < closestZeroDelta) {
        closestZeroDelta = Math.abs(pageScrollTop);
        targetScrollTop = pageHeight * pageIndex;
      }
    }

    this.scroller.__minDecelerationScrollTop = targetScrollTop;
    this.scroller.__maxDecelerationScrollTop = targetScrollTop;
  }

});

module.exports = ListView;

},{"./Group":11,"./clamp":22,"react":undefined,"scroller":undefined}],18:[function(require,module,exports){
'use strict';

var ReactCanvas = {
  Surface: require('./Surface'),

  Layer: require('./Layer'),
  Group: require('./Group'),
  Image: require('./Image'),
  Text: require('./Text'),
  ListView: require('./ListView'),
  Gradient: require('./Gradient'),

  FontFace: require('./FontFace'),
  measureText: require('./measureText')
};

module.exports = ReactCanvas;

},{"./FontFace":7,"./Gradient":10,"./Group":11,"./Image":12,"./Layer":14,"./ListView":17,"./Surface":20,"./Text":21,"./measureText":26}],19:[function(require,module,exports){
'use strict';

var FrameUtils = require('./FrameUtils');
var DrawingUtils = require('./DrawingUtils');
var EventTypes = require('./EventTypes');

function RenderLayer () {
  this.children = [];
  this.frame = FrameUtils.zero();
}

RenderLayer.prototype = {

  /**
   * Retrieve the root injection layer
   *
   * @return {RenderLayer}
   */
  getRootLayer: function () {
    var root = this;
    while (root.parentLayer) {
      root = root.parentLayer;
    }
    return root;
  },

  /**
   * RenderLayers are injected into a root owner layer whenever a Surface is
   * mounted. This is the integration point with React internals.
   *
   * @param {RenderLayer} parentLayer
   */
  inject: function (parentLayer) {
    if (this.parentLayer && this.parentLayer !== parentLayer) {
      this.remove();
    }
    if (!this.parentLayer) {
      parentLayer.addChild(this);
    }
  },

  /**
   * Inject a layer before a reference layer
   *
   * @param {RenderLayer} parentLayer
   * @param {RenderLayer} referenceLayer
   */
  injectBefore: function (parentLayer, referenceLayer) {
    // FIXME
    this.inject(parentLayer);
  },

  /**
   * Add a child to the render layer
   *
   * @param {RenderLayer} child
   */
  addChild: function (child) {
    child.parentLayer = this;
    this.children.push(child);
  },

  /**
   * Remove a layer from it's parent layer
   */
  remove: function () {
    if (this.parentLayer) {
      this.parentLayer.children.splice(this.parentLayer.children.indexOf(this), 1);
    }
  },

  /**
   * Attach an event listener to a layer. Supported events are defined in
   * lib/EventTypes.js
   *
   * @param {String} type
   * @param {Function} callback
   * @param {?Object} callbackScope
   * @return {Function} invoke to unsubscribe the listener
   */
  subscribe: function (type, callback, callbackScope) {
    // This is the integration point with React, called from LayerMixin.putEventListener().
    // Enforce that only a single callbcak can be assigned per event type.
    for (var eventType in EventTypes) {
      if (EventTypes[eventType] === type) {
        this[eventType] = callback;
      }
    }

    // Return a function that can be called to unsubscribe from the event.
    return this.removeEventListener.bind(this, type, callback, callbackScope);
  },

  /**
   * @param {String} type
   * @param {Function} callback
   * @param {?Object} callbackScope
   */
  addEventListener: function (type, callback, callbackScope) {
    for (var eventType in EventTypes) {
      if (EventTypes[eventType] === type) {
        delete this[eventType];
      }
    }
  },

  /**
   * @param {String} type
   * @param {Function} callback
   * @param {?Object} callbackScope
   */
  removeEventListener: function (type, callback, callbackScope) {
    var listeners = this.eventListeners[type];
    var listener;
    if (listeners) {
      for (var index=0, len=listeners.length; index < len; index++) {
        listener = listeners[index];
        if (listener.callback === callback &&
            listener.callbackScope === callbackScope) {
          listeners.splice(index, 1);
          break;
        }
      }
    }
  },

  /**
   * Translate a layer's frame
   *
   * @param {Number} x
   * @param {Number} y
   */
  translate: function (x, y) {
    if (this.frame) {
      this.frame.x += x;
      this.frame.y += y;
    }

    if (this.clipRect) {
      this.clipRect.x += x;
      this.clipRect.y += y;
    }

    if (this.children) {
      this.children.forEach(function (child) {
        child.translate(x, y);
      });
    }
  },

  /**
   * Layers should call this method when they need to be redrawn. Note the
   * difference here between `invalidateBackingStore`: updates that don't
   * trigger layout should prefer `invalidateLayout`. For instance, an image
   * component that is animating alpha level after the image loads would
   * call `invalidateBackingStore` once after the image loads, and at each
   * step in the animation would then call `invalidateRect`.
   *
   * @param {?Frame} frame Optional, if not passed the entire layer's frame
   *   will be invalidated.
   */
  invalidateLayout: function () {
    // Bubble all the way to the root layer.
    this.getRootLayer().draw();
  },

  /**
   * Layers should call this method when their backing <canvas> needs to be
   * redrawn. For instance, an image component would call this once after the
   * image loads.
   */
  invalidateBackingStore: function () {
    if (this.backingStoreId) {
      DrawingUtils.invalidateBackingStore(this.backingStoreId);
    }
    this.invalidateLayout();
  },

  /**
   * Only the root owning layer should implement this function.
   */
  draw: function () {
    // Placeholer
  }

};

module.exports = RenderLayer;

},{"./DrawingUtils":4,"./EventTypes":6,"./FrameUtils":9}],20:[function(require,module,exports){
'use strict';

var React = require('react');
var ReactUpdates = require('react/lib/ReactUpdates');
var invariant = require('fbjs/lib/invariant');
var ContainerMixin = require('./ContainerMixin');
var RenderLayer = require('./RenderLayer');
var FrameUtils = require('./FrameUtils');
var DrawingUtils = require('./DrawingUtils');
var hitTest = require('./hitTest');
var layoutNode = require('./layoutNode');

/**
 * Surface is a standard React component and acts as the main drawing canvas.
 * ReactCanvas components cannot be rendered outside a Surface.
 */

var Surface = React.createClass({

  mixins: [ContainerMixin],

  propTypes: {
    className: React.PropTypes.string,
    id: React.PropTypes.string,
    top: React.PropTypes.number.isRequired,
    left: React.PropTypes.number.isRequired,
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    scale: React.PropTypes.number.isRequired,
    enableCSSLayout: React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      scale: window.devicePixelRatio || 1
    };
  },

  componentDidMount: function () {
    // Prepare the <canvas> for drawing.
    this.scale();

    // ContainerMixin expects `this.node` to be set prior to mounting children.
    // `this.node` is injected into child components and represents the current
    // render tree.
    this.node = new RenderLayer();
    this.node.frame = FrameUtils.make(this.props.left, this.props.top, this.props.width, this.props.height);
    this.node.draw = this.batchedTick;

    // This is the integration point between custom canvas components and React
    var transaction = ReactUpdates.ReactReconcileTransaction.getPooled();
    transaction.perform(
      this.mountAndInjectChildrenAtRoot,
      this,
      this.props.children,
      transaction
    );
    ReactUpdates.ReactReconcileTransaction.release(transaction);

    // Execute initial draw on mount.
    this.node.draw();
  },

  componentWillUnmount: function () {
    // Implemented in ReactMultiChild.Mixin
    this.unmountChildren();
  },

  componentDidUpdate: function (prevProps, prevState) {
    // We have to manually apply child reconciliation since child are not
    // declared in render().
    var transaction = ReactUpdates.ReactReconcileTransaction.getPooled();
    transaction.perform(
      this.updateChildrenAtRoot,
      this,
      this.props.children,
      transaction
    );
    ReactUpdates.ReactReconcileTransaction.release(transaction);

    // Re-scale the <canvas> when changing size.
    if (prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
      this.scale();
    }

    // Redraw updated render tree to <canvas>.
    if (this.node) {
      this.node.draw();
    }
  },

  render: function () {
    // Scale the drawing area to match DPI.
    var width = this.props.width * this.props.scale;
    var height = this.props.height * this.props.scale;
    var style = {
      width: this.props.width,
      height: this.props.height
    };

    return (
      React.createElement('canvas', {
        ref: 'canvas',
        className: this.props.className,
        id: this.props.id,
        width: width,
        height: height,
        style: style,
        onTouchStart: this.handleTouchStart,
        onTouchMove: this.handleTouchMove,
        onTouchEnd: this.handleTouchEnd,
        onTouchCancel: this.handleTouchEnd,
        onClick: this.handleClick,
        onContextMenu: this.handleContextMenu,
        onDoubleClick: this.handleDoubleClick})
    );
  },

  // Drawing
  // =======

  getContext: function () {
    ('production' !== process.env.NODE_ENV ? invariant(
      this.isMounted(),
      'Tried to access drawing context on an unmounted Surface.'
    ) : invariant(this.isMounted()));
    return this.refs.canvas.getContext('2d');
  },

  scale: function () {
    this.getContext().scale(this.props.scale, this.props.scale);
  },

  batchedTick: function () {
    if (this._frameReady === false) {
      this._pendingTick = true;
      return;
    }
    this.tick();
  },

  tick: function () {
    // Block updates until next animation frame.
    this._frameReady = false;
    this.clear();
    this.draw();
    requestAnimationFrame(this.afterTick);
  },

  afterTick: function () {
    // Execute pending draw that may have been scheduled during previous frame
    this._frameReady = true;
    if (this._pendingTick) {
      this._pendingTick = false;
      this.batchedTick();
    }
  },

  clear: function () {
    this.getContext().clearRect(0, 0, this.props.width, this.props.height);
  },

  draw: function () {
    var layout;
    if (this.node) {
      if (this.props.enableCSSLayout) {
        layout = layoutNode(this.node);
      }
      DrawingUtils.drawRenderLayer(this.getContext(), this.node);
    }
  },

  // Events
  // ======

  hitTest: function (e) {
    var hitTarget = hitTest(e, this.node, this.refs.canvas);
    if (hitTarget) {
      hitTarget[hitTest.getHitHandle(e.type)](e);
    }
  },

  handleTouchStart: function (e) {
    var hitTarget = hitTest(e, this.node, this.refs.canvas);
    var touch;
    if (hitTarget) {
      // On touchstart: capture the current hit target for the given touch.
      this._touches = this._touches || {};
      for (var i=0, len=e.touches.length; i < len; i++) {
        touch = e.touches[i];
        this._touches[touch.identifier] = hitTarget;
      }
      hitTarget[hitTest.getHitHandle(e.type)](e);
    }
  },

  handleTouchMove: function (e) {
    this.hitTest(e);
  },

  handleTouchEnd: function (e) {
    // touchend events do not generate a pageX/pageY so we rely
    // on the currently captured touch targets.
    if (!this._touches) {
      return;
    }

    var hitTarget;
    var hitHandle = hitTest.getHitHandle(e.type);
    for (var i=0, len=e.changedTouches.length; i < len; i++) {
      hitTarget = this._touches[e.changedTouches[i].identifier];
      if (hitTarget && hitTarget[hitHandle]) {
        hitTarget[hitHandle](e);
      }
      delete this._touches[e.changedTouches[i].identifier];
    }
  },

  handleClick: function (e) {
    this.hitTest(e);
  },

  handleContextMenu: function (e) {
    this.hitTest(e);
  },

  handleDoubleClick: function (e) {
    this.hitTest(e);
  },

});

module.exports = Surface;

},{"./ContainerMixin":3,"./DrawingUtils":4,"./FrameUtils":9,"./RenderLayer":19,"./hitTest":24,"./layoutNode":25,"fbjs/lib/invariant":undefined,"react":undefined,"react/lib/ReactUpdates":undefined}],21:[function(require,module,exports){
'use strict';

var createComponent = require('./createComponent');
var LayerMixin = require('./LayerMixin');

var Text = createComponent('Text', LayerMixin, {

  applyTextProps: function (prevProps, props) {
    var style = (props && props.style) ? props.style : {};
    var layer = this.node;

    layer.type = 'text';
    layer.text = childrenAsString(props.children);

    layer.color = style.color;
    layer.fontFace = style.fontFace;
    layer.fontSize = style.fontSize;
    layer.lineHeight = style.lineHeight;
    layer.textAlign = style.textAlign;
  },

  mountComponent: function (rootID, transaction, context) {
    var props = this._currentElement.props;
    var layer = this.node;
    this.applyLayerProps({}, props);
    this.applyTextProps({}, props);
    return layer;
  },

  receiveComponent: function (nextComponent, transaction, context) {
    var props = nextComponent.props;
    var prevProps = this._currentElement.props;
    this.applyLayerProps(prevProps, props);
    this.applyTextProps(prevProps, props);
    this._currentElement = nextComponent;
    this.node.invalidateLayout();
  }

});

function childrenAsString(children) {
  if (!children) {
    return '';
  }
  if (typeof children === 'string') {
    return children;
  }
  if (children.length) {
    return children.join('\n');
  }
  return '';
}

module.exports = Text;
},{"./LayerMixin":15,"./createComponent":23}],22:[function(require,module,exports){
'use strict';

/**
 * Clamp a number between a minimum and maximum value.
 * @param {Number} number
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
*/
module.exports = function (number, min, max) {
  return Math.min(Math.max(number, min), max);
};

},{}],23:[function(require,module,exports){
'use strict';

// Adapted from ReactART:
// https://github.com/reactjs/react-art

var RenderLayer = require('./RenderLayer');

function createComponent (name) {
  var ReactCanvasComponent = function (props) {
    this.node = null;
    this.subscriptions = null;
    this.listeners = null;
    this.node = new RenderLayer();
    this._mountImage = null;
    this._renderedChildren = null;
    this._mostRecentlyPlacedChild = null;
  };
  ReactCanvasComponent.displayName = name;
  for (var i = 1, l = arguments.length; i < l; i++) {
    Object.assign(ReactCanvasComponent.prototype, arguments[i]);
  }

  return ReactCanvasComponent;
}

module.exports = createComponent;

},{"./RenderLayer":19}],24:[function(require,module,exports){
'use strict';

var FrameUtils = require('./FrameUtils');
var EventTypes = require('./EventTypes');

/**
 * RenderLayer hit testing
 *
 * @param {Event} e
 * @param {RenderLayer} rootLayer
 * @param {?HTMLElement} rootNode
 * @return {RenderLayer}
 */
function hitTest (e, rootLayer, rootNode) {
  var touch = e.touches ? e.touches[0] : e;
  var touchX = touch.pageX;
  var touchY = touch.pageY;
  var rootNodeBox;
  if (rootNode) {
    rootNodeBox = rootNode.getBoundingClientRect();
    touchX -= rootNodeBox.left;
    touchY -= rootNodeBox.top;
  }

  touchY = touchY - window.pageYOffset;
  touchX = touchX - window.pageXOffset;
  return getLayerAtPoint(
    rootLayer,
    e.type,
    FrameUtils.make(touchX, touchY, 1, 1),
    rootLayer.translateX || 0,
    rootLayer.translateY || 0
  );
}

/**
 * @private
 */
function sortByZIndexDescending (layer, otherLayer) {
  return (otherLayer.zIndex || 0) - (layer.zIndex || 0);
}

/**
 * @private
 */
function getHitHandle (type) {
  var hitHandle;
  for (var tryHandle in EventTypes) {
    if (EventTypes[tryHandle] === type) {
      hitHandle = tryHandle;
      break;
    }
  }
  return hitHandle;
}

/**
 * @private
 */
function getLayerAtPoint (root, type, point, tx, ty) {
  var layer = null;
  var hitHandle = getHitHandle(type);
  var sortedChildren;
  var hitFrame = FrameUtils.clone(root.frame);

  // Early bail for non-visible layers
  if (typeof root.alpha === 'number' && root.alpha < 0.01) {
    return null;
  }

  // Child-first search
  if (root.children) {
    sortedChildren = root.children.slice().reverse().sort(sortByZIndexDescending);
    for (var i=0, len=sortedChildren.length; i < len; i++) {
      layer = getLayerAtPoint(
        sortedChildren[i],
        type,
        point,
        tx + (root.translateX || 0),
        ty + (root.translateY || 0)
      );
      if (layer) {
        break;
      }
    }
  }

  // Check for hit outsets
  if (root.hitOutsets) {
    hitFrame = FrameUtils.inset(FrameUtils.clone(hitFrame),
      -root.hitOutsets[0], -root.hitOutsets[1],
      -root.hitOutsets[2], -root.hitOutsets[3]
    );
  }

  // Check for x/y translation
  if (tx) {
    hitFrame.x += tx;
  }

  if (ty) {
    hitFrame.y += ty;
  }

  // No child layer at the given point. Try the parent layer.
  if (!layer && root[hitHandle] && FrameUtils.intersects(hitFrame, point)) {
    layer = root;
  }

  return layer;
}

module.exports = hitTest;
module.exports.getHitHandle = getHitHandle;


},{"./EventTypes":6,"./FrameUtils":9}],25:[function(require,module,exports){
'use strict';

var computeLayout = require('./Layout');

/**
 * This computes the CSS layout for a RenderLayer tree and mutates the frame
 * objects at each node.
 *
 * @param {Renderlayer} root
 * @return {Object}
 */
function layoutNode (root) {
  var rootNode = createNode(root);
  computeLayout(rootNode);
  walkNode(rootNode);
  return rootNode;
}

function createNode (layer) {
  return {
    layer: layer,
    layout: {
      width: undefined, // computeLayout will mutate
      height: undefined, // computeLayout will mutate
      top: 0,
      left: 0,
    },
    style: layer._originalStyle || {},
    children: (layer.children || []).map(createNode)
  };
}

function walkNode (node, parentLeft, parentTop) {
  node.layer.frame.x = node.layout.left + (parentLeft || 0);
  node.layer.frame.y = node.layout.top + (parentTop || 0);
  node.layer.frame.width = node.layout.width;
  node.layer.frame.height = node.layout.height;
  if (node.children && node.children.length > 0) {
    node.children.forEach(function (child) {
      walkNode(child, node.layer.frame.x, node.layer.frame.y);
    });
  }
}

module.exports = layoutNode;

},{"./Layout":16}],26:[function(require,module,exports){
'use strict';

var FontFace = require('./FontFace');
var FontUtils = require('./FontUtils');
var LineBreaker = require('linebreak');

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');

var _cache = {};
var _zeroMetrics = {
  width: 0,
  height: 0,
  lines: []
};

function getCacheKey (text, width, fontFace, fontSize, lineHeight) {
  return text + width + fontFace.id + fontSize + lineHeight;
}

/**
 * Given a string of text, available width, and font return the measured width
 * and height.
 * @param {String} text The input string
 * @param {Number} width The available width
 * @param {FontFace} fontFace The FontFace to use
 * @param {Number} fontSize The font size in CSS pixels
 * @param {Number} lineHeight The line height in CSS pixels
 * @return {Object} Measured text size with `width` and `height` members.
 */
module.exports = function measureText (text, width, fontFace, fontSize, lineHeight) {
  var cacheKey = getCacheKey(text, width, fontFace, fontSize, lineHeight);
  var cached = _cache[cacheKey];
  if (cached) {
    return cached;
  }

  // Bail and return zero unless we're sure the font is ready.
  if (!FontUtils.isFontLoaded(fontFace)) {
    return _zeroMetrics;
  }

  var measuredSize = {};
  var textMetrics;
  var lastMeasuredWidth;
  var words;
  var tryLine;
  var currentLine;
  var breaker;
  var bk;
  var lastBreak;

  ctx.font = fontFace.attributes.style + ' ' + fontFace.attributes.weight + ' ' + fontSize + 'px ' + fontFace.family;
  textMetrics = ctx.measureText(text);

  measuredSize.width = textMetrics.width;
  measuredSize.height = lineHeight;
  measuredSize.lines = [];

  if (measuredSize.width <= width) {
    // The entire text string fits.
    measuredSize.lines.push({width: measuredSize.width, text: text});
  } else {
    // Break into multiple lines.
    measuredSize.width = width;
    currentLine = '';
    breaker = new LineBreaker(text);
    
    while (bk = breaker.nextBreak()) {
      var word = text.slice(lastBreak ? lastBreak.position : 0, bk.position);
      
      tryLine = currentLine + word;
      textMetrics = ctx.measureText(tryLine);
      if (textMetrics.width > width || (lastBreak && lastBreak.required)) {
        measuredSize.height += lineHeight;
        measuredSize.lines.push({width: lastMeasuredWidth, text: currentLine.trim()});
        currentLine = word;
        lastMeasuredWidth = ctx.measureText(currentLine.trim()).width;
      } else {
        currentLine = tryLine;
        lastMeasuredWidth = textMetrics.width;
      }
      
      lastBreak = bk;
    }
    
    currentLine = currentLine.trim();
    if (currentLine.length > 0) {
      textMetrics = ctx.measureText(currentLine);
      measuredSize.lines.push({width: textMetrics, text: currentLine});
    }
  }

  _cache[cacheKey] = measuredSize;

  return measuredSize;
};

},{"./FontFace":7,"./FontUtils":8,"linebreak":undefined}]},{},[18]);
