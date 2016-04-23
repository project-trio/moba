'use strict';

const Postgres = require('pg');

const Util = require('./util');

//SETUP

Postgres.defaults.parseInt8 = true;

const connectURL = process.env.DATABASE_URL || 'postgres://kiko@localhost/three';

//HELPERS

const query = function(statement, params, callback) {
	Postgres.connect(connectURL, (err, client, done)=>{
		if (!client) {
			console.log(err, client, done);
			done();
			return;
		}
		client.query(statement, params, (err, result)=>{
			done();
			if (result) {
				if (callback) {
					callback(result.rows);
				}
			} else {
				console.log(err);
			}
		});
	});
};

const queryOne = function(statement, params, callback) {
	query(statement, params, (result)=>{
		if (callback) {
			callback(result[0]);
		}
	});
};

const fetch = function(columns, table, where, params, callback) {
	queryOne('SELECT ' + columns + ' FROM ' + table + ' WHERE ' + where + ' LIMIT 1', params, callback);
};

const property = function(column, table, where, params, callback) {
	fetch(column, table, where, params, (result)=>{
		callback(result[column]);
	});
};

//PUBLIC

module.exports = {

	query: query,

	queryOne: queryOne,

	fetch: fetch,

	property: property,

	update: function(table, where, columnsValues, returning, callback) {
		columnsValues.updated_at = Util.seconds();

		const columns = [], values = [], placeholders = [];
	
		let index = 0;
		for (let column in columnsValues) {
			columns.push(column);
			values.push(columnsValues[column]);
			placeholders.push('$' + (++index));
		}
	
		let queryString = 'UPDATE ' + table + ' SET (' + columns.join() + ') = (' + placeholders.join() + ') WHERE ' + where;
		if (returning) {
			queryString += ' RETURNING ' + returning;
		}
		queryOne(queryString, values, callback);
	},

	insert: function(table, columnsValues, returning, callback) {
		const now = Util.seconds();
		columnsValues.created_at = now;
		columnsValues.updated_at = now;

		
		let columns = [], values = [], placeholders = [];
		
		let index = 0;
		for (let column in columnsValues) {
			columns.push(column);
			values.push(columnsValues[column]);
			placeholders.push('$' + (++index));
		}
	
		let queryString = 'INSERT INTO ' + table + ' (' + columns.join() + ') VALUES (' + placeholders.join() + ')';
		if (returning) {
			queryString += ' RETURNING ' + returning;
		}
		queryOne(queryString, values, callback);
	},

};
