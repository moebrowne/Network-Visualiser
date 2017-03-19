'use strict';

class wirelessAP
{
	static get regex() {
		//       MAC             PWR           Beacons     #Data       #/s         Channel         Speed           Enc            Cipher       Auth         ESSID
		return /^([A-F0-9:]+)[ ]+([\-0-9]+)[ ]+([0-9]+)[ ]+([0-9]+)[ ]+([0-9]+)[ ]+([0-9]{1,2})[ ]+([0-9]+(?:e\.)?)[ ]+([A-Z0-9]+)[ ]+([A-Z]+)?[ ]+([A-Z]+)?[ ]+(.+)$/;
	}

	static get regexGroups() {
		return {
			'MAC': 1,
			'Power': 2,
			'Beacons': 3,
			'Data': 4,
			'DataRate': 5,
			'Channel': 6,
			'Speed': 7,
			'Encryption': 8,
			'Cipher': 9,
			'Auth': 10,
			'ESSID': 11
		}
	};

	constructor(data) {
		// Check if we are loading an existing AP or if this is a new one
		if (typeof data === 'undefined') {
			this.seenFirst = Date.now()/1000;
			return;
		}

		this.load(data);
	}

	update(data) {
		let prevNodeData = this.nodeData;

		let self = wirelessAP;

		this.mac = data[self.regexGroups.MAC];
		this.seenLast = Date.now()/1000;
		this.active = true;
		this.encryption = data[self.regexGroups.Encryption];
		this.cipher = data[self.regexGroups.Cipher];
		this.authentication = data[self.regexGroups.Auth];
		this.power = parseInt(data[self.regexGroups.Power]);
		this.channel = parseInt(data[self.regexGroups.Channel]);
		this.beaconCount = parseInt(data[self.regexGroups.Beacons]);
		this.ivCount = parseInt(data[self.regexGroups.Data]);

		var hiddenAP = /<length:[ ]+([0-9]+)>/.exec(data[self.regexGroups.ESSID]);
		if (hiddenAP !== null) {
			const APSSIDLength = parseInt(hiddenAP[1]);

			this.SSID = (APSSIDLength > 0) ? '?'.repeat(APSSIDLength):'?';
			this.SSIDLength = (APSSIDLength > 1) ? APSSIDLength:undefined;
		}
		else {
			this.SSID = data[self.regexGroups.ESSID];
			this.SSIDLength = this.SSID.length;
		}

		this.lastUpdateChangedNodeData = this.isDifferentTo(prevNodeData);
	}

	load(data) {
		for (var prop in data) {
			this[prop] = data[prop];
		}
	}

	isDifferentTo(nodeDataCompare) {
		return JSON.stringify(nodeDataCompare) !== JSON.stringify(this.nodeData);
	}

	touch() {
		let prevNodeData = this.nodeData;
		this.active = this.determineIfActive();
		return this.isDifferentTo(prevNodeData);
	}

	determineIfActive () {
		return (this.calculateSeenSecondsAgo() < 120)
	}

	calculateSeenSecondsAgo () {
		return (Date.now()/1000)-this.seenLast;
	}

	get nodeData () {
		return {
			'mac': this.mac,
			'SSID': this.SSID,
			'active': this.active,
			'encryption': this.encryption,
			'power': this.power,
			'channel': this.channel,
			'size': 17
		}
	}

}

module.exports = wirelessAP;