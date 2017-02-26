"use strict";
const config = require('./admin.ergo.js');
const base_uri = config.default_fields.base_uri || '/';
// helper utils
var path = require('path')
var posix = path.posix;
var debug = require('debug')('app')
var ergo = require('ergo-core');
var _ = require('ergo-utils')._;
var string = require('./lib/strings');
var fs = require('./lib/fs');


// Models
var Post = require('./models/post');
var project = ergo.config.newContext(path.resolve(__dirname, config.project))
debug('project base dir is: ' + project.getBasePath())

// koa middleware
var koa = require('koa');
var logger = require('koa-logger');
var lusca = require('koa-lusca');
var session = require('koa-session');
var compose = require('koa-compose');
var Router = require('koa-router'); 
var koaBody = require('koa-body');
var send = require('koa-send');
var render = require('koa-usematch')(
	{
		views: path.join(__dirname, 'views'),
		partials: path.join(__dirname, 'partials'),
		defaults: _.extend(require('./lib/filters'), config.default_fields)
	});
var auth = require('./lib/auth')(config.auth)

var l = debug;

function setHeaders(res) {
	// disable proxy caching
	//if (!ctx.response.get('Cache-Control')) 
	res.setHeader('Cache-Control', 'private, proxy-revalidate, s-maxage=0, max-age=86400');
}



/////////////////////////

var router = new Router();
var publicRoutes = new Router();

const csrfOptions = {secret:"csrf:sess"};
var formGet = compose([lusca.csrf(csrfOptions)])
var formPost = compose([koaBody(), lusca.csrf(csrfOptions)])
var formMulti = compose([koaBody({formidable:{uploadDir: __dirname}}), lusca.csrf(csrfOptions)])


var pageData = function *(app_ctx, new_ctx) {
	var data = {
		user:app_ctx.session.user,
		project_name: string.titleCase(path.basename(project.getBasePath())),
		menu: { post_types: yield require('./models/post_types')(project) },
	}
	if (!!app_ctx.state && !!app_ctx.state._csrf)
		data._csrf = app_ctx.state._csrf;
	return _.extend({}, data, new_ctx)
}


