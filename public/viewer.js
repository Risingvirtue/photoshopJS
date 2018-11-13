$(document).ready(function() {
	//listening to localhost 3000
	
	
	$('#normal').css('height', window.innerHeight *2 /3);
	socket.on('output', output);
	
})

function generateCYOA() {
	var promocode = $('#promocode').val();
	console.log(promocode);
	$("body").css({"background-color":"white"}); 
	$('#sunImage').css('display', 'none');
	socket.emit('renderJSON', {promocode: promocode});
}


function output() {
	$('#message').html('Files have been saved.');
	
	$('#message').fadeOut(1000 , function(err) {
		
		$('#sunImage').fadeIn('slow');
		resetInfo();
	});
}

