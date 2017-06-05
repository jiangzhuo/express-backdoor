var express = require('express')
var backdoor = require('../index')

var app = express();

backdoor(app, {path: '/terminals'});
app.listen(3000);