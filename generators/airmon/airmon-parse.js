var io = require('socket.io')(3000);
var csv = require('csv-parser');
var fs = require('fs');
require('datejs');

var APs = {};
var clients = {};

io.on('connection', function(socket) {
	console.log('User connected');

	fs.watch('airmondata-APs.csv', {}, function() {
		fs.createReadStream('airmondata-APs.csv')
		.pipe(csv())
		.on('data', function (data) {

			if (typeof data['BSSID'] === 'undefined') {
				return;
			}

			var macAddr = data['BSSID'].replace(' ', '');
			var AP = {
				'mac': macAddr,
				'power': data[' Power'],
				'size': 10
			};

			APs[macAddr] = AP;

			socket.emit('AP', AP);
		});
	});

	fs.watch('airmondata-clients.csv', {}, function() {
		fs.createReadStream('airmondata-clients.csv')
		.pipe(csv())
		.on('data', function (data) {
			if (typeof data['Station MAC'] === 'undefined' || typeof data[' BSSID'] === 'undefined' || data[' BSSID'] === ' ' || data[' BSSID'] === ' (not associated) ') {
				return;
			}

			var APMacAddr = data[' BSSID'].replace(' ', '');
			var clientMacAddr = data['Station MAC'].replace(' ', '');

			if (typeof APs[APMacAddr] === 'undefined') {
				return;
			}

			var client = {
				'mac': clientMacAddr,
				'AP': APMacAddr,
				'power': data[' Power'],
				'size': 5
			};

			clients[clientMacAddr] = client;

			socket.emit('client', client);
		});
	});
});
