'use strict';

class wirelessClient
{
	static get regex() {
		//       Connected AP MAC                   Client MAC      Power         AP-CL Rate    CL-AP Rate  Lost        Packets     Probed APs (CSV)
		return /^(\(not associated\)|[A-F0-9:]+)[ ]+([A-F0-9:]+)[ ]+([\-0-9]+)[ ]+([0-9e]+) ?- ?([0-9]+)[ ]+([0-9]+)[ ]+([0-9]+)[ ]*(.+)?$/;
	}

	static get regexGroups() {
		return {
			'APMAC': 1,
			'MAC': 2,
			'Power': 3,
			'RateAPCL': 4,
			'RateCLAP': 5,
			'PacketsLost': 6,
			'Packets': 7,
			'ProbedAPs': 8
		}
	};

	constructor(data) {
		// Check if we are loading an existing client or if this is a new one
		if (typeof data === 'undefined') {
			this.seenFirst = Date.now()/1000;
			return;
		}

		this.load(data);
	}

	update(data) {
		let prevNodeData = this.nodeData;

		let self = wirelessClient;

		this.mac = data[self.regexGroups.MAC];
		this.seenLast = Date.now()/1000;
		this.active = true;
		this.power = parseInt(data[self.regexGroups.Power]);
		this.packets = parseInt(data[self.regexGroups.Packets]);
		this.packetsFlowing = this.packets > prevNodeData.packets;
		this.probedAPs = [];

		if (data[self.regexGroups.APMAC] !== '(not associated)') {
			this.APMac = data[self.regexGroups.APMAC];
		}
		else {
			this.APMac = undefined;
		}

		if (typeof data[self.regexGroups.ProbedAPs] !== 'undefined') {
			this.probedAPs = data[self.regexGroups.ProbedAPs].split(',');
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
		this.packetsFlowing = false;
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
			'APMac': this.APMac,
			'active': this.active,
			'packets': this.packets,
			'packetsFlowing': this.packetsFlowing,
			'power': this.power,
			'size': 12
		}
	}
}

module.exports = wirelessClient;