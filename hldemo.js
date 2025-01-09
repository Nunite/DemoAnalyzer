var HLDemo =
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
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.CONSTS = exports.DemoWriter = exports.DemoReader = undefined;
	
	var _reader = __webpack_require__(1);
	
	var _reader2 = _interopRequireDefault(_reader);
	
	var _writer = __webpack_require__(4);
	
	var _writer2 = _interopRequireDefault(_writer);
	
	var _common = __webpack_require__(3);
	
	var _common2 = _interopRequireDefault(_common);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.DemoReader = _reader2.default;
	exports.DemoWriter = _writer2.default;
	exports.CONSTS = _common2.default;

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _viewwrapper = __webpack_require__(2);
	
	var _viewwrapper2 = _interopRequireDefault(_viewwrapper);
	
	var _common = __webpack_require__(3);
	
	var _common2 = _interopRequireDefault(_common);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var ParseException = function ParseException(message) {
		_classCallCheck(this, ParseException);
	
		this.message = message;
	};
	
	// These functions return true if the parsing is meant to continue, false if otherwise.
	
	
	var FRAME_READERS = [function () {
		return false;
	}, function () {
		return false;
	},
	
	// Index 2: DEMO_START
	function () {
		return true;
	},
	
	// Index 3: CONSOLE_COMMAND
	function (viewer, frame) {
		frame.command = viewer.readString(_common2.default.FRAME_CONSOLE_COMMAND_SIZE);
		return true;
	},
	
	// Index 4: CLIENT_DATA
	function (viewer, frame) {
		frame.origin = viewer.readFloat32Array(3);
		frame.viewangles = viewer.readFloat32Array(3);
		frame.weaponBits = viewer.readInt32();
		frame.fov = viewer.readFloat32();
		return true;
	},
	
	// Index 5: NEXT_SECTION
	function () {
		return false;
	},
	
	// Index 6: EVENT
	function (viewer, frame) {
		frame.flags = viewer.readInt32();
		frame.index = viewer.readInt32();
		frame.delay = viewer.readFloat32();
		frame.eventArgs = {
			flags: viewer.readInt32(),
			entityIndex: viewer.readInt32(),
			origin: viewer.readFloat32Array(3),
			angles: viewer.readFloat32Array(3),
			velocity: viewer.readFloat32Array(3),
			ducking: viewer.readInt32(),
			fparam1: viewer.readFloat32(),
			fparam2: viewer.readFloat32(),
			iparam1: viewer.readInt32(),
			iparam2: viewer.readInt32(),
			bparam1: viewer.readInt32(),
			bparam2: viewer.readInt32()
		};
		return true;
	},
	
	// Index 7: WEAPON_ANIMATION
	function (viewer, frame) {
		frame.anim = viewer.readInt32();
		frame.body = viewer.readInt32();
		return true;
	},
	
	// Index 8: SOUND
	function (viewer, frame) {
		frame.channel = viewer.readInt32();
		var length = viewer.readInt32();
		frame.samples = viewer.readUint8Array(length);
		frame.attenuation = viewer.readFloat32();
		frame.volume = viewer.readFloat32();
		frame.flags = viewer.readInt32();
		frame.pitch = viewer.readInt32();
		return true;
	},
	
	// Index 9: DEMO_BUFFER
	function (viewer, frame) {
		var length = viewer.readInt32();
		frame.buffer = viewer.readUint8Array(length);
		return true;
	}];
	
	function readNetMessageFrame(viewer, frame) {
		frame.demoInfo = {
			timestamp: viewer.readFloat32(),
	
			refParams: {
				vieworg: viewer.readFloat32Array(3),
				viewangles: viewer.readFloat32Array(3),
				forward: viewer.readFloat32Array(3),
				right: viewer.readFloat32Array(3),
				up: viewer.readFloat32Array(3),
				frametime: viewer.readFloat32(),
				time: viewer.readFloat32(),
				intermission: viewer.readInt32(),
				paused: viewer.readInt32(),
				spectator: viewer.readInt32(),
				onground: viewer.readInt32(),
				waterlevel: viewer.readInt32(),
				simvel: viewer.readFloat32Array(3),
				simorg: viewer.readFloat32Array(3),
				viewheight: viewer.readFloat32Array(3),
				idealpitch: viewer.readFloat32(),
				cl_viewangles: viewer.readFloat32Array(3),
				health: viewer.readInt32(),
				crosshairangle: viewer.readFloat32Array(3),
				viewsize: viewer.readFloat32(),
				punchangle: viewer.readFloat32Array(3),
				maxclients: viewer.readInt32(),
				viewentity: viewer.readInt32(),
				playernum: viewer.readInt32(),
				max_entities: viewer.readInt32(),
				demoplayback: viewer.readInt32(),
				hardware: viewer.readInt32(),
				smoothing: viewer.readInt32(),
				ptr_cmd: viewer.readInt32(),
				ptr_movelets: viewer.readInt32(),
				viewport: viewer.readInt32Array(4),
				nextView: viewer.readInt32(),
				onlyClientDraw: viewer.readInt32()
			},
	
			userCmd: {
				lerp_msec: viewer.readInt16(),
				msec: viewer.readUint8(),
				align_1: viewer.readInt8(),
				viewangles: viewer.readFloat32Array(3),
				forwardmove: viewer.readFloat32(),
				sidemove: viewer.readFloat32(),
				upmove: viewer.readFloat32(),
				lightlevel: viewer.readInt8(),
				align_2: viewer.readInt8(),
				buttons: viewer.readUint16(),
				impulse: viewer.readInt8(),
				weaponselect: viewer.readInt8(),
				align_3: viewer.readInt8(),
				align_4: viewer.readInt8(),
				impact_index: viewer.readInt32(),
				impact_position: viewer.readFloat32Array(3)
			},
	
			moveVars: {
				gravity: viewer.readFloat32(),
				stopspeed: viewer.readFloat32(),
				maxspeed: viewer.readFloat32(),
				spectatormaxspeed: viewer.readFloat32(),
				accelerate: viewer.readFloat32(),
				airaccelerate: viewer.readFloat32(),
				wateraccelerate: viewer.readFloat32(),
				friction: viewer.readFloat32(),
				edgefriction: viewer.readFloat32(),
				waterfriction: viewer.readFloat32(),
				entgravity: viewer.readFloat32(),
				bounce: viewer.readFloat32(),
				stepsize: viewer.readFloat32(),
				maxvelocity: viewer.readFloat32(),
				zmax: viewer.readFloat32(),
				waveHeight: viewer.readFloat32(),
				footsteps: viewer.readInt32(),
				skyName: viewer.readString(_common2.default.FRAME_SKYNAME_SIZE),
				rollangle: viewer.readFloat32(),
				rollspeed: viewer.readFloat32(),
				skycolor_r: viewer.readFloat32(),
				skycolor_g: viewer.readFloat32(),
				skycolor_b: viewer.readFloat32(),
				skyvec_x: viewer.readFloat32(),
				skyvec_y: viewer.readFloat32(),
				skyvec_z: viewer.readFloat32()
			},
	
			view: viewer.readFloat32Array(3),
			viewmodel: viewer.readInt32()
		};
	
		frame.incoming_sequence = viewer.readInt32();
		frame.incoming_acknowledged = viewer.readInt32();
		frame.incoming_reliable_acknowledged = viewer.readInt32();
		frame.incoming_reliable_sequence = viewer.readInt32();
		frame.outgoing_sequence = viewer.readInt32();
		frame.reliable_sequence = viewer.readInt32();
		frame.last_reliable_sequence = viewer.readInt32();
	
		var length = viewer.readInt32();
		frame.msg = viewer.readUint8Array(length);
	
		return true;
	}
	
	function readDemoHeader(viewer) {
		if (viewer.readString(6) !== 'HLDEMO') {
			throw new ParseException('incorrect file signature');
		}
	
		viewer.skip(2);
	
		return {
			demoProtocol: viewer.readInt32(),
			netProtocol: viewer.readInt32(),
			mapName: viewer.readString(_common2.default.HEADER_MAPNAME_SIZE),
			gameDirectory: viewer.readString(_common2.default.HEADER_GAMEDIRECTORY_SIZE),
			mapCRC: viewer.readInt32(),
			directoryOffset: viewer.readInt32()
		};
	}
	
	function readDemoDirectory(viewer, directoryOffset) {
		if (directoryOffset < 0 || viewer.view.buffer.byteLength - 4 < directoryOffset) {
			throw new ParseException('invalid directory offset');
		}
	
		viewer.seekBeg(directoryOffset);
	
		var entryCount = viewer.readInt32();
		if (entryCount < _common2.default.DIRECTORY_ENTRY_COUNT_MIN || entryCount > _common2.default.DIRECTORY_ENTRY_COUNT_MAX) {
			throw new ParseException('invalid number of directory entries');
		}
	
		var directoryEntries = [];
		for (var i = 0; i < entryCount; ++i) {
			directoryEntries.push({
				type: viewer.readInt32(),
				description: viewer.readString(_common2.default.DIRECTORY_ENTRY_DESCRIPTION_SIZE),
				flags: viewer.readInt32(),
				CDtrack: viewer.readInt32(),
				trackTime: viewer.readFloat32(),
				frameCount: viewer.readInt32(),
				offset: viewer.readInt32(),
				fileLength: viewer.readInt32()
			});
		}
	
		return directoryEntries;
	}
	
	function readDemoFrame(viewer) {
		var frame = {
			type: viewer.readUint8(),
			time: viewer.readFloat32(),
			frame: viewer.readInt32()
		};
	
		var stop = void 0;
		if (_common2.default.FRAME_TYPE_MIN <= frame.type && frame.type <= _common2.default.FRAME_TYPE_MAX) {
			stop = !FRAME_READERS[frame.type](viewer, frame);
		} else {
			stop = !readNetMessageFrame(viewer, frame);
		}
	
		return { frame: frame, stop: stop };
	}
	
	function readDemoFrames(viewer, header, directoryEntries) {
		if (header.demoProtocol !== 5) {
			throw new ParseException('only demo protocol 5 is supported');
		}
	
		for (var i = 0; i < directoryEntries.length; ++i) {
			var directoryEntry = directoryEntries[i];
			if (directoryEntry.offset < 0 || viewer.view.buffer.byteLength < directoryEntry.offset) {
				throw new ParseException('invalid offset in directory entry');
			}
	
			viewer.seekBeg(directoryEntry.offset);
			directoryEntry.frames = [];
			var frame = void 0;
			do {
				frame = readDemoFrame(viewer);
				directoryEntry.frames.push(frame.frame);
			} while (!frame.stop);
		}
	}
	
	var DemoReader = function () {
		function DemoReader() {
			_classCallCheck(this, DemoReader);
	
			this.header = {};
			this.directoryEntries = [];
			this.demoSize = 0;
		}
	
		_createClass(DemoReader, [{
			key: 'onready',
			value: function onready(callback) {
				this.onready = callback;
			}
		}, {
			key: 'onerror',
			value: function onerror(callback) {
				this.onerror = callback;
			}
		}, {
			key: 'parseBuffer',
			value: function parseBuffer(buffer) {
				var viewer = new _viewwrapper2.default(buffer);
				this.header = readDemoHeader(viewer);
				this.directoryEntries = readDemoDirectory(viewer, this.header.directoryOffset);
				readDemoFrames(viewer, this.header, this.directoryEntries);
			}
		}, {
			key: 'parse',
			value: function parse(file) {
				var fileReader = new FileReader();
				var instance = this;
				this.header = {};
				this.directoryEntries = {};
				fileReader.onload = function () {
					try {
						instance.demoSize = fileReader.result.byteLength;
						instance.parseBuffer(fileReader.result);
					} catch (e) {
						if (instance.onerror) {
							instance.onerror(e);
						}
						return;
					}
	
					if (instance.onready) {
						instance.onready();
					}
				};
				fileReader.onerror = function () {
					instance.onerror(new ParseException('failed to read file'));
				};
				fileReader.readAsArrayBuffer(file);
			}
		}]);
	
		return DemoReader;
	}();
	
	exports.default = DemoReader;

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var ViewWrapper = function () {
		function ViewWrapper(buffer) {
			_classCallCheck(this, ViewWrapper);
	
			this.view = new DataView(buffer);
			this.offset = 0;
		}
	
		_createClass(ViewWrapper, [{
			key: 'readInt8',
			value: function readInt8() {
				var ret = this.view.getInt8(this.offset, true);
				this.offset += 1;
				return ret;
			}
		}, {
			key: 'writeInt8',
			value: function writeInt8(value) {
				this.view.setInt8(this.offset, value);
				this.offset += 1;
			}
		}, {
			key: 'readUint8',
			value: function readUint8() {
				var ret = this.view.getUint8(this.offset, true);
				this.offset += 1;
				return ret;
			}
		}, {
			key: 'writeUint8',
			value: function writeUint8(value) {
				this.view.setUint8(this.offset, value);
				this.offset += 1;
			}
		}, {
			key: 'readInt16',
			value: function readInt16() {
				var ret = this.view.getInt16(this.offset, true);
				this.offset += 2;
				return ret;
			}
		}, {
			key: 'writeInt16',
			value: function writeInt16(value) {
				this.view.setInt16(this.offset, value, true);
				this.offset += 2;
			}
		}, {
			key: 'readUint16',
			value: function readUint16() {
				var ret = this.view.getUint16(this.offset, true);
				this.offset += 2;
				return ret;
			}
		}, {
			key: 'writeUint16',
			value: function writeUint16(value) {
				this.view.setUint16(this.offset, value, true);
				this.offset += 2;
			}
		}, {
			key: 'readInt32',
			value: function readInt32() {
				var ret = this.view.getInt32(this.offset, true);
				this.offset += 4;
				return ret;
			}
		}, {
			key: 'writeInt32',
			value: function writeInt32(value) {
				this.view.setInt32(this.offset, value, true);
				this.offset += 4;
			}
		}, {
			key: 'readUint32',
			value: function readUint32() {
				var ret = this.view.getUint32(this.offset, true);
				this.offset += 4;
				return ret;
			}
		}, {
			key: 'writeUint32',
			value: function writeUint32(value) {
				this.view.setUint32(this.offset, value, true);
				this.offset += 4;
			}
		}, {
			key: 'readFloat32',
			value: function readFloat32() {
				var ret = this.view.getFloat32(this.offset, true);
				this.offset += 4;
				return ret;
			}
		}, {
			key: 'writeFloat32',
			value: function writeFloat32(value) {
				this.view.setFloat32(this.offset, value, true);
				this.offset += 4;
			}
		}, {
			key: 'readUint8Array',
			value: function readUint8Array(length) {
				var array = new Uint8Array(this.view.buffer, this.offset, length);
				this.offset += length;
				return array;
			}
		}, {
			key: 'writeUint8Array',
			value: function writeUint8Array(array) {
				for (var i = 0; i < array.length; ++i) {
					this.writeUint8(array[i]);
				}
			}
		}, {
			key: 'readString',
			value: function readString(length) {
				var array = this.readUint8Array(length);
				var string = '';
				for (var i = 0; i < array.length && array[i]; ++i) {
					string += String.fromCharCode(array[i]);
				}
				return string;
			}
		}, {
			key: 'writeString',
			value: function writeString(string, length) {
				for (var i = 0; i < string.length; ++i) {
					this.writeUint8(string.charCodeAt(i));
				}
	
				// Pad the rest with null bytes.
				for (var _i = 0; _i < length - string.length; ++_i) {
					this.writeUint8(0);
				}
			}
		}, {
			key: 'readFloat32Array',
			value: function readFloat32Array(length) {
				var array = [];
				for (var i = 0; i < length; ++i) {
					array.push(this.readFloat32());
				}
				return array;
			}
		}, {
			key: 'writeFloat32Array',
			value: function writeFloat32Array(array) {
				for (var i = 0; i < array.length; ++i) {
					this.writeFloat32(array[i]);
				}
			}
		}, {
			key: 'readInt32Array',
			value: function readInt32Array(length) {
				var array = [];
				for (var i = 0; i < length; ++i) {
					array.push(this.readInt32());
				}
				return array;
			}
		}, {
			key: 'writeInt32Array',
			value: function writeInt32Array(array) {
				for (var i = 0; i < array.length; ++i) {
					this.writeInt32(array[i]);
				}
			}
		}, {
			key: 'skip',
			value: function skip(offset) {
				this.offset += offset;
			}
		}, {
			key: 'seekBeg',
			value: function seekBeg(offset) {
				this.offset = offset;
			}
		}]);
	
		return ViewWrapper;
	}();
	
	exports.default = ViewWrapper;

/***/ },
/* 3 */
/***/ function(module, exports) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	var CONSTS = {
		HEADER_MAPNAME_SIZE: 260,
		HEADER_GAMEDIRECTORY_SIZE: 260,
	
		DIRECTORY_ENTRY_COUNT_MIN: 1,
		DIRECTORY_ENTRY_COUNT_MAX: 1024,
		DIRECTORY_ENTRY_DESCRIPTION_SIZE: 64,
	
		FRAME_CONSOLE_COMMAND_SIZE: 64,
		FRAME_SKYNAME_SIZE: 32,
		FRAME_SIZE_MIN: 12,
		FRAME_TYPE_MIN: 2,
		FRAME_TYPE_MAX: 9,
		FRAME_TYPE_DEMO_START: 2,
		FRAME_TYPE_CONSOLE_COMMAND: 3,
		FRAME_TYPE_CLIENT_DATA: 4,
		FRAME_TYPE_NEXT_SECTION: 5,
		FRAME_TYPE_EVENT: 6,
		FRAME_TYPE_WEAPON_ANIM: 7,
		FRAME_TYPE_SOUND: 8,
		FRAME_TYPE_DEMO_BUFFER: 9
	};
	
	exports.default = CONSTS;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _viewwrapper = __webpack_require__(2);
	
	var _viewwrapper2 = _interopRequireDefault(_viewwrapper);
	
	var _common = __webpack_require__(3);
	
	var _common2 = _interopRequireDefault(_common);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var FRAME_WRITERS = [function () {}, function () {},
	
	// Index 2: DEMO_START
	function () {},
	
	// Index 3: CONSOLE_COMMAND
	function (viewer, frame) {
		viewer.writeString(frame.command, _common2.default.FRAME_CONSOLE_COMMAND_SIZE);
	},
	
	// Index 4: CLIENT_DATA
	function (viewer, frame) {
		viewer.writeFloat32Array(frame.origin);
		viewer.writeFloat32Array(frame.viewangles);
		viewer.writeInt32(frame.weaponBits);
		viewer.writeFloat32(frame.fov);
	},
	
	// Index 5: NEXT_SECTION
	function () {},
	
	// Index 6: EVENT
	function (viewer, frame) {
		viewer.writeInt32(frame.flags);
		viewer.writeInt32(frame.index);
		viewer.writeFloat32(frame.delay);
	
		viewer.writeInt32(frame.eventArgs.flags);
		viewer.writeInt32(frame.eventArgs.entityIndex);
		viewer.writeFloat32Array(frame.eventArgs.origin);
		viewer.writeFloat32Array(frame.eventArgs.angles);
		viewer.writeFloat32Array(frame.eventArgs.velocity);
		viewer.writeInt32(frame.eventArgs.ducking);
		viewer.writeFloat32(frame.eventArgs.fparam1);
		viewer.writeFloat32(frame.eventArgs.fparam2);
		viewer.writeInt32(frame.eventArgs.iparam1);
		viewer.writeInt32(frame.eventArgs.iparam2);
		viewer.writeInt32(frame.eventArgs.bparam1);
		viewer.writeInt32(frame.eventArgs.bparam2);
	},
	
	// Index 7: WEAPON_ANIMATION
	function (viewer, frame) {
		viewer.writeInt32(frame.anim);
		viewer.writeInt32(frame.body);
	},
	
	// Index 8: SOUND
	function (viewer, frame) {
		viewer.writeInt32(frame.channel);
		viewer.writeInt32(frame.samples.length);
		viewer.writeUint8Array(frame.samples);
		viewer.writeFloat32(frame.attenuation);
		viewer.writeFloat32(frame.volume);
		viewer.writeInt32(frame.flags);
		viewer.writeInt32(frame.pitch);
	},
	
	// Index 9: DEMO_BUFFER
	function (viewer, frame) {
		viewer.writeInt32(frame.buffer.length);
		viewer.writeUint8Array(frame.buffer);
	}];
	
	function writeNetMessageFrame(viewer, frame) {
		viewer.writeFloat32(frame.demoInfo.timestamp);
	
		viewer.writeFloat32Array(frame.demoInfo.refParams.vieworg);
		viewer.writeFloat32Array(frame.demoInfo.refParams.viewangles);
		viewer.writeFloat32Array(frame.demoInfo.refParams.forward);
		viewer.writeFloat32Array(frame.demoInfo.refParams.right);
		viewer.writeFloat32Array(frame.demoInfo.refParams.up);
		viewer.writeFloat32(frame.demoInfo.refParams.frametime);
		viewer.writeFloat32(frame.demoInfo.refParams.time);
		viewer.writeInt32(frame.demoInfo.refParams.intermission);
		viewer.writeInt32(frame.demoInfo.refParams.paused);
		viewer.writeInt32(frame.demoInfo.refParams.spectator);
		viewer.writeInt32(frame.demoInfo.refParams.onground);
		viewer.writeInt32(frame.demoInfo.refParams.waterlevel);
		viewer.writeFloat32Array(frame.demoInfo.refParams.simvel);
		viewer.writeFloat32Array(frame.demoInfo.refParams.simorg);
		viewer.writeFloat32Array(frame.demoInfo.refParams.viewheight);
		viewer.writeFloat32(frame.demoInfo.refParams.idealpitch);
		viewer.writeFloat32Array(frame.demoInfo.refParams.cl_viewangles);
		viewer.writeInt32(frame.demoInfo.refParams.health);
		viewer.writeFloat32Array(frame.demoInfo.refParams.crosshairangle);
		viewer.writeFloat32(frame.demoInfo.refParams.viewsize);
		viewer.writeFloat32Array(frame.demoInfo.refParams.punchangle);
		viewer.writeInt32(frame.demoInfo.refParams.maxclients);
		viewer.writeInt32(frame.demoInfo.refParams.viewentity);
		viewer.writeInt32(frame.demoInfo.refParams.playernum);
		viewer.writeInt32(frame.demoInfo.refParams.max_entities);
		viewer.writeInt32(frame.demoInfo.refParams.demoplayback);
		viewer.writeInt32(frame.demoInfo.refParams.hardware);
		viewer.writeInt32(frame.demoInfo.refParams.smoothing);
		viewer.writeInt32(frame.demoInfo.refParams.ptr_cmd);
		viewer.writeInt32(frame.demoInfo.refParams.ptr_movelets);
		viewer.writeInt32Array(frame.demoInfo.refParams.viewport);
		viewer.writeInt32(frame.demoInfo.refParams.nextView);
		viewer.writeInt32(frame.demoInfo.refParams.onlyClientDraw);
	
		viewer.writeInt16(frame.demoInfo.userCmd.lerp_msec);
		viewer.writeUint8(frame.demoInfo.userCmd.msec);
		viewer.writeInt8(frame.demoInfo.userCmd.align_1);
		viewer.writeFloat32Array(frame.demoInfo.userCmd.viewangles);
		viewer.writeFloat32(frame.demoInfo.userCmd.forwardmove);
		viewer.writeFloat32(frame.demoInfo.userCmd.sidemove);
		viewer.writeFloat32(frame.demoInfo.userCmd.upmove);
		viewer.writeInt8(frame.demoInfo.userCmd.lightlevel);
		viewer.writeInt8(frame.demoInfo.userCmd.align_2);
		viewer.writeUint16(frame.demoInfo.userCmd.buttons);
		viewer.writeInt8(frame.demoInfo.userCmd.impulse);
		viewer.writeInt8(frame.demoInfo.userCmd.weaponselect);
		viewer.writeInt8(frame.demoInfo.userCmd.align_3);
		viewer.writeInt8(frame.demoInfo.userCmd.align_4);
		viewer.writeInt32(frame.demoInfo.userCmd.impact_index);
		viewer.writeFloat32Array(frame.demoInfo.userCmd.impact_position);
	
		viewer.writeFloat32(frame.demoInfo.moveVars.gravity);
		viewer.writeFloat32(frame.demoInfo.moveVars.stopspeed);
		viewer.writeFloat32(frame.demoInfo.moveVars.maxspeed);
		viewer.writeFloat32(frame.demoInfo.moveVars.spectatormaxspeed);
		viewer.writeFloat32(frame.demoInfo.moveVars.accelerate);
		viewer.writeFloat32(frame.demoInfo.moveVars.airaccelerate);
		viewer.writeFloat32(frame.demoInfo.moveVars.wateraccelerate);
		viewer.writeFloat32(frame.demoInfo.moveVars.friction);
		viewer.writeFloat32(frame.demoInfo.moveVars.edgefriction);
		viewer.writeFloat32(frame.demoInfo.moveVars.waterfriction);
		viewer.writeFloat32(frame.demoInfo.moveVars.entgravity);
		viewer.writeFloat32(frame.demoInfo.moveVars.bounce);
		viewer.writeFloat32(frame.demoInfo.moveVars.stepsize);
		viewer.writeFloat32(frame.demoInfo.moveVars.maxvelocity);
		viewer.writeFloat32(frame.demoInfo.moveVars.zmax);
		viewer.writeFloat32(frame.demoInfo.moveVars.waveHeight);
		viewer.writeInt32(frame.demoInfo.moveVars.footsteps);
		viewer.writeString(frame.demoInfo.moveVars.skyName, _common2.default.FRAME_SKYNAME_SIZE);
		viewer.writeFloat32(frame.demoInfo.moveVars.rollangle);
		viewer.writeFloat32(frame.demoInfo.moveVars.rollspeed);
		viewer.writeFloat32(frame.demoInfo.moveVars.skycolor_r);
		viewer.writeFloat32(frame.demoInfo.moveVars.skycolor_g);
		viewer.writeFloat32(frame.demoInfo.moveVars.skycolor_b);
		viewer.writeFloat32(frame.demoInfo.moveVars.skyvec_x);
		viewer.writeFloat32(frame.demoInfo.moveVars.skyvec_y);
		viewer.writeFloat32(frame.demoInfo.moveVars.skyvec_z);
	
		viewer.writeFloat32Array(frame.demoInfo.view);
		viewer.writeInt32(frame.demoInfo.viewmodel);
	
		viewer.writeInt32(frame.incoming_sequence);
		viewer.writeInt32(frame.incoming_acknowledged);
		viewer.writeInt32(frame.incoming_reliable_acknowledged);
		viewer.writeInt32(frame.incoming_reliable_sequence);
		viewer.writeInt32(frame.outgoing_sequence);
		viewer.writeInt32(frame.reliable_sequence);
		viewer.writeInt32(frame.last_reliable_sequence);
	
		viewer.writeInt32(frame.msg.length);
		viewer.writeUint8Array(frame.msg);
	}
	
	var DemoWriter = function () {
		function DemoWriter() {
			_classCallCheck(this, DemoWriter);
	
			this.fileUrl = null;
		}
	
		_createClass(DemoWriter, [{
			key: 'getBlobUrl',
			value: function getBlobUrl(buffer) {
				if (this.fileUrl !== null) {
					// Revoke to prevent memory leaks.
					URL.revokeObjectURL(this.fileUrl);
				}
	
				var blob = new Blob([buffer], { type: 'application/octet-binary' });
				this.fileUrl = URL.createObjectURL(blob);
				return this.fileUrl;
			}
		}, {
			key: 'save',
			value: function save(demoSize, header, directoryEntries) {
				// Make room for potential NEXT_SECTION frame we have to insert.
				var buffer = new ArrayBuffer(demoSize + _common2.default.FRAME_SIZE_MIN);
				var viewer = new _viewwrapper2.default(buffer);
	
				// Write file signature.
				viewer.writeString('HLDEMO', 8);
	
				// Write header.
				viewer.writeInt32(header.demoProtocol);
				viewer.writeInt32(header.netProtocol);
				viewer.writeString(header.mapName, _common2.default.HEADER_MAPNAME_SIZE);
				viewer.writeString(header.gameDirectory, _common2.default.HEADER_GAMEDIRECTORY_SIZE);
				viewer.writeInt32(header.mapCRC);
				// Delay the writing of directoryOffset.
				var directoryOffsetPos = viewer.offset;
				viewer.skip(4);
	
				var entryOffsets = [];
				for (var i = 0; i < directoryEntries.length; ++i) {
					var directoryEntry = directoryEntries[i];
					// Save the offset for later writing.
					entryOffsets.push(viewer.offset);
	
					// A NEXT_SECTION frame needs to be written in case there isn't
					// one this directory entry, or the engine might not play the demo
					// correctly.
					var hasWrittenNextSection = false;
	
					for (var j = 0; j < directoryEntry.frames.length; ++j) {
						var frame = directoryEntry.frames[j];
						viewer.writeUint8(frame.type);
						viewer.writeFloat32(frame.time);
						viewer.writeInt32(frame.frame);
	
						if (_common2.default.FRAME_TYPE_MIN <= frame.type && frame.type <= _common2.default.FRAME_TYPE_MAX) {
							FRAME_WRITERS[frame.type](viewer, frame);
						} else {
							writeNetMessageFrame(viewer, frame);
						}
	
						if (frame.type === _common2.default.FRAME_TYPE_NEXT_SECTION) {
							hasWrittenNextSection = true;
						}
					}
	
					if (!hasWrittenNextSection) {
						viewer.writeUint8(_common2.default.FRAME_TYPE_NEXT_SECTION);
						viewer.writeFloat32(0);
						viewer.writeInt32(0);
					}
				}
	
				var directoryOffset = viewer.offset;
				viewer.writeInt32(directoryEntries.length);
	
				for (var _i = 0; _i < directoryEntries.length; ++_i) {
					var _directoryEntry = directoryEntries[_i];
					viewer.writeInt32(_directoryEntry.type);
					viewer.writeString(_directoryEntry.description, _common2.default.DIRECTORY_ENTRY_DESCRIPTION_SIZE);
					viewer.writeInt32(_directoryEntry.flags);
					viewer.writeInt32(_directoryEntry.CDtrack);
					viewer.writeFloat32(_directoryEntry.trackTime);
					viewer.writeInt32(_directoryEntry.frameCount);
					// Use the offset saved previously.
					viewer.writeInt32(entryOffsets[_i]);
					viewer.writeInt32(_directoryEntry.fileLength);
				}
	
				// Now we get to write the directory offset.
				viewer.seekBeg(directoryOffsetPos);
				viewer.writeInt32(directoryOffset);
	
				return this.getBlobUrl(buffer);
			}
		}]);
	
		return DemoWriter;
	}();
	
	exports.default = DemoWriter;

/***/ }
/******/ ]);
//# sourceMappingURL=hldemo.js.map