// ROUTES
router.get(base_uri+'', function *(next) {
	//debug(this)
	var content = yield require('./models/home')(project);
	var data = yield pageData(this, _.extend({title:'Home'}, content));
	debug(data)
	this.body = yield render('home', data);
});
router.get(base_uri+'settings', function *(next) {
	var data = yield pageData(this,{title:'Settings', list:yield require('./models/settings')(project)});
	debug(data)
	this.body = yield render('keyed_list', data);
});
router.get(base_uri+'posts/', formGet, function *(next) {
	var data = yield pageData(this,{title:'All Posts', files:yield require('./models/posts')(project) });
	this.body = yield render('files', data);
});
router.get(base_uri+'posts/:post_type', formGet, function *(next) {
	var title = string.pluralise(string.titleCase(this.params.post_type));
	var data = yield pageData(this,{title:title, files:yield require('./models/posts')(project, this.params.post_type) });
	this.body = yield render('files', data);
});
router.get(base_uri+'post/:filepath', formGet, function *(next) {
	var f = path.join(project.getBasePath(),decodeURIComponent(this.params.filepath));
	var post = new Post(project.getBasePath(), project.getSourcePath(), f)
	yield post.load(project);
	post.prepTemplate(config, project);
	var data = yield pageData(this,{title:'Edit Post: ' + post.relPath, post:post});
	this.body = yield render('post', data);
});
router.post(base_uri+'post/:filepath', formPost, function *(next) {
	var f = path.join(project.getBasePath(),decodeURIComponent(this.params.filepath));
	var post = new Post(project.getBasePath(), project.getSourcePath(), f);
	delete this.request.body._csrf;
	yield post.save(this.request.body, project)
	post.prepTemplate(config, project);
	var data = yield pageData(this,{title:'Edit Post: ' + post.relPath, post:post, saved:true});
	this.body = yield render('post', data);
});
router.get(base_uri+'files/:where', formGet, function *(next) {
	var files = yield require('./models/files')(project, this.params.where);
	var data = yield pageData(this,{title:string.singular(string.titleCase(this.params.where)) + ' Files', files:files });
	//debug(data)
	this.body = yield render('files', data);
});
router.get(base_uri+'images', formGet, function *(next) {
	var data = yield pageData(this,{title:'Images', preview:true, files:yield require('./models/images')(project) });
	//debug(data)
	this.body = yield render('files', data);
});
router.get(base_uri+'file/text-edit/:filepath', formGet, function *(next) {
	var filename = decodeURIComponent(this.params.filepath);
	var f = path.join(project.getBasePath(),filename);
	var content = yield fs.readFileP(f, 'utf8');
	var data = yield pageData(this,{title:filename, content:content, filePath:f });
	this.body = yield render('file', data);
});
router.post(base_uri+'file/text-edit/:filepath', formPost, function *(next) {
	var filename = decodeURIComponent(this.params.filepath);
	var f = path.join(project.getBasePath(),filename);
	//var content = yield fs.readFileP(f, 'utf8');
	var content = this.request.body.content;
	yield fs.writeFileP(f, content, 'utf8');
	var data = yield pageData(this,{title:filename, saved:true, content:content, filePath:f });
	this.body = yield render('file', data);
});
router.get(base_uri+'file/image-edit/:filepath', function *(next) {
	//this.body = decodeURIComponent(this.params.filepath);
	this.redirect(base_uri+'file/view/' + encodeURIComponent(decodeURIComponent(this.params.filepath)));
	this.status = 302;
});
router.post(base_uri+'file/delete/:filepath', formPost, function *(next) {
	// this is via an ajax request only
	var filename = decodeURIComponent(this.params.filepath);
	var f = path.join(project.getBasePath(),filename);
	debug('file delete: ' + f)
	var _this = this;
	var p = fs.unlinkP(f);
	p.then(function() {
		_this.body = "OK " + filename;	
	}).catch(function(err) {
		_this.body = "Failed to delete '" + filename + "'. Reason: " + err.toString();	
	})
	yield p;
	
});
router.post(base_uri+'file/rename/:filepath', formPost, function *(next) {
	// this is via an ajax request only
	var filename = decodeURIComponent(this.params.filepath);
	var tofilename = this.request.body.rename;
	var f = path.join(project.getBasePath(),filename);
	var fTo = path.join(path.dirname(f),tofilename);
	debug('file rename: ' + f + ' to ' + fTo);
	var _this = this;
	var p = fs.renameP(f, fTo);
	p.then(function() {
		_this.body = "OK " + filename;	
	}).catch(function(err) {
		_this.body = "Failed to rename '" + filename + "' to '"+tofilename+"'. Reason: " + err.toString();	
	})
	yield p;
});
router.post(base_uri+'file/chown/:filepath', formPost, function *(next) {
	// this is via an ajax request only
	var filename = decodeURIComponent(this.params.filepath);
	var f = path.join(project.getBasePath(),filename);
	var chown_uid = this.request.body.uid;
	var chown_gid = this.request.body.gid;
	var chmod     = this.request.body.mode;
	debug('file chown: ' + f)
	this.body = "TODO: OK " + decodeURIComponent(this.params.filepath);
});
router.get(base_uri+'file/view/:filepath', function *(next) {
	var f = decodeURIComponent(this.params.filepath);
	yield send(this, f, { root: project.getBasePath(), setHeaders:setHeaders});
});

// Login ROUTES
publicRoutes.get(base_uri+'login', formGet, function *(next) {
	if (config.auth.auto_login) {
		yield auth.validate.call(this, next);
		this.redirect(base_uri+'');
		this.status = 302;	
		return;	
	}
	this.body = yield render('login', {_csrf:this.state._csrf});
});
publicRoutes.post(base_uri+'login', formPost, auth.validate, function *(next) {
	l("%j", this.request.body);
	this.redirect(base_uri+'');
	this.status = 302;

});
publicRoutes.get(base_uri+'logout', function *(next) {
	this.session.user = undefined;
	this.redirect(base_uri+'login');
	this.status = 302;
});

var app = koa();
app.keys = config.keys;
app.use(logger());

app.use(function *(next){
	// Serve static files in public folder
	var relPath = posix.relative(base_uri, this.path); // chop off the base_uri & leave us with a relative path only (eg 'css/styles.css')
	const publicDir = path.join(__dirname, 'public'); 
	try {
		var stat = yield fs.statP(path.join(publicDir, relPath));
		if (stat.isFile())
			yield send(this, relPath, {root:publicDir, setHeaders:setHeaders});
		else
			yield next;
	}
	catch(e) {
		yield next;
	}

});
	
app.use(session(config.session, app));

//app.use(lusca.csp({/* ... */}));
app.use(lusca.xframe({ value: 'SAMEORIGIN' }));
//app.use(lusca.p3p({ value: 'ABCDEF' }));
//app.use(lusca.hsts({ maxAge: 31536000 });
app.use(lusca.xssProtection());
app.use(function *(next){
  try {
    yield next;
  } catch (err) {
    if (401 == err.status) {
		this.redirect(base_uri+'login');
		this.status = 302;
    } else {
      throw err;
    }
  }
});
app.use(publicRoutes.routes());
app.use(publicRoutes.allowedMethods());
// custom 401 handling

app.use(auth.check)
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(config.port || 3000);
console.log("Listening on "+(config.port || 3000)+". Press Ctrl+C to abort")

app.on('error', function (err) {
  console.log('\n\n'+err.stack)
})



