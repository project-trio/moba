const Database = require.main.require('./utils/database');
const Util = require.main.require('./utils/util');

// PUBLIC

module.exports = {

	authenticate (client, uid, auth, callback) {
		if (client.authed) {
			if (callback) {
				callback();
			}
			return;
		}

		Database.fetch('name, email', 'users', 'id = $1 AND auth_key = $2', [uid, auth], (response)=>{
			if (response) {
				Database.query('UPDATE users SET online_at = '+Util.seconds()+', online_count = online_count + 1 WHERE id = '+uid, null);
				client.authed = true;
				client.uid = uid;
				client.name = response.name;
				// client.email = response.email;

				require.main.require('./game/events').register(client);

				if (callback) {
					callback();
				}
				client.emit('auth', response);
			} else {
				client.emit('auth', {invalid: true});
			}
		});
	},

	disconnect (uid) {
		Database.query('UPDATE users SET online_count = online_count - 1 WHERE id = '+uid+' AND online_count > 0', null);
	},

};
