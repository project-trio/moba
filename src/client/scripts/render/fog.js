'use strict';

const THREE = require('three');

const Local = require('local');

let fogCanvas, fogBitmap, fogTexture;

let mapWidth, mapHeight;

module.exports = {

	create: function(w, h, parent) {
		mapWidth = w;
		mapHeight = h;

		fogCanvas = document.createElement('canvas');
		fogCanvas.width = mapWidth;
		fogCanvas.height = mapHeight;

		fogBitmap = fogCanvas.getContext('2d');

		fogTexture = new THREE.Texture(fogCanvas);
		fogTexture.minFilter = THREE.LinearFilter;
		let fogGeometry = new THREE.PlaneGeometry(mapWidth, mapHeight);
		let fogMaterial = new THREE.MeshBasicMaterial({map: fogTexture});
		fogMaterial.transparent = true;
		let fogPlane = new THREE.Mesh(fogGeometry, fogMaterial);
		fogPlane.position.set(mapWidth / 2, mapHeight / 2, 40);

		parent.add(fogPlane);
	},

	update: function(units) {
		if (!fogBitmap) {
			return;
		}
		const localTeam = Local.player.team;
		fogBitmap.clearRect(0, 0, mapWidth, mapHeight);
		fogBitmap.fillStyle = "rgba(128,128,128,0.75)";
		fogBitmap.fillRect(0, 0, mapWidth, mapHeight);
		fogTexture.needsUpdate = true;

		fogBitmap.globalCompositeOperation = 'destination-out';
		fogBitmap.fillStyle = "#000000";

		let clearRadius = 0;
		for (let idx = 0; idx < units.length; idx += 1) {
			const unit = units[idx];
			if (unit.team == localTeam) {
				clearRadius= unit.stats.sightRange / 100;
			} else if (unit.visibleForFrame) {
				clearRadius = 50;
			} else {
				continue;
			}
			fogBitmap.beginPath();
			fogBitmap.arc(unit.px / 100, mapHeight - unit.py/ 100, clearRadius, 0, Math.PI*2); 
			fogBitmap.closePath();
			fogBitmap.fill();
		}
		fogBitmap.globalCompositeOperation = 'source-over';
	},

};
