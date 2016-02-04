var csv = require('csv-parser');
var fs = require('fs');
require('datejs');

var nodeData = [];

var associated = 0;
var unassociated = 0;
var noap = 0;

function getRandomIntInclusive(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

fs.createReadStream('xx00')
	.pipe(csv())
	.on('data', function(data) {

		if(typeof data['BSSID'] === 'undefined' || data[' ESSID'] === ' ' || data[' Power'] === '  -1') {
			return;
		}

		nodeData[data['BSSID']] = {
			"name": data[' ESSID']+' ('+data[' Power']+')',
			"distance": (80+parseInt(data[' Power']))*15,
			"size": 10,
			"subnodes": []
		};
	})
	.on('end', function() {

		fs.createReadStream('xx01')
			.pipe(csv())
			.on('data', function (data) {

				if (typeof data[' BSSID'] ===  'undefined') {
					return;
				}

				data[' BSSID'] = data[' BSSID'].substr(1);

				// Remove unassociated clients
				if (data[' BSSID'] === ' (not associated) ') {
					unassociated++;
					return;
				}

				if (typeof nodeData[data[' BSSID']] === 'undefined') {
					noap++;
					return;
				}

				associated++;

				//console.log(nodeData[data[' BSSID']]);

				nodeData[data[' BSSID']].subnodes.push({
					"name": data['Station MAC'],
					"size": 5,
					"distance": (Math.max((1 - data[' Power']), 25))
				});
			})
			.on('end', function () {

				var allData = [];

				allData.push({
					"name": "WLAN9",
					"position": {
						"x": 600,
						"y": 450
					},
					"size": 20,
					"subnodes": []
				});

				Object.keys(nodeData).forEach(function (key) {
					var val = nodeData[key];
					allData[0].subnodes.push(val);
				});

				console.log('APs: ' + allData[0].subnodes.length);
				console.log('Associated Clients: ' + associated);
				console.log('Unassociated Clients: ' + unassociated);
				console.log('APless Clients: ' + noap);

				fs.writeFile('nodes.json', JSON.stringify(allData), {flags: '+w'}, function (err) {
					if (err !== null) {
						console.error(err);
						throw err;
					}
				});

			});
	});
