'use strict';

const THREE = require('three');

const Local = require('local');

let fogScene, fogCamera, fogTarget;
let circleMaterial;

let mapWidth, mapHeight;

const MINI_RADIUS = 48;

module.exports = {

	create: function(w, h, parent) {
		mapWidth = w;
		mapHeight = h;

		circleMaterial = new THREE.MeshBasicMaterial({color: 0x000000});

		fogScene = new THREE.Scene();
		fogScene.background = new THREE.Color(0xffffff);
		fogTarget = new THREE.WebGLRenderTarget(mapWidth, mapHeight, {});

		const fogGeometry = new THREE.PlaneBufferGeometry(mapWidth, mapHeight);
		const fogMaterial = new THREE.MeshBasicMaterial({color: 0x000000, alphaMap: fogTarget.texture, depthTest: false, depthWrite: false});
		fogMaterial.transparent = true;
		fogMaterial.opacity = 0.3;

		fogCamera = new THREE.OrthographicCamera(mapWidth / -2, mapWidth / 2, mapHeight / 2, mapHeight / -2, -1024, 1024);

		const fogPlane = new THREE.Mesh(fogGeometry, fogMaterial);
		fogPlane.position.set(mapWidth / 2, mapHeight / 2, -5);
		parent.add(fogPlane);
	},

	update: function(renderer, units) {
		const localTeam = Local.player.team;

		for (let i = fogScene.children.length - 1; i >= 0; i--) {
			const mesh = fogScene.children[i];
			fogScene.remove(mesh);
			mesh.geometry.dispose();
		}

		let clearRadius = 0;
		for (let idx = 0; idx < units.length; idx += 1) {
			const unit = units[idx];
			if (unit.isDying) {
				continue;
			}
			if (unit.team == localTeam) {
				clearRadius = unit.isDead ? MINI_RADIUS : unit.stats.sightRange / 100;
			} else if (unit.visibleForFrame) {
				clearRadius = MINI_RADIUS;
			} else {
				continue;
			}

			const geometry = new THREE.CircleGeometry(clearRadius, 48);
			const circle = new THREE.Mesh(geometry, circleMaterial);
			circle.position.set(unit.px / 100 - mapWidth / 2, unit.py / 100 - mapHeight / 2, 10);
			fogScene.add(circle);
		}

		renderer.render(fogScene, fogCamera, fogTarget);
	},

};
