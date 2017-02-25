var getTypes = require('./post_types');
//var getFiles = require('./files');
var getPosts = require('./posts')


module.exports = function *(project) {
	var types = yield getTypes(project);
	var posts = yield getPosts(project);
	posts = posts.sort(function(a,b) { return b.stats.mtime - a.stats.mtime; }).slice(0, 10);// limit the number of recent posts
	var obj = {
		post_types: types,
		recent_posts: posts,
	}
	return obj;
}