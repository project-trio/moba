module.exports = {

  TESTING: process.env.NODE_ENV != 'production',

  seconds () {
    return Math.round(Date.now() * 0.001)
  },

  uid () {
    return Math.random().toString(36).substr(2, 16)
  },

  code () {
    return Math.floor(Math.random() * 900000) + 100000
  },

}
