var debug = require('debug')('app:auth')


function basicAuth(options) {
	var bcrypt = require('bcrypt-nodejs');

	return {
		check: function* check(next) {
			// checks current logged in user for validity
			debug('check')
		    //console.time("auth.check")

			if (!this.session) throw new Error("Missing session info")
			var session_user = this.session.user;
			if (session_user && session_user.id && session_user.username) {
				var ctx = this;
				if (options.users.some(function(user) {
					if (user.username === session_user.username && user.id === session_user.id ) {
						return true;
					}
					return false;
				})) {
					// valid userid
					yield next;
				    //console.timeEnd("auth.check")
					return;
				}

				debug('Failed check %s (%s)', session_user.username, session_user.id)
			}
		    //console.timeEnd("auth.check")
			this.throw(401);
		
		},
		validate:  function* validate(next) {
			debug('validate')
			if (!this.session) throw new Error("Missing session info")
			var username = options.auto_login || this.request.body[options.username_field || 'username'];
			var password = options.auto_login || this.request.body[options.password_field || 'password'];
			if (!username || !password) throw new Error("Missing username/password info")
			this.session.user  = undefined;

			// NB: validation does not take constant time to compute (this is technically a problem, but realistically, not very much of one)
			var _user = undefined;
			if (options.users.some(function(user) {
					if (user.username === username) {
						if (!!options.auto_login || bcrypt.compareSync(password, user.passwordHash)) {
							user.id = bcrypt.hashSync(user.username); // this has the side effect of only allowing this user to be logged in from one location at a time
							_user = user;
							debug('Validated ok: %j', user)
							return true;
						}
					}
					return false;
				})) {

				// found and validated!
				this.session.user = {
					name: _user.name || _user.username,
					//login: user.username,
					username: _user.username,
					id: _user.id,
					profile: _user.profile
				};
				yield next;

			}
			else {
				debug('Validation failed for %s', username)
				this.throw(401);
			}
		}
		
	}
}

/*function pamAuth(options) {
	var pam = require('authenticate-pam');
	return {
		validate: function *(next) {
			var username = this.request.body[options.username_field || 'username'];
			var password = this.request.body[options.password_field || 'password'];
			if (!username || !password) throw new Error("Missing username/password info")
			var ctx = this;

			pam.authenticate(username, password, function(err) {
				if (err) ctx.throw(401);
				this.session.user = {
					name: username,
					id: bcrypt.hashSync(username),
					profile: {}
				};
				yield next;
			  });

		}
	}


}
*/
module.exports = function(auth_options) {
	switch(auth_options.type || 'basic') {
		case "basic":
			return basicAuth(auth_options);
		//case "pam"
		//	return pamAuth(auth_options);
		default:
			throw new Error("Only basic authentication type supported");
	}
}