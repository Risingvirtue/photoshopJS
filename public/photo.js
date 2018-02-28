canvas = document.getElementById("canvas");
ctx = canvas.getContext('2d');

canvas1 = document.getElementById("1");
ctx1 = canvas1.getContext('2d');
canvas2 = document.getElementById("2");
ctx2 = canvas2.getContext('2d');



$(document).ready(function() {
	//listening to localhost 3000
	socket = io.connect('http://localhost:3000');
	socket.on('images', makeImages);
})

function render() {
	socket.emit('render');
	$("#render").css('display', 'none');
	$("#cyoa").css('display', 'none');
}

var img1Info = [];
var img2Info = [];
var imgInfoLine = [];
var index = 0;
function makeImages(data) {
	$("#message").html('Files are currently being rendered.');
	//gets image data for everything
	for (var i = 0; i < data.imgData1.length; i++) {
		var imgData1 = data.imgData1[i].actualData;
		var img1 = new Image();
		img1.onload = renderImgTop;
		img1.src = imgData1;
	}
	for (var j = 0; j < data.imgData2.length; j++) {
		var imgData2 = data.imgData2[j].actualData;
		var img2 = new Image();
		img2.onload = renderImgBottom;
		img2.src = imgData2;
	}
	//creates new images from all combinations and saves them
	setTimeout(function() {
		var total = data.imgData1.length * data.imgData2.length;
		var count = 0;
		for (var i = 0; i< data.imgData1.length; i++) {
			for (var j = 0; j < data.imgData2.length; j++) {
				var name = data.imgData1[i].name + '-' + data.imgData2[j].name + '-ebay';
				imgInfoLine.push({img1: img1Info[i], img2: img2Info[j], name: name})
			}
		}
		setTimeout(renderAndSave, 0);
	} , 0)
}

function renderImgTop() {
	canvas1.height = 575;
	canvas1.width = 575;
	ctx1.clearRect(0,0, 575, 575);
	ctx1.drawImage(this, 0, 0, 575, 575);
	
	imgd1 = ctx1.getImageData(0,0, canvas1.width, canvas1.height);
	img1Info.push(imgd1.data);
	
}

function renderImgBottom() {
	canvas2.height = 425;
	canvas2.width = 425;
	ctx2.clearRect(0,0, 425, 425);
	ctx2.drawImage(this, 0, 0, 425, 425);
	
	imgd2 = ctx2.getImageData(0,0, canvas2.width, canvas2.height);
	img2Info.push(imgd2.data);
	
}
function renderAndSave() {
	var img1 = imgInfoLine[index].img1;
	var img2 = imgInfoLine[index].img2;
	var name = imgInfoLine[index].name;
	
	
	resetCanvas();
	changePixelTop(img1);
	changePixelBottom(img2);
	drawPlus(575,575);
	
	saveCanvas(name);
	index++;
	var percent = Math.round((index -1)  * 100 / imgInfoLine.length);
	saveMessage(percent, name);
	if (index < imgInfoLine.length) {
		setTimeout(renderAndSave, 0);
	} else {
		saveMessage(100, name);
		$("#percent").fadeOut(1000);
		$("#message").fadeOut(1000,function(err) {
			$('#cyoa').fadeIn('slow');
			$('#render').fadeIn('slow');
			resetInfo();
		});	
	}
}

function changePixelTop(img1) {
	var marginLeft = 0;
	var marginTop = 0;
	var row = 0;
	var col = 0;
	for (var i = 0, n = img1.length; i < n; i += 4) {
		var img1Pix = {r: img1[i], g: img1[i+1], b: img1[i+ 2], a: img1[i+3]};
		ctx.fillStyle = 'rgba(' + img1Pix.r + ',' + img1Pix.g + ',' + img1Pix.b + ',' + img1Pix.a + ')';
		ctx.clearRect(col + marginLeft, row + marginTop , 1,1);
		ctx.fillRect(col + marginLeft, row + marginTop, 1,1);
		col++;
		if (col >= 575) {
			col = 0;
			row++;
		}
	}
}

function changePixelBottom(img2) {
	var row = 0;
	var col = 0;
	var marginRight = 25;
	var marginBottom = 25;
	for (var i = 0, n = img2.length; i < n; i += 4) {
		
		var img2Pix = {r: img2[i], g: img2[i+1], b: img2[i+ 2], a: img2[i+3]};
		ctx.fillStyle = 'rgba(' + img2Pix.r + ',' + img2Pix.g + ',' + img2Pix.b + ',' + img2Pix.a + ')';
		ctx.clearRect(col + 575 - marginRight, row + 575 - marginBottom, 1, 1);
		ctx.fillRect(col + 575 - marginRight, row + 575 - marginBottom, 1, 1);
		col++;
		if (col >= 425) {
			col = 0;
			row++;
		}
	}
}

function resetCanvas() {
	ctx.clearRect(0,0, canvas.width, canvas.height);
	ctx.fillStyle = 'white';
	ctx.fillRect(0,0, canvas.width, canvas.height)
}

function drawPlus(x, y) {
	var width = 20;
	var height = 80;
	ctx.fillStyle = 'red';
	ctx.fillRect(x - width / 2, y - height / 2, width, height);
	ctx.fillRect(x - height / 2,y - width /2 , height, width);
	/*
	ctx.rect(0,0, 575, 575);
	ctx.rect(575, 575, 425, 425);
	ctx.stroke();
	*/
}

function saveCanvas(name) {
	//gets rid of header
	var newImgData = canvas.toDataURL('image/jpeg', 1.0).slice(23);
	socket.emit('saveNewImg', {newName: name, newImgData: newImgData});
}

function saveMessage(percent, name) {
	$("#percent").html(percent + '% complete.')
	$("#message").html('File ' + name + ' is being rendered. \n');
}

function resetInfo() {
	img1Info = [];
	img2Info = [];
	imgInfoLine = [];
	index = 0;
	$("#percent").html('');
	$("#message").html('');
	$("#percent").css('display', 'block');
	$("#message").css('display', 'block');
}