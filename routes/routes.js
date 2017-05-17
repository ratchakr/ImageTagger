var ImageModel = require("../models/recordmodel");

module.exports = function (express, app, formidable, fs, os, gm, knoxClient, couchbase, aws, S3_BUCKET, io) {
var router = express.Router();
//console.log("Router Object", router);
router.get('/', function (req, res) {
    console.log("Rendering file upload page");
    //console.log("couchbase object = ", couchbase);
    res.render('upload.html', {host:app.get('host')});
})

var Socket;

io.on('connection', function(socket) {
	Socket = socket;
})

var labels;
router.post('/upload', function(req, res, next) {

	function generateFilename(filename){
		var ext_regex = /(?:\.([^.]+))?$/;
		var ext = ext_regex.exec(filename)[1];
		var date = new Date().getTime();
		var charBank = "abcdefghijklmnopqrstuvwxyz";
		var fstring = '';
		for(var i = 0; i < 15; i++){
			fstring += charBank[parseInt(Math.random()*26)];
		}
		return (fstring += date + '.' + ext);
	}

	



	var tmpFile, nFile, fname;
	var newForm = formidable.IncomingForm();
	newForm.keepExtensions = true;
	newForm.parse(req, function(err, fields, files) {
		tmpFile = files.upload.path;
		fname = generateFilename(files.upload.name);
		nFile = os.tmpDir() + '/' + fname;
		res.writeHead(200, {'Content-type':'text/plain'});
		res.end();
	})

	newForm.on('end', function() {
		fs.rename(tmpFile, nFile, function() {
			// resize the image and upload to s3
			gm(nFile).resize(300).write(nFile, function () {
				// put in s3
				fs.readFile(nFile, function(err, buf) {
					var req = knoxClient.put(fname, {
						'Content-Length': buf.length,
						'Content-Type': 'image/jpeg'
					})

					req.on('response', function (res) {
						// body...
						if (res.statusCode == 200) {
							// store in couchbase photogallery bucket
							console.log("The image is uploaded to s3 successfully !");
							// call aws rekognition to detect labels
							var labelsReko = (function(filename, res) {
								var rekognition = new aws.Rekognition(); 
								var params = {
								    Image: {
								        S3Object: {
								            Bucket: S3_BUCKET, 
								            Name: filename
								        }
								    }, 
								    MaxLabels: 5, 
								    MinConfidence: 50
								};	
								//console.log("Calling Rekognition with = ", params);
								rekognition.detectLabels(params, function(err, data) {
								    if (err) {
										console.log("Error in REKO" + err);
									}
								    else {
										// successful response
										data = JSON.stringify(data);
										var json = JSON.parse(data);
										labels = json.Labels;
										//console.log("data labels", labels);
										var tags = [];
										for (var entry in labels) {
										    //console.log("Name: = ", labels[entry].Name);
											var item = labels[entry].Name;
											tags.push(item);
										}
										var payload = {
									        filename: filename,
									        likes: 0,
									        tags: tags
										}
										//console.log("Saving payload", payload);
										ImageModel.save(payload, function(error, result) {
			            					if(error) {
			                					return res.status(400).send(error);
			            					}
			            					//res.send(result);
			        					});	

										// notify front-end that image is saved
										Socket.emit('status', {'msg':'Image Saved Successfully!', 'delay':3000});
										Socket.emit('doUpdate', {});

										// Delete file
										fs.unlink(nFile, function() {
											//console.log('Local file deleted !');
										})

									}
								})
							})(fname, res);							
						}
					})
					req.end(buf);
				})
			});
		})
	})

}) 

router.get('/getimages', function(req, res, next){
	ImageModel.getAll(function(err, result){
		res.send(JSON.stringify(result));
	})
})

router.get('/like/:id', function(req, res, next){
	//console.log('inside like');
	//ImageModel.findByIdAndUpdate(req.params.id, {$inc:{votes:1}}, function(err, result){
		//res.send(200, {votes:result.votes});
	//})

	ImageModel.getByDocumentId(req.params.id, function(err, result){
		//console.log('result before incrementing likes = ', result);
		var jsonFromDB = JSON.stringify(result);
		var docFromDBArr = JSON.parse(jsonFromDB);
		var docFromDB = docFromDBArr[0];
		console.log("docFromDB ", docFromDB);
		var likes = docFromDB.likes;
		console.log("likes before ", likes);
		// increment the like by 1
		likes = likes + 1;
		console.log("likes after ", likes);
		docFromDB.likes = likes;

		console.log("Saving payload with ", JSON.stringify(docFromDB));

		ImageModel.save(docFromDB, function(error, result) {
			if(error) {
				return res.status(400).send(error);
			}
			res.status(200).send({likes:docFromDB.likes});
		})

	}) 
})

app.use('/', router);	
}