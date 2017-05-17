function showStatus(msg,delay){
		$('.status').hide().html(msg).fadeIn(200).delay(delay).fadeOut(300);
}

function ajax(config){
			this.method = config.method || 'GET';
			this.payload = config.payload || null;
			var xhr = new XMLHttpRequest();
			xhr.open(this.method, config.url, true);
			xhr.upload.addEventListener("progress", function(e){
				config.progress(e);
			});
			xhr.addEventListener("load", function(){
				config.success(xhr);
			});
			xhr.addEventListener("error", config.error);
			xhr.send(this.payload);
}

$(function(){
		$(document).on('change', '.uploadPic', function(e){
			var ext = this.value.match(/\.([^\.]+)$/)[1].toLowerCase();
			var permit = ['jpg','gif','png'];
			if(permit.indexOf(ext)>-1){
				showStatus('Ready to Upload !', 600);
			} else {
				showStatus('Your Chosen File Is Not Permitted !! Please pick JPG, GIF or PNG files only !', 4000);
				$(this).val('');
			}
		})


})

function renderUI (imageList) {

	for(var i = 0; i < imageList.length; i++) {
	    console.log('... In renderImages function ...');
	    console.log('tags = ',imageList[i].tags);
	    var str = '<li>';
	    str += '<div class="overlay">';
	    str += '<div class="voteCtrl">';
	    str += '<a href="#" data-photoid="' + imageList[i].id + '" class="like">';
	    str += '<img src="../images/like.png" alt="Click Here to Like !">';
	    str += '<h4>' + imageList[i].likes + '</h4>';
	    str += '</a>';
	    str += '</div>';
	    str += '</div>';
	    str += '<div class="imageHolder">';
	    str += '<img src="https://s3.amazonaws.com/la-image-tagger-chakrar27/' + imageList[i].filename + '" alt="">';
	    str += '</div>';
	    str += '<div class="tags">';
	    str += '<ul>';
	    for (var j = 0; j < imageList[i].tags.length; j++) {
	    	console.log('tag value =', imageList[i].tags[j]);
	    	if (imageList[i].tags[j] !== '') {
		    	str += '<li>';
		        str += '<a href="#" data-tagname="' + imageList[i].tags[j] + '" class="showTag">';
		        str += '<h4>' + imageList[i].tags[j] + '</h4>';
		        str += '</a>';
		        str += '</li>';
	    	}
	    }
	    str += '</ul>';
	    str += '</div>';
	    str += '</li>';
	    $('.gallery ul').append(str);
	}

}

