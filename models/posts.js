
var walk = require('ergo-core').walk;
var _  = require('ergo-utils')._;
var path = require('path');
var Post = require('./post')
//var Promise = require('bluebird')
var co = require('co')

function _sourcePath(project, post_type) {
	if (post_type == 'all' || post_type == project.config.default_post_type)
		return project.getSourcePath();
	return path.join(project.getSourcePath(), project.config.post_types[post_type].path || post_type)
}

module.exports = function *(project, post_type, valid_extensions) {
	var files = [];
	post_type = post_type || 'all'
	var valid_exts = valid_extensions || ['.md', '.markdown', '.tex', '.textile'];
	var sourcePath = _sourcePath(project, post_type);
	
	var _addFile = function(item) {
		return co.wrap(function *() {
			if (valid_exts.indexOf(path.extname(item.path))>=0) {
				// have a post. Load the config.
				var post = new Post(project.getBasePath(), sourcePath, item.path, item.stats);
				yield* post.load(project);
				if (post.post_type === post_type || post_type === 'all')
					files.push(post);
				else
					delete post;
			}
			return false;
		})();
	}

	yield walk(project.getSourcePath(), _addFile);
	return files;
}

