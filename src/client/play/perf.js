// import Decimal from 'decimal.js'
import TrigCache from '@/client/play/external/trigcache'

import Util from '@/client/play/game/util'

const iterations = 9999

let rx = -60, ry = 30
let value

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

function randomizePosition() {
  rx = getRandomInt(-100, 100)
  ry = getRandomInt(-100, 100)
}

//SETUP

TrigCache.prepare()

randomizePosition()
console.log(`${iterations} iterations`, rx, ry)


//ATAN


console.log('\nATAN')

console.time('Math.atan2')
for (let i = 0; i < iterations; i += 1) {
  randomizePosition()
  value = Math.atan2(ry, rx)
}
console.timeEnd('Math.atan2')
console.log(value)


// console.time('Decimal.atan2')
// for (let i = 0; i < iterations; i += 1) {
//   // randomizePosition()
//   value = Decimal.atan2(ry, rx)
// }
// console.timeEnd('Decimal.atan2')
// console.log(value)


// console.time('Util.angleApproximate')
// for (let i = 0; i < iterations; i += 1) {
//   // randomizePosition()
//   value = Util.angleApproximate(rx, ry)
// }
// console.timeEnd('Util.angleApproximate')
// console.log(value.toNumber())


console.time('Util.angleOf')
for (let i = 0; i < iterations; i += 1) {
  // randomizePosition()
  value = Util.angleOf(rx, ry, false)
}
console.timeEnd('Util.angleOf')
console.log(value / 1000)


//COS


console.log('\nCOS')

const anglePrecise = Math.atan2(ry, rx)
const angleApprox = Util.angleOf(rx, ry, false)


console.time('Math.cos')
for (let i = 0; i < iterations; i += 1) {
  value = Math.cos(anglePrecise)
}
console.timeEnd('Math.cos')
console.log(value)


// console.time('Decimal.cos')
// for (let i = 0; i < iterations; i += 1) {
//   value = Decimal.cos(anglePrecise)
// }
// console.timeEnd('Decimal.cos')
// console.log(value.toNumber())


console.time('TrigCache.cos')
for (let i = 0; i < iterations; i += 1) {
  value = TrigCache.cos(angleApprox)
}
console.timeEnd('TrigCache.cos')
console.log(value / 1000)


//SIN


console.log('\nSIN')

console.time('Math.sin')
for (let i = 0; i < iterations; i += 1) {
  value = Math.sin(anglePrecise)
}
console.timeEnd('Math.sin')
console.log(value)


// console.time('Decimal.sin')
// for (let i = 0; i < iterations; i += 1) {
//   value = Decimal.sin(anglePrecise)
// }
// console.timeEnd('Decimal.sin')
// console.log(value.toNumber())


console.time('TrigCache.sin')
for (let i = 0; i < iterations; i += 1) {
  value = TrigCache.sin(angleApprox)
}
console.timeEnd('TrigCache.sin')
console.log(value / 1000)


//ANGLE COMPARISON


// let an = 0
// while (an < Math.PI*8 + 0.1) {
//   console.log(Math.sin(an), TrigCache.sin(Math.round(an * 1000))/1000)
//   an += Math.PI / 4
// }
