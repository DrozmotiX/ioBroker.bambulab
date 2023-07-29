const state_attrb = {
	'cooling_fan_speed': {
		name: 'Cooling fan Speed',
		modify: ['toNumber'],
		type: 'number',
		unit: '%',
		role: 'level'
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
		role: 'level'
	},
	'big_fan2_speed': {
		name: 'Chamber Fan 2 Speed',
		modify: ['toNumber'],
		type: 'number',
		unit: '%',
		role: 'level'
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
		role: 'value.temperature',
		modify: ['toNumber']
	},
};


module.exports = state_attrb;
