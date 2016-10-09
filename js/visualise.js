document.getElementById('network').width = window.innerWidth;
document.getElementById('network').height = window.innerHeight;

var canvas = document.getElementById('network');
var canvasContext = canvas.getContext('2d');
canvasContext.fillStyle = '#333';
canvasContext.strokeStyle = '#FFF';

var APs = {};

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

socket.on('client', function (client) {
	if (typeof APs[client.AP] === "undefined") {
		//drawNode(client);
		return;
	}

	if (typeof APs[client.AP].clients[client.mac] === 'undefined') {
		client.lastFrames = 101;
		client.lastFramesCount = 0;
	}
	else if (client.frames > APs[client.AP].clients[client.mac].frames) {
		client.lastFrames = 0;
		client.lastFramesCount = APs[client.AP].clients[client.mac].lastFramesCount;
	}

	APs[client.AP].clients[client.mac] = client;
});

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

	// Draw the node
	canvasContext.save();
	canvasContext.beginPath();
	canvasContext.translate(AP.position.x, AP.position.y);
	canvasContext.rotate(toRadians(AP.rotate));
	canvasContext.rect(-AP.size/2, -AP.size/2, AP.size, AP.size);
	canvasContext.strokeStyle = nodeStrokeColour;
	canvasContext.stroke();
	canvasContext.fill();
	canvasContext.closePath();
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


	if (linkToNode.lastFrames++ < 60) {
		linkToNode.lastFramesCount +=2;

		canvasContext.save();
		canvasContext.beginPath();
		canvasContext.moveTo(linkToNode.position.x, linkToNode.position.y);
		canvasContext.lineTo(node.position.x, node.position.y);
		canvasContext.setLineDash([4, 50]);
		canvasContext.lineDashOffset = linkToNode.lastFramesCount;
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
