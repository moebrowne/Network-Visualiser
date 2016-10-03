'use strict';

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

			let timestampNow = (Date.now()/1000);
			let timestampLastSeen = (Date.parse(data[' Last time seen'])/1000);

			var macAddr = data['BSSID'].replace(' ', '');
			var SSID = data[' ESSID'];
			var AP = {
				'mac': macAddr,
				'SSID': SSID,
				'power': data[' Power'],
				'lastSeenSeconds': (timestampNow-timestampLastSeen),
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

			let timestampNow = (Date.now()/1000);
			let timestampLastSeen = (Date.parse(data[' Last time seen'])/1000);

			var client = {
				'mac': clientMacAddr,
				'AP': APMacAddr,
				'power': data[' Power'],
				'lastSeenSeconds': (timestampNow-timestampLastSeen),
				'size': 5
			};

			clients[clientMacAddr] = client;

			socket.emit('client', client);
		});
	});
});
