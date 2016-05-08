'use strict'; // https://github.com/Malharhak/fmath.js

const Decimal = require('decimal.js');

//CONSTANTS

const PId2 = 157;
const PI = 314;
const PIt2 = 628;

//CONFIG

const rangeAtan = 20;
const resolutionAtan = 1000;
const resolutionSinCos = 360;

let atanTable, cosTable, sinTable;
let atanFactor, cosFactor, sinFactor;

//PREPARE

const prepare = function() {
	const PRECISION = 100;
	const PIt2_DEC = new Decimal('6.2831853072');

	// atan
	atanTable = new Int32Array(resolutionAtan);
	atanFactor = new Decimal(resolutionAtan).dividedBy(rangeAtan * 2);
	const minTan = new Decimal(-rangeAtan);
	for (let i = 0; i < resolutionAtan; i++) {
		const tan = minTan.plus(new Decimal(i).dividedBy(atanFactor)); // min + (i / factor)
		atanTable[i] = Decimal.atan(tan).times(PRECISION).round().toNumber();
	}

	// cos/sin
	cosTable = new Int32Array(resolutionSinCos);
	cosFactor = new Decimal(resolutionSinCos).dividedBy(PIt2_DEC);
	for (let i = 0; i < resolutionSinCos; i++) {
		const hyp = new Decimal(i).dividedBy(cosFactor);
		cosTable[i] = Decimal.cos(hyp).times(PRECISION).round().toNumber();
	}
	cosFactor = cosFactor.dividedBy(PRECISION);

	sinTable = new Int32Array(resolutionSinCos);
	sinFactor = new Decimal(resolutionSinCos).dividedBy(PIt2_DEC);
	for (let i = 0; i < resolutionSinCos; i++) {
		const hyp = new Decimal(i).dividedBy(sinFactor);
		sinTable[i] = Decimal.sin(hyp).times(PRECISION).round().toNumber();
	}
	sinFactor = sinFactor.dividedBy(PRECISION);
};

//HELPERS

const processSinCosAngle = function(angle, factor) {
	angle %= PIt2;
	if (angle < 0) {
		angle += PIt2;
	}
	return factor.times(angle).floor().toNumber(); // (angle * factor) | 0
};

//PUBLIC

module.exports = {

	prepare: prepare,

	cos: function(angle) {
		const index = processSinCosAngle(angle, cosFactor);
		return cosTable[index];
	},

	sin: function(angle) {
		const index = processSinCosAngle(angle, sinFactor);
		return sinTable[index];
	},

	atan: function(x, y) {
		const index = new Decimal(y).dividedBy(x).plus(rangeAtan).times(atanFactor).floor().toNumber(); // (y / x + rangeAtan) * atanFactor) | 0
		let angle;
		if (index < 0) {
			angle = -PId2;
		} else if (index >= resolutionAtan) {
			angle = PId2;
		} else {
			angle = atanTable[index];
		}
		return x < 0 ? angle - PI : angle;
	},

};
