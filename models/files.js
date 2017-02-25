
var walk = require('ergo-core').walk;
var fs = require('ergo-core').fs;
var path = require('path')
var _makeFileInfo = require('../lib/fileinfo')

module.exports = function *(project, where) {
	var files = [];

	var _addFile = function(item) {
		if (!fs.isInDir(project.getOutPath(), item.path)) // don't allow anything in the output folder to be added.
			return files.push(_makeFileInfo(project.getBasePath(), where, item.path, item.stats));
		return false;
	}

	switch (where) {
		case 'partials':
			where = project.getPartialsPath();
			break;
		case 'layouts':
			where = project.getLayoutsPath();
			break;
		case 'theme':
			where = project.getThemePath();
			break;
		case 'all':
		default:
			where = project.getBasePath();
			break;
	}
	yield walk(where, _addFile);
	return files;
}