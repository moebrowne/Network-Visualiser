'use strict';

var io = require('socket.io')(3000);
var csv = require('csv-parser');
var fs = require('fs');
require('datejs');

var wirelessAP = require('./wirelessAP');

var APs = {};
var clients = {};

io.on('connection', function(socket) {
	console.log('User connected');

	// Send the client the current set of APs and clients
	socket.emit('APs', APs);
	socket.emit('clients', clients);
});

fs.watch('airmondata-APs.csv', {}, function() {
	fs.createReadStream('airmondata-APs.csv')
		.pipe(csv())
		.on('data', function (data) {

			if (typeof data['BSSID'] === 'undefined') return;

			let macAddr = data['BSSID'].trim();
			if (typeof APs[macAddr] === 'undefined') {
				APs[macAddr] = new wirelessAP();
			}

			let AP = APs[macAddr];

			AP.update(data);

			if (AP.lastUpdateChangedNodeData) {
				io.emit('AP', AP.nodeData);
			}
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

			let timestampLastSeen = (Date.parse(data[' Last time seen'])/1000);
			let secondsLastSeen = (Date.now()/1000)-timestampLastSeen;

			var client = {
				'mac': clientMacAddr,
				'AP': APMacAddr,
				'power': data[' Power'],
				'frames': parseInt(data[' # packets']),
				'active': (secondsLastSeen < 120),
				'size': 12
			};

			if (JSON.stringify(client) === JSON.stringify(clients[clientMacAddr])) {
				return;
			}

			clients[clientMacAddr] = client;

			io.emit('client', client);
		});
});
