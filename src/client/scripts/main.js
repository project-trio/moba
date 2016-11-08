'use strict';

require('styles/main');
require('styles/game');

require('bridge');

//SETUP

const Lobby = require('game/lobby');
const Loop = require('render/loop');

Lobby.toggle(true);
Lobby.displaySection('start');
Loop.start(); //TODO delay

require('game/events');
