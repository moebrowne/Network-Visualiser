
var whitelist = {};

var canvasContainer = document.getElementById('network-container');
var canvas = document.getElementById('network');
var canvasContext = canvas.getContext('2d');

var channelCanvas = document.getElementById('channel-contention');
var channelCanvasContext = channelCanvas.getContext('2d');

function expandCanvasToWindow() {
	var canvasContainerBoundingRect = canvasContainer.getBoundingClientRect();

	canvas.width = canvasContainerBoundingRect.width;
	canvasContext.canvas.width = canvasContainerBoundingRect.width;

	canvas.height = canvasContainerBoundingRect.height;
	canvasContext.canvas.height = canvasContainerBoundingRect.height;
}
expandCanvasToWindow();

window.addEventListener('resize', debounce(expandCanvasToWindow, 200));

var APs = {};
var clients = {};

var socket = io('//:3000');

socket.on('whitelist', function (whitelistUpdate) {
	whitelist = whitelistUpdate;
});

// A bulk update of APs
socket.on('APs', function(currentAPs) {
	for (var APMac in currentAPs) {
		addAP(currentAPs[APMac])
	}
});

socket.on('AP', function (AP) {
	addAP(AP);
});

function addAP(AP) {
	if (typeof APs[AP.mac] === 'undefined') {

		AP.position = {
			x: getRandomArbitrary(60, canvas.width - 60),
			y: getRandomArbitrary(60, canvas.height - 60)
		};

		AP.rotate = 0;

		APs[AP.mac] = AP;

		APs[AP.mac].clients = {};
	}
	else {
		var clients = APs[AP.mac].clients;
		var position = APs[AP.mac].position;

		APs[AP.mac] = AP;
		APs[AP.mac].clients = clients;
		APs[AP.mac].position = position;
	}
}

// A bulk update of Clients
socket.on('clients', function(currentClients) {
	for (var clientMac in currentClients) {
		addClient(currentClients[clientMac])
	}
});

socket.on('client', function (client) {
	addClient(client);
});

function addClient(clientData) {

	// Is the client new to us?
	if (typeof clients[clientData.mac] === 'undefined') {
		clientData.packetAnimOffset = 0;
		// Add the client to the local client store
		clients[clientData.mac] = clientData;
	}

	var clientDataOld = clients[clientData.mac];

	// Update the client
	var packetAnimOffset = clients[clientData.mac].packetAnimOffset;
	if (typeof APs[clientData.APMac] !== "undefined" && clientData.packetsFlowing === true && clients[clientData.mac].packetAnimOffset === 0) {
		packetAnimOffset = 120;
	}

	clients[clientData.mac] = clientData;
	clients[clientData.mac].packetAnimOffset = packetAnimOffset;

	// Check if the client is associated
	if (typeof clientData.APMac !== "undefined") {

		// Has the client associated with a new AP?
		if (clientDataOld.APMac !== clientData.APMac && typeof clientDataOld.APMac !== 'undefined') {
			// Remove client reference from the previous AP
			delete APs[clientDataOld.APMac].clients[clientData.mac];
		}

		if (typeof APs[clientData.APMac] !== "undefined" && typeof APs[clientData.APMac].clients[clientData.mac] === 'undefined') {
			// Add cross references to the AP and client
			APs[clientData.APMac].clients[clientData.mac] = clients[clientData.mac];
		}
	}
	else {
		// Remove any references (if a client disassociates)
		if (typeof APs[clientDataOld.APMac] !== "undefined") {
			delete APs[clientDataOld.APMac].clients[clientData.mac];
		}
	}
}

Object.filter = function(obj, predicate) {
	var result = {};

	for (var key in obj) {
		if (obj.hasOwnProperty(key) && predicate(obj[key])) {
			result[key] = obj[key];
		}
	}

	return result;
};

function draw() {
	requestAnimationFrame(draw);
	render();
}
draw();


function render() {
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);

	var APsFiltered = Object.filter(APs, function(AP) {
		return AP.active === true && Object.keys(AP.clients).length > 0
	});

	for (var APMac in APsFiltered) {
		var AP = APs[APMac];

		drawAPClients(AP);
		drawAP(AP);

		if (AP.active === true) {
			drawAPPowerRing(AP);
		}
	}

	renderChannelContention(APsFiltered);

}

function renderChannelContention(APs) {
	channelCanvasContext.clearRect(0, 0, channelCanvas.width, channelCanvas.height);

	let APsByChannel = {};
	var max = 0;

	// Count the number of active and inactive APs in each channel
	for(var APMac in APs) {
		const AP = APs[APMac];

		if (AP.channel <= 0) continue;

		if (typeof APsByChannel[AP.channel] === 'undefined') {
			APsByChannel[AP.channel] = {'active': 0, 'inactive': 0}
		}

		if (AP.active === true) {
			APsByChannel[AP.channel].active++;
		}
		else {
			APsByChannel[AP.channel].inactive++;
		}

		const inactiveAPsCount = APsByChannel[AP.channel].inactive;
		const activeAPsCount = APsByChannel[AP.channel].active;
		const APsTotal = inactiveAPsCount + activeAPsCount;

		if (APsTotal > max) {
			max = APsTotal;
		}
	}

	const barWidth = 14;
	const barGap = 2;

	for (var channelNo=1; channelNo <= 13; channelNo++) {

		if (typeof APsByChannel[channelNo] === 'undefined') {
			APsByChannel[channelNo] = {'active': 0, 'inactive': 0}
		}

		const activeAPs = APsByChannel[channelNo].active;
		const inactiveAPs = APsByChannel[channelNo].inactive;
		const APsTotal = (activeAPs+inactiveAPs);

		const channelPercent = (APsTotal / max) * 100;

		const activePercent = (channelPercent === 0) ? 0: (channelPercent / APsTotal) * activeAPs * 0.9;
		const inactivePercent = (channelPercent === 0) ? 0: (channelPercent / APsTotal) * inactiveAPs * 0.9;

		channelCanvasContext.save();
		channelCanvasContext.translate(((channelNo-1)*(barWidth+barGap)), 90);

		// Draw the active APs bar
		channelCanvasContext.beginPath();
			channelCanvasContext.rect(0, 0, barWidth, -(activePercent+1));
			channelCanvasContext.fillStyle = '#125C6D';
			channelCanvasContext.fill();
		channelCanvasContext.closePath();

		// Draw the inactive APs bar
		channelCanvasContext.beginPath();
			channelCanvasContext.rect(0, -(activePercent+1), barWidth, -inactivePercent);
			channelCanvasContext.fillStyle = '#054858';
			channelCanvasContext.fill();
		channelCanvasContext.closePath();

		// Draw the bar label
		channelCanvasContext.beginPath();
			channelCanvasContext.textAlign = 'center';
			channelCanvasContext.font = '8px Ubuntu';
			channelCanvasContext.fillStyle = '#FFF';
			channelCanvasContext.fillText(channelNo, (barWidth/2), 8);
		channelCanvasContext.closePath();

		channelCanvasContext.restore();
	}
}

function drawAP(AP) {

	// Set the node (and connecting line) colour based on the time the node was last seen
	let nodeStrokeColour = '#FFFFFF';
	if (AP.active !== true) {
		nodeStrokeColour = '#777777';
	}
	if (AP.encryption.indexOf('WPA2') === -1) {
		nodeStrokeColour = '#550000';
	}

	var APFillStyle = '#333';
	if (typeof whitelist.APs !== "undefined" && whitelist.APs.indexOf(AP.mac) !== -1) {
		APFillStyle = '#454';
	}

	// Draw the node
	canvasContext.save();
	canvasContext.beginPath();
	canvasContext.translate(AP.position.x, AP.position.y);
	canvasContext.rotate(toRadians(AP.rotate));
	//canvasContext.rect(-AP.size/2, -AP.size/2, AP.size, AP.size);
	canvasContext.arc(0, 0, AP.size, 0, toRadians(360), true);
	canvasContext.strokeStyle = nodeStrokeColour;
	canvasContext.stroke();
	canvasContext.fillStyle = APFillStyle;
	canvasContext.fill();
	canvasContext.fillStyle = '#FFF';
	canvasContext.fillText(AP.SSID,10,10);
	canvasContext.closePath();
	canvasContext.restore();

}

function drawAPPowerRing(AP) {

	canvasContext.save();
	canvasContext.beginPath();
	canvasContext.translate(AP.position.x, AP.position.y);

	// Normalise the power down to the chunks
	const powerMax = -30;
	const powerMin = -70;
	const chunksPerNode = 25;
	const ringOffset = 2; // how far from the edge of the AP should the ring appear
	const ringAngleSpacing = 4; // The angle of the blank space between each chunk (in degrees)

	// Cap the power to the max value
	const APPower = Math.min(AP.power, powerMax);

	const powerPerChunk = (powerMax-powerMin)/chunksPerNode;
	const powerChunks = ((APPower-powerMin)/powerPerChunk);

	for(var chunks = 0; chunks < powerChunks; chunks++) {
		const anglePerChunk = (360/chunksPerNode);
		const angleOfChunk = anglePerChunk-ringAngleSpacing;
		const angleStart = (chunks*anglePerChunk)-90; // Set the circle to start at the top
		const angleEnd = angleStart+angleOfChunk;

		canvasContext.beginPath();
		canvasContext.arc(0, 0, AP.size-ringOffset, toRadians(angleStart), toRadians(angleEnd));
		canvasContext.strokeStyle = '#BA770F';
		canvasContext.stroke();
		canvasContext.closePath();
	}

	canvasContext.restore();
}

function drawAPClients(AP) {


	var APClientsFiltered = Object.filter(AP.clients, function(client) {
		return client.active === true
	});

	var clientCount = Object.keys(APClientsFiltered).length;

	if (clientCount === 0) {
		return;
	}

	var clientNodeDistance = 58;
	var angleDeg = (360 / clientCount);

	var i = 0;
	for (var clientMac in APClientsFiltered) {

		var client = AP.clients[clientMac];
		var angle = (angleDeg * i++) - 90;

		client.position = {
			x: AP.position.x + (clientNodeDistance * Math.cos(toRadians(angle))),
			y: AP.position.y + (clientNodeDistance * Math.sin(toRadians(angle)))
		};

		linkNodes(AP, client);

		// Set the node (and connecting line) colour based on the time the node was last seen
		let nodeColour = '#FFFFFF';
		if (client.active !== true) {
			nodeColour = '#777777';
		}

		var clientFillStyle = '#333';
		if (typeof whitelist.clients !== "undefined" && whitelist.clients.indexOf(client.mac) !== -1) {
			clientFillStyle = '#454';
		}

		var w = client.size;
		var h = w * (Math.sqrt(3)/2);

		// Draw the node
		canvasContext.save();
		canvasContext.beginPath();
		canvasContext.translate(client.position.x, client.position.y);
		canvasContext.rotate(toRadians(client.rotate));
		canvasContext.strokeStyle = nodeColour;
		canvasContext.moveTo(0, (-2/3)*h);
		canvasContext.lineTo(w / 2, h / 3);
		canvasContext.lineTo(-w / 2, h / 3);
		canvasContext.closePath();
		canvasContext.stroke();
		canvasContext.fillStyle = clientFillStyle;
		canvasContext.fill();
		canvasContext.restore();
	}

}

function linkNodes(node, linkToNode) {

	canvasContext.save();
	canvasContext.beginPath();
	canvasContext.moveTo(linkToNode.position.x, linkToNode.position.y);
	canvasContext.lineTo(node.position.x, node.position.y);
	canvasContext.strokeStyle = '#555';
	canvasContext.stroke();
	canvasContext.closePath();
	canvasContext.restore();


	if (linkToNode.packetAnimOffset > 0) {
		linkToNode.packetAnimOffset -= 2;

		canvasContext.save();
		canvasContext.beginPath();
		canvasContext.moveTo(linkToNode.position.x, linkToNode.position.y);
		canvasContext.lineTo(node.position.x, node.position.y);
		canvasContext.setLineDash([4, 50]);
		canvasContext.lineDashOffset = linkToNode.packetAnimOffset;
		canvasContext.strokeStyle = '#FFF';
		canvasContext.stroke();
		canvasContext.closePath();
		canvasContext.restore();
	}

}

function toRadians (angle) {
	return angle * (Math.PI / 180);
}

function getRandomArbitrary(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
