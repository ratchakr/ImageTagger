module.exports = function (express, app, formidable, fs, os, gm, knoxClient) {
var router = express.Router();
//console.log("Router Object", router);
router.get('/', function (req, res) {
    console.log("Rendering file upload page");
    res.render('upload.html', {host:app.get('host')});
})

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

						}
					})

					req.end(buf);
				})
			});
		})
	})

}) 



app.use('/', router);	
}