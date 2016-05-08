'use strict';

const Decimal = require('decimal.js');
const TrigCache = require('external/trigcache');

const Util = require('game/util/util');

const iterations = 9999;

let rx = -60, ry = 30;
let value;

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function randomizePosition() {
	rx = getRandomInt(-100, 100);
	ry = getRandomInt(-100, 100);
}

randomizePosition();
console.log(rx + ' ' + ry);

//ATAN

console.log('\nATAN');

console.time('Math.atan2');
for (let i = 0; i < iterations; i += 1) {
	randomizePosition();
	value = Math.atan2(ry, rx);
}
console.timeEnd('Math.atan2');
console.log(value);


// console.time('Decimal.atan2');
// for (let i = 0; i < iterations; i += 1) {
// 	// randomizePosition();
// 	value = Decimal.atan2(ry, rx);
// }
// console.timeEnd('Decimal.atan2');
// console.log(value);


// console.time('Util.angleApproximate');
// for (let i = 0; i < iterations; i += 1) {
// 	// randomizePosition();
// 	value = Util.angleApproximate(rx, ry);
// }
// console.timeEnd('Util.angleApproximate');
// console.log(value.toNumber());


console.time('Util.angleOf');
for (let i = 0; i < iterations; i += 1) {
	// randomizePosition();
	value = Util.angleOf(rx, ry);
}
console.timeEnd('Util.angleOf');
console.log(value / 100);


//COS

console.log('\nCOS');

const angleExact = Math.atan2(ry, rx);
const angleApprox = Util.angleOf(rx, ry);


console.time('Math.cos');
for (let i = 0; i < iterations; i += 1) {
	value = Math.cos(angleExact);
}
console.timeEnd('Math.cos');
console.log(value);


console.time('Decimal.cos');
for (let i = 0; i < iterations; i += 1) {
	value = Decimal.cos(angleExact);
}
console.timeEnd('Decimal.cos');
console.log(value.toNumber());


console.time('TrigCache.cos');
for (let i = 0; i < iterations; i += 1) {
	value = TrigCache.cos(angleApprox);
}
console.timeEnd('TrigCache.cos');
console.log(value / 100);


//SIN

console.log('\nSIN', angleApprox);

console.time('Math.sin');
for (let i = 0; i < iterations; i += 1) {
	value = Math.sin(angleExact);
}
console.timeEnd('Math.sin');
console.log(Math.sin(angleExact));


console.time('Decimal.sin');
for (let i = 0; i < iterations; i += 1) {
	value = Decimal.sin(angleExact);
}
console.timeEnd('Decimal.sin');
console.log(value.toNumber());


console.time('TrigCache.sin');
for (let i = 0; i < iterations; i += 1) {
	value = TrigCache.sin(angleApprox);
}
console.timeEnd('TrigCache.sin');
console.log(value / 100);


// let an = 0;
// while (an < Math.PI*8 + 0.1) {
// 	console.log(Math.sin(an) + ' ' + TrigCache.sin(Math.round(an * 100))/100);
// 	an += Math.PI / 4;
// }
