var express = require('express')
var app = express()
var server = app.listen(3000);

var fs = require('fs');
var path = require('path');
var netsuite = require('./netsuite');
var csv = require('csv');
var format = require('string-template');
var domain = 'http://www.toolup.com/';

app.use(express.static('public'));

var socket = require('socket.io');

var io = socket(server);

//listens to localhost
io.sockets.on('connection', newConnection);

var directory = path.dirname(process.argv[1]);
var folder1 = directory + '/img/Combo1';
var folder2 = directory + '/img/Combo2';
var itemFolder = directory + '/items';
var csvFile = fs.readdirSync(itemFolder);
for (var i = 0; i < csvFile.length; i++) {
	if (csvFile[i].indexOf('.csv') != -1) {
		csvFile = csvFile[i];
		break;
	}

}

var csvPath = itemFolder + '/' + csvFile;
var saveFolder = directory + '/img/Result';
if (csvFile.indexOf('.csv') == -1) {
	console.log('Please include a csv file in the items folder.');
	return;
}
function newConnection(socket) {
	console.log('New Connection: ' + socket.id);
	socket.on('renderJSON', renderJSON);
	
	function renderJSON(data) {
		var promocode = data.promocode;
		var output = '';
		var templates = {};
		
		var buyItemData = [], buyItems = [], numBuyItems = 0;
		var getItemData = [], getItems = [], numGetItems = 0;
		var ids = {};
		templates = netsuite.getTemplates();
		output += templates.cyoaHeader;
		netsuite.getItemId(csvPath, function(err, data) {
			numBuyItems = data.buyItems.length;
			for (var i = 0; i < data.buyItems.length / 10; i++) {
				buyItems.push(data.buyItems.slice(i * 10, Math.min((i+ 1) * 10, data.buyItems.length)));
			}
			
			for (var i = 0; i < data.buyItems.length; i++) {
				ids[data.buyItems[i]] = false;
			}
			
			numGetItems = data.getItems.length;
			for (var j = 0; j <= data.getItems.length / 10; j++) {
				getItems.push(data.getItems.slice(j * 10, Math.min((j+ 1) * 10, data.getItems.length)));
			}
			
			for (var j = 0; j < data.getItems.length; j++) {
				ids[data.getItems[j]] = false;
			}
			var buyIndex = 0;
			var getIndex = 0;
			//console.log('test', buyItems[buyIndex], getItems[getIndex]);
			
			function getBuyItems() {
				netsuite.getItem(buyItems[buyIndex], function(err, data){
					if (typeof data != "undefined") {
						for (var i = 0; i < data.length; i++) {
							ids[data[i].internalid] = true;
						}
						
						buyItemData = buyItemData.concat(data);
					}
					
					buyIndex++;
					if (buyIndex < buyItems.length) {
						getBuyItems();
					}
				});
			}
			
			function getGetItems() {
				netsuite.getItem(getItems[getIndex], function(err, data){
					if (typeof data != "undefined") {
						for (var i = 0; i < data.length; i++) {
							ids[data[i].internalid] = true;
						}
						getItemData = getItemData.concat(data);	
					}
					getIndex++;
					if (getIndex < getItems.length) {
						getGetItems();
					}
				});
			}
			
			getBuyItems();
			getGetItems();
		});
		
		interval = setInterval(function() {
			//console.log({buyLength: buyItemData.length, currBuy: numBuyItems, getLength: getItemData.length, currGet: numGetItems});
			var notComplete = [];
			for (var id in ids) {
				if (!ids[id]) {
					notComplete.push(id);
				}
			}
			console.log({notComplete: notComplete});
			if (buyItemData.length == numBuyItems && getItemData.length == numGetItems) {
				//console.log(buyItemData.length, getItemData.length)
				clearInterval(interval);
				fillTemplate(buyItemData, function(err, data) {
					
					fs.writeFile('./generated Files/email.txt', data, (err) => {
							if (err) throw err;
							console.log('The file email.txt has been saved.');
							socket.emit('email');
					});
				})
				
				//for output.txt
				buildItems(buyItemData, templates.cyoaBuyItem, function(err, data){
					output += data;
					output += '</form>\n<h2 class="form-title top-border">Choose your free item to go with it</h2>\n';
					
					buildItems(getItemData, templates.cyoaGetItem, function(err, data){
						output += data;
						output += format(templates.cyoaFooter, {
							promocode: promocode
						});
						
						fs.writeFile('./generated Files/output.txt', output, (err) => {
							if (err) throw err;
							console.log('The file output.txt has been saved.');
							socket.emit('output');
						});
					})
				})
			}
		}, 1000);

	}
	
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
			
			var actualImg = getImage(folder1 + '/' + img);
			var actualData = "data:image/png;base64,"+ actualImg.toString("base64");
			var name = img.split('.')[0];
			name = name.split('_')[0].slice(name.indexOf('-') + 1);
			
			
			imgData1.push({name: name, actualData: actualData});
		}

		for (img of files2) {
			if (img.indexOf('.') == 0) {
				continue;
			}
			var actualImg = getImage(folder2 + '/' + img);
			var actualData = "data:image/png;base64,"+ actualImg.toString("base64");
			var name = img.split('.')[0];
			name = name.split('_')[0];
			name = name.slice(name.indexOf('-') + 1);
			
			imgData2.push({name: name, actualData: actualData});
		}


		socket.emit('images', {imgData1: imgData1, imgData2: imgData2});
		console.log('rendering');
	}
	
	socket.on('saveNewImg', saveNewImg);
	
	function saveNewImg(data) {
		
		fs.writeFile(saveFolder + '/' + data.newName + '.jpeg', data.newImgData, 'base64', function(err){
			if (err) throw err
			console.log('File ' + data.newName + ' saved.')
		})
	}
}


