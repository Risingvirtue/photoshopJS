canvas = document.getElementById("canvas");
ctx = canvas.getContext('2d');

canvas1 = document.getElementById("1");
ctx1 = canvas1.getContext('2d');
canvas2 = document.getElementById("2");
ctx2 = canvas2.getContext('2d');



$(document).ready(function() {
	socket = io.connect('http://localhost:3000');
	
	socket.on('images', makeImages);
	
})

function render() {
	socket.emit('render');
}

var img1Info = [];
var img2Info = [];

function makeImages(data) {
	console.log(data);
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
		
	
	
	setTimeout(function() {
		
		for (var i = 0; i< data.imgData1.length; i++) {
			for (var j = 0; j < data.imgData2.length; j++) {
				var name = data.imgData1[i].name + ' ' + data.imgData2[j].name;
				console.log(name);
				changePixel(img1Info[i], img2Info[j]);
				saveCanvas(name);
			}
		}
		
	} ,0 )

}

function renderImgTop() {
	canvas1.height = 300;
	canvas1.width = 550;
	ctx1.clearRect(0,0, 550, 300);
	ctx1.drawImage(this, 0, 0, 550, 300);
	
	imgd1 = ctx1.getImageData(0,0, canvas1.width, canvas1.height);
	img1Info.push(imgd1.data);
	
}

function renderImgBottom() {
	canvas2.height = 300;
	canvas2.width = 550;
	ctx2.clearRect(0,0, 550, 300);
	ctx2.drawImage(this, 0, 0, 550, 300);
	
	imgd2 = ctx2.getImageData(0,0, canvas2.width, canvas2.height);
	
	img2Info.push(imgd2.data);
	
}

function changePixel(img1, img2) {
	resetCanvas();
	var row = 0;
	var col = 0;
	for (var i = 0, n = img1.length; i < n; i += 4) {
		var img1Pix = {r: img1[i], g: img1[i+1], b: img1[i+ 2], a: img1[i+3]};
		var img2Pix = {r: img2[i], g: img2[i+1], b: img2[i+ 2], a: img2[i+3]};
		ctx.fillStyle = 'rgba(' + img1Pix.r + ',' + img1Pix.g + ',' + img1Pix.b + ',' + img1Pix.a + ')';
		ctx.clearRect(col, row, 1,1);
		ctx.fillRect(col, row, 1,1);
		ctx.fillStyle = 'rgba(' + img2Pix.r + ',' + img2Pix.g + ',' + img2Pix.b + ',' + img2Pix.a + ')';
		ctx.clearRect(col + 450, row + 700, 1,1);
		ctx.fillRect(col + 450, row + 700, 1,1);
		
		col++;
		if (col >= 550) {
			col = 0;
			row++;
		}

	}
	

}

function resetCanvas() {
	ctx.clearRect(0,0, canvas.width, canvas.height);
	ctx.fillStyle = 'white';
	ctx.fillRect(0,0, canvas.width, canvas.height)
	ctx.fillStyle = 'red';
	ctx.fillRect(490,460, 20, 80);
	ctx.fillRect(460,490, 80, 20);
}
function saveCanvas(name) {
	var newImgData = canvas.toDataURL('image/jpeg', 1.0).slice(23);
	socket.emit('saveNewImg', {newName: name, newImgData: newImgData});
}