'use strict';

class wirelessAP
{
	static get regex() {
		//       MAC             PWR           Beacons     #Data       #/s         Channel         Speed           Enc            Cipher       Auth         ESSID
		return /^([A-F0-9:]+)[ ]+([\-0-9]+)[ ]+([0-9]+)[ ]+([0-9]+)[ ]+([0-9]+)[ ]+([0-9]{1,2})[ ]+([0-9]+e\.?)[ ]+([A-Z0-9]+)[ ]+([A-Z]+)?[ ]+([A-Z]+)?[ ]+(.+)$/;
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

	constructor() {
		this.seenFirst = Date.now()/1000;
	}

	update(data) {
		let prevNodeData = this.nodeData;

		let self = wirelessAP;

		this.mac = data[self.regexGroups.MAC];
		this.SSID = data[self.regexGroups.ESSID];
		this.seenLast = Date.now()/1000;
		this.encryption = data[self.regexGroups.Encryption];
		this.cipher = data[self.regexGroups.Cipher];
		this.authentication = data[self.regexGroups.Auth];
		this.power = parseInt(data[self.regexGroups.Power]);
		this.beaconCount = parseInt(data[self.regexGroups.Beacons]);
		this.ivCount = parseInt(data[self.regexGroups.Data]);
		//this.SSIDLength = ;

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
			'size': 17
		}
	}

}

module.exports = wirelessAP;