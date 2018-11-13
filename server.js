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

var ids = {};
function newConnection(socket) {
	console.log('New Connection: ' + socket.id);
	socket.on('renderJSON', renderJSON);
	
	function renderJSON(data) {
		var promocode = data.promocode;
		var output = '';
		var templates = {};
		
		buyItems = [];
		getItems = [];
		
		var idArr = [];
		var index = 0;
		templates = netsuite.getTemplates();
		output += templates.cyoaHeader;
		netsuite.getItemId(csvPath, function(err, data) {
			buyItems = data.buyItems;
			for (var col = 0; col < buyItems.length; col++) {
				for (var row = 0; row < buyItems[col].length; row++) {
					var internalid = buyItems[col][row];
					ids[internalid] = false;
					idArr.push(internalid);
				}
			}
			
			getItems = data.getItems;
			
			for (var col = 0; col < getItems.length; col++) {
				for (var row = 0; row < getItems[col].length; row++) {
					var internalid = getItems[col][row];
					ids[internalid] = false;
					idArr.push(internalid);
					
				}
			}
			
			
			function getAllItems() {
				var sliced = idArr.slice(10 * index, 10 * (index + 1));
				
				if (sliced.length == 0) {
					return;
				}
				netsuite.getItem(sliced, function(err, data){
					if (typeof data != "undefined") {
						for (var i = 0; i < data.length; i++) {
							ids[data[i].internalid] = data[i];
						}
					}
					index++;
					
					getAllItems();
				});
			}
			
			getAllItems();
			//getGetItems();
		});
		
		interval = setInterval(function() {
			//console.log(Math.min(100, (index * 1000) / idArr.length) + ' % done');
			if (index * 10 > idArr.length) {

				clearInterval(interval);
				fillTemplate(buyItems[0], function(err, data) {
					
					fs.writeFile('./generated Files/email.txt', data, (err) => {
							if (err) throw err;
							console.log('The file email.txt has been saved.');
							socket.emit('email');
					});
				})
				
				//for output.txt
				var buyHeaders = generateBuyHeaders(buyItems);
				buildItems(buyItems, buyHeaders, true, templates.cyoaBuyItem, function(err, data){
					output += data;
					var getHeaders = generateGetHeaders(getItems);
					buildItems(getItems, getHeaders, false, templates.cyoaGetItem, function(err, data){
						output += data;
						output += format(templates.cyoaFooter, {
							promocode: promocode,
							numInput: buyItems.length + getItems.length
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
				var item1 = ids[items[i]];
				var item2 = ids[items[i + 1]];
				console.log('i', i);
				template = format(data, {
					urlcomponent1: domain + item1.urlcomponent,
					itemimagesdetail1: netsuite.getImage(item1),
					itemid1: item1.itemid,
					displayname1: item1.storedisplayname2.slice(item1.itemid.length + 1),
					pricelevel2formatted1: item1.pricelevel2_formatted,
					pricelevel7formatted1: netsuite.getPrice(item1),
					urlcomponent2: domain + item2.urlcomponent,
					itemimagesdetail2: netsuite.getImage(item2),
					itemid2: item2.itemid,
					displayname2: item2.storedisplayname2.slice(item2.itemid.length+1),
					pricelevel2formatted2: item2.pricelevel2_formatted,
					pricelevel7formatted2: netsuite.getPrice(item2)
				});
				outputBlocks.push(template);
			} 		
		}

		callback(null, outputBlocks.join('\n'));
	});
}

function buildItems(items, headers, isBuy, template, callback){
	var output = '';
	
	for (var col = 0; col < items.length; col++) {
		if (headers) {
			output += headers[col];
		}
		output += '<form>\n';
		for(var i = 0; i < items[col].length; i++){
			var itemId = items[col][i];
			var itemInfo = ids[itemId];
			if(i === 0 || i % 3 === 0 ){
				output += '<div class="section group">\n';
			}
			
			output += format(template, {
				itemurl: domain + itemInfo.urlcomponent,
				imageurl: netsuite.getImage(itemInfo),
				internalid: itemInfo.internalid,
				itemname: itemInfo.storedisplayname2,
				price: netsuite.getPrice(itemInfo, isBuy)
			});
			output += '\n';
			
			if( (i+1) % 3 === 0 || i+1 === items[col].length ){
				output += '</div>\n';
			}
		}
		output += '</form>\n';
	}
	callback(null, output);
}

function generateBuyHeaders(buyItems) {
	var buyArr = [];
	for (var i = 0; i < buyItems.length; i++) {
		
		buyArr.push('<h2 class="form-title top-border">Purchase a select tool below.</h2>\n');
	}
	return buyArr;
}


function generateGetHeaders(getItems) {
	if (getItems.length == 1) {
		return ['<h2 class="form-title top-border">Choose your free item to go with it</h2>\n'];
	} else {
		const place = {0: 'FIRST', 1: 'SECOND', 2: 'THIRD', 3: 'FOURTH', 4: 'FIFTH'};
		var header = [];
		for (var i = 0; i < getItems.length; i++) {
			header.push('<h2 class="form-title top-border">Choose your ' +  place[i] + ' free item</h2>\n');
		}
		return header;
	}
}