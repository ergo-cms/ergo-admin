var _ = require('ergo-utils')._;
var strings = require('./strings');

// these are default filters used in usematch templates
module.exports = {
	
	split: function (data, params) {
		if (_.isArray(data)) 
			return data;
		return data.toString().split(params.char || ',').map(function(el) { return el.replace(/^\s*(.*)\s*$/, "$1")} );
	},
	pluralise: function(str) {
		return strings.pluralise(strings.titleCase(str))
	},
	singular: function(str) {
		return strings.singular(strings.titleCase(str))
	},
	titleCase     : strings.titleCase,
	escapeHtmlAttr: strings.escapeHtmlAttr,
	escapeHtml    : strings.escapeHtml,

	toKeyValues: function(data, params) {
		var ignore = _.toRealArray(params.ignore || '', ',');
		var values = [];
		for (var key in data) { 
			if (ignore.indexOf(key)<0)
				values.push({key:key, value: context[key]})
		}
		values.sort(function(a,b) { return a.compare(b); })
		return values;		
	},
};
