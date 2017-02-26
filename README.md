# Ergo Server

This project is in early development. Please wait for updates or visit [ergo-cms.github.io](https://ergo-cms.github.io) for more information.


## Prerequisites

It is assumed that you can shell access to install node projects and that you can configure a proxy server using NGINX or Apache. 

## Installation

On your server, install to a folder *outside* the public folder and *outside* the ergo project folder. eg.

``` 
/home/username
   + /public_html
   + /some_ergo_project
      ... config.ergo.js project is here
   + /ergo-server
      ... files go here
```

1. Type these:

```
git clone https://github.com/ergo-cms/ergo-server.git
cd ergo-server
npm install --production
cp admin-sample.ergo.js admin.ergo.js
```

2. Generate new random keys:

```
node gen-keys.js
```

And copy them into admin.ergo.js:

```
	keys: [
	... new keys here ...
		],
```

3. Change the admin password:

```
node gen-pass.js [new_password]
```

And copy it into admin.ergo.js. It is also recommended to change the username from 'admin' to something else:

```
	auth: { 
		type:"basic",
		users: [ // for basic only
			{
				username: "admin",
				passwordHash: "$2a... new password hash here", 
				name: "Administrator", // if omitted, username is used
			},

```

You can add new users here too.

4. Set the path to the project (config.ergo.js):

It is assumed that the project files (ie where the `config.ergo.js` file is located), is outside this folder and also NOT in the `public_html` folder. Nevertheless, edit `admin.ergo.js` to specify where the raw files for the project are located. (It is assumed you uploaded them or have called `ergo init some_ergo_project` previously):

```
	project: '../some_ergo_project/config.ergo.js', 
```

It is assumed that the out path for `config.ergo.js` has been configured to be the `public_html` folder:

```
module.exports = {
	out_path: "../public_html", 
	default_fields: {
	...
```

5. Change Port:

In admin.ergo.js:

```
	port: 3000,
```

6. Set the virtual sub folder it will operate as, by setting 'base_uri'.

By default the `base_uri` is set if you will use a sub domain to access the admin interface. You will probably want to change it:

```
module.exports = {
	default_fields: {
		base_uri: '/ergo-admin',
		...
```


## Proxy Configuration

Note that little effort has been expended into hardening this server against all forms of attacks (beyond CSRF and XSS) and using the server behind a proxy (using NGINX, Apache, or similar) is recommended. 

This Apache config may be of assistance (from [Stackoverflow](http://serverfault.com/questions/739163/run-apache-and-node-js-in-subfolder), also [this](http://serverfault.com/a/561897/20363), and [this](http://stackoverflow.com/a/9933890/125525)):

```
<VirtualHost *:80>
    ServerName domain.tld
    DocumentRoot /home/username/public_html

    <Directory /home/username/public_html/>
        Options +Indexes +FollowSymLinks +MultiViews
        AllowOverride All
    </Directory>

    # NODEJS APP in 'ergo-admin' FOLDER
    # NB: it is assumed base_uri in admin.ergo.js is set to '/ergo-admin/'
    AllowEncodedSlashes NoDecode
    <Location "/ergo-admin">
        ProxyPass http://localhost:3000/ergo-admin nocanon
        ProxyPassReverse http://localhost:3000/ergo-admin
    </Location>
 </VirtualHost>
 ```

## Running

Everyone uses [pm2](https://www.npmjs.com/package/pm2):

```
pm2 start app.js --watch --name username-admin
```

