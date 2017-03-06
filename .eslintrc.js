module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
  },
  extends: 'standard', // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  plugins: [
    'html'
  ],

  'rules': {
    'comma-dangle': 0,
    'spaced-comment': 0,
    'eqeqeq': 0,
    'handle-callback-err': 0,
    'no-tabs': 0, //TODO
    'indent': 0, //TODO
    'padded-blocks': 0,
    'camelcase': 0, //TODO
    'object-property-newline': 0,
    'no-mixed-operators': 0, //TODO
    'no-new': 0,

    'no-unused-vars': 1,

    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  }
}
