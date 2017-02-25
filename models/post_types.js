

module.exports = function *(project) {
	var keys = Object.keys(project.config.post_types);
	//ensure the default one is ALWAYS first
	var def = project.config.default_post_type;
	if (!!def) {
		var idx = keys.indexOf(def);
		if (idx>0) {
			var newkeys = [def];
			newkeys = newkeys.concat(keys.slice(0,idx), keys.slice(idx+1));
			
			keys = newkeys;
		}
	}
	return keys;
}
