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

								// check image moderation...if offensive image, send user a message else proceed
								var paramsMod = {
								    Image: {
								        S3Object: {
								            Bucket: S3_BUCKET, 
								            Name: filename
								        }
								    }, 
								    MinConfidence: 50
								};

								rekognition.detectModerationLabels(paramsMod, function(err, data) {
									if(err) {
										console.log("Error in REKO" + err);
									} else {
										console.log(" response from moderation = ", data);
										data = JSON.stringify(data);
										console.log(" response from moderation stringified = ", data);
										var jsonData = JSON.parse(data);
										var moderation = jsonData.ModerationLabels;
										if (null != moderation && moderation.length > 0) {
											console.log('moderation exists', moderation.length);
											//res.send(errMsg);
											Socket.emit('status', {'msg':'Image is offensive...please try with another image!', 'delay':6000});
										} else {
											console.log("Image is clean");
											// add code for celebrity recognition
											var paramsCelebs = {
												Image: {
											        S3Object: {
											            Bucket: S3_BUCKET, 
											            Name: filename
											        }
								    			}	
											};
											rekognition.recognizeCelebrities(paramsCelebs, function(err, data) {
											  if (err) console.log("err in celeb recognition", err.stack);
											   // an error occurred
											  else {
											  	   if (data != null) {
												       console.log("celebrity data",data);// successful response
												       var celebName = null;
												       if (null != data.CelebrityFaces && data.CelebrityFaces.length > 0) {
												           celebName = data.CelebrityFaces[0].Name;	
												       }
												       console.log("celebrity name = ", celebName);
												       if (celebName != null) {
												           Socket.emit('status', {'msg':'You are uploading an image featuring '+ celebName, 'delay':6000});
													       // no need to detect labels...just add the celeb info as tag in cb
															var tagsCeleb = [];
															tagsCeleb.push(celebName);
															var payloadCeleb = {
														        filename: filename,
														        likes: 0,
														        tags: tagsCeleb
															}
															//console.log("Saving payload", payload);
															ImageModel.save(payloadCeleb, function(error, result) {
								            					if(error) {
								                					return res.status(400).send(error);
								            					}
								        					});	

															// notify front-end that image is saved
															Socket.emit('status', {'msg':'Image of ' + celebName + ' Saved Successfully!', 'delay':3000});
															Socket.emit('doUpdate', {});

															// Delete file
															fs.unlink(nFile, function() {
																//console.log('Local file deleted !');
															})												           
												       } else {
											  	   		console.log("No celebrity 1...let's detect labels");
											  	   		// proceed with detecting labels
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
												       }
											  	    } else {
											  	   	    // probably redundant code...check and remove later
											  	   		console.log("No celebrity 2...let's detect labels");
											  	   		// proceed with detecting labels
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
											  	   }
											    }    
											});
										}
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
		console.log("result:::getimages = ", JSON.stringify(result));
		res.send(JSON.stringify(result));
	})
})

router.get('/like/:id', function(req, res, next){
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

router.get('/getimages/:tagname', function(req, res, next){
	console.log('inside getimages by tagname');
	ImageModel.getImagesByTag(req.params.tagname, function(err, result){
		console.log('result = ', JSON.stringify(result));
		var jsonFromDB = JSON.stringify(result);
		//var docFromDBArr = JSON.parse(jsonFromDB);
		//var docFromDB = docFromDBArr[0];
		
		res.send(JSON.stringify(result));
	}) 
})

app.use('/', router);	
}