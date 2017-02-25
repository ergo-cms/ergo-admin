var fs = require('../lib/fs');
var strings = require('../lib/strings');
var _ = require('ergo-utils')._;
var path = require('path');
var _makeFileInfo = require('../lib/fileinfo')
const jsinf = require('jsinf');
var debug  = require('debug')('app:m:post')



function *_loadPost(file) {
	var text = yield fs.readFileP(file, 'utf8');
	var fields = jsinf.decode(text, { 
			block_divider: "\#\#\#+", 
			default_key: "content"
		});
	return fields;
}
function *_savePost(file, fields) {

	// save all BUT the content field
	var fields2 = {};
	for (var field in fields) {
		if (field != 'content')
			fields2[field] = fields[field];
	}
	var result = jsinf.encode(fields2, {
		block_divider: '###',
		default_key: 'content',
	});
	var text = result.value;
	text += '\n###\n\n' + fields['content'] + '\n\n\n';
	yield fs.writeFileP(file, text, 'utf8');
}

function _determinePostType(file, fields, project, def_post_type) {
	if (fields['post_type'])
		// handle the easy one first. It's been explicitly defined
		return fields['post_type'];

	var config = project.config;
	if (!!config['post_types']) {
		for (var post_type in config['post_types']) {
			var data = config.post_types[post_type];
			var relPath = data['path'] || post_type;
			if (fs.isInDir(path.join(project.getSourcePath(), relPath), file)) 
				return post_type;
		}
	}

	// not in a known folder.
	return def_post_type || config.default_post_type;
}


function _loadTemplateConfig(post, config, def_post_type) {
	if (!!config.template[post.post_type])
		return config.template[post.post_type];

	def_post_type = def_post_type || config.default_post_type;
	if (!!config.template[def_post_type])
		return config.template[def_post_type];

	// no template. Make it ALL generic. Assume very litte.
	return { };
}


function titleCase(str) {
	return str.replace(/\b(\w)/g, function(_, x) { return x.toUpperCase();});
}


function Post(base_dir, local_rel_dir, _path, _stats) {
	/*if (!_stats)
		_stats = fs.statSync(_path);*/
	var fileInfo = _makeFileInfo(base_dir, local_rel_dir, _path, _stats);
	_.extend(this,fileInfo)
	this.edit_uri = 'post/'+this.__relEnc;
	this.language = 'html';
	switch (path.extname(this.path).substr(1)) {
		case "tex":
		case "textile":
			this.language = 'textile';
			break;
		case "md":
		case "markdown":
			this.language = 'markdown';
			break;
	}
}

Post.prototype.load = function *(project) {
	this.fields = yield _loadPost(this.path);
	this.post_type = _determinePostType(this.path, this.fields, project);
	return this;
};
Post.prototype.save = function *(fields, project) {
	debug('save fields: %O', fields);
	this.fields = fields;
	this.post_type = _determinePostType(this.path, fields, project);
	yield _savePost(this.path, fields)
};

Post.prototype.prepTemplate = function(config, project) {
	var templ = _loadTemplateConfig(this, config, project.config.default_post_type);
	var mainFields = [];
	var sideFields = [];

	for (var field in templ) {
		var inf = _.extend({field:field, title:titleCase(field)}, templ[field]);
		if (inf.suggest) { inf.suggestions = function() { return this.fields[field].split(','); }} // TODO. use a cache of fields
		if (!inf.sidebar) 
			mainFields.push(inf);
		else
			sideFields.push(inf);
	}

	// gather any unknown fields 
	var miscFields = [];
	for (var field in this.fields) {
		if (!templ[field])
		{
			var inf = {field:field, title:titleCase(field)};
			miscFields.push(inf);

		}
	}
	this.mainFields = mainFields;
	this.sideFields = sideFields;
	this.miscFields = miscFields;
	this.formValue = function() {
		return this.fields[this.field];
	}
	this.formField = function() {
		// NB: 'this' is NOT a Post when called from the template, but has all of this Post's data, but is ALSO specific to the current field
		var id_cls = 'name="'+this.field+'"'+(!!this.class ? ' class="'+this.class+'"':'');
		var val = this.fields[this.field];
		var val_str = val || ''; 
		switch (this.type || 'text') {
			case "date": 
				return '<input '+id_cls+' type="date" value="'+strings.escapeHtmlAttr(val_str)+'">';
				break;
			case "checkbox":
				return '<input '+id_cls+' type="checkbox" value="true" '+(this.fields[this.field]?'checked="checked"':'')+'>';
				break;
			case "textarea":
				return '<textarea '+id_cls+'>'+strings.escapeHtml(val_str)+'</textarea>';
				break;

			case 'image':
			case 'text':
			default:
				return '<input '+id_cls+' type="text" value="'+strings.escapeHtmlAttr(val_str)+'">';
				break;
		}
	}
	return this;
};


module.exports = Post;