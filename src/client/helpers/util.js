export default {

  seconds () {
    return Math.round(Date.now() * 0.001)
  },

  pluralize (amount, word) {
    return `${amount} ${word}${amount === 1 ? '' : 's'}`
  },

}
