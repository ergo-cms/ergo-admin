var fs = require('ergo-core').fs;
var Promise = require('bluebird')

// promisify a few funcs we need
"readFile,writeFile,stat,unlink,rename,chown,chmod".split(',').forEach(function(fn) {
	fs[fn+'P'] = Promise.promisify(fs[fn])
});

module.exports = fs;

