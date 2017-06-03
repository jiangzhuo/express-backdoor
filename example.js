var express = require('express')
var backdoor = require('./index')

var app = express();

// Serve URLs like /ftp/thing as public/ftp/thing
backdoor(app, {path: '/terminals'});
app.listen(3000);