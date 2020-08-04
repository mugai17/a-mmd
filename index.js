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

require('three/examples/js/loaders/TGALoader');
require('three/examples/js/loaders/MMDLoader');
require('three/examples/js/animation/CCDIKSolver');
require('three/examples/js/animation/MMDPhysics');
require('three/examples/js/animation/MMDAnimationHelper');

// used in MMDLoader
var MMDParser = require('mmd-parser');
if (window) window.MMDParser = MMDParser;

var mmdLoader = new THREE.MMDLoader();
var mmdHelper = new THREE.MMDAnimationHelper();

AFRAME.registerComponent('mmd', {
  schema: {
    audio: {
      type: 'asset'
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
    this.loader = new THREE.AudioLoader();
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
    this.stop();
    this.helper = null;
  },

  tick: function (time, delta) {
    if (!this.playing) { return; }
    this.helper.update(delta / 1000);
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
    var afterglow = this.data.afterglow;
    var params = {};
    if (afterglow !== 0) {
      params.afterglow = afterglow;
    }

    // one MMDHelper instance per a mmd component
    this.helper = new THREE.MMDAnimationHelper(params);
  },

  load: function () {
    var audioUrl = this.data.audio;
    if (audioUrl === '') { return; }

    var self = this;
    var volume = this.data.volume;
    var audioDelayTime = this.data.audioDelayTime;
    var loader = this.loader;
    var helper = this.helper;

    loader.load(audioUrl, function (buffer) {
      var listener = new THREE.AudioListener();
      var audio = new THREE.Audio(listener).setBuffer(buffer);

      if (volume !== 1.0) { audio.setVolume(volume); }
      listener.position.z = 1;

      var params = {};
      if (audioDelayTime !== 0) {
        params.delayTime = audioDelayTime;
      }
      helper.add(audio, params);

      self.setupModelsIfReady();
    });
  },

  getMMDEntities: function () {
    var entities = this.el.querySelectorAll('a-entity, a-mmd-model');
    return Array.from(entities).filter(function (entity) {
      return entity.getAttribute('mmd-model') !== null;
    });
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
    var autoplay = this.data.autoplay;

    var entities = this.getMMDEntities();

    for(var i = 0, il = entities.length; i < il; i++) {
      var mesh = entities[i].getObject3D('mesh');
      if (mesh !== undefined) {
        helper.add(mesh, mesh.params);
      }
    }

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
    var animation = mmdLoader.animationBuilder.build(vmd, mesh);
    mesh.params.animation.push(animation);

    var objects = this.helper.objects.get(mesh);
    if (objects.mixer === null || objects.mixer === undefined) {
      objects.mixer = new THREE.AnimationMixer(mesh);
    }
    var action = objects.mixer.clipAction(animation);
    action.play();
    action.weight = mesh.params.animation.length;
  },

  removeBlinkFromMorphAnimations: function (mesh, blinkMorphName) {
    if (mesh.params.animation === undefined) { return; }
    if (mesh.morphTargetDictionary === undefined) { return; }

    var index = mesh.morphTargetDictionary[ blinkMorphName ];

    if (index === undefined) { return; }

    for (var i = 0, il = mesh.params.animation.length; i < il; i++ ) {
      var tracks = mesh.params.animation[i].tracks;
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
    if (!this.data.model) { return; }
    this.remove();
    this.load();
  },

  remove: function () {
    if (!this.model) { return; }
    this.el.removeObject3D('mesh');
  },

  load: function () {
    var modelUrl = this.data.model;
    if (modelUrl === '') { return; }

    var self = this;
    var el = this.el;
    var vpdUrl = this.data.vpd;
    var vmdUrl = this.data.vmd;
    var physicsFlag = this.data.physics;
    var loader = this.loader;
    var helper = this.helper;

    function loadModel () {
      loader.load(modelUrl, function (mesh) {
        mesh.params = {
          animation: [],
          physics: physicsFlag
        };

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
      loader.loadVPD(vpdUrl, false, function (vpd) {
        helper.pose(mesh, vpd);
        setup(mesh);
      });
    }

    function loadVmd (mesh) {
      var urls = vmdUrl.replace(/\s/g, '').split(',');
      loader.loadAnimation(urls, mesh, function (animation) {
        mesh.params.animation.push(animation);
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

    loadModel();
  }
});

AFRAME.registerPrimitive('a-mmd', {
  mappings: {
    'audio'            : 'mmd.audio',
    'autoplay'         : 'mmd.autoplay',
    'volume'           : 'mmd.volume',
    'audio-delay-time' : 'mmd.audioDelayTime',
    'afterglow'        : 'mmd.afterglow'
  }
});

AFRAME.registerPrimitive('a-mmd-model', {
  mappings: {
    'model'   : 'mmd-model.model',
    'vpd'     : 'mmd-model.vpd',
    'vmd'     : 'mmd-model.vmd',
    'physics' : 'mmd-model.physics',
    'blink'   : 'mmd-model.blink'
  }
});
