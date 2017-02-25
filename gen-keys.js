"use strict";

var crypto = require('crypto');

var args = process.argv.slice(2)
/*if (args.length<1)
{
	console.log("USAGE:")
	console.log("   node gen-keys.js [length]")
	console.log('')
	console.log("Returns a series of random keys that you put into admin.ergo.js")
	process.exit(-1)
}*/
var len = args.length < 1 ? 24 : parseInt(args[0],10);
var num = args.length < 2 ? 5 : parseInt(args[1],10);
console.log('keys: [');
for (var i=0; i<num; i++)
	console.log('"' + crypto.pseudoRandomBytes(len).toString('base64') + '",');
console.log('],');


