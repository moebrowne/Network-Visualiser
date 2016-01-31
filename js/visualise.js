document.getElementById('network').width = window.innerWidth;
document.getElementById('network').height = window.innerHeight;

var canvas = document.getElementById('network');
var canvasContext = canvas.getContext('2d');

var nodeArray = [
	{
		name: 'Alpha',
		position: {x: 550,y: 350},
		size: 10,
		subnodes: [
			{
				name: 'AlphaAlpha',
				size: 5,
				distance: 30
			},
			{
				name: 'AlphaBravo',
				size: 5,
				distance: 140
			},
			{
				name: 'AlphaCharlie',
				size: 5,
				distance: 82
			},
			{
				name: 'AlphaDelta',
				size: 5,
				distance: 70
			},
			{
				name: 'AlphaEcho',
				size: 5,
				distance: 95
			},
			{
				name: 'AlphaFoxtrot',
				size: 5,
				distance: 75
			},
			{
				name: 'Charlie',
				distance: 225,
				size: 10,
				subnodes: [
					{
						name: 'CharlieAlpha',
						size: 5,
						distance: 80
					},
					{
						name: 'CharlieBravo',
						size: 5,
						distance: 40
					},
					{
						name: 'CharlieCharlie',
						size: 5,
						distance: 82
					}
				]
			}
		]
	},
	{
		name: 'Bravo',
		position: {x: 250,y: 370},
		size: 10,
		subnodes: [
			{
				name: 'AlphaAlpha',
				size: 5,
				distance: 30
			},
			{
				name: 'AlphaAlpha',
				size: 5,
				distance: 30
			},
			{
				name: 'AlphaAlpha',
				size: 5,
				distance: 30
			},
			{
				name: 'AlphaAlpha',
				size: 5,
				distance: 30
			},
			{
				name: 'AlphaAlpha',
				size: 5,
				distance: 30
			},
			{
				name: 'AlphaAlpha',
				size: 5,
				distance: 30
			},
			{
				name: 'AlphaAlpha',
				size: 5,
				distance: 30
			},
			{
				name: 'AlphaAlpha',
				size: 5,
				distance: 30
			},
			{
				name: 'AlphaAlpha',
				size: 5,
				distance: 30
			},
			{
				name: 'AlphaAlpha',
				size: 5,
				distance: 30
			},
			{
				name: 'AlphaAlpha',
				size: 5,
				distance: 30
			},
			{
				name: 'AlphaAlpha',
				size: 5,
				distance: 30
			},
			{
				name: 'AlphaAlpha',
				size: 5,
				distance: 30
			}
		]
	}
];

function drawNodes(nodes, parent) {

	for (var i=0; i<nodes.length; i++) {

		var node = nodes[i];

		canvasContext.fillStyle = '#FFF';

		// If a position hasn't be defined arrange all the sub nodes equally around the parent
		if (typeof node.position === 'undefined') {
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

		// Draw the node
		canvasContext.rect(node.position.x, node.position.y, node.size, node.size);

		// Draw the HTML element mask
		drawHTMLNode(node);

		// Check if this node is a child element and therefore needs linking to its parent
		if (typeof parent !== 'undefined') {
			canvasContext.beginPath();
			canvasContext.strokeStyle = '#FFF';
			canvasContext.moveTo((parent.position.x+(parent.size/2)),(parent.position.y+(parent.size/2)));
			canvasContext.lineTo(node.centre.x, node.centre.y);
			canvasContext.stroke();
		}

		// Check if there are children to draw
		if (typeof node.subnodes !== 'undefined') {
			drawNodes(node.subnodes, node);
		}

	}

}

function drawHTMLNode(node) {
	var elem = $('<div/>').css({position: 'absolute', left: node.position.x, top: node.position.y, width: node.size, height: node.size, cursor: 'pointer'});
	$('#networkNodeMap').append(elem);

}

function toRadians (angle) {
	return angle * (Math.PI / 180);
}

drawNodes(nodeArray);