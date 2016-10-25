'use strict';

var io = require('socket.io')(3000);
var es = require('event-stream');
var spawn = require('child_process').spawn;
var fs = require('fs');

var wirelessAP = require('./wirelessAP');
var wirelessClient = require('./wirelessClient');

var interfaceName = process.argv[2];

if (typeof interfaceName === 'undefined') {
	throw new Error('Interface name missing');
}

fs.stat('whitelist.json', (err, stat) => {
	if (err) {
		console.error(err.toString());
		return;
	}

	fs.readFile('whitelist.json', {encoding: 'utf-8'}, function(err, data) {
		if (err) {
			console.error(err.toString());
			return;
		}

		whitelist = JSON.parse(data);
	});
});

var APs = {};
var clients = {};

// Load saved APs from disk
const APCacheFile = 'APs.json';
fs.stat(APCacheFile, (err, stat) => {
	if (err) {
		console.warn(`? No AP cache found, skipping...`);
		return;
	}

	fs.readFile(APCacheFile, (err, APsDataJSON) => {
		if (err) {
			console.error(`x Failed to load APs from cache (${err.message})`);
			return;
		}

		const APsData = JSON.parse(APsDataJSON);
		for (var APMAC in APsData) {
			APs[APMAC] = new wirelessAP(APsData[APMAC]);
		}

		console.log(`+ Loaded ${Object.keys(APsData).length} APs`);
	});
});

// Load saved clients from disk
const clientCacheFile = 'clients.json';
fs.stat(clientCacheFile, (err, stat) => {
	if (err) {
		console.warn(`? No client cache found, skipping...`);
		return;
	}

	fs.readFile(clientCacheFile, (err, clientDataJSON) => {
		if (err) {
			console.warn(`x Failed to load clients from cache (${err.message})`);
			return;
		}

		const clientData = JSON.parse(clientDataJSON);
		for (var clientMAC in clientData) {
			clients[clientMAC] = new wirelessClient(clientData[clientMAC]);
		}

		console.log(`+ Loaded ${Object.keys(clientData).length} clients`);
	});
});


var whitelist = {
	"APs": [],
	"clients": []
};

var airodumpProcess = spawn('airodump-ng', [interfaceName, '--berlin', '1']);

airodumpProcess.on('exit', (code, signal) => {
	console.error('ERR: Airodump exited!');
});

es.pipeline(
	airodumpProcess.stderr,
	es.split(),
	es.map(function (line) {
		var lineTrimmed = line.trim();

		var APData = wirelessAP.regex.exec(lineTrimmed);

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

		var clientData = wirelessClient.regex.exec(lineTrimmed);

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

function updateExistingNodes() {
	// Update All APs
	for (var APMacAddr in APs) {
		if (!APs.hasOwnProperty(APMacAddr)) continue;

		var AP = APs[APMacAddr];

		if (AP.touch()) {
			io.emit('AP', AP.nodeData);
		}
	}

	// Update All Clients
	for (var clientMacAddr in clients) {
		if (!clients.hasOwnProperty(clientMacAddr)) continue;

		var client = clients[clientMacAddr];

		if (client.touch()) {
			io.emit('client', client.nodeData);
		}
	}
	setTimeout(updateExistingNodes, 1000);
}
updateExistingNodes();


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

	socket.emit('whitelist', whitelist);
});

function saveData() {
	fs.writeFile('APs.json', JSON.stringify(APs), (err) => {
		if (err) {
			console.error(err.toString());
		}
	});
	fs.writeFile('clients.json', JSON.stringify(clients), (err) => {
		if (err) {
			console.error(err.toString());
		}
	});
}

setInterval(saveData, 5000);
