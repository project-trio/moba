export default {

  pluralize (amount, word) {
    return `${amount} ${word}${amount === 1 ? '' : 's'}`
  }

}
