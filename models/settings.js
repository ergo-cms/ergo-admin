module.exports = function *(project, section) {
	if (section)
		return project.config[section];
	return project.config;
}
