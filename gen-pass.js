"use strict";

var bcrypt = require('bcrypt-nodejs');

var args = process.argv.slice(2)
if (args.length<1)
{
	console.log("USAGE:")
	console.log("   node gen-pass.js password")
	console.log('')
	console.log("Returns a hash value that you put into admin.ergo.js")
	process.exit(-1)
}
var pwd = args[0];
var hash = bcrypt.hashSync(pwd);
if (args.length<2 || args[1]!='-q')
	console.log("Put the following string into admin.ergo.js:")
console.log(hash);


