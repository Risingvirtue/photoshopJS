/* Returns item detail data as JSON object */
var https = require('https');
var fs = require('fs');
var csv = require('csv');

module.exports = {
	getItem: function(itemids, callback){

		var url = 'https://www.toolup.com/api/items?include=facets&fieldset=details&facet.exclude=custitem_brand_applied%2Ccustitem_category_applied%2Ccustitem_featured_home_item&language=en&country=US&currency=USD&pricelevel=7&c=855722&n=2&id=';
		if ( Array.isArray(itemids) )
			
			itemids = itemids.join(',');
		url += itemids;
		
		https.get(url, function(response){

			response.setEncoding('utf8');

			var body = '';
			response.on('data', function(data){
				
				body += data;
				
			});

			response.on('end', function(){
				try {
					
					var items = JSON.parse(body).items;
				} catch (err) {
					console.error("Couldn't parse JSON", err);
					return callback(err);
				}
				callback(null, items);
			});
		});
	},
	getTest: function(itemids, callback){

		var url = 'http://www.toolup.com/api/items?include=facets&fieldset=details&facet.exclude=custitem_brand_applied%2Ccustitem_category_applied%2Ccustitem_featured_home_item&language=en&country=US&currency=USD&pricelevel=7&c=855722&n=2&id=';
		if ( Array.isArray(itemids) )
			itemids = itemids.join(',');
		url += itemids;
		
		http.get(url, function(response){

			response.setEncoding('utf8');

			var body = '';
			response.on('data', function(data){
				
				body += data;
				
			});

			response.on('end', function(){
				try {
					
					var items = body;

				} catch (err) {
					console.error("Couldn't parse JSON", err);
					return callback(err);
				}
				callback(null, items);
			});
		});
	},
	// If image has extra _1, the object key changes from 'urls' to '1_1'
	getImage: function(item){
		if(typeof item.itemimages_detail.urls === 'undefined')
			return getURL(item.itemimages_detail);
		else
			return item.itemimages_detail.urls[0].url;
	},
	getPrice: function(item){
		console.log(item);
		var map = item.pricelevel12 ? item.pricelevel12 : item.pricelevel7;
		var formatted = item.pricelevel12 ? item.pricelevel12_formatted : item.pricelevel7_formatted;
		console.log(map);
		if(item.pricelevel7 >= item.pricelevel6)
			return formatted;
		else
			return item.pricelevel6_formatted;
	},
	getTemplates: function(csvFile) {
		var templates = {};
		var templateFiles = [
			'cyoaHeader',
			'cyoaFooter',
			'cyoaGetItem',
			'cyoaBuyItem'
		];
		
		templateFiles.forEach(function(template) {
			var data = fs.readFileSync('templates/' + template + '.txt', 'utf8')
				templates[template] = data;
		})
		
		return templates;
	},
	getItemId: function(itemPath, callback) {
		buyItems = [];
		getItems = [];
		var data = fs.readFileSync(itemPath, 'utf8');
			csv.parse(data, function(err, data){
				var headers = data[0];
				
				for (var col = 0; col < data[0].length; col++) {
					var buyCol = [];
					var isBuy = data[0][col].toLowerCase().indexOf('buy') != -1;
					for (var row = 1; row < data.length; row++) {
						var internalid = data[row][col];
						if (internalid)
							buyCol.push(internalid);
					}
					if (isBuy) {
						buyItems.push(buyCol);
					} else {
						getItems.push(buyCol);
					}
				}
				callback(null, {buyItems: buyItems, getItems: getItems});
				
			})
	}
}

function getURL(obj){
	var key = Object.keys(obj)[0];
	if(typeof obj[key].url === 'undefined')
		return getURL(obj[key]);
	else
		return obj[key].url;
}