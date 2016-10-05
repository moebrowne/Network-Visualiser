'use strict';

var io = require('socket.io')(3000);
var iwconfig = require('wireless-tools/iwconfig');
var iwlist = require('wireless-tools/iwlist');
var fs = require('fs');

var interfaceName = process.argv[2];

var APs = {};
var data = [];

io.on('connection', function(socket) {
	console.log('User connected');
});

iwconfig.status(interfaceName, function(err, status) {
	scan();
});

function scan() {

	iwlist.scan(interfaceName, function(err, networks) {

		if (typeof networks === 'undefined') {
			return;
		}

		for (var i=0; i < networks.length; i++) {

			var AP = {
				'mac': networks[i].address,
				'SSID': networks[i].ssid,
				//'power': data[' Power'],
				//'active': (secondsLastSeen < 120),
				'encryption': networks[i].security.toUpperCase(),
				'size': Math.max(10,Math.round((60-parseInt(networks[i].signal))/3))
			};

			if (JSON.stringify(AP) === JSON.stringify(APs[AP.mac])) {
				return;
			}

			APs[AP.mac] = AP;

			io.emit('AP', AP);
			console.log(AP);
		}

	});

	setTimeout(scan, 1000);
}