function getImage(currPath) {
	
	var bitmap = fs.readFileSync(currPath);
	return bitmap;

}

function fillTemplate(items, callback){

	fs.readFile('templates/template1.txt', 'utf8', function(err, data){

		var template = '';
		var outputBlocks = [];

		for(var i = 0; i < items.length - 1; i++){
			
			if(i % 2 == 0) {
				template = format(data, {
					urlcomponent1: domain + items[i].urlcomponent,
					itemimagesdetail1: netsuite.getImage(items[i]),
					itemid1: items[i].itemid,
					displayname1: items[i].storedisplayname2.slice(items[i].itemid.length+1),
					pricelevel2formatted1: items[i].pricelevel2_formatted,
					pricelevel7formatted1: netsuite.getPrice(items[i]),
					urlcomponent2: domain + items[i+1].urlcomponent,
					itemimagesdetail2: netsuite.getImage(items[i+1]),
					itemid2: items[i+1].itemid,
					displayname2: items[i+1].storedisplayname2.slice(items[i+1].itemid.length+1),
					pricelevel2formatted2: items[i+1].pricelevel2_formatted,
					pricelevel7formatted2: netsuite.getPrice(items[i+1])
				});
				outputBlocks.push(template);
			} 		
		}

		callback(null, outputBlocks.join('\n'));
	});
}

function buildItems(items, template, callback){

	var output = '<form>\n';

	for(var i = 0; i < items.length; i++){
		if(i === 0 || i % 3 === 0 ){
			output += '<div class="section group">\n';
		}

		output += format(template, {
			itemurl: domain + items[i].urlcomponent,
			imageurl: netsuite.getImage(items[i]),
			internalid: items[i].internalid,
			itemname: items[i].displayname,
			price: netsuite.getPrice(items[i])
		});
		output += '\n';

		if( (i+1) % 3 === 0 || i+1 === items.length ){
			output += '</div>\n';
		}
	}
	callback(null, output);
}