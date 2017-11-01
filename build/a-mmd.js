/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * @author Takahiro / https://github.com/takahirox
 *
 * Dependencies
 *  - ammo.js  https://github.com/kripken/ammo.js/
 *
 * TODO
 *  - Import Ammo.js
 *  - PositionalAudio
 */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before' +
                  'AFRAME was available.');
}

__webpack_require__(1);
__webpack_require__(2);
__webpack_require__(3);
__webpack_require__(4);

// used in MMDLoader
var MMDParser = __webpack_require__(5);
if (window) window.MMDParser = MMDParser;

var mmdLoader = new THREE.MMDLoader();
mmdLoader.setTextureCrossOrigin('anonymous');

var mmdHelper = new THREE.MMDHelper();

AFRAME.registerComponent('mmd', {
  schema: {
    audio: {
      type: 'string'
    },
    autoplay: {
      type: 'boolean',
      default: true
    },
    volume: {
      type: 'number',
      default: 1.0
    },
    audioDelayTime: {
      type: 'number',
      default: 0.0
    },
    afterglow: {
      type: 'number',
      default: 0.0
    }
  },

  init: function () {
    var self = this;
    this.playing = false;
    this.loader = mmdLoader;
    this.helper = null;
    this.el.addEventListener('model-loaded', function() {
      self.setupModelsIfReady();
    });
  },

  update: function () {
    this.remove();
    this.setupHelper();
    this.load();
    this.setupModelsIfReady();
  },

  remove: function () {
    this.cleanupHelper();
  },

  tick: function (time, delta) {
    if (!this.playing) { return; }
    this.helper.animate(delta / 1000);
  },

  play: function () {
    this.playing = true;
  },

  stop: function () {
    this.playing = false;

    var helper = this.helper;

    if (helper === null) { return; }

    var audioManager = helper.audioManager;
    if (audioManager !== null) {
      audioManager.audio.stop();
    }

    var meshes = helper.meshes;
    for (var i = 0, il = meshes.length; i < il; i++) {
      var mixer = meshes[i].mixer;
      if (mixer !== null && mixer !== undefined) {
        mixer.stopAllAction();
      }
    }
  },

  setupHelper: function () {
    // one MMDHelper instance per a mmd component
    this.helper = new THREE.MMDHelper();
  },

  cleanupHelper: function () {
    this.stop();
    this.helper = null;
  },

  load: function () {
    var self = this;
    var audioUrl = this.data.audio;
    var volume = this.data.volume;
    var audioDelayTime = this.data.audioDelayTime;
    var loader = this.loader;
    var helper = this.helper;

    function loadAudio () {
      loader.loadAudio(audioUrl, function (audio, listener) {
        if (volume !== 1.0) { audio.setVolume(volume); }
        listener.position.z = 1;

        var params = {};
        if (audioDelayTime !== 0) {
          params.delayTime = audioDelayTime;
        }
        helper.setAudio(audio, listener, params);

        self.setupModelsIfReady();
      });
    }

    if (audioUrl !== '') {
      loadAudio();
    }
  },

  getMMDEntities: function () {
    var el = this.el;
    var entities = el.querySelectorAll('a-entity');

    var readIndex = 0;
    var writeIndex = 0;
    for(var i = 0, il = entities.length; i < il; i++) {
      var entity = entities[i];
      if (entity.getAttribute('mmd-model') !== null) {
        entities[writeIndex] = entities[readIndex];
        writeIndex++;
      }
      readIndex++;
    }
    entities.length = writeIndex;

    return entities;
  },

  setupModelsIfReady: function () {
    if (this.checkIfReady()) { this.setupModels(); }
  },

  checkIfReady: function () {
    return (this.helper !== null &&
      this.checkIfAudioReady() && this.checkIfModelsReady());
  },

  checkIfAudioReady: function () {
    return (this.data.audio === '') || (this.helper.audioManager !== null);
  },

  checkIfModelsReady: function () {
    var entities = this.getMMDEntities();

    for(var i = 0, il = entities.length; i < il; i++) {
      if (entities[i].getObject3D('mesh') === undefined) { return false; }
    }

    return true;
  },

  setupModels: function () {
    var helper = this.helper;
    var afterglow = this.data.afterglow;
    var autoplay = this.data.autoplay;

    var entities = this.getMMDEntities();

    for(var i = 0, il = entities.length; i < il; i++) {
      var mesh = entities[i].getObject3D('mesh');
      if (mesh !== undefined) {
        helper.setAnimation(mesh);
        helper.add(mesh);
      }
    }

    var params = {};
    if (afterglow !== 0) {
      params.afterglow = afterglow;
    }
    helper.unifyAnimationDuration(params);

    // blink animation duration should be independent of other animations.
    // so set it after we call unifyAnimationDuration().
    for (var i = 0, il = helper.meshes.length; i < il; i++) {
      var mesh = helper.meshes[i];
      mesh.looped = true;
      if (mesh.blink) { this.setBlink(mesh); }
      delete mesh.blink;
    }

    if (autoplay) { this.play(); }
  },

  setBlink: function (mesh) {
    var blinkMorphName = 'まばたき';

    this.removeBlinkFromMorphAnimations(mesh, blinkMorphName);

    var loader = this.loader;
    var offset = (Math.random() * 10) | 0;

    var vmd = {
      metadata: {
        name: 'blink',
        coordinateSystem: 'right',
        morphCount: 14,
        cameraCount: 0,
        motionCount: 0
      },
      morphs: [
        {frameNum: 0, morphName: blinkMorphName, weight: 0.0},
        {frameNum: offset + 10, morphName: blinkMorphName, weight: 0.0},
        {frameNum: offset + 15, morphName: blinkMorphName, weight: 1.0},
        {frameNum: offset + 16, morphName: blinkMorphName, weight: 1.0},
        {frameNum: offset + 20, morphName: blinkMorphName, weight: 0.0},
        {frameNum: offset + 40, morphName: blinkMorphName, weight: 0.0},
        {frameNum: offset + 43, morphName: blinkMorphName, weight: 1.0},
        {frameNum: offset + 44, morphName: blinkMorphName, weight: 1.0},
        {frameNum: offset + 46, morphName: blinkMorphName, weight: 0.0},
        {frameNum: offset + 49, morphName: blinkMorphName, weight: 0.0},
        {frameNum: offset + 52, morphName: blinkMorphName, weight: 1.0},
        {frameNum: offset + 53, morphName: blinkMorphName, weight: 1.0},
        {frameNum: offset + 55, morphName: blinkMorphName, weight: 0.0},
        {frameNum: offset + 200, morphName: blinkMorphName, weight: 0.0}
      ],
      cameras: [],
      motions: []
    };
    loader.pourVmdIntoModel(mesh, vmd, 'blink');
    if (mesh.mixer === null || mesh.mixer === undefined) {
      mesh.mixer = new THREE.AnimationMixer(mesh);
    }
    var animations = mesh.geometry.animations;
    var clip = animations[animations.length-1];;
    var action = mesh.mixer.clipAction(clip);
    action.play();
    action.weight = animations.length;
  },

  removeBlinkFromMorphAnimations: function (mesh, blinkMorphName) {
    if (mesh.geometry.animations === undefined) { return; }
    if (mesh.morphTargetDictionary === undefined) { return; }

    var index = mesh.morphTargetDictionary[ blinkMorphName ];

    if (index === undefined) { return; }

    for (var i = 0, il = mesh.geometry.animations.length; i < il; i++ ) {
      var tracks = mesh.geometry.animations[i].tracks;
      for (var j = 0, jl = tracks.length; j < jl; j++) {
        if (tracks[j].name === '.morphTargetInfluences[' + index + ']') {
          tracks.splice(j, 1);
          break;
        }
      }
    }
  }
});

AFRAME.registerComponent('mmd-model', {
  schema: {
    model: {
      type: 'string'
    },
    vpd: {
      type: 'string'
    },
    vmd: {
      type: 'string'
    },
    physics: {
      type: 'boolean',
      default: false
    },
    blink: {
      type: 'boolean',
      default: false
    }
  },

  init: function () {
    this.model = null;
    this.loader = mmdLoader;
    this.helper = mmdHelper;
  },

  update: function () {
    var data = this.data;
    if (!data.model) { return; }
    this.remove();
    this.load();
  },

  remove: function () {
    if (!this.model) { return; }
    this.el.removeObject3D('mesh');
  },

  load: function () {
    var self = this;
    var el = this.el;
    var modelUrl = this.data.model;
    var vpdUrl = this.data.vpd;
    var vmdUrl = this.data.vmd;
    var physicsFlag = this.data.physics;
    var loader = this.loader;
    var helper = this.helper;

    function loadModel () {
      loader.loadModel(modelUrl, function (object) {
        var mesh = object;

        if (physicsFlag) {
          helper.setPhysics(mesh);
        }

        if (vmdUrl !== '') {
          loadVmd(mesh);
        } else if (vpdUrl !== '') {
          loadVpd(mesh);
        } else {
          setup(mesh);
        }
      });
    }

    function loadVpd (mesh) {
      loader.loadVpd(vpdUrl, function (vpd) {
        helper.poseAsVpd(mesh, vpd);
        setup(mesh);
      });
    }

    function loadVmd (mesh) {
      var urls = vmdUrl.replace(/\s/g, '').split(',');
      loader.loadVmds(urls, function (vmd) {
        loader.pourVmdIntoModel(mesh, vmd);
        setup(mesh);
      });
    }

    function setup (mesh) {
      // this property will be removed in mmd.setupModels()
      mesh.blink = self.data.blink;

      self.model = mesh;
      el.setObject3D('mesh', mesh);
      el.emit('model-loaded', {format: 'mmd', model: mesh});
    }

    if (modelUrl !== '') { loadModel(); }
  }
});


/***/ }),
/* 1 */
/***/ (function(module, exports) {

/*
 * @author Daosheng Mu / https://github.com/DaoshengMu/
 * @author mrdoob / http://mrdoob.com/
 * @author takahirox / https://github.com/takahirox/
 */

THREE.TGALoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.TGALoader.prototype = {

	constructor: THREE.TGALoader,

	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var texture = new THREE.Texture();

		var loader = new THREE.FileLoader( this.manager );
		loader.setResponseType( 'arraybuffer' );

		loader.load( url, function ( buffer ) {

			texture.image = scope.parse( buffer );
			texture.needsUpdate = true;

			if ( onLoad !== undefined ) {

				onLoad( texture );

			}

		}, onProgress, onError );

		return texture;

	},

	parse: function ( buffer ) {

		// reference from vthibault, https://github.com/vthibault/roBrowser/blob/master/src/Loaders/Targa.js

		function tgaCheckHeader( header ) {

			switch ( header.image_type ) {

				// check indexed type

				case TGA_TYPE_INDEXED:
				case TGA_TYPE_RLE_INDEXED:
					if ( header.colormap_length > 256 || header.colormap_size !== 24 || header.colormap_type !== 1 ) {

						console.error( 'THREE.TGALoader: Invalid type colormap data for indexed type.' );

					}
					break;

				// check colormap type

				case TGA_TYPE_RGB:
				case TGA_TYPE_GREY:
				case TGA_TYPE_RLE_RGB:
				case TGA_TYPE_RLE_GREY:
					if ( header.colormap_type ) {

						console.error( 'THREE.TGALoader: Invalid type colormap data for colormap type.' );

					}
					break;

				// What the need of a file without data ?

				case TGA_TYPE_NO_DATA:
					console.error( 'THREE.TGALoader: No data.' );

				// Invalid type ?

				default:
					console.error( 'THREE.TGALoader: Invalid type "%s".',  header.image_type );

			}

			// check image width and height

			if ( header.width <= 0 || header.height <= 0 ) {

				console.error( 'THREE.TGALoader: Invalid image size.' );

			}

			// check image pixel size

			if ( header.pixel_size !== 8  && header.pixel_size !== 16 &&
				header.pixel_size !== 24 && header.pixel_size !== 32 ) {

				console.error( 'THREE.TGALoader: Invalid pixel size "%s".', header.pixel_size );

			}

		}

		// parse tga image buffer

		function tgaParse( use_rle, use_pal, header, offset, data ) {

			var pixel_data,
				pixel_size,
				pixel_total,
				palettes;

			pixel_size = header.pixel_size >> 3;
			pixel_total = header.width * header.height * pixel_size;

			 // read palettes

			 if ( use_pal ) {

				 palettes = data.subarray( offset, offset += header.colormap_length * ( header.colormap_size >> 3 ) );

			 }

			 // read RLE

			 if ( use_rle ) {

				 pixel_data = new Uint8Array( pixel_total );

				var c, count, i;
				var shift = 0;
				var pixels = new Uint8Array( pixel_size );

				while ( shift < pixel_total ) {

					c = data[ offset ++ ];
					count = ( c & 0x7f ) + 1;

					// RLE pixels

					if ( c & 0x80 ) {

						// bind pixel tmp array

						for ( i = 0; i < pixel_size; ++ i ) {

							pixels[ i ] = data[ offset ++ ];

						}

						// copy pixel array

						for ( i = 0; i < count; ++ i ) {

							pixel_data.set( pixels, shift + i * pixel_size );

						}

						shift += pixel_size * count;

					} else {

						// raw pixels

						count *= pixel_size;
						for ( i = 0; i < count; ++ i ) {

							pixel_data[ shift + i ] = data[ offset ++ ];

						}
						shift += count;

					}

				}

			 } else {

				// raw pixels

				pixel_data = data.subarray(
					 offset, offset += ( use_pal ? header.width * header.height : pixel_total )
				);

			 }

			 return {
				pixel_data: pixel_data,
				palettes: palettes
			 };

		}

		function tgaGetImageData8bits( imageData, y_start, y_step, y_end, x_start, x_step, x_end, image, palettes ) {

			var colormap = palettes;
			var color, i = 0, x, y;
			var width = header.width;

			for ( y = y_start; y !== y_end; y += y_step ) {

				for ( x = x_start; x !== x_end; x += x_step, i ++ ) {

					color = image[ i ];
					imageData[ ( x + width * y ) * 4 + 3 ] = 255;
					imageData[ ( x + width * y ) * 4 + 2 ] = colormap[ ( color * 3 ) + 0 ];
					imageData[ ( x + width * y ) * 4 + 1 ] = colormap[ ( color * 3 ) + 1 ];
					imageData[ ( x + width * y ) * 4 + 0 ] = colormap[ ( color * 3 ) + 2 ];

				}

			}

			return imageData;

		}

		function tgaGetImageData16bits( imageData, y_start, y_step, y_end, x_start, x_step, x_end, image ) {

			var color, i = 0, x, y;
			var width = header.width;

			for ( y = y_start; y !== y_end; y += y_step ) {

				for ( x = x_start; x !== x_end; x += x_step, i += 2 ) {

					color = image[ i + 0 ] + ( image[ i + 1 ] << 8 ); // Inversed ?
					imageData[ ( x + width * y ) * 4 + 0 ] = ( color & 0x7C00 ) >> 7;
					imageData[ ( x + width * y ) * 4 + 1 ] = ( color & 0x03E0 ) >> 2;
					imageData[ ( x + width * y ) * 4 + 2 ] = ( color & 0x001F ) >> 3;
					imageData[ ( x + width * y ) * 4 + 3 ] = ( color & 0x8000 ) ? 0 : 255;

				}

			}

			return imageData;

		}

		function tgaGetImageData24bits( imageData, y_start, y_step, y_end, x_start, x_step, x_end, image ) {

			var i = 0, x, y;
			var width = header.width;

			for ( y = y_start; y !== y_end; y += y_step ) {

				for ( x = x_start; x !== x_end; x += x_step, i += 3 ) {

					imageData[ ( x + width * y ) * 4 + 3 ] = 255;
					imageData[ ( x + width * y ) * 4 + 2 ] = image[ i + 0 ];
					imageData[ ( x + width * y ) * 4 + 1 ] = image[ i + 1 ];
					imageData[ ( x + width * y ) * 4 + 0 ] = image[ i + 2 ];

				}

			}

			return imageData;

		}

		function tgaGetImageData32bits( imageData, y_start, y_step, y_end, x_start, x_step, x_end, image ) {

			var i = 0, x, y;
			var width = header.width;

			for ( y = y_start; y !== y_end; y += y_step ) {

				for ( x = x_start; x !== x_end; x += x_step, i += 4 ) {

					imageData[ ( x + width * y ) * 4 + 2 ] = image[ i + 0 ];
					imageData[ ( x + width * y ) * 4 + 1 ] = image[ i + 1 ];
					imageData[ ( x + width * y ) * 4 + 0 ] = image[ i + 2 ];
					imageData[ ( x + width * y ) * 4 + 3 ] = image[ i + 3 ];

				}

			}

			return imageData;

		}

		function tgaGetImageDataGrey8bits( imageData, y_start, y_step, y_end, x_start, x_step, x_end, image ) {

			var color, i = 0, x, y;
			var width = header.width;

			for ( y = y_start; y !== y_end; y += y_step ) {

				for ( x = x_start; x !== x_end; x += x_step, i ++ ) {

					color = image[ i ];
					imageData[ ( x + width * y ) * 4 + 0 ] = color;
					imageData[ ( x + width * y ) * 4 + 1 ] = color;
					imageData[ ( x + width * y ) * 4 + 2 ] = color;
					imageData[ ( x + width * y ) * 4 + 3 ] = 255;

				}

			}

			return imageData;

		}

		function tgaGetImageDataGrey16bits( imageData, y_start, y_step, y_end, x_start, x_step, x_end, image ) {

			var i = 0, x, y;
			var width = header.width;

			for ( y = y_start; y !== y_end; y += y_step ) {

				for ( x = x_start; x !== x_end; x += x_step, i += 2 ) {

					imageData[ ( x + width * y ) * 4 + 0 ] = image[ i + 0 ];
					imageData[ ( x + width * y ) * 4 + 1 ] = image[ i + 0 ];
					imageData[ ( x + width * y ) * 4 + 2 ] = image[ i + 0 ];
					imageData[ ( x + width * y ) * 4 + 3 ] = image[ i + 1 ];

				}

			}

			return imageData;

		}

		function getTgaRGBA( data, width, height, image, palette ) {

			var x_start,
				y_start,
				x_step,
				y_step,
				x_end,
				y_end;

			switch ( ( header.flags & TGA_ORIGIN_MASK ) >> TGA_ORIGIN_SHIFT ) {
				default:
				case TGA_ORIGIN_UL:
					x_start = 0;
					x_step = 1;
					x_end = width;
					y_start = 0;
					y_step = 1;
					y_end = height;
					break;

				case TGA_ORIGIN_BL:
					x_start = 0;
					x_step = 1;
					x_end = width;
					y_start = height - 1;
					y_step = - 1;
					y_end = - 1;
					break;

				case TGA_ORIGIN_UR:
					x_start = width - 1;
					x_step = - 1;
					x_end = - 1;
					y_start = 0;
					y_step = 1;
					y_end = height;
					break;

				case TGA_ORIGIN_BR:
					x_start = width - 1;
					x_step = - 1;
					x_end = - 1;
					y_start = height - 1;
					y_step = - 1;
					y_end = - 1;
					break;

			}

			if ( use_grey ) {

				switch ( header.pixel_size ) {
					case 8:
						tgaGetImageDataGrey8bits( data, y_start, y_step, y_end, x_start, x_step, x_end, image );
						break;
					case 16:
						tgaGetImageDataGrey16bits( data, y_start, y_step, y_end, x_start, x_step, x_end, image );
						break;
					default:
						console.error( 'THREE.TGALoader: Format not supported.' );
						break;
				}

			} else {

				switch ( header.pixel_size ) {
					case 8:
						tgaGetImageData8bits( data, y_start, y_step, y_end, x_start, x_step, x_end, image, palette );
						break;

					case 16:
						tgaGetImageData16bits( data, y_start, y_step, y_end, x_start, x_step, x_end, image );
						break;

					case 24:
						tgaGetImageData24bits( data, y_start, y_step, y_end, x_start, x_step, x_end, image );
						break;

					case 32:
						tgaGetImageData32bits( data, y_start, y_step, y_end, x_start, x_step, x_end, image );
						break;

					default:
						console.error( 'THREE.TGALoader: Format not supported.' );
						break;
				}

			}

			// Load image data according to specific method
			// var func = 'tgaGetImageData' + (use_grey ? 'Grey' : '') + (header.pixel_size) + 'bits';
			// func(data, y_start, y_step, y_end, x_start, x_step, x_end, width, image, palette );
			return data;

		}

		// TGA constants

		var TGA_TYPE_NO_DATA = 0,
		TGA_TYPE_INDEXED = 1,
		TGA_TYPE_RGB = 2,
		TGA_TYPE_GREY = 3,
		TGA_TYPE_RLE_INDEXED = 9,
		TGA_TYPE_RLE_RGB = 10,
		TGA_TYPE_RLE_GREY = 11,

		TGA_ORIGIN_MASK = 0x30,
		TGA_ORIGIN_SHIFT = 0x04,
		TGA_ORIGIN_BL = 0x00,
		TGA_ORIGIN_BR = 0x01,
		TGA_ORIGIN_UL = 0x02,
		TGA_ORIGIN_UR = 0x03;

		if ( buffer.length < 19 ) console.error( 'THREE.TGALoader: Not enough data to contain header.' );

		var content = new Uint8Array( buffer ),
			offset = 0,
			header = {
				id_length: content[ offset ++ ],
				colormap_type: content[ offset ++ ],
				image_type: content[ offset ++ ],
				colormap_index: content[ offset ++ ] | content[ offset ++ ] << 8,
				colormap_length: content[ offset ++ ] | content[ offset ++ ] << 8,
				colormap_size: content[ offset ++ ],
				origin: [
					content[ offset ++ ] | content[ offset ++ ] << 8,
					content[ offset ++ ] | content[ offset ++ ] << 8
				],
				width: content[ offset ++ ] | content[ offset ++ ] << 8,
				height: content[ offset ++ ] | content[ offset ++ ] << 8,
				pixel_size: content[ offset ++ ],
				flags: content[ offset ++ ]
			};

			// check tga if it is valid format

			tgaCheckHeader( header );

			if ( header.id_length + offset > buffer.length ) {

				console.error( 'THREE.TGALoader: No data.' );

			}

			// skip the needn't data

			offset += header.id_length;

			// get targa information about RLE compression and palette

			var use_rle = false,
				use_pal = false,
				use_grey = false;

			switch ( header.image_type ) {

				case TGA_TYPE_RLE_INDEXED:
					use_rle = true;
					use_pal = true;
					break;

				case TGA_TYPE_INDEXED:
					use_pal = true;
					break;

				case TGA_TYPE_RLE_RGB:
					use_rle = true;
					break;

				case TGA_TYPE_RGB:
					break;

				case TGA_TYPE_RLE_GREY:
					use_rle = true;
					use_grey = true;
					break;

				case TGA_TYPE_GREY:
					use_grey = true;
					break;

			}

			//

			var canvas = document.createElement( 'canvas' );
			canvas.width = header.width;
			canvas.height = header.height;

			var context = canvas.getContext( '2d' );
			var imageData = context.createImageData( header.width, header.height );

			var result = tgaParse( use_rle, use_pal, header, offset, content );
			var rgbaData = getTgaRGBA( imageData.data, header.width, header.height, result.pixel_data, result.palettes );

			context.putImageData( imageData, 0, 0 );

			return canvas;

	}

};


/***/ }),
/* 2 */
/***/ (function(module, exports) {

/**
 * @author takahiro / https://github.com/takahirox
 *
 * Dependencies
 *  - mmd-parser https://github.com/takahirox/mmd-parser
 *  - ammo.js https://github.com/kripken/ammo.js
 *  - THREE.TGALoader
 *  - THREE.MMDPhysics
 *  - THREE.CCDIKSolver
 *  - THREE.OutlineEffect
 *
 *
 * This loader loads and parses PMD/PMX and VMD binary files
 * then creates mesh for Three.js.
 *
 * PMD/PMX is a model data format and VMD is a motion data format
 * used in MMD(Miku Miku Dance).
 *
 * MMD is a 3D CG animation tool which is popular in Japan.
 *
 *
 * MMD official site
 *  http://www.geocities.jp/higuchuu4/index_e.htm
 *
 * PMD, VMD format
 *  http://blog.goo.ne.jp/torisu_tetosuki/e/209ad341d3ece2b1b4df24abf619d6e4
 *
 * PMX format
 *  http://gulshan-i-raz.geo.jp/labs/2012/10/17/pmx-format1/
 *
 *
 * TODO
 *  - light motion in vmd support.
 *  - SDEF support.
 *  - uv/material/bone morphing support.
 *  - more precise grant skinning support.
 *  - shadow support.
 */

THREE.MMDLoader = function ( manager ) {

	THREE.Loader.call( this );
	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;
	this.parser = new MMDParser.Parser();
	this.textureCrossOrigin = null;

};

THREE.MMDLoader.prototype = Object.create( THREE.Loader.prototype );
THREE.MMDLoader.prototype.constructor = THREE.MMDLoader;

/*
 * base64 encoded defalut toon textures toon00.bmp - toon10.bmp
 * Users don't need to prepare default texture files.
 *
 * This idea is from http://www20.atpages.jp/katwat/three.js_r58/examples/mytest37/mmd.three.js
 */
THREE.MMDLoader.prototype.defaultToonTextures = [
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAL0lEQVRYR+3QQREAAAzCsOFfNJPBJ1XQS9r2hsUAAQIECBAgQIAAAQIECBAgsBZ4MUx/ofm2I/kAAAAASUVORK5CYII=',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAN0lEQVRYR+3WQREAMBACsZ5/bWiiMvgEBTt5cW37hjsBBAgQIECAwFwgyfYPCCBAgAABAgTWAh8aBHZBl14e8wAAAABJRU5ErkJggg==',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAOUlEQVRYR+3WMREAMAwDsYY/yoDI7MLwIiP40+RJklfcCCBAgAABAgTqArfb/QMCCBAgQIAAgbbAB3z/e0F3js2cAAAAAElFTkSuQmCC',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAN0lEQVRYR+3WQREAMBACsZ5/B5ilMvgEBTt5cW37hjsBBAgQIECAwFwgyfYPCCBAgAABAgTWAh81dWyx0gFwKAAAAABJRU5ErkJggg==',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAOklEQVRYR+3WoREAMAwDsWb/UQtCy9wxTOQJ/oQ8SXKKGwEECBAgQIBAXeDt7f4BAQQIECBAgEBb4AOz8Hzx7WLY4wAAAABJRU5ErkJggg==',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABPUlEQVRYR+1XwW7CMAy1+f9fZOMysSEOEweEOPRNdm3HbdOyIhAcklPrOs/PLy9RygBALxzcCDQFmgJNgaZAU6Ap0BR4PwX8gsRMVLssMRH5HcpzJEaWL7EVg9F1IHRlyqQohgVr4FGUlUcMJSjcUlDw0zvjeun70cLWmneoyf7NgBTQSniBTQQSuJAZsOnnaczjIMb5hCiuHKxokCrJfVnrctyZL0PkJAJe1HMil4nxeyi3Ypfn1kX51jpPvo/JeCNC4PhVdHdJw2XjBR8brF8PEIhNVn12AgP7uHsTBguBn53MUZCqv7Lp07Pn5k1Ro+uWmUNn7D+M57rtk7aG0Vo73xyF/fbFf0bPJjDXngnGocDTdFhygZjwUQrMNrDcmZlQT50VJ/g/UwNyHpu778+yW+/ksOz/BFo54P4AsUXMfRq7XWsAAAAASUVORK5CYII=',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACMElEQVRYR+2Xv4pTQRTGf2dubhLdICiii2KnYKHVolhauKWPoGAnNr6BD6CvIVaihYuI2i1ia0BY0MZGRHQXjZj/mSPnnskfNWiWZUlzJ5k7M2cm833nO5Mziej2DWWJRUoCpQKlAntSQCqgw39/iUWAGmh37jrRnVsKlgpiqmkoGVABA7E57fvY+pJDdgKqF6HzFCSADkDq+F6AHABtQ+UMVE5D7zXod7fFNhTEckTbj5XQgHzNN+5tQvc5NG7C6BNkp6D3EmpXHDR+dQAjFLchW3VS9rlw3JBh+B7ys5Cf9z0GW1C/7P32AyBAOAz1q4jGliIH3YPuBnSfQX4OGreTIgEYQb/pBDtPnEQ4CivXYPAWBk13oHrB54yA9QuSn2H4AcKRpEILDt0BUzj+RLR1V5EqjD66NPRBVpLcQwjHoHYJOhsQv6U4mnzmrIXJCFr4LDwm/xBUoboG9XX4cc9VKdYoSA2yk5NQLJaKDUjTBoveG3Z2TElTxwjNK4M3LEZgUdDdruvcXzKBpStgp2NPiWi3ks9ZXxIoFVi+AvHLdc9TqtjL3/aYjpPlrzOcEnK62Szhimdd7xX232zFDTgtxezOu3WNMRLjiKgjtOhHVMd1loynVHvOgjuIIJMaELEqhJAV/RCSLbWTcfPFakFgFlALTRRvx+ok6Hlp/Q+v3fmx90bMyUzaEAhmM3KvHlXTL5DxnbGf/1M8RNNACLL5MNtPxP/mypJAqcDSFfgFhpYqWUzhTEAAAAAASUVORK5CYII=',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAL0lEQVRYR+3QQREAAAzCsOFfNJPBJ1XQS9r2hsUAAQIECBAgQIAAAQIECBAgsBZ4MUx/ofm2I/kAAAAASUVORK5CYII=',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAL0lEQVRYR+3QQREAAAzCsOFfNJPBJ1XQS9r2hsUAAQIECBAgQIAAAQIECBAgsBZ4MUx/ofm2I/kAAAAASUVORK5CYII=',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAL0lEQVRYR+3QQREAAAzCsOFfNJPBJ1XQS9r2hsUAAQIECBAgQIAAAQIECBAgsBZ4MUx/ofm2I/kAAAAASUVORK5CYII=',
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAL0lEQVRYR+3QQREAAAzCsOFfNJPBJ1XQS9r2hsUAAQIECBAgQIAAAQIECBAgsBZ4MUx/ofm2I/kAAAAASUVORK5CYII='
];

/*
 * Set 'anonymous' for the the texture image file in other domain
 * even if server responds with "Access-Control-Allow-Origin: *"
 * because some image operation fails in MMDLoader.
 */
THREE.MMDLoader.prototype.setTextureCrossOrigin = function ( value ) {

	this.textureCrossOrigin = value;

};

THREE.MMDLoader.prototype.load = function ( modelUrl, vmdUrls, callback, onProgress, onError ) {

	var scope = this;

	this.loadModel( modelUrl, function ( mesh ) {

		scope.loadVmds( vmdUrls, function ( vmd ) {

			scope.pourVmdIntoModel( mesh, vmd );
			callback( mesh );

		}, onProgress, onError );

	}, onProgress, onError );

};

THREE.MMDLoader.prototype.loadModel = function ( url, callback, onProgress, onError ) {

	var scope = this;

	var texturePath = this.extractUrlBase( url );
	var modelExtension = this.extractExtension( url );

	this.loadFileAsBuffer( url, function ( buffer ) {

		callback( scope.createModel( buffer, modelExtension, texturePath, onProgress, onError ) );

	}, onProgress, onError );

};

THREE.MMDLoader.prototype.createModel = function ( buffer, modelExtension, texturePath, onProgress, onError ) {

	return this.createMesh( this.parseModel( buffer, modelExtension ), texturePath, onProgress, onError );

};

THREE.MMDLoader.prototype.loadVmd = function ( url, callback, onProgress, onError ) {

	var scope = this;

	this.loadFileAsBuffer( url, function ( buffer ) {

		callback( scope.parseVmd( buffer ) );

	}, onProgress, onError );

};

THREE.MMDLoader.prototype.loadVmds = function ( urls, callback, onProgress, onError ) {

	var scope = this;

	var vmds = [];
	urls = urls.slice();

	function run () {

		var url = urls.shift();

		scope.loadVmd( url, function ( vmd ) {

			vmds.push( vmd );

			if ( urls.length > 0 ) {

				run();

			} else {

				callback( scope.mergeVmds( vmds ) );

			}

		}, onProgress, onError );

	}

	run();

};

THREE.MMDLoader.prototype.loadAudio = function ( url, callback, onProgress, onError ) {

	var listener = new THREE.AudioListener();
	var audio = new THREE.Audio( listener );
	var loader = new THREE.AudioLoader( this.manager );

	loader.load( url, function ( buffer ) {

		audio.setBuffer( buffer );
		callback( audio, listener );

	}, onProgress, onError );

};

THREE.MMDLoader.prototype.loadVpd = function ( url, callback, onProgress, onError, params ) {

	var scope = this;

	var func = ( ( params && params.charcode === 'unicode' ) ? this.loadFileAsText : this.loadFileAsShiftJISText ).bind( this );

	func( url, function ( text ) {

		callback( scope.parseVpd( text ) );

	}, onProgress, onError );

};

THREE.MMDLoader.prototype.parseModel = function ( buffer, modelExtension ) {

	// Should I judge from model data header?
	switch( modelExtension.toLowerCase() ) {

		case 'pmd':
			return this.parsePmd( buffer );

		case 'pmx':
			return this.parsePmx( buffer );

		default:
			throw 'extension ' + modelExtension + ' is not supported.';

	}

};

THREE.MMDLoader.prototype.parsePmd = function ( buffer ) {

	return this.parser.parsePmd( buffer, true );

};

THREE.MMDLoader.prototype.parsePmx = function ( buffer ) {

	return this.parser.parsePmx( buffer, true );

};

THREE.MMDLoader.prototype.parseVmd = function ( buffer ) {

	return this.parser.parseVmd( buffer, true );

};

THREE.MMDLoader.prototype.parseVpd = function ( text ) {

	return this.parser.parseVpd( text, true );

};

THREE.MMDLoader.prototype.mergeVmds = function ( vmds ) {

	return this.parser.mergeVmds( vmds );

};

THREE.MMDLoader.prototype.pourVmdIntoModel = function ( mesh, vmd, name ) {

	this.createAnimation( mesh, vmd, name );

};

THREE.MMDLoader.prototype.pourVmdIntoCamera = function ( camera, vmd, name ) {

	var helper = new THREE.MMDLoader.DataCreationHelper();

	var initAnimation = function () {

		var orderedMotions = helper.createOrderedMotionArray( vmd.cameras );

		var times = [];
		var centers = [];
		var quaternions = [];
		var positions = [];
		var fovs = [];

		var cInterpolations = [];
		var qInterpolations = [];
		var pInterpolations = [];
		var fInterpolations = [];

		var quaternion = new THREE.Quaternion();
		var euler = new THREE.Euler();
		var position = new THREE.Vector3();
		var center = new THREE.Vector3();

		var pushVector3 = function ( array, vec ) {

			array.push( vec.x );
			array.push( vec.y );
			array.push( vec.z );

		};

		var pushQuaternion = function ( array, q ) {

			array.push( q.x );
			array.push( q.y );
			array.push( q.z );
			array.push( q.w );

		};

		var pushInterpolation = function ( array, interpolation, index ) {

			array.push( interpolation[ index * 4 + 0 ] / 127 ); // x1
			array.push( interpolation[ index * 4 + 1 ] / 127 ); // x2
			array.push( interpolation[ index * 4 + 2 ] / 127 ); // y1
			array.push( interpolation[ index * 4 + 3 ] / 127 ); // y2

		};

		var createTrack = function ( node, type, times, values, interpolations ) {

			/*
			 * optimizes here not to let KeyframeTrackPrototype optimize
			 * because KeyframeTrackPrototype optimizes times and values but
			 * doesn't optimize interpolations.
			 */
			if ( times.length > 2 ) {

				times = times.slice();
				values = values.slice();
				interpolations = interpolations.slice();

				var stride = values.length / times.length;
				var interpolateStride = ( stride === 3 ) ? 12 : 4;  // 3: Vector3, others: Quaternion or Number

				var index = 1;

				for ( var aheadIndex = 2, endIndex = times.length; aheadIndex < endIndex; aheadIndex ++ ) {

					for ( var i = 0; i < stride; i ++ ) {

						if ( values[ index * stride + i ] !== values[ ( index - 1 ) * stride + i ] ||
							values[ index * stride + i ] !== values[ aheadIndex * stride + i ] ) {

							index ++;
							break;

						}

					}

					if ( aheadIndex > index ) {

						times[ index ] = times[ aheadIndex ];

						for ( var i = 0; i < stride; i ++ ) {

							values[ index * stride + i ] = values[ aheadIndex * stride + i ];

						}

						for ( var i = 0; i < interpolateStride; i ++ ) {

							interpolations[ index * interpolateStride + i ] = interpolations[ aheadIndex * interpolateStride + i ];

						}

					}

				}

				times.length = index + 1;
				values.length = ( index + 1 ) * stride;
				interpolations.length = ( index + 1 ) * interpolateStride;

			}

			return new THREE.MMDLoader[ type ]( node, times, values, interpolations );

		};

		for ( var i = 0; i < orderedMotions.length; i++ ) {

			var m = orderedMotions[ i ];

			var time = m.frameNum / 30;
			var pos = m.position;
			var rot = m.rotation;
			var distance = m.distance;
			var fov = m.fov;
			var interpolation = m.interpolation;

			position.set( 0, 0, -distance );
			center.set( pos[ 0 ], pos[ 1 ], pos[ 2 ] );

			euler.set( -rot[ 0 ], -rot[ 1 ], -rot[ 2 ] );
			quaternion.setFromEuler( euler );

			position.add( center );
			position.applyQuaternion( quaternion );

			/*
			 * Note: This is a workaround not to make Animation system calculate lerp
			 *       if the diff from the last frame is 1 frame (in 30fps).
			 */
			if ( times.length > 0 && time < times[ times.length - 1 ] + ( 1 / 30 ) * 1.5 ) {

				times[ times.length - 1 ] = time - 1e-13;

			}

			times.push( time );

			pushVector3( centers, center );
			pushQuaternion( quaternions, quaternion );
			pushVector3( positions, position );

			fovs.push( fov );

			for ( var j = 0; j < 3; j ++ ) {

				pushInterpolation( cInterpolations, interpolation, j );

			}

			pushInterpolation( qInterpolations, interpolation, 3 );

			// use same one parameter for x, y, z axis.
			for ( var j = 0; j < 3; j ++ ) {

				pushInterpolation( pInterpolations, interpolation, 4 );

			}

			pushInterpolation( fInterpolations, interpolation, 5 );

		}

		if ( times.length === 0 ) return;

		var tracks = [];

		tracks.push( createTrack( '.center', 'VectorKeyframeTrackEx', times, centers, cInterpolations ) );
		tracks.push( createTrack( '.quaternion', 'QuaternionKeyframeTrackEx', times, quaternions, qInterpolations ) );
		tracks.push( createTrack( '.position', 'VectorKeyframeTrackEx', times, positions, pInterpolations ) );
		tracks.push( createTrack( '.fov', 'NumberKeyframeTrackEx', times, fovs, fInterpolations ) );

		var clip = new THREE.AnimationClip( name === undefined ? THREE.Math.generateUUID() : name, -1, tracks );

		if ( camera.center === undefined ) camera.center = new THREE.Vector3( 0, 0, 0 );
		if ( camera.animations === undefined ) camera.animations = [];
		camera.animations.push( clip );

	};

	initAnimation();

};

THREE.MMDLoader.prototype.extractExtension = function ( url ) {

	var index = url.lastIndexOf( '.' );

	if ( index < 0 ) {

		return null;

	}

	return url.slice( index + 1 );

};

THREE.MMDLoader.prototype.loadFile = function ( url, onLoad, onProgress, onError, responseType, mimeType ) {

	var loader = new THREE.FileLoader( this.manager );

	if ( mimeType !== undefined ) loader.setMimeType( mimeType );

	loader.setResponseType( responseType );

	var request = loader.load( url, function ( result ) {

		onLoad( result );

	}, onProgress, onError );

	return request;

};

THREE.MMDLoader.prototype.loadFileAsBuffer = function ( url, onLoad, onProgress, onError ) {

	this.loadFile( url, onLoad, onProgress, onError, 'arraybuffer' );

};

THREE.MMDLoader.prototype.loadFileAsText = function ( url, onLoad, onProgress, onError ) {

	this.loadFile( url, onLoad, onProgress, onError, 'text' );

};

THREE.MMDLoader.prototype.loadFileAsShiftJISText = function ( url, onLoad, onProgress, onError ) {

	this.loadFile( url, onLoad, onProgress, onError, 'text', 'text/plain; charset=shift_jis' );

};

THREE.MMDLoader.prototype.createMesh = function ( model, texturePath, onProgress, onError ) {

	var scope = this;
	var geometry = new THREE.BufferGeometry();
	var materials = [];
	var helper = new THREE.MMDLoader.DataCreationHelper();

	var buffer = {};

	buffer.vertices = [];
	buffer.uvs = [];
	buffer.normals = [];
	buffer.skinIndices = [];
	buffer.skinWeights = [];
	buffer.indices = [];

	var initVartices = function () {

		for ( var i = 0; i < model.metadata.vertexCount; i++ ) {

			var v = model.vertices[ i ];

			for ( var j = 0, jl = v.position.length; j < jl; j ++ ) {

				buffer.vertices.push( v.position[ j ] );

			}

			for ( var j = 0, jl = v.normal.length; j < jl; j ++ ) {

				buffer.normals.push( v.normal[ j ] );

			}

			for ( var j = 0, jl = v.uv.length; j < jl; j ++ ) {

				buffer.uvs.push( v.uv[ j ] );

			}

			for ( var j = 0; j < 4; j ++ ) {

				buffer.skinIndices.push( v.skinIndices.length - 1 >= j ? v.skinIndices[ j ] : 0.0 );

			}

			for ( var j = 0; j < 4; j ++ ) {

				buffer.skinWeights.push( v.skinWeights.length - 1 >= j ? v.skinWeights[ j ] : 0.0 );

			}

		}

	};

	var initFaces = function () {

		for ( var i = 0; i < model.metadata.faceCount; i++ ) {

			var f = model.faces[ i ];

			for ( var j = 0, jl = f.indices.length; j < jl; j ++ ) {

				buffer.indices.push( f.indices[ j ] );

			}

		}

	};

	var initBones = function () {

		var bones = [];

		var rigidBodies = model.rigidBodies;
		var dictionary = {};

		for ( var i = 0, il = rigidBodies.length; i < il; i ++ ) {

			var body = rigidBodies[ i ];
			var value = dictionary[ body.boneIndex ];

			// keeps greater number if already value is set without any special reasons
			value = value === undefined ? body.type : Math.max( body.type, value );

			dictionary[ body.boneIndex ] = value;

		}

		for ( var i = 0; i < model.metadata.boneCount; i++ ) {

			var bone = {};
			var b = model.bones[ i ];

			bone.parent = b.parentIndex;
			bone.name = b.name;
			bone.pos = [ b.position[ 0 ], b.position[ 1 ], b.position[ 2 ] ];
			bone.rotq = [ 0, 0, 0, 1 ];
			bone.scl = [ 1, 1, 1 ];

			if ( bone.parent !== -1 ) {

				bone.pos[ 0 ] -= model.bones[ bone.parent ].position[ 0 ];
				bone.pos[ 1 ] -= model.bones[ bone.parent ].position[ 1 ];
				bone.pos[ 2 ] -= model.bones[ bone.parent ].position[ 2 ];

			}

			bone.rigidBodyType = dictionary[ i ] !== undefined ? dictionary[ i ] : -1;

			bones.push( bone );

		}

		geometry.bones = bones;

	};

	var initIKs = function () {

		var iks = [];

		// TODO: remove duplicated codes between PMD and PMX
		if ( model.metadata.format === 'pmd' ) {

			for ( var i = 0; i < model.metadata.ikCount; i++ ) {

				var ik = model.iks[i];
				var param = {};

				param.target = ik.target;
				param.effector = ik.effector;
				param.iteration = ik.iteration;
				param.maxAngle = ik.maxAngle * 4;
				param.links = [];

				for ( var j = 0; j < ik.links.length; j++ ) {

					var link = {};
					link.index = ik.links[ j ].index;

					if ( model.bones[ link.index ].name.indexOf( 'ひざ' ) >= 0 ) {

						link.limitation = new THREE.Vector3( 1.0, 0.0, 0.0 );

					}

					param.links.push( link );

				}

				iks.push( param );

			}

		} else {

			for ( var i = 0; i < model.metadata.boneCount; i++ ) {

				var b = model.bones[ i ];
				var ik = b.ik;

				if ( ik === undefined ) {

					continue;

				}

				var param = {};

				param.target = i;
				param.effector = ik.effector;
				param.iteration = ik.iteration;
				param.maxAngle = ik.maxAngle;
				param.links = [];

				for ( var j = 0; j < ik.links.length; j++ ) {

					var link = {};
					link.index = ik.links[ j ].index;
					link.enabled = true;

					if ( ik.links[ j ].angleLimitation === 1 ) {

						link.limitation = new THREE.Vector3( 1.0, 0.0, 0.0 );
						// TODO: use limitation angles
						// link.lowerLimitationAngle;
						// link.upperLimitationAngle;

					}

					param.links.push( link );

				}

				iks.push( param );

			}

		}

		geometry.iks = iks;

	};

	var initGrants = function () {

		if ( model.metadata.format === 'pmd' ) {

			return;

		}

		var grants = [];

		for ( var i = 0; i < model.metadata.boneCount; i++ ) {

			var b = model.bones[ i ];
			var grant = b.grant;

			if ( grant === undefined ) {

				continue;

			}

			var param = {};

			param.index = i;
			param.parentIndex = grant.parentIndex;
			param.ratio = grant.ratio;
			param.isLocal = grant.isLocal;
			param.affectRotation = grant.affectRotation;
			param.affectPosition = grant.affectPosition;
			param.transformationClass = b.transformationClass;

			grants.push( param );

		}

		grants.sort( function ( a, b ) {

			return a.transformationClass - b.transformationClass;

		} );

		geometry.grants = grants;

	};

	var initMorphs = function () {

		function updateVertex( attribute, index, v, ratio ) {

			attribute.array[ index * 3 + 0 ] += v.position[ 0 ] * ratio;
			attribute.array[ index * 3 + 1 ] += v.position[ 1 ] * ratio;
			attribute.array[ index * 3 + 2 ] += v.position[ 2 ] * ratio;

		}

		function updateVertices( attribute, m, ratio ) {

			for ( var i = 0; i < m.elementCount; i++ ) {

				var v = m.elements[ i ];

				var index;

				if ( model.metadata.format === 'pmd' ) {

					index = model.morphs[ 0 ].elements[ v.index ].index;

				} else {

					index = v.index;

				}

				updateVertex( attribute, index, v, ratio );

			}

		}

		var morphTargets = [];
		var attributes = [];

		for ( var i = 0; i < model.metadata.morphCount; i++ ) {

			var m = model.morphs[ i ];
			var params = { name: m.name };

			var attribute = new THREE.Float32BufferAttribute( model.metadata.vertexCount * 3, 3 );
			attribute.name = m.name;

			for ( var j = 0; j < model.metadata.vertexCount * 3; j++ ) {

				attribute.array[ j ] = buffer.vertices[ j ];

			}

			if ( model.metadata.format === 'pmd' ) {

				if ( i !== 0 ) {

					updateVertices( attribute, m, 1.0 );

				}

			} else {

				if ( m.type === 0 ) {    // group

					for ( var j = 0; j < m.elementCount; j++ ) {

						var m2 = model.morphs[ m.elements[ j ].index ];
						var ratio = m.elements[ j ].ratio;

						if ( m2.type === 1 ) {

							updateVertices( attribute, m2, ratio );

						} else {

							// TODO: implement

						}

					}

				} else if ( m.type === 1 ) {    // vertex

					updateVertices( attribute, m, 1.0 );

				} else if ( m.type === 2 ) {    // bone

					// TODO: implement

				} else if ( m.type === 3 ) {    // uv

					// TODO: implement

				} else if ( m.type === 4 ) {    // additional uv1

					// TODO: implement

				} else if ( m.type === 5 ) {    // additional uv2

					// TODO: implement

				} else if ( m.type === 6 ) {    // additional uv3

					// TODO: implement

				} else if ( m.type === 7 ) {    // additional uv4

					// TODO: implement

				} else if ( m.type === 8 ) {    // material

					// TODO: implement

				}

			}

			morphTargets.push( params );
			attributes.push( attribute );

		}

		geometry.morphTargets = morphTargets;
		geometry.morphAttributes.position = attributes;

	};

	var initMaterials = function () {

		var textures = {};
		var textureLoader = new THREE.TextureLoader( scope.manager );
		var tgaLoader = new THREE.TGALoader( scope.manager );
		var canvas = document.createElement( 'canvas' );
		var context = canvas.getContext( '2d' );
		var offset = 0;
		var materialParams = [];

		if ( scope.textureCrossOrigin !== null ) textureLoader.setCrossOrigin( scope.textureCrossOrigin );

		function loadTexture ( filePath, params ) {

			if ( params === undefined ) {

				params = {};

			}

			var fullPath;

			if ( params.defaultTexturePath === true ) {

				try {

					fullPath = scope.defaultToonTextures[ parseInt( filePath.match( 'toon([0-9]{2})\.bmp$' )[ 1 ] ) ];

				} catch ( e ) {

					console.warn( 'THREE.MMDLoader: ' + filePath + ' seems like not right default texture path. Using toon00.bmp instead.' );
					fullPath = scope.defaultToonTextures[ 0 ];

				}

			} else {

				fullPath = texturePath + filePath;

			}

			if ( textures[ fullPath ] !== undefined ) return fullPath;

			var loader = THREE.Loader.Handlers.get( fullPath );

			if ( loader === null ) {

				loader = ( filePath.indexOf( '.tga' ) >= 0 ) ? tgaLoader : textureLoader;

			}

			var texture = loader.load( fullPath, function ( t ) {

				// MMD toon texture is Axis-Y oriented
				// but Three.js gradient map is Axis-X oriented.
				// So here replaces the toon texture image with the rotated one.
				if ( params.isToonTexture === true ) {

					var image = t.image;
					var width = image.width;
					var height = image.height;

					canvas.width = width;
					canvas.height = height;

					context.clearRect( 0, 0, width, height );
					context.translate( width / 2.0, height / 2.0 );
					context.rotate( 0.5 * Math.PI );  // 90.0 * Math.PI / 180.0
					context.translate( -width / 2.0, -height / 2.0 );
					context.drawImage( image, 0, 0 );

					t.image = context.getImageData( 0, 0, width, height );

				}

				t.flipY = false;
				t.wrapS = THREE.RepeatWrapping;
				t.wrapT = THREE.RepeatWrapping;

				for ( var i = 0; i < texture.readyCallbacks.length; i++ ) {

					texture.readyCallbacks[ i ]( texture );

				}

				delete texture.readyCallbacks;

			}, onProgress, onError );

			if ( params.sphericalReflectionMapping === true ) {

				texture.mapping = THREE.SphericalReflectionMapping;

			}

			texture.readyCallbacks = [];

			textures[ fullPath ] = texture;

			return fullPath;

		}

		function getTexture( name, textures ) {

			if ( textures[ name ] === undefined ) {

				console.warn( 'THREE.MMDLoader: Undefined texture', name );

			}

			return textures[ name ];

		}

		for ( var i = 0; i < model.metadata.materialCount; i++ ) {

			var m = model.materials[ i ];
			var params = {};

			params.faceOffset = offset;
			params.faceNum = m.faceCount;

			offset += m.faceCount;

			params.name = m.name;

			/*
			 * Color
			 *
			 * MMD         MeshToonMaterial
			 * diffuse  -  color
			 * specular -  specular
			 * ambient  -  emissive * a
			 *               (a = 1.0 without map texture or 0.2 with map texture)
			 *
			 * MeshToonMaterial doesn't have ambient. Set it to emissive instead.
			 * It'll be too bright if material has map texture so using coef 0.2.
			 */
			params.color = new THREE.Color( m.diffuse[ 0 ], m.diffuse[ 1 ], m.diffuse[ 2 ] );
			params.opacity = m.diffuse[ 3 ];
			params.specular = new THREE.Color( m.specular[ 0 ], m.specular[ 1 ], m.specular[ 2 ] );
			params.shininess = m.shininess;

			if ( params.opacity === 1.0 ) {

				params.side = THREE.FrontSide;
				params.transparent = false;

			} else {

				params.side = THREE.DoubleSide;
				params.transparent = true;

			}

			if ( model.metadata.format === 'pmd' ) {

				if ( m.fileName ) {

					var fileName = m.fileName;
					var fileNames = [];

					var index = fileName.lastIndexOf( '*' );

					if ( index >= 0 ) {

						fileNames.push( fileName.slice( 0, index ) );
						fileNames.push( fileName.slice( index + 1 ) );

					} else {

						fileNames.push( fileName );

					}

					for ( var j = 0; j < fileNames.length; j++ ) {

						var n = fileNames[ j ];

						if ( n.indexOf( '.sph' ) >= 0 || n.indexOf( '.spa' ) >= 0 ) {

							params.envMap = loadTexture( n, { sphericalReflectionMapping: true } );

							if ( n.indexOf( '.sph' ) >= 0 ) {

								params.envMapType = THREE.MultiplyOperation;

							} else {

								params.envMapType = THREE.AddOperation;

							}

						} else {

							params.map = loadTexture( n );

						}

					}

				}

			} else {

				if ( m.textureIndex !== -1 ) {

					var n = model.textures[ m.textureIndex ];
					params.map = loadTexture( n );

				}

				// TODO: support m.envFlag === 3
				if ( m.envTextureIndex !== -1 && ( m.envFlag === 1 || m.envFlag == 2 ) ) {

					var n = model.textures[ m.envTextureIndex ];
					params.envMap = loadTexture( n, { sphericalReflectionMapping: true } );

					if ( m.envFlag === 1 ) {

						params.envMapType = THREE.MultiplyOperation;

					} else {

						params.envMapType = THREE.AddOperation;

					}

				}

			}

			var coef = ( params.map === undefined ) ? 1.0 : 0.2;
			params.emissive = new THREE.Color( m.ambient[ 0 ] * coef, m.ambient[ 1 ] * coef, m.ambient[ 2 ] * coef );

			materialParams.push( params );

		}

		for ( var i = 0; i < materialParams.length; i++ ) {

			var p = materialParams[ i ];
			var p2 = model.materials[ i ];
			var m = new THREE.MeshToonMaterial();

			geometry.addGroup( p.faceOffset * 3, p.faceNum * 3, i );

			if ( p.name !== undefined ) m.name = p.name;

			m.skinning = geometry.bones.length > 0 ? true : false;
			m.morphTargets = geometry.morphTargets.length > 0 ? true : false;
			m.lights = true;
			m.side = ( model.metadata.format === 'pmx' && ( p2.flag & 0x1 ) === 1 ) ? THREE.DoubleSide : p.side;
			m.transparent = p.transparent;
			m.fog = true;

			m.blending = THREE.CustomBlending;
			m.blendSrc = THREE.SrcAlphaFactor;
			m.blendDst = THREE.OneMinusSrcAlphaFactor;
			m.blendSrcAlpha = THREE.SrcAlphaFactor;
			m.blendDstAlpha = THREE.DstAlphaFactor;

			if ( p.map !== undefined ) {

				m.faceOffset = p.faceOffset;
				m.faceNum = p.faceNum;

				// Check if this part of the texture image the material uses requires transparency
				function checkTextureTransparency ( m ) {

					m.map.readyCallbacks.push( function ( t ) {

						// Is there any efficient ways?
						function createImageData ( image ) {

							var c = document.createElement( 'canvas' );
							c.width = image.width;
							c.height = image.height;

							var ctx = c.getContext( '2d' );
							ctx.drawImage( image, 0, 0 );

							return ctx.getImageData( 0, 0, c.width, c.height );

						}

						function detectTextureTransparency( image, uvs, indices ) {

							var width = image.width;
							var height = image.height;
							var data = image.data;
							var threshold = 253;

							if ( data.length / ( width * height ) !== 4 ) {

								return false;

							}

							for ( var i = 0; i < indices.length; i += 3 ) {

								var centerUV = { x: 0.0, y: 0.0 };

								for ( var j = 0; j < 3; j++ ) {

									var index = indices[ i * 3 + j ];
									var uv = { x: uvs[ index * 2 + 0 ], y: uvs[ index * 2 + 1 ] };

									if ( getAlphaByUv( image, uv ) < threshold ) {

										return true;

									}

									centerUV.x += uv.x;
									centerUV.y += uv.y;

								}

								centerUV.x /= 3;
								centerUV.y /= 3;

								if ( getAlphaByUv( image, centerUV ) < threshold ) {

									return true;

								}

							}

							return false;

						}

						/*
						 * This method expects
						 *   t.flipY = false
						 *   t.wrapS = THREE.RepeatWrapping
						 *   t.wrapT = THREE.RepeatWrapping
						 * TODO: more precise
						 */
						function getAlphaByUv ( image, uv ) {

							var width = image.width;
							var height = image.height;

							var x = Math.round( uv.x * width ) % width;
							var y = Math.round( uv.y * height ) % height;

							if ( x < 0 ) {

								x += width;

							}

							if ( y < 0 ) {

								y += height;

							}

							var index = y * width + x;

							return image.data[ index * 4 + 3 ];

						}

						var imageData = t.image.data !== undefined ? t.image : createImageData( t.image );
						var indices = geometry.index.array.slice( m.faceOffset * 3, m.faceOffset * 3 + m.faceNum * 3 );

						if ( detectTextureTransparency( imageData, geometry.attributes.uv.array, indices ) ) m.transparent = true;

						delete m.faceOffset;
						delete m.faceNum;

					} );

				}

				m.map = getTexture( p.map, textures );
				checkTextureTransparency( m );

			}

			if ( p.envMap !== undefined ) {

				m.envMap = getTexture( p.envMap, textures );
				m.combine = p.envMapType;

			}

			m.opacity = p.opacity;
			m.color = p.color;

			if ( p.emissive !== undefined ) {

				m.emissive = p.emissive;

			}

			m.specular = p.specular;
			m.shininess = Math.max( p.shininess, 1e-4 ); // to prevent pow( 0.0, 0.0 )

			if ( model.metadata.format === 'pmd' ) {

				function isDefaultToonTexture ( n ) {

					if ( n.length !== 10 ) {

						return false;

					}

					return n.match( /toon(10|0[0-9]).bmp/ ) === null ? false : true;

				}

				// parameters for OutlineEffect
				m.outlineParameters = {
					thickness: p2.edgeFlag === 1 ? 0.003 : 0.0,
					color: new THREE.Color( 0.0, 0.0, 0.0 ),
					alpha: 1.0
				};

				if ( m.outlineParameters.thickness === 0.0 ) m.outlineParameters.visible = false;

				var toonFileName = ( p2.toonIndex === -1 ) ? 'toon00.bmp' : model.toonTextures[ p2.toonIndex ].fileName;
				var uuid = loadTexture( toonFileName, { isToonTexture: true, defaultTexturePath: isDefaultToonTexture( toonFileName ) } );
				m.gradientMap = getTexture( uuid, textures );

			} else {

				// parameters for OutlineEffect
				m.outlineParameters = {
					thickness: p2.edgeSize / 300,
					color: new THREE.Color( p2.edgeColor[ 0 ], p2.edgeColor[ 1 ], p2.edgeColor[ 2 ] ),
					alpha: p2.edgeColor[ 3 ]
				};

				if ( ( p2.flag & 0x10 ) === 0 || m.outlineParameters.thickness === 0.0 ) m.outlineParameters.visible = false;

				var toonFileName, isDefaultToon;

				if ( p2.toonIndex === -1 || p2.toonFlag !== 0 ) {

					var num = p2.toonIndex + 1;
					toonFileName = 'toon' + ( num < 10 ? '0' + num : num ) + '.bmp';
					isDefaultToon = true;

				} else {

					toonFileName = model.textures[ p2.toonIndex ];
					isDefaultToon = false;

				}

				var uuid = loadTexture( toonFileName, { isToonTexture: true, defaultTexturePath: isDefaultToon } );
				m.gradientMap = getTexture( uuid, textures );

			}

			materials.push( m );

		}

		if ( model.metadata.format === 'pmx' ) {

			function checkAlphaMorph ( morph, elements ) {

				if ( morph.type !== 8 ) {

					return;

				}

				for ( var i = 0; i < elements.length; i++ ) {

					var e = elements[ i ];

					if ( e.index === -1 ) {

						continue;

					}

					var m = materials[ e.index ];

					if ( m.opacity !== e.diffuse[ 3 ] ) {

						m.transparent = true;

					}

				}

			}

			for ( var i = 0; i < model.morphs.length; i++ ) {

				var morph = model.morphs[ i ];
				var elements = morph.elements;

				if ( morph.type === 0 ) {

					for ( var j = 0; j < elements.length; j++ ) {

						var morph2 = model.morphs[ elements[ j ].index ];
						var elements2 = morph2.elements;

						checkAlphaMorph( morph2, elements2 );

					}

				} else {

					checkAlphaMorph( morph, elements );

				}

			}

		}

	};

	var initPhysics = function () {

		var rigidBodies = [];
		var constraints = [];

		for ( var i = 0; i < model.metadata.rigidBodyCount; i++ ) {

			var b = model.rigidBodies[ i ];
			var keys = Object.keys( b );

			var p = {};

			for ( var j = 0; j < keys.length; j++ ) {

				var key = keys[ j ];
				p[ key ] = b[ key ];

			}

			/*
			 * RigidBody position parameter in PMX seems global position
			 * while the one in PMD seems offset from corresponding bone.
			 * So unify being offset.
			 */
			if ( model.metadata.format === 'pmx' ) {

				if ( p.boneIndex !== -1 ) {

					var bone = model.bones[ p.boneIndex ];
					p.position[ 0 ] -= bone.position[ 0 ];
					p.position[ 1 ] -= bone.position[ 1 ];
					p.position[ 2 ] -= bone.position[ 2 ];

				}

			}

			rigidBodies.push( p );

		}

		for ( var i = 0; i < model.metadata.constraintCount; i++ ) {

			var c = model.constraints[ i ];
			var keys = Object.keys( c );

			var p = {};

			for ( var j = 0; j < keys.length; j++ ) {

				var key = keys[ j ];
				p[ key ] = c[ key ];

			}

			var bodyA = rigidBodies[ p.rigidBodyIndex1 ];
			var bodyB = rigidBodies[ p.rigidBodyIndex2 ];

			/*
			 * Refer to http://www20.atpages.jp/katwat/wp/?p=4135
			 */
			if ( bodyA.type !== 0 && bodyB.type === 2 ) {

				if ( bodyA.boneIndex !== -1 && bodyB.boneIndex !== -1 &&
				     model.bones[ bodyB.boneIndex ].parentIndex === bodyA.boneIndex ) {

					bodyB.type = 1;

				}

			}

			constraints.push( p );

		}

		geometry.rigidBodies = rigidBodies;
		geometry.constraints = constraints;

	};

	var initGeometry = function () {

		geometry.setIndex( buffer.indices );
		geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( buffer.vertices, 3 ) );
		geometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( buffer.normals, 3 ) );
		geometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( buffer.uvs, 2 ) );
		geometry.addAttribute( 'skinIndex', new THREE.Float32BufferAttribute( buffer.skinIndices, 4 ) );
		geometry.addAttribute( 'skinWeight', new THREE.Float32BufferAttribute( buffer.skinWeights, 4 ) );

		geometry.computeBoundingSphere();
		geometry.mmdFormat = model.metadata.format;

	};

	initVartices();
	initFaces();
	initBones();
	initIKs();
	initGrants();
	initMorphs();
	initMaterials();
	initPhysics();
	initGeometry();

	var mesh = new THREE.SkinnedMesh( geometry, materials );

	// console.log( mesh ); // for console debug

	return mesh;

};

THREE.MMDLoader.prototype.createAnimation = function ( mesh, vmd, name ) {

	var helper = new THREE.MMDLoader.DataCreationHelper();

	var initMotionAnimations = function () {

		if ( vmd.metadata.motionCount === 0 ) {

			return;

		}

		var bones = mesh.geometry.bones;
		var orderedMotions = helper.createOrderedMotionArrays( bones, vmd.motions, 'boneName' );

		var tracks = [];

		var pushInterpolation = function ( array, interpolation, index ) {

			array.push( interpolation[ index + 0 ] / 127 );  // x1
			array.push( interpolation[ index + 8 ] / 127 );  // x2
			array.push( interpolation[ index + 4 ] / 127 );  // y1
			array.push( interpolation[ index + 12 ] / 127 ); // y2

		};

		for ( var i = 0; i < orderedMotions.length; i++ ) {

			var times = [];
			var positions = [];
			var rotations = [];
			var pInterpolations = [];
			var rInterpolations = [];

			var bone = bones[ i ];
			var array = orderedMotions[ i ];

			for ( var j = 0; j < array.length; j++ ) {

				var time = array[ j ].frameNum / 30;
				var pos = array[ j ].position;
				var rot = array[ j ].rotation;
				var interpolation = array[ j ].interpolation;

				times.push( time );

				for ( var k = 0; k < 3; k ++ ) {

					positions.push( bone.pos[ k ] + pos[ k ] );

				}

				for ( var k = 0; k < 4; k ++ ) {

					rotations.push( rot[ k ] );

				}

				for ( var k = 0; k < 3; k ++ ) {

					pushInterpolation( pInterpolations, interpolation, k );

				}

				pushInterpolation( rInterpolations, interpolation, 3 );

			}

			if ( times.length === 0 ) continue;

			var boneName = '.bones[' + bone.name + ']';

			tracks.push( new THREE.MMDLoader.VectorKeyframeTrackEx( boneName + '.position', times, positions, pInterpolations ) );
			tracks.push( new THREE.MMDLoader.QuaternionKeyframeTrackEx( boneName + '.quaternion', times, rotations, rInterpolations ) );

		}

		var clip = new THREE.AnimationClip( name === undefined ? THREE.Math.generateUUID() : name, -1, tracks );

		if ( mesh.geometry.animations === undefined ) mesh.geometry.animations = [];
		mesh.geometry.animations.push( clip );

	};

	var initMorphAnimations = function () {

		if ( vmd.metadata.morphCount === 0 ) {

			return;

		}

		var orderedMorphs = helper.createOrderedMotionArrays( mesh.geometry.morphTargets, vmd.morphs, 'morphName' );

		var tracks = [];

		for ( var i = 0; i < orderedMorphs.length; i++ ) {

			var times = [];
			var values = [];
			var array = orderedMorphs[ i ];

			for ( var j = 0; j < array.length; j++ ) {

				times.push( array[ j ].frameNum / 30 );
				values.push( array[ j ].weight );

			}

			if ( times.length === 0 ) continue;

			tracks.push( new THREE.NumberKeyframeTrack( '.morphTargetInfluences[' + i + ']', times, values ) );

		}

		var clip = new THREE.AnimationClip( name === undefined ? THREE.Math.generateUUID() : name + 'Morph', -1, tracks );

		if ( mesh.geometry.animations === undefined ) mesh.geometry.animations = [];
		mesh.geometry.animations.push( clip );

	};

	initMotionAnimations();
	initMorphAnimations();

};

THREE.MMDLoader.DataCreationHelper = function () {

};

THREE.MMDLoader.DataCreationHelper.prototype = {

	constructor: THREE.MMDLoader.DataCreationHelper,

	/*
	 * Note: Sometimes to use Japanese Unicode characters runs into problems in Three.js.
	 *       In such a case, use this method to convert it to Unicode hex charcode strings,
	 *       like 'あいう' -> '0x30420x30440x3046'
	 */

	toCharcodeStrings: function ( s ) {

		var str = '';

		for ( var i = 0; i < s.length; i++ ) {

			str += '0x' + ( '0000' + s[ i ].charCodeAt().toString( 16 ) ).substr( -4 );

		}

		return str;

	},

	createDictionary: function ( array ) {

		var dict = {};

		for ( var i = 0; i < array.length; i++ ) {

			dict[ array[ i ].name ] = i;

		}

		return dict;

	},

	initializeMotionArrays: function ( array ) {

		var result = [];

		for ( var i = 0; i < array.length; i++ ) {

			result[ i ] = [];

		}

		return result;

	},

	sortMotionArray: function ( array ) {

		array.sort( function ( a, b ) {

			return a.frameNum - b.frameNum;

		} ) ;

	},

	sortMotionArrays: function ( arrays ) {

		for ( var i = 0; i < arrays.length; i++ ) {

			this.sortMotionArray( arrays[ i ] );

		}

	},

	createMotionArray: function ( array ) {

		var result = [];

		for ( var i = 0; i < array.length; i++ ) {

			result.push( array[ i ] );

		}

		return result;

	},

	createMotionArrays: function ( array, result, dict, key ) {

		for ( var i = 0; i < array.length; i++ ) {

			var a = array[ i ];
			var num = dict[ a[ key ] ];

			if ( num === undefined ) {

				continue;

			}

			result[ num ].push( a );

		}

	},

	createOrderedMotionArray: function ( array ) {

		var result = this.createMotionArray( array );
		this.sortMotionArray( result );
		return result;

	},

	createOrderedMotionArrays: function ( targetArray, motionArray, key ) {

		var dict = this.createDictionary( targetArray );
		var result = this.initializeMotionArrays( targetArray );
		this.createMotionArrays( motionArray, result, dict, key );
		this.sortMotionArrays( result );

		return result;

	}

};

/*
 * extends existing KeyframeTrack for bone and camera animation.
 *   - use Float64Array for times
 *   - use Cubic Bezier curves interpolation
 */
THREE.MMDLoader.VectorKeyframeTrackEx = function ( name, times, values, interpolationParameterArray ) {

	this.interpolationParameters = new Float32Array( interpolationParameterArray );

	THREE.VectorKeyframeTrack.call( this, name, times, values );

};

THREE.MMDLoader.VectorKeyframeTrackEx.prototype = Object.create( THREE.VectorKeyframeTrack.prototype );
THREE.MMDLoader.VectorKeyframeTrackEx.prototype.constructor = THREE.MMDLoader.VectorKeyframeTrackEx;
THREE.MMDLoader.VectorKeyframeTrackEx.prototype.TimeBufferType = Float64Array;

THREE.MMDLoader.VectorKeyframeTrackEx.prototype.InterpolantFactoryMethodCubicBezier = function( result ) {

	return new THREE.MMDLoader.CubicBezierInterpolation( this.times, this.values, this.getValueSize(), result, this.interpolationParameters );

};

THREE.MMDLoader.VectorKeyframeTrackEx.prototype.setInterpolation = function( interpolation ) {

	this.createInterpolant = this.InterpolantFactoryMethodCubicBezier;

};

THREE.MMDLoader.QuaternionKeyframeTrackEx = function ( name, times, values, interpolationParameterArray ) {

	this.interpolationParameters = new Float32Array( interpolationParameterArray );

	THREE.QuaternionKeyframeTrack.call( this, name, times, values );

};

THREE.MMDLoader.QuaternionKeyframeTrackEx.prototype = Object.create( THREE.QuaternionKeyframeTrack.prototype );
THREE.MMDLoader.QuaternionKeyframeTrackEx.prototype.constructor = THREE.MMDLoader.QuaternionKeyframeTrackEx;
THREE.MMDLoader.QuaternionKeyframeTrackEx.prototype.TimeBufferType = Float64Array;

THREE.MMDLoader.QuaternionKeyframeTrackEx.prototype.InterpolantFactoryMethodCubicBezier = function( result ) {

	return new THREE.MMDLoader.CubicBezierInterpolation( this.times, this.values, this.getValueSize(), result, this.interpolationParameters );

};

THREE.MMDLoader.QuaternionKeyframeTrackEx.prototype.setInterpolation = function( interpolation ) {

	this.createInterpolant = this.InterpolantFactoryMethodCubicBezier;

};

THREE.MMDLoader.NumberKeyframeTrackEx = function ( name, times, values, interpolationParameterArray ) {

	this.interpolationParameters = new Float32Array( interpolationParameterArray );

	THREE.NumberKeyframeTrack.call( this, name, times, values );

};

THREE.MMDLoader.NumberKeyframeTrackEx.prototype = Object.create( THREE.NumberKeyframeTrack.prototype );
THREE.MMDLoader.NumberKeyframeTrackEx.prototype.constructor = THREE.MMDLoader.NumberKeyframeTrackEx;
THREE.MMDLoader.NumberKeyframeTrackEx.prototype.TimeBufferType = Float64Array;

THREE.MMDLoader.NumberKeyframeTrackEx.prototype.InterpolantFactoryMethodCubicBezier = function( result ) {

	return new THREE.MMDLoader.CubicBezierInterpolation( this.times, this.values, this.getValueSize(), result, this.interpolationParameters );

};

THREE.MMDLoader.NumberKeyframeTrackEx.prototype.setInterpolation = function( interpolation ) {

	this.createInterpolant = this.InterpolantFactoryMethodCubicBezier;

};

THREE.MMDLoader.CubicBezierInterpolation = function ( parameterPositions, sampleValues, sampleSize, resultBuffer, params ) {

	THREE.Interpolant.call( this, parameterPositions, sampleValues, sampleSize, resultBuffer );

	this.params = params;

}

THREE.MMDLoader.CubicBezierInterpolation.prototype = Object.create( THREE.LinearInterpolant.prototype );
THREE.MMDLoader.CubicBezierInterpolation.prototype.constructor = THREE.MMDLoader.CubicBezierInterpolation;

THREE.MMDLoader.CubicBezierInterpolation.prototype.interpolate_ = function( i1, t0, t, t1 ) {

	var result = this.resultBuffer;
	var values = this.sampleValues;
	var stride = this.valueSize;

	var offset1 = i1 * stride;
	var offset0 = offset1 - stride;

	var weight1 = ( t - t0 ) / ( t1 - t0 );

	if ( stride === 4 ) {  // Quaternion

		var x1 = this.params[ i1 * 4 + 0 ];
		var x2 = this.params[ i1 * 4 + 1 ];
		var y1 = this.params[ i1 * 4 + 2 ];
		var y2 = this.params[ i1 * 4 + 3 ];

		var ratio = this._calculate( x1, x2, y1, y2, weight1 );

		THREE.Quaternion.slerpFlat( result, 0, values, offset0, values, offset1, ratio );

	} else if ( stride === 3 ) {  // Vector3

		for ( var i = 0; i !== stride; ++ i ) {

			var x1 = this.params[ i1 * 12 + i * 4 + 0 ];
			var x2 = this.params[ i1 * 12 + i * 4 + 1 ];
			var y1 = this.params[ i1 * 12 + i * 4 + 2 ];
			var y2 = this.params[ i1 * 12 + i * 4 + 3 ];

			var ratio = this._calculate( x1, x2, y1, y2, weight1 );

			result[ i ] = values[ offset0 + i ] * ( 1 - ratio ) + values[ offset1 + i ] * ratio;

		}

	} else {  // Number

		var x1 = this.params[ i1 * 4 + 0 ];
		var x2 = this.params[ i1 * 4 + 1 ];
		var y1 = this.params[ i1 * 4 + 2 ];
		var y2 = this.params[ i1 * 4 + 3 ];

		var ratio = this._calculate( x1, x2, y1, y2, weight1 );

		result[ 0 ] = values[ offset0 ] * ( 1 - ratio ) + values[ offset1 ] * ratio;

	}

	return result;

};

THREE.MMDLoader.CubicBezierInterpolation.prototype._calculate = function( x1, x2, y1, y2, x ) {

	/*
	 * Cubic Bezier curves
	 *   https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Cubic_B.C3.A9zier_curves
	 *
	 * B(t) = ( 1 - t ) ^ 3 * P0
	 *      + 3 * ( 1 - t ) ^ 2 * t * P1
	 *      + 3 * ( 1 - t ) * t^2 * P2
	 *      + t ^ 3 * P3
	 *      ( 0 <= t <= 1 )
	 *
	 * MMD uses Cubic Bezier curves for bone and camera animation interpolation.
	 *   http://d.hatena.ne.jp/edvakf/20111016/1318716097
	 *
	 *    x = ( 1 - t ) ^ 3 * x0
	 *      + 3 * ( 1 - t ) ^ 2 * t * x1
	 *      + 3 * ( 1 - t ) * t^2 * x2
	 *      + t ^ 3 * x3
	 *    y = ( 1 - t ) ^ 3 * y0
	 *      + 3 * ( 1 - t ) ^ 2 * t * y1
	 *      + 3 * ( 1 - t ) * t^2 * y2
	 *      + t ^ 3 * y3
	 *      ( x0 = 0, y0 = 0 )
	 *      ( x3 = 1, y3 = 1 )
	 *      ( 0 <= t, x1, x2, y1, y2 <= 1 )
	 *
	 * Here solves this equation with Bisection method,
	 *   https://en.wikipedia.org/wiki/Bisection_method
	 * gets t, and then calculate y.
	 *
	 * f(t) = 3 * ( 1 - t ) ^ 2 * t * x1
	 *      + 3 * ( 1 - t ) * t^2 * x2
	 *      + t ^ 3 - x = 0
	 *
	 * (Another option: Newton's method
	 *    https://en.wikipedia.org/wiki/Newton%27s_method)
	 */

	var c = 0.5;
	var t = c;
	var s = 1.0 - t;
	var loop = 15;
	var eps = 1e-5;
	var math = Math;

	var sst3, stt3, ttt;

	for ( var i = 0; i < loop; i ++ ) {

		sst3 = 3.0 * s * s * t;
		stt3 = 3.0 * s * t * t;
		ttt = t * t * t;

		var ft = ( sst3 * x1 ) + ( stt3 * x2 ) + ( ttt ) - x;

		if ( math.abs( ft ) < eps ) break;

		c /= 2.0;

		t += ( ft < 0 ) ? c : -c;
		s = 1.0 - t;

	}

	return ( sst3 * y1 ) + ( stt3 * y2 ) + ttt;

};

THREE.MMDAudioManager = function ( audio, listener, p ) {

	var params = ( p === null || p === undefined ) ? {} : p;

	this.audio = audio;
	this.listener = listener;

	this.elapsedTime = 0.0;
	this.currentTime = 0.0;
	this.delayTime = params.delayTime !== undefined ? params.delayTime : 0.0;

	this.audioDuration = this.audio.buffer.duration;
	this.duration = this.audioDuration + this.delayTime;

};

THREE.MMDAudioManager.prototype = {

	constructor: THREE.MMDAudioManager,

	control: function ( delta ) {

		this.elapsed += delta;
		this.currentTime += delta;

		if ( this.checkIfStopAudio() ) {

			this.audio.stop();

		}

		if ( this.checkIfStartAudio() ) {

			this.audio.play();

		}

	},

	checkIfStartAudio: function () {

		if ( this.audio.isPlaying ) {

			return false;

		}

		while ( this.currentTime >= this.duration ) {

			this.currentTime -= this.duration;

		}

		if ( this.currentTime < this.delayTime ) {

			return false;

		}

		this.audio.startTime = this.currentTime - this.delayTime;

		return true;

	},

	checkIfStopAudio: function () {

		if ( ! this.audio.isPlaying ) {

			return false;

		}

		if ( this.currentTime >= this.duration ) {

			return true;

		}

		return false;

	}

};

THREE.MMDGrantSolver = function ( mesh ) {

	this.mesh = mesh;

};

THREE.MMDGrantSolver.prototype = {

	constructor: THREE.MMDGrantSolver,

	update: function () {

		var q = new THREE.Quaternion();

		return function () {

			for ( var i = 0; i < this.mesh.geometry.grants.length; i ++ ) {

				var g = this.mesh.geometry.grants[ i ];
				var b = this.mesh.skeleton.bones[ g.index ];
				var pb = this.mesh.skeleton.bones[ g.parentIndex ];

				if ( g.isLocal ) {

					// TODO: implement
					if ( g.affectPosition ) {

					}

					// TODO: implement
					if ( g.affectRotation ) {

					}

				} else {

					// TODO: implement
					if ( g.affectPosition ) {

					}

					if ( g.affectRotation ) {

						q.set( 0, 0, 0, 1 );
						q.slerp( pb.quaternion, g.ratio );
						b.quaternion.multiply( q );

					}

				}

			}

		};

	}()

};

THREE.MMDHelper = function () {

	this.meshes = [];

	this.doAnimation = true;
	this.doIk = true;
	this.doGrant = true;
	this.doPhysics = true;
	this.doCameraAnimation = true;

	this.sharedPhysics = false;
	this.masterPhysics = null;

	this.audioManager = null;
	this.camera = null;

};

THREE.MMDHelper.prototype = {

	constructor: THREE.MMDHelper,

	add: function ( mesh ) {

		if ( ! ( mesh instanceof THREE.SkinnedMesh ) ) {

			throw new Error( 'THREE.MMDHelper.add() accepts only THREE.SkinnedMesh instance.' );

		}

		if ( mesh.mixer === undefined ) mesh.mixer = null;
		if ( mesh.ikSolver === undefined ) mesh.ikSolver = null;
		if ( mesh.grantSolver === undefined ) mesh.grantSolver = null;
		if ( mesh.physics === undefined ) mesh.physics = null;
		if ( mesh.looped === undefined ) mesh.looped = false;

		this.meshes.push( mesh );

		// workaround until I make IK and Physics Animation plugin
		this.initBackupBones( mesh );

	},

	setAudio: function ( audio, listener, params ) {

		this.audioManager = new THREE.MMDAudioManager( audio, listener, params );

	},

	setCamera: function ( camera ) {

		camera.mixer = null;
		this.camera = camera;

	},

	setPhysicses: function ( params ) {

		for ( var i = 0; i < this.meshes.length; i++ ) {

			this.setPhysics( this.meshes[ i ], params );

		}

	},

	setPhysics: function ( mesh, params ) {

		params = ( params === undefined ) ? {} : Object.assign( {}, params );

		if ( params.world === undefined && this.sharedPhysics ) {

			var masterPhysics = this.getMasterPhysics();

			if ( masterPhysics !== null ) params.world = masterPhysics.world;

		}

		var warmup = params.warmup !== undefined ? params.warmup : 60;

		var physics = new THREE.MMDPhysics( mesh, params );

		if ( mesh.mixer !== null && mesh.mixer !== undefined && params.preventAnimationWarmup !== true ) {

			this.animateOneMesh( 0, mesh );
			physics.reset();

		}

		physics.warmup( warmup );

		this.updateIKParametersDependingOnPhysicsEnabled( mesh, true );

		mesh.physics = physics;

	},

	getMasterPhysics: function () {

		if ( this.masterPhysics !== null ) return this.masterPhysics;

		for ( var i = 0, il = this.meshes.length; i < il; i ++ ) {

			var physics = this.meshes[ i ].physics;

			if ( physics !== undefined && physics !== null ) {

				this.masterPhysics = physics;
				return this.masterPhysics;

			}
		}

		return null;

	},

	enablePhysics: function ( enabled ) {

		if ( enabled === true ) {

			this.doPhysics = true;

		} else {

			this.doPhysics = false;

		}

		for ( var i = 0, il = this.meshes.length; i < il; i ++ ) {

			this.updateIKParametersDependingOnPhysicsEnabled( this.meshes[ i ], enabled );

		}

	},

	updateIKParametersDependingOnPhysicsEnabled: function ( mesh, physicsEnabled ) {

		var iks = mesh.geometry.iks;
		var bones = mesh.geometry.bones;

		for ( var j = 0, jl = iks.length; j < jl; j ++ ) {

			var ik = iks[ j ];
			var links = ik.links;

			for ( var k = 0, kl = links.length; k < kl; k ++ ) {

				var link = links[ k ];

				if ( physicsEnabled === true ) {

					// disable IK of the bone the corresponding rigidBody type of which is 1 or 2
					// because its rotation will be overriden by physics
					link.enabled = bones[ link.index ].rigidBodyType > 0 ? false : true;

				} else {

					link.enabled = true;

				}

			}

		}

	},

	setAnimations: function () {

		for ( var i = 0; i < this.meshes.length; i++ ) {

			this.setAnimation( this.meshes[ i ] );

		}

	},

	setAnimation: function ( mesh ) {

		if ( mesh.geometry.animations !== undefined ) {

			mesh.mixer = new THREE.AnimationMixer( mesh );

			// TODO: find a workaround not to access (seems like) private properties
			//       the name of them begins with "_".
			mesh.mixer.addEventListener( 'loop', function ( e ) {

				if ( e.action._clip.tracks.length > 0 &&
				     e.action._clip.tracks[ 0 ].name.indexOf( '.bones' ) !== 0 ) return;

				var mesh = e.target._root;
				mesh.looped = true;

			} );

			var foundAnimation = false;
			var foundMorphAnimation = false;

			for ( var i = 0; i < mesh.geometry.animations.length; i++ ) {

				var clip = mesh.geometry.animations[ i ];

				var action = mesh.mixer.clipAction( clip );

				if ( clip.tracks.length > 0 && clip.tracks[ 0 ].name.indexOf( '.morphTargetInfluences' ) === 0 ) {

					if ( ! foundMorphAnimation ) {

						action.play();
						foundMorphAnimation = true;

					}

				} else {

					if ( ! foundAnimation ) {

						action.play();
						foundAnimation = true;

					}

				}

			}

			if ( foundAnimation ) {

				mesh.ikSolver = new THREE.CCDIKSolver( mesh );

				if ( mesh.geometry.grants !== undefined ) {

					mesh.grantSolver = new THREE.MMDGrantSolver( mesh );

				}

			}

		}

	},

	setCameraAnimation: function ( camera ) {

		if ( camera.animations !== undefined ) {

			camera.mixer = new THREE.AnimationMixer( camera );
			camera.mixer.clipAction( camera.animations[ 0 ] ).play();

		}

	},

	/*
	 * detect the longest duration among model, camera, and audio animations and then
	 * set it to them to sync.
	 * TODO: touching private properties ( ._actions and ._clip ) so consider better way
	 *       to access them for safe and modularity.
	 */
	unifyAnimationDuration: function ( params ) {

		params = params === undefined ? {} : params;

		var max = 0.0;

		var camera = this.camera;
		var audioManager = this.audioManager;

		// check the longest duration
		for ( var i = 0; i < this.meshes.length; i++ ) {

			var mesh = this.meshes[ i ];
			var mixer = mesh.mixer;

			if ( mixer === null ) {

				continue;

			}

			for ( var j = 0; j < mixer._actions.length; j++ ) {

				var action = mixer._actions[ j ];
				max = Math.max( max, action._clip.duration );

			}

		}

		if ( camera !== null && camera.mixer !== null ) {

			var mixer = camera.mixer;

			for ( var i = 0; i < mixer._actions.length; i++ ) {

				var action = mixer._actions[ i ];
				max = Math.max( max, action._clip.duration );

			}

		}

		if ( audioManager !== null ) {

			max = Math.max( max, audioManager.duration );

		}

		if ( params.afterglow !== undefined ) {

			max += params.afterglow;

		}

		// set the duration
		for ( var i = 0; i < this.meshes.length; i++ ) {

			var mesh = this.meshes[ i ];
			var mixer = mesh.mixer;

			if ( mixer === null ) {

				continue;

			}

			for ( var j = 0; j < mixer._actions.length; j++ ) {

				var action = mixer._actions[ j ];
				action._clip.duration = max;

			}

		}

		if ( camera !== null && camera.mixer !== null ) {

			var mixer = camera.mixer;

			for ( var i = 0; i < mixer._actions.length; i++ ) {

				var action = mixer._actions[ i ];
				action._clip.duration = max;

			}

		}

		if ( audioManager !== null ) {

			audioManager.duration = max;

		}

	},

	controlAudio: function ( delta ) {

		if ( this.audioManager === null ) {

			return;

		}

		this.audioManager.control( delta );

	},

	animate: function ( delta ) {

		this.controlAudio( delta );

		for ( var i = 0; i < this.meshes.length; i++ ) {

			this.animateOneMesh( delta, this.meshes[ i ] );

		}

		if ( this.sharedPhysics ) this.updateSharedPhysics( delta );

		this.animateCamera( delta );

	},

	animateOneMesh: function ( delta, mesh ) {

		var mixer = mesh.mixer;
		var ikSolver = mesh.ikSolver;
		var grantSolver = mesh.grantSolver;
		var physics = mesh.physics;

		if ( mixer !== null && this.doAnimation === true ) {

			// restore/backupBones are workaround
			// until I make IK, Grant, and Physics Animation plugin
			this.restoreBones( mesh );

			mixer.update( delta );

			this.backupBones( mesh );

		}

		if ( ikSolver !== null && this.doIk === true ) {

			ikSolver.update();

		}

		if ( grantSolver !== null && this.doGrant === true ) {

			grantSolver.update();

		}

		if ( mesh.looped === true ) {

			if ( physics !== null ) physics.reset();

			mesh.looped = false;

		}

		if ( physics !== null && this.doPhysics && ! this.sharedPhysics ) {

			physics.update( delta );

		}

	},

	updateSharedPhysics: function ( delta ) {

		if ( this.meshes.length === 0 || ! this.doPhysics || ! this.sharedPhysics ) return;

		var physics = this.getMasterPhysics();

		if ( physics === null ) return;

		for ( var i = 0, il = this.meshes.length; i < il; i ++ ) {

			var p = this.meshes[ i ].physics;

			if ( p !== null && p !== undefined ) {

				p.updateRigidBodies();

			}

		}

		physics.stepSimulation( delta );

		for ( var i = 0, il = this.meshes.length; i < il; i ++ ) {

			var p = this.meshes[ i ].physics;

			if ( p !== null && p !== undefined ) {

				p.updateBones();

			}

		}

	},

	animateCamera: function ( delta ) {

		if ( this.camera === null ) {

			return;

		}

		var mixer = this.camera.mixer;

		if ( mixer !== null && this.camera.center !== undefined && this.doCameraAnimation === true ) {

			mixer.update( delta );

			// TODO: Let PerspectiveCamera automatically update?
			this.camera.updateProjectionMatrix();

			this.camera.up.set( 0, 1, 0 );
			this.camera.up.applyQuaternion( this.camera.quaternion );
			this.camera.lookAt( this.camera.center );

		}

	},

	poseAsVpd: function ( mesh, vpd, params ) {

		if ( params === undefined ) params = {};

		if ( params.preventResetPose !== true ) mesh.pose();

		var bones = mesh.skeleton.bones;
		var bones2 = vpd.bones;

		var table = {};

		for ( var i = 0; i < bones.length; i++ ) {

			table[ bones[ i ].name ] = i;

		}

		var thV = new THREE.Vector3();
		var thQ = new THREE.Quaternion();

		for ( var i = 0; i < bones2.length; i++ ) {

			var b = bones2[ i ];
			var index = table[ b.name ];

			if ( index === undefined ) continue;

			var b2 = bones[ index ];
			var t = b.translation;
			var q = b.quaternion;

			thV.set( t[ 0 ], t[ 1 ], t[ 2 ] );
			thQ.set( q[ 0 ], q[ 1 ], q[ 2 ], q[ 3 ] );

			b2.position.add( thV );
			b2.quaternion.multiply( thQ );

		}

		mesh.updateMatrixWorld( true );

		if ( params.preventIk !== true ) {

			var solver = new THREE.CCDIKSolver( mesh );
			solver.update( params.saveOriginalBonesBeforeIK );

		}

		if ( params.preventGrant !== true && mesh.geometry.grants !== undefined ) {

			var solver = new THREE.MMDGrantSolver( mesh );
			solver.update();

		}

	},

	/*
	 * Note: These following three functions are workaround for r74dev.
	 *       THREE.PropertyMixer.apply() seems to save values into buffer cache
	 *       when mixer.update() is called.
	 *       ikSolver.update() and physics.update() change bone position/quaternion
	 *       without mixer.update() then buffer cache will be inconsistent.
	 *       So trying to avoid buffer cache inconsistency by doing
	 *       backup bones position/quaternion right after mixer.update() call
	 *       and then restore them after rendering.
	 */
	initBackupBones: function ( mesh ) {

		mesh.skeleton.backupBones = [];

		for ( var i = 0; i < mesh.skeleton.bones.length; i++ ) {

			mesh.skeleton.backupBones.push( mesh.skeleton.bones[ i ].clone() );

		}

	},

	backupBones: function ( mesh ) {

		mesh.skeleton.backupBoneIsSaved = true;

		for ( var i = 0; i < mesh.skeleton.bones.length; i++ ) {

			var b = mesh.skeleton.backupBones[ i ];
			var b2 = mesh.skeleton.bones[ i ];
			b.position.copy( b2.position );
			b.quaternion.copy( b2.quaternion );

		}

	},

	restoreBones: function ( mesh ) {

		if ( mesh.skeleton.backupBoneIsSaved !== true ) {

			return;

		}

		mesh.skeleton.backupBoneIsSaved = false;

		for ( var i = 0; i < mesh.skeleton.bones.length; i++ ) {

			var b = mesh.skeleton.bones[ i ];
			var b2 = mesh.skeleton.backupBones[ i ];
			b.position.copy( b2.position );
			b.quaternion.copy( b2.quaternion );

		}

	}

};


/***/ }),
/* 3 */
/***/ (function(module, exports) {

/**
 * @author takahiro / https://github.com/takahirox
 *
 * CCD Algorithm
 *  https://sites.google.com/site/auraliusproject/ccd-algorithm
 *
 * mesh.geometry needs to have iks array.
 *
 * // ik parameter example
 * //
 * // target, effector, index in links are bone index in skeleton.
 * // the bones relation should be
 * // <-- parent                                  child -->
 * // links[ n ], links[ n - 1 ], ..., links[ 0 ], effector
 * ik = {
 *	target: 1,
 *	effector: 2,
 *	links: [ { index: 5, limitation: new THREE.Vector3( 1, 0, 0 ) }, { index: 4, enabled: false }, { index : 3 } ],
 *	iteration: 10,
 *	minAngle: 0.0,
 *	maxAngle: 1.0,
 * };
 */

THREE.CCDIKSolver = function ( mesh ) {

	this.mesh = mesh;

	this._valid();

};

THREE.CCDIKSolver.prototype = {

	constructor: THREE.CCDIKSolver,

	_valid: function () {

		var iks = this.mesh.geometry.iks;
		var bones = this.mesh.skeleton.bones;

		for ( var i = 0, il = iks.length; i < il; i ++ ) {

			var ik = iks[ i ];

			var effector = bones[ ik.effector ];

			var links = ik.links;

			var link0, link1;

			link0 = effector;

			for ( var j = 0, jl = links.length; j < jl; j ++ ) {

				link1 = bones[ links[ j ].index ];

				if ( link0.parent !== link1 ) {

					console.warn( 'THREE.CCDIKSolver: bone ' + link0.name + ' is not the child of bone ' + link1.name );

				}

				link0 = link1;

			}

		}

	},

	/*
	 * save the bone matrices before solving IK.
	 * they're used for generating VMD and VPD.
	 */
	_saveOriginalBonesInfo: function () {

		var bones = this.mesh.skeleton.bones;

		for ( var i = 0, il = bones.length; i < il; i ++ ) {

			var bone = bones[ i ];

			if ( bone.userData.ik === undefined ) bone.userData.ik = {};

			bone.userData.ik.originalMatrix = bone.matrix.toArray();

		}

	},

	update: function ( saveOriginalBones ) {

		var q = new THREE.Quaternion();

		var targetPos = new THREE.Vector3();
		var targetVec = new THREE.Vector3();
		var effectorPos = new THREE.Vector3();
		var effectorVec = new THREE.Vector3();
		var linkPos = new THREE.Vector3();
		var invLinkQ = new THREE.Quaternion();
		var linkScale = new THREE.Vector3();
		var axis = new THREE.Vector3();

		var bones = this.mesh.skeleton.bones;
		var iks = this.mesh.geometry.iks;

		var boneParams = this.mesh.geometry.bones;

		// for reference overhead reduction in loop
		var math = Math;

		this.mesh.updateMatrixWorld( true );

		if ( saveOriginalBones === true ) this._saveOriginalBonesInfo();

		for ( var i = 0, il = iks.length; i < il; i++ ) {

			var ik = iks[ i ];
			var effector = bones[ ik.effector ];
			var target = bones[ ik.target ];

			// don't use getWorldPosition() here for the performance
			// because it calls updateMatrixWorld( true ) inside.
			targetPos.setFromMatrixPosition( target.matrixWorld );

			var links = ik.links;
			var iteration = ik.iteration !== undefined ? ik.iteration : 1;

			for ( var j = 0; j < iteration; j++ ) {

				var rotated = false;

				for ( var k = 0, kl = links.length; k < kl; k++ ) {

					var link = bones[ links[ k ].index ];

					// skip this link and following links.
					// this skip is used for MMD performance optimization.
					if ( links[ k ].enabled === false ) break;

					var limitation = links[ k ].limitation;

					// don't use getWorldPosition/Quaternion() here for the performance
					// because they call updateMatrixWorld( true ) inside.
					link.matrixWorld.decompose( linkPos, invLinkQ, linkScale );
					invLinkQ.inverse();
					effectorPos.setFromMatrixPosition( effector.matrixWorld );

					// work in link world
					effectorVec.subVectors( effectorPos, linkPos );
					effectorVec.applyQuaternion( invLinkQ );
					effectorVec.normalize();

					targetVec.subVectors( targetPos, linkPos );
					targetVec.applyQuaternion( invLinkQ );
					targetVec.normalize();

					var angle = targetVec.dot( effectorVec );

					if ( angle > 1.0 ) {

						angle = 1.0;

					} else if ( angle < -1.0 ) {

						angle = -1.0;

					}

					angle = math.acos( angle );

					// skip if changing angle is too small to prevent vibration of bone
					// Refer to http://www20.atpages.jp/katwat/three.js_r58/examples/mytest37/mmd.three.js
					if ( angle < 1e-5 ) continue;

					if ( ik.minAngle !== undefined && angle < ik.minAngle ) {

						angle = ik.minAngle;

					}

					if ( ik.maxAngle !== undefined && angle > ik.maxAngle ) {

						angle = ik.maxAngle;

					}

					axis.crossVectors( effectorVec, targetVec );
					axis.normalize();

					q.setFromAxisAngle( axis, angle );
					link.quaternion.multiply( q );

					// TODO: re-consider the limitation specification
					if ( limitation !== undefined ) {

						var c = link.quaternion.w;

						if ( c > 1.0 ) {

							c = 1.0;

						}

						var c2 = math.sqrt( 1 - c * c );
						link.quaternion.set( limitation.x * c2,
						                     limitation.y * c2,
						                     limitation.z * c2,
						                     c );

					}

					link.updateMatrixWorld( true );
					rotated = true;

				}

				if ( ! rotated ) break;

			}

		}

		// just in case
		this.mesh.updateMatrixWorld( true );

	}

};


THREE.CCDIKHelper = function ( mesh ) {

	if ( mesh.geometry.iks === undefined || mesh.skeleton === undefined ) {

		throw 'THREE.CCDIKHelper requires iks in mesh.geometry and skeleton in mesh.';

	}

	THREE.Object3D.call( this );

	this.root = mesh;

	this.matrix = mesh.matrixWorld;
	this.matrixAutoUpdate = false;

	this.sphereGeometry = new THREE.SphereBufferGeometry( 0.25, 16, 8 );

	this.targetSphereMaterial = new THREE.MeshBasicMaterial( {
		color: new THREE.Color( 0xff8888 ),
		depthTest: false,
		depthWrite: false,
		transparent: true
	} );

	this.effectorSphereMaterial = new THREE.MeshBasicMaterial( {
		color: new THREE.Color( 0x88ff88 ),
		depthTest: false,
		depthWrite: false,
		transparent: true
	} );

	this.linkSphereMaterial = new THREE.MeshBasicMaterial( {
		color: new THREE.Color( 0x8888ff ),
		depthTest: false,
		depthWrite: false,
		transparent: true
	} );

	this.lineMaterial = new THREE.LineBasicMaterial( {
		color: new THREE.Color( 0xff0000 ),
		depthTest: false,
		depthWrite: false,
		transparent: true
	} );

	this._init();
	this.update();

};

THREE.CCDIKHelper.prototype = Object.create( THREE.Object3D.prototype );
THREE.CCDIKHelper.prototype.constructor = THREE.CCDIKHelper;

THREE.CCDIKHelper.prototype._init = function () {

	var self = this;
	var mesh = this.root;
	var iks = mesh.geometry.iks;

	function createLineGeometry( ik ) {

		var geometry = new THREE.BufferGeometry();
		var vertices = new Float32Array( ( 2 + ik.links.length ) * 3 );
		geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

		return geometry;

	}

	function createTargetMesh() {

		return new THREE.Mesh( self.sphereGeometry, self.targetSphereMaterial );

	}

	function createEffectorMesh() {

		return new THREE.Mesh( self.sphereGeometry, self.effectorSphereMaterial );

	}

	function createLinkMesh() {

		return new THREE.Mesh( self.sphereGeometry, self.linkSphereMaterial );

	}

	function createLine( ik ) {

		return new THREE.Line( createLineGeometry( ik ), self.lineMaterial );

	}

	for ( var i = 0, il = iks.length; i < il; i ++ ) {

		var ik = iks[ i ];

		this.add( createTargetMesh() );
		this.add( createEffectorMesh() );

		for ( var j = 0, jl = ik.links.length; j < jl; j ++ ) {

			this.add( createLinkMesh() );

		}

		this.add( createLine( ik ) );

	}

};

THREE.CCDIKHelper.prototype.update = function () {

	var offset = 0;

	var mesh = this.root;
	var iks = mesh.geometry.iks;
	var bones = mesh.skeleton.bones;

	var matrixWorldInv = new THREE.Matrix4().getInverse( mesh.matrixWorld );
	var vector = new THREE.Vector3();

	function getPosition( bone ) {

		vector.setFromMatrixPosition( bone.matrixWorld );
		vector.applyMatrix4( matrixWorldInv );

		return vector;

	}

	function setPositionOfBoneToAttributeArray( array, index, bone ) {

		var v = getPosition( bone );

		array[ index * 3 + 0 ] = v.x;
		array[ index * 3 + 1 ] = v.y;
		array[ index * 3 + 2 ] = v.z;

	}

	for ( var i = 0, il = iks.length; i < il; i ++ ) {

		var ik = iks[ i ];

		var targetBone = bones[ ik.target ];
		var effectorBone = bones[ ik.effector ];

		var targetMesh = this.children[ offset ++ ];
		var effectorMesh = this.children[ offset ++ ];

		targetMesh.position.copy( getPosition( targetBone ) );
		effectorMesh.position.copy( getPosition( effectorBone ) );

		for ( var j = 0, jl = ik.links.length; j < jl; j ++ ) {

			var link = ik.links[ j ];
			var linkBone = bones[ link.index ];

			var linkMesh = this.children[ offset ++ ];

			linkMesh.position.copy( getPosition( linkBone ) );

		}

		var line = this.children[ offset ++ ];
		var array = line.geometry.attributes.position.array;

		setPositionOfBoneToAttributeArray( array, 0, targetBone );
		setPositionOfBoneToAttributeArray( array, 1, effectorBone );

		for ( var j = 0, jl = ik.links.length; j < jl; j ++ ) {

			var link = ik.links[ j ];
			var linkBone = bones[ link.index ];
			setPositionOfBoneToAttributeArray( array, j + 2, linkBone );

		}

		line.geometry.attributes.position.needsUpdate = true;

	}

};


/***/ }),
/* 4 */
/***/ (function(module, exports) {

/**
 * @author takahiro / https://github.com/takahirox
 *
 * Dependencies
 *  - Ammo.js https://github.com/kripken/ammo.js
 *
 * MMD specific Physics class.
 *
 * See THREE.MMDLoader for the passed parameter list of RigidBody/Constraint.
 *
 * Requirement:
 *  - don't change object's scale from (1,1,1) after setting physics to object
 *
 * TODO
 *  - optimize for the performance
 *  - use Physijs http://chandlerprall.github.io/Physijs/
 *    and improve the performance by making use of Web worker.
 *  - if possible, make this class being non-MMD specific.
 *  - object scale change support
 */

THREE.MMDPhysics = function ( mesh, params ) {

	if ( params === undefined ) params = {};

	this.mesh = mesh;
	this.helper = new THREE.MMDPhysics.ResourceHelper();

	/*
	 * I don't know why but 1/60 unitStep easily breaks models
	 * so I set it 1/65 so far.
	 * Don't set too small unitStep because
	 * the smaller unitStep can make the performance worse.
	 */
	this.unitStep = ( params.unitStep !== undefined ) ? params.unitStep : 1 / 65;
	this.maxStepNum = ( params.maxStepNum !== undefined ) ? params.maxStepNum : 3;

	this.world = params.world !== undefined ? params.world : null;
	this.bodies = [];
	this.constraints = [];

	this.init( mesh );

};

THREE.MMDPhysics.prototype = {

	constructor: THREE.MMDPhysics,

	init: function ( mesh ) {

		var parent = mesh.parent;

		if ( parent !== null ) {

			parent.remove( mesh );

		}

		var helper = this.helper;
		var currentPosition = helper.allocThreeVector3();
		var currentRotation = helper.allocThreeVector3();
		var currentScale = helper.allocThreeVector3();

		currentPosition.copy( mesh.position );
		currentRotation.copy( mesh.rotation );
		currentScale.copy( mesh.scale );

		mesh.position.set( 0, 0, 0 );
		mesh.rotation.set( 0, 0, 0 );
		mesh.scale.set( 1, 1, 1 );

		mesh.updateMatrixWorld( true );

		if ( this.world === null ) this.initWorld();
		this.initRigidBodies();
		this.initConstraints();

		if ( parent !== null ) {

			parent.add( mesh );

		}

		mesh.position.copy( currentPosition );
		mesh.rotation.copy( currentRotation );
		mesh.scale.copy( currentScale );

		mesh.updateMatrixWorld( true );

		this.reset();

		helper.freeThreeVector3( currentPosition );
		helper.freeThreeVector3( currentRotation );
		helper.freeThreeVector3( currentScale );

	},

	initWorld: function () {

		var config = new Ammo.btDefaultCollisionConfiguration();
		var dispatcher = new Ammo.btCollisionDispatcher( config );
		var cache = new Ammo.btDbvtBroadphase();
		var solver = new Ammo.btSequentialImpulseConstraintSolver();
		var world = new Ammo.btDiscreteDynamicsWorld( dispatcher, cache, solver, config );
		world.setGravity( new Ammo.btVector3( 0, -9.8 * 10, 0 ) );
		this.world = world;

	},

	initRigidBodies: function () {

		var bodies = this.mesh.geometry.rigidBodies;

		for ( var i = 0; i < bodies.length; i++ ) {

			var b = new THREE.MMDPhysics.RigidBody( this.mesh, this.world, bodies[ i ], this.helper );
			this.bodies.push( b );

		}

	},

	initConstraints: function () {

		var constraints = this.mesh.geometry.constraints;

		for ( var i = 0; i < constraints.length; i++ ) {

			var params = constraints[ i ];
			var bodyA = this.bodies[ params.rigidBodyIndex1 ];
			var bodyB = this.bodies[ params.rigidBodyIndex2 ];
			var c = new THREE.MMDPhysics.Constraint( this.mesh, this.world, bodyA, bodyB, params, this.helper );
			this.constraints.push( c );

		}


	},

	update: function ( delta ) {

		this.updateRigidBodies();
		this.stepSimulation( delta );
		this.updateBones();

	},

	stepSimulation: function ( delta ) {

		var unitStep = this.unitStep;
		var stepTime = delta;
		var maxStepNum = ( ( delta / unitStep ) | 0 ) + 1;

		if ( stepTime < unitStep ) {

			stepTime = unitStep;
			maxStepNum = 1;

		}

		if ( maxStepNum > this.maxStepNum ) {

			maxStepNum = this.maxStepNum;

		}

		this.world.stepSimulation( stepTime, maxStepNum, unitStep );

	},

	updateRigidBodies: function () {

		for ( var i = 0; i < this.bodies.length; i++ ) {

			this.bodies[ i ].updateFromBone();

		}

	},

	updateBones: function () {

		for ( var i = 0; i < this.bodies.length; i++ ) {

			this.bodies[ i ].updateBone();

		}

	},

	reset: function () {

		for ( var i = 0; i < this.bodies.length; i++ ) {

			this.bodies[ i ].reset();

		}

	},

	warmup: function ( cycles ) {

		for ( var i = 0; i < cycles; i++ ) {

			this.update( 1 / 60 );

		}

	}

};

/**
 * This helper class responsibilies are
 *
 * 1. manage Ammo.js and Three.js object resources and
 *    improve the performance and the memory consumption by
 *    reusing objects.
 *
 * 2. provide simple Ammo object operations.
 */
THREE.MMDPhysics.ResourceHelper = function () {

	// for Three.js
	this.threeVector3s = [];
	this.threeMatrix4s = [];
	this.threeQuaternions = [];
	this.threeEulers = [];

	// for Ammo.js
	this.transforms = [];
	this.quaternions = [];
	this.vector3s = [];

};

THREE.MMDPhysics.ResourceHelper.prototype = {

	allocThreeVector3: function () {

		return ( this.threeVector3s.length > 0 ) ? this.threeVector3s.pop() : new THREE.Vector3();

	},

	freeThreeVector3: function ( v ) {

		this.threeVector3s.push( v );

	},

	allocThreeMatrix4: function () {

		return ( this.threeMatrix4s.length > 0 ) ? this.threeMatrix4s.pop() : new THREE.Matrix4();

	},

	freeThreeMatrix4: function ( m ) {

		this.threeMatrix4s.push( m );

	},

	allocThreeQuaternion: function () {

		return ( this.threeQuaternions.length > 0 ) ? this.threeQuaternions.pop() : new THREE.Quaternion();

	},

	freeThreeQuaternion: function ( q ) {

		this.threeQuaternions.push( q );

	},

	allocThreeEuler: function () {

		return ( this.threeEulers.length > 0 ) ? this.threeEulers.pop() : new THREE.Euler();

	},

	freeThreeEuler: function ( e ) {

		this.threeEulers.push( e );

	},

	allocTransform: function () {

		return ( this.transforms.length > 0 ) ? this.transforms.pop() : new Ammo.btTransform();

	},

	freeTransform: function ( t ) {

		this.transforms.push( t );

	},

	allocQuaternion: function () {

		return ( this.quaternions.length > 0 ) ? this.quaternions.pop() : new Ammo.btQuaternion();

	},

	freeQuaternion: function ( q ) {

		this.quaternions.push( q );

	},

	allocVector3: function () {

		return ( this.vector3s.length > 0 ) ? this.vector3s.pop() : new Ammo.btVector3();

	},

	freeVector3: function ( v ) {

		this.vector3s.push( v );

	},

	setIdentity: function ( t ) {

		t.setIdentity();

	},

	getBasis: function ( t ) {

		var q = this.allocQuaternion();
		t.getBasis().getRotation( q );
		return q;

	},

	getBasisAsMatrix3: function ( t ) {

		var q = this.getBasis( t );
		var m = this.quaternionToMatrix3( q );
		this.freeQuaternion( q );
		return m;

	},

	getOrigin: function( t ) {

		return t.getOrigin();

	},

	setOrigin: function( t, v ) {

		t.getOrigin().setValue( v.x(), v.y(), v.z() );

	},

	copyOrigin: function( t1, t2 ) {

		var o = t2.getOrigin();
		this.setOrigin( t1, o );

	},

	setBasis: function( t, q ) {

		t.setRotation( q );

	},

	setBasisFromMatrix3: function( t, m ) {

		var q = this.matrix3ToQuaternion( m );
		this.setBasis( t, q );
		this.freeQuaternion( q );

	},

	setOriginFromArray3: function ( t, a ) {

		t.getOrigin().setValue( a[ 0 ], a[ 1 ], a[ 2 ] );

	},

	setOriginFromThreeVector3: function ( t, v ) {

		t.getOrigin().setValue( v.x, v.y, v.z );

	},

	setBasisFromArray3: function ( t, a ) {

		var thQ = this.allocThreeQuaternion();
		var thE = this.allocThreeEuler();
		thE.set( a[ 0 ], a[ 1 ], a[ 2 ] );
		this.setBasisFromThreeQuaternion( t, thQ.setFromEuler( thE ) );

		this.freeThreeEuler( thE );
		this.freeThreeQuaternion( thQ );

	},

	setBasisFromThreeQuaternion: function ( t, a ) {

		var q = this.allocQuaternion();

		q.setX( a.x );
		q.setY( a.y );
		q.setZ( a.z );
		q.setW( a.w );
		this.setBasis( t, q );

		this.freeQuaternion( q );

	},

	multiplyTransforms: function ( t1, t2 ) {

		var t = this.allocTransform();
		this.setIdentity( t );

		var m1 = this.getBasisAsMatrix3( t1 );
		var m2 = this.getBasisAsMatrix3( t2 );

		var o1 = this.getOrigin( t1 );
		var o2 = this.getOrigin( t2 );

		var v1 = this.multiplyMatrix3ByVector3( m1, o2 );
		var v2 = this.addVector3( v1, o1 );
		this.setOrigin( t, v2 );

		var m3 = this.multiplyMatrices3( m1, m2 );
		this.setBasisFromMatrix3( t, m3 );

		this.freeVector3( v1 );
		this.freeVector3( v2 );

		return t;

	},

	inverseTransform: function ( t ) {

		var t2 = this.allocTransform();

		var m1 = this.getBasisAsMatrix3( t );
		var o = this.getOrigin( t );

		var m2 = this.transposeMatrix3( m1 );
		var v1 = this.negativeVector3( o );
		var v2 = this.multiplyMatrix3ByVector3( m2, v1 );

		this.setOrigin( t2, v2 );
		this.setBasisFromMatrix3( t2, m2 );

		this.freeVector3( v1 );
		this.freeVector3( v2 );

		return t2;

	},

	multiplyMatrices3: function ( m1, m2 ) {

		var m3 = [];

		var v10 = this.rowOfMatrix3( m1, 0 );
		var v11 = this.rowOfMatrix3( m1, 1 );
		var v12 = this.rowOfMatrix3( m1, 2 );

		var v20 = this.columnOfMatrix3( m2, 0 );
		var v21 = this.columnOfMatrix3( m2, 1 );
		var v22 = this.columnOfMatrix3( m2, 2 );

		m3[ 0 ] = this.dotVectors3( v10, v20 );
		m3[ 1 ] = this.dotVectors3( v10, v21 );
		m3[ 2 ] = this.dotVectors3( v10, v22 );
		m3[ 3 ] = this.dotVectors3( v11, v20 );
		m3[ 4 ] = this.dotVectors3( v11, v21 );
		m3[ 5 ] = this.dotVectors3( v11, v22 );
		m3[ 6 ] = this.dotVectors3( v12, v20 );
		m3[ 7 ] = this.dotVectors3( v12, v21 );
		m3[ 8 ] = this.dotVectors3( v12, v22 );

		this.freeVector3( v10 );
		this.freeVector3( v11 );
		this.freeVector3( v12 );
		this.freeVector3( v20 );
		this.freeVector3( v21 );
		this.freeVector3( v22 );

		return m3;

	},

	addVector3: function( v1, v2 ) {

		var v = this.allocVector3();
		v.setValue( v1.x() + v2.x(), v1.y() + v2.y(), v1.z() + v2.z() );
		return v;

	},

	dotVectors3: function( v1, v2 ) {

		return v1.x() * v2.x() + v1.y() * v2.y() + v1.z() * v2.z();

	},

	rowOfMatrix3: function( m, i ) {

		var v = this.allocVector3();
		v.setValue( m[ i * 3 + 0 ], m[ i * 3 + 1 ], m[ i * 3 + 2 ] );
		return v;

	},

	columnOfMatrix3: function( m, i ) {

		var v = this.allocVector3();
		v.setValue( m[ i + 0 ], m[ i + 3 ], m[ i + 6 ] );
		return v;

	},

	negativeVector3: function( v ) {

		var v2 = this.allocVector3();
		v2.setValue( -v.x(), -v.y(), -v.z() );
		return v2;

	},

	multiplyMatrix3ByVector3: function ( m, v ) {

		var v4 = this.allocVector3();

		var v0 = this.rowOfMatrix3( m, 0 );
		var v1 = this.rowOfMatrix3( m, 1 );
		var v2 = this.rowOfMatrix3( m, 2 );
		var x = this.dotVectors3( v0, v );
		var y = this.dotVectors3( v1, v );
		var z = this.dotVectors3( v2, v );

		v4.setValue( x, y, z );

		this.freeVector3( v0 );
		this.freeVector3( v1 );
		this.freeVector3( v2 );

		return v4;

	},

	transposeMatrix3: function( m ) {

		var m2 = [];
		m2[ 0 ] = m[ 0 ];
		m2[ 1 ] = m[ 3 ];
		m2[ 2 ] = m[ 6 ];
		m2[ 3 ] = m[ 1 ];
		m2[ 4 ] = m[ 4 ];
		m2[ 5 ] = m[ 7 ];
		m2[ 6 ] = m[ 2 ];
		m2[ 7 ] = m[ 5 ];
		m2[ 8 ] = m[ 8 ];
		return m2;

	},

	quaternionToMatrix3: function ( q ) {

		var m = [];

		var x = q.x();
		var y = q.y();
		var z = q.z();
		var w = q.w();

		var xx = x * x;
		var yy = y * y;
		var zz = z * z;

		var xy = x * y;
		var yz = y * z;
		var zx = z * x;

		var xw = x * w;
		var yw = y * w;
		var zw = z * w;

		m[ 0 ] = 1 - 2 * ( yy + zz );
		m[ 1 ] = 2 * ( xy - zw );
		m[ 2 ] = 2 * ( zx + yw );
		m[ 3 ] = 2 * ( xy + zw );
		m[ 4 ] = 1 - 2 * ( zz + xx );
		m[ 5 ] = 2 * ( yz - xw );
		m[ 6 ] = 2 * ( zx - yw );
		m[ 7 ] = 2 * ( yz + xw );
		m[ 8 ] = 1 - 2 * ( xx + yy );

		return m;

	},

	matrix3ToQuaternion: function( m ) {

		var t = m[ 0 ] + m[ 4 ] + m[ 8 ];
		var s, x, y, z, w;

		if( t > 0 ) {

			s = Math.sqrt( t + 1.0 ) * 2;
			w = 0.25 * s;
			x = ( m[ 7 ] - m[ 5 ] ) / s;
			y = ( m[ 2 ] - m[ 6 ] ) / s; 
			z = ( m[ 3 ] - m[ 1 ] ) / s; 

		} else if( ( m[ 0 ] > m[ 4 ] ) && ( m[ 0 ] > m[ 8 ] ) ) {

			s = Math.sqrt( 1.0 + m[ 0 ] - m[ 4 ] - m[ 8 ] ) * 2;
			w = ( m[ 7 ] - m[ 5 ] ) / s;
			x = 0.25 * s;
			y = ( m[ 1 ] + m[ 3 ] ) / s;
			z = ( m[ 2 ] + m[ 6 ] ) / s;

		} else if( m[ 4 ] > m[ 8 ] ) {

			s = Math.sqrt( 1.0 + m[ 4 ] - m[ 0 ] - m[ 8 ] ) * 2;
			w = ( m[ 2 ] - m[ 6 ] ) / s;
			x = ( m[ 1 ] + m[ 3 ] ) / s;
			y = 0.25 * s;
			z = ( m[ 5 ] + m[ 7 ] ) / s;

		} else {

			s = Math.sqrt( 1.0 + m[ 8 ] - m[ 0 ] - m[ 4 ] ) * 2;
			w = ( m[ 3 ] - m[ 1 ] ) / s;
			x = ( m[ 2 ] + m[ 6 ] ) / s;
			y = ( m[ 5 ] + m[ 7 ] ) / s;
			z = 0.25 * s;

		}

		var q = this.allocQuaternion();
		q.setX( x );
		q.setY( y );
		q.setZ( z );
		q.setW( w );
		return q;

	}

};

THREE.MMDPhysics.RigidBody = function ( mesh, world, params, helper ) {

	this.mesh  = mesh;
	this.world = world;
	this.params = params;
	this.helper = helper;

	this.body = null;
	this.bone = null;
	this.boneOffsetForm = null;
	this.boneOffsetFormInverse = null;

	this.init();

};

THREE.MMDPhysics.RigidBody.prototype = {

	constructor: THREE.MMDPhysics.RigidBody,

	init: function () {

		function generateShape( p ) {

			switch( p.shapeType ) {

				case 0:
					return new Ammo.btSphereShape( p.width );

				case 1:
					return new Ammo.btBoxShape( new Ammo.btVector3( p.width, p.height, p.depth ) );

				case 2:
					return new Ammo.btCapsuleShape( p.width, p.height );

				default:
					throw 'unknown shape type ' + p.shapeType;

			}

		}

		var helper = this.helper;
		var params = this.params;
		var bones = this.mesh.skeleton.bones;
		var bone = ( params.boneIndex === -1 ) ? new THREE.Bone() : bones[ params.boneIndex ];

		var shape = generateShape( params );
		var weight = ( params.type === 0 ) ? 0 : params.weight;
		var localInertia = helper.allocVector3();
		localInertia.setValue( 0, 0, 0 );

		if( weight !== 0 ) {

			shape.calculateLocalInertia( weight, localInertia );

		}

		var boneOffsetForm = helper.allocTransform();
		helper.setIdentity( boneOffsetForm );
		helper.setOriginFromArray3( boneOffsetForm, params.position );
		helper.setBasisFromArray3( boneOffsetForm, params.rotation );

		var vector = helper.allocThreeVector3();
		var boneForm = helper.allocTransform();
		helper.setIdentity( boneForm );
		helper.setOriginFromThreeVector3( boneForm, bone.getWorldPosition( vector ) );

		var form = helper.multiplyTransforms( boneForm, boneOffsetForm );
		var state = new Ammo.btDefaultMotionState( form );

		var info = new Ammo.btRigidBodyConstructionInfo( weight, state, shape, localInertia );
		info.set_m_friction( params.friction );
		info.set_m_restitution( params.restitution );

		var body = new Ammo.btRigidBody( info );

		if ( params.type === 0 ) {

			body.setCollisionFlags( body.getCollisionFlags() | 2 );

			/*
			 * It'd be better to comment out this line though in general I should call this method
			 * because I'm not sure why but physics will be more like MMD's
			 * if I comment out.
			 */
			body.setActivationState( 4 );

		}

		body.setDamping( params.positionDamping, params.rotationDamping );
		body.setSleepingThresholds( 0, 0 );

		this.world.addRigidBody( body, 1 << params.groupIndex, params.groupTarget );

		this.body = body;
		this.bone = bone;
		this.boneOffsetForm = boneOffsetForm;
		this.boneOffsetFormInverse = helper.inverseTransform( boneOffsetForm );

		helper.freeVector3( localInertia );
		helper.freeTransform( form );
		helper.freeTransform( boneForm );
		helper.freeThreeVector3( vector );

	},

	reset: function () {

		this.setTransformFromBone();

	},

	updateFromBone: function () {

		if ( this.params.boneIndex === -1 ) {

			return;

		}

		if ( this.params.type === 0 ) {

			this.setTransformFromBone();

		}

	},

	updateBone: function () {

		if ( this.params.type === 0 || this.params.boneIndex === -1 ) {

			return;

		}

		this.updateBoneRotation();

		if ( this.params.type === 1 ) {

			this.updateBonePosition();

		}

		this.bone.updateMatrixWorld( true );

		if ( this.params.type === 2 ) {

			this.setPositionFromBone();

		}

	},

	getBoneTransform: function () {

		var helper = this.helper;
		var p = helper.allocThreeVector3();
		var q = helper.allocThreeQuaternion();

		this.bone.getWorldPosition( p );
		this.bone.getWorldQuaternion( q );

		var tr = helper.allocTransform();
		helper.setOriginFromThreeVector3( tr, p );
		helper.setBasisFromThreeQuaternion( tr, q );

		var form = helper.multiplyTransforms( tr, this.boneOffsetForm );

		helper.freeTransform( tr );
		helper.freeThreeQuaternion( q );
		helper.freeThreeVector3( p );

		return form;

	},

	getWorldTransformForBone: function () {

		var helper = this.helper;

		var tr = helper.allocTransform();
		this.body.getMotionState().getWorldTransform( tr );
		var tr2 = helper.multiplyTransforms( tr, this.boneOffsetFormInverse );

		helper.freeTransform( tr );

		return tr2;

	},

	setTransformFromBone: function () {

		var helper = this.helper;
		var form = this.getBoneTransform();

		// TODO: check the most appropriate way to set
		//this.body.setWorldTransform( form );
		this.body.setCenterOfMassTransform( form );
		this.body.getMotionState().setWorldTransform( form );

		helper.freeTransform( form );

	},

	setPositionFromBone: function () {

		var helper = this.helper;
		var form = this.getBoneTransform();

		var tr = helper.allocTransform();
		this.body.getMotionState().getWorldTransform( tr );
		helper.copyOrigin( tr, form );

		// TODO: check the most appropriate way to set
		//this.body.setWorldTransform( tr );
		this.body.setCenterOfMassTransform( tr );
		this.body.getMotionState().setWorldTransform( tr );

		helper.freeTransform( tr );
		helper.freeTransform( form );

	},

	updateBoneRotation: function () {

		this.bone.updateMatrixWorld( true );

		var helper = this.helper;

		var tr = this.getWorldTransformForBone();
		var q = helper.getBasis( tr );

		var thQ = helper.allocThreeQuaternion();
		var thQ2 = helper.allocThreeQuaternion();
		var thQ3 = helper.allocThreeQuaternion();

		thQ.set( q.x(), q.y(), q.z(), q.w() );
		thQ2.setFromRotationMatrix( this.bone.matrixWorld );
		thQ2.conjugate();
		thQ2.multiply( thQ );

		//this.bone.quaternion.multiply( thQ2 );

		thQ3.setFromRotationMatrix( this.bone.matrix );
		this.bone.quaternion.copy( thQ2.multiply( thQ3 ) );

		helper.freeThreeQuaternion( thQ );
		helper.freeThreeQuaternion( thQ2 );
		helper.freeThreeQuaternion( thQ3 );

		helper.freeQuaternion( q );
		helper.freeTransform( tr );

	},

	updateBonePosition: function () {

		var helper = this.helper;

		var tr = this.getWorldTransformForBone();

		var thV = helper.allocThreeVector3();

		var o = helper.getOrigin( tr );
		thV.set( o.x(), o.y(), o.z() );

		var v = this.bone.worldToLocal( thV );
		this.bone.position.add( v );

		helper.freeThreeVector3( thV );

		helper.freeTransform( tr );

	}

};

THREE.MMDPhysics.Constraint = function ( mesh, world, bodyA, bodyB, params, helper ) {

	this.mesh  = mesh;
	this.world = world;
	this.bodyA = bodyA;
	this.bodyB = bodyB;
	this.params = params;
	this.helper = helper;

	this.constraint = null;

	this.init();

};

THREE.MMDPhysics.Constraint.prototype = {

	constructor: THREE.MMDPhysics.Constraint,

	init: function () {

		var helper = this.helper;
		var params = this.params;
		var bodyA = this.bodyA;
		var bodyB = this.bodyB;

		var form = helper.allocTransform();
		helper.setIdentity( form );
		helper.setOriginFromArray3( form, params.position );
		helper.setBasisFromArray3( form, params.rotation );

		var formA = helper.allocTransform();
		var formB = helper.allocTransform();

		bodyA.body.getMotionState().getWorldTransform( formA );
		bodyB.body.getMotionState().getWorldTransform( formB );

		var formInverseA = helper.inverseTransform( formA );
		var formInverseB = helper.inverseTransform( formB );

		var formA2 = helper.multiplyTransforms( formInverseA, form );
		var formB2 = helper.multiplyTransforms( formInverseB, form );

		var constraint = new Ammo.btGeneric6DofSpringConstraint( bodyA.body, bodyB.body, formA2, formB2, true );

		var lll = helper.allocVector3();
		var lul = helper.allocVector3();
		var all = helper.allocVector3();
		var aul = helper.allocVector3();

		lll.setValue( params.translationLimitation1[ 0 ],
		              params.translationLimitation1[ 1 ],
		              params.translationLimitation1[ 2 ] );
		lul.setValue( params.translationLimitation2[ 0 ],
		              params.translationLimitation2[ 1 ],
		              params.translationLimitation2[ 2 ] );
		all.setValue( params.rotationLimitation1[ 0 ],
		              params.rotationLimitation1[ 1 ],
		              params.rotationLimitation1[ 2 ] );
		aul.setValue( params.rotationLimitation2[ 0 ],
		              params.rotationLimitation2[ 1 ],
		              params.rotationLimitation2[ 2 ] );

		constraint.setLinearLowerLimit( lll );
		constraint.setLinearUpperLimit( lul );
		constraint.setAngularLowerLimit( all );
		constraint.setAngularUpperLimit( aul );

		for ( var i = 0; i < 3; i++ ) {

			if( params.springPosition[ i ] !== 0 ) {

				constraint.enableSpring( i, true );
				constraint.setStiffness( i, params.springPosition[ i ] );

			}

		}

		for ( var i = 0; i < 3; i++ ) {

			if( params.springRotation[ i ] !== 0 ) {

				constraint.enableSpring( i + 3, true );
				constraint.setStiffness( i + 3, params.springRotation[ i ] );

			}

		}

		/*
		 * Currently(10/31/2016) official ammo.js doesn't support
		 * btGeneric6DofSpringConstraint.setParam method.
		 * You need custom ammo.js (add the method into idl) if you wanna use.
		 * By setting this parameter, physics will be more like MMD's
		 */
		if ( constraint.setParam !== undefined ) {

			for ( var i = 0; i < 6; i ++ ) {

				// this parameter is from http://www20.atpages.jp/katwat/three.js_r58/examples/mytest37/mmd.three.js
				constraint.setParam( 2, 0.475, i );

			}

		}

		this.world.addConstraint( constraint, true );
		this.constraint = constraint;

		helper.freeTransform( form );
		helper.freeTransform( formA );
		helper.freeTransform( formB );
		helper.freeTransform( formInverseA );
		helper.freeTransform( formInverseB );
		helper.freeTransform( formA2 );
		helper.freeTransform( formB2 );
		helper.freeVector3( lll );
		helper.freeVector3( lul );
		helper.freeVector3( all );
		helper.freeVector3( aul );

	}

};


THREE.MMDPhysicsHelper = function ( mesh ) {

	if ( mesh.physics === undefined || mesh.geometry.rigidBodies === undefined ) {

		throw 'THREE.MMDPhysicsHelper requires physics in mesh and rigidBodies in mesh.geometry.';

	}

	THREE.Object3D.call( this );

	this.root = mesh;

	this.matrix = mesh.matrixWorld;
	this.matrixAutoUpdate = false;

	this.materials = [];

	this.materials.push(
		new THREE.MeshBasicMaterial( {
			color: new THREE.Color( 0xff8888 ),
			wireframe: true,
			depthTest: false,
			depthWrite: false,
			opacity: 0.25,
			transparent: true
		} )
	);

	this.materials.push(
		new THREE.MeshBasicMaterial( {
			color: new THREE.Color( 0x88ff88 ),
			wireframe: true,
			depthTest: false,
			depthWrite: false,
			opacity: 0.25,
			transparent: true
		} )
	);

	this.materials.push(
		new THREE.MeshBasicMaterial( {
			color: new THREE.Color( 0x8888ff ),
			wireframe: true,
			depthTest: false,
			depthWrite: false,
			opacity: 0.25,
			transparent: true
		} )
	);

	this._init();
	this.update();

};

THREE.MMDPhysicsHelper.prototype = Object.create( THREE.Object3D.prototype );
THREE.MMDPhysicsHelper.prototype.constructor = THREE.MMDPhysicsHelper;

THREE.MMDPhysicsHelper.prototype._init = function () {

	var mesh = this.root;
	var rigidBodies = mesh.geometry.rigidBodies;

	function createGeometry( param ) {

		switch ( param.shapeType ) {

			case 0:
				return new THREE.SphereBufferGeometry( param.width, 16, 8 );

			case 1:
				return new THREE.BoxBufferGeometry( param.width * 2, param.height * 2, param.depth * 2, 8, 8, 8 );

			case 2:
				return new createCapsuleGeometry( param.width, param.height, 16, 8 );

			default:
				return null;

		}

	}

	// copy from http://www20.atpages.jp/katwat/three.js_r58/examples/mytest37/mytest37.js?ver=20160815
	function createCapsuleGeometry( radius, cylinderHeight, segmentsRadius, segmentsHeight ) {

		var geometry = new THREE.CylinderBufferGeometry( radius, radius, cylinderHeight, segmentsRadius, segmentsHeight, true );
		var upperSphere = new THREE.Mesh( new THREE.SphereBufferGeometry( radius, segmentsRadius, segmentsHeight, 0, Math.PI * 2, 0, Math.PI / 2 ) );
		var lowerSphere = new THREE.Mesh( new THREE.SphereBufferGeometry( radius, segmentsRadius, segmentsHeight, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2 ) );

		upperSphere.position.set( 0, cylinderHeight / 2, 0 );
		lowerSphere.position.set( 0, -cylinderHeight / 2, 0 );

		upperSphere.updateMatrix();
		lowerSphere.updateMatrix();

		geometry.merge( upperSphere.geometry, upperSphere.matrix );
		geometry.merge( lowerSphere.geometry, lowerSphere.matrix );

		return geometry;

	}

	for ( var i = 0, il = rigidBodies.length; i < il; i ++ ) {

		var param = rigidBodies[ i ];
		this.add( new THREE.Mesh( createGeometry( param ), this.materials[ param.type ] ) );

	}

};

THREE.MMDPhysicsHelper.prototype.update = function () {

	var mesh = this.root;
	var rigidBodies = mesh.geometry.rigidBodies;
	var bodies = mesh.physics.bodies;

	var matrixWorldInv = new THREE.Matrix4().getInverse( mesh.matrixWorld );
	var vector = new THREE.Vector3();
	var quaternion = new THREE.Quaternion();
	var quaternion2 = new THREE.Quaternion();

	function getPosition( origin ) {

		vector.set( origin.x(), origin.y(), origin.z() );
		vector.applyMatrix4( matrixWorldInv );

		return vector;

	}

	function getQuaternion( rotation ) {

		quaternion.set( rotation.x(), rotation.y(), rotation.z(), rotation.w() );
		quaternion2.setFromRotationMatrix( matrixWorldInv );
		quaternion2.multiply( quaternion );

		return quaternion2;

	}

	for ( var i = 0, il = rigidBodies.length; i < il; i ++ ) {

		var body = bodies[ i ].body;
		var mesh = this.children[ i ];

		var tr = body.getCenterOfMassTransform();

		mesh.position.copy( getPosition( tr.getOrigin() ) );
		mesh.quaternion.copy( getQuaternion( tr.getRotation() ) );

	}

};


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

(function (global, factory) {
   true ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.MMDParser = global.MMDParser || {})));
}(this, (function (exports) { 'use strict';

/**
 * @author Takahiro / https://github.com/takahirox
 *
 * Simple CharsetEncoder.
 */

function CharsetEncoder() {
}

/*
 * Converts from Shift_JIS Uint8Array data to Unicode strings.
 */
CharsetEncoder.prototype.s2u = function(uint8Array) {
  var t = this.s2uTable;
  var str = '';
  var p = 0;

  while(p < uint8Array.length) {
    var key = uint8Array[p++];

    if(! ((key >= 0x00 && key <= 0x7e) ||
          (key >= 0xa1 && key <= 0xdf)) &&
       p < uint8Array.length) {
      key = (key << 8) | uint8Array[p++];
    }

    if(t[key] === undefined) {
      throw 'unknown char code ' + key + '.';
    }

    str += String.fromCharCode(t[key]);
  }

  return str;
};

CharsetEncoder.prototype.s2uTable = {
0:0,
1:1,
2:2,
3:3,
4:4,
5:5,
6:6,
7:7,
8:8,
9:9,
10:10,
11:11,
12:12,
13:13,
14:14,
15:15,
16:16,
17:17,
18:18,
19:19,
20:20,
21:21,
22:22,
23:23,
24:24,
25:25,
26:26,
27:27,
28:28,
29:29,
30:30,
31:31,
32:32,
33:33,
34:34,
35:35,
36:36,
37:37,
38:38,
39:39,
40:40,
41:41,
42:42,
43:43,
44:44,
45:45,
46:46,
47:47,
48:48,
49:49,
50:50,
51:51,
52:52,
53:53,
54:54,
55:55,
56:56,
57:57,
58:58,
59:59,
60:60,
61:61,
62:62,
63:63,
64:64,
65:65,
66:66,
67:67,
68:68,
69:69,
70:70,
71:71,
72:72,
73:73,
74:74,
75:75,
76:76,
77:77,
78:78,
79:79,
80:80,
81:81,
82:82,
83:83,
84:84,
85:85,
86:86,
87:87,
88:88,
89:89,
90:90,
91:91,
92:92,
93:93,
94:94,
95:95,
96:96,
97:97,
98:98,
99:99,
100:100,
101:101,
102:102,
103:103,
104:104,
105:105,
106:106,
107:107,
108:108,
109:109,
110:110,
111:111,
112:112,
113:113,
114:114,
115:115,
116:116,
117:117,
118:118,
119:119,
120:120,
121:121,
122:122,
123:123,
124:124,
125:125,
126:126,
161:65377,
162:65378,
163:65379,
164:65380,
165:65381,
166:65382,
167:65383,
168:65384,
169:65385,
170:65386,
171:65387,
172:65388,
173:65389,
174:65390,
175:65391,
176:65392,
177:65393,
178:65394,
179:65395,
180:65396,
181:65397,
182:65398,
183:65399,
184:65400,
185:65401,
186:65402,
187:65403,
188:65404,
189:65405,
190:65406,
191:65407,
192:65408,
193:65409,
194:65410,
195:65411,
196:65412,
197:65413,
198:65414,
199:65415,
200:65416,
201:65417,
202:65418,
203:65419,
204:65420,
205:65421,
206:65422,
207:65423,
208:65424,
209:65425,
210:65426,
211:65427,
212:65428,
213:65429,
214:65430,
215:65431,
216:65432,
217:65433,
218:65434,
219:65435,
220:65436,
221:65437,
222:65438,
223:65439,
33088:12288,
33089:12289,
33090:12290,
33091:65292,
33092:65294,
33093:12539,
33094:65306,
33095:65307,
33096:65311,
33097:65281,
33098:12443,
33099:12444,
33100:180,
33101:65344,
33102:168,
33103:65342,
33104:65507,
33105:65343,
33106:12541,
33107:12542,
33108:12445,
33109:12446,
33110:12291,
33111:20189,
33112:12293,
33113:12294,
33114:12295,
33115:12540,
33116:8213,
33117:8208,
33118:65295,
33119:65340,
33120:65374,
33121:8741,
33122:65372,
33123:8230,
33124:8229,
33125:8216,
33126:8217,
33127:8220,
33128:8221,
33129:65288,
33130:65289,
33131:12308,
33132:12309,
33133:65339,
33134:65341,
33135:65371,
33136:65373,
33137:12296,
33138:12297,
33139:12298,
33140:12299,
33141:12300,
33142:12301,
33143:12302,
33144:12303,
33145:12304,
33146:12305,
33147:65291,
33148:65293,
33149:177,
33150:215,
33152:247,
33153:65309,
33154:8800,
33155:65308,
33156:65310,
33157:8806,
33158:8807,
33159:8734,
33160:8756,
33161:9794,
33162:9792,
33163:176,
33164:8242,
33165:8243,
33166:8451,
33167:65509,
33168:65284,
33169:65504,
33170:65505,
33171:65285,
33172:65283,
33173:65286,
33174:65290,
33175:65312,
33176:167,
33177:9734,
33178:9733,
33179:9675,
33180:9679,
33181:9678,
33182:9671,
33183:9670,
33184:9633,
33185:9632,
33186:9651,
33187:9650,
33188:9661,
33189:9660,
33190:8251,
33191:12306,
33192:8594,
33193:8592,
33194:8593,
33195:8595,
33196:12307,
33208:8712,
33209:8715,
33210:8838,
33211:8839,
33212:8834,
33213:8835,
33214:8746,
33215:8745,
33224:8743,
33225:8744,
33226:65506,
33227:8658,
33228:8660,
33229:8704,
33230:8707,
33242:8736,
33243:8869,
33244:8978,
33245:8706,
33246:8711,
33247:8801,
33248:8786,
33249:8810,
33250:8811,
33251:8730,
33252:8765,
33253:8733,
33254:8757,
33255:8747,
33256:8748,
33264:8491,
33265:8240,
33266:9839,
33267:9837,
33268:9834,
33269:8224,
33270:8225,
33271:182,
33276:9711,
33359:65296,
33360:65297,
33361:65298,
33362:65299,
33363:65300,
33364:65301,
33365:65302,
33366:65303,
33367:65304,
33368:65305,
33376:65313,
33377:65314,
33378:65315,
33379:65316,
33380:65317,
33381:65318,
33382:65319,
33383:65320,
33384:65321,
33385:65322,
33386:65323,
33387:65324,
33388:65325,
33389:65326,
33390:65327,
33391:65328,
33392:65329,
33393:65330,
33394:65331,
33395:65332,
33396:65333,
33397:65334,
33398:65335,
33399:65336,
33400:65337,
33401:65338,
33409:65345,
33410:65346,
33411:65347,
33412:65348,
33413:65349,
33414:65350,
33415:65351,
33416:65352,
33417:65353,
33418:65354,
33419:65355,
33420:65356,
33421:65357,
33422:65358,
33423:65359,
33424:65360,
33425:65361,
33426:65362,
33427:65363,
33428:65364,
33429:65365,
33430:65366,
33431:65367,
33432:65368,
33433:65369,
33434:65370,
33439:12353,
33440:12354,
33441:12355,
33442:12356,
33443:12357,
33444:12358,
33445:12359,
33446:12360,
33447:12361,
33448:12362,
33449:12363,
33450:12364,
33451:12365,
33452:12366,
33453:12367,
33454:12368,
33455:12369,
33456:12370,
33457:12371,
33458:12372,
33459:12373,
33460:12374,
33461:12375,
33462:12376,
33463:12377,
33464:12378,
33465:12379,
33466:12380,
33467:12381,
33468:12382,
33469:12383,
33470:12384,
33471:12385,
33472:12386,
33473:12387,
33474:12388,
33475:12389,
33476:12390,
33477:12391,
33478:12392,
33479:12393,
33480:12394,
33481:12395,
33482:12396,
33483:12397,
33484:12398,
33485:12399,
33486:12400,
33487:12401,
33488:12402,
33489:12403,
33490:12404,
33491:12405,
33492:12406,
33493:12407,
33494:12408,
33495:12409,
33496:12410,
33497:12411,
33498:12412,
33499:12413,
33500:12414,
33501:12415,
33502:12416,
33503:12417,
33504:12418,
33505:12419,
33506:12420,
33507:12421,
33508:12422,
33509:12423,
33510:12424,
33511:12425,
33512:12426,
33513:12427,
33514:12428,
33515:12429,
33516:12430,
33517:12431,
33518:12432,
33519:12433,
33520:12434,
33521:12435,
33600:12449,
33601:12450,
33602:12451,
33603:12452,
33604:12453,
33605:12454,
33606:12455,
33607:12456,
33608:12457,
33609:12458,
33610:12459,
33611:12460,
33612:12461,
33613:12462,
33614:12463,
33615:12464,
33616:12465,
33617:12466,
33618:12467,
33619:12468,
33620:12469,
33621:12470,
33622:12471,
33623:12472,
33624:12473,
33625:12474,
33626:12475,
33627:12476,
33628:12477,
33629:12478,
33630:12479,
33631:12480,
33632:12481,
33633:12482,
33634:12483,
33635:12484,
33636:12485,
33637:12486,
33638:12487,
33639:12488,
33640:12489,
33641:12490,
33642:12491,
33643:12492,
33644:12493,
33645:12494,
33646:12495,
33647:12496,
33648:12497,
33649:12498,
33650:12499,
33651:12500,
33652:12501,
33653:12502,
33654:12503,
33655:12504,
33656:12505,
33657:12506,
33658:12507,
33659:12508,
33660:12509,
33661:12510,
33662:12511,
33664:12512,
33665:12513,
33666:12514,
33667:12515,
33668:12516,
33669:12517,
33670:12518,
33671:12519,
33672:12520,
33673:12521,
33674:12522,
33675:12523,
33676:12524,
33677:12525,
33678:12526,
33679:12527,
33680:12528,
33681:12529,
33682:12530,
33683:12531,
33684:12532,
33685:12533,
33686:12534,
33695:913,
33696:914,
33697:915,
33698:916,
33699:917,
33700:918,
33701:919,
33702:920,
33703:921,
33704:922,
33705:923,
33706:924,
33707:925,
33708:926,
33709:927,
33710:928,
33711:929,
33712:931,
33713:932,
33714:933,
33715:934,
33716:935,
33717:936,
33718:937,
33727:945,
33728:946,
33729:947,
33730:948,
33731:949,
33732:950,
33733:951,
33734:952,
33735:953,
33736:954,
33737:955,
33738:956,
33739:957,
33740:958,
33741:959,
33742:960,
33743:961,
33744:963,
33745:964,
33746:965,
33747:966,
33748:967,
33749:968,
33750:969,
33856:1040,
33857:1041,
33858:1042,
33859:1043,
33860:1044,
33861:1045,
33862:1025,
33863:1046,
33864:1047,
33865:1048,
33866:1049,
33867:1050,
33868:1051,
33869:1052,
33870:1053,
33871:1054,
33872:1055,
33873:1056,
33874:1057,
33875:1058,
33876:1059,
33877:1060,
33878:1061,
33879:1062,
33880:1063,
33881:1064,
33882:1065,
33883:1066,
33884:1067,
33885:1068,
33886:1069,
33887:1070,
33888:1071,
33904:1072,
33905:1073,
33906:1074,
33907:1075,
33908:1076,
33909:1077,
33910:1105,
33911:1078,
33912:1079,
33913:1080,
33914:1081,
33915:1082,
33916:1083,
33917:1084,
33918:1085,
33920:1086,
33921:1087,
33922:1088,
33923:1089,
33924:1090,
33925:1091,
33926:1092,
33927:1093,
33928:1094,
33929:1095,
33930:1096,
33931:1097,
33932:1098,
33933:1099,
33934:1100,
33935:1101,
33936:1102,
33937:1103,
33951:9472,
33952:9474,
33953:9484,
33954:9488,
33955:9496,
33956:9492,
33957:9500,
33958:9516,
33959:9508,
33960:9524,
33961:9532,
33962:9473,
33963:9475,
33964:9487,
33965:9491,
33966:9499,
33967:9495,
33968:9507,
33969:9523,
33970:9515,
33971:9531,
33972:9547,
33973:9504,
33974:9519,
33975:9512,
33976:9527,
33977:9535,
33978:9501,
33979:9520,
33980:9509,
33981:9528,
33982:9538,
34624:9312,
34625:9313,
34626:9314,
34627:9315,
34628:9316,
34629:9317,
34630:9318,
34631:9319,
34632:9320,
34633:9321,
34634:9322,
34635:9323,
34636:9324,
34637:9325,
34638:9326,
34639:9327,
34640:9328,
34641:9329,
34642:9330,
34643:9331,
34644:8544,
34645:8545,
34646:8546,
34647:8547,
34648:8548,
34649:8549,
34650:8550,
34651:8551,
34652:8552,
34653:8553,
34655:13129,
34656:13076,
34657:13090,
34658:13133,
34659:13080,
34660:13095,
34661:13059,
34662:13110,
34663:13137,
34664:13143,
34665:13069,
34666:13094,
34667:13091,
34668:13099,
34669:13130,
34670:13115,
34671:13212,
34672:13213,
34673:13214,
34674:13198,
34675:13199,
34676:13252,
34677:13217,
34686:13179,
34688:12317,
34689:12319,
34690:8470,
34691:13261,
34692:8481,
34693:12964,
34694:12965,
34695:12966,
34696:12967,
34697:12968,
34698:12849,
34699:12850,
34700:12857,
34701:13182,
34702:13181,
34703:13180,
34704:8786,
34705:8801,
34706:8747,
34707:8750,
34708:8721,
34709:8730,
34710:8869,
34711:8736,
34712:8735,
34713:8895,
34714:8757,
34715:8745,
34716:8746,
34975:20124,
34976:21782,
34977:23043,
34978:38463,
34979:21696,
34980:24859,
34981:25384,
34982:23030,
34983:36898,
34984:33909,
34985:33564,
34986:31312,
34987:24746,
34988:25569,
34989:28197,
34990:26093,
34991:33894,
34992:33446,
34993:39925,
34994:26771,
34995:22311,
34996:26017,
34997:25201,
34998:23451,
34999:22992,
35000:34427,
35001:39156,
35002:32098,
35003:32190,
35004:39822,
35005:25110,
35006:31903,
35007:34999,
35008:23433,
35009:24245,
35010:25353,
35011:26263,
35012:26696,
35013:38343,
35014:38797,
35015:26447,
35016:20197,
35017:20234,
35018:20301,
35019:20381,
35020:20553,
35021:22258,
35022:22839,
35023:22996,
35024:23041,
35025:23561,
35026:24799,
35027:24847,
35028:24944,
35029:26131,
35030:26885,
35031:28858,
35032:30031,
35033:30064,
35034:31227,
35035:32173,
35036:32239,
35037:32963,
35038:33806,
35039:34915,
35040:35586,
35041:36949,
35042:36986,
35043:21307,
35044:20117,
35045:20133,
35046:22495,
35047:32946,
35048:37057,
35049:30959,
35050:19968,
35051:22769,
35052:28322,
35053:36920,
35054:31282,
35055:33576,
35056:33419,
35057:39983,
35058:20801,
35059:21360,
35060:21693,
35061:21729,
35062:22240,
35063:23035,
35064:24341,
35065:39154,
35066:28139,
35067:32996,
35068:34093,
35136:38498,
35137:38512,
35138:38560,
35139:38907,
35140:21515,
35141:21491,
35142:23431,
35143:28879,
35144:32701,
35145:36802,
35146:38632,
35147:21359,
35148:40284,
35149:31418,
35150:19985,
35151:30867,
35152:33276,
35153:28198,
35154:22040,
35155:21764,
35156:27421,
35157:34074,
35158:39995,
35159:23013,
35160:21417,
35161:28006,
35162:29916,
35163:38287,
35164:22082,
35165:20113,
35166:36939,
35167:38642,
35168:33615,
35169:39180,
35170:21473,
35171:21942,
35172:23344,
35173:24433,
35174:26144,
35175:26355,
35176:26628,
35177:27704,
35178:27891,
35179:27945,
35180:29787,
35181:30408,
35182:31310,
35183:38964,
35184:33521,
35185:34907,
35186:35424,
35187:37613,
35188:28082,
35189:30123,
35190:30410,
35191:39365,
35192:24742,
35193:35585,
35194:36234,
35195:38322,
35196:27022,
35197:21421,
35198:20870,
35200:22290,
35201:22576,
35202:22852,
35203:23476,
35204:24310,
35205:24616,
35206:25513,
35207:25588,
35208:27839,
35209:28436,
35210:28814,
35211:28948,
35212:29017,
35213:29141,
35214:29503,
35215:32257,
35216:33398,
35217:33489,
35218:34199,
35219:36960,
35220:37467,
35221:40219,
35222:22633,
35223:26044,
35224:27738,
35225:29989,
35226:20985,
35227:22830,
35228:22885,
35229:24448,
35230:24540,
35231:25276,
35232:26106,
35233:27178,
35234:27431,
35235:27572,
35236:29579,
35237:32705,
35238:35158,
35239:40236,
35240:40206,
35241:40644,
35242:23713,
35243:27798,
35244:33659,
35245:20740,
35246:23627,
35247:25014,
35248:33222,
35249:26742,
35250:29281,
35251:20057,
35252:20474,
35253:21368,
35254:24681,
35255:28201,
35256:31311,
35257:38899,
35258:19979,
35259:21270,
35260:20206,
35261:20309,
35262:20285,
35263:20385,
35264:20339,
35265:21152,
35266:21487,
35267:22025,
35268:22799,
35269:23233,
35270:23478,
35271:23521,
35272:31185,
35273:26247,
35274:26524,
35275:26550,
35276:27468,
35277:27827,
35278:28779,
35279:29634,
35280:31117,
35281:31166,
35282:31292,
35283:31623,
35284:33457,
35285:33499,
35286:33540,
35287:33655,
35288:33775,
35289:33747,
35290:34662,
35291:35506,
35292:22057,
35293:36008,
35294:36838,
35295:36942,
35296:38686,
35297:34442,
35298:20420,
35299:23784,
35300:25105,
35301:29273,
35302:30011,
35303:33253,
35304:33469,
35305:34558,
35306:36032,
35307:38597,
35308:39187,
35309:39381,
35310:20171,
35311:20250,
35312:35299,
35313:22238,
35314:22602,
35315:22730,
35316:24315,
35317:24555,
35318:24618,
35319:24724,
35320:24674,
35321:25040,
35322:25106,
35323:25296,
35324:25913,
35392:39745,
35393:26214,
35394:26800,
35395:28023,
35396:28784,
35397:30028,
35398:30342,
35399:32117,
35400:33445,
35401:34809,
35402:38283,
35403:38542,
35404:35997,
35405:20977,
35406:21182,
35407:22806,
35408:21683,
35409:23475,
35410:23830,
35411:24936,
35412:27010,
35413:28079,
35414:30861,
35415:33995,
35416:34903,
35417:35442,
35418:37799,
35419:39608,
35420:28012,
35421:39336,
35422:34521,
35423:22435,
35424:26623,
35425:34510,
35426:37390,
35427:21123,
35428:22151,
35429:21508,
35430:24275,
35431:25313,
35432:25785,
35433:26684,
35434:26680,
35435:27579,
35436:29554,
35437:30906,
35438:31339,
35439:35226,
35440:35282,
35441:36203,
35442:36611,
35443:37101,
35444:38307,
35445:38548,
35446:38761,
35447:23398,
35448:23731,
35449:27005,
35450:38989,
35451:38990,
35452:25499,
35453:31520,
35454:27179,
35456:27263,
35457:26806,
35458:39949,
35459:28511,
35460:21106,
35461:21917,
35462:24688,
35463:25324,
35464:27963,
35465:28167,
35466:28369,
35467:33883,
35468:35088,
35469:36676,
35470:19988,
35471:39993,
35472:21494,
35473:26907,
35474:27194,
35475:38788,
35476:26666,
35477:20828,
35478:31427,
35479:33970,
35480:37340,
35481:37772,
35482:22107,
35483:40232,
35484:26658,
35485:33541,
35486:33841,
35487:31909,
35488:21000,
35489:33477,
35490:29926,
35491:20094,
35492:20355,
35493:20896,
35494:23506,
35495:21002,
35496:21208,
35497:21223,
35498:24059,
35499:21914,
35500:22570,
35501:23014,
35502:23436,
35503:23448,
35504:23515,
35505:24178,
35506:24185,
35507:24739,
35508:24863,
35509:24931,
35510:25022,
35511:25563,
35512:25954,
35513:26577,
35514:26707,
35515:26874,
35516:27454,
35517:27475,
35518:27735,
35519:28450,
35520:28567,
35521:28485,
35522:29872,
35523:29976,
35524:30435,
35525:30475,
35526:31487,
35527:31649,
35528:31777,
35529:32233,
35530:32566,
35531:32752,
35532:32925,
35533:33382,
35534:33694,
35535:35251,
35536:35532,
35537:36011,
35538:36996,
35539:37969,
35540:38291,
35541:38289,
35542:38306,
35543:38501,
35544:38867,
35545:39208,
35546:33304,
35547:20024,
35548:21547,
35549:23736,
35550:24012,
35551:29609,
35552:30284,
35553:30524,
35554:23721,
35555:32747,
35556:36107,
35557:38593,
35558:38929,
35559:38996,
35560:39000,
35561:20225,
35562:20238,
35563:21361,
35564:21916,
35565:22120,
35566:22522,
35567:22855,
35568:23305,
35569:23492,
35570:23696,
35571:24076,
35572:24190,
35573:24524,
35574:25582,
35575:26426,
35576:26071,
35577:26082,
35578:26399,
35579:26827,
35580:26820,
35648:27231,
35649:24112,
35650:27589,
35651:27671,
35652:27773,
35653:30079,
35654:31048,
35655:23395,
35656:31232,
35657:32000,
35658:24509,
35659:35215,
35660:35352,
35661:36020,
35662:36215,
35663:36556,
35664:36637,
35665:39138,
35666:39438,
35667:39740,
35668:20096,
35669:20605,
35670:20736,
35671:22931,
35672:23452,
35673:25135,
35674:25216,
35675:25836,
35676:27450,
35677:29344,
35678:30097,
35679:31047,
35680:32681,
35681:34811,
35682:35516,
35683:35696,
35684:25516,
35685:33738,
35686:38816,
35687:21513,
35688:21507,
35689:21931,
35690:26708,
35691:27224,
35692:35440,
35693:30759,
35694:26485,
35695:40653,
35696:21364,
35697:23458,
35698:33050,
35699:34384,
35700:36870,
35701:19992,
35702:20037,
35703:20167,
35704:20241,
35705:21450,
35706:21560,
35707:23470,
35708:24339,
35709:24613,
35710:25937,
35712:26429,
35713:27714,
35714:27762,
35715:27875,
35716:28792,
35717:29699,
35718:31350,
35719:31406,
35720:31496,
35721:32026,
35722:31998,
35723:32102,
35724:26087,
35725:29275,
35726:21435,
35727:23621,
35728:24040,
35729:25298,
35730:25312,
35731:25369,
35732:28192,
35733:34394,
35734:35377,
35735:36317,
35736:37624,
35737:28417,
35738:31142,
35739:39770,
35740:20136,
35741:20139,
35742:20140,
35743:20379,
35744:20384,
35745:20689,
35746:20807,
35747:31478,
35748:20849,
35749:20982,
35750:21332,
35751:21281,
35752:21375,
35753:21483,
35754:21932,
35755:22659,
35756:23777,
35757:24375,
35758:24394,
35759:24623,
35760:24656,
35761:24685,
35762:25375,
35763:25945,
35764:27211,
35765:27841,
35766:29378,
35767:29421,
35768:30703,
35769:33016,
35770:33029,
35771:33288,
35772:34126,
35773:37111,
35774:37857,
35775:38911,
35776:39255,
35777:39514,
35778:20208,
35779:20957,
35780:23597,
35781:26241,
35782:26989,
35783:23616,
35784:26354,
35785:26997,
35786:29577,
35787:26704,
35788:31873,
35789:20677,
35790:21220,
35791:22343,
35792:24062,
35793:37670,
35794:26020,
35795:27427,
35796:27453,
35797:29748,
35798:31105,
35799:31165,
35800:31563,
35801:32202,
35802:33465,
35803:33740,
35804:34943,
35805:35167,
35806:35641,
35807:36817,
35808:37329,
35809:21535,
35810:37504,
35811:20061,
35812:20534,
35813:21477,
35814:21306,
35815:29399,
35816:29590,
35817:30697,
35818:33510,
35819:36527,
35820:39366,
35821:39368,
35822:39378,
35823:20855,
35824:24858,
35825:34398,
35826:21936,
35827:31354,
35828:20598,
35829:23507,
35830:36935,
35831:38533,
35832:20018,
35833:27355,
35834:37351,
35835:23633,
35836:23624,
35904:25496,
35905:31391,
35906:27795,
35907:38772,
35908:36705,
35909:31402,
35910:29066,
35911:38536,
35912:31874,
35913:26647,
35914:32368,
35915:26705,
35916:37740,
35917:21234,
35918:21531,
35919:34219,
35920:35347,
35921:32676,
35922:36557,
35923:37089,
35924:21350,
35925:34952,
35926:31041,
35927:20418,
35928:20670,
35929:21009,
35930:20804,
35931:21843,
35932:22317,
35933:29674,
35934:22411,
35935:22865,
35936:24418,
35937:24452,
35938:24693,
35939:24950,
35940:24935,
35941:25001,
35942:25522,
35943:25658,
35944:25964,
35945:26223,
35946:26690,
35947:28179,
35948:30054,
35949:31293,
35950:31995,
35951:32076,
35952:32153,
35953:32331,
35954:32619,
35955:33550,
35956:33610,
35957:34509,
35958:35336,
35959:35427,
35960:35686,
35961:36605,
35962:38938,
35963:40335,
35964:33464,
35965:36814,
35966:39912,
35968:21127,
35969:25119,
35970:25731,
35971:28608,
35972:38553,
35973:26689,
35974:20625,
35975:27424,
35976:27770,
35977:28500,
35978:31348,
35979:32080,
35980:34880,
35981:35363,
35982:26376,
35983:20214,
35984:20537,
35985:20518,
35986:20581,
35987:20860,
35988:21048,
35989:21091,
35990:21927,
35991:22287,
35992:22533,
35993:23244,
35994:24314,
35995:25010,
35996:25080,
35997:25331,
35998:25458,
35999:26908,
36000:27177,
36001:29309,
36002:29356,
36003:29486,
36004:30740,
36005:30831,
36006:32121,
36007:30476,
36008:32937,
36009:35211,
36010:35609,
36011:36066,
36012:36562,
36013:36963,
36014:37749,
36015:38522,
36016:38997,
36017:39443,
36018:40568,
36019:20803,
36020:21407,
36021:21427,
36022:24187,
36023:24358,
36024:28187,
36025:28304,
36026:29572,
36027:29694,
36028:32067,
36029:33335,
36030:35328,
36031:35578,
36032:38480,
36033:20046,
36034:20491,
36035:21476,
36036:21628,
36037:22266,
36038:22993,
36039:23396,
36040:24049,
36041:24235,
36042:24359,
36043:25144,
36044:25925,
36045:26543,
36046:28246,
36047:29392,
36048:31946,
36049:34996,
36050:32929,
36051:32993,
36052:33776,
36053:34382,
36054:35463,
36055:36328,
36056:37431,
36057:38599,
36058:39015,
36059:40723,
36060:20116,
36061:20114,
36062:20237,
36063:21320,
36064:21577,
36065:21566,
36066:23087,
36067:24460,
36068:24481,
36069:24735,
36070:26791,
36071:27278,
36072:29786,
36073:30849,
36074:35486,
36075:35492,
36076:35703,
36077:37264,
36078:20062,
36079:39881,
36080:20132,
36081:20348,
36082:20399,
36083:20505,
36084:20502,
36085:20809,
36086:20844,
36087:21151,
36088:21177,
36089:21246,
36090:21402,
36091:21475,
36092:21521,
36160:21518,
36161:21897,
36162:22353,
36163:22434,
36164:22909,
36165:23380,
36166:23389,
36167:23439,
36168:24037,
36169:24039,
36170:24055,
36171:24184,
36172:24195,
36173:24218,
36174:24247,
36175:24344,
36176:24658,
36177:24908,
36178:25239,
36179:25304,
36180:25511,
36181:25915,
36182:26114,
36183:26179,
36184:26356,
36185:26477,
36186:26657,
36187:26775,
36188:27083,
36189:27743,
36190:27946,
36191:28009,
36192:28207,
36193:28317,
36194:30002,
36195:30343,
36196:30828,
36197:31295,
36198:31968,
36199:32005,
36200:32024,
36201:32094,
36202:32177,
36203:32789,
36204:32771,
36205:32943,
36206:32945,
36207:33108,
36208:33167,
36209:33322,
36210:33618,
36211:34892,
36212:34913,
36213:35611,
36214:36002,
36215:36092,
36216:37066,
36217:37237,
36218:37489,
36219:30783,
36220:37628,
36221:38308,
36222:38477,
36224:38917,
36225:39321,
36226:39640,
36227:40251,
36228:21083,
36229:21163,
36230:21495,
36231:21512,
36232:22741,
36233:25335,
36234:28640,
36235:35946,
36236:36703,
36237:40633,
36238:20811,
36239:21051,
36240:21578,
36241:22269,
36242:31296,
36243:37239,
36244:40288,
36245:40658,
36246:29508,
36247:28425,
36248:33136,
36249:29969,
36250:24573,
36251:24794,
36252:39592,
36253:29403,
36254:36796,
36255:27492,
36256:38915,
36257:20170,
36258:22256,
36259:22372,
36260:22718,
36261:23130,
36262:24680,
36263:25031,
36264:26127,
36265:26118,
36266:26681,
36267:26801,
36268:28151,
36269:30165,
36270:32058,
36271:33390,
36272:39746,
36273:20123,
36274:20304,
36275:21449,
36276:21766,
36277:23919,
36278:24038,
36279:24046,
36280:26619,
36281:27801,
36282:29811,
36283:30722,
36284:35408,
36285:37782,
36286:35039,
36287:22352,
36288:24231,
36289:25387,
36290:20661,
36291:20652,
36292:20877,
36293:26368,
36294:21705,
36295:22622,
36296:22971,
36297:23472,
36298:24425,
36299:25165,
36300:25505,
36301:26685,
36302:27507,
36303:28168,
36304:28797,
36305:37319,
36306:29312,
36307:30741,
36308:30758,
36309:31085,
36310:25998,
36311:32048,
36312:33756,
36313:35009,
36314:36617,
36315:38555,
36316:21092,
36317:22312,
36318:26448,
36319:32618,
36320:36001,
36321:20916,
36322:22338,
36323:38442,
36324:22586,
36325:27018,
36326:32948,
36327:21682,
36328:23822,
36329:22524,
36330:30869,
36331:40442,
36332:20316,
36333:21066,
36334:21643,
36335:25662,
36336:26152,
36337:26388,
36338:26613,
36339:31364,
36340:31574,
36341:32034,
36342:37679,
36343:26716,
36344:39853,
36345:31545,
36346:21273,
36347:20874,
36348:21047,
36416:23519,
36417:25334,
36418:25774,
36419:25830,
36420:26413,
36421:27578,
36422:34217,
36423:38609,
36424:30352,
36425:39894,
36426:25420,
36427:37638,
36428:39851,
36429:30399,
36430:26194,
36431:19977,
36432:20632,
36433:21442,
36434:23665,
36435:24808,
36436:25746,
36437:25955,
36438:26719,
36439:29158,
36440:29642,
36441:29987,
36442:31639,
36443:32386,
36444:34453,
36445:35715,
36446:36059,
36447:37240,
36448:39184,
36449:26028,
36450:26283,
36451:27531,
36452:20181,
36453:20180,
36454:20282,
36455:20351,
36456:21050,
36457:21496,
36458:21490,
36459:21987,
36460:22235,
36461:22763,
36462:22987,
36463:22985,
36464:23039,
36465:23376,
36466:23629,
36467:24066,
36468:24107,
36469:24535,
36470:24605,
36471:25351,
36472:25903,
36473:23388,
36474:26031,
36475:26045,
36476:26088,
36477:26525,
36478:27490,
36480:27515,
36481:27663,
36482:29509,
36483:31049,
36484:31169,
36485:31992,
36486:32025,
36487:32043,
36488:32930,
36489:33026,
36490:33267,
36491:35222,
36492:35422,
36493:35433,
36494:35430,
36495:35468,
36496:35566,
36497:36039,
36498:36060,
36499:38604,
36500:39164,
36501:27503,
36502:20107,
36503:20284,
36504:20365,
36505:20816,
36506:23383,
36507:23546,
36508:24904,
36509:25345,
36510:26178,
36511:27425,
36512:28363,
36513:27835,
36514:29246,
36515:29885,
36516:30164,
36517:30913,
36518:31034,
36519:32780,
36520:32819,
36521:33258,
36522:33940,
36523:36766,
36524:27728,
36525:40575,
36526:24335,
36527:35672,
36528:40235,
36529:31482,
36530:36600,
36531:23437,
36532:38635,
36533:19971,
36534:21489,
36535:22519,
36536:22833,
36537:23241,
36538:23460,
36539:24713,
36540:28287,
36541:28422,
36542:30142,
36543:36074,
36544:23455,
36545:34048,
36546:31712,
36547:20594,
36548:26612,
36549:33437,
36550:23649,
36551:34122,
36552:32286,
36553:33294,
36554:20889,
36555:23556,
36556:25448,
36557:36198,
36558:26012,
36559:29038,
36560:31038,
36561:32023,
36562:32773,
36563:35613,
36564:36554,
36565:36974,
36566:34503,
36567:37034,
36568:20511,
36569:21242,
36570:23610,
36571:26451,
36572:28796,
36573:29237,
36574:37196,
36575:37320,
36576:37675,
36577:33509,
36578:23490,
36579:24369,
36580:24825,
36581:20027,
36582:21462,
36583:23432,
36584:25163,
36585:26417,
36586:27530,
36587:29417,
36588:29664,
36589:31278,
36590:33131,
36591:36259,
36592:37202,
36593:39318,
36594:20754,
36595:21463,
36596:21610,
36597:23551,
36598:25480,
36599:27193,
36600:32172,
36601:38656,
36602:22234,
36603:21454,
36604:21608,
36672:23447,
36673:23601,
36674:24030,
36675:20462,
36676:24833,
36677:25342,
36678:27954,
36679:31168,
36680:31179,
36681:32066,
36682:32333,
36683:32722,
36684:33261,
36685:33311,
36686:33936,
36687:34886,
36688:35186,
36689:35728,
36690:36468,
36691:36655,
36692:36913,
36693:37195,
36694:37228,
36695:38598,
36696:37276,
36697:20160,
36698:20303,
36699:20805,
36700:21313,
36701:24467,
36702:25102,
36703:26580,
36704:27713,
36705:28171,
36706:29539,
36707:32294,
36708:37325,
36709:37507,
36710:21460,
36711:22809,
36712:23487,
36713:28113,
36714:31069,
36715:32302,
36716:31899,
36717:22654,
36718:29087,
36719:20986,
36720:34899,
36721:36848,
36722:20426,
36723:23803,
36724:26149,
36725:30636,
36726:31459,
36727:33308,
36728:39423,
36729:20934,
36730:24490,
36731:26092,
36732:26991,
36733:27529,
36734:28147,
36736:28310,
36737:28516,
36738:30462,
36739:32020,
36740:24033,
36741:36981,
36742:37255,
36743:38918,
36744:20966,
36745:21021,
36746:25152,
36747:26257,
36748:26329,
36749:28186,
36750:24246,
36751:32210,
36752:32626,
36753:26360,
36754:34223,
36755:34295,
36756:35576,
36757:21161,
36758:21465,
36759:22899,
36760:24207,
36761:24464,
36762:24661,
36763:37604,
36764:38500,
36765:20663,
36766:20767,
36767:21213,
36768:21280,
36769:21319,
36770:21484,
36771:21736,
36772:21830,
36773:21809,
36774:22039,
36775:22888,
36776:22974,
36777:23100,
36778:23477,
36779:23558,
36780:23567,
36781:23569,
36782:23578,
36783:24196,
36784:24202,
36785:24288,
36786:24432,
36787:25215,
36788:25220,
36789:25307,
36790:25484,
36791:25463,
36792:26119,
36793:26124,
36794:26157,
36795:26230,
36796:26494,
36797:26786,
36798:27167,
36799:27189,
36800:27836,
36801:28040,
36802:28169,
36803:28248,
36804:28988,
36805:28966,
36806:29031,
36807:30151,
36808:30465,
36809:30813,
36810:30977,
36811:31077,
36812:31216,
36813:31456,
36814:31505,
36815:31911,
36816:32057,
36817:32918,
36818:33750,
36819:33931,
36820:34121,
36821:34909,
36822:35059,
36823:35359,
36824:35388,
36825:35412,
36826:35443,
36827:35937,
36828:36062,
36829:37284,
36830:37478,
36831:37758,
36832:37912,
36833:38556,
36834:38808,
36835:19978,
36836:19976,
36837:19998,
36838:20055,
36839:20887,
36840:21104,
36841:22478,
36842:22580,
36843:22732,
36844:23330,
36845:24120,
36846:24773,
36847:25854,
36848:26465,
36849:26454,
36850:27972,
36851:29366,
36852:30067,
36853:31331,
36854:33976,
36855:35698,
36856:37304,
36857:37664,
36858:22065,
36859:22516,
36860:39166,
36928:25325,
36929:26893,
36930:27542,
36931:29165,
36932:32340,
36933:32887,
36934:33394,
36935:35302,
36936:39135,
36937:34645,
36938:36785,
36939:23611,
36940:20280,
36941:20449,
36942:20405,
36943:21767,
36944:23072,
36945:23517,
36946:23529,
36947:24515,
36948:24910,
36949:25391,
36950:26032,
36951:26187,
36952:26862,
36953:27035,
36954:28024,
36955:28145,
36956:30003,
36957:30137,
36958:30495,
36959:31070,
36960:31206,
36961:32051,
36962:33251,
36963:33455,
36964:34218,
36965:35242,
36966:35386,
36967:36523,
36968:36763,
36969:36914,
36970:37341,
36971:38663,
36972:20154,
36973:20161,
36974:20995,
36975:22645,
36976:22764,
36977:23563,
36978:29978,
36979:23613,
36980:33102,
36981:35338,
36982:36805,
36983:38499,
36984:38765,
36985:31525,
36986:35535,
36987:38920,
36988:37218,
36989:22259,
36990:21416,
36992:36887,
36993:21561,
36994:22402,
36995:24101,
36996:25512,
36997:27700,
36998:28810,
36999:30561,
37000:31883,
37001:32736,
37002:34928,
37003:36930,
37004:37204,
37005:37648,
37006:37656,
37007:38543,
37008:29790,
37009:39620,
37010:23815,
37011:23913,
37012:25968,
37013:26530,
37014:36264,
37015:38619,
37016:25454,
37017:26441,
37018:26905,
37019:33733,
37020:38935,
37021:38592,
37022:35070,
37023:28548,
37024:25722,
37025:23544,
37026:19990,
37027:28716,
37028:30045,
37029:26159,
37030:20932,
37031:21046,
37032:21218,
37033:22995,
37034:24449,
37035:24615,
37036:25104,
37037:25919,
37038:25972,
37039:26143,
37040:26228,
37041:26866,
37042:26646,
37043:27491,
37044:28165,
37045:29298,
37046:29983,
37047:30427,
37048:31934,
37049:32854,
37050:22768,
37051:35069,
37052:35199,
37053:35488,
37054:35475,
37055:35531,
37056:36893,
37057:37266,
37058:38738,
37059:38745,
37060:25993,
37061:31246,
37062:33030,
37063:38587,
37064:24109,
37065:24796,
37066:25114,
37067:26021,
37068:26132,
37069:26512,
37070:30707,
37071:31309,
37072:31821,
37073:32318,
37074:33034,
37075:36012,
37076:36196,
37077:36321,
37078:36447,
37079:30889,
37080:20999,
37081:25305,
37082:25509,
37083:25666,
37084:25240,
37085:35373,
37086:31363,
37087:31680,
37088:35500,
37089:38634,
37090:32118,
37091:33292,
37092:34633,
37093:20185,
37094:20808,
37095:21315,
37096:21344,
37097:23459,
37098:23554,
37099:23574,
37100:24029,
37101:25126,
37102:25159,
37103:25776,
37104:26643,
37105:26676,
37106:27849,
37107:27973,
37108:27927,
37109:26579,
37110:28508,
37111:29006,
37112:29053,
37113:26059,
37114:31359,
37115:31661,
37116:32218,
37184:32330,
37185:32680,
37186:33146,
37187:33307,
37188:33337,
37189:34214,
37190:35438,
37191:36046,
37192:36341,
37193:36984,
37194:36983,
37195:37549,
37196:37521,
37197:38275,
37198:39854,
37199:21069,
37200:21892,
37201:28472,
37202:28982,
37203:20840,
37204:31109,
37205:32341,
37206:33203,
37207:31950,
37208:22092,
37209:22609,
37210:23720,
37211:25514,
37212:26366,
37213:26365,
37214:26970,
37215:29401,
37216:30095,
37217:30094,
37218:30990,
37219:31062,
37220:31199,
37221:31895,
37222:32032,
37223:32068,
37224:34311,
37225:35380,
37226:38459,
37227:36961,
37228:40736,
37229:20711,
37230:21109,
37231:21452,
37232:21474,
37233:20489,
37234:21930,
37235:22766,
37236:22863,
37237:29245,
37238:23435,
37239:23652,
37240:21277,
37241:24803,
37242:24819,
37243:25436,
37244:25475,
37245:25407,
37246:25531,
37248:25805,
37249:26089,
37250:26361,
37251:24035,
37252:27085,
37253:27133,
37254:28437,
37255:29157,
37256:20105,
37257:30185,
37258:30456,
37259:31379,
37260:31967,
37261:32207,
37262:32156,
37263:32865,
37264:33609,
37265:33624,
37266:33900,
37267:33980,
37268:34299,
37269:35013,
37270:36208,
37271:36865,
37272:36973,
37273:37783,
37274:38684,
37275:39442,
37276:20687,
37277:22679,
37278:24974,
37279:33235,
37280:34101,
37281:36104,
37282:36896,
37283:20419,
37284:20596,
37285:21063,
37286:21363,
37287:24687,
37288:25417,
37289:26463,
37290:28204,
37291:36275,
37292:36895,
37293:20439,
37294:23646,
37295:36042,
37296:26063,
37297:32154,
37298:21330,
37299:34966,
37300:20854,
37301:25539,
37302:23384,
37303:23403,
37304:23562,
37305:25613,
37306:26449,
37307:36956,
37308:20182,
37309:22810,
37310:22826,
37311:27760,
37312:35409,
37313:21822,
37314:22549,
37315:22949,
37316:24816,
37317:25171,
37318:26561,
37319:33333,
37320:26965,
37321:38464,
37322:39364,
37323:39464,
37324:20307,
37325:22534,
37326:23550,
37327:32784,
37328:23729,
37329:24111,
37330:24453,
37331:24608,
37332:24907,
37333:25140,
37334:26367,
37335:27888,
37336:28382,
37337:32974,
37338:33151,
37339:33492,
37340:34955,
37341:36024,
37342:36864,
37343:36910,
37344:38538,
37345:40667,
37346:39899,
37347:20195,
37348:21488,
37349:22823,
37350:31532,
37351:37261,
37352:38988,
37353:40441,
37354:28381,
37355:28711,
37356:21331,
37357:21828,
37358:23429,
37359:25176,
37360:25246,
37361:25299,
37362:27810,
37363:28655,
37364:29730,
37365:35351,
37366:37944,
37367:28609,
37368:35582,
37369:33592,
37370:20967,
37371:34552,
37372:21482,
37440:21481,
37441:20294,
37442:36948,
37443:36784,
37444:22890,
37445:33073,
37446:24061,
37447:31466,
37448:36799,
37449:26842,
37450:35895,
37451:29432,
37452:40008,
37453:27197,
37454:35504,
37455:20025,
37456:21336,
37457:22022,
37458:22374,
37459:25285,
37460:25506,
37461:26086,
37462:27470,
37463:28129,
37464:28251,
37465:28845,
37466:30701,
37467:31471,
37468:31658,
37469:32187,
37470:32829,
37471:32966,
37472:34507,
37473:35477,
37474:37723,
37475:22243,
37476:22727,
37477:24382,
37478:26029,
37479:26262,
37480:27264,
37481:27573,
37482:30007,
37483:35527,
37484:20516,
37485:30693,
37486:22320,
37487:24347,
37488:24677,
37489:26234,
37490:27744,
37491:30196,
37492:31258,
37493:32622,
37494:33268,
37495:34584,
37496:36933,
37497:39347,
37498:31689,
37499:30044,
37500:31481,
37501:31569,
37502:33988,
37504:36880,
37505:31209,
37506:31378,
37507:33590,
37508:23265,
37509:30528,
37510:20013,
37511:20210,
37512:23449,
37513:24544,
37514:25277,
37515:26172,
37516:26609,
37517:27880,
37518:34411,
37519:34935,
37520:35387,
37521:37198,
37522:37619,
37523:39376,
37524:27159,
37525:28710,
37526:29482,
37527:33511,
37528:33879,
37529:36015,
37530:19969,
37531:20806,
37532:20939,
37533:21899,
37534:23541,
37535:24086,
37536:24115,
37537:24193,
37538:24340,
37539:24373,
37540:24427,
37541:24500,
37542:25074,
37543:25361,
37544:26274,
37545:26397,
37546:28526,
37547:29266,
37548:30010,
37549:30522,
37550:32884,
37551:33081,
37552:33144,
37553:34678,
37554:35519,
37555:35548,
37556:36229,
37557:36339,
37558:37530,
37559:38263,
37560:38914,
37561:40165,
37562:21189,
37563:25431,
37564:30452,
37565:26389,
37566:27784,
37567:29645,
37568:36035,
37569:37806,
37570:38515,
37571:27941,
37572:22684,
37573:26894,
37574:27084,
37575:36861,
37576:37786,
37577:30171,
37578:36890,
37579:22618,
37580:26626,
37581:25524,
37582:27131,
37583:20291,
37584:28460,
37585:26584,
37586:36795,
37587:34086,
37588:32180,
37589:37716,
37590:26943,
37591:28528,
37592:22378,
37593:22775,
37594:23340,
37595:32044,
37596:29226,
37597:21514,
37598:37347,
37599:40372,
37600:20141,
37601:20302,
37602:20572,
37603:20597,
37604:21059,
37605:35998,
37606:21576,
37607:22564,
37608:23450,
37609:24093,
37610:24213,
37611:24237,
37612:24311,
37613:24351,
37614:24716,
37615:25269,
37616:25402,
37617:25552,
37618:26799,
37619:27712,
37620:30855,
37621:31118,
37622:31243,
37623:32224,
37624:33351,
37625:35330,
37626:35558,
37627:36420,
37628:36883,
37696:37048,
37697:37165,
37698:37336,
37699:40718,
37700:27877,
37701:25688,
37702:25826,
37703:25973,
37704:28404,
37705:30340,
37706:31515,
37707:36969,
37708:37841,
37709:28346,
37710:21746,
37711:24505,
37712:25764,
37713:36685,
37714:36845,
37715:37444,
37716:20856,
37717:22635,
37718:22825,
37719:23637,
37720:24215,
37721:28155,
37722:32399,
37723:29980,
37724:36028,
37725:36578,
37726:39003,
37727:28857,
37728:20253,
37729:27583,
37730:28593,
37731:30000,
37732:38651,
37733:20814,
37734:21520,
37735:22581,
37736:22615,
37737:22956,
37738:23648,
37739:24466,
37740:26007,
37741:26460,
37742:28193,
37743:30331,
37744:33759,
37745:36077,
37746:36884,
37747:37117,
37748:37709,
37749:30757,
37750:30778,
37751:21162,
37752:24230,
37753:22303,
37754:22900,
37755:24594,
37756:20498,
37757:20826,
37758:20908,
37760:20941,
37761:20992,
37762:21776,
37763:22612,
37764:22616,
37765:22871,
37766:23445,
37767:23798,
37768:23947,
37769:24764,
37770:25237,
37771:25645,
37772:26481,
37773:26691,
37774:26812,
37775:26847,
37776:30423,
37777:28120,
37778:28271,
37779:28059,
37780:28783,
37781:29128,
37782:24403,
37783:30168,
37784:31095,
37785:31561,
37786:31572,
37787:31570,
37788:31958,
37789:32113,
37790:21040,
37791:33891,
37792:34153,
37793:34276,
37794:35342,
37795:35588,
37796:35910,
37797:36367,
37798:36867,
37799:36879,
37800:37913,
37801:38518,
37802:38957,
37803:39472,
37804:38360,
37805:20685,
37806:21205,
37807:21516,
37808:22530,
37809:23566,
37810:24999,
37811:25758,
37812:27934,
37813:30643,
37814:31461,
37815:33012,
37816:33796,
37817:36947,
37818:37509,
37819:23776,
37820:40199,
37821:21311,
37822:24471,
37823:24499,
37824:28060,
37825:29305,
37826:30563,
37827:31167,
37828:31716,
37829:27602,
37830:29420,
37831:35501,
37832:26627,
37833:27233,
37834:20984,
37835:31361,
37836:26932,
37837:23626,
37838:40182,
37839:33515,
37840:23493,
37841:37193,
37842:28702,
37843:22136,
37844:23663,
37845:24775,
37846:25958,
37847:27788,
37848:35930,
37849:36929,
37850:38931,
37851:21585,
37852:26311,
37853:37389,
37854:22856,
37855:37027,
37856:20869,
37857:20045,
37858:20970,
37859:34201,
37860:35598,
37861:28760,
37862:25466,
37863:37707,
37864:26978,
37865:39348,
37866:32260,
37867:30071,
37868:21335,
37869:26976,
37870:36575,
37871:38627,
37872:27741,
37873:20108,
37874:23612,
37875:24336,
37876:36841,
37877:21250,
37878:36049,
37879:32905,
37880:34425,
37881:24319,
37882:26085,
37883:20083,
37884:20837,
37952:22914,
37953:23615,
37954:38894,
37955:20219,
37956:22922,
37957:24525,
37958:35469,
37959:28641,
37960:31152,
37961:31074,
37962:23527,
37963:33905,
37964:29483,
37965:29105,
37966:24180,
37967:24565,
37968:25467,
37969:25754,
37970:29123,
37971:31896,
37972:20035,
37973:24316,
37974:20043,
37975:22492,
37976:22178,
37977:24745,
37978:28611,
37979:32013,
37980:33021,
37981:33075,
37982:33215,
37983:36786,
37984:35223,
37985:34468,
37986:24052,
37987:25226,
37988:25773,
37989:35207,
37990:26487,
37991:27874,
37992:27966,
37993:29750,
37994:30772,
37995:23110,
37996:32629,
37997:33453,
37998:39340,
37999:20467,
38000:24259,
38001:25309,
38002:25490,
38003:25943,
38004:26479,
38005:30403,
38006:29260,
38007:32972,
38008:32954,
38009:36649,
38010:37197,
38011:20493,
38012:22521,
38013:23186,
38014:26757,
38016:26995,
38017:29028,
38018:29437,
38019:36023,
38020:22770,
38021:36064,
38022:38506,
38023:36889,
38024:34687,
38025:31204,
38026:30695,
38027:33833,
38028:20271,
38029:21093,
38030:21338,
38031:25293,
38032:26575,
38033:27850,
38034:30333,
38035:31636,
38036:31893,
38037:33334,
38038:34180,
38039:36843,
38040:26333,
38041:28448,
38042:29190,
38043:32283,
38044:33707,
38045:39361,
38046:40614,
38047:20989,
38048:31665,
38049:30834,
38050:31672,
38051:32903,
38052:31560,
38053:27368,
38054:24161,
38055:32908,
38056:30033,
38057:30048,
38058:20843,
38059:37474,
38060:28300,
38061:30330,
38062:37271,
38063:39658,
38064:20240,
38065:32624,
38066:25244,
38067:31567,
38068:38309,
38069:40169,
38070:22138,
38071:22617,
38072:34532,
38073:38588,
38074:20276,
38075:21028,
38076:21322,
38077:21453,
38078:21467,
38079:24070,
38080:25644,
38081:26001,
38082:26495,
38083:27710,
38084:27726,
38085:29256,
38086:29359,
38087:29677,
38088:30036,
38089:32321,
38090:33324,
38091:34281,
38092:36009,
38093:31684,
38094:37318,
38095:29033,
38096:38930,
38097:39151,
38098:25405,
38099:26217,
38100:30058,
38101:30436,
38102:30928,
38103:34115,
38104:34542,
38105:21290,
38106:21329,
38107:21542,
38108:22915,
38109:24199,
38110:24444,
38111:24754,
38112:25161,
38113:25209,
38114:25259,
38115:26000,
38116:27604,
38117:27852,
38118:30130,
38119:30382,
38120:30865,
38121:31192,
38122:32203,
38123:32631,
38124:32933,
38125:34987,
38126:35513,
38127:36027,
38128:36991,
38129:38750,
38130:39131,
38131:27147,
38132:31800,
38133:20633,
38134:23614,
38135:24494,
38136:26503,
38137:27608,
38138:29749,
38139:30473,
38140:32654,
38208:40763,
38209:26570,
38210:31255,
38211:21305,
38212:30091,
38213:39661,
38214:24422,
38215:33181,
38216:33777,
38217:32920,
38218:24380,
38219:24517,
38220:30050,
38221:31558,
38222:36924,
38223:26727,
38224:23019,
38225:23195,
38226:32016,
38227:30334,
38228:35628,
38229:20469,
38230:24426,
38231:27161,
38232:27703,
38233:28418,
38234:29922,
38235:31080,
38236:34920,
38237:35413,
38238:35961,
38239:24287,
38240:25551,
38241:30149,
38242:31186,
38243:33495,
38244:37672,
38245:37618,
38246:33948,
38247:34541,
38248:39981,
38249:21697,
38250:24428,
38251:25996,
38252:27996,
38253:28693,
38254:36007,
38255:36051,
38256:38971,
38257:25935,
38258:29942,
38259:19981,
38260:20184,
38261:22496,
38262:22827,
38263:23142,
38264:23500,
38265:20904,
38266:24067,
38267:24220,
38268:24598,
38269:25206,
38270:25975,
38272:26023,
38273:26222,
38274:28014,
38275:29238,
38276:31526,
38277:33104,
38278:33178,
38279:33433,
38280:35676,
38281:36000,
38282:36070,
38283:36212,
38284:38428,
38285:38468,
38286:20398,
38287:25771,
38288:27494,
38289:33310,
38290:33889,
38291:34154,
38292:37096,
38293:23553,
38294:26963,
38295:39080,
38296:33914,
38297:34135,
38298:20239,
38299:21103,
38300:24489,
38301:24133,
38302:26381,
38303:31119,
38304:33145,
38305:35079,
38306:35206,
38307:28149,
38308:24343,
38309:25173,
38310:27832,
38311:20175,
38312:29289,
38313:39826,
38314:20998,
38315:21563,
38316:22132,
38317:22707,
38318:24996,
38319:25198,
38320:28954,
38321:22894,
38322:31881,
38323:31966,
38324:32027,
38325:38640,
38326:25991,
38327:32862,
38328:19993,
38329:20341,
38330:20853,
38331:22592,
38332:24163,
38333:24179,
38334:24330,
38335:26564,
38336:20006,
38337:34109,
38338:38281,
38339:38491,
38340:31859,
38341:38913,
38342:20731,
38343:22721,
38344:30294,
38345:30887,
38346:21029,
38347:30629,
38348:34065,
38349:31622,
38350:20559,
38351:22793,
38352:29255,
38353:31687,
38354:32232,
38355:36794,
38356:36820,
38357:36941,
38358:20415,
38359:21193,
38360:23081,
38361:24321,
38362:38829,
38363:20445,
38364:33303,
38365:37610,
38366:22275,
38367:25429,
38368:27497,
38369:29995,
38370:35036,
38371:36628,
38372:31298,
38373:21215,
38374:22675,
38375:24917,
38376:25098,
38377:26286,
38378:27597,
38379:31807,
38380:33769,
38381:20515,
38382:20472,
38383:21253,
38384:21574,
38385:22577,
38386:22857,
38387:23453,
38388:23792,
38389:23791,
38390:23849,
38391:24214,
38392:25265,
38393:25447,
38394:25918,
38395:26041,
38396:26379,
38464:27861,
38465:27873,
38466:28921,
38467:30770,
38468:32299,
38469:32990,
38470:33459,
38471:33804,
38472:34028,
38473:34562,
38474:35090,
38475:35370,
38476:35914,
38477:37030,
38478:37586,
38479:39165,
38480:40179,
38481:40300,
38482:20047,
38483:20129,
38484:20621,
38485:21078,
38486:22346,
38487:22952,
38488:24125,
38489:24536,
38490:24537,
38491:25151,
38492:26292,
38493:26395,
38494:26576,
38495:26834,
38496:20882,
38497:32033,
38498:32938,
38499:33192,
38500:35584,
38501:35980,
38502:36031,
38503:37502,
38504:38450,
38505:21536,
38506:38956,
38507:21271,
38508:20693,
38509:21340,
38510:22696,
38511:25778,
38512:26420,
38513:29287,
38514:30566,
38515:31302,
38516:37350,
38517:21187,
38518:27809,
38519:27526,
38520:22528,
38521:24140,
38522:22868,
38523:26412,
38524:32763,
38525:20961,
38526:30406,
38528:25705,
38529:30952,
38530:39764,
38531:40635,
38532:22475,
38533:22969,
38534:26151,
38535:26522,
38536:27598,
38537:21737,
38538:27097,
38539:24149,
38540:33180,
38541:26517,
38542:39850,
38543:26622,
38544:40018,
38545:26717,
38546:20134,
38547:20451,
38548:21448,
38549:25273,
38550:26411,
38551:27819,
38552:36804,
38553:20397,
38554:32365,
38555:40639,
38556:19975,
38557:24930,
38558:28288,
38559:28459,
38560:34067,
38561:21619,
38562:26410,
38563:39749,
38564:24051,
38565:31637,
38566:23724,
38567:23494,
38568:34588,
38569:28234,
38570:34001,
38571:31252,
38572:33032,
38573:22937,
38574:31885,
38575:27665,
38576:30496,
38577:21209,
38578:22818,
38579:28961,
38580:29279,
38581:30683,
38582:38695,
38583:40289,
38584:26891,
38585:23167,
38586:23064,
38587:20901,
38588:21517,
38589:21629,
38590:26126,
38591:30431,
38592:36855,
38593:37528,
38594:40180,
38595:23018,
38596:29277,
38597:28357,
38598:20813,
38599:26825,
38600:32191,
38601:32236,
38602:38754,
38603:40634,
38604:25720,
38605:27169,
38606:33538,
38607:22916,
38608:23391,
38609:27611,
38610:29467,
38611:30450,
38612:32178,
38613:32791,
38614:33945,
38615:20786,
38616:26408,
38617:40665,
38618:30446,
38619:26466,
38620:21247,
38621:39173,
38622:23588,
38623:25147,
38624:31870,
38625:36016,
38626:21839,
38627:24758,
38628:32011,
38629:38272,
38630:21249,
38631:20063,
38632:20918,
38633:22812,
38634:29242,
38635:32822,
38636:37326,
38637:24357,
38638:30690,
38639:21380,
38640:24441,
38641:32004,
38642:34220,
38643:35379,
38644:36493,
38645:38742,
38646:26611,
38647:34222,
38648:37971,
38649:24841,
38650:24840,
38651:27833,
38652:30290,
38720:35565,
38721:36664,
38722:21807,
38723:20305,
38724:20778,
38725:21191,
38726:21451,
38727:23461,
38728:24189,
38729:24736,
38730:24962,
38731:25558,
38732:26377,
38733:26586,
38734:28263,
38735:28044,
38736:29494,
38737:29495,
38738:30001,
38739:31056,
38740:35029,
38741:35480,
38742:36938,
38743:37009,
38744:37109,
38745:38596,
38746:34701,
38747:22805,
38748:20104,
38749:20313,
38750:19982,
38751:35465,
38752:36671,
38753:38928,
38754:20653,
38755:24188,
38756:22934,
38757:23481,
38758:24248,
38759:25562,
38760:25594,
38761:25793,
38762:26332,
38763:26954,
38764:27096,
38765:27915,
38766:28342,
38767:29076,
38768:29992,
38769:31407,
38770:32650,
38771:32768,
38772:33865,
38773:33993,
38774:35201,
38775:35617,
38776:36362,
38777:36965,
38778:38525,
38779:39178,
38780:24958,
38781:25233,
38782:27442,
38784:27779,
38785:28020,
38786:32716,
38787:32764,
38788:28096,
38789:32645,
38790:34746,
38791:35064,
38792:26469,
38793:33713,
38794:38972,
38795:38647,
38796:27931,
38797:32097,
38798:33853,
38799:37226,
38800:20081,
38801:21365,
38802:23888,
38803:27396,
38804:28651,
38805:34253,
38806:34349,
38807:35239,
38808:21033,
38809:21519,
38810:23653,
38811:26446,
38812:26792,
38813:29702,
38814:29827,
38815:30178,
38816:35023,
38817:35041,
38818:37324,
38819:38626,
38820:38520,
38821:24459,
38822:29575,
38823:31435,
38824:33870,
38825:25504,
38826:30053,
38827:21129,
38828:27969,
38829:28316,
38830:29705,
38831:30041,
38832:30827,
38833:31890,
38834:38534,
38835:31452,
38836:40845,
38837:20406,
38838:24942,
38839:26053,
38840:34396,
38841:20102,
38842:20142,
38843:20698,
38844:20001,
38845:20940,
38846:23534,
38847:26009,
38848:26753,
38849:28092,
38850:29471,
38851:30274,
38852:30637,
38853:31260,
38854:31975,
38855:33391,
38856:35538,
38857:36988,
38858:37327,
38859:38517,
38860:38936,
38861:21147,
38862:32209,
38863:20523,
38864:21400,
38865:26519,
38866:28107,
38867:29136,
38868:29747,
38869:33256,
38870:36650,
38871:38563,
38872:40023,
38873:40607,
38874:29792,
38875:22593,
38876:28057,
38877:32047,
38878:39006,
38879:20196,
38880:20278,
38881:20363,
38882:20919,
38883:21169,
38884:23994,
38885:24604,
38886:29618,
38887:31036,
38888:33491,
38889:37428,
38890:38583,
38891:38646,
38892:38666,
38893:40599,
38894:40802,
38895:26278,
38896:27508,
38897:21015,
38898:21155,
38899:28872,
38900:35010,
38901:24265,
38902:24651,
38903:24976,
38904:28451,
38905:29001,
38906:31806,
38907:32244,
38908:32879,
38976:34030,
38977:36899,
38978:37676,
38979:21570,
38980:39791,
38981:27347,
38982:28809,
38983:36034,
38984:36335,
38985:38706,
38986:21172,
38987:23105,
38988:24266,
38989:24324,
38990:26391,
38991:27004,
38992:27028,
38993:28010,
38994:28431,
38995:29282,
38996:29436,
38997:31725,
38998:32769,
38999:32894,
39000:34635,
39001:37070,
39002:20845,
39003:40595,
39004:31108,
39005:32907,
39006:37682,
39007:35542,
39008:20525,
39009:21644,
39010:35441,
39011:27498,
39012:36036,
39013:33031,
39014:24785,
39015:26528,
39016:40434,
39017:20121,
39018:20120,
39019:39952,
39020:35435,
39021:34241,
39022:34152,
39023:26880,
39024:28286,
39025:30871,
39026:33109,
39071:24332,
39072:19984,
39073:19989,
39074:20010,
39075:20017,
39076:20022,
39077:20028,
39078:20031,
39079:20034,
39080:20054,
39081:20056,
39082:20098,
39083:20101,
39084:35947,
39085:20106,
39086:33298,
39087:24333,
39088:20110,
39089:20126,
39090:20127,
39091:20128,
39092:20130,
39093:20144,
39094:20147,
39095:20150,
39096:20174,
39097:20173,
39098:20164,
39099:20166,
39100:20162,
39101:20183,
39102:20190,
39103:20205,
39104:20191,
39105:20215,
39106:20233,
39107:20314,
39108:20272,
39109:20315,
39110:20317,
39111:20311,
39112:20295,
39113:20342,
39114:20360,
39115:20367,
39116:20376,
39117:20347,
39118:20329,
39119:20336,
39120:20369,
39121:20335,
39122:20358,
39123:20374,
39124:20760,
39125:20436,
39126:20447,
39127:20430,
39128:20440,
39129:20443,
39130:20433,
39131:20442,
39132:20432,
39133:20452,
39134:20453,
39135:20506,
39136:20520,
39137:20500,
39138:20522,
39139:20517,
39140:20485,
39141:20252,
39142:20470,
39143:20513,
39144:20521,
39145:20524,
39146:20478,
39147:20463,
39148:20497,
39149:20486,
39150:20547,
39151:20551,
39152:26371,
39153:20565,
39154:20560,
39155:20552,
39156:20570,
39157:20566,
39158:20588,
39159:20600,
39160:20608,
39161:20634,
39162:20613,
39163:20660,
39164:20658,
39232:20681,
39233:20682,
39234:20659,
39235:20674,
39236:20694,
39237:20702,
39238:20709,
39239:20717,
39240:20707,
39241:20718,
39242:20729,
39243:20725,
39244:20745,
39245:20737,
39246:20738,
39247:20758,
39248:20757,
39249:20756,
39250:20762,
39251:20769,
39252:20794,
39253:20791,
39254:20796,
39255:20795,
39256:20799,
39257:20800,
39258:20818,
39259:20812,
39260:20820,
39261:20834,
39262:31480,
39263:20841,
39264:20842,
39265:20846,
39266:20864,
39267:20866,
39268:22232,
39269:20876,
39270:20873,
39271:20879,
39272:20881,
39273:20883,
39274:20885,
39275:20886,
39276:20900,
39277:20902,
39278:20898,
39279:20905,
39280:20906,
39281:20907,
39282:20915,
39283:20913,
39284:20914,
39285:20912,
39286:20917,
39287:20925,
39288:20933,
39289:20937,
39290:20955,
39291:20960,
39292:34389,
39293:20969,
39294:20973,
39296:20976,
39297:20981,
39298:20990,
39299:20996,
39300:21003,
39301:21012,
39302:21006,
39303:21031,
39304:21034,
39305:21038,
39306:21043,
39307:21049,
39308:21071,
39309:21060,
39310:21067,
39311:21068,
39312:21086,
39313:21076,
39314:21098,
39315:21108,
39316:21097,
39317:21107,
39318:21119,
39319:21117,
39320:21133,
39321:21140,
39322:21138,
39323:21105,
39324:21128,
39325:21137,
39326:36776,
39327:36775,
39328:21164,
39329:21165,
39330:21180,
39331:21173,
39332:21185,
39333:21197,
39334:21207,
39335:21214,
39336:21219,
39337:21222,
39338:39149,
39339:21216,
39340:21235,
39341:21237,
39342:21240,
39343:21241,
39344:21254,
39345:21256,
39346:30008,
39347:21261,
39348:21264,
39349:21263,
39350:21269,
39351:21274,
39352:21283,
39353:21295,
39354:21297,
39355:21299,
39356:21304,
39357:21312,
39358:21318,
39359:21317,
39360:19991,
39361:21321,
39362:21325,
39363:20950,
39364:21342,
39365:21353,
39366:21358,
39367:22808,
39368:21371,
39369:21367,
39370:21378,
39371:21398,
39372:21408,
39373:21414,
39374:21413,
39375:21422,
39376:21424,
39377:21430,
39378:21443,
39379:31762,
39380:38617,
39381:21471,
39382:26364,
39383:29166,
39384:21486,
39385:21480,
39386:21485,
39387:21498,
39388:21505,
39389:21565,
39390:21568,
39391:21548,
39392:21549,
39393:21564,
39394:21550,
39395:21558,
39396:21545,
39397:21533,
39398:21582,
39399:21647,
39400:21621,
39401:21646,
39402:21599,
39403:21617,
39404:21623,
39405:21616,
39406:21650,
39407:21627,
39408:21632,
39409:21622,
39410:21636,
39411:21648,
39412:21638,
39413:21703,
39414:21666,
39415:21688,
39416:21669,
39417:21676,
39418:21700,
39419:21704,
39420:21672,
39488:21675,
39489:21698,
39490:21668,
39491:21694,
39492:21692,
39493:21720,
39494:21733,
39495:21734,
39496:21775,
39497:21780,
39498:21757,
39499:21742,
39500:21741,
39501:21754,
39502:21730,
39503:21817,
39504:21824,
39505:21859,
39506:21836,
39507:21806,
39508:21852,
39509:21829,
39510:21846,
39511:21847,
39512:21816,
39513:21811,
39514:21853,
39515:21913,
39516:21888,
39517:21679,
39518:21898,
39519:21919,
39520:21883,
39521:21886,
39522:21912,
39523:21918,
39524:21934,
39525:21884,
39526:21891,
39527:21929,
39528:21895,
39529:21928,
39530:21978,
39531:21957,
39532:21983,
39533:21956,
39534:21980,
39535:21988,
39536:21972,
39537:22036,
39538:22007,
39539:22038,
39540:22014,
39541:22013,
39542:22043,
39543:22009,
39544:22094,
39545:22096,
39546:29151,
39547:22068,
39548:22070,
39549:22066,
39550:22072,
39552:22123,
39553:22116,
39554:22063,
39555:22124,
39556:22122,
39557:22150,
39558:22144,
39559:22154,
39560:22176,
39561:22164,
39562:22159,
39563:22181,
39564:22190,
39565:22198,
39566:22196,
39567:22210,
39568:22204,
39569:22209,
39570:22211,
39571:22208,
39572:22216,
39573:22222,
39574:22225,
39575:22227,
39576:22231,
39577:22254,
39578:22265,
39579:22272,
39580:22271,
39581:22276,
39582:22281,
39583:22280,
39584:22283,
39585:22285,
39586:22291,
39587:22296,
39588:22294,
39589:21959,
39590:22300,
39591:22310,
39592:22327,
39593:22328,
39594:22350,
39595:22331,
39596:22336,
39597:22351,
39598:22377,
39599:22464,
39600:22408,
39601:22369,
39602:22399,
39603:22409,
39604:22419,
39605:22432,
39606:22451,
39607:22436,
39608:22442,
39609:22448,
39610:22467,
39611:22470,
39612:22484,
39613:22482,
39614:22483,
39615:22538,
39616:22486,
39617:22499,
39618:22539,
39619:22553,
39620:22557,
39621:22642,
39622:22561,
39623:22626,
39624:22603,
39625:22640,
39626:27584,
39627:22610,
39628:22589,
39629:22649,
39630:22661,
39631:22713,
39632:22687,
39633:22699,
39634:22714,
39635:22750,
39636:22715,
39637:22712,
39638:22702,
39639:22725,
39640:22739,
39641:22737,
39642:22743,
39643:22745,
39644:22744,
39645:22757,
39646:22748,
39647:22756,
39648:22751,
39649:22767,
39650:22778,
39651:22777,
39652:22779,
39653:22780,
39654:22781,
39655:22786,
39656:22794,
39657:22800,
39658:22811,
39659:26790,
39660:22821,
39661:22828,
39662:22829,
39663:22834,
39664:22840,
39665:22846,
39666:31442,
39667:22869,
39668:22864,
39669:22862,
39670:22874,
39671:22872,
39672:22882,
39673:22880,
39674:22887,
39675:22892,
39676:22889,
39744:22904,
39745:22913,
39746:22941,
39747:20318,
39748:20395,
39749:22947,
39750:22962,
39751:22982,
39752:23016,
39753:23004,
39754:22925,
39755:23001,
39756:23002,
39757:23077,
39758:23071,
39759:23057,
39760:23068,
39761:23049,
39762:23066,
39763:23104,
39764:23148,
39765:23113,
39766:23093,
39767:23094,
39768:23138,
39769:23146,
39770:23194,
39771:23228,
39772:23230,
39773:23243,
39774:23234,
39775:23229,
39776:23267,
39777:23255,
39778:23270,
39779:23273,
39780:23254,
39781:23290,
39782:23291,
39783:23308,
39784:23307,
39785:23318,
39786:23346,
39787:23248,
39788:23338,
39789:23350,
39790:23358,
39791:23363,
39792:23365,
39793:23360,
39794:23377,
39795:23381,
39796:23386,
39797:23387,
39798:23397,
39799:23401,
39800:23408,
39801:23411,
39802:23413,
39803:23416,
39804:25992,
39805:23418,
39806:23424,
39808:23427,
39809:23462,
39810:23480,
39811:23491,
39812:23495,
39813:23497,
39814:23508,
39815:23504,
39816:23524,
39817:23526,
39818:23522,
39819:23518,
39820:23525,
39821:23531,
39822:23536,
39823:23542,
39824:23539,
39825:23557,
39826:23559,
39827:23560,
39828:23565,
39829:23571,
39830:23584,
39831:23586,
39832:23592,
39833:23608,
39834:23609,
39835:23617,
39836:23622,
39837:23630,
39838:23635,
39839:23632,
39840:23631,
39841:23409,
39842:23660,
39843:23662,
39844:20066,
39845:23670,
39846:23673,
39847:23692,
39848:23697,
39849:23700,
39850:22939,
39851:23723,
39852:23739,
39853:23734,
39854:23740,
39855:23735,
39856:23749,
39857:23742,
39858:23751,
39859:23769,
39860:23785,
39861:23805,
39862:23802,
39863:23789,
39864:23948,
39865:23786,
39866:23819,
39867:23829,
39868:23831,
39869:23900,
39870:23839,
39871:23835,
39872:23825,
39873:23828,
39874:23842,
39875:23834,
39876:23833,
39877:23832,
39878:23884,
39879:23890,
39880:23886,
39881:23883,
39882:23916,
39883:23923,
39884:23926,
39885:23943,
39886:23940,
39887:23938,
39888:23970,
39889:23965,
39890:23980,
39891:23982,
39892:23997,
39893:23952,
39894:23991,
39895:23996,
39896:24009,
39897:24013,
39898:24019,
39899:24018,
39900:24022,
39901:24027,
39902:24043,
39903:24050,
39904:24053,
39905:24075,
39906:24090,
39907:24089,
39908:24081,
39909:24091,
39910:24118,
39911:24119,
39912:24132,
39913:24131,
39914:24128,
39915:24142,
39916:24151,
39917:24148,
39918:24159,
39919:24162,
39920:24164,
39921:24135,
39922:24181,
39923:24182,
39924:24186,
39925:40636,
39926:24191,
39927:24224,
39928:24257,
39929:24258,
39930:24264,
39931:24272,
39932:24271,
40000:24278,
40001:24291,
40002:24285,
40003:24282,
40004:24283,
40005:24290,
40006:24289,
40007:24296,
40008:24297,
40009:24300,
40010:24305,
40011:24307,
40012:24304,
40013:24308,
40014:24312,
40015:24318,
40016:24323,
40017:24329,
40018:24413,
40019:24412,
40020:24331,
40021:24337,
40022:24342,
40023:24361,
40024:24365,
40025:24376,
40026:24385,
40027:24392,
40028:24396,
40029:24398,
40030:24367,
40031:24401,
40032:24406,
40033:24407,
40034:24409,
40035:24417,
40036:24429,
40037:24435,
40038:24439,
40039:24451,
40040:24450,
40041:24447,
40042:24458,
40043:24456,
40044:24465,
40045:24455,
40046:24478,
40047:24473,
40048:24472,
40049:24480,
40050:24488,
40051:24493,
40052:24508,
40053:24534,
40054:24571,
40055:24548,
40056:24568,
40057:24561,
40058:24541,
40059:24755,
40060:24575,
40061:24609,
40062:24672,
40064:24601,
40065:24592,
40066:24617,
40067:24590,
40068:24625,
40069:24603,
40070:24597,
40071:24619,
40072:24614,
40073:24591,
40074:24634,
40075:24666,
40076:24641,
40077:24682,
40078:24695,
40079:24671,
40080:24650,
40081:24646,
40082:24653,
40083:24675,
40084:24643,
40085:24676,
40086:24642,
40087:24684,
40088:24683,
40089:24665,
40090:24705,
40091:24717,
40092:24807,
40093:24707,
40094:24730,
40095:24708,
40096:24731,
40097:24726,
40098:24727,
40099:24722,
40100:24743,
40101:24715,
40102:24801,
40103:24760,
40104:24800,
40105:24787,
40106:24756,
40107:24560,
40108:24765,
40109:24774,
40110:24757,
40111:24792,
40112:24909,
40113:24853,
40114:24838,
40115:24822,
40116:24823,
40117:24832,
40118:24820,
40119:24826,
40120:24835,
40121:24865,
40122:24827,
40123:24817,
40124:24845,
40125:24846,
40126:24903,
40127:24894,
40128:24872,
40129:24871,
40130:24906,
40131:24895,
40132:24892,
40133:24876,
40134:24884,
40135:24893,
40136:24898,
40137:24900,
40138:24947,
40139:24951,
40140:24920,
40141:24921,
40142:24922,
40143:24939,
40144:24948,
40145:24943,
40146:24933,
40147:24945,
40148:24927,
40149:24925,
40150:24915,
40151:24949,
40152:24985,
40153:24982,
40154:24967,
40155:25004,
40156:24980,
40157:24986,
40158:24970,
40159:24977,
40160:25003,
40161:25006,
40162:25036,
40163:25034,
40164:25033,
40165:25079,
40166:25032,
40167:25027,
40168:25030,
40169:25018,
40170:25035,
40171:32633,
40172:25037,
40173:25062,
40174:25059,
40175:25078,
40176:25082,
40177:25076,
40178:25087,
40179:25085,
40180:25084,
40181:25086,
40182:25088,
40183:25096,
40184:25097,
40185:25101,
40186:25100,
40187:25108,
40188:25115,
40256:25118,
40257:25121,
40258:25130,
40259:25134,
40260:25136,
40261:25138,
40262:25139,
40263:25153,
40264:25166,
40265:25182,
40266:25187,
40267:25179,
40268:25184,
40269:25192,
40270:25212,
40271:25218,
40272:25225,
40273:25214,
40274:25234,
40275:25235,
40276:25238,
40277:25300,
40278:25219,
40279:25236,
40280:25303,
40281:25297,
40282:25275,
40283:25295,
40284:25343,
40285:25286,
40286:25812,
40287:25288,
40288:25308,
40289:25292,
40290:25290,
40291:25282,
40292:25287,
40293:25243,
40294:25289,
40295:25356,
40296:25326,
40297:25329,
40298:25383,
40299:25346,
40300:25352,
40301:25327,
40302:25333,
40303:25424,
40304:25406,
40305:25421,
40306:25628,
40307:25423,
40308:25494,
40309:25486,
40310:25472,
40311:25515,
40312:25462,
40313:25507,
40314:25487,
40315:25481,
40316:25503,
40317:25525,
40318:25451,
40320:25449,
40321:25534,
40322:25577,
40323:25536,
40324:25542,
40325:25571,
40326:25545,
40327:25554,
40328:25590,
40329:25540,
40330:25622,
40331:25652,
40332:25606,
40333:25619,
40334:25638,
40335:25654,
40336:25885,
40337:25623,
40338:25640,
40339:25615,
40340:25703,
40341:25711,
40342:25718,
40343:25678,
40344:25898,
40345:25749,
40346:25747,
40347:25765,
40348:25769,
40349:25736,
40350:25788,
40351:25818,
40352:25810,
40353:25797,
40354:25799,
40355:25787,
40356:25816,
40357:25794,
40358:25841,
40359:25831,
40360:33289,
40361:25824,
40362:25825,
40363:25260,
40364:25827,
40365:25839,
40366:25900,
40367:25846,
40368:25844,
40369:25842,
40370:25850,
40371:25856,
40372:25853,
40373:25880,
40374:25884,
40375:25861,
40376:25892,
40377:25891,
40378:25899,
40379:25908,
40380:25909,
40381:25911,
40382:25910,
40383:25912,
40384:30027,
40385:25928,
40386:25942,
40387:25941,
40388:25933,
40389:25944,
40390:25950,
40391:25949,
40392:25970,
40393:25976,
40394:25986,
40395:25987,
40396:35722,
40397:26011,
40398:26015,
40399:26027,
40400:26039,
40401:26051,
40402:26054,
40403:26049,
40404:26052,
40405:26060,
40406:26066,
40407:26075,
40408:26073,
40409:26080,
40410:26081,
40411:26097,
40412:26482,
40413:26122,
40414:26115,
40415:26107,
40416:26483,
40417:26165,
40418:26166,
40419:26164,
40420:26140,
40421:26191,
40422:26180,
40423:26185,
40424:26177,
40425:26206,
40426:26205,
40427:26212,
40428:26215,
40429:26216,
40430:26207,
40431:26210,
40432:26224,
40433:26243,
40434:26248,
40435:26254,
40436:26249,
40437:26244,
40438:26264,
40439:26269,
40440:26305,
40441:26297,
40442:26313,
40443:26302,
40444:26300,
40512:26308,
40513:26296,
40514:26326,
40515:26330,
40516:26336,
40517:26175,
40518:26342,
40519:26345,
40520:26352,
40521:26357,
40522:26359,
40523:26383,
40524:26390,
40525:26398,
40526:26406,
40527:26407,
40528:38712,
40529:26414,
40530:26431,
40531:26422,
40532:26433,
40533:26424,
40534:26423,
40535:26438,
40536:26462,
40537:26464,
40538:26457,
40539:26467,
40540:26468,
40541:26505,
40542:26480,
40543:26537,
40544:26492,
40545:26474,
40546:26508,
40547:26507,
40548:26534,
40549:26529,
40550:26501,
40551:26551,
40552:26607,
40553:26548,
40554:26604,
40555:26547,
40556:26601,
40557:26552,
40558:26596,
40559:26590,
40560:26589,
40561:26594,
40562:26606,
40563:26553,
40564:26574,
40565:26566,
40566:26599,
40567:27292,
40568:26654,
40569:26694,
40570:26665,
40571:26688,
40572:26701,
40573:26674,
40574:26702,
40576:26803,
40577:26667,
40578:26713,
40579:26723,
40580:26743,
40581:26751,
40582:26783,
40583:26767,
40584:26797,
40585:26772,
40586:26781,
40587:26779,
40588:26755,
40589:27310,
40590:26809,
40591:26740,
40592:26805,
40593:26784,
40594:26810,
40595:26895,
40596:26765,
40597:26750,
40598:26881,
40599:26826,
40600:26888,
40601:26840,
40602:26914,
40603:26918,
40604:26849,
40605:26892,
40606:26829,
40607:26836,
40608:26855,
40609:26837,
40610:26934,
40611:26898,
40612:26884,
40613:26839,
40614:26851,
40615:26917,
40616:26873,
40617:26848,
40618:26863,
40619:26920,
40620:26922,
40621:26906,
40622:26915,
40623:26913,
40624:26822,
40625:27001,
40626:26999,
40627:26972,
40628:27000,
40629:26987,
40630:26964,
40631:27006,
40632:26990,
40633:26937,
40634:26996,
40635:26941,
40636:26969,
40637:26928,
40638:26977,
40639:26974,
40640:26973,
40641:27009,
40642:26986,
40643:27058,
40644:27054,
40645:27088,
40646:27071,
40647:27073,
40648:27091,
40649:27070,
40650:27086,
40651:23528,
40652:27082,
40653:27101,
40654:27067,
40655:27075,
40656:27047,
40657:27182,
40658:27025,
40659:27040,
40660:27036,
40661:27029,
40662:27060,
40663:27102,
40664:27112,
40665:27138,
40666:27163,
40667:27135,
40668:27402,
40669:27129,
40670:27122,
40671:27111,
40672:27141,
40673:27057,
40674:27166,
40675:27117,
40676:27156,
40677:27115,
40678:27146,
40679:27154,
40680:27329,
40681:27171,
40682:27155,
40683:27204,
40684:27148,
40685:27250,
40686:27190,
40687:27256,
40688:27207,
40689:27234,
40690:27225,
40691:27238,
40692:27208,
40693:27192,
40694:27170,
40695:27280,
40696:27277,
40697:27296,
40698:27268,
40699:27298,
40700:27299,
40768:27287,
40769:34327,
40770:27323,
40771:27331,
40772:27330,
40773:27320,
40774:27315,
40775:27308,
40776:27358,
40777:27345,
40778:27359,
40779:27306,
40780:27354,
40781:27370,
40782:27387,
40783:27397,
40784:34326,
40785:27386,
40786:27410,
40787:27414,
40788:39729,
40789:27423,
40790:27448,
40791:27447,
40792:30428,
40793:27449,
40794:39150,
40795:27463,
40796:27459,
40797:27465,
40798:27472,
40799:27481,
40800:27476,
40801:27483,
40802:27487,
40803:27489,
40804:27512,
40805:27513,
40806:27519,
40807:27520,
40808:27524,
40809:27523,
40810:27533,
40811:27544,
40812:27541,
40813:27550,
40814:27556,
40815:27562,
40816:27563,
40817:27567,
40818:27570,
40819:27569,
40820:27571,
40821:27575,
40822:27580,
40823:27590,
40824:27595,
40825:27603,
40826:27615,
40827:27628,
40828:27627,
40829:27635,
40830:27631,
40832:40638,
40833:27656,
40834:27667,
40835:27668,
40836:27675,
40837:27684,
40838:27683,
40839:27742,
40840:27733,
40841:27746,
40842:27754,
40843:27778,
40844:27789,
40845:27802,
40846:27777,
40847:27803,
40848:27774,
40849:27752,
40850:27763,
40851:27794,
40852:27792,
40853:27844,
40854:27889,
40855:27859,
40856:27837,
40857:27863,
40858:27845,
40859:27869,
40860:27822,
40861:27825,
40862:27838,
40863:27834,
40864:27867,
40865:27887,
40866:27865,
40867:27882,
40868:27935,
40869:34893,
40870:27958,
40871:27947,
40872:27965,
40873:27960,
40874:27929,
40875:27957,
40876:27955,
40877:27922,
40878:27916,
40879:28003,
40880:28051,
40881:28004,
40882:27994,
40883:28025,
40884:27993,
40885:28046,
40886:28053,
40887:28644,
40888:28037,
40889:28153,
40890:28181,
40891:28170,
40892:28085,
40893:28103,
40894:28134,
40895:28088,
40896:28102,
40897:28140,
40898:28126,
40899:28108,
40900:28136,
40901:28114,
40902:28101,
40903:28154,
40904:28121,
40905:28132,
40906:28117,
40907:28138,
40908:28142,
40909:28205,
40910:28270,
40911:28206,
40912:28185,
40913:28274,
40914:28255,
40915:28222,
40916:28195,
40917:28267,
40918:28203,
40919:28278,
40920:28237,
40921:28191,
40922:28227,
40923:28218,
40924:28238,
40925:28196,
40926:28415,
40927:28189,
40928:28216,
40929:28290,
40930:28330,
40931:28312,
40932:28361,
40933:28343,
40934:28371,
40935:28349,
40936:28335,
40937:28356,
40938:28338,
40939:28372,
40940:28373,
40941:28303,
40942:28325,
40943:28354,
40944:28319,
40945:28481,
40946:28433,
40947:28748,
40948:28396,
40949:28408,
40950:28414,
40951:28479,
40952:28402,
40953:28465,
40954:28399,
40955:28466,
40956:28364,
57408:28478,
57409:28435,
57410:28407,
57411:28550,
57412:28538,
57413:28536,
57414:28545,
57415:28544,
57416:28527,
57417:28507,
57418:28659,
57419:28525,
57420:28546,
57421:28540,
57422:28504,
57423:28558,
57424:28561,
57425:28610,
57426:28518,
57427:28595,
57428:28579,
57429:28577,
57430:28580,
57431:28601,
57432:28614,
57433:28586,
57434:28639,
57435:28629,
57436:28652,
57437:28628,
57438:28632,
57439:28657,
57440:28654,
57441:28635,
57442:28681,
57443:28683,
57444:28666,
57445:28689,
57446:28673,
57447:28687,
57448:28670,
57449:28699,
57450:28698,
57451:28532,
57452:28701,
57453:28696,
57454:28703,
57455:28720,
57456:28734,
57457:28722,
57458:28753,
57459:28771,
57460:28825,
57461:28818,
57462:28847,
57463:28913,
57464:28844,
57465:28856,
57466:28851,
57467:28846,
57468:28895,
57469:28875,
57470:28893,
57472:28889,
57473:28937,
57474:28925,
57475:28956,
57476:28953,
57477:29029,
57478:29013,
57479:29064,
57480:29030,
57481:29026,
57482:29004,
57483:29014,
57484:29036,
57485:29071,
57486:29179,
57487:29060,
57488:29077,
57489:29096,
57490:29100,
57491:29143,
57492:29113,
57493:29118,
57494:29138,
57495:29129,
57496:29140,
57497:29134,
57498:29152,
57499:29164,
57500:29159,
57501:29173,
57502:29180,
57503:29177,
57504:29183,
57505:29197,
57506:29200,
57507:29211,
57508:29224,
57509:29229,
57510:29228,
57511:29232,
57512:29234,
57513:29243,
57514:29244,
57515:29247,
57516:29248,
57517:29254,
57518:29259,
57519:29272,
57520:29300,
57521:29310,
57522:29314,
57523:29313,
57524:29319,
57525:29330,
57526:29334,
57527:29346,
57528:29351,
57529:29369,
57530:29362,
57531:29379,
57532:29382,
57533:29380,
57534:29390,
57535:29394,
57536:29410,
57537:29408,
57538:29409,
57539:29433,
57540:29431,
57541:20495,
57542:29463,
57543:29450,
57544:29468,
57545:29462,
57546:29469,
57547:29492,
57548:29487,
57549:29481,
57550:29477,
57551:29502,
57552:29518,
57553:29519,
57554:40664,
57555:29527,
57556:29546,
57557:29544,
57558:29552,
57559:29560,
57560:29557,
57561:29563,
57562:29562,
57563:29640,
57564:29619,
57565:29646,
57566:29627,
57567:29632,
57568:29669,
57569:29678,
57570:29662,
57571:29858,
57572:29701,
57573:29807,
57574:29733,
57575:29688,
57576:29746,
57577:29754,
57578:29781,
57579:29759,
57580:29791,
57581:29785,
57582:29761,
57583:29788,
57584:29801,
57585:29808,
57586:29795,
57587:29802,
57588:29814,
57589:29822,
57590:29835,
57591:29854,
57592:29863,
57593:29898,
57594:29903,
57595:29908,
57596:29681,
57664:29920,
57665:29923,
57666:29927,
57667:29929,
57668:29934,
57669:29938,
57670:29936,
57671:29937,
57672:29944,
57673:29943,
57674:29956,
57675:29955,
57676:29957,
57677:29964,
57678:29966,
57679:29965,
57680:29973,
57681:29971,
57682:29982,
57683:29990,
57684:29996,
57685:30012,
57686:30020,
57687:30029,
57688:30026,
57689:30025,
57690:30043,
57691:30022,
57692:30042,
57693:30057,
57694:30052,
57695:30055,
57696:30059,
57697:30061,
57698:30072,
57699:30070,
57700:30086,
57701:30087,
57702:30068,
57703:30090,
57704:30089,
57705:30082,
57706:30100,
57707:30106,
57708:30109,
57709:30117,
57710:30115,
57711:30146,
57712:30131,
57713:30147,
57714:30133,
57715:30141,
57716:30136,
57717:30140,
57718:30129,
57719:30157,
57720:30154,
57721:30162,
57722:30169,
57723:30179,
57724:30174,
57725:30206,
57726:30207,
57728:30204,
57729:30209,
57730:30192,
57731:30202,
57732:30194,
57733:30195,
57734:30219,
57735:30221,
57736:30217,
57737:30239,
57738:30247,
57739:30240,
57740:30241,
57741:30242,
57742:30244,
57743:30260,
57744:30256,
57745:30267,
57746:30279,
57747:30280,
57748:30278,
57749:30300,
57750:30296,
57751:30305,
57752:30306,
57753:30312,
57754:30313,
57755:30314,
57756:30311,
57757:30316,
57758:30320,
57759:30322,
57760:30326,
57761:30328,
57762:30332,
57763:30336,
57764:30339,
57765:30344,
57766:30347,
57767:30350,
57768:30358,
57769:30355,
57770:30361,
57771:30362,
57772:30384,
57773:30388,
57774:30392,
57775:30393,
57776:30394,
57777:30402,
57778:30413,
57779:30422,
57780:30418,
57781:30430,
57782:30433,
57783:30437,
57784:30439,
57785:30442,
57786:34351,
57787:30459,
57788:30472,
57789:30471,
57790:30468,
57791:30505,
57792:30500,
57793:30494,
57794:30501,
57795:30502,
57796:30491,
57797:30519,
57798:30520,
57799:30535,
57800:30554,
57801:30568,
57802:30571,
57803:30555,
57804:30565,
57805:30591,
57806:30590,
57807:30585,
57808:30606,
57809:30603,
57810:30609,
57811:30624,
57812:30622,
57813:30640,
57814:30646,
57815:30649,
57816:30655,
57817:30652,
57818:30653,
57819:30651,
57820:30663,
57821:30669,
57822:30679,
57823:30682,
57824:30684,
57825:30691,
57826:30702,
57827:30716,
57828:30732,
57829:30738,
57830:31014,
57831:30752,
57832:31018,
57833:30789,
57834:30862,
57835:30836,
57836:30854,
57837:30844,
57838:30874,
57839:30860,
57840:30883,
57841:30901,
57842:30890,
57843:30895,
57844:30929,
57845:30918,
57846:30923,
57847:30932,
57848:30910,
57849:30908,
57850:30917,
57851:30922,
57852:30956,
57920:30951,
57921:30938,
57922:30973,
57923:30964,
57924:30983,
57925:30994,
57926:30993,
57927:31001,
57928:31020,
57929:31019,
57930:31040,
57931:31072,
57932:31063,
57933:31071,
57934:31066,
57935:31061,
57936:31059,
57937:31098,
57938:31103,
57939:31114,
57940:31133,
57941:31143,
57942:40779,
57943:31146,
57944:31150,
57945:31155,
57946:31161,
57947:31162,
57948:31177,
57949:31189,
57950:31207,
57951:31212,
57952:31201,
57953:31203,
57954:31240,
57955:31245,
57956:31256,
57957:31257,
57958:31264,
57959:31263,
57960:31104,
57961:31281,
57962:31291,
57963:31294,
57964:31287,
57965:31299,
57966:31319,
57967:31305,
57968:31329,
57969:31330,
57970:31337,
57971:40861,
57972:31344,
57973:31353,
57974:31357,
57975:31368,
57976:31383,
57977:31381,
57978:31384,
57979:31382,
57980:31401,
57981:31432,
57982:31408,
57984:31414,
57985:31429,
57986:31428,
57987:31423,
57988:36995,
57989:31431,
57990:31434,
57991:31437,
57992:31439,
57993:31445,
57994:31443,
57995:31449,
57996:31450,
57997:31453,
57998:31457,
57999:31458,
58000:31462,
58001:31469,
58002:31472,
58003:31490,
58004:31503,
58005:31498,
58006:31494,
58007:31539,
58008:31512,
58009:31513,
58010:31518,
58011:31541,
58012:31528,
58013:31542,
58014:31568,
58015:31610,
58016:31492,
58017:31565,
58018:31499,
58019:31564,
58020:31557,
58021:31605,
58022:31589,
58023:31604,
58024:31591,
58025:31600,
58026:31601,
58027:31596,
58028:31598,
58029:31645,
58030:31640,
58031:31647,
58032:31629,
58033:31644,
58034:31642,
58035:31627,
58036:31634,
58037:31631,
58038:31581,
58039:31641,
58040:31691,
58041:31681,
58042:31692,
58043:31695,
58044:31668,
58045:31686,
58046:31709,
58047:31721,
58048:31761,
58049:31764,
58050:31718,
58051:31717,
58052:31840,
58053:31744,
58054:31751,
58055:31763,
58056:31731,
58057:31735,
58058:31767,
58059:31757,
58060:31734,
58061:31779,
58062:31783,
58063:31786,
58064:31775,
58065:31799,
58066:31787,
58067:31805,
58068:31820,
58069:31811,
58070:31828,
58071:31823,
58072:31808,
58073:31824,
58074:31832,
58075:31839,
58076:31844,
58077:31830,
58078:31845,
58079:31852,
58080:31861,
58081:31875,
58082:31888,
58083:31908,
58084:31917,
58085:31906,
58086:31915,
58087:31905,
58088:31912,
58089:31923,
58090:31922,
58091:31921,
58092:31918,
58093:31929,
58094:31933,
58095:31936,
58096:31941,
58097:31938,
58098:31960,
58099:31954,
58100:31964,
58101:31970,
58102:39739,
58103:31983,
58104:31986,
58105:31988,
58106:31990,
58107:31994,
58108:32006,
58176:32002,
58177:32028,
58178:32021,
58179:32010,
58180:32069,
58181:32075,
58182:32046,
58183:32050,
58184:32063,
58185:32053,
58186:32070,
58187:32115,
58188:32086,
58189:32078,
58190:32114,
58191:32104,
58192:32110,
58193:32079,
58194:32099,
58195:32147,
58196:32137,
58197:32091,
58198:32143,
58199:32125,
58200:32155,
58201:32186,
58202:32174,
58203:32163,
58204:32181,
58205:32199,
58206:32189,
58207:32171,
58208:32317,
58209:32162,
58210:32175,
58211:32220,
58212:32184,
58213:32159,
58214:32176,
58215:32216,
58216:32221,
58217:32228,
58218:32222,
58219:32251,
58220:32242,
58221:32225,
58222:32261,
58223:32266,
58224:32291,
58225:32289,
58226:32274,
58227:32305,
58228:32287,
58229:32265,
58230:32267,
58231:32290,
58232:32326,
58233:32358,
58234:32315,
58235:32309,
58236:32313,
58237:32323,
58238:32311,
58240:32306,
58241:32314,
58242:32359,
58243:32349,
58244:32342,
58245:32350,
58246:32345,
58247:32346,
58248:32377,
58249:32362,
58250:32361,
58251:32380,
58252:32379,
58253:32387,
58254:32213,
58255:32381,
58256:36782,
58257:32383,
58258:32392,
58259:32393,
58260:32396,
58261:32402,
58262:32400,
58263:32403,
58264:32404,
58265:32406,
58266:32398,
58267:32411,
58268:32412,
58269:32568,
58270:32570,
58271:32581,
58272:32588,
58273:32589,
58274:32590,
58275:32592,
58276:32593,
58277:32597,
58278:32596,
58279:32600,
58280:32607,
58281:32608,
58282:32616,
58283:32617,
58284:32615,
58285:32632,
58286:32642,
58287:32646,
58288:32643,
58289:32648,
58290:32647,
58291:32652,
58292:32660,
58293:32670,
58294:32669,
58295:32666,
58296:32675,
58297:32687,
58298:32690,
58299:32697,
58300:32686,
58301:32694,
58302:32696,
58303:35697,
58304:32709,
58305:32710,
58306:32714,
58307:32725,
58308:32724,
58309:32737,
58310:32742,
58311:32745,
58312:32755,
58313:32761,
58314:39132,
58315:32774,
58316:32772,
58317:32779,
58318:32786,
58319:32792,
58320:32793,
58321:32796,
58322:32801,
58323:32808,
58324:32831,
58325:32827,
58326:32842,
58327:32838,
58328:32850,
58329:32856,
58330:32858,
58331:32863,
58332:32866,
58333:32872,
58334:32883,
58335:32882,
58336:32880,
58337:32886,
58338:32889,
58339:32893,
58340:32895,
58341:32900,
58342:32902,
58343:32901,
58344:32923,
58345:32915,
58346:32922,
58347:32941,
58348:20880,
58349:32940,
58350:32987,
58351:32997,
58352:32985,
58353:32989,
58354:32964,
58355:32986,
58356:32982,
58357:33033,
58358:33007,
58359:33009,
58360:33051,
58361:33065,
58362:33059,
58363:33071,
58364:33099,
58432:38539,
58433:33094,
58434:33086,
58435:33107,
58436:33105,
58437:33020,
58438:33137,
58439:33134,
58440:33125,
58441:33126,
58442:33140,
58443:33155,
58444:33160,
58445:33162,
58446:33152,
58447:33154,
58448:33184,
58449:33173,
58450:33188,
58451:33187,
58452:33119,
58453:33171,
58454:33193,
58455:33200,
58456:33205,
58457:33214,
58458:33208,
58459:33213,
58460:33216,
58461:33218,
58462:33210,
58463:33225,
58464:33229,
58465:33233,
58466:33241,
58467:33240,
58468:33224,
58469:33242,
58470:33247,
58471:33248,
58472:33255,
58473:33274,
58474:33275,
58475:33278,
58476:33281,
58477:33282,
58478:33285,
58479:33287,
58480:33290,
58481:33293,
58482:33296,
58483:33302,
58484:33321,
58485:33323,
58486:33336,
58487:33331,
58488:33344,
58489:33369,
58490:33368,
58491:33373,
58492:33370,
58493:33375,
58494:33380,
58496:33378,
58497:33384,
58498:33386,
58499:33387,
58500:33326,
58501:33393,
58502:33399,
58503:33400,
58504:33406,
58505:33421,
58506:33426,
58507:33451,
58508:33439,
58509:33467,
58510:33452,
58511:33505,
58512:33507,
58513:33503,
58514:33490,
58515:33524,
58516:33523,
58517:33530,
58518:33683,
58519:33539,
58520:33531,
58521:33529,
58522:33502,
58523:33542,
58524:33500,
58525:33545,
58526:33497,
58527:33589,
58528:33588,
58529:33558,
58530:33586,
58531:33585,
58532:33600,
58533:33593,
58534:33616,
58535:33605,
58536:33583,
58537:33579,
58538:33559,
58539:33560,
58540:33669,
58541:33690,
58542:33706,
58543:33695,
58544:33698,
58545:33686,
58546:33571,
58547:33678,
58548:33671,
58549:33674,
58550:33660,
58551:33717,
58552:33651,
58553:33653,
58554:33696,
58555:33673,
58556:33704,
58557:33780,
58558:33811,
58559:33771,
58560:33742,
58561:33789,
58562:33795,
58563:33752,
58564:33803,
58565:33729,
58566:33783,
58567:33799,
58568:33760,
58569:33778,
58570:33805,
58571:33826,
58572:33824,
58573:33725,
58574:33848,
58575:34054,
58576:33787,
58577:33901,
58578:33834,
58579:33852,
58580:34138,
58581:33924,
58582:33911,
58583:33899,
58584:33965,
58585:33902,
58586:33922,
58587:33897,
58588:33862,
58589:33836,
58590:33903,
58591:33913,
58592:33845,
58593:33994,
58594:33890,
58595:33977,
58596:33983,
58597:33951,
58598:34009,
58599:33997,
58600:33979,
58601:34010,
58602:34000,
58603:33985,
58604:33990,
58605:34006,
58606:33953,
58607:34081,
58608:34047,
58609:34036,
58610:34071,
58611:34072,
58612:34092,
58613:34079,
58614:34069,
58615:34068,
58616:34044,
58617:34112,
58618:34147,
58619:34136,
58620:34120,
58688:34113,
58689:34306,
58690:34123,
58691:34133,
58692:34176,
58693:34212,
58694:34184,
58695:34193,
58696:34186,
58697:34216,
58698:34157,
58699:34196,
58700:34203,
58701:34282,
58702:34183,
58703:34204,
58704:34167,
58705:34174,
58706:34192,
58707:34249,
58708:34234,
58709:34255,
58710:34233,
58711:34256,
58712:34261,
58713:34269,
58714:34277,
58715:34268,
58716:34297,
58717:34314,
58718:34323,
58719:34315,
58720:34302,
58721:34298,
58722:34310,
58723:34338,
58724:34330,
58725:34352,
58726:34367,
58727:34381,
58728:20053,
58729:34388,
58730:34399,
58731:34407,
58732:34417,
58733:34451,
58734:34467,
58735:34473,
58736:34474,
58737:34443,
58738:34444,
58739:34486,
58740:34479,
58741:34500,
58742:34502,
58743:34480,
58744:34505,
58745:34851,
58746:34475,
58747:34516,
58748:34526,
58749:34537,
58750:34540,
58752:34527,
58753:34523,
58754:34543,
58755:34578,
58756:34566,
58757:34568,
58758:34560,
58759:34563,
58760:34555,
58761:34577,
58762:34569,
58763:34573,
58764:34553,
58765:34570,
58766:34612,
58767:34623,
58768:34615,
58769:34619,
58770:34597,
58771:34601,
58772:34586,
58773:34656,
58774:34655,
58775:34680,
58776:34636,
58777:34638,
58778:34676,
58779:34647,
58780:34664,
58781:34670,
58782:34649,
58783:34643,
58784:34659,
58785:34666,
58786:34821,
58787:34722,
58788:34719,
58789:34690,
58790:34735,
58791:34763,
58792:34749,
58793:34752,
58794:34768,
58795:38614,
58796:34731,
58797:34756,
58798:34739,
58799:34759,
58800:34758,
58801:34747,
58802:34799,
58803:34802,
58804:34784,
58805:34831,
58806:34829,
58807:34814,
58808:34806,
58809:34807,
58810:34830,
58811:34770,
58812:34833,
58813:34838,
58814:34837,
58815:34850,
58816:34849,
58817:34865,
58818:34870,
58819:34873,
58820:34855,
58821:34875,
58822:34884,
58823:34882,
58824:34898,
58825:34905,
58826:34910,
58827:34914,
58828:34923,
58829:34945,
58830:34942,
58831:34974,
58832:34933,
58833:34941,
58834:34997,
58835:34930,
58836:34946,
58837:34967,
58838:34962,
58839:34990,
58840:34969,
58841:34978,
58842:34957,
58843:34980,
58844:34992,
58845:35007,
58846:34993,
58847:35011,
58848:35012,
58849:35028,
58850:35032,
58851:35033,
58852:35037,
58853:35065,
58854:35074,
58855:35068,
58856:35060,
58857:35048,
58858:35058,
58859:35076,
58860:35084,
58861:35082,
58862:35091,
58863:35139,
58864:35102,
58865:35109,
58866:35114,
58867:35115,
58868:35137,
58869:35140,
58870:35131,
58871:35126,
58872:35128,
58873:35148,
58874:35101,
58875:35168,
58876:35166,
58944:35174,
58945:35172,
58946:35181,
58947:35178,
58948:35183,
58949:35188,
58950:35191,
58951:35198,
58952:35203,
58953:35208,
58954:35210,
58955:35219,
58956:35224,
58957:35233,
58958:35241,
58959:35238,
58960:35244,
58961:35247,
58962:35250,
58963:35258,
58964:35261,
58965:35263,
58966:35264,
58967:35290,
58968:35292,
58969:35293,
58970:35303,
58971:35316,
58972:35320,
58973:35331,
58974:35350,
58975:35344,
58976:35340,
58977:35355,
58978:35357,
58979:35365,
58980:35382,
58981:35393,
58982:35419,
58983:35410,
58984:35398,
58985:35400,
58986:35452,
58987:35437,
58988:35436,
58989:35426,
58990:35461,
58991:35458,
58992:35460,
58993:35496,
58994:35489,
58995:35473,
58996:35493,
58997:35494,
58998:35482,
58999:35491,
59000:35524,
59001:35533,
59002:35522,
59003:35546,
59004:35563,
59005:35571,
59006:35559,
59008:35556,
59009:35569,
59010:35604,
59011:35552,
59012:35554,
59013:35575,
59014:35550,
59015:35547,
59016:35596,
59017:35591,
59018:35610,
59019:35553,
59020:35606,
59021:35600,
59022:35607,
59023:35616,
59024:35635,
59025:38827,
59026:35622,
59027:35627,
59028:35646,
59029:35624,
59030:35649,
59031:35660,
59032:35663,
59033:35662,
59034:35657,
59035:35670,
59036:35675,
59037:35674,
59038:35691,
59039:35679,
59040:35692,
59041:35695,
59042:35700,
59043:35709,
59044:35712,
59045:35724,
59046:35726,
59047:35730,
59048:35731,
59049:35734,
59050:35737,
59051:35738,
59052:35898,
59053:35905,
59054:35903,
59055:35912,
59056:35916,
59057:35918,
59058:35920,
59059:35925,
59060:35938,
59061:35948,
59062:35960,
59063:35962,
59064:35970,
59065:35977,
59066:35973,
59067:35978,
59068:35981,
59069:35982,
59070:35988,
59071:35964,
59072:35992,
59073:25117,
59074:36013,
59075:36010,
59076:36029,
59077:36018,
59078:36019,
59079:36014,
59080:36022,
59081:36040,
59082:36033,
59083:36068,
59084:36067,
59085:36058,
59086:36093,
59087:36090,
59088:36091,
59089:36100,
59090:36101,
59091:36106,
59092:36103,
59093:36111,
59094:36109,
59095:36112,
59096:40782,
59097:36115,
59098:36045,
59099:36116,
59100:36118,
59101:36199,
59102:36205,
59103:36209,
59104:36211,
59105:36225,
59106:36249,
59107:36290,
59108:36286,
59109:36282,
59110:36303,
59111:36314,
59112:36310,
59113:36300,
59114:36315,
59115:36299,
59116:36330,
59117:36331,
59118:36319,
59119:36323,
59120:36348,
59121:36360,
59122:36361,
59123:36351,
59124:36381,
59125:36382,
59126:36368,
59127:36383,
59128:36418,
59129:36405,
59130:36400,
59131:36404,
59132:36426,
59200:36423,
59201:36425,
59202:36428,
59203:36432,
59204:36424,
59205:36441,
59206:36452,
59207:36448,
59208:36394,
59209:36451,
59210:36437,
59211:36470,
59212:36466,
59213:36476,
59214:36481,
59215:36487,
59216:36485,
59217:36484,
59218:36491,
59219:36490,
59220:36499,
59221:36497,
59222:36500,
59223:36505,
59224:36522,
59225:36513,
59226:36524,
59227:36528,
59228:36550,
59229:36529,
59230:36542,
59231:36549,
59232:36552,
59233:36555,
59234:36571,
59235:36579,
59236:36604,
59237:36603,
59238:36587,
59239:36606,
59240:36618,
59241:36613,
59242:36629,
59243:36626,
59244:36633,
59245:36627,
59246:36636,
59247:36639,
59248:36635,
59249:36620,
59250:36646,
59251:36659,
59252:36667,
59253:36665,
59254:36677,
59255:36674,
59256:36670,
59257:36684,
59258:36681,
59259:36678,
59260:36686,
59261:36695,
59262:36700,
59264:36706,
59265:36707,
59266:36708,
59267:36764,
59268:36767,
59269:36771,
59270:36781,
59271:36783,
59272:36791,
59273:36826,
59274:36837,
59275:36834,
59276:36842,
59277:36847,
59278:36999,
59279:36852,
59280:36869,
59281:36857,
59282:36858,
59283:36881,
59284:36885,
59285:36897,
59286:36877,
59287:36894,
59288:36886,
59289:36875,
59290:36903,
59291:36918,
59292:36917,
59293:36921,
59294:36856,
59295:36943,
59296:36944,
59297:36945,
59298:36946,
59299:36878,
59300:36937,
59301:36926,
59302:36950,
59303:36952,
59304:36958,
59305:36968,
59306:36975,
59307:36982,
59308:38568,
59309:36978,
59310:36994,
59311:36989,
59312:36993,
59313:36992,
59314:37002,
59315:37001,
59316:37007,
59317:37032,
59318:37039,
59319:37041,
59320:37045,
59321:37090,
59322:37092,
59323:25160,
59324:37083,
59325:37122,
59326:37138,
59327:37145,
59328:37170,
59329:37168,
59330:37194,
59331:37206,
59332:37208,
59333:37219,
59334:37221,
59335:37225,
59336:37235,
59337:37234,
59338:37259,
59339:37257,
59340:37250,
59341:37282,
59342:37291,
59343:37295,
59344:37290,
59345:37301,
59346:37300,
59347:37306,
59348:37312,
59349:37313,
59350:37321,
59351:37323,
59352:37328,
59353:37334,
59354:37343,
59355:37345,
59356:37339,
59357:37372,
59358:37365,
59359:37366,
59360:37406,
59361:37375,
59362:37396,
59363:37420,
59364:37397,
59365:37393,
59366:37470,
59367:37463,
59368:37445,
59369:37449,
59370:37476,
59371:37448,
59372:37525,
59373:37439,
59374:37451,
59375:37456,
59376:37532,
59377:37526,
59378:37523,
59379:37531,
59380:37466,
59381:37583,
59382:37561,
59383:37559,
59384:37609,
59385:37647,
59386:37626,
59387:37700,
59388:37678,
59456:37657,
59457:37666,
59458:37658,
59459:37667,
59460:37690,
59461:37685,
59462:37691,
59463:37724,
59464:37728,
59465:37756,
59466:37742,
59467:37718,
59468:37808,
59469:37804,
59470:37805,
59471:37780,
59472:37817,
59473:37846,
59474:37847,
59475:37864,
59476:37861,
59477:37848,
59478:37827,
59479:37853,
59480:37840,
59481:37832,
59482:37860,
59483:37914,
59484:37908,
59485:37907,
59486:37891,
59487:37895,
59488:37904,
59489:37942,
59490:37931,
59491:37941,
59492:37921,
59493:37946,
59494:37953,
59495:37970,
59496:37956,
59497:37979,
59498:37984,
59499:37986,
59500:37982,
59501:37994,
59502:37417,
59503:38000,
59504:38005,
59505:38007,
59506:38013,
59507:37978,
59508:38012,
59509:38014,
59510:38017,
59511:38015,
59512:38274,
59513:38279,
59514:38282,
59515:38292,
59516:38294,
59517:38296,
59518:38297,
59520:38304,
59521:38312,
59522:38311,
59523:38317,
59524:38332,
59525:38331,
59526:38329,
59527:38334,
59528:38346,
59529:28662,
59530:38339,
59531:38349,
59532:38348,
59533:38357,
59534:38356,
59535:38358,
59536:38364,
59537:38369,
59538:38373,
59539:38370,
59540:38433,
59541:38440,
59542:38446,
59543:38447,
59544:38466,
59545:38476,
59546:38479,
59547:38475,
59548:38519,
59549:38492,
59550:38494,
59551:38493,
59552:38495,
59553:38502,
59554:38514,
59555:38508,
59556:38541,
59557:38552,
59558:38549,
59559:38551,
59560:38570,
59561:38567,
59562:38577,
59563:38578,
59564:38576,
59565:38580,
59566:38582,
59567:38584,
59568:38585,
59569:38606,
59570:38603,
59571:38601,
59572:38605,
59573:35149,
59574:38620,
59575:38669,
59576:38613,
59577:38649,
59578:38660,
59579:38662,
59580:38664,
59581:38675,
59582:38670,
59583:38673,
59584:38671,
59585:38678,
59586:38681,
59587:38692,
59588:38698,
59589:38704,
59590:38713,
59591:38717,
59592:38718,
59593:38724,
59594:38726,
59595:38728,
59596:38722,
59597:38729,
59598:38748,
59599:38752,
59600:38756,
59601:38758,
59602:38760,
59603:21202,
59604:38763,
59605:38769,
59606:38777,
59607:38789,
59608:38780,
59609:38785,
59610:38778,
59611:38790,
59612:38795,
59613:38799,
59614:38800,
59615:38812,
59616:38824,
59617:38822,
59618:38819,
59619:38835,
59620:38836,
59621:38851,
59622:38854,
59623:38856,
59624:38859,
59625:38876,
59626:38893,
59627:40783,
59628:38898,
59629:31455,
59630:38902,
59631:38901,
59632:38927,
59633:38924,
59634:38968,
59635:38948,
59636:38945,
59637:38967,
59638:38973,
59639:38982,
59640:38991,
59641:38987,
59642:39019,
59643:39023,
59644:39024,
59712:39025,
59713:39028,
59714:39027,
59715:39082,
59716:39087,
59717:39089,
59718:39094,
59719:39108,
59720:39107,
59721:39110,
59722:39145,
59723:39147,
59724:39171,
59725:39177,
59726:39186,
59727:39188,
59728:39192,
59729:39201,
59730:39197,
59731:39198,
59732:39204,
59733:39200,
59734:39212,
59735:39214,
59736:39229,
59737:39230,
59738:39234,
59739:39241,
59740:39237,
59741:39248,
59742:39243,
59743:39249,
59744:39250,
59745:39244,
59746:39253,
59747:39319,
59748:39320,
59749:39333,
59750:39341,
59751:39342,
59752:39356,
59753:39391,
59754:39387,
59755:39389,
59756:39384,
59757:39377,
59758:39405,
59759:39406,
59760:39409,
59761:39410,
59762:39419,
59763:39416,
59764:39425,
59765:39439,
59766:39429,
59767:39394,
59768:39449,
59769:39467,
59770:39479,
59771:39493,
59772:39490,
59773:39488,
59774:39491,
59776:39486,
59777:39509,
59778:39501,
59779:39515,
59780:39511,
59781:39519,
59782:39522,
59783:39525,
59784:39524,
59785:39529,
59786:39531,
59787:39530,
59788:39597,
59789:39600,
59790:39612,
59791:39616,
59792:39631,
59793:39633,
59794:39635,
59795:39636,
59796:39646,
59797:39647,
59798:39650,
59799:39651,
59800:39654,
59801:39663,
59802:39659,
59803:39662,
59804:39668,
59805:39665,
59806:39671,
59807:39675,
59808:39686,
59809:39704,
59810:39706,
59811:39711,
59812:39714,
59813:39715,
59814:39717,
59815:39719,
59816:39720,
59817:39721,
59818:39722,
59819:39726,
59820:39727,
59821:39730,
59822:39748,
59823:39747,
59824:39759,
59825:39757,
59826:39758,
59827:39761,
59828:39768,
59829:39796,
59830:39827,
59831:39811,
59832:39825,
59833:39830,
59834:39831,
59835:39839,
59836:39840,
59837:39848,
59838:39860,
59839:39872,
59840:39882,
59841:39865,
59842:39878,
59843:39887,
59844:39889,
59845:39890,
59846:39907,
59847:39906,
59848:39908,
59849:39892,
59850:39905,
59851:39994,
59852:39922,
59853:39921,
59854:39920,
59855:39957,
59856:39956,
59857:39945,
59858:39955,
59859:39948,
59860:39942,
59861:39944,
59862:39954,
59863:39946,
59864:39940,
59865:39982,
59866:39963,
59867:39973,
59868:39972,
59869:39969,
59870:39984,
59871:40007,
59872:39986,
59873:40006,
59874:39998,
59875:40026,
59876:40032,
59877:40039,
59878:40054,
59879:40056,
59880:40167,
59881:40172,
59882:40176,
59883:40201,
59884:40200,
59885:40171,
59886:40195,
59887:40198,
59888:40234,
59889:40230,
59890:40367,
59891:40227,
59892:40223,
59893:40260,
59894:40213,
59895:40210,
59896:40257,
59897:40255,
59898:40254,
59899:40262,
59900:40264,
59968:40285,
59969:40286,
59970:40292,
59971:40273,
59972:40272,
59973:40281,
59974:40306,
59975:40329,
59976:40327,
59977:40363,
59978:40303,
59979:40314,
59980:40346,
59981:40356,
59982:40361,
59983:40370,
59984:40388,
59985:40385,
59986:40379,
59987:40376,
59988:40378,
59989:40390,
59990:40399,
59991:40386,
59992:40409,
59993:40403,
59994:40440,
59995:40422,
59996:40429,
59997:40431,
59998:40445,
59999:40474,
60000:40475,
60001:40478,
60002:40565,
60003:40569,
60004:40573,
60005:40577,
60006:40584,
60007:40587,
60008:40588,
60009:40594,
60010:40597,
60011:40593,
60012:40605,
60013:40613,
60014:40617,
60015:40632,
60016:40618,
60017:40621,
60018:38753,
60019:40652,
60020:40654,
60021:40655,
60022:40656,
60023:40660,
60024:40668,
60025:40670,
60026:40669,
60027:40672,
60028:40677,
60029:40680,
60030:40687,
60032:40692,
60033:40694,
60034:40695,
60035:40697,
60036:40699,
60037:40700,
60038:40701,
60039:40711,
60040:40712,
60041:30391,
60042:40725,
60043:40737,
60044:40748,
60045:40766,
60046:40778,
60047:40786,
60048:40788,
60049:40803,
60050:40799,
60051:40800,
60052:40801,
60053:40806,
60054:40807,
60055:40812,
60056:40810,
60057:40823,
60058:40818,
60059:40822,
60060:40853,
60061:40860,
60062:40864,
60063:22575,
60064:27079,
60065:36953,
60066:29796,
60067:20956,
60068:29081,
60736:32394,
60737:35100,
60738:37704,
60739:37512,
60740:34012,
60741:20425,
60742:28859,
60743:26161,
60744:26824,
60745:37625,
60746:26363,
60747:24389,
60748:20008,
60749:20193,
60750:20220,
60751:20224,
60752:20227,
60753:20281,
60754:20310,
60755:20370,
60756:20362,
60757:20378,
60758:20372,
60759:20429,
60760:20544,
60761:20514,
60762:20479,
60763:20510,
60764:20550,
60765:20592,
60766:20546,
60767:20628,
60768:20724,
60769:20696,
60770:20810,
60771:20836,
60772:20893,
60773:20926,
60774:20972,
60775:21013,
60776:21148,
60777:21158,
60778:21184,
60779:21211,
60780:21248,
60781:21255,
60782:21284,
60783:21362,
60784:21395,
60785:21426,
60786:21469,
60787:64014,
60788:21660,
60789:21642,
60790:21673,
60791:21759,
60792:21894,
60793:22361,
60794:22373,
60795:22444,
60796:22472,
60797:22471,
60798:64015,
60800:64016,
60801:22686,
60802:22706,
60803:22795,
60804:22867,
60805:22875,
60806:22877,
60807:22883,
60808:22948,
60809:22970,
60810:23382,
60811:23488,
60812:29999,
60813:23512,
60814:23532,
60815:23582,
60816:23718,
60817:23738,
60818:23797,
60819:23847,
60820:23891,
60821:64017,
60822:23874,
60823:23917,
60824:23992,
60825:23993,
60826:24016,
60827:24353,
60828:24372,
60829:24423,
60830:24503,
60831:24542,
60832:24669,
60833:24709,
60834:24714,
60835:24798,
60836:24789,
60837:24864,
60838:24818,
60839:24849,
60840:24887,
60841:24880,
60842:24984,
60843:25107,
60844:25254,
60845:25589,
60846:25696,
60847:25757,
60848:25806,
60849:25934,
60850:26112,
60851:26133,
60852:26171,
60853:26121,
60854:26158,
60855:26142,
60856:26148,
60857:26213,
60858:26199,
60859:26201,
60860:64018,
60861:26227,
60862:26265,
60863:26272,
60864:26290,
60865:26303,
60866:26362,
60867:26382,
60868:63785,
60869:26470,
60870:26555,
60871:26706,
60872:26560,
60873:26625,
60874:26692,
60875:26831,
60876:64019,
60877:26984,
60878:64020,
60879:27032,
60880:27106,
60881:27184,
60882:27243,
60883:27206,
60884:27251,
60885:27262,
60886:27362,
60887:27364,
60888:27606,
60889:27711,
60890:27740,
60891:27782,
60892:27759,
60893:27866,
60894:27908,
60895:28039,
60896:28015,
60897:28054,
60898:28076,
60899:28111,
60900:28152,
60901:28146,
60902:28156,
60903:28217,
60904:28252,
60905:28199,
60906:28220,
60907:28351,
60908:28552,
60909:28597,
60910:28661,
60911:28677,
60912:28679,
60913:28712,
60914:28805,
60915:28843,
60916:28943,
60917:28932,
60918:29020,
60919:28998,
60920:28999,
60921:64021,
60922:29121,
60923:29182,
60924:29361,
60992:29374,
60993:29476,
60994:64022,
60995:29559,
60996:29629,
60997:29641,
60998:29654,
60999:29667,
61000:29650,
61001:29703,
61002:29685,
61003:29734,
61004:29738,
61005:29737,
61006:29742,
61007:29794,
61008:29833,
61009:29855,
61010:29953,
61011:30063,
61012:30338,
61013:30364,
61014:30366,
61015:30363,
61016:30374,
61017:64023,
61018:30534,
61019:21167,
61020:30753,
61021:30798,
61022:30820,
61023:30842,
61024:31024,
61025:64024,
61026:64025,
61027:64026,
61028:31124,
61029:64027,
61030:31131,
61031:31441,
61032:31463,
61033:64028,
61034:31467,
61035:31646,
61036:64029,
61037:32072,
61038:32092,
61039:32183,
61040:32160,
61041:32214,
61042:32338,
61043:32583,
61044:32673,
61045:64030,
61046:33537,
61047:33634,
61048:33663,
61049:33735,
61050:33782,
61051:33864,
61052:33972,
61053:34131,
61054:34137,
61056:34155,
61057:64031,
61058:34224,
61059:64032,
61060:64033,
61061:34823,
61062:35061,
61063:35346,
61064:35383,
61065:35449,
61066:35495,
61067:35518,
61068:35551,
61069:64034,
61070:35574,
61071:35667,
61072:35711,
61073:36080,
61074:36084,
61075:36114,
61076:36214,
61077:64035,
61078:36559,
61079:64036,
61080:64037,
61081:36967,
61082:37086,
61083:64038,
61084:37141,
61085:37159,
61086:37338,
61087:37335,
61088:37342,
61089:37357,
61090:37358,
61091:37348,
61092:37349,
61093:37382,
61094:37392,
61095:37386,
61096:37434,
61097:37440,
61098:37436,
61099:37454,
61100:37465,
61101:37457,
61102:37433,
61103:37479,
61104:37543,
61105:37495,
61106:37496,
61107:37607,
61108:37591,
61109:37593,
61110:37584,
61111:64039,
61112:37589,
61113:37600,
61114:37587,
61115:37669,
61116:37665,
61117:37627,
61118:64040,
61119:37662,
61120:37631,
61121:37661,
61122:37634,
61123:37744,
61124:37719,
61125:37796,
61126:37830,
61127:37854,
61128:37880,
61129:37937,
61130:37957,
61131:37960,
61132:38290,
61133:63964,
61134:64041,
61135:38557,
61136:38575,
61137:38707,
61138:38715,
61139:38723,
61140:38733,
61141:38735,
61142:38737,
61143:38741,
61144:38999,
61145:39013,
61146:64042,
61147:64043,
61148:39207,
61149:64044,
61150:39326,
61151:39502,
61152:39641,
61153:39644,
61154:39797,
61155:39794,
61156:39823,
61157:39857,
61158:39867,
61159:39936,
61160:40304,
61161:40299,
61162:64045,
61163:40473,
61164:40657,
61167:8560,
61168:8561,
61169:8562,
61170:8563,
61171:8564,
61172:8565,
61173:8566,
61174:8567,
61175:8568,
61176:8569,
61177:65506,
61178:65508,
61179:65287,
61180:65282,
61504:57344,
61505:57345,
61506:57346,
61507:57347,
61508:57348,
61509:57349,
61510:57350,
61511:57351,
61512:57352,
61513:57353,
61514:57354,
61515:57355,
61516:57356,
61517:57357,
61518:57358,
61519:57359,
61520:57360,
61521:57361,
61522:57362,
61523:57363,
61524:57364,
61525:57365,
61526:57366,
61527:57367,
61528:57368,
61529:57369,
61530:57370,
61531:57371,
61532:57372,
61533:57373,
61534:57374,
61535:57375,
61536:57376,
61537:57377,
61538:57378,
61539:57379,
61540:57380,
61541:57381,
61542:57382,
61543:57383,
61544:57384,
61545:57385,
61546:57386,
61547:57387,
61548:57388,
61549:57389,
61550:57390,
61551:57391,
61552:57392,
61553:57393,
61554:57394,
61555:57395,
61556:57396,
61557:57397,
61558:57398,
61559:57399,
61560:57400,
61561:57401,
61562:57402,
61563:57403,
61564:57404,
61565:57405,
61566:57406,
61568:57407,
61569:57408,
61570:57409,
61571:57410,
61572:57411,
61573:57412,
61574:57413,
61575:57414,
61576:57415,
61577:57416,
61578:57417,
61579:57418,
61580:57419,
61581:57420,
61582:57421,
61583:57422,
61584:57423,
61585:57424,
61586:57425,
61587:57426,
61588:57427,
61589:57428,
61590:57429,
61591:57430,
61592:57431,
61593:57432,
61594:57433,
61595:57434,
61596:57435,
61597:57436,
61598:57437,
61599:57438,
61600:57439,
61601:57440,
61602:57441,
61603:57442,
61604:57443,
61605:57444,
61606:57445,
61607:57446,
61608:57447,
61609:57448,
61610:57449,
61611:57450,
61612:57451,
61613:57452,
61614:57453,
61615:57454,
61616:57455,
61617:57456,
61618:57457,
61619:57458,
61620:57459,
61621:57460,
61622:57461,
61623:57462,
61624:57463,
61625:57464,
61626:57465,
61627:57466,
61628:57467,
61629:57468,
61630:57469,
61631:57470,
61632:57471,
61633:57472,
61634:57473,
61635:57474,
61636:57475,
61637:57476,
61638:57477,
61639:57478,
61640:57479,
61641:57480,
61642:57481,
61643:57482,
61644:57483,
61645:57484,
61646:57485,
61647:57486,
61648:57487,
61649:57488,
61650:57489,
61651:57490,
61652:57491,
61653:57492,
61654:57493,
61655:57494,
61656:57495,
61657:57496,
61658:57497,
61659:57498,
61660:57499,
61661:57500,
61662:57501,
61663:57502,
61664:57503,
61665:57504,
61666:57505,
61667:57506,
61668:57507,
61669:57508,
61670:57509,
61671:57510,
61672:57511,
61673:57512,
61674:57513,
61675:57514,
61676:57515,
61677:57516,
61678:57517,
61679:57518,
61680:57519,
61681:57520,
61682:57521,
61683:57522,
61684:57523,
61685:57524,
61686:57525,
61687:57526,
61688:57527,
61689:57528,
61690:57529,
61691:57530,
61692:57531,
61760:57532,
61761:57533,
61762:57534,
61763:57535,
61764:57536,
61765:57537,
61766:57538,
61767:57539,
61768:57540,
61769:57541,
61770:57542,
61771:57543,
61772:57544,
61773:57545,
61774:57546,
61775:57547,
61776:57548,
61777:57549,
61778:57550,
61779:57551,
61780:57552,
61781:57553,
61782:57554,
61783:57555,
61784:57556,
61785:57557,
61786:57558,
61787:57559,
61788:57560,
61789:57561,
61790:57562,
61791:57563,
61792:57564,
61793:57565,
61794:57566,
61795:57567,
61796:57568,
61797:57569,
61798:57570,
61799:57571,
61800:57572,
61801:57573,
61802:57574,
61803:57575,
61804:57576,
61805:57577,
61806:57578,
61807:57579,
61808:57580,
61809:57581,
61810:57582,
61811:57583,
61812:57584,
61813:57585,
61814:57586,
61815:57587,
61816:57588,
61817:57589,
61818:57590,
61819:57591,
61820:57592,
61821:57593,
61822:57594,
61824:57595,
61825:57596,
61826:57597,
61827:57598,
61828:57599,
61829:57600,
61830:57601,
61831:57602,
61832:57603,
61833:57604,
61834:57605,
61835:57606,
61836:57607,
61837:57608,
61838:57609,
61839:57610,
61840:57611,
61841:57612,
61842:57613,
61843:57614,
61844:57615,
61845:57616,
61846:57617,
61847:57618,
61848:57619,
61849:57620,
61850:57621,
61851:57622,
61852:57623,
61853:57624,
61854:57625,
61855:57626,
61856:57627,
61857:57628,
61858:57629,
61859:57630,
61860:57631,
61861:57632,
61862:57633,
61863:57634,
61864:57635,
61865:57636,
61866:57637,
61867:57638,
61868:57639,
61869:57640,
61870:57641,
61871:57642,
61872:57643,
61873:57644,
61874:57645,
61875:57646,
61876:57647,
61877:57648,
61878:57649,
61879:57650,
61880:57651,
61881:57652,
61882:57653,
61883:57654,
61884:57655,
61885:57656,
61886:57657,
61887:57658,
61888:57659,
61889:57660,
61890:57661,
61891:57662,
61892:57663,
61893:57664,
61894:57665,
61895:57666,
61896:57667,
61897:57668,
61898:57669,
61899:57670,
61900:57671,
61901:57672,
61902:57673,
61903:57674,
61904:57675,
61905:57676,
61906:57677,
61907:57678,
61908:57679,
61909:57680,
61910:57681,
61911:57682,
61912:57683,
61913:57684,
61914:57685,
61915:57686,
61916:57687,
61917:57688,
61918:57689,
61919:57690,
61920:57691,
61921:57692,
61922:57693,
61923:57694,
61924:57695,
61925:57696,
61926:57697,
61927:57698,
61928:57699,
61929:57700,
61930:57701,
61931:57702,
61932:57703,
61933:57704,
61934:57705,
61935:57706,
61936:57707,
61937:57708,
61938:57709,
61939:57710,
61940:57711,
61941:57712,
61942:57713,
61943:57714,
61944:57715,
61945:57716,
61946:57717,
61947:57718,
61948:57719,
62016:57720,
62017:57721,
62018:57722,
62019:57723,
62020:57724,
62021:57725,
62022:57726,
62023:57727,
62024:57728,
62025:57729,
62026:57730,
62027:57731,
62028:57732,
62029:57733,
62030:57734,
62031:57735,
62032:57736,
62033:57737,
62034:57738,
62035:57739,
62036:57740,
62037:57741,
62038:57742,
62039:57743,
62040:57744,
62041:57745,
62042:57746,
62043:57747,
62044:57748,
62045:57749,
62046:57750,
62047:57751,
62048:57752,
62049:57753,
62050:57754,
62051:57755,
62052:57756,
62053:57757,
62054:57758,
62055:57759,
62056:57760,
62057:57761,
62058:57762,
62059:57763,
62060:57764,
62061:57765,
62062:57766,
62063:57767,
62064:57768,
62065:57769,
62066:57770,
62067:57771,
62068:57772,
62069:57773,
62070:57774,
62071:57775,
62072:57776,
62073:57777,
62074:57778,
62075:57779,
62076:57780,
62077:57781,
62078:57782,
62080:57783,
62081:57784,
62082:57785,
62083:57786,
62084:57787,
62085:57788,
62086:57789,
62087:57790,
62088:57791,
62089:57792,
62090:57793,
62091:57794,
62092:57795,
62093:57796,
62094:57797,
62095:57798,
62096:57799,
62097:57800,
62098:57801,
62099:57802,
62100:57803,
62101:57804,
62102:57805,
62103:57806,
62104:57807,
62105:57808,
62106:57809,
62107:57810,
62108:57811,
62109:57812,
62110:57813,
62111:57814,
62112:57815,
62113:57816,
62114:57817,
62115:57818,
62116:57819,
62117:57820,
62118:57821,
62119:57822,
62120:57823,
62121:57824,
62122:57825,
62123:57826,
62124:57827,
62125:57828,
62126:57829,
62127:57830,
62128:57831,
62129:57832,
62130:57833,
62131:57834,
62132:57835,
62133:57836,
62134:57837,
62135:57838,
62136:57839,
62137:57840,
62138:57841,
62139:57842,
62140:57843,
62141:57844,
62142:57845,
62143:57846,
62144:57847,
62145:57848,
62146:57849,
62147:57850,
62148:57851,
62149:57852,
62150:57853,
62151:57854,
62152:57855,
62153:57856,
62154:57857,
62155:57858,
62156:57859,
62157:57860,
62158:57861,
62159:57862,
62160:57863,
62161:57864,
62162:57865,
62163:57866,
62164:57867,
62165:57868,
62166:57869,
62167:57870,
62168:57871,
62169:57872,
62170:57873,
62171:57874,
62172:57875,
62173:57876,
62174:57877,
62175:57878,
62176:57879,
62177:57880,
62178:57881,
62179:57882,
62180:57883,
62181:57884,
62182:57885,
62183:57886,
62184:57887,
62185:57888,
62186:57889,
62187:57890,
62188:57891,
62189:57892,
62190:57893,
62191:57894,
62192:57895,
62193:57896,
62194:57897,
62195:57898,
62196:57899,
62197:57900,
62198:57901,
62199:57902,
62200:57903,
62201:57904,
62202:57905,
62203:57906,
62204:57907,
62272:57908,
62273:57909,
62274:57910,
62275:57911,
62276:57912,
62277:57913,
62278:57914,
62279:57915,
62280:57916,
62281:57917,
62282:57918,
62283:57919,
62284:57920,
62285:57921,
62286:57922,
62287:57923,
62288:57924,
62289:57925,
62290:57926,
62291:57927,
62292:57928,
62293:57929,
62294:57930,
62295:57931,
62296:57932,
62297:57933,
62298:57934,
62299:57935,
62300:57936,
62301:57937,
62302:57938,
62303:57939,
62304:57940,
62305:57941,
62306:57942,
62307:57943,
62308:57944,
62309:57945,
62310:57946,
62311:57947,
62312:57948,
62313:57949,
62314:57950,
62315:57951,
62316:57952,
62317:57953,
62318:57954,
62319:57955,
62320:57956,
62321:57957,
62322:57958,
62323:57959,
62324:57960,
62325:57961,
62326:57962,
62327:57963,
62328:57964,
62329:57965,
62330:57966,
62331:57967,
62332:57968,
62333:57969,
62334:57970,
62336:57971,
62337:57972,
62338:57973,
62339:57974,
62340:57975,
62341:57976,
62342:57977,
62343:57978,
62344:57979,
62345:57980,
62346:57981,
62347:57982,
62348:57983,
62349:57984,
62350:57985,
62351:57986,
62352:57987,
62353:57988,
62354:57989,
62355:57990,
62356:57991,
62357:57992,
62358:57993,
62359:57994,
62360:57995,
62361:57996,
62362:57997,
62363:57998,
62364:57999,
62365:58000,
62366:58001,
62367:58002,
62368:58003,
62369:58004,
62370:58005,
62371:58006,
62372:58007,
62373:58008,
62374:58009,
62375:58010,
62376:58011,
62377:58012,
62378:58013,
62379:58014,
62380:58015,
62381:58016,
62382:58017,
62383:58018,
62384:58019,
62385:58020,
62386:58021,
62387:58022,
62388:58023,
62389:58024,
62390:58025,
62391:58026,
62392:58027,
62393:58028,
62394:58029,
62395:58030,
62396:58031,
62397:58032,
62398:58033,
62399:58034,
62400:58035,
62401:58036,
62402:58037,
62403:58038,
62404:58039,
62405:58040,
62406:58041,
62407:58042,
62408:58043,
62409:58044,
62410:58045,
62411:58046,
62412:58047,
62413:58048,
62414:58049,
62415:58050,
62416:58051,
62417:58052,
62418:58053,
62419:58054,
62420:58055,
62421:58056,
62422:58057,
62423:58058,
62424:58059,
62425:58060,
62426:58061,
62427:58062,
62428:58063,
62429:58064,
62430:58065,
62431:58066,
62432:58067,
62433:58068,
62434:58069,
62435:58070,
62436:58071,
62437:58072,
62438:58073,
62439:58074,
62440:58075,
62441:58076,
62442:58077,
62443:58078,
62444:58079,
62445:58080,
62446:58081,
62447:58082,
62448:58083,
62449:58084,
62450:58085,
62451:58086,
62452:58087,
62453:58088,
62454:58089,
62455:58090,
62456:58091,
62457:58092,
62458:58093,
62459:58094,
62460:58095,
62528:58096,
62529:58097,
62530:58098,
62531:58099,
62532:58100,
62533:58101,
62534:58102,
62535:58103,
62536:58104,
62537:58105,
62538:58106,
62539:58107,
62540:58108,
62541:58109,
62542:58110,
62543:58111,
62544:58112,
62545:58113,
62546:58114,
62547:58115,
62548:58116,
62549:58117,
62550:58118,
62551:58119,
62552:58120,
62553:58121,
62554:58122,
62555:58123,
62556:58124,
62557:58125,
62558:58126,
62559:58127,
62560:58128,
62561:58129,
62562:58130,
62563:58131,
62564:58132,
62565:58133,
62566:58134,
62567:58135,
62568:58136,
62569:58137,
62570:58138,
62571:58139,
62572:58140,
62573:58141,
62574:58142,
62575:58143,
62576:58144,
62577:58145,
62578:58146,
62579:58147,
62580:58148,
62581:58149,
62582:58150,
62583:58151,
62584:58152,
62585:58153,
62586:58154,
62587:58155,
62588:58156,
62589:58157,
62590:58158,
62592:58159,
62593:58160,
62594:58161,
62595:58162,
62596:58163,
62597:58164,
62598:58165,
62599:58166,
62600:58167,
62601:58168,
62602:58169,
62603:58170,
62604:58171,
62605:58172,
62606:58173,
62607:58174,
62608:58175,
62609:58176,
62610:58177,
62611:58178,
62612:58179,
62613:58180,
62614:58181,
62615:58182,
62616:58183,
62617:58184,
62618:58185,
62619:58186,
62620:58187,
62621:58188,
62622:58189,
62623:58190,
62624:58191,
62625:58192,
62626:58193,
62627:58194,
62628:58195,
62629:58196,
62630:58197,
62631:58198,
62632:58199,
62633:58200,
62634:58201,
62635:58202,
62636:58203,
62637:58204,
62638:58205,
62639:58206,
62640:58207,
62641:58208,
62642:58209,
62643:58210,
62644:58211,
62645:58212,
62646:58213,
62647:58214,
62648:58215,
62649:58216,
62650:58217,
62651:58218,
62652:58219,
62653:58220,
62654:58221,
62655:58222,
62656:58223,
62657:58224,
62658:58225,
62659:58226,
62660:58227,
62661:58228,
62662:58229,
62663:58230,
62664:58231,
62665:58232,
62666:58233,
62667:58234,
62668:58235,
62669:58236,
62670:58237,
62671:58238,
62672:58239,
62673:58240,
62674:58241,
62675:58242,
62676:58243,
62677:58244,
62678:58245,
62679:58246,
62680:58247,
62681:58248,
62682:58249,
62683:58250,
62684:58251,
62685:58252,
62686:58253,
62687:58254,
62688:58255,
62689:58256,
62690:58257,
62691:58258,
62692:58259,
62693:58260,
62694:58261,
62695:58262,
62696:58263,
62697:58264,
62698:58265,
62699:58266,
62700:58267,
62701:58268,
62702:58269,
62703:58270,
62704:58271,
62705:58272,
62706:58273,
62707:58274,
62708:58275,
62709:58276,
62710:58277,
62711:58278,
62712:58279,
62713:58280,
62714:58281,
62715:58282,
62716:58283,
62784:58284,
62785:58285,
62786:58286,
62787:58287,
62788:58288,
62789:58289,
62790:58290,
62791:58291,
62792:58292,
62793:58293,
62794:58294,
62795:58295,
62796:58296,
62797:58297,
62798:58298,
62799:58299,
62800:58300,
62801:58301,
62802:58302,
62803:58303,
62804:58304,
62805:58305,
62806:58306,
62807:58307,
62808:58308,
62809:58309,
62810:58310,
62811:58311,
62812:58312,
62813:58313,
62814:58314,
62815:58315,
62816:58316,
62817:58317,
62818:58318,
62819:58319,
62820:58320,
62821:58321,
62822:58322,
62823:58323,
62824:58324,
62825:58325,
62826:58326,
62827:58327,
62828:58328,
62829:58329,
62830:58330,
62831:58331,
62832:58332,
62833:58333,
62834:58334,
62835:58335,
62836:58336,
62837:58337,
62838:58338,
62839:58339,
62840:58340,
62841:58341,
62842:58342,
62843:58343,
62844:58344,
62845:58345,
62846:58346,
62848:58347,
62849:58348,
62850:58349,
62851:58350,
62852:58351,
62853:58352,
62854:58353,
62855:58354,
62856:58355,
62857:58356,
62858:58357,
62859:58358,
62860:58359,
62861:58360,
62862:58361,
62863:58362,
62864:58363,
62865:58364,
62866:58365,
62867:58366,
62868:58367,
62869:58368,
62870:58369,
62871:58370,
62872:58371,
62873:58372,
62874:58373,
62875:58374,
62876:58375,
62877:58376,
62878:58377,
62879:58378,
62880:58379,
62881:58380,
62882:58381,
62883:58382,
62884:58383,
62885:58384,
62886:58385,
62887:58386,
62888:58387,
62889:58388,
62890:58389,
62891:58390,
62892:58391,
62893:58392,
62894:58393,
62895:58394,
62896:58395,
62897:58396,
62898:58397,
62899:58398,
62900:58399,
62901:58400,
62902:58401,
62903:58402,
62904:58403,
62905:58404,
62906:58405,
62907:58406,
62908:58407,
62909:58408,
62910:58409,
62911:58410,
62912:58411,
62913:58412,
62914:58413,
62915:58414,
62916:58415,
62917:58416,
62918:58417,
62919:58418,
62920:58419,
62921:58420,
62922:58421,
62923:58422,
62924:58423,
62925:58424,
62926:58425,
62927:58426,
62928:58427,
62929:58428,
62930:58429,
62931:58430,
62932:58431,
62933:58432,
62934:58433,
62935:58434,
62936:58435,
62937:58436,
62938:58437,
62939:58438,
62940:58439,
62941:58440,
62942:58441,
62943:58442,
62944:58443,
62945:58444,
62946:58445,
62947:58446,
62948:58447,
62949:58448,
62950:58449,
62951:58450,
62952:58451,
62953:58452,
62954:58453,
62955:58454,
62956:58455,
62957:58456,
62958:58457,
62959:58458,
62960:58459,
62961:58460,
62962:58461,
62963:58462,
62964:58463,
62965:58464,
62966:58465,
62967:58466,
62968:58467,
62969:58468,
62970:58469,
62971:58470,
62972:58471,
63040:58472,
63041:58473,
63042:58474,
63043:58475,
63044:58476,
63045:58477,
63046:58478,
63047:58479,
63048:58480,
63049:58481,
63050:58482,
63051:58483,
63052:58484,
63053:58485,
63054:58486,
63055:58487,
63056:58488,
63057:58489,
63058:58490,
63059:58491,
63060:58492,
63061:58493,
63062:58494,
63063:58495,
63064:58496,
63065:58497,
63066:58498,
63067:58499,
63068:58500,
63069:58501,
63070:58502,
63071:58503,
63072:58504,
63073:58505,
63074:58506,
63075:58507,
63076:58508,
63077:58509,
63078:58510,
63079:58511,
63080:58512,
63081:58513,
63082:58514,
63083:58515,
63084:58516,
63085:58517,
63086:58518,
63087:58519,
63088:58520,
63089:58521,
63090:58522,
63091:58523,
63092:58524,
63093:58525,
63094:58526,
63095:58527,
63096:58528,
63097:58529,
63098:58530,
63099:58531,
63100:58532,
63101:58533,
63102:58534,
63104:58535,
63105:58536,
63106:58537,
63107:58538,
63108:58539,
63109:58540,
63110:58541,
63111:58542,
63112:58543,
63113:58544,
63114:58545,
63115:58546,
63116:58547,
63117:58548,
63118:58549,
63119:58550,
63120:58551,
63121:58552,
63122:58553,
63123:58554,
63124:58555,
63125:58556,
63126:58557,
63127:58558,
63128:58559,
63129:58560,
63130:58561,
63131:58562,
63132:58563,
63133:58564,
63134:58565,
63135:58566,
63136:58567,
63137:58568,
63138:58569,
63139:58570,
63140:58571,
63141:58572,
63142:58573,
63143:58574,
63144:58575,
63145:58576,
63146:58577,
63147:58578,
63148:58579,
63149:58580,
63150:58581,
63151:58582,
63152:58583,
63153:58584,
63154:58585,
63155:58586,
63156:58587,
63157:58588,
63158:58589,
63159:58590,
63160:58591,
63161:58592,
63162:58593,
63163:58594,
63164:58595,
63165:58596,
63166:58597,
63167:58598,
63168:58599,
63169:58600,
63170:58601,
63171:58602,
63172:58603,
63173:58604,
63174:58605,
63175:58606,
63176:58607,
63177:58608,
63178:58609,
63179:58610,
63180:58611,
63181:58612,
63182:58613,
63183:58614,
63184:58615,
63185:58616,
63186:58617,
63187:58618,
63188:58619,
63189:58620,
63190:58621,
63191:58622,
63192:58623,
63193:58624,
63194:58625,
63195:58626,
63196:58627,
63197:58628,
63198:58629,
63199:58630,
63200:58631,
63201:58632,
63202:58633,
63203:58634,
63204:58635,
63205:58636,
63206:58637,
63207:58638,
63208:58639,
63209:58640,
63210:58641,
63211:58642,
63212:58643,
63213:58644,
63214:58645,
63215:58646,
63216:58647,
63217:58648,
63218:58649,
63219:58650,
63220:58651,
63221:58652,
63222:58653,
63223:58654,
63224:58655,
63225:58656,
63226:58657,
63227:58658,
63228:58659,
63296:58660,
63297:58661,
63298:58662,
63299:58663,
63300:58664,
63301:58665,
63302:58666,
63303:58667,
63304:58668,
63305:58669,
63306:58670,
63307:58671,
63308:58672,
63309:58673,
63310:58674,
63311:58675,
63312:58676,
63313:58677,
63314:58678,
63315:58679,
63316:58680,
63317:58681,
63318:58682,
63319:58683,
63320:58684,
63321:58685,
63322:58686,
63323:58687,
63324:58688,
63325:58689,
63326:58690,
63327:58691,
63328:58692,
63329:58693,
63330:58694,
63331:58695,
63332:58696,
63333:58697,
63334:58698,
63335:58699,
63336:58700,
63337:58701,
63338:58702,
63339:58703,
63340:58704,
63341:58705,
63342:58706,
63343:58707,
63344:58708,
63345:58709,
63346:58710,
63347:58711,
63348:58712,
63349:58713,
63350:58714,
63351:58715,
63352:58716,
63353:58717,
63354:58718,
63355:58719,
63356:58720,
63357:58721,
63358:58722,
63360:58723,
63361:58724,
63362:58725,
63363:58726,
63364:58727,
63365:58728,
63366:58729,
63367:58730,
63368:58731,
63369:58732,
63370:58733,
63371:58734,
63372:58735,
63373:58736,
63374:58737,
63375:58738,
63376:58739,
63377:58740,
63378:58741,
63379:58742,
63380:58743,
63381:58744,
63382:58745,
63383:58746,
63384:58747,
63385:58748,
63386:58749,
63387:58750,
63388:58751,
63389:58752,
63390:58753,
63391:58754,
63392:58755,
63393:58756,
63394:58757,
63395:58758,
63396:58759,
63397:58760,
63398:58761,
63399:58762,
63400:58763,
63401:58764,
63402:58765,
63403:58766,
63404:58767,
63405:58768,
63406:58769,
63407:58770,
63408:58771,
63409:58772,
63410:58773,
63411:58774,
63412:58775,
63413:58776,
63414:58777,
63415:58778,
63416:58779,
63417:58780,
63418:58781,
63419:58782,
63420:58783,
63421:58784,
63422:58785,
63423:58786,
63424:58787,
63425:58788,
63426:58789,
63427:58790,
63428:58791,
63429:58792,
63430:58793,
63431:58794,
63432:58795,
63433:58796,
63434:58797,
63435:58798,
63436:58799,
63437:58800,
63438:58801,
63439:58802,
63440:58803,
63441:58804,
63442:58805,
63443:58806,
63444:58807,
63445:58808,
63446:58809,
63447:58810,
63448:58811,
63449:58812,
63450:58813,
63451:58814,
63452:58815,
63453:58816,
63454:58817,
63455:58818,
63456:58819,
63457:58820,
63458:58821,
63459:58822,
63460:58823,
63461:58824,
63462:58825,
63463:58826,
63464:58827,
63465:58828,
63466:58829,
63467:58830,
63468:58831,
63469:58832,
63470:58833,
63471:58834,
63472:58835,
63473:58836,
63474:58837,
63475:58838,
63476:58839,
63477:58840,
63478:58841,
63479:58842,
63480:58843,
63481:58844,
63482:58845,
63483:58846,
63484:58847,
63552:58848,
63553:58849,
63554:58850,
63555:58851,
63556:58852,
63557:58853,
63558:58854,
63559:58855,
63560:58856,
63561:58857,
63562:58858,
63563:58859,
63564:58860,
63565:58861,
63566:58862,
63567:58863,
63568:58864,
63569:58865,
63570:58866,
63571:58867,
63572:58868,
63573:58869,
63574:58870,
63575:58871,
63576:58872,
63577:58873,
63578:58874,
63579:58875,
63580:58876,
63581:58877,
63582:58878,
63583:58879,
63584:58880,
63585:58881,
63586:58882,
63587:58883,
63588:58884,
63589:58885,
63590:58886,
63591:58887,
63592:58888,
63593:58889,
63594:58890,
63595:58891,
63596:58892,
63597:58893,
63598:58894,
63599:58895,
63600:58896,
63601:58897,
63602:58898,
63603:58899,
63604:58900,
63605:58901,
63606:58902,
63607:58903,
63608:58904,
63609:58905,
63610:58906,
63611:58907,
63612:58908,
63613:58909,
63614:58910,
63616:58911,
63617:58912,
63618:58913,
63619:58914,
63620:58915,
63621:58916,
63622:58917,
63623:58918,
63624:58919,
63625:58920,
63626:58921,
63627:58922,
63628:58923,
63629:58924,
63630:58925,
63631:58926,
63632:58927,
63633:58928,
63634:58929,
63635:58930,
63636:58931,
63637:58932,
63638:58933,
63639:58934,
63640:58935,
63641:58936,
63642:58937,
63643:58938,
63644:58939,
63645:58940,
63646:58941,
63647:58942,
63648:58943,
63649:58944,
63650:58945,
63651:58946,
63652:58947,
63653:58948,
63654:58949,
63655:58950,
63656:58951,
63657:58952,
63658:58953,
63659:58954,
63660:58955,
63661:58956,
63662:58957,
63663:58958,
63664:58959,
63665:58960,
63666:58961,
63667:58962,
63668:58963,
63669:58964,
63670:58965,
63671:58966,
63672:58967,
63673:58968,
63674:58969,
63675:58970,
63676:58971,
63677:58972,
63678:58973,
63679:58974,
63680:58975,
63681:58976,
63682:58977,
63683:58978,
63684:58979,
63685:58980,
63686:58981,
63687:58982,
63688:58983,
63689:58984,
63690:58985,
63691:58986,
63692:58987,
63693:58988,
63694:58989,
63695:58990,
63696:58991,
63697:58992,
63698:58993,
63699:58994,
63700:58995,
63701:58996,
63702:58997,
63703:58998,
63704:58999,
63705:59000,
63706:59001,
63707:59002,
63708:59003,
63709:59004,
63710:59005,
63711:59006,
63712:59007,
63713:59008,
63714:59009,
63715:59010,
63716:59011,
63717:59012,
63718:59013,
63719:59014,
63720:59015,
63721:59016,
63722:59017,
63723:59018,
63724:59019,
63725:59020,
63726:59021,
63727:59022,
63728:59023,
63729:59024,
63730:59025,
63731:59026,
63732:59027,
63733:59028,
63734:59029,
63735:59030,
63736:59031,
63737:59032,
63738:59033,
63739:59034,
63740:59035,
64064:8560,
64065:8561,
64066:8562,
64067:8563,
64068:8564,
64069:8565,
64070:8566,
64071:8567,
64072:8568,
64073:8569,
64074:8544,
64075:8545,
64076:8546,
64077:8547,
64078:8548,
64079:8549,
64080:8550,
64081:8551,
64082:8552,
64083:8553,
64084:65506,
64085:65508,
64086:65287,
64087:65282,
64088:12849,
64089:8470,
64090:8481,
64091:8757,
64092:32394,
64093:35100,
64094:37704,
64095:37512,
64096:34012,
64097:20425,
64098:28859,
64099:26161,
64100:26824,
64101:37625,
64102:26363,
64103:24389,
64104:20008,
64105:20193,
64106:20220,
64107:20224,
64108:20227,
64109:20281,
64110:20310,
64111:20370,
64112:20362,
64113:20378,
64114:20372,
64115:20429,
64116:20544,
64117:20514,
64118:20479,
64119:20510,
64120:20550,
64121:20592,
64122:20546,
64123:20628,
64124:20724,
64125:20696,
64126:20810,
64128:20836,
64129:20893,
64130:20926,
64131:20972,
64132:21013,
64133:21148,
64134:21158,
64135:21184,
64136:21211,
64137:21248,
64138:21255,
64139:21284,
64140:21362,
64141:21395,
64142:21426,
64143:21469,
64144:64014,
64145:21660,
64146:21642,
64147:21673,
64148:21759,
64149:21894,
64150:22361,
64151:22373,
64152:22444,
64153:22472,
64154:22471,
64155:64015,
64156:64016,
64157:22686,
64158:22706,
64159:22795,
64160:22867,
64161:22875,
64162:22877,
64163:22883,
64164:22948,
64165:22970,
64166:23382,
64167:23488,
64168:29999,
64169:23512,
64170:23532,
64171:23582,
64172:23718,
64173:23738,
64174:23797,
64175:23847,
64176:23891,
64177:64017,
64178:23874,
64179:23917,
64180:23992,
64181:23993,
64182:24016,
64183:24353,
64184:24372,
64185:24423,
64186:24503,
64187:24542,
64188:24669,
64189:24709,
64190:24714,
64191:24798,
64192:24789,
64193:24864,
64194:24818,
64195:24849,
64196:24887,
64197:24880,
64198:24984,
64199:25107,
64200:25254,
64201:25589,
64202:25696,
64203:25757,
64204:25806,
64205:25934,
64206:26112,
64207:26133,
64208:26171,
64209:26121,
64210:26158,
64211:26142,
64212:26148,
64213:26213,
64214:26199,
64215:26201,
64216:64018,
64217:26227,
64218:26265,
64219:26272,
64220:26290,
64221:26303,
64222:26362,
64223:26382,
64224:63785,
64225:26470,
64226:26555,
64227:26706,
64228:26560,
64229:26625,
64230:26692,
64231:26831,
64232:64019,
64233:26984,
64234:64020,
64235:27032,
64236:27106,
64237:27184,
64238:27243,
64239:27206,
64240:27251,
64241:27262,
64242:27362,
64243:27364,
64244:27606,
64245:27711,
64246:27740,
64247:27782,
64248:27759,
64249:27866,
64250:27908,
64251:28039,
64252:28015,
64320:28054,
64321:28076,
64322:28111,
64323:28152,
64324:28146,
64325:28156,
64326:28217,
64327:28252,
64328:28199,
64329:28220,
64330:28351,
64331:28552,
64332:28597,
64333:28661,
64334:28677,
64335:28679,
64336:28712,
64337:28805,
64338:28843,
64339:28943,
64340:28932,
64341:29020,
64342:28998,
64343:28999,
64344:64021,
64345:29121,
64346:29182,
64347:29361,
64348:29374,
64349:29476,
64350:64022,
64351:29559,
64352:29629,
64353:29641,
64354:29654,
64355:29667,
64356:29650,
64357:29703,
64358:29685,
64359:29734,
64360:29738,
64361:29737,
64362:29742,
64363:29794,
64364:29833,
64365:29855,
64366:29953,
64367:30063,
64368:30338,
64369:30364,
64370:30366,
64371:30363,
64372:30374,
64373:64023,
64374:30534,
64375:21167,
64376:30753,
64377:30798,
64378:30820,
64379:30842,
64380:31024,
64381:64024,
64382:64025,
64384:64026,
64385:31124,
64386:64027,
64387:31131,
64388:31441,
64389:31463,
64390:64028,
64391:31467,
64392:31646,
64393:64029,
64394:32072,
64395:32092,
64396:32183,
64397:32160,
64398:32214,
64399:32338,
64400:32583,
64401:32673,
64402:64030,
64403:33537,
64404:33634,
64405:33663,
64406:33735,
64407:33782,
64408:33864,
64409:33972,
64410:34131,
64411:34137,
64412:34155,
64413:64031,
64414:34224,
64415:64032,
64416:64033,
64417:34823,
64418:35061,
64419:35346,
64420:35383,
64421:35449,
64422:35495,
64423:35518,
64424:35551,
64425:64034,
64426:35574,
64427:35667,
64428:35711,
64429:36080,
64430:36084,
64431:36114,
64432:36214,
64433:64035,
64434:36559,
64435:64036,
64436:64037,
64437:36967,
64438:37086,
64439:64038,
64440:37141,
64441:37159,
64442:37338,
64443:37335,
64444:37342,
64445:37357,
64446:37358,
64447:37348,
64448:37349,
64449:37382,
64450:37392,
64451:37386,
64452:37434,
64453:37440,
64454:37436,
64455:37454,
64456:37465,
64457:37457,
64458:37433,
64459:37479,
64460:37543,
64461:37495,
64462:37496,
64463:37607,
64464:37591,
64465:37593,
64466:37584,
64467:64039,
64468:37589,
64469:37600,
64470:37587,
64471:37669,
64472:37665,
64473:37627,
64474:64040,
64475:37662,
64476:37631,
64477:37661,
64478:37634,
64479:37744,
64480:37719,
64481:37796,
64482:37830,
64483:37854,
64484:37880,
64485:37937,
64486:37957,
64487:37960,
64488:38290,
64489:63964,
64490:64041,
64491:38557,
64492:38575,
64493:38707,
64494:38715,
64495:38723,
64496:38733,
64497:38735,
64498:38737,
64499:38741,
64500:38999,
64501:39013,
64502:64042,
64503:64043,
64504:39207,
64505:64044,
64506:39326,
64507:39502,
64508:39641,
64576:39644,
64577:39797,
64578:39794,
64579:39823,
64580:39857,
64581:39867,
64582:39936,
64583:40304,
64584:40299,
64585:64045,
64586:40473,
64587:40657
};

/**
 * @author takahiro / https://github.com/takahirox
 */

function DataViewEx ( buffer, littleEndian ) {

	this.dv = new DataView( buffer );
	this.offset = 0;
	this.littleEndian = ( littleEndian !== undefined ) ? littleEndian : true;
	this.encoder = new CharsetEncoder();

}

DataViewEx.prototype = {

	constructor: DataViewEx,

	getInt8: function () {

		var value = this.dv.getInt8( this.offset );
		this.offset += 1;
		return value;

	},

	getInt8Array: function ( size ) {

		var a = [];

		for ( var i = 0; i < size; i++ ) {

			a.push( this.getInt8() );

		}

		return a;

	},

	getUint8: function () {

		var value = this.dv.getUint8( this.offset );
		this.offset += 1;
		return value;

	},

	getUint8Array: function ( size ) {

		var a = [];

		for ( var i = 0; i < size; i++ ) {

			a.push( this.getUint8() );

		}

		return a;

	},


	getInt16: function () {

		var value = this.dv.getInt16( this.offset, this.littleEndian );
		this.offset += 2;
		return value;

	},

	getInt16Array: function ( size ) {

		var a = [];

		for ( var i = 0; i < size; i++ ) {

			a.push( this.getInt16() );

		}

		return a;

	},

	getUint16: function () {

		var value = this.dv.getUint16( this.offset, this.littleEndian );
		this.offset += 2;
		return value;

	},

	getUint16Array: function ( size ) {

		var a = [];

		for ( var i = 0; i < size; i++ ) {

			a.push( this.getUint16() );

		}

		return a;

	},

	getInt32: function () {

		var value = this.dv.getInt32( this.offset, this.littleEndian );
		this.offset += 4;
		return value;

	},

	getInt32Array: function ( size ) {

		var a = [];

		for ( var i = 0; i < size; i++ ) {

			a.push( this.getInt32() );

		}

		return a;

	},

	getUint32: function () {

		var value = this.dv.getUint32( this.offset, this.littleEndian );
		this.offset += 4;
		return value;

	},

	getUint32Array: function ( size ) {

		var a = [];

		for ( var i = 0; i < size; i++ ) {

			a.push( this.getUint32() );

		}

		return a;

	},

	getFloat32: function () {

		var value = this.dv.getFloat32( this.offset, this.littleEndian );
		this.offset += 4;
		return value;

	},

	getFloat32Array: function( size ) {

		var a = [];

		for ( var i = 0; i < size; i++ ) {

			a.push( this.getFloat32() );

		}

		return a;

	},

	getFloat64: function () {

		var value = this.dv.getFloat64( this.offset, this.littleEndian );
		this.offset += 8;
		return value;

	},

	getFloat64Array: function( size ) {

		var a = [];

		for ( var i = 0; i < size; i++ ) {

			a.push( this.getFloat64() );

		}

		return a;

	},

	getIndex: function ( type, isUnsigned ) {

		switch ( type ) {

			case 1:
				return ( isUnsigned === true ) ? this.getUint8() : this.getInt8();

			case 2:
				return ( isUnsigned === true ) ? this.getUint16() : this.getInt16();

			case 4:
				return this.getInt32(); // No Uint32

			default:
				throw 'unknown number type ' + type + ' exception.';

		}

	},

	getIndexArray: function ( type, size, isUnsigned ) {

		var a = [];

		for ( var i = 0; i < size; i++ ) {

			a.push( this.getIndex( type, isUnsigned ) );

		}

		return a;

	},

	getChars: function ( size ) {

		var str = '';

		while ( size > 0 ) {

			var value = this.getUint8();
			size--;

			if ( value === 0 ) {

				break;

			}

			str += String.fromCharCode( value );

		}

		while ( size > 0 ) {

			this.getUint8();
			size--;

		}

		return str;

	},

	getSjisStringsAsUnicode: function ( size ) {

		var a = [];

		while ( size > 0 ) {

			var value = this.getUint8();
			size--;

			if ( value === 0 ) {

				break;

			}

			a.push( value );

		}

		while ( size > 0 ) {

			this.getUint8();
			size--;

		}

		return this.encoder.s2u( new Uint8Array( a ) );

	},

	getUnicodeStrings: function ( size ) {

		var str = '';

		while ( size > 0 ) {

			var value = this.getUint16();
			size -= 2;

			if ( value === 0 ) {

				break;

			}

			str += String.fromCharCode( value );

		}

		while ( size > 0 ) {

			this.getUint8();
			size--;

		}

		return str;

	},

	getTextBuffer: function () {

		var size = this.getUint32();
		return this.getUnicodeStrings( size );

	}

};

/**
 * @author takahiro / https://github.com/takahirox
 */

function DataCreationHelper () {
}

DataCreationHelper.prototype = {

	constructor: DataCreationHelper,

	leftToRightVector3: function ( v ) {

		v[ 2 ] = -v[ 2 ];

	},

	leftToRightQuaternion: function ( q ) {

		q[ 0 ] = -q[ 0 ];
		q[ 1 ] = -q[ 1 ];

	},

	leftToRightEuler: function ( r ) {

		r[ 0 ] = -r[ 0 ];
		r[ 1 ] = -r[ 1 ];

	},

	leftToRightIndexOrder: function ( p ) {

		var tmp = p[ 2 ];
		p[ 2 ] = p[ 0 ];
		p[ 0 ] = tmp;

	},

	leftToRightVector3Range: function ( v1, v2 ) {

		var tmp = -v2[ 2 ];
		v2[ 2 ] = -v1[ 2 ];
		v1[ 2 ] = tmp;

	},

	leftToRightEulerRange: function ( r1, r2 ) {

		var tmp1 = -r2[ 0 ];
		var tmp2 = -r2[ 1 ];
		r2[ 0 ] = -r1[ 0 ];
		r2[ 1 ] = -r1[ 1 ];
		r1[ 0 ] = tmp1;
		r1[ 1 ] = tmp2;

	}

};

/**
 * @author takahiro / https://github.com/takahirox
 */

function Parser() {
}

Parser.prototype.parsePmd = function ( buffer, leftToRight ) {

	var pmd = {};
	var dv = new DataViewEx( buffer );

	pmd.metadata = {};
	pmd.metadata.format = 'pmd';
	pmd.metadata.coordinateSystem = 'left';

	var parseHeader = function () {

		var metadata = pmd.metadata;
		metadata.magic = dv.getChars( 3 );

		if ( metadata.magic !== 'Pmd' ) {

			throw 'PMD file magic is not Pmd, but ' + metadata.magic;

		}

		metadata.version = dv.getFloat32();
		metadata.modelName = dv.getSjisStringsAsUnicode( 20 );
		metadata.comment = dv.getSjisStringsAsUnicode( 256 );

	};

	var parseVertices = function () {

		var parseVertex = function () {

			var p = {};
			p.position = dv.getFloat32Array( 3 );
			p.normal = dv.getFloat32Array( 3 );
			p.uv = dv.getFloat32Array( 2 );
			p.skinIndices = dv.getUint16Array( 2 );
			p.skinWeights = [ dv.getUint8() / 100 ];
			p.skinWeights.push( 1.0 - p.skinWeights[ 0 ] );
			p.edgeFlag = dv.getUint8();
			return p;

		};

		var metadata = pmd.metadata;
		metadata.vertexCount = dv.getUint32();

		pmd.vertices = [];

		for ( var i = 0; i < metadata.vertexCount; i++ ) {

			pmd.vertices.push( parseVertex() );

		}

	};

	var parseFaces = function () {

		var parseFace = function () {

			var p = {};
			p.indices = dv.getUint16Array( 3 );
			return p;

		};

		var metadata = pmd.metadata;
		metadata.faceCount = dv.getUint32() / 3;

		pmd.faces = [];

		for ( var i = 0; i < metadata.faceCount; i++ ) {

			pmd.faces.push( parseFace() );

		}

	};

	var parseMaterials = function () {

		var parseMaterial = function () {

			var p = {};
			p.diffuse = dv.getFloat32Array( 4 );
			p.shininess = dv.getFloat32();
			p.specular = dv.getFloat32Array( 3 );
			p.ambient = dv.getFloat32Array( 3 );
			p.toonIndex = dv.getInt8();
			p.edgeFlag = dv.getUint8();
			p.faceCount = dv.getUint32() / 3;
			p.fileName = dv.getSjisStringsAsUnicode( 20 );
			return p;

		};

		var metadata = pmd.metadata;
		metadata.materialCount = dv.getUint32();

		pmd.materials = [];

		for ( var i = 0; i < metadata.materialCount; i++ ) {

			pmd.materials.push( parseMaterial() );

		}

	};

	var parseBones = function () {

		var parseBone = function () {

			var p = {};
			p.name = dv.getSjisStringsAsUnicode( 20 );
			p.parentIndex = dv.getInt16();
			p.tailIndex = dv.getInt16();
			p.type = dv.getUint8();
			p.ikIndex = dv.getInt16();
			p.position = dv.getFloat32Array( 3 );
			return p;

		};

		var metadata = pmd.metadata;
		metadata.boneCount = dv.getUint16();

		pmd.bones = [];

		for ( var i = 0; i < metadata.boneCount; i++ ) {

			pmd.bones.push( parseBone() );

		}

	};

	var parseIks = function () {

		var parseIk = function () {

			var p = {};
			p.target = dv.getUint16();
			p.effector = dv.getUint16();
			p.linkCount = dv.getUint8();
			p.iteration = dv.getUint16();
			p.maxAngle = dv.getFloat32();

			p.links = [];
			for ( var i = 0; i < p.linkCount; i++ ) {

				var link = {};
				link.index = dv.getUint16();
				p.links.push( link );

			}

			return p;

		};

		var metadata = pmd.metadata;
		metadata.ikCount = dv.getUint16();

		pmd.iks = [];

		for ( var i = 0; i < metadata.ikCount; i++ ) {

			pmd.iks.push( parseIk() );

		}

	};

	var parseMorphs = function () {

		var parseMorph = function () {

			var p = {};
			p.name = dv.getSjisStringsAsUnicode( 20 );
			p.elementCount = dv.getUint32();
			p.type = dv.getUint8();

			p.elements = [];
			for ( var i = 0; i < p.elementCount; i++ ) {

				p.elements.push( {
					index: dv.getUint32(),
					position: dv.getFloat32Array( 3 )
				} ) ;

			}

			return p;

		};

		var metadata = pmd.metadata;
		metadata.morphCount = dv.getUint16();

		pmd.morphs = [];

		for ( var i = 0; i < metadata.morphCount; i++ ) {

			pmd.morphs.push( parseMorph() );

		}


	};

	var parseMorphFrames = function () {

		var parseMorphFrame = function () {

			var p = {};
			p.index = dv.getUint16();
			return p;

		};

		var metadata = pmd.metadata;
		metadata.morphFrameCount = dv.getUint8();

		pmd.morphFrames = [];

		for ( var i = 0; i < metadata.morphFrameCount; i++ ) {

			pmd.morphFrames.push( parseMorphFrame() );

		}

	};

	var parseBoneFrameNames = function () {

		var parseBoneFrameName = function () {

			var p = {};
			p.name = dv.getSjisStringsAsUnicode( 50 );
			return p;

		};

		var metadata = pmd.metadata;
		metadata.boneFrameNameCount = dv.getUint8();

		pmd.boneFrameNames = [];

		for ( var i = 0; i < metadata.boneFrameNameCount; i++ ) {

			pmd.boneFrameNames.push( parseBoneFrameName() );

		}

	};

	var parseBoneFrames = function () {

		var parseBoneFrame = function () {

			var p = {};
			p.boneIndex = dv.getInt16();
			p.frameIndex = dv.getUint8();
			return p;

		};

		var metadata = pmd.metadata;
		metadata.boneFrameCount = dv.getUint32();

		pmd.boneFrames = [];

		for ( var i = 0; i < metadata.boneFrameCount; i++ ) {

			pmd.boneFrames.push( parseBoneFrame() );

		}

	};

	var parseEnglishHeader = function () {

		var metadata = pmd.metadata;
		metadata.englishCompatibility = dv.getUint8();

		if ( metadata.englishCompatibility > 0 ) {

			metadata.englishModelName = dv.getSjisStringsAsUnicode( 20 );
			metadata.englishComment = dv.getSjisStringsAsUnicode( 256 );

		}

	};

	var parseEnglishBoneNames = function () {

		var parseEnglishBoneName = function () {

			var p = {};
			p.name = dv.getSjisStringsAsUnicode( 20 );
			return p;

		};

		var metadata = pmd.metadata;

		if ( metadata.englishCompatibility === 0 ) {

			return;

		}

		pmd.englishBoneNames = [];

		for ( var i = 0; i < metadata.boneCount; i++ ) {

			pmd.englishBoneNames.push( parseEnglishBoneName() );

		}

	};

	var parseEnglishMorphNames = function () {

		var parseEnglishMorphName = function () {

			var p = {};
			p.name = dv.getSjisStringsAsUnicode( 20 );
			return p;

		};

		var metadata = pmd.metadata;

		if ( metadata.englishCompatibility === 0 ) {

			return;

		}

		pmd.englishMorphNames = [];

		for ( var i = 0; i < metadata.morphCount - 1; i++ ) {

			pmd.englishMorphNames.push( parseEnglishMorphName() );

		}

	};

	var parseEnglishBoneFrameNames = function () {

		var parseEnglishBoneFrameName = function () {

			var p = {};
			p.name = dv.getSjisStringsAsUnicode( 50 );
			return p;

		};

		var metadata = pmd.metadata;

		if ( metadata.englishCompatibility === 0 ) {

			return;

		}

		pmd.englishBoneFrameNames = [];

		for ( var i = 0; i < metadata.boneFrameNameCount; i++ ) {

			pmd.englishBoneFrameNames.push( parseEnglishBoneFrameName() );

		}

	};

	var parseToonTextures = function () {

		var parseToonTexture = function () {

			var p = {};
			p.fileName = dv.getSjisStringsAsUnicode( 100 );
			return p;

		};

		pmd.toonTextures = [];

		for ( var i = 0; i < 10; i++ ) {

			pmd.toonTextures.push( parseToonTexture() );

		}

	};

	var parseRigidBodies = function () {

		var parseRigidBody = function () {

			var p = {};
			p.name = dv.getSjisStringsAsUnicode( 20 );
			p.boneIndex = dv.getInt16();
			p.groupIndex = dv.getUint8();
			p.groupTarget = dv.getUint16();
			p.shapeType = dv.getUint8();
			p.width = dv.getFloat32();
			p.height = dv.getFloat32();
			p.depth = dv.getFloat32();
			p.position = dv.getFloat32Array( 3 );
			p.rotation = dv.getFloat32Array( 3 );
			p.weight = dv.getFloat32();
			p.positionDamping = dv.getFloat32();
			p.rotationDamping = dv.getFloat32();
			p.restitution = dv.getFloat32();
			p.friction = dv.getFloat32();
			p.type = dv.getUint8();
			return p;

		};

		var metadata = pmd.metadata;
		metadata.rigidBodyCount = dv.getUint32();

		pmd.rigidBodies = [];

		for ( var i = 0; i < metadata.rigidBodyCount; i++ ) {

			pmd.rigidBodies.push( parseRigidBody() );

		}

	};

	var parseConstraints = function () {

		var parseConstraint = function () {

			var p = {};
			p.name = dv.getSjisStringsAsUnicode( 20 );
			p.rigidBodyIndex1 = dv.getUint32();
			p.rigidBodyIndex2 = dv.getUint32();
			p.position = dv.getFloat32Array( 3 );
			p.rotation = dv.getFloat32Array( 3 );
			p.translationLimitation1 = dv.getFloat32Array( 3 );
			p.translationLimitation2 = dv.getFloat32Array( 3 );
			p.rotationLimitation1 = dv.getFloat32Array( 3 );
			p.rotationLimitation2 = dv.getFloat32Array( 3 );
			p.springPosition = dv.getFloat32Array( 3 );
			p.springRotation = dv.getFloat32Array( 3 );
			return p;

		};

		var metadata = pmd.metadata;
		metadata.constraintCount = dv.getUint32();

		pmd.constraints = [];

		for ( var i = 0; i < metadata.constraintCount; i++ ) {

			pmd.constraints.push( parseConstraint() );

		}

	};

	parseHeader();
	parseVertices();
	parseFaces();
	parseMaterials();
	parseBones();
	parseIks();
	parseMorphs();
	parseMorphFrames();
	parseBoneFrameNames();
	parseBoneFrames();
	parseEnglishHeader();
	parseEnglishBoneNames();
	parseEnglishMorphNames();
	parseEnglishBoneFrameNames();
	parseToonTextures();
	parseRigidBodies();
	parseConstraints();

	if ( leftToRight === true ) this.leftToRightModel( pmd );

	// console.log( pmd ); // for console debug

	return pmd;

};

Parser.prototype.parsePmx = function ( buffer, leftToRight ) {

	var pmx = {};
	var dv = new DataViewEx( buffer );

	pmx.metadata = {};
	pmx.metadata.format = 'pmx';
	pmx.metadata.coordinateSystem = 'left';

	var parseHeader = function () {

		var metadata = pmx.metadata;
		metadata.magic = dv.getChars( 4 );

		// Note: don't remove the last blank space.
		if ( metadata.magic !== 'PMX ' ) {

			throw 'PMX file magic is not PMX , but ' + metadata.magic;

		}

		metadata.version = dv.getFloat32();

		if ( metadata.version !== 2.0 && metadata.version !== 2.1 ) {

			throw 'PMX version ' + metadata.version + ' is not supported.';

		}

		metadata.headerSize = dv.getUint8();
		metadata.encoding = dv.getUint8();
		metadata.additionalUvNum = dv.getUint8();
		metadata.vertexIndexSize = dv.getUint8();
		metadata.textureIndexSize = dv.getUint8();
		metadata.materialIndexSize = dv.getUint8();
		metadata.boneIndexSize = dv.getUint8();
		metadata.morphIndexSize = dv.getUint8();
		metadata.rigidBodyIndexSize = dv.getUint8();
		metadata.modelName = dv.getTextBuffer();
		metadata.englishModelName = dv.getTextBuffer();
		metadata.comment = dv.getTextBuffer();
		metadata.englishComment = dv.getTextBuffer();

	};

	var parseVertices = function () {

		var parseVertex = function () {

			var p = {};
			p.position = dv.getFloat32Array( 3 );
			p.normal = dv.getFloat32Array( 3 );
			p.uv = dv.getFloat32Array( 2 );

			p.auvs = [];

			for ( var i = 0; i < pmx.metadata.additionalUvNum; i++ ) {

				p.auvs.push( dv.getFloat32Array( 4 ) );

			}

			p.type = dv.getUint8();

			var indexSize = metadata.boneIndexSize;

			if ( p.type === 0 ) {  // BDEF1

				p.skinIndices = dv.getIndexArray( indexSize, 1 );
				p.skinWeights = [ 1.0 ];

			} else if ( p.type === 1 ) {  // BDEF2

				p.skinIndices = dv.getIndexArray( indexSize, 2 );
				p.skinWeights = dv.getFloat32Array( 1 );
				p.skinWeights.push( 1.0 - p.skinWeights[ 0 ] );

			} else if ( p.type === 2 ) {  // BDEF4

				p.skinIndices = dv.getIndexArray( indexSize, 4 );
				p.skinWeights = dv.getFloat32Array( 4 );

			} else if ( p.type === 3 ) {  // SDEF

				p.skinIndices = dv.getIndexArray( indexSize, 2 );
				p.skinWeights = dv.getFloat32Array( 1 );
				p.skinWeights.push( 1.0 - p.skinWeights[ 0 ] );

				p.skinC = dv.getFloat32Array( 3 );
				p.skinR0 = dv.getFloat32Array( 3 );
				p.skinR1 = dv.getFloat32Array( 3 );

				// SDEF is not supported yet and is handled as BDEF2 so far.
				// TODO: SDEF support
				p.type = 1;

			} else {

				throw 'unsupport bone type ' + p.type + ' exception.';

			}

			p.edgeRatio = dv.getFloat32();
			return p;

		};

		var metadata = pmx.metadata;
		metadata.vertexCount = dv.getUint32();

		pmx.vertices = [];

		for ( var i = 0; i < metadata.vertexCount; i++ ) {

			pmx.vertices.push( parseVertex() );

		}

	};

	var parseFaces = function () {

		var parseFace = function () {

			var p = {};
			p.indices = dv.getIndexArray( metadata.vertexIndexSize, 3, true );
			return p;

		};

		var metadata = pmx.metadata;
		metadata.faceCount = dv.getUint32() / 3;

		pmx.faces = [];

		for ( var i = 0; i < metadata.faceCount; i++ ) {

			pmx.faces.push( parseFace() );

		}

	};

	var parseTextures = function () {

		var parseTexture = function () {

			return dv.getTextBuffer();

		};

		var metadata = pmx.metadata;
		metadata.textureCount = dv.getUint32();

		pmx.textures = [];

		for ( var i = 0; i < metadata.textureCount; i++ ) {

			pmx.textures.push( parseTexture() );

		}

	};

	var parseMaterials = function () {

		var parseMaterial = function () {

			var p = {};
			p.name = dv.getTextBuffer();
			p.englishName = dv.getTextBuffer();
			p.diffuse = dv.getFloat32Array( 4 );
			p.specular = dv.getFloat32Array( 3 );
			p.shininess = dv.getFloat32();
			p.ambient = dv.getFloat32Array( 3 );
			p.flag = dv.getUint8();
			p.edgeColor = dv.getFloat32Array( 4 );
			p.edgeSize = dv.getFloat32();
			p.textureIndex = dv.getIndex( pmx.metadata.textureIndexSize );
			p.envTextureIndex = dv.getIndex( pmx.metadata.textureIndexSize );
			p.envFlag = dv.getUint8();
			p.toonFlag = dv.getUint8();

			if ( p.toonFlag === 0 ) {

				p.toonIndex = dv.getIndex( pmx.metadata.textureIndexSize );

			} else if ( p.toonFlag === 1 ) {

				p.toonIndex = dv.getInt8();

			} else {

				throw 'unknown toon flag ' + p.toonFlag + ' exception.';

			}

			p.comment = dv.getTextBuffer();
			p.faceCount = dv.getUint32() / 3;
			return p;

		};

		var metadata = pmx.metadata;
		metadata.materialCount = dv.getUint32();

		pmx.materials = [];

		for ( var i = 0; i < metadata.materialCount; i++ ) {

			pmx.materials.push( parseMaterial() );

		}

	};

	var parseBones = function () {

		var parseBone = function () {

			var p = {};
			p.name = dv.getTextBuffer();
			p.englishName = dv.getTextBuffer();
			p.position = dv.getFloat32Array( 3 );
			p.parentIndex = dv.getIndex( pmx.metadata.boneIndexSize );
			p.transformationClass = dv.getUint32();
			p.flag = dv.getUint16();

			if ( p.flag & 0x1 ) {

				p.connectIndex = dv.getIndex( pmx.metadata.boneIndexSize );

			} else {

				p.offsetPosition = dv.getFloat32Array( 3 );

			}

			if ( p.flag & 0x100 || p.flag & 0x200 ) {

				// Note: I don't think Grant is an appropriate name
				//       but I found that some English translated MMD tools use this term
				//       so I've named it Grant so far.
				//       I'd rename to more appropriate name from Grant later.
				var grant = {};

				grant.isLocal = ( p.flag & 0x80 ) !== 0 ? true : false;
				grant.affectRotation = ( p.flag & 0x100 ) !== 0 ? true : false;
				grant.affectPosition = ( p.flag & 0x200 ) !== 0 ? true : false;
				grant.parentIndex = dv.getIndex( pmx.metadata.boneIndexSize );
				grant.ratio = dv.getFloat32();

				p.grant = grant;

			}

			if ( p.flag & 0x400 ) {

				p.fixAxis = dv.getFloat32Array( 3 );

			}

			if ( p.flag & 0x800 ) {

				p.localXVector = dv.getFloat32Array( 3 );
				p.localZVector = dv.getFloat32Array( 3 );

			}

			if ( p.flag & 0x2000 ) {

				p.key = dv.getUint32();

			}

			if ( p.flag & 0x20 ) {

				var ik = {};

				ik.effector = dv.getIndex( pmx.metadata.boneIndexSize );
				ik.target = null;
				ik.iteration = dv.getUint32();
				ik.maxAngle = dv.getFloat32();
				ik.linkCount = dv.getUint32();
				ik.links = [];

				for ( var i = 0; i < ik.linkCount; i++ ) {

					var link = {};
					link.index = dv.getIndex( pmx.metadata.boneIndexSize );
					link.angleLimitation = dv.getUint8();

					if ( link.angleLimitation === 1 ) {

						link.lowerLimitationAngle = dv.getFloat32Array( 3 );
						link.upperLimitationAngle = dv.getFloat32Array( 3 );

					}

					ik.links.push( link );

				}

				p.ik = ik;
			}

			return p;

		};

		var metadata = pmx.metadata;
		metadata.boneCount = dv.getUint32();

		pmx.bones = [];

		for ( var i = 0; i < metadata.boneCount; i++ ) {

			pmx.bones.push( parseBone() );

		}

	};

	var parseMorphs = function () {

		var parseMorph = function () {

			var p = {};
			p.name = dv.getTextBuffer();
			p.englishName = dv.getTextBuffer();
			p.panel = dv.getUint8();
			p.type = dv.getUint8();
			p.elementCount = dv.getUint32();
			p.elements = [];

			for ( var i = 0; i < p.elementCount; i++ ) {

				if ( p.type === 0 ) {  // group morph

					var m = {};
					m.index = dv.getIndex( pmx.metadata.morphIndexSize );
					m.ratio = dv.getFloat32();
					p.elements.push( m );

				} else if ( p.type === 1 ) {  // vertex morph

					var m = {};
					m.index = dv.getIndex( pmx.metadata.vertexIndexSize, true );
					m.position = dv.getFloat32Array( 3 );
					p.elements.push( m );

				} else if ( p.type === 2 ) {  // bone morph

					var m = {};
					m.index = dv.getIndex( pmx.metadata.boneIndexSize );
					m.position = dv.getFloat32Array( 3 );
					m.rotation = dv.getFloat32Array( 4 );
					p.elements.push( m );

				} else if ( p.type === 3 ) {  // uv morph

					var m = {};
					m.index = dv.getIndex( pmx.metadata.vertexIndexSize, true );
					m.uv = dv.getFloat32Array( 4 );
					p.elements.push( m );

				} else if ( p.type === 4 ) {  // additional uv1

					// TODO: implement

				} else if ( p.type === 5 ) {  // additional uv2

					// TODO: implement

				} else if ( p.type === 6 ) {  // additional uv3

					// TODO: implement

				} else if ( p.type === 7 ) {  // additional uv4

					// TODO: implement

				} else if ( p.type === 8 ) {  // material morph

					var m = {};
					m.index = dv.getIndex( pmx.metadata.materialIndexSize );
					m.type = dv.getUint8();
					m.diffuse = dv.getFloat32Array( 4 );
					m.specular = dv.getFloat32Array( 3 );
					m.shininess = dv.getFloat32();
					m.ambient = dv.getFloat32Array( 3 );
					m.edgeColor = dv.getFloat32Array( 4 );
					m.edgeSize = dv.getFloat32();
					m.textureColor = dv.getFloat32Array( 4 );
					m.sphereTextureColor = dv.getFloat32Array( 4 );
					m.toonColor = dv.getFloat32Array( 4 );
					p.elements.push( m );

				}

			}

			return p;

		};

		var metadata = pmx.metadata;
		metadata.morphCount = dv.getUint32();

		pmx.morphs = [];

		for ( var i = 0; i < metadata.morphCount; i++ ) {

			pmx.morphs.push( parseMorph() );

		}

	};

	var parseFrames = function () {

		var parseFrame = function () {

			var p = {};
			p.name = dv.getTextBuffer();
			p.englishName = dv.getTextBuffer();
			p.type = dv.getUint8();
			p.elementCount = dv.getUint32();
			p.elements = [];

			for ( var i = 0; i < p.elementCount; i++ ) {

				var e = {};
				e.target = dv.getUint8();
				e.index = ( e.target === 0 ) ? dv.getIndex( pmx.metadata.boneIndexSize ) : dv.getIndex( pmx.metadata.morphIndexSize );
				p.elements.push( e );

			}

			return p;

		};

		var metadata = pmx.metadata;
		metadata.frameCount = dv.getUint32();

		pmx.frames = [];

		for ( var i = 0; i < metadata.frameCount; i++ ) {

			pmx.frames.push( parseFrame() );

		}

	};

	var parseRigidBodies = function () {

		var parseRigidBody = function () {

			var p = {};
			p.name = dv.getTextBuffer();
			p.englishName = dv.getTextBuffer();
			p.boneIndex = dv.getIndex( pmx.metadata.boneIndexSize );
			p.groupIndex = dv.getUint8();
			p.groupTarget = dv.getUint16();
			p.shapeType = dv.getUint8();
			p.width = dv.getFloat32();
			p.height = dv.getFloat32();
			p.depth = dv.getFloat32();
			p.position = dv.getFloat32Array( 3 );
			p.rotation = dv.getFloat32Array( 3 );
			p.weight = dv.getFloat32();
			p.positionDamping = dv.getFloat32();
			p.rotationDamping = dv.getFloat32();
			p.restitution = dv.getFloat32();
			p.friction = dv.getFloat32();
			p.type = dv.getUint8();
			return p;

		};

		var metadata = pmx.metadata;
		metadata.rigidBodyCount = dv.getUint32();

		pmx.rigidBodies = [];

		for ( var i = 0; i < metadata.rigidBodyCount; i++ ) {

			pmx.rigidBodies.push( parseRigidBody() );

		}

	};

	var parseConstraints = function () {

		var parseConstraint = function () {

			var p = {};
			p.name = dv.getTextBuffer();
			p.englishName = dv.getTextBuffer();
			p.type = dv.getUint8();
			p.rigidBodyIndex1 = dv.getIndex( pmx.metadata.rigidBodyIndexSize );
			p.rigidBodyIndex2 = dv.getIndex( pmx.metadata.rigidBodyIndexSize );
			p.position = dv.getFloat32Array( 3 );
			p.rotation = dv.getFloat32Array( 3 );
			p.translationLimitation1 = dv.getFloat32Array( 3 );
			p.translationLimitation2 = dv.getFloat32Array( 3 );
			p.rotationLimitation1 = dv.getFloat32Array( 3 );
			p.rotationLimitation2 = dv.getFloat32Array( 3 );
			p.springPosition = dv.getFloat32Array( 3 );
			p.springRotation = dv.getFloat32Array( 3 );
			return p;

		};

		var metadata = pmx.metadata;
		metadata.constraintCount = dv.getUint32();

		pmx.constraints = [];

		for ( var i = 0; i < metadata.constraintCount; i++ ) {

			pmx.constraints.push( parseConstraint() );

		}

	};

	parseHeader();
	parseVertices();
	parseFaces();
	parseTextures();
	parseMaterials();
	parseBones();
	parseMorphs();
	parseFrames();
	parseRigidBodies();
	parseConstraints();

	if ( leftToRight === true ) this.leftToRightModel( pmx );

	// console.log( pmx ); // for console debug

	return pmx;

};

Parser.prototype.parseVmd = function ( buffer, leftToRight ) {

	var vmd = {};
	var dv = new DataViewEx( buffer );

	vmd.metadata = {};
	vmd.metadata.coordinateSystem = 'left';

	var parseHeader = function () {

		var metadata = vmd.metadata;
		metadata.magic = dv.getChars( 30 );

		if ( metadata.magic !== 'Vocaloid Motion Data 0002' ) {

			throw 'VMD file magic is not Vocaloid Motion Data 0002, but ' + metadata.magic;

		}

		metadata.name = dv.getSjisStringsAsUnicode( 20 );

	};

	var parseMotions = function () {

		var parseMotion = function () {

			var p = {};
			p.boneName = dv.getSjisStringsAsUnicode( 15 );
			p.frameNum = dv.getUint32();
			p.position = dv.getFloat32Array( 3 );
			p.rotation = dv.getFloat32Array( 4 );
			p.interpolation = dv.getUint8Array( 64 );
			return p;

		};

		var metadata = vmd.metadata;
		metadata.motionCount = dv.getUint32();

		vmd.motions = [];
		for ( var i = 0; i < metadata.motionCount; i++ ) {

			vmd.motions.push( parseMotion() );

		}

	};

	var parseMorphs = function () {

		var parseMorph = function () {

			var p = {};
			p.morphName = dv.getSjisStringsAsUnicode( 15 );
			p.frameNum = dv.getUint32();
			p.weight = dv.getFloat32();
			return p;

		};

		var metadata = vmd.metadata;
		metadata.morphCount = dv.getUint32();

		vmd.morphs = [];
		for ( var i = 0; i < metadata.morphCount; i++ ) {

			vmd.morphs.push( parseMorph() );

		}

	};

	var parseCameras = function () {

		var parseCamera = function () {

			var p = {};
			p.frameNum = dv.getUint32();
			p.distance = dv.getFloat32();
			p.position = dv.getFloat32Array( 3 );
			p.rotation = dv.getFloat32Array( 3 );
			p.interpolation = dv.getUint8Array( 24 );
			p.fov = dv.getUint32();
			p.perspective = dv.getUint8();
			return p;

		};

		var metadata = vmd.metadata;
		metadata.cameraCount = dv.getUint32();

		vmd.cameras = [];
		for ( var i = 0; i < metadata.cameraCount; i++ ) {

			vmd.cameras.push( parseCamera() );

		}

	};

	parseHeader();
	parseMotions();
	parseMorphs();
	parseCameras();

	if ( leftToRight === true ) this.leftToRightVmd( vmd );

	// console.log( vmd ); // for console debug

	return vmd;

};

Parser.prototype.parseVpd = function ( text, leftToRight ) {

	var vpd = {};

	vpd.metadata = {};
	vpd.metadata.coordinateSystem = 'left';

	vpd.bones = [];

	var commentPatternG = /\/\/\w*(\r|\n|\r\n)/g;
	var newlinePattern = /\r|\n|\r\n/;

	var lines = text.replace( commentPatternG, '' ).split( newlinePattern );

	function throwError () {

		throw 'the file seems not vpd file.';

	}

	function checkMagic () {

		if ( lines[ 0 ] !== 'Vocaloid Pose Data file' ) {

			throwError();

		}

	}

	function parseHeader () {

		if ( lines.length < 4 ) {

			throwError();

		}

		vpd.metadata.parentFile = lines[ 2 ];
		vpd.metadata.boneCount = parseInt( lines[ 3 ] );

	}

	function parseBones () {

		var boneHeaderPattern = /^\s*(Bone[0-9]+)\s*\{\s*(.*)$/;
		var boneVectorPattern = /^\s*(-?[0-9]+\.[0-9]+)\s*,\s*(-?[0-9]+\.[0-9]+)\s*,\s*(-?[0-9]+\.[0-9]+)\s*;/;
		var boneQuaternionPattern = /^\s*(-?[0-9]+\.[0-9]+)\s*,\s*(-?[0-9]+\.[0-9]+)\s*,\s*(-?[0-9]+\.[0-9]+)\s*,\s*(-?[0-9]+\.[0-9]+)\s*;/;
		var boneFooterPattern = /^\s*}/;

		var bones = vpd.bones;
		var n = null;
		var v = null;
		var q = null;

		for ( var i = 4; i < lines.length; i++ ) {

			var line = lines[ i ];

			var result;

			result = line.match( boneHeaderPattern );

			if ( result !== null ) {

				if ( n !== null ) {

					throwError();

				}

				n = result[ 2 ];

			}

			result = line.match( boneVectorPattern );

			if ( result !== null ) {

				if ( v !== null ) {

					throwError();

				}

				v = [

					parseFloat( result[ 1 ] ),
					parseFloat( result[ 2 ] ),
					parseFloat( result[ 3 ] )

				];

			}

			result = line.match( boneQuaternionPattern );

			if ( result !== null ) {

				if ( q !== null ) {

					throwError();

				}

				q = [

					parseFloat( result[ 1 ] ),
					parseFloat( result[ 2 ] ),
					parseFloat( result[ 3 ] ),
					parseFloat( result[ 4 ] )

				];


			}

			result = line.match( boneFooterPattern );

			if ( result !== null ) {

				if ( n === null || v === null || q === null ) {

					throwError();

				}

				bones.push( {

					name: n,
					translation: v,
					quaternion: q

				} );

				n = null;
				v = null;
				q = null;

			}

		}

		if ( n !== null || v !== null || q !== null ) {

			throwError();

		}

	}

	checkMagic();
	parseHeader();
	parseBones();

	if ( leftToRight === true ) this.leftToRightVpd( vpd );

	// console.log( vpd );  // for console debug

	return vpd;

};

Parser.prototype.mergeVmds = function ( vmds ) {

	var v = {};
	v.metadata = {};
	v.metadata.name = vmds[ 0 ].metadata.name;
	v.metadata.coordinateSystem = vmds[ 0 ].metadata.coordinateSystem;
	v.metadata.motionCount = 0;
	v.metadata.morphCount = 0;
	v.metadata.cameraCount = 0;
	v.motions = [];
	v.morphs = [];
	v.cameras = [];

	for ( var i = 0; i < vmds.length; i++ ) {

		var v2 = vmds[ i ];

		v.metadata.motionCount += v2.metadata.motionCount;
		v.metadata.morphCount += v2.metadata.morphCount;
		v.metadata.cameraCount += v2.metadata.cameraCount;

		for ( var j = 0; j < v2.metadata.motionCount; j++ ) {

			v.motions.push( v2.motions[ j ] );

		}

		for ( var j = 0; j < v2.metadata.morphCount; j++ ) {

			v.morphs.push( v2.morphs[ j ] );

		}

		for ( var j = 0; j < v2.metadata.cameraCount; j++ ) {

			v.cameras.push( v2.cameras[ j ] );

		}

	}

	return v;

};

Parser.prototype.leftToRightModel = function ( model ) {

	if ( model.metadata.coordinateSystem === 'right' ) {

		return;

	}

	model.metadata.coordinateSystem = 'right';

	var helper = new DataCreationHelper();

	for ( var i = 0; i < model.metadata.vertexCount; i++ ) {

		helper.leftToRightVector3( model.vertices[ i ].position );
		helper.leftToRightVector3( model.vertices[ i ].normal );

	}

	for ( var i = 0; i < model.metadata.faceCount; i++ ) {

		helper.leftToRightIndexOrder( model.faces[ i ].indices );

	}

	for ( var i = 0; i < model.metadata.boneCount; i++ ) {

		helper.leftToRightVector3( model.bones[ i ].position );

	}

	// TODO: support other morph for PMX
	for ( var i = 0; i < model.metadata.morphCount; i++ ) {

		var m = model.morphs[ i ];

		if ( model.metadata.format === 'pmx' && m.type !== 1 ) {

			// TODO: implement
			continue;

		}

		for ( var j = 0; j < m.elements.length; j++ ) {

			helper.leftToRightVector3( m.elements[ j ].position );

		}

	}

	for ( var i = 0; i < model.metadata.rigidBodyCount; i++ ) {

		helper.leftToRightVector3( model.rigidBodies[ i ].position );
		helper.leftToRightEuler( model.rigidBodies[ i ].rotation );

	}

	for ( var i = 0; i < model.metadata.constraintCount; i++ ) {

		helper.leftToRightVector3( model.constraints[ i ].position );
		helper.leftToRightEuler( model.constraints[ i ].rotation );
		helper.leftToRightVector3Range( model.constraints[ i ].translationLimitation1, model.constraints[ i ].translationLimitation2 );
		helper.leftToRightEulerRange( model.constraints[ i ].rotationLimitation1, model.constraints[ i ].rotationLimitation2 );

	}

};

Parser.prototype.leftToRightVmd = function ( vmd ) {

	if ( vmd.metadata.coordinateSystem === 'right' ) {

		return;

	}

	vmd.metadata.coordinateSystem = 'right';

	var helper = new DataCreationHelper();

	for ( var i = 0; i < vmd.metadata.motionCount; i++ ) {

		helper.leftToRightVector3( vmd.motions[ i ].position );
		helper.leftToRightQuaternion( vmd.motions[ i ].rotation );

	}

	for ( var i = 0; i < vmd.metadata.cameraCount; i++ ) {

		helper.leftToRightVector3( vmd.cameras[ i ].position );
		helper.leftToRightEuler( vmd.cameras[ i ].rotation );

	}

};

Parser.prototype.leftToRightVpd = function ( vpd ) {

	if ( vpd.metadata.coordinateSystem === 'right' ) {

		return;

	}

	vpd.metadata.coordinateSystem = 'right';

	var helper = new DataCreationHelper();

	for ( var i = 0; i < vpd.bones.length; i++ ) {

		helper.leftToRightVector3( vpd.bones[ i ].translation );
		helper.leftToRightQuaternion( vpd.bones[ i ].quaternion );

	}

};

exports.CharsetEncoder = CharsetEncoder;
exports.Parser = Parser;

Object.defineProperty(exports, '__esModule', { value: true });

})));


/***/ })
/******/ ]);