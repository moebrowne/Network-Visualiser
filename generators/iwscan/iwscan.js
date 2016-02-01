'use strict';

var iwconfig = require('wireless-tools/iwconfig');
var iwlist = require('wireless-tools/iwlist');
var fs = require('fs');

var interfaceName = 'wlan9';

var data = [];

iwconfig.status(interfaceName, function(err, status) {

	var networkArray = [];

	data.push({
		"name": interfaceName,
		"position": {"x": 550,"y": 350},
		"size": 10
	});

	iwlist.scan(interfaceName, function(err, networks) {

		for (var i=0;i<networks.length;i++) {
			networkArray.push({
				"name": networks[i].ssid,
				"size": (networks[i].channel*2),
				"distance": (-(networks[i].signal*2))
			});
		}

		data[0].subnodes = networkArray;

		console.log(data);
		fs.writeFile('iwlistnodes.json', JSON.stringify(data), { flags: '+w' });

	});

});
