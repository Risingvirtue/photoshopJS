/* Returns item detail data as JSON object */
var https = require('https');
var fs = require('fs');
var csv = require('csv');

module.exports = {
	getItem: function(itemids, callback){
		
		var url = 'https://www.toolup.com/api/items?include=facets&fieldset=details&facet.exclude=custitem_brand_applied%2Ccustitem_category_applied%2Ccustitem_featured_home_item&language=en&country=US&currency=USD&pricelevel=7&c=855722&n=2&id=';
				  

		//console.log({itemids: itemids});
	
			
			itemids = itemids.join(',');
			url += itemids;
			console.log(url);
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
		if(item.pricelevel7 >= item.pricelevel6)
			return item.pricelevel7_formatted;
		else
			return 'See Price in Cart';
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
				var buyIndex = headers.indexOf('Buy');
				var getIndex = headers.indexOf('Get');
				for (var row = 1; row < data.length; row++){
					if(data[row][buyIndex] !== '')
						buyItems.push(data[row][buyIndex]);
					if(data[row][getIndex] !== '')
						getItems.push(data[row][getIndex]);
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