var io = require('socket.io')(3000);
var csv = require('csv-parser');
var fs = require('fs');
require('datejs');

io.on('connection', function(socket) {
	console.log('User connected');

	fs.watchFile('airmondata-APs.csv', function(curr, prev) {
		fs.createReadStream('airmondata-APs.csv')
		.pipe(csv())
		.on('data', function (data) {

			if (typeof data['BSSID'] === 'undefined' || data[' ESSID'] === ' ' || data[' Power'] === '  -1') {
				return;
			}

			socket.emit('AP', {
				'mac': data['BSSID'].replace(' ',''),
				'power': data[' Power'],
				'size': 10
			});
		});
	});

	fs.watchFile('airmondata-clients.csv', function(curr, prev) {
		fs.createReadStream('airmondata-clients.csv')
		.pipe(csv())
		.on('data', function (data) {

			if (typeof data['Station MAC'] === 'undefined' || data[' BSSID'] === ' ') {
				return;
			}

			socket.emit('client', {
				'mac': data['Station MAC'].replace(' ', ''),
				'AP': data[' BSSID'].replace(' ', ''),
				'power': data[' Power'],
				'size': 5
			});
		});
	});
});
