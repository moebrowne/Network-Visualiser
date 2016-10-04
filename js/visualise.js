document.getElementById('network').width = window.innerWidth;
document.getElementById('network').height = window.innerHeight;

var canvas = document.getElementById('network');
var canvasContext = canvas.getContext('2d');
canvasContext.fillStyle = '#333';
canvasContext.strokeStyle = '#FFF';

var APs = {};

var socket = io('//:3000');

socket.on('AP', function (AP) {

	if (typeof APs[AP.mac] === 'undefined') {

		AP.position = {
			x: getRandomArbitrary(60, canvas.width-60),
			y: getRandomArbitrary(60, canvas.height-60)
		};

		AP.rotate = 0;

		APs[AP.mac] = AP;

		APs[AP.mac].clients = {};
	}

});

socket.on('client', function (client) {
	if (typeof APs[client.AP] === "undefined") {
		//drawNode(client);
		return;
	}

	if (typeof APs[client.AP].clients[client.mac] === 'undefined') {
		APs[client.AP].clients[client.mac] = client;
	}
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
		drawAP(AP);
	}
}

function drawAP(AP) {

	drawNode(AP);

	if (typeof AP.clients !== 'undefined') {
		drawAPClients(AP);
	}

}

function drawAPClients(AP) {

	var clientCount = Object.keys(AP.clients).length;

	if (clientCount === 0) {
		return;
	}

	var clientNodeDistance = 50;
	var angleDeg = (360 / clientCount);

	var i = 0;
	for (var clientMac in AP.clients) {

		var client = AP.clients[clientMac];
		var angle = (angleDeg * i++) - 90;

		client.position = {
			x: AP.position.x + (clientNodeDistance * Math.cos(toRadians(angle))),
			y: AP.position.y + (clientNodeDistance * Math.sin(toRadians(angle)))
		};

		client.rotate = angle;

		// Adjust the position of the client nodes to line up with the AP
		client.position.x += (client.size/2);
		client.position.y += (client.size/2);

		drawNode(client, AP);
	}

}


function drawNode(node, linkTo) {

	// Calculate the centre of the node
	node.centre = {
		x: node.position.x+(node.size/2),
		y: node.position.y+(node.size/2)
	};

	// Draw the HTML element mask
	drawHTMLNode(node);

	// Set the node (and connecting line) colour based on the time the node was last seen
	let nodeColour = '#FFFFFF';
	if (node.lastSeen > 120) {
		nodeColour = '#777777';
	}

	// Draw the node
	canvasContext.save();
	canvasContext.beginPath();
	canvasContext.translate(node.centre.x, node.centre.y);
	canvasContext.rotate(node.rotate*Math.PI/180);
	canvasContext.rect(-node.size/2, -node.size/2, node.size, node.size);
	canvasContext.strokeStyle = nodeColour;
	canvasContext.stroke();
	canvasContext.fill();
	canvasContext.closePath();
	canvasContext.restore();

	if (typeof linkTo !== 'undefined') {

		canvasContext.beginPath();
		canvasContext.moveTo(linkTo.centre.x, linkTo.centre.y);
		canvasContext.lineTo(node.centre.x, node.centre.y);
		canvasContext.strokeStyle = nodeColour;
		canvasContext.stroke();
		canvasContext.closePath();
	}
}

function drawHTMLNode(node) {

	if (node.hasHTMLElement === true) {
		return;
	}

	var elem = $('<div/>')
		.css({position: 'absolute', left: node.position.x, top: node.position.y, width: node.size, height: node.size, cursor: 'pointer'})
		.attr('title', node.SSID)
		.attr('id', 'MAC'+node.mac);
	$('#networkNodeMap').append(elem);

	document.addEventListener('dragexit', function(e) {
		var node = nodeLookup[this.getAttribute('id')];

		console.log(node);

		node.position = {
			x: e.pageX,
			y: e.pageY
		};

		drawAllNodes();
	}, false);

	node.hasHTMLElement = true;

}

function toRadians (angle) {
	return angle * (Math.PI / 180);
}

function getRandomArbitrary(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
