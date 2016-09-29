document.getElementById('network').width = window.innerWidth;
document.getElementById('network').height = window.innerHeight;

var canvas = document.getElementById('network');
var canvasContext = canvas.getContext('2d');
canvasContext.fillStyle = '#333';
canvasContext.strokeStyle = '#FFF';

var APs = {};

var socket = io('http://localhost:3000');

socket.on('AP', function (AP) {

	if (typeof APs[AP.mac] === 'undefined') {

		AP.position = {
			x: getRandomArbitrary(0, 1000),
			y: getRandomArbitrary(0, 500)
		};

		APs[AP.mac] = AP;

		if (typeof APs[AP.mac].clients === 'undefined') {
			APs[AP.mac].clients = {};
		}

		render();
	}

});

socket.on('client', function (client) {
	if (typeof APs[client.AP] === "undefined") {
		//drawNode(client);
		return;
	}

	if (typeof APs[client.AP].clients[client.mac] === 'undefined') {
		APs[client.AP].clients[client.mac] = client;
		render();
	}
});

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
	console.log(clientCount);

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

	// Draw the node
	canvasContext.beginPath();
	canvasContext.rect(node.position.x, node.position.y, node.size, node.size);
	canvasContext.stroke();
	canvasContext.fill();
	canvasContext.closePath();

	if (typeof linkTo !== 'undefined') {
		canvasContext.beginPath();
		canvasContext.moveTo(linkTo.centre.x, linkTo.centre.y);
		canvasContext.lineTo(node.centre.x, node.centre.y);
		canvasContext.stroke();
		canvasContext.closePath();
	}
}

function drawHTMLNode(node) {
	var elem = $('<div/>')
		.css({position: 'absolute', left: node.position.x, top: node.position.y, width: node.size, height: node.size, cursor: 'pointer'})
		.attr('title', node.name)
		.attr('id', node.id)
		.attr('draggable', true);
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

}

function toRadians (angle) {
	return angle * (Math.PI / 180);
}

function getRandomArbitrary(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
