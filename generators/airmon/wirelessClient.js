'use strict';

class wirelessClient
{

	constructor() {}

	update(data) {
		let prevNodeData = this.nodeData;

		this.mac = data['Station MAC'].trim();
		this.APMac = data[' BSSID'].trim();
		this.seenFirst = Date.parse(data[' First time seen'].trim())/1000;
		this.seenLast = Date.parse(data[' Last time seen'].trim())/1000;
		this.power = parseInt(data[' Power'].trim());
		this.packetCount = parseInt(data[' # packets'].trim());
		this.probedAPs = []; //data[' Probed ESSIDs'].trim();

		let newNodeData = this.nodeData;

		this.lastUpdateChangedNodeData = JSON.stringify(prevNodeData) !== JSON.stringify(newNodeData);
	}

	get isActive () {
		return (this.seenSecondsAgo < 120)
	}

	get seenSecondsAgo () {
		return (Date.now()/1000)-this.seenLast;
	}

	get nodeData () {
		return {
			'mac': this.mac,
			'AP': this.APMac,
			'active': this.isActive,
			'frames': this.packetCount,
			'power': this.power,
			'size': 12
		}
	}
}

module.exports = wirelessClient;