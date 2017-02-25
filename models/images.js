
var walk = require('ergo-core').walk;
var path = require('path')
var _makeFileInfo = require('../lib/fileinfo')

module.exports = function *(project, images_dir) {
	var where = path.join(project.getSourcePath(),images_dir || 'images');
	var files = [];

	var _addFile = function(item) {
		files.push(_makeFileInfo(project.getBasePath(), where, item.path, item.stats));
	}

	yield walk(where, _addFile);
	return files;
}