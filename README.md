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
mkdir ergo-server
cd ergo-server
npm install ergo-server --production
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

4. Set the path the project (config.ergo.js):

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

## Proxy Configuration

Note that not much effort has been expended into hardening this server against all forms of attacks and using the server behind a proxy (using NGINX, Apache, or similar) is recommended. 

This Apache config may be of assistance (from [Stackoverflow](http://serverfault.com/questions/739163/run-apache-and-node-js-in-subfolder)):

```
<VirtualHost *:80>
    ServerName domain.tld
    DocumentRoot /home/username/public_html

    <Directory />
        Options +FollowSymLinks
        AllowOverride All
    </Directory>
    <Directory /home/username/public_html/>
        Options +Indexes +FollowSymLinks +MultiViews
        AllowOverride All
    </Directory>

    # NODEJS APP in 'ergo-admin' FOLDER
    <Location "/ergo-admin">
        ProxyPass http://localhost:3000/
        ProxyPassReverse http://localhost:3000/
    </Location>
 </VirtualHost>
 ```


