'use strict';

const Bridge = require('bridge');

const Local = require('local');

//SOCKET

Bridge.on('update', (data) => {
	const update = data.update;
	if (data.lag) {
		console.log('Waiting for ' + data.lag);
	} else {
		if (Local.game.serverUpdate != update - 1) {
			console.error('Invalid update ' + Local.game.serverUpdate + ' ' + update);
		}
		Local.game.enqueueUpdate(update, data.moves);
	}
	Bridge.emit('updated', {update: update});
});
