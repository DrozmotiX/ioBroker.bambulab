const state_attrb = {
	'cooling_fan_speed': {
		name: 'Cooling fan Speed',
		modify: ['toNumber'],
		type: 'number',
		unit: '%',
		role: 'level',
		write: true,
	},
	'heatbreak_fan_speed': {
		name: 'Heatbreak fan Speed',
		modify: ['toNumber'],
		type: 'number',
		unit: '%',
		role: 'level'
	},
	'big_fan1_speed': {
		name: 'AUX Fan 1 Speed',
		modify: ['toNumber'],
		type: 'number',
		unit: '%',
		role: 'level',
		write: true,
	},
	'big_fan2_speed': {
		name: 'Chamber Fan 2 Speed',
		modify: ['toNumber'],
		type: 'number',
		unit: '%',
		role: 'level',
		write: true,
	},
	'mc_remaining_time': {
		name: 'Remaining Time',
		type: 'string',
		role: 'value.time'
	},
	'stg_cur': {
		name: 'Stage Parser',
		type: 'string'
	},
	'spd_lvl': {
		name: 'Speed Profile',
		type: 'number',
		role: 'level',
		write: true,
		states: {
			1: 'silent',
			2: 'standard',
			3: 'sport',
			4: 'ludicrous',
		}
	},
	'bed_temp': {
		name: 'Bed Temperature',
		type: 'number',
		unit: '°C',
		role: 'value.temperature',
		modify: ['toNumber']
	},
	'bed_temper': {
		name: 'Bed current Temperature',
		type: 'number',
		unit: '°C',
		role: 'value.temperature',
		modify: ['toNumber']
	},
	'bed_target_temper': {
		name: 'Bed Target Temperature',
		type: 'number',
		unit: '°C',
		role: 'level.temperature',
		write: true,
		modify: ['toNumber']
	},
	'chamber_temper': {
		name: 'Chamber Temperature',
		type: 'number',
		unit: '°C',
		role: 'value.temperature',
		modify: ['toNumber']
	},
	'nozzle_temper': {
		name: 'Nozzle current Temperature',
		type: 'number',
		unit: '°C',
		role: 'value.temperature',
		modify: ['toNumber']
	},
	'nozzle_target_temper': {
		name: 'Nozzle target Temperature',
		type: 'number',
		unit: '°C',
		write: true,
		role: 'level.temperature',
		modify: ['toNumber']
	},
	'mc_percent': {
		name: 'Printjob finish in percent',
		type: 'number',
		unit: '%',
		write: false,
		role: 'level',
		modify: ['toNumber']
	},
	'mc_print_line_number': {
		name: 'Printjob line number',
		type: 'number',
		write: false,
		modify: ['toNumber']
	},
	lightChamber : {
		name: 'Chamber Light',
		type: 'boolean',
		role: 'state',
		read: true,
		write: true,
		def: false
	},
};


module.exports = state_attrb;
