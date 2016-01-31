document.getElementById('network').width = window.innerWidth;
document.getElementById('network').height = window.innerHeight;

var canvas = document.getElementById('network');
var canvasContext = canvas.getContext('2d');

var nodeArray = [
	{
		'name': 'Alpha',
		'position': {x: 150,y: 150},
		'size': {x: 10,y: 10},
		'subnodes': [
			{
				'name': 'AlphaAlpha',
				'position': {x: 180,y: 180},
				'size': {x: 5,y: 5}
			},
			{
				'name': 'AlphaBravo',
				'position': {x: 180,y: 160},
				'size': {x: 5,y: 5}
			}
		]
	},
	{
		'name': 'Bravo',
		'position': {x: 250,y: 370},
		'size': {x: 10,y: 10}
	}
];

function drawNodes(nodes, parent) {

	for (var i=0; i<nodes.length; i++) {

		var node = nodes[i];

		canvasContext.fillStyle = '#FFF';
		canvasContext.fillRect(node.position.x, node.position.y, node.size.x, node.size.y);

		if (typeof parent !== 'undefined') {
			canvasContext.beginPath();
			canvasContext.strokeStyle = '#FFF';
			canvasContext.moveTo((parent.position.x+(parent.size.x/2)),(parent.position.y+(parent.size.y/2)));
			canvasContext.lineTo(node.position.x+(node.size.x/2), node.position.y+(node.size.y/2));
			canvasContext.stroke();
		}

		if (typeof node.subnodes !== 'undefined') {
			drawNodes(node.subnodes, node);
		}

	}

}

drawNodes(nodeArray);