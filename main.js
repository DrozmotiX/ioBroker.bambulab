'use strict';

/*
 * Created with @iobroker/create-adapter v2.4.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const mqtt = require('mqtt');
const convert = require('./lib/converter');
let client;
let timeout;

const jsonExplorer = require('iobroker-jsonexplorer');
const stateAttr = require(`${__dirname}/lib/state_attr.js`); // Load attribute library

class Bambulab extends utils.Adapter {
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: 'bambulab',
		});
		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		this.on('unload', this.onUnload.bind(this));
		jsonExplorer.init(this, stateAttr);
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// Reset the connection indicator during startup
		this.setState('info.connection', false, true);

		// Handle MQTT messages
		this.mqttMessageHandle();

	}

	/**
	 * Handle MQTT connection & message
	 */
	mqttMessageHandle(){
		try {

			this.log.debug(`Try to connect to printer`);

			// Connect to Printer using MQTT
			client = mqtt.connect(`mqtts://${this.config.host}:8883`, {
				username: 'bblp',
				password: this.config.Password,
				reconnectPeriod: 30,
				rejectUnauthorized: false,
			});

			// Establish connection to printer by MQTT
			client.on('connect', () => {

				this.log.info(`Printer connected`);
				this.setState('info.connection', true, true);

				this.createControlStates();

				// Subscribe on printer topic after connection
				client.subscribe([`device/${this.config.serial}/report`], () => {
					this.log.debug(`Subscribed to printer data topic by serial | ${this.config.serial}`);
				});

				// Subscribe on printer topic after connection
				client.subscribe([`device/${this.config.serial}/request`], () => {
					this.log.debug(`Subscribed to printer request topic by serial | ${this.config.serial}`);
				});

				// Request data for P1p printer series
				const msg = {
					'pushing': {
						'sequence_id': '1',
						'command': 'pushall'
					},
					'user_id': '1234567890'
				};
				this.publishMQTTmessages(msg);

			});

			// Receive MQTT messages
			client.on('message',  (topic, message) => {
				// Parse string to an JSON object
				message = JSON.parse(message.toString());

				// @ts-ignore if print does not exist function will return false and skip
				if (message && message.print && message && message.print.result) { // Handle values for printer statistics
					this.log.debug(`Printer message result ${JSON.stringify(message)}`);
				// @ts-ignore if system does not exist function will return false and skip
				} else if (message && message.print){
					this.log.debug(`Printer Message ${JSON.stringify(message)}`);
					this.messageHandler(message);
					// @ts-ignore if system does not exist function will return false and skip
				} else if (message && message.command){
					this.log.debug(`Response to control command ${JSON.stringify(message)}`);
					// @ts-ignore if system does not exist function will return false and skip
				} else if (message && message.system){ // Handle values for system messages, used to acknowledge messages
					this.log.debug(`System Message ${JSON.stringify(message)}`);
				} else {
					this.log.debug(`Unknown Message ${JSON.stringify(message)}`);
				}

			});

			client.on('reconnecting',  (topic, message) =>{
				this.log.info(`Reconnecting ${message.toString()}`);
			});

			client.on('end',  () =>{
				this.log.warn(`Connection to Printer closed`);
				this.setState('info.connection', false, true);
			});

			client.on('error', (error) => {
				this.log.error(`Connection issue occurred ${error}`);
				// Close MQTT connection
				client.end();

				// Try to reconnect
				if (timeout) {clearTimeout(timeout); timeout = null;}
				timeout = setTimeout(async function () {
					client.reconnect();
				}, 30000);

			});

		} catch (e) {
			this.log.error(`[MQTT Message handler] ${e} | ${e.stack}`);
		}
	}

	/**
	 * Handle MQTT messages to ioBroker states
	 */
	async messageHandler (message) {

		try {
			// Explore JSON & create states
			if (message.print) {
				// Modify values of JSONfor states which need modification
				if (message.print.cooling_fan_speed != null) message.print.cooling_fan_speed = convert.fanSpeed(message.print.cooling_fan_speed);
				if (message.print.heatbreak_fan_speed != null) message.print.heatbreak_fan_speed = convert.fanSpeed(message.print.heatbreak_fan_speed);
				if (message.print.stg_cur != null) message.print.stg_cur = convert.stageParser(message.print.stg_cur);
				if (message.print.spd_lvl != null) message.print.spd_lvl = convert.speedProfile(message.print.spd_lvl);
				if (message.print.big_fan1_speed != null) message.print.big_fan1_speed = convert.fanSpeed(message.print.big_fan1_speed);
				if (message.print.big_fan2_speed != null) message.print.big_fan2_speed = convert.fanSpeed(message.print.big_fan2_speed);
				if (message.print.mc_remaining_time != null) message.print.mc_remaining_time = convert.remainingTime(message.print.mc_remaining_time);
			}
			await jsonExplorer.traverseJson(message.print, this.config.serial, true, true, 0);

			if (message.print.lights_report && message.print.lights_report[0] && message.print.lights_report[0].mode === 'on'){
				this.setStateChanged(`${this.config.serial}.control.lightChamber`, {val: true, ack: true});
			} else if (message.print.lights_report && message.print.lights_report[0] && message.print.lights_report[0].mode === 'off'){
				this.setStateChanged(`${this.config.serial}.control.lightChamber`, {val: false, ack: true});
			}

		} catch (e) {
			this.log.error(`[messageHandler] ${e} | ${e.stack}`);
		}
	}

	publishMQTTmessages (msg) {

		this.log.debug(`Publish message ${JSON.stringify(msg)}`);

		const topic = `device/${this.config.serial}/request`;
		client.publish(topic, JSON.stringify(msg), { qos: 0, retain: false }, (error) => {
			if (error) {
				console.error(error);
			}
		});
	}

	createControlStates(){

		const controlStates = {
			_customGcode : {
				name: 'Custom G-Code',
				type: 'string',
				role: 'state',
				read: true,
				write: true,
				def: ''
			},
			lightChamber : {
				name: 'Chamber Light',
				type: 'boolean',
				role: 'state',
				read: true,
				write: true,
				def: false
			},
			lightToolHead : {
				name: 'Tool head Light',
				type: 'boolean',
				role: 'state',
				read: true,
				write: true,
				def: false
			},
			start : {
				name: 'Start printing',
				type: 'boolean',
				role: 'button.start',
				read: false,
				write: true,
			},
			stop : {
				name: 'Stop Printing',
				type: 'boolean',
				role: 'button.stop',
				read: false,
				write: true
			},
			resume : {
				name: 'Resume Printing',
				type: 'boolean',
				role: 'button',
				read: false,
				write: true
			},
			fanSpeedChamber : {
				name: 'Chamber Fan Speed',
				type: 'number',
				role: 'level',
				read: true,
				write: true,
				def: 0
			},
		};

		this.extendObject(`${this.config.serial}.control`, {
			'type': 'channel',
			'common': {
				'name': `Control device`,
			},
		});

		for (const state in controlStates){
			this.extendObject(`${this.config.serial}.control.${state}`, {
				type: 'state',
				common: controlStates[state]
			});

			this.subscribeStates(`${this.config.serial}.control.${state}`);
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {

			// Close running timers
			if (timeout) {clearTimeout(timeout); timeout = null;}

			// Close MQTT connection if present
			if (client){
				client.end();
			}

			callback();
		} catch (e) {
			this.log.error(`[onUnload] ${e} | ${e.stack}`);
			callback();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state && state.val != null) {
			// Only act on trigger if value is not Acknowledged
			if (!state.ack) {
				console.debug(`${id} | ${state.val}`);
				let msg;
				const checkID = id.split('.');

				//ToDo: Implement ACK based on success message of MQTT in relation to sequence ID.
				switch (checkID[4]) {
					case ('_customGcode'):
						msg = msg = { 'print': { 'command': 'gcode_line', 'param': `${state.val}`, 'sequence_id': '0' } };
						break;

					case ('lightChamber'):
						if (state.val === true) {
							msg = {
								'system': {
									'sequence_id': '2003',
									'command': 'ledctrl',
									'led_node': 'chamber_light',
									'led_mode': 'on',
									'led_on_time': 500,
									'led_off_time': 500,
									'loop_times': 0,
									'interval_time': 0
								}, 'user_id': '2712364565'
							};
						} else if (state.val === false) {
							msg = {
								'system': {
									'sequence_id': '2003',
									'command': 'ledctrl',
									'led_node': 'chamber_light',
									'led_mode': 'off',
									'led_on_time': 500,
									'led_off_time': 500,
									'loop_times': 0,
									'interval_time': 0
								}
							};
						}
						break;

					case ('lightToolHead'):
						if (state.val === true) {
							msg = msg = { 'print': { 'command': 'gcode_line', 'param': `M960 S5 P1`, 'sequence_id': '0' } };
						} else if (state.val === false) {
							msg = msg = { 'print': { 'command': 'gcode_line', 'param': `M960 S5 P0`, 'sequence_id': '0' } };
						}
						break;

					case ('start'):
						msg = {
							'print': {
								'sequence_id': '0',
								'command': 'start'
							}
						};
						break;

					case ('stop'):
						msg = {
							'print': {
								'sequence_id': '0',
								'command': 'stop'
							}
						};
						break;

					case ('resume'):
						msg = {
							'print': {
								'sequence_id': '0',
								'command': 'resume'
							}
						};
						break;

					case ('fanSpeedChamber'):
						msg = { 'print': { 'command': 'gcode_line', 'param': `M106 P3 S${state.val * 2.55}`, 'sequence_id': '0' } };

						break;
				}

				if (msg) {
					this.publishMQTTmessages(msg);
				}
			}

		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Bambulab(options);
} else {
	// otherwise start the instance directly
	new Bambulab();
}
