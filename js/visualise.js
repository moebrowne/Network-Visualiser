document.getElementById('network').width = window.innerWidth;
document.getElementById('network').height = window.innerHeight;

var canvas = document.getElementById('network');
var canvasContext = canvas.getContext('2d');
canvasContext.fillStyle = '#333';
canvasContext.strokeStyle = '#FFF';

$.getJSON( "nodes.json", function( data ) {
	drawNodes(data);
});

function drawNodes(nodes, parent) {

	for (var i=0; i<nodes.length; i++) {

		var node = nodes[i];

		// If a position hasn't be defined arrange all the sub nodes equally around the parent
		if (typeof node.position === 'undefined' && typeof parent !== 'undefined') {
			var angleDeg = ((360/nodes.length)*i)-90;
			node.position = {
				x: parent.position.x + (node.distance * Math.cos(toRadians(angleDeg))),
				y: parent.position.y + node.distance * Math.sin(toRadians(angleDeg))
			}
		}

		// If this node is a child offset it so it aligns with the parent
		if (typeof parent !== 'undefined') {
			node.position.x += (node.size/2);
			node.position.y += (node.size/2);
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
		if (typeof node.subnodes !== 'undefined') {
			drawNodes(node.subnodes, node);
		}

		// Draw the node
		canvasContext.rect(node.position.x, node.position.y, node.size, node.size);
		canvasContext.stroke();
		canvasContext.fill();

	}

}

function drawHTMLNode(node) {
	var elem = $('<div/>').css({position: 'absolute', left: node.position.x, top: node.position.y, width: node.size, height: node.size, cursor: 'pointer'}).attr('title', node.name);
	$('#networkNodeMap').append(elem);

}

function toRadians (angle) {
	return angle * (Math.PI / 180);
}
