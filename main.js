'use strict';

/*
 * Created with @iobroker/create-adapter v2.4.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const mqtt = require('mqtt');

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

			this.log.debug(`Try to connect to printer to connect`);

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

				// Subscribe on printer topic after connection
				client.subscribe([`device/${this.config.serial}/report`], () => {
					this.log.debug(`Subscribed to printer topic by serial`);
				});

			});

			// Receive MQTT messages
			client.on('message',  (topic, message) => {
				// message is Buffer
				console.debug(message.toString());
				this.messageHandler(message.toString());
			});

			client.on('reconnecting',  (topic, message) =>{
				this.log.info(`Reconnecting ${message.toString()}`);
			});

			client.on('end',  () =>{
				this.log.info(`Connection to Printer closed`);
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
				}, 5000);

			});

		} catch (e) {
			this.log.error(e);
		}
	}

	 */
	messageHandler (message) {

		try {
			// Parse string to an JSON object
			message = JSON.parse(message);

			// Explore JSON & create states
			jsonExplorer.traverseJson(message.print, this.config.serial, true, true, 0);

			// Set values for states which need modification
			this.setStateChanged(`${this.config.serial}.cooling_fan_speed`, {val: convert.fanSpeed(message.print.cooling_fan_speed), ack: true});
		} catch (e) {
			this.log.error(e);
		}


	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
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
