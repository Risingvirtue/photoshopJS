$(document).ready(function() {
	//listening to localhost 3000
	
	
	$('#normal').css('height', window.innerHeight *2 /3);
	socket.on('output', output);
	
})

function generateCYOA() {
	
	$('#cyoa').css('display', 'none');
	$('#render').css('display', 'none');
	
	socket.emit('renderJSON', {});
}


function output() {
	$('#message').html('Files have been saved.');
	
	$('#message').fadeOut(1000,function(err) {
		$('#cyoa').fadeIn('slow');
		$('#render').fadeIn('slow');
		resetInfo();
	});
}

