var express = require('express')
var app = express()
var server = app.listen(3000);

var fs = require('fs');
var path = require('path');

app.use(express.static('public'));

var socket = require('socket.io');

var io = socket(server);

//listens to localhost
io.sockets.on('connection', newConnection);

var directory = path.dirname(process.argv[1]);
var folder1 = directory + '\\img\\Combo1';
var folder2 = directory + '\\img\\Combo2';
var saveFolder = directory + '\\img\\Result';
function newConnection(socket) {
	console.log('New Connection: ' + socket.id);
	
	socket.on('render', render);
	
	function render() {
		console.log('Start!');
		var files1 = fs.readdirSync(folder1);
		var files2 = fs.readdirSync(folder2);
		//console.log(files1, files2);
		var imgData1 = [];
		var imgData2 = [];

		for (img of files1) {
			
			if (img.indexOf('.') == 0) {
				continue;
			}
			
			var actualImg = getImage(folder1 + '\\' + img);
			var actualData = "data:image/png;base64,"+ actualImg.toString("base64");
			var name = img.split('.')[0];
			name = name.split('_')[0].slice(name.indexOf('-') + 1);
			
			
			imgData1.push({name: name, actualData: actualData});
		}

		for (img of files2) {
			if (img.indexOf('.') == 0) {
				continue;
			}
			var actualImg = getImage(folder2 + '\\' + img);
			var actualData = "data:image/png;base64,"+ actualImg.toString("base64");
			var name = img.split('.')[0];
			name = name.split('_')[0];
			name = name.slice(name.indexOf('-') + 1);
			
			imgData2.push({name: name, actualData: actualData});
		}
		console.log

		socket.emit('images', {imgData1: imgData1, imgData2: imgData2});
		console.log('rendering');
	}
	
	socket.on('saveNewImg', saveNewImg);
	
	function saveNewImg(data) {
		
		fs.writeFile(saveFolder + '\\' + data.newName + '.jpeg', data.newImgData, 'base64', function(err){
			if (err) throw err
			console.log('File ' + data.newName + ' saved.')
			socket.emit('saved', data.newName);
		})
	}
	
}


function getImage(currPath) {
	
	var bitmap = fs.readFileSync(currPath);
	return bitmap;

}