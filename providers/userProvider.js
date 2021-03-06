var db = require('./pgProvider');
var Promise = require("bluebird");
var User = require('../models/User.js')

function deserialize(response) {
	var user = response[0];
	return Promise.resolve(user == null ? null : User(user))
}

function deserializeAll(users) {
	if(users == null) 			return Promise.resolve(null)
	if(Array.isArray(users)) 	return Promise.resolve(users.map(User))
	else 						return Promise.resolve(User(users));
}

function findUserByEmail(email) {
	return db('users').
		where('email', email).
		then(deserialize);
}

function findUserById(userId) {
	return db('users').
		where('user_id', userId).
		then(deserialize);
}

module.exports = {
	findUserById: findUserById,
	findUserByEmail: findUserByEmail,
	authenticate: (email, password) => {
		return findUserByEmail(email).then((user) => {
			if(user == null) 
				return Promise.reject('Invalid Username')
			else if(user.passwordIsValid(password))
				return Promise.resolve(user)
			else
				return Promise.reject('Invalid Password')
		});
	},
	saveUser: (user) => {
		if(!user.isUpdatable())
			return findUserById(user.userId)

		return db('users')
			.where('user_id', user.userId)
			.update(user.toUpdateSafeDBModel(), '*').
			then(deserialize)
	},
	createUser: (user) => {
		return findUserByEmail(user.email).then((existingUser) => {
			if(existingUser != null)
				return Promise.reject('User email already exists');

			return db.returning('*')
				.insert(user.toDBModel())
				.into('users')
				.then(deserialize)
		});
	}
}