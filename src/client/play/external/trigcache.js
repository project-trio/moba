// https://github.com/Malharhak/fmath.js

import Decimal from 'decimal.js'

import Local from '@/play/local'

//CONSTANTS

const PRECISION = new Decimal(1000)
const PIP = Decimal.acos(-1).times(PRECISION)
const PIPd2 = PIP.dividedBy(2)
const PIPt2 = PIP.times(2)

//CONFIG

const rangeAtan = 20
const resolutionAtan = 1000
const resolutionSinCos = 360

let atanTable, cosTable, sinTable
let atanFactor, cosFactor, sinFactor

//PREPARE

const prepare = function () {
  const PIt2_DEC = Decimal.acos(-1).times(2)

  // atan
  atanTable = new Int32Array(resolutionAtan)
  atanFactor = new Decimal(resolutionAtan).dividedBy(rangeAtan * 2)
  const minTan = new Decimal(-rangeAtan)
  for (let i = 0; i < resolutionAtan; i++) {
    const tan = minTan.plus(new Decimal(i).dividedBy(atanFactor)) // min + (i / factor)
    atanTable[i] = Decimal.atan(tan).times(PRECISION).round().toNumber()
  }

  // cos/sin
  cosTable = new Int32Array(resolutionSinCos)
  cosFactor = new Decimal(resolutionSinCos).dividedBy(PIt2_DEC)
  for (let i = 0; i < resolutionSinCos; i++) {
    const hyp = new Decimal(i).dividedBy(cosFactor)
    cosTable[i] = Decimal.cos(hyp).times(PRECISION).round().toNumber()
  }
  cosFactor = cosFactor.dividedBy(PRECISION)

  sinTable = new Int32Array(resolutionSinCos)
  sinFactor = new Decimal(resolutionSinCos).dividedBy(PIt2_DEC)
  for (let i = 0; i < resolutionSinCos; i++) {
    const hyp = new Decimal(i).dividedBy(sinFactor)
    sinTable[i] = Decimal.sin(hyp).times(PRECISION).round().toNumber()
  }
  sinFactor = sinFactor.dividedBy(PRECISION)
}

//HELPERS

const indexAngleFactor = function (angle, factor) {
  let count = 0
  while (angle.lessThan(0)) {
    angle = angle.plus(PIPt2)
    count += 1
    if (count > 1 && Local.TESTING) {
      console.error('Angle outside range', angle.toNumber())
    }
  }
  return factor.times(angle).floor().toNumber() // (angle * factor) | 0
}

//PUBLIC

export default {

  prepare: prepare,

  indexFor (angle) {
    return indexAngleFactor(angle, cosFactor)
  },
  cos (index) {
    return cosTable[index]
  },
  sin (index) {
    return sinTable[index]
  },

  atan (y, x) {
    const index = new Decimal(y).dividedBy(x).plus(rangeAtan).times(atanFactor).floor().toNumber() // (y / x + rangeAtan) * atanFactor) | 0
    let angle
    if (index < 0) {
      angle = PIPd2.negated()
    } else if (index >= resolutionAtan) {
      angle = PIPd2
    } else {
      angle = new Decimal(atanTable[index])
    }
    return x < 0 ? angle.plus(PIP) : angle
  },

}
