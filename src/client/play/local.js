export default window.local = {

  TESTING: process.env.NODE_ENV !== 'production',

  name: null,
  email: null,
  username: localStorage.getItem('username'),

  gid: null,
  id: null,
  game: null,
  player: null,

  shipSize: 44,

}
