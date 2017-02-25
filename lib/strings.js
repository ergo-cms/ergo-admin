var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
var strings = {
	titleCase: function(str) {
		return str.replace(/\b(\w)/g, function(_, x) { return x.toUpperCase();});
	},
	singular: function(str) {
		if (str[str.length-1]=='s')
			return str.substr(0,str.length-1);
		return str;
	},
	pluralise: function(str) {
		return strings.singular(str) + 's'; // yes. there are better libraries for this, but this should be OK for post_types
	},	
	escapeHtmlAttr: function(string) {
		return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap (s) {
	  		return entityMap[s];
		});
	},
	escapeHtml: function(string) {
		return String(string).replace(/[&<>]/g, function fromEntityMap (s) {
	  		return entityMap[s];
		});
	},
}

module.exports = strings;