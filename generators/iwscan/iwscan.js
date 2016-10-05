'use strict';

var io = require('socket.io')(3000);
var iwconfig = require('wireless-tools/iwconfig');
var iwlist = require('wireless-tools/iwlist');
var fs = require('fs');

var interfaceName = 'wlan0';

var APs = {};
var data = [];

io.on('connection', function(socket) {
	console.log('User connected');
});

iwconfig.status(interfaceName, function(err, status) {

	iwlist.scan(interfaceName, function(err, networks) {
		console.log(networks);

		for (var i=0; i < networks.length; i++) {

			var AP = {
				'mac': networks[i].address,
				'SSID': networks[i].ssid,
				//'power': data[' Power'],
				//'active': (secondsLastSeen < 120),
				'encryption': networks[i].security,
				'size': Math.max(10,Math.round((60-parseInt(networks[i].signal))/3))
			};

			if (JSON.stringify(AP) === JSON.stringify(APs[AP.SSID])) {
				return;
			}

			APs[AP.SSID] = AP;

			console.log(networks[i]);
		}

	});

});
