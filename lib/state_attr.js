const state_attrb = {
	'Staircase': {
		name: 'Staircase',
	},
	'cooling_fan_speed': {
		name: 'Cooling fan Speed',
		modify: ['ignoreValue','toNumber'],
		type: 'number',
		unit: '%',
		role: 'level'
	},
	'heatbreak_fan_speed': {
		name: 'Heatbreak fan Speed',
		modify: ['ignoreValue','toNumber'],
		type: 'number'
		unit: '%'
		role: 'level'
	},
	'big_fan1_speed': {
		name: 'AUX Fan 1 Speed',
		modify: ['ignoreValue','toNumber'],
		type: 'number',
		unit: '%',
		role: 'level'
	},
	'big_fan2_speed': {
		name: 'Chamber Fan 2 Speed',
		modify: ['ignoreValue','toNumber'],
		type: 'number',
		unit: '%',
		role: 'level'
	},
	'mc_remaining_time': {
		name: 'Remaining Time',
		modify: ['ignoreValue'],
		type: 'string',
		role: 'value.time'
	},
	'stg_cur': {
		name: 'Stage Parser',
		modify: ['ignoreValue'],
		type: 'string'
	},
	'spd_lvl': {
		name: 'Speed Profile',
		modify: ['ignoreValue'],
		type: 'string',
		role: 'level'
	},
	'bed_temp': {
		name: 'Bed Temperature',
		type: 'number',
		unit: '°C',
		role: 'value.temperature',
		modify: ['toNumber']
	},
};


module.exports = state_attrb;