var path = require('path');
var url = require('url');


function _makeFileInfo(base_dir, relative_base_dir, _path, stats) {
	var relPath = path.relative(base_dir, _path)
	var relEnc = encodeURIComponent(relPath);
	var image = 'jpg,png,jpeg,gif'.split(',').indexOf(path.extname(_path).substr(1))>=0;
	var obj = {
		path: _path,
		relPath: path.relative(relative_base_dir, _path),
		filename: path.basename(_path),
		__relEnc: relEnc,
		del_uri: 'file/delete/'+relEnc,
		rename_uri: 'file/rename/'+relEnc,
		edit_uri: image ? 'file/image-edit/'+relEnc : 'file/text-edit/'+relEnc,
		view_uri: 'file/view/'+relEnc,
		chown_uri: 'file/chown/'+relEnc,
		stats: stats,
		stats_mode: !!stats ? stats.mode.toString(8) : undefined,
	}
	return obj;
}


module.exports = _makeFileInfo;