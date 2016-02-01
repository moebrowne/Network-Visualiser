var csv = require('csv-parser');
var fs = require('fs');

var nodeData = [];

function getRandomIntInclusive(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

fs.createReadStream('airmondata')
	.pipe(csv())
	.on('data', function(data) {

		//console.log('row', data);

		if (data[' BSSID'] === ' (not associated) ') {
			return;
		}

		if(typeof nodeData[data[' BSSID']] === 'undefined') {
			nodeData[data[' BSSID']] = {
				"name": data[' BSSID'],
				"position": {
					"x": getRandomIntInclusive(100,1200),
					"y": getRandomIntInclusive(100,600)
				},
				"size": 10,
				"subnodes": []
			};
		}

		nodeData[data[' BSSID']].subnodes.push({
			"name": data['Station MAC'],
			"size": 5,
			"distance": (Math.max((1-data[' Power']),25))});
	})
	.on('end', function() {
		//console.log(nodeData);
		//console.log(JSON.stringify(nodeData));

		var cleanData = [];

		Object.keys(nodeData).forEach(function(key) {
			var val = nodeData[key];
			console.log(val);
			cleanData.push(val);
		});

		console.log(cleanData);


		fs.writeFile('nodes.json', JSON.stringify(cleanData), { flags: '+w' }, function (err) {
			if (err !== null) {
				console.error(err);
				throw err;
			}
		});

	});
