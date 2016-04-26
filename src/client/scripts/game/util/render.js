'use strict';

const THREE = require('three');

const Vox = require('external/vox');
const DomEvents = require('external/threex.domevents');

let scene, camera, renderer, domEvents;

const WALL_HEIGHT = 50;

//PUBLIC

module.exports = {

	create: function() {
		var width = window.innerWidth;
		var height = window.innerHeight;
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(90, width / height, 1, 1024);
		camera.up.set(0, -1, 0);
		camera.lookAt(scene);
		camera.position.z = 512;

		var ambient = new THREE.AmbientLight(0x111111);
		scene.add(ambient);

		var light = new THREE.DirectionalLight(0xffffff, 0.5);
		light.position.set(width / 2, height / 2, 512);
		scene.add(light);
		// var light = new THREE.PointLight(0xffffff, 0.9, 0);
		// light.position.set(width / 2, height / 2, 10);
		// // light.position.set(0, 0, 10);
		// camera.add(light);

		renderer = new THREE.WebGLRenderer({antialias: true});
		// renderer.physicallyCorrectLights = true;
		renderer.shadowMapEnabled = true;

		renderer.setSize(width, height);

		document.getElementById('game-viewport').appendChild(renderer.domElement);
		domEvents = new DomEvents(camera, renderer.domElement);
		return renderer;
	},

	positionCamera: function(x, y) {
		camera.position.x = x;
		camera.position.y = y;
	},

	render: function() {
		renderer.render(scene, camera);
	},

	get: function() {
		return renderer.domElement;
	},

	on: function(object, listener, callback) {
		domEvents.addEventListener(object, listener, callback);
	},

	add: function(object) {
		scene.add(object);
	},

	group: function() {
		return new THREE.Object3D();
	},

	text: function(string, x, y, options, parent) {
		// let text = new PIXI.Text(string, options);
		// text.position.set(x, y);
		// if (parent) {
		// 	parent.add(text);
		// }
		// return text;
	},

	sprite: function(name, options) {
		let map = new THREE.TextureLoader().load(require(`images/${name}.png`));
		// var material = new THREE.SpriteMaterial({map: map});
		let material = new THREE.SpriteMaterial({map: map, color: 0xffffff, fog: true});
		let sprite = new THREE.Sprite(material);
		let mapImage = material.map.image;
		console.log(map, material);
		sprite.scale.set(88, 88, 1);
		if (options.parent) {
			options.parent.add(sprite);
		}
		return sprite;
	},

	vox: function(name, options) {
		var parser = new Vox.Parser();
		parser.parse(require(`images/${name}.vox`)).then(function(voxelData) {
			var builder = new Vox.MeshBuilder(voxelData, {voxelSize: 2});
			var mesh = builder.createMesh();
			mesh.rotation.x = Math.PI / 2;
			if (options.z) {
				mesh.position.z = options.z;
			}
			if (options.parent) {
				options.parent.add(mesh);
			}
		});
	},

	// Shapes

	wall: function(x, y, w, h, options) {
		let geometry = new THREE.BoxGeometry(w, h, WALL_HEIGHT);
		let material = new THREE.MeshPhongMaterial({color: options.color});
		let wall = new THREE.Mesh(geometry, material);
		wall.position.set(x, y, 0);
		wall.castShadow = true;
		if (options.parent) {
			options.parent.add(wall);
		}
		return wall;
	},

	wallCap: function(x, y, radius, options) {
		var geometry = new THREE.CylinderGeometry(radius, radius, WALL_HEIGHT);
		var material = new THREE.MeshPhongMaterial({color: options.color});
		var wall = new THREE.Mesh(geometry, material);
		wall.rotation.set(Math.PI/2, 0, 0);
		wall.castShadow = true;
		wall.position.set(x, y, 0);
		if (options.parent) {
			options.parent.add(wall);
		}
		return wall;
	},

	ground: function(w, h, options) {
		let geometry = new THREE.BoxGeometry(w, h, 10);
		let material = new THREE.MeshBasicMaterial({color: options.color});
		let rectangle = new THREE.Mesh(geometry, material);
		rectangle.receiveShadow = true;
		rectangle.position.set(w / 2, h / 2, -10);
		if (options.parent) {
			options.parent.add(rectangle);
		}
		return rectangle;
	},

	rectangle: function(x, y, w, h, options) {
		let geometry = new THREE.BoxGeometry(w, h, options.depth || 1);
		let material = new THREE.MeshBasicMaterial({color: options.color});
		let rectangle = new THREE.Mesh(geometry, material);
		rectangle.position.set(x, y, 0);
		if (options.parent) {
			options.parent.add(rectangle);
		}
		return rectangle;
	},

};
