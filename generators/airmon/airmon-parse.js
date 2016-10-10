'use strict';

var io = require('socket.io')(3000);
var csv = require('csv-parser');
var fs = require('fs');
require('datejs');

var wirelessAP = require('./wirelessAP');
var wirelessClient = require('./wirelessClient');

var APs = {};
var clients = {};

io.on('connection', function(socket) {
	console.log('User connected');

	// Get all the AP node data
	let APNodeData = {};
	for (var APMacAddr in APs) {
		if (!APs.hasOwnProperty(APMacAddr)) continue;
		APNodeData[APMacAddr] = APs[APMacAddr].nodeData;
	}
	socket.emit('APs', APNodeData);

	// Get all the client node data
	let clientNodeData = {};
	for (var clientMacAddr in clients) {
		if (!clients.hasOwnProperty(clientMacAddr)) continue;
		clientNodeData[clientMacAddr] = clients[clientMacAddr].nodeData;
	}
	socket.emit('clients', clientNodeData);
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

			let clientMac = data['Station MAC'].trim();
			if (typeof clients[clientMac] === 'undefined') {
				clients[clientMac] = new wirelessClient();
			}

			let client = clients[clientMac];

			client.update(data);

			if (client.lastUpdateChangedNodeData) {
				io.emit('client', client.nodeData);
			}
		});
});
