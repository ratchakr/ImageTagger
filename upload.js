'use strict';
/**
 * Import ENV variables
 */
require('dotenv').config();

/*
 * Import packages
 */
var express = require('express');
var http = require('http');
var path = require('path');
var aws = require('aws-sdk');
var fs = require('fs');
var os = require('os');
var formidable = require('formidable');
var gm = require('gm');
var knox = require('knox');
var couchbase = require("couchbase");
var config = require("./config");

/*
 * Load S3 information from environment variables (.env)
 */
var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
var AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
var S3_BUCKET = process.env.S3_BUCKET;
var HOST = process.env.HOST;

/*
 * Setup our Express app
 */
var app = express();
app.set('views', __dirname + '/views');
//app.engine('html', require('ejs').renderFile);
app.engine('html', require('hogan-express'));
app.set('port', process.env.PORT || 3000);
app.set('host', process.env.HOST || "localhost");

// Global declaration of the Couchbase server and bucket to be used
module.exports.bucket = (new couchbase.Cluster(process.env.COUCHBASE_HOST || config.couchbase.server)).openBucket(
    process.env.COUCHBASE_BUCKET || config.couchbase.bucket);

aws.config.update({accessKeyId: AWS_ACCESS_KEY , secretAccessKey: AWS_SECRET_KEY });
aws.config.update({region: 'us-east-1' , signatureVersion: 'v4' });

app.use(express.static(path.join(__dirname, 'public')));

var server = require('http').createServer(app);
var io = require('socket.io')(server);


var knoxClient = knox.createClient({
    key: AWS_ACCESS_KEY,
    secret: AWS_SECRET_KEY,
    bucket: S3_BUCKET
})

require('./routes/routes.js')(express, app, formidable, fs, os, gm, knoxClient, couchbase, aws, S3_BUCKET, io);




/*app.get('/account', function(req, res){
    console.log("Rendering file upload page");
    res.render('upload.html');
});*/



server.listen(app.get('port'), function(){
    console.log('PhotoGallery App Running on port: ' + app.get('port'));
});


