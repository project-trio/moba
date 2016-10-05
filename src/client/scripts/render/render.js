'use strict';

const THREE = require('three');

const Vox = require('external/vox');
const DomEvents = require('external/threex.domevents');

const RenderFog = require('render/fog');

let gameScene, gameCamera, renderer, domEvents;
let hudScene, hudCamera, hudTexture, hudBitmap;

const WALL_HEIGHT = 60;

let windowWidth, windowHeight;

//LOCAL

const resize = function() {
	windowWidth = window.innerWidth;
	windowHeight = window.innerHeight;
	renderer.setSize(windowWidth, windowHeight);

	gameCamera.aspect = windowWidth / windowHeight;
	gameCamera.updateProjectionMatrix();

	const halfWidth = 0.5 * windowWidth;
	const halfHeight = 0.5 * windowHeight;
	hudCamera.left = -halfWidth;
	hudCamera.right = halfWidth;
	hudCamera.top = halfHeight;
	hudCamera.bottom = -halfHeight;
	hudCamera.updateProjectionMatrix();
};

//PUBLIC

let counter = 0;

module.exports = {

	create: function() {
		windowWidth = window.innerWidth;
		windowHeight = window.innerHeight;
		gameScene = new THREE.Scene();
		gameCamera = new THREE.PerspectiveCamera(90, windowWidth / windowHeight, 1, 1024);
		gameCamera.up.set(0, -1, 0);
		gameCamera.lookAt(gameScene);
		gameCamera.position.z = 512;

		const ambient = new THREE.AmbientLight(0x444444);
		gameScene.add(ambient);

		// const light = new THREE.DirectionalLight(0xffffff, 0.5);
		// light.position.set(windowWidth / 2, windowHeight / 2, 512);
		const light = new THREE.PointLight(0xffffff, 0.99, 0);
		light.position.set(windowWidth / 2, windowHeight / 2, 100);
		// // light.position.set(0, 0, 10);
		// camera.add(light);
		light.castShadow = true;
		const shadowCamera = new THREE.PerspectiveCamera(50, 1, 1200, 2500);
		const lightShadow = new THREE.LightShadow(shadowCamera);
		lightShadow.bias = 0.001;
		lightShadow.mapSize.width = 1024;
		lightShadow.mapSize.height = 1024;
		light.shadow = lightShadow;
		gameScene.add(light);

		renderer = new THREE.WebGLRenderer({
			// alpha: true,
			antialias: true,
			canvas: document.getElementById('canvas'),
		});
		// renderer.setClearColor(0x000000);
		renderer.autoClear = false;
		// renderer.physicallyCorrectLights = true;
		// renderer.shadowMap.enabled = true;
		// renderer.shadowMap.type = THREE.PCFShadowMap;

		domEvents = new DomEvents(gameCamera, renderer.domElement);

		// HUD

		hudScene = new THREE.Scene();
		hudCamera = new THREE.OrthographicCamera(-windowWidth/2, windowWidth/2, windowHeight/2, -windowHeight/2, 0, 30);

		const hudCanvas = document.createElement('canvas');
		hudCanvas.width = windowWidth;
		hudCanvas.height = windowHeight;

		hudBitmap = hudCanvas.getContext('2d');
		hudBitmap.clearRect(0, 0, window.innerWidth, window.innerHeight);
		hudBitmap.font = "Normal 100px Arial";
		hudBitmap.textAlign = 'center';
		hudBitmap.fillStyle = "rgba(245,245,245,0.75)";

		hudTexture = new THREE.Texture(hudCanvas);
		hudTexture.minFilter = THREE.LinearFilter;
		let hudGeometry = new THREE.PlaneGeometry(windowWidth, windowHeight);
		let hudMaterial = new THREE.MeshBasicMaterial({map: hudTexture});
		hudMaterial.transparent = true;
		let hudPlane = new THREE.Mesh(hudGeometry, hudMaterial);
		hudScene.add(hudPlane);

		resize();

		return renderer;
	},

	positionCamera: function(x, y) {
		gameCamera.position.x = x;
		gameCamera.position.y = y;
	},

	render: function() {
		hudBitmap.clearRect(0, 0, window.innerWidth, window.innerHeight);
		hudBitmap.fillText(++counter, windowWidth / 2, windowHeight / 2);
		hudTexture.needsUpdate = true;

		renderer.render(gameScene, gameCamera);
		renderer.render(hudScene, hudCamera);
	},

	remove: function(object) {
		object.parent.remove(object);
	},

	on: function(object, listener, callback) {
		domEvents.addEventListener(object, listener, callback);
	},

	add: function(object) {
		gameScene.add(object);
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

	ground: function(width, height, options) {
		const geometry = new THREE.BoxGeometry(width, height, 10);
		const material = new THREE.MeshBasicMaterial({color: options.color});
		const rectangle = new THREE.Mesh(geometry, material);
		rectangle.receiveShadow = true;
		rectangle.position.set(width / 2, height / 2, -10);

		options.floor.add(rectangle);

		RenderFog.create(width, height, options.ceiling);

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
