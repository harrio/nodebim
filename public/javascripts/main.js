/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
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
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _tween = __webpack_require__(1);
	
	var _tween2 = _interopRequireDefault(_tween);
	
	var _Navigator = __webpack_require__(2);
	
	var Navigator = _interopRequireWildcard(_Navigator);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/* global THREE */
	
	
	var object = void 0;
	
	var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
	var controls = new THREE.VRControls(camera);
	var dolly = new THREE.Group();
	var raycaster = new THREE.Raycaster();
	var renderer = new THREE.WebGLRenderer({ antialias: true });
	var effect = new THREE.VREffect(renderer);
	var scene = new THREE.Scene();
	
	var manager = new THREE.LoadingManager();
	var loader = new THREE.JSONLoader(manager);
	
	var beaconGroup = void 0,
	    crosshair = void 0,
	    VRManager = void 0;
	
	var init = function init() {
	  camera.position.set(0, 5, 10);
	
	  crosshair = Navigator.initCrosshair();
	  camera.add(crosshair);
	
	  renderer.setPixelRatio(window.devicePixelRatio);
	
	  var container = document.getElementById('viewport');
	  container.appendChild(renderer.domElement);
	
	  controls.standing = true;
	
	  dolly.add(camera);
	
	  beaconGroup = Navigator.createBeacons();
	
	  var skybox = createSkybox();
	  var ground = createGround();
	  var lights = createLights();
	  scene.add(dolly, beaconGroup, skybox, ground, lights.hemiLight, lights.directionalLight);
	
	  effect.setSize(window.innerWidth, window.innerHeight);
	  VRManager = new WebVRManager(renderer, effect);
	
	  setResizeListeners();
	  requestAnimationFrame(animate);
	};
	
	var setResizeListeners = function setResizeListeners() {
	  window.addEventListener('resize', onWindowResize, true);
	  window.addEventListener('vrdisplaypresentchange', onWindowResize, true);
	};
	
	var createSkybox = function createSkybox() {
	  var vertexShader = document.getElementById('vertexShader').textContent;
	  var fragmentShader = document.getElementById('fragmentShader').textContent;
	  var uniforms = {
	    topColor: { type: 'c', value: new THREE.Color(0x0077ff) },
	    bottomColor: { type: 'c', value: new THREE.Color(0xffffff) },
	    offset: { type: 'f', value: 33 },
	    exponent: { type: 'f', value: 0.6 }
	  };
	
	  var skyGeo = new THREE.SphereGeometry(4000, 32, 15);
	  var skyMat = new THREE.ShaderMaterial({ vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide });
	  return new THREE.Mesh(skyGeo, skyMat);
	};
	
	var createGround = function createGround() {
	  var geometry = new THREE.PlaneGeometry(100, 100);
	  var material = new THREE.MeshLambertMaterial({ color: 0x7cc000, side: THREE.DoubleSide });
	  var plane = new THREE.Mesh(geometry, material);
	  plane.rotation.x = Math.PI / 180 * 90;
	  return plane;
	};
	
	var createLights = function createLights() {
	  var hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.7);
	  hemiLight.name = 'hemiLight';
	
	  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	  directionalLight.position.set(50, 50, 50);
	  directionalLight.name = 'dirLight';
	
	  return {
	    hemiLight: hemiLight,
	    directionalLight: directionalLight
	  };
	};
	
	var addObject = function addObject(geometry, materials) {
	  geometry.mergeVertices();
	  object = new THREE.Mesh(geometry, new THREE.MultiMaterial(materials));
	  object.rotation.x = -Math.PI / 2;
	  scene.add(object);
	};
	
	var loadModel = function loadModel(name) {
	  scene.remove(object);
	  // load a resource
	  loader.load(name, addObject);
	};
	
	function onWindowResize() {
	  camera.aspect = window.innerWidth / window.innerHeight;
	  effect.setSize(window.innerWidth, window.innerHeight);
	  camera.updateProjectionMatrix();
	}
	
	var lastRender = 0;
	function animate(timestamp) {
	  requestAnimationFrame(animate);
	  lastRender = timestamp;
	  controls.update();
	  render();
	
	  VRManager.render(scene, camera, timestamp, function () {});
	}
	
	var getIntersectedBeacon = function getIntersectedBeacon() {
	  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
	  var intersects = raycaster.intersectObjects(beaconGroup.children);
	  if (intersects.length < 1) {
	    return null;
	  }
	  return intersects[0].object;
	};
	
	var setBeaconHighlight = function setBeaconHighlight(beacon) {
	  beacon.material.color.setHex(0x00ff00);
	};
	
	var removeBeaconHighlight = function removeBeaconHighlight(beacon) {
	  beacon.material.color.setHex(0xff0000);
	  beacon.timestamp = null;
	};
	
	var tween = null;
	var moveDollyToBeaconPosition = function moveDollyToBeaconPosition(dolly, intersectedBeacon) {
	  var tweenPos = { x: dolly.position.x, y: dolly.position.y, z: dolly.position.z };
	  tween = new _tween2.default.Tween(tweenPos).to({
	    x: intersectedBeacon.position.x,
	    y: intersectedBeacon.position.y - 1,
	    z: intersectedBeacon.position.z }, 1000);
	
	  tween.onUpdate(function () {
	    dolly.position.set(tweenPos.x, tweenPos.y, tweenPos.z);
	  });
	
	  tween.onComplete(function () {
	    tween = null;
	  });
	
	  tween.easing(_tween2.default.Easing.Quadratic.In);
	  tween.start();
	};
	
	var intersectedBeacon = null;
	var render = function render() {
	  var obj = getIntersectedBeacon();
	
	  if (!obj || tween) {
	    // clear previous highlight if any and reset timer
	    if (intersectedBeacon) {
	      removeBeaconHighlight(intersectedBeacon);
	    }
	    intersectedBeacon = null;
	    crosshair.material = Navigator.createCrosshairMaterial(0xffffff);
	  } else {
	    if (intersectedBeacon && intersectedBeacon != obj) {
	      // clear previous highlight
	      removeBeaconHighlight(intersectedBeacon);
	    }
	    // highlight crosshair and beacon and start stare timer
	    crosshair.material = Navigator.createCrosshairMaterial(0x00ffff);
	    intersectedBeacon = obj;
	    setBeaconHighlight(intersectedBeacon);
	    if (!intersectedBeacon.timestamp) intersectedBeacon.timestamp = Date.now();
	
	    if (Date.now() - intersectedBeacon.timestamp > 2000) {
	      // 2 second stare duration
	      crosshair.material = Navigator.createCrosshairMaterial(0xffffff);
	      removeBeaconHighlight(intersectedBeacon);
	      moveDollyToBeaconPosition(dolly, intersectedBeacon);
	    }
	  }
	
	  if (tween) {
	    _tween2.default.update();
	  }
	};
	
	var showUpload = function showUpload() {
	  var el = document.querySelectorAll('.upload-form')[0];
	  el.style.display = 'block';
	};
	
	var hideUpload = function hideUpload() {
	  var el = document.querySelectorAll('.upload-form')[0];
	  el.style.display = 'none';
	};
	
	window.onload = function () {
	  init();
	};
	
	window.loadModel = loadModel;
	window.showUpload = showUpload;
	window.hideUpload = hideUpload;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * Tween.js - Licensed under the MIT license
	 * https://github.com/tweenjs/tween.js
	 * ----------------------------------------------
	 *
	 * See https://github.com/tweenjs/tween.js/graphs/contributors for the full list of contributors.
	 * Thank you all, you're awesome!
	 */
	
	// Include a performance.now polyfill
	(function () {
	
		if ('performance' in window === false) {
			window.performance = {};
		}
	
		// IE 8
		Date.now = (Date.now || function () {
			return new Date().getTime();
		});
	
		if ('now' in window.performance === false) {
			var offset = window.performance.timing && window.performance.timing.navigationStart ? window.performance.timing.navigationStart
			                                                                                    : Date.now();
	
			window.performance.now = function () {
				return Date.now() - offset;
			};
		}
	
	})();
	
	var TWEEN = TWEEN || (function () {
	
		var _tweens = [];
	
		return {
	
			getAll: function () {
	
				return _tweens;
	
			},
	
			removeAll: function () {
	
				_tweens = [];
	
			},
	
			add: function (tween) {
	
				_tweens.push(tween);
	
			},
	
			remove: function (tween) {
	
				var i = _tweens.indexOf(tween);
	
				if (i !== -1) {
					_tweens.splice(i, 1);
				}
	
			},
	
			update: function (time) {
	
				if (_tweens.length === 0) {
					return false;
				}
	
				var i = 0;
	
				time = time !== undefined ? time : window.performance.now();
	
				while (i < _tweens.length) {
	
					if (_tweens[i].update(time)) {
						i++;
					} else {
						_tweens.splice(i, 1);
					}
	
				}
	
				return true;
	
			}
		};
	
	})();
	
	TWEEN.Tween = function (object) {
	
		var _object = object;
		var _valuesStart = {};
		var _valuesEnd = {};
		var _valuesStartRepeat = {};
		var _duration = 1000;
		var _repeat = 0;
		var _yoyo = false;
		var _isPlaying = false;
		var _reversed = false;
		var _delayTime = 0;
		var _startTime = null;
		var _easingFunction = TWEEN.Easing.Linear.None;
		var _interpolationFunction = TWEEN.Interpolation.Linear;
		var _chainedTweens = [];
		var _onStartCallback = null;
		var _onStartCallbackFired = false;
		var _onUpdateCallback = null;
		var _onCompleteCallback = null;
		var _onStopCallback = null;
	
		// Set all starting values present on the target object
		for (var field in object) {
			_valuesStart[field] = parseFloat(object[field], 10);
		}
	
		this.to = function (properties, duration) {
	
			if (duration !== undefined) {
				_duration = duration;
			}
	
			_valuesEnd = properties;
	
			return this;
	
		};
	
		this.start = function (time) {
	
			TWEEN.add(this);
	
			_isPlaying = true;
	
			_onStartCallbackFired = false;
	
			_startTime = time !== undefined ? time : window.performance.now();
			_startTime += _delayTime;
	
			for (var property in _valuesEnd) {
	
				// Check if an Array was provided as property value
				if (_valuesEnd[property] instanceof Array) {
	
					if (_valuesEnd[property].length === 0) {
						continue;
					}
	
					// Create a local copy of the Array with the start value at the front
					_valuesEnd[property] = [_object[property]].concat(_valuesEnd[property]);
	
				}
	
				// If `to()` specifies a property that doesn't exist in the source object,
				// we should not set that property in the object
				if (_valuesStart[property] === undefined) {
					continue;
				}
	
				_valuesStart[property] = _object[property];
	
				if ((_valuesStart[property] instanceof Array) === false) {
					_valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
				}
	
				_valuesStartRepeat[property] = _valuesStart[property] || 0;
	
			}
	
			return this;
	
		};
	
		this.stop = function () {
	
			if (!_isPlaying) {
				return this;
			}
	
			TWEEN.remove(this);
			_isPlaying = false;
	
			if (_onStopCallback !== null) {
				_onStopCallback.call(_object);
			}
	
			this.stopChainedTweens();
			return this;
	
		};
	
		this.stopChainedTweens = function () {
	
			for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
				_chainedTweens[i].stop();
			}
	
		};
	
		this.delay = function (amount) {
	
			_delayTime = amount;
			return this;
	
		};
	
		this.repeat = function (times) {
	
			_repeat = times;
			return this;
	
		};
	
		this.yoyo = function (yoyo) {
	
			_yoyo = yoyo;
			return this;
	
		};
	
	
		this.easing = function (easing) {
	
			_easingFunction = easing;
			return this;
	
		};
	
		this.interpolation = function (interpolation) {
	
			_interpolationFunction = interpolation;
			return this;
	
		};
	
		this.chain = function () {
	
			_chainedTweens = arguments;
			return this;
	
		};
	
		this.onStart = function (callback) {
	
			_onStartCallback = callback;
			return this;
	
		};
	
		this.onUpdate = function (callback) {
	
			_onUpdateCallback = callback;
			return this;
	
		};
	
		this.onComplete = function (callback) {
	
			_onCompleteCallback = callback;
			return this;
	
		};
	
		this.onStop = function (callback) {
	
			_onStopCallback = callback;
			return this;
	
		};
	
		this.update = function (time) {
	
			var property;
			var elapsed;
			var value;
	
			if (time < _startTime) {
				return true;
			}
	
			if (_onStartCallbackFired === false) {
	
				if (_onStartCallback !== null) {
					_onStartCallback.call(_object);
				}
	
				_onStartCallbackFired = true;
	
			}
	
			elapsed = (time - _startTime) / _duration;
			elapsed = elapsed > 1 ? 1 : elapsed;
	
			value = _easingFunction(elapsed);
	
			for (property in _valuesEnd) {
	
				// Don't update properties that do not exist in the source object
				if (_valuesStart[property] === undefined) {
					continue;
				}
	
				var start = _valuesStart[property] || 0;
				var end = _valuesEnd[property];
	
				if (end instanceof Array) {
	
					_object[property] = _interpolationFunction(end, value);
	
				} else {
	
					// Parses relative end values with start as base (e.g.: +10, -3)
					if (typeof (end) === 'string') {
	
						if (end.startsWith('+') || end.startsWith('-')) {
							end = start + parseFloat(end, 10);
						} else {
							end = parseFloat(end, 10);
						}
					}
	
					// Protect against non numeric properties.
					if (typeof (end) === 'number') {
						_object[property] = start + (end - start) * value;
					}
	
				}
	
			}
	
			if (_onUpdateCallback !== null) {
				_onUpdateCallback.call(_object, value);
			}
	
			if (elapsed === 1) {
	
				if (_repeat > 0) {
	
					if (isFinite(_repeat)) {
						_repeat--;
					}
	
					// Reassign starting values, restart by making startTime = now
					for (property in _valuesStartRepeat) {
	
						if (typeof (_valuesEnd[property]) === 'string') {
							_valuesStartRepeat[property] = _valuesStartRepeat[property] + parseFloat(_valuesEnd[property], 10);
						}
	
						if (_yoyo) {
							var tmp = _valuesStartRepeat[property];
	
							_valuesStartRepeat[property] = _valuesEnd[property];
							_valuesEnd[property] = tmp;
						}
	
						_valuesStart[property] = _valuesStartRepeat[property];
	
					}
	
					if (_yoyo) {
						_reversed = !_reversed;
					}
	
					_startTime = time + _delayTime;
	
					return true;
	
				} else {
	
					if (_onCompleteCallback !== null) {
						_onCompleteCallback.call(_object);
					}
	
					for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
						// Make the chained tweens start exactly at the time they should,
						// even if the `update()` method was called way past the duration of the tween
						_chainedTweens[i].start(_startTime + _duration);
					}
	
					return false;
	
				}
	
			}
	
			return true;
	
		};
	
	};
	
	
	TWEEN.Easing = {
	
		Linear: {
	
			None: function (k) {
	
				return k;
	
			}
	
		},
	
		Quadratic: {
	
			In: function (k) {
	
				return k * k;
	
			},
	
			Out: function (k) {
	
				return k * (2 - k);
	
			},
	
			InOut: function (k) {
	
				if ((k *= 2) < 1) {
					return 0.5 * k * k;
				}
	
				return - 0.5 * (--k * (k - 2) - 1);
	
			}
	
		},
	
		Cubic: {
	
			In: function (k) {
	
				return k * k * k;
	
			},
	
			Out: function (k) {
	
				return --k * k * k + 1;
	
			},
	
			InOut: function (k) {
	
				if ((k *= 2) < 1) {
					return 0.5 * k * k * k;
				}
	
				return 0.5 * ((k -= 2) * k * k + 2);
	
			}
	
		},
	
		Quartic: {
	
			In: function (k) {
	
				return k * k * k * k;
	
			},
	
			Out: function (k) {
	
				return 1 - (--k * k * k * k);
	
			},
	
			InOut: function (k) {
	
				if ((k *= 2) < 1) {
					return 0.5 * k * k * k * k;
				}
	
				return - 0.5 * ((k -= 2) * k * k * k - 2);
	
			}
	
		},
	
		Quintic: {
	
			In: function (k) {
	
				return k * k * k * k * k;
	
			},
	
			Out: function (k) {
	
				return --k * k * k * k * k + 1;
	
			},
	
			InOut: function (k) {
	
				if ((k *= 2) < 1) {
					return 0.5 * k * k * k * k * k;
				}
	
				return 0.5 * ((k -= 2) * k * k * k * k + 2);
	
			}
	
		},
	
		Sinusoidal: {
	
			In: function (k) {
	
				return 1 - Math.cos(k * Math.PI / 2);
	
			},
	
			Out: function (k) {
	
				return Math.sin(k * Math.PI / 2);
	
			},
	
			InOut: function (k) {
	
				return 0.5 * (1 - Math.cos(Math.PI * k));
	
			}
	
		},
	
		Exponential: {
	
			In: function (k) {
	
				return k === 0 ? 0 : Math.pow(1024, k - 1);
	
			},
	
			Out: function (k) {
	
				return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);
	
			},
	
			InOut: function (k) {
	
				if (k === 0) {
					return 0;
				}
	
				if (k === 1) {
					return 1;
				}
	
				if ((k *= 2) < 1) {
					return 0.5 * Math.pow(1024, k - 1);
				}
	
				return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);
	
			}
	
		},
	
		Circular: {
	
			In: function (k) {
	
				return 1 - Math.sqrt(1 - k * k);
	
			},
	
			Out: function (k) {
	
				return Math.sqrt(1 - (--k * k));
	
			},
	
			InOut: function (k) {
	
				if ((k *= 2) < 1) {
					return - 0.5 * (Math.sqrt(1 - k * k) - 1);
				}
	
				return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
	
			}
	
		},
	
		Elastic: {
	
			In: function (k) {
	
				var s;
				var a = 0.1;
				var p = 0.4;
	
				if (k === 0) {
					return 0;
				}
	
				if (k === 1) {
					return 1;
				}
	
				if (!a || a < 1) {
					a = 1;
					s = p / 4;
				} else {
					s = p * Math.asin(1 / a) / (2 * Math.PI);
				}
	
				return - (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
	
			},
	
			Out: function (k) {
	
				var s;
				var a = 0.1;
				var p = 0.4;
	
				if (k === 0) {
					return 0;
				}
	
				if (k === 1) {
					return 1;
				}
	
				if (!a || a < 1) {
					a = 1;
					s = p / 4;
				} else {
					s = p * Math.asin(1 / a) / (2 * Math.PI);
				}
	
				return (a * Math.pow(2, - 10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
	
			},
	
			InOut: function (k) {
	
				var s;
				var a = 0.1;
				var p = 0.4;
	
				if (k === 0) {
					return 0;
				}
	
				if (k === 1) {
					return 1;
				}
	
				if (!a || a < 1) {
					a = 1;
					s = p / 4;
				} else {
					s = p * Math.asin(1 / a) / (2 * Math.PI);
				}
	
				if ((k *= 2) < 1) {
					return - 0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
				}
	
				return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;
	
			}
	
		},
	
		Back: {
	
			In: function (k) {
	
				var s = 1.70158;
	
				return k * k * ((s + 1) * k - s);
	
			},
	
			Out: function (k) {
	
				var s = 1.70158;
	
				return --k * k * ((s + 1) * k + s) + 1;
	
			},
	
			InOut: function (k) {
	
				var s = 1.70158 * 1.525;
	
				if ((k *= 2) < 1) {
					return 0.5 * (k * k * ((s + 1) * k - s));
				}
	
				return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
	
			}
	
		},
	
		Bounce: {
	
			In: function (k) {
	
				return 1 - TWEEN.Easing.Bounce.Out(1 - k);
	
			},
	
			Out: function (k) {
	
				if (k < (1 / 2.75)) {
					return 7.5625 * k * k;
				} else if (k < (2 / 2.75)) {
					return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
				} else if (k < (2.5 / 2.75)) {
					return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
				} else {
					return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
				}
	
			},
	
			InOut: function (k) {
	
				if (k < 0.5) {
					return TWEEN.Easing.Bounce.In(k * 2) * 0.5;
				}
	
				return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
	
			}
	
		}
	
	};
	
	TWEEN.Interpolation = {
	
		Linear: function (v, k) {
	
			var m = v.length - 1;
			var f = m * k;
			var i = Math.floor(f);
			var fn = TWEEN.Interpolation.Utils.Linear;
	
			if (k < 0) {
				return fn(v[0], v[1], f);
			}
	
			if (k > 1) {
				return fn(v[m], v[m - 1], m - f);
			}
	
			return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
	
		},
	
		Bezier: function (v, k) {
	
			var b = 0;
			var n = v.length - 1;
			var pw = Math.pow;
			var bn = TWEEN.Interpolation.Utils.Bernstein;
	
			for (var i = 0; i <= n; i++) {
				b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
			}
	
			return b;
	
		},
	
		CatmullRom: function (v, k) {
	
			var m = v.length - 1;
			var f = m * k;
			var i = Math.floor(f);
			var fn = TWEEN.Interpolation.Utils.CatmullRom;
	
			if (v[0] === v[m]) {
	
				if (k < 0) {
					i = Math.floor(f = m * (1 + k));
				}
	
				return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);
	
			} else {
	
				if (k < 0) {
					return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
				}
	
				if (k > 1) {
					return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
				}
	
				return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);
	
			}
	
		},
	
		Utils: {
	
			Linear: function (p0, p1, t) {
	
				return (p1 - p0) * t + p0;
	
			},
	
			Bernstein: function (n, i) {
	
				var fc = TWEEN.Interpolation.Utils.Factorial;
	
				return fc(n) / fc(i) / fc(n - i);
	
			},
	
			Factorial: (function () {
	
				var a = [1];
	
				return function (n) {
	
					var s = 1;
	
					if (a[n]) {
						return a[n];
					}
	
					for (var i = n; i > 1; i--) {
						s *= i;
					}
	
					a[n] = s;
					return s;
	
				};
	
			})(),
	
			CatmullRom: function (p0, p1, p2, p3, t) {
	
				var v0 = (p2 - p0) * 0.5;
				var v1 = (p3 - p1) * 0.5;
				var t2 = t * t;
				var t3 = t * t2;
	
				return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (- 3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
	
			}
	
		}
	
	};
	
	// UMD (Universal Module Definition)
	(function (root) {
	
		if (true) {
	
			// AMD
			!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
				return TWEEN;
			}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	
		} else if (typeof module !== 'undefined' && typeof exports === 'object') {
	
			// Node.js
			module.exports = TWEEN;
	
		} else if (root !== undefined) {
	
			// Global variable
			root.TWEEN = TWEEN;
	
		}
	
	})(this);


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	/* global THREE */
	
	var createBeacons = function createBeacons() {
	  var group = new THREE.Group();
	
	  for (var i = -15; i < 25; i++) {
	    for (var j = -15; j < 25; j++) {
	      for (var k = 0; k < 4; k++) {
	        if (i % 3 == 0 && j % 3 == 0) group.add(_createSphere(i, k * 3 + 1, j));
	      }
	    }
	  }
	  return group;
	};
	
	var _createSphere = function _createSphere(x, y, z) {
	  var geometry = new THREE.SphereGeometry(0.1, 8, 8);
	  var material = new THREE.MeshBasicMaterial({
	    color: 0xff0000,
	    opacity: 0.1,
	    transparent: true
	  });
	  var sphere = new THREE.Mesh(geometry, material);
	  sphere.position.x = x;
	  sphere.position.z = z;
	  sphere.position.y = y;
	  material.depthTest = false;
	  return sphere;
	};
	
	var initCrosshair = function initCrosshair() {
	  var crosshair = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.04, 32));
	  crosshair.material = createCrosshairMaterial(0xffffff);
	  crosshair.position.z = -2;
	  return crosshair;
	};
	
	var createCrosshairMaterial = function createCrosshairMaterial(hex) {
	  var material = new THREE.MeshBasicMaterial({
	    color: hex,
	    opacity: 0.8,
	    transparent: true
	  });
	  material.depthTest = false;
	  return material;
	};
	
	exports.createBeacons = createBeacons;
	exports.initCrosshair = initCrosshair;
	exports.createCrosshairMaterial = createCrosshairMaterial;

/***/ }
/******/ ]);
//# sourceMappingURL=main.js.map