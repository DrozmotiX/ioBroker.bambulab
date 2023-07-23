const state_attrb = {
	'Staircase': {
		name: 'Staircase',
	},
	'cooling_fan_speed': {
		name: 'Cooling fan Speed',
		modify: ['ignoreValue','toNumber'	],
		type: 'number'
	},
	'heatbreak_fan_speed': {
		name: 'Heatbreak fan Speed',
		modify: ['ignoreValue','toNumber'],
		type: 'number'
	},
	'big_fan1_speed': {
		name: 'Fan 1 Speed',
		modify: ['ignoreValue','toNumber'],
		type: 'number'
	},
	'big_fan2_speed': {
		name: 'Fan 2 Speed',
		modify: ['ignoreValue','toNumber'],
		type: 'number'
	},
	'mc_remaining_time': {
		name: 'Remaining Time',
		modify: ['ignoreValue'],
		type: 'string'
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
	},
	'bed_temp': {
		name: 'Bed Temperature',
		type: 'number',
		unit: '°C',
		modify: ['toNumber']
	},
};

module.exports = state_attrb;