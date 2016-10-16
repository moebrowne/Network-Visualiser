'use strict';

var io = require('socket.io')(3000);
var es = require('event-stream');
var spawn = require('child_process').spawn;

var wirelessAP = require('./wirelessAP');
var wirelessClient = require('./wirelessClient');

var interfaceName = process.argv[2];

var APs = {};
var clients = {};

var airodump = spawn('airodump-ng', [interfaceName, '--berlin', '1']);

es.pipeline(
	airodump.stderr,
	es.split(),
	es.map(function (line) {
		var APData = wirelessAP.regex.exec(line.trim());

		if(APData !== null) {
			var APMac = APData[wirelessAP.regexGroups.MAC];

			if (typeof APs[APMac] === 'undefined') {
				APs[APMac] = new wirelessAP();
			}

			var AP = APs[APMac];

			AP.update(APData);

			if (AP.lastUpdateChangedNodeData) {
				io.emit('AP', AP.nodeData);
			}

			return;
		}

		var clientData = wirelessClient.regex.exec(line.trim());

		if(clientData !== null) {
			var clientMac = clientData[wirelessClient.regexGroups.MAC];

			if (typeof clients[clientMac] === 'undefined') {
				clients[clientMac] = new wirelessClient();
			}

			var client = clients[clientMac];

			client.update(clientData);

			if (client.lastUpdateChangedNodeData) {
				io.emit('client', client.nodeData);
			}

			return;
		}
	})
);

setInterval(function() {
	for (var clientMacAddr in clients) {
		if (!clients.hasOwnProperty(clientMacAddr)) continue;

		var client = clients[clientMacAddr];

		if (client.touch(client.lastUpdateData)) {
			io.emit('client', client.nodeData);
			client.lastUpdateData = client.nodeData;
			console.log('updating: '+clientMacAddr);
		}
	}
}, 1000);


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