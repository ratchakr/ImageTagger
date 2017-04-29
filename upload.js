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

/*
 * Setup our Express app
 */
var app = express();
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));

/*
 * Load S3 information from environment variables (.env)
 */
var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
var AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
var S3_BUCKET = process.env.S3_BUCKET

/*
 * Render the 'account.html' web page in views/ directory
 */
app.get('/account', function(req, res){
	console.log("Rendering file upload page");
    res.render('upload.html');
});

/*
 * Return JSON containing the temporarily-signed S3 request and the
 * anticipated URL of the image
 */
app.get('/sign_s3', function(req, res){
    aws.config.update({accessKeyId: AWS_ACCESS_KEY , secretAccessKey: AWS_SECRET_KEY });
    aws.config.update({region: 'us-east-1' , signatureVersion: 'v4' });
    var s3 = new aws.S3(); 
    var s3_params = { 
        Bucket: S3_BUCKET, 
        Key: req.query.file_name, 
        Expires: 60, 
        ContentType: req.query.file_type, 
        ACL: 'public-read'
    };
	console.log("parameters to getSignedURL func = "+ JSON.stringify(s3_params));
    s3.getSignedUrl('putObject', s3_params, function(err, data){ 
        if(err){ 
            console.log(err); 
        } else {
            console.log("No Error");			
            var return_data = {
                signed_request: data,
                url: 'https://'+S3_BUCKET+'.s3.amazonaws.com/'+req.query.file_name 
            };
			//console.log("return data",JSON.stringify(return_data));
            res.write(JSON.stringify(return_data));
            res.end();
        } 
    });
});

app.get('/recognize', function (req, res) {
    console.log("Calling Rekognition with request = "+req.query.file_name);
    aws.config.update({accessKeyId: AWS_ACCESS_KEY , secretAccessKey: AWS_SECRET_KEY });
    aws.config.update({region: 'us-east-1' , signatureVersion: 'v4' });
    var rekognition = new aws.Rekognition(); 
    
    var params = {
        Image: {
            S3Object: {
                Bucket: S3_BUCKET, 
                Name: req.query.file_name
            }
        }, 
        MaxLabels: 10, 
        MinConfidence: 50
    };

	rekognition.detectLabels(params, function(err, data) {
    if (err) {
		console.log("Error in REKO");
		//console.log(err, err.stack); // an error occurred
	}
    else {
		//console.log(data);           // successful response
		//res.write(JSON.stringify(data));
		console.log(JSON.stringify(data));
		data = JSON.stringify(data);
		
		var json = JSON.parse(data);
		var labels = json.Labels;
		console.log("labels",labels);
		res.write(JSON.stringify(labels));
        res.end();
	}     

 }
 );
});

/*
 * Start the server
 */
app.listen(app.get('port'));
