'use strict';

const THREE = require('three');

const Vox = require('external/vox');
const DomEvents = require('external/threex.domevents');

let scene, camera, renderer, domEvents;

const WALL_HEIGHT = 60;

//PUBLIC

module.exports = {

	create: function() {
		const width = window.innerWidth;
		const height = window.innerHeight;
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(90, width / height, 1, 1024);
		camera.up.set(0, -1, 0);
		camera.lookAt(scene);
		camera.position.z = 512;

		const ambient = new THREE.AmbientLight(0x333333);
		scene.add(ambient);

		// const light = new THREE.DirectionalLight(0xffffff, 0.5);
		// light.position.set(width / 2, height / 2, 512);
		const light = new THREE.PointLight(0xffffff, 0.9, 0);
		light.position.set(width / 2, height / 2, 100);
		// // light.position.set(0, 0, 10);
		// camera.add(light);
		light.castShadow = true;
		const shadowCamera = new THREE.PerspectiveCamera(50, 1, 1200, 2500);
		const lightShadow = new THREE.LightShadow(shadowCamera);
		lightShadow.bias = 0.0001;
		lightShadow.mapSize.width = 1024;
		lightShadow.mapSize.height = 1024;
		light.shadow = lightShadow;
		scene.add(light);

		renderer = new THREE.WebGLRenderer({antialias: true});
		// renderer.physicallyCorrectLights = true;
		renderer.shadowMap.enabled = true;

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

	remove: function(object) {
		object.parent.remove(object);
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
		// const text = new PIXI.Text(string, options);
		// text.position.set(x, y);
		// if (parent) {
		// 	parent.add(text);
		// }
		// return text;
	},

	sprite: function(name, options) {
		const map = new THREE.TextureLoader().load(require(`images/${name}.png`));
		// const material = new THREE.SpriteMaterial({map: map});
		const material = new THREE.SpriteMaterial({map: map, color: 0xffffff, fog: true});
		const sprite = new THREE.Sprite(material);
		sprite.scale.set(88, 88, 1);
		if (options.parent) {
			options.parent.add(sprite);
		}
		return sprite;
	},

	voxel: function(name, options) {
		const parser = new Vox.Parser();
		parser.parse(require(`images/${name}.vox`)).then(function(voxelData) {
			const builder = new Vox.MeshBuilder(voxelData, {voxelSize: 2}); //TODO cache
			const mesh = builder.createMesh();
			mesh.rotation.x = Math.PI / 2;
			if (options.z) {
				mesh.position.z = options.z;
			}
			if (options.parent) {
				options.parent.add(mesh);
			}
			mesh.castShadow = true;
		});
	},

	// Shapes

	wall: function(x, y, w, h, options) {
		const geometry = new THREE.BoxGeometry(w, h, WALL_HEIGHT);
		const material = new THREE.MeshLambertMaterial({color: options.color});
		const wall = new THREE.Mesh(geometry, material);
		wall.position.set(x, y, 0);
		wall.castShadow = true;
		if (options.parent) {
			options.parent.add(wall);
		}
		return wall;
	},

	wallCap: function(x, y, radius, options) {
		const geometry = new THREE.CylinderGeometry(radius, radius, WALL_HEIGHT);
		const material = new THREE.MeshLambertMaterial({color: options.color});
		const wall = new THREE.Mesh(geometry, material);
		wall.rotation.set(Math.PI/2, 0, 0);
		wall.castShadow = true;
		wall.position.set(x, y, 0);
		if (options.parent) {
			options.parent.add(wall);
		}
		return wall;
	},

	ground: function(w, h, options) {
		const geometry = new THREE.BoxGeometry(w, h, 10);
		const material = new THREE.MeshBasicMaterial({color: options.color});
		const rectangle = new THREE.Mesh(geometry, material);
		rectangle.receiveShadow = true;
		rectangle.position.set(w / 2, h / 2, -10);
		if (options.parent) {
			options.parent.add(rectangle);
		}
		return rectangle;
	},

	rectangle: function(x, y, w, h, options) {
		const geometry = new THREE.BoxGeometry(w, h, options.depth || 1);
		const material = new THREE.MeshBasicMaterial({color: options.color});
		const rectangle = new THREE.Mesh(geometry, material);
		rectangle.position.set(x, y, options.z || 0);
		if (options.parent) {
			options.parent.add(rectangle);
		}
		return rectangle;
	},

};
