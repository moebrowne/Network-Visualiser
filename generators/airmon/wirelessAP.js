'use strict';

class wirelessAP
{

	constructor() {}

	update(data) {
		let prevNodeData = this.nodeData;

		this.mac = data['BSSID'].trim();
		this.SSID = data[' ESSID'].trim();
		this.seenFirst = Date.parse(data[' First time seen'].trim())/1000;
		this.seenLast = Date.parse(data[' Last time seen'].trim())/1000;
		this.channel = parseInt(data[' channel'].trim());
		this.encryption = data[' Privacy'].trim();
		this.cipher = data[' Cipher'].trim();
		this.authentication = data[' Authentication'].trim();
		this.power = parseInt(data[' Power'].trim());
		this.beaconCount = parseInt(data[' # beacons'].trim());
		this.ivCount = parseInt(data[' # IV'].trim());
		this.LANIP = data[' LAN IP'].replace(/ /g, '');
		this.SSIDLength = parseInt(data[' ID-length'].trim());
		this.key = data[' Key'].trim();

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
			'SSID': this.SSID,
			'active': this.isActive,
			'encryption': this.encryption,
			'power': this.power,
			'channel': this.channel,
			'size': Math.max(10, Math.round((60-parseInt(this.power))/3))
		}
	}

}

module.exports = wirelessAP;