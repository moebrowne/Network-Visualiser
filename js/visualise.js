var canvasContainer = document.getElementById('network-container');
var canvas = document.getElementById('network');
var canvasContext = canvas.getContext('2d');

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

	// Update the client
	var packetAnimOffset = clients[clientData.mac].packetAnimOffset;
	if (typeof APs[clientData.APMac] !== "undefined" && clientData.packetsFlowing === true && clients[clientData.mac].packetAnimOffset === 0) {
		packetAnimOffset = 120;
	}

	clients[clientData.mac] = clientData;
	clients[clientData.mac].packetAnimOffset = packetAnimOffset;

	// Check if the client is associated
	if (typeof clientData.APMac !== "undefined") {
		if (typeof APs[clientData.APMac] !== "undefined") {
			// Add cross references to the AP and client
			APs[clientData.APMac].clients[clientData.mac] = clients[clientData.mac];
		}
	}
	else {
		// Remove any references (if a client disassociates)
		if (typeof APs[clientData.APMac] !== "undefined") {
			delete APs[clientData.APMac].clients[clientData.mac];
		}
	}
}

function draw() {
	requestAnimationFrame(draw);
	render();
}
draw();


function render() {
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);


	for (var APMac in APs) {
		var AP = APs[APMac];

		if (Object.keys(AP.clients).length === 0) {
			// Show only APs with connected clients
			//continue;
		}

		drawAPClients(AP);
		drawAP(AP);

		if (AP.active === true) {
			drawAPPowerRing(AP);
		}
	}
	renderChannelContention();

}

function renderChannelContention() {

	var channelCanvas = document.getElementById('channel-contention');
	var channelCanvasContext = channelCanvas.getContext('2d');

	var barWidth = 14;
	var barGap = 2;

	var contentionPercents = this.calculateChannelContention();
	for(var channelNo in contentionPercents) {

		channelCanvasContext.save();
		channelCanvasContext.beginPath();
		channelCanvasContext.translate(((channelNo-1)*(barWidth+barGap)), 100);

		channelCanvasContext.rect(0, 0, barWidth, -(contentionPercents[channelNo]*0.9)-10);
		channelCanvasContext.fillStyle = '#125C6D';
		channelCanvasContext.fill();

		channelCanvasContext.textAlign = 'center';
		channelCanvasContext.font = '8px Ubuntu';
		channelCanvasContext.fillStyle = '#FFF';
		channelCanvasContext.fillText(channelNo, (barWidth/2), -2);

		channelCanvasContext.closePath();
		channelCanvasContext.restore();
	}
}

function calculateChannelContention() {

	let APsByChannel = {};
	var max = 0;

	for(var APMac in APs) {
		let AP = APs[APMac];

		if (AP.channel <= 0) continue;

		if (typeof APsByChannel[AP.channel] === 'undefined') {
			APsByChannel[AP.channel] = {'active':{}, 'inactive': {}}
		}

		if (AP.active === true) {
			APsByChannel[AP.channel].active.push(AP);
		}
		else {
			APsByChannel[AP.channel].inactive.push(AP);
		}

		let inactiveAPsCount = Object.keys(APsByChannel[AP.channel].inactive).length;
		let activeAPsCount = Object.keys(APsByChannel[AP.channel].active).length;

		if ((inactiveAPsCount + activeAPsCount) > max) {
			max = (inactiveAPsCount + activeAPsCount);
		}
	}

	var channelContentionPercents = {};
	for(var channelNo in channelCounter) {
		channelContentionPercents[channelNo] = Math.round(((channelCounter[channelNo] / max) * 100));
	}

	return channelContentionPercents;
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

	// Draw the node
	canvasContext.save();
	canvasContext.beginPath();
	canvasContext.translate(AP.position.x, AP.position.y);
	canvasContext.rotate(toRadians(AP.rotate));
	//canvasContext.rect(-AP.size/2, -AP.size/2, AP.size, AP.size);
	canvasContext.arc(0, 0, AP.size, 0, toRadians(360), true);
	canvasContext.strokeStyle = nodeStrokeColour;
	canvasContext.stroke();
	canvasContext.fillStyle = '#333';
	canvasContext.fill();
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

	var clientCount = Object.keys(AP.clients).length;

	if (clientCount === 0) {
		return;
	}

	var clientNodeDistance = 58;
	var angleDeg = (360 / clientCount);

	var i = 0;
	for (var clientMac in AP.clients) {

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
		canvasContext.fillStyle = '#333';
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
