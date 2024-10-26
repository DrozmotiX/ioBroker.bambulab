'use strict';

/*
 * Created with @iobroker/create-adapter v2.4.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

const mqtt = require('mqtt'); // MQTT request library
const {default: axios} = require('axios'); // Http request library

const jsonExplorer = require('iobroker-jsonexplorer'); // Use jsonExplorer library
const convert = require('./lib/converter'); // Load converter functions
const stateAttr = require(`${__dirname}/lib/state_attr.js`); // Load attribute library

let client; // Memory to store client connection information
const clientConnection = {
	connected: false,
	connectError: false,
	initiated: false
};
const timeouts = {}; // Object array containing all running timers
const errorCodesHMS = {}; // Object array of translated error codes
let language = 'en'; // System language to handle error code translations, default EN

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

		// Get system language, use EN as fallback in case of errors
		const sys_conf = await this.getForeignObjectAsync('system.config');
		if (sys_conf && sys_conf.common.language){
			language = sys_conf.common.language;
		}

		// Reset the connection indicator during startup
		await this.setState('info.connection', false, true);

		// Download / Update HMS error Codes
		await this.loadHMSErrorCodeTranslations();

		// Handle MQTT messages
		this.mqttMessageHandle();

	}

	/**
	 * Handle MQTT connection & message
	 */
	mqttMessageHandle(){
		try {

			this.log.info(`Try to connect to printer`);

			// Connect to Printer using MQTT
			client = mqtt.connect(`mqtts://${this.config.host}:8883`, {
				username: 'bblp',
				password: this.config.Password,
				reconnectPeriod: 30,
				rejectUnauthorized: false,
			});

			// Establish connection to printer by MQTT
			client.on('connect', () => {

				if (!clientConnection.connected) this.log.info(`Printer connected`);
				this.setState('info.connection', true, true);
				clientConnection.connected = true;
				clientConnection.connectError = false;

				this.createControlStates();

				// Subscribe on a printer topic after connection
				client.subscribe([`device/${this.config.serial}/report`], () => {
					this.log.debug(`Subscribed to printer data topic by serial | ${this.config.serial}`);
				});

				// After new firmware release this summer all data must be requested 1 time at adapter start
				this.requestData();
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
					this.log.info(`Response to control command ${JSON.stringify(message)}`);
					// @ts-ignore if system does not exist function will return false and skip
				} else if (message && message.system){ // Handle values for system messages, used to acknowledge messages
					this.log.debug(`System Message ${JSON.stringify(message)}`);
				} else if (message && message['t_utc']){ // Handle values for system messages, used to acknowledge messages
					// this.log.info(`System Message ${JSON.stringify(message)}`);
					// TimeStamp Message, ignore
				} else {
					this.log.debug(`Unknown Message ${JSON.stringify(message)}`);
				}
				clientConnection.connected = true;
				clientConnection.connectError = false;
			});

			client.on('end',  () =>{
				if (clientConnection.connected) this.log.warn(`Connection to Printer closed`);
				this.setState('info.connection', false, true);
				clientConnection.connected = false;
				clientConnection.connectError = true;
				clientConnection.initiated = false;
			});

			client.on('error', (error) => {
				if (!clientConnection.connectError) this.log.error(`Connection issue occurred ${error}`);
				// Close MQTT connection
				client.end();
				if (clientConnection.connected) this.log.warn(`Connection to Printer closed`);
				this.setState('info.connection', false, true);

				// Try to reconnect
				if (timeouts[this.config.serial]) {clearTimeout(timeouts[this.config.serial]); timeouts[this.config.serial] = null;}
				timeouts[this.config.serial] = setTimeout(async function () {
					client.reconnect();
				}, 30000);
				clientConnection.connected = false;
				clientConnection.connectError = true;
				clientConnection.initiated = false;
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
			if (message.print) {
				// Modify values of JSON for states which need modification
				message.print.control = {};
				if (message.print.cooling_fan_speed != null) {
					message.print.cooling_fan_speed = convert.fanSpeed(message.print.cooling_fan_speed);
					message.print.control.cooling_fan_speed = convert.fanSpeed(message.print.cooling_fan_speed);
				}
				if (message.print.heatbreak_fan_speed != null) {
					message.print.heatbreak_fan_speed = convert.fanSpeed(message.print.heatbreak_fan_speed);
					message.print.control.heatbreak_fan_speed = convert.fanSpeed(message.print.heatbreak_fan_speed);
				}
				if (message.print.stg_cur != null) {
					message.print.stg_cur = convert.stageParser(message.print.stg_cur);
					message.print.control.stg_cur = convert.stageParser(message.print.stg_cur);
				}
				if (message.print.big_fan1_speed != null) {
					message.print.big_fan1_speed = convert.fanSpeed(message.print.big_fan1_speed);
					message.print.control.big_fan1_speed = convert.fanSpeed(message.print.big_fan1_speed);
				}
				if (message.print.big_fan2_speed != null) {
					message.print.big_fan2_speed = convert.fanSpeed(message.print.big_fan2_speed);
					message.print.control.big_fan2_speed = convert.fanSpeed(message.print.big_fan2_speed);
				}
				if (message.print.spd_lvl != null) {
					message.print.control.spd_lvl = message.print.spd_lvl;
				}
				if (message.print.bed_target_temper != null) message.print.control.bed_target_temper = message.print.bed_target_temper;
				if (message.print.nozzle_target_temper != null) message.print.control.nozzle_target_temper = message.print.nozzle_target_temper;
				if (message.print.mc_remaining_time != null) {
					message.print.finishTime = (new Date(new Date().getTime() + (message.print.mc_remaining_time * 60000))).toISOString();
					message.print.mc_remaining_time = convert.remainingTime(message.print.mc_remaining_time);
				}

				if (message.print.gcode_start_time != null) {
					let gcode_start_timeFormatted = new Date(message.print.gcode_start_time * 1000).toString();
					gcode_start_timeFormatted = gcode_start_timeFormatted.replace('"', '');
					message.print.gcode_start_timeFormatted = gcode_start_timeFormatted;
				}
				if (message.print.vt_tray != null && message.print.vt_tray.bed_temp != null) message.print.vt_tray.bed_temp = +message.print.vt_tray.bed_temp;
				// Update light control datapoint
				if (message.print.lights_report && message.print.lights_report[0] && message.print.lights_report[0].mode === 'on'){
					message.print.control.lightChamber = true;
					message.print.lights_report[0].mode = true;
				} else if (message.print.lights_report && message.print.lights_report[0] && message.print.lights_report[0].mode === 'off'){
					message.print.control.lightChamber = false;
					message.print.lights_report[0].mode = false;
				}

				// Translate HMS Code & write to state
				const hmsError = [];
				if(message.print.hms != null){
					message.print.hms.hmsErrors = true;
					for (const hms_code in message.print.hms) {
						const attr = convert.DecimalHexTwosComplement(message.print.hms[hms_code].attr);
						const code = convert.DecimalHexTwosComplement(message.print.hms[hms_code].code);

						let full_code = (attr + code).replace(/(.{4})/g, '$1_');
						full_code = full_code.substring(0, full_code.length - 1);
						const urlEN = 'https://wiki.bambulab.com/en/x1/troubleshooting/hmscode/'+full_code;

						let errorDesc = 'No description available in your language';
						if (errorCodesHMS[full_code.replaceAll('_','').toUpperCase()] != null && errorCodesHMS[full_code.replaceAll('_','').toUpperCase()]['desc'] != null){
							errorDesc = errorCodesHMS[full_code.replaceAll('_','').toUpperCase()]['desc'];
						}
						const errorMessageArray = {'code': 'HMS_'+full_code, 'url-EN': urlEN, 'description': errorDesc};
						if (language.toUpperCase() !== 'EN'){
							errorMessageArray['url-local'] = `https://wiki.bambulab.com/${language}/x1/troubleshooting/hmscode/${full_code}`;
						}
						hmsError.push(errorMessageArray);
					}
				} else {
					message.print.hms = {
						hmsErrorCount: 0,
						hmsErrors: false
					};
				}

				await this.setState(`${this.config.serial}.hms.hmsErrorCode`,{val: JSON.stringify(hmsError), ack: true});

				// For some reason library does not convert the ams related bed_temp to number when value = 0
				if (message.print.ams != null && message.print.ams.ams_exist_bits != null && message.print.ams.ams_exist_bits === '1') {
					// Call function to handle states for AMS unit
					message.print.ams.ams = this.handleAMSUnits(message);
				}
			}

			// Explore JSON & create states
			const returnJONexplorer = await jsonExplorer.traverseJson(message.print, this.config.serial, false, false, 0);
			this.log.debug(`Response of JSONexploer: ${JSON.stringify(returnJONexplorer)}`);

		} catch (e) {
			this.log.error(`[messageHandler] ${e} | ${e.stack}`);
		}
		clientConnection.initiated = true;
	}

	handleAMSUnits(message){
		const amsData = message.print.ams.ams;
		// handle conversion for all AMS units
		for (const unit in amsData){
			if (amsData[unit] !== null){
				for (const tray in amsData[unit].tray){

					if (!amsData[unit].tray[tray].cols) {
						// amsData[unit].tray[tray] =   {
						// 	'bed_temp': '',
						// 	'bed_temp_type': '',
						// 	'cols': [],
						// 	'drying_temp': '',
						// 	'drying_time': '',
						// 	'id': '',
						// 	'nozzle_temp_max': '',
						// 	'nozzle_temp_min': '',
						// 	'remain': 0,
						// 	'tag_uid': '',
						// 	'tray_color': '',
						// 	'tray_diameter': '',
						// 	'tray_id_name': '',
						// 	'tray_info_idx': '',
						// 	'tray_sub_brands': '',
						// 	'tray_type': '',
						// 	'tray_uuid': '',
						// 	'tray_weight': '',
						// 	'xcam_info': ''
						// };
						// amsData[unit].tray[tray]._filamentPresent = false;
					} else {
						// amsData[unit].tray[tray]._filamentPresent = true;
						amsData[unit].tray[tray].bed_temp = parseInt(amsData[unit].tray[tray].bed_temp);
					}
					if (amsData[unit].tray[tray].bed_temp != null) amsData[unit].tray[tray].bed_temp = parseInt(amsData[unit].tray[tray].bed_temp);
				}
			}
		}
		return amsData;
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

	requestData(){

		// Prepare MQTT message
		const msg = {
			'pushing': {
				'sequence_id': '1',
				'command': 'pushall'
			},
			'user_id': '1234567890'
		};

		// Try to request data
		this.publishMQTTmessages(msg);

		// Handle an interval only if not X1-Series
		if (timeouts['dataPolling']) {clearTimeout(timeouts['dataPolling']); timeouts['dataPolling'] = null;}
		timeouts['dataPolling'] = setTimeout(()=> {
			// Request data for P1p printer series
			if (this.config.printerModel !== 'X1'
				&& this.config.printerModel !== 'X1-Carbon'
				&& this.config.printerModel !== 'X1-Series'
				&& this.config.printerModel !== 'A1-Series'
			){
				this.requestData();
			}
		}, this.config.requestInterval * 1000);

	}

	createControlStates(){

		const controlStates = {
			homing : {
				name: 'Homing print head',
				type: 'boolean',
				role: 'button',
				read: false,
				write: true,
			},
			_customGcode : {
				name: 'Custom G-Code',
				type: 'string',
				role: 'state',
				read: true,
				write: true,
				def: ''
			},
			lightToolHeadLogo : {
				name: 'Tool head Logo',
				type: 'boolean',
				role: 'state',
				read: true,
				write: true,
				def: false
			},
			pause : {
				name: 'Pause printing',
				type: 'boolean',
				role: 'button.pause',
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
				role: 'button.resume',
				read: false,
				write: true
			},
			updateHMSErrorCodeTranslation : {
				name: 'Update HMS error code translations',
				type: 'boolean',
				role: 'button',
				read: false,
				write: true
			},
		};

		const hmstates = {
			'hmsErrorCode' : {
				'role': 'indicator.maintenance',
				'name': 'Health Management System (HMS)',
				'type': 'string',
				'read': true,
				'write': false,
				'def': ''
			},
			'hmsErrorCount' : {
				'role': 'indicator.maintenance',
				'name': 'HMS Alarm count',
				'type': 'number',
				'read': true,
				'write': false,
				'def': 0
			},
			'hmsErrors' : {
				'role': 'indicator.alarm',
				'name': 'HMS Alarm ',
				'type': 'boolean',
				'read': true,
				'write': false,
				'def': false
			}
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

		for (const state in hmstates){
			this.extendObject(`${this.config.serial}.hms.${state}`, {
				type: 'state',
				common: hmstates[state]
			});
		}
	}

	async loadHMSErrorCodeTranslations(){
		try {
			this.log.info('Try to get current HMS code translations');

			// Web request to download latest translations
			const requestDeviceDataByAPI = async () => {
				const response = await axios.get(`https://e.bambulab.com/query.php?lang=${language}`, {timeout: 3000}); // Timout of 3 seconds for API call
				this.log.debug(JSON.stringify('HMS ErrorCode translations : ' + response.data));
				return response.data;
			};

			const loadTranslationsToMemory = async (tranJSON) => {
				for (const errorType in tranJSON){
					for (const errorCode in tranJSON[errorType][language]){
						if (tranJSON[errorType][language][errorCode] != null && tranJSON[errorType][language][errorCode].ecode != null){
							errorCodesHMS[tranJSON[errorType][language][errorCode].ecode.toUpperCase()] = {
								'ecode' : tranJSON[errorType][language][errorCode].ecode,
								'desc': tranJSON[errorType][language][errorCode].intro
							};
						}
					}
				}
			};

			// Try to download new translation JSON, abort function in case of error
			const onlineTran = await requestDeviceDataByAPI();
			if (onlineTran == null || onlineTran.data == null){
				this.log.warn(`Cannot download HMS error code translations`);
				return false;
			}

			const onlineTranObj = onlineTran.data;
			onlineTranObj.ver = onlineTran.ver;
			onlineTranObj.language = language.toUpperCase();

			// get current Translations
			const currentTran = await this.getStateAsync('info.hmsErrorCodeTranslations');

			if (currentTran == null || currentTran.val === ''){
				this.log.info(`No Local translation available, version ${onlineTran.ver} downloaded`);
				this.setStateAsync(`info.hmsErrorCodeTranslations`, {val: JSON.stringify(onlineTranObj), ack: true});
				await loadTranslationsToMemory(onlineTranObj);
			} else if (currentTran.val != null && currentTran.val !== ''){
				const currentTranObj = JSON.parse(currentTran.val);
				// Check if new version is available
				if((currentTranObj.ver !== onlineTran.ver)){
					this.log.info(`Local translation ${currentTranObj.ver} outdated, updating to ${onlineTran.ver}`);
					this.setStateAsync(`info.hmsErrorCodeTranslations`, {val: JSON.stringify(onlineTranObj), ack: true});
					await loadTranslationsToMemory(onlineTranObj);
				} else if (currentTranObj.language.toUpperCase() !== language.toUpperCase()){
					this.log.info(`Local translation ${currentTranObj.language} incorrect, updating to ${language.toUpperCase()}`);
					this.setStateAsync(`info.hmsErrorCodeTranslations`, {val: JSON.stringify(onlineTranObj), ack: true});
					loadTranslationsToMemory(onlineTranObj);
				}
				else {
					this.log.info(`Local translation available, version ${currentTranObj.ver} is up-to-date`);
					loadTranslationsToMemory(currentTranObj);
				}
			}
		} catch (e) {
			this.log.error(`[loadHMSerroCodeTranslations] ${e} | ${e.stack}`);
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {

			// Close running timers
			if (timeouts[this.config.serial]) {clearTimeout(timeouts[this.config.serial]); timeouts[this.config.serial] = null;}
			if (timeouts['dataPolling']) {clearTimeout(timeouts['dataPolling']); timeouts[timeouts['dataPolling']] = null;}

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
	async onStateChange(id, state) {
		if (state && state.val != null) {
			// Only act on trigger if value is not Acknowledged
			if (!state.ack) {
				console.debug(`${id} | ${state.val}`);
				let msg;
				const checkID = id.split('.');

				//ToDo: Implement ACK based on success message of MQTT in relation to sequence ID.
				// Handle control states

				let stateLocation = 3;
				if (checkID[3] === 'control') stateLocation = 4;

				switch (checkID[stateLocation]) {
					case ('_customGcode'):
						msg = msg = {
							'print': {
								'command': 'gcode_line',
								'param': `${state.val}`,
								'sequence_id': '0'
							}
						};
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
					case ('lightToolHeadLogo'):
						if (state.val === true) {
							msg = msg = {
								'print': {
									'command': 'gcode_line',
									'param': `M960 S5 P1 \n`,
									'sequence_id': '0'
								}
							};
						} else if (state.val === false) {
							msg = msg = {
								'print': {
									'command': 'gcode_line',
									'param': `M960 S5 P0 \n`,
									'sequence_id': '0'
								}
							};
						}
						break;
					case ('pause'):
						msg = {
							'print': {
								'sequence_id': '0',
								'command': 'pause'
							}
						};
						break;
					case ('updateHMSErrorCodeTranslation'):
						await this.loadHMSErrorCodeTranslations();
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
						msg = {
							'print': {
								'command': 'gcode_line',
								'param': `M106 P3 S${state.val * 2.55} \n`,
								'sequence_id': '0'
							}
						};

						break;
					case ('spd_lvl'):
						msg = {
							'print': {
								'command': 'print_speed',
								'param': `${state.val} \n`,
								'sequence_id': '0'
							}
						};
						break;
					case ('bed_target_temper'):
						msg = {
							'print': {
								'command': 'gcode_line',
								'param': `M140 S${state.val} \n`,
								'sequence_id': '0'
							}
						};
						break;
					case ('nozzle_target_temper'):
						msg = {
							'print': {
								'command': 'gcode_line',
								'param': `M104 S${state.val} \n`,
								'sequence_id': '0'
							}
						};
						break;
					case ('big_fan1_speed'):
						msg = {
							'print': {
								'command': 'gcode_line',
								'param': `M106 P2 S${state.val * 2.55} \n`,
								'sequence_id': '0'
							}
						};
						break;
					case ('big_fan2_speed'):
						msg = {
							'print': {
								'command': 'gcode_line',
								'param': `M106 P3 S${state.val * 2.55} \n`,
								'sequence_id': '0'
							}
						};
						break;
					case ('cooling_fan_speed'):
						msg = {
							'print': {
								'command': 'gcode_line',
								'param': `M106 P1 S${state.val * 2.55} \n`,
								'sequence_id': '0'
							}
						};
						break;
					case ('homing'):
						msg = msg = {
							'print': {
								'command': 'gcode_line',
								'param': 'G28 \n',
								'reason': 'SUCCESS',
								'result': 'SUCCESS',
								'sequence_id': '20086',
								'user_id': '1767420324'
							}
						};
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
