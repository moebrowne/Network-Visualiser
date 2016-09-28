document.getElementById('network').width = window.innerWidth;
document.getElementById('network').height = window.innerHeight;

var canvas = document.getElementById('network');
var canvasContext = canvas.getContext('2d');
canvasContext.fillStyle = '#333';
canvasContext.strokeStyle = '#FFF';

var APs = {};

var socket = io('http://localhost:3000');

socket.on('AP', function (AP) {

	AP.position = {
		x: getRandomArbitrary(0, 1000),
		y: getRandomArbitrary(0, 500)
	};

	if (typeof APs[AP['mac']] === 'undefined') {
		APs[AP['mac']] = AP;
		APs[AP['mac']].clients = {};
		drawNode(AP);
	}

});

socket.on('client', function (client) {
	if (typeof APs[client['AP']] === "undefined") {
		//drawNode(client);
		return;
	}

	if (typeof APs[client['AP']]['clients'][client['mac']] === 'undefined') {
		APs[client['AP']]['clients'][client['mac']] = client;
		drawNode(client, APs[client['AP']]);
	}
});


function drawNode(node, parent) {

	node.distance = 50;

	// If a position hasn't be defined arrange all the sub node equally around the parent
	if (typeof parent !== 'undefined') {

		var clientCount = Object.keys(parent.clients).length;

		var angleDeg = ((360 / (clientCount+1)) * getRandomArbitrary(0, 60)) - 90;
		node.positionOffset = {
			x: node.distance * Math.cos(toRadians(angleDeg)),
			y: node.distance * Math.sin(toRadians(angleDeg))
		};

		node.position = {
			x: parent.position.x + node.positionOffset.x,
			y: parent.position.y + node.positionOffset.y
		};
	}

	// Calculate the centre of the node
	node.centre = {
		x: node.position.x+(node.size/2),
		y: node.position.y+(node.size/2)
	};

	// Draw the HTML element mask
	drawHTMLNode(node);

	// Check if this node is a child element and therefore needs linking to its parent
	if (typeof parent !== 'undefined') {
		canvasContext.beginPath();
		canvasContext.moveTo((parent.position.x+(parent.size/2)),(parent.position.y+(parent.size/2)));
		canvasContext.lineTo(node.centre.x, node.centre.y);
		canvasContext.stroke();
	}

	// Check if there are children to draw
	if (typeof node.clients !== 'undefined') {
		for (var i=0; i<node.clients.length; i++) {
			drawNode(node.clients[i], node);
		}
	}

	// Draw the node
	canvasContext.rect(node.position.x, node.position.y, node.size, node.size);
	canvasContext.stroke();
	canvasContext.fill();

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
