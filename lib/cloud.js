'use strict';

const { default: axios } = require('axios');
const mqtt = require('mqtt');

/**
 * Bambu Lab Cloud Integration Module
 * Handles authentication, API polling, and WebSocket/MQTT proxy connections
 */
class BambuLabCloud {
    /**
     * Bambu Lab Cloud Integration Module constructor
     * Handles authentication, API polling, and WebSocket/MQTT proxy connections
     *
     * @param {object} adapter - ioBroker adapter instance
     * @param {object} config - Configuration object
     */
    constructor(adapter, config) {
        this.adapter = adapter;
        this.config = config;
        this.authData = {
            accessToken: null,
            refreshToken: null,
            expiresIn: null,
            tokenExpiry: null,
        };
        this.cloudData = {
            devices: [],
            tasks: [],
            messages: [],
            deviceVersions: {},
            userProfile: {},
        };
        this.pollingInterval = null;
        this.mqttClient = null;
    }

    /**
     * Authenticate with Bambu Lab Cloud API
     *
     * @returns {Promise<boolean>} Success status
     */
    async authenticate() {
        try {
            this.adapter.log.info('Authenticating with Bambu Lab Cloud...');

            const response = await axios.post(
                'https://api.bambulab.com/v1/user-service/user/login',
                {
                    account: this.config.cloudEmail,
                    password: this.config.cloudPassword,
                },
                {
                    timeout: 10000,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (response.data && response.data.accessToken) {
                this.authData.accessToken = response.data.accessToken;
                this.authData.refreshToken = response.data.refreshToken;
                this.authData.expiresIn = response.data.expiresIn;
                this.authData.tokenExpiry = Date.now() + response.data.expiresIn * 1000;

                this.adapter.log.info('Cloud authentication successful');
                return true;
            }
            this.adapter.log.error('Cloud authentication failed: No access token received');
            return false;
        } catch (error) {
            this.adapter.log.error(`Cloud authentication error: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if authentication token is still valid
     *
     * @returns {boolean} Token validity status
     */
    isTokenValid() {
        if (!this.authData.accessToken || !this.authData.tokenExpiry) {
            return false;
        }
        return Date.now() < this.authData.tokenExpiry - 60000; // Refresh 1 minute before expiry
    }

    /**
     * Make authenticated API request
     *
     * @param {string} url - API endpoint
     * @returns {Promise<object | null>} API response data
     */
    async makeAuthenticatedRequest(url) {
        if (!this.isTokenValid()) {
            if (!(await this.authenticate())) {
                return null;
            }
        }

        try {
            const response = await axios.get(`https://api.bambulab.com${url}`, {
                headers: {
                    Authorization: `Bearer ${this.authData.accessToken}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });

            return response.data;
        } catch (error) {
            this.adapter.log.error(`Cloud API request failed for ${url}: ${error.message}`);
            return null;
        }
    }

    /**
     * Poll all cloud API endpoints
     */
    async pollCloudData() {
        this.adapter.log.debug('Polling cloud data...');

        // Get bound devices
        const devices = await this.makeAuthenticatedRequest('/v1/iot-service/api/user/bind');
        if (devices) {
            this.cloudData.devices = devices;
            await this.storeDeviceData(devices);
        }

        // Get print job history
        const tasks = await this.makeAuthenticatedRequest('/v1/user-service/my/tasks');
        if (tasks) {
            this.cloudData.tasks = tasks;
            await this.storeTaskData(tasks);
        }

        // Get system/user messages
        const messages = await this.makeAuthenticatedRequest('/v1/user-service/my/messages');
        if (messages) {
            this.cloudData.messages = messages;
            await this.storeMessageData(messages);
        }

        // Get user profile/preferences
        const profile = await this.makeAuthenticatedRequest('/v1/design-user-service/my/preference');
        if (profile) {
            this.cloudData.userProfile = profile;
            await this.storeUserProfile(profile);
        }

        // Get device firmware info for each device
        if (this.cloudData.devices && Array.isArray(this.cloudData.devices)) {
            for (const device of this.cloudData.devices) {
                if (device.dev_id) {
                    const versionInfo = await this.makeAuthenticatedRequest(
                        `/v1/iot-service/api/user/device/version?dev_id=${device.dev_id}`,
                    );
                    if (versionInfo) {
                        this.cloudData.deviceVersions[device.dev_id] = versionInfo;
                        await this.storeDeviceVersionInfo(device.dev_id, versionInfo);
                    }
                }
            }
        }
    }

    /**
     * Store device data in ioBroker states
     *
     * @param {Array} devices - Device list from API
     */
    async storeDeviceData(devices) {
        try {
            await this.adapter.setObjectNotExistsAsync('cloud.devices', {
                type: 'channel',
                common: {
                    name: 'Cloud Devices',
                },
            });

            await this.adapter.setStateAsync('cloud.devices.count', devices.length || 0, true);
            await this.adapter.setStateAsync('cloud.devices.data', JSON.stringify(devices), true);

            if (Array.isArray(devices)) {
                for (let i = 0; i < devices.length; i++) {
                    const device = devices[i];
                    const deviceId = device.dev_id || `device_${i}`;

                    await this.adapter.setObjectNotExistsAsync(`cloud.devices.${deviceId}`, {
                        type: 'channel',
                        common: {
                            name: device.name || `Device ${i}`,
                        },
                    });

                    // Store device properties
                    for (const [key, value] of Object.entries(device)) {
                        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                            await this.adapter.setStateAsync(`cloud.devices.${deviceId}.${key}`, value, true);
                        }
                    }
                }
            }
        } catch (error) {
            this.adapter.log.error(`Error storing device data: ${error.message}`);
        }
    }

    /**
     * Store task/job data in ioBroker states
     *
     * @param {Array} tasks - Task list from API
     */
    async storeTaskData(tasks) {
        try {
            await this.adapter.setObjectNotExistsAsync('cloud.tasks', {
                type: 'channel',
                common: {
                    name: 'Print Tasks',
                },
            });

            await this.adapter.setStateAsync('cloud.tasks.count', Array.isArray(tasks) ? tasks.length : 0, true);
            await this.adapter.setStateAsync('cloud.tasks.data', JSON.stringify(tasks), true);
        } catch (error) {
            this.adapter.log.error(`Error storing task data: ${error.message}`);
        }
    }

    /**
     * Store message data in ioBroker states
     *
     * @param {Array} messages - Messages from API
     */
    async storeMessageData(messages) {
        try {
            await this.adapter.setObjectNotExistsAsync('cloud.messages', {
                type: 'channel',
                common: {
                    name: 'System Messages',
                },
            });

            await this.adapter.setStateAsync(
                'cloud.messages.count',
                Array.isArray(messages) ? messages.length : 0,
                true,
            );
            await this.adapter.setStateAsync('cloud.messages.data', JSON.stringify(messages), true);
        } catch (error) {
            this.adapter.log.error(`Error storing message data: ${error.message}`);
        }
    }

    /**
     * Store user profile data in ioBroker states
     *
     * @param {object} profile - User profile from API
     */
    async storeUserProfile(profile) {
        try {
            await this.adapter.setObjectNotExistsAsync('cloud.profile', {
                type: 'channel',
                common: {
                    name: 'User Profile',
                },
            });

            await this.adapter.setStateAsync('cloud.profile.data', JSON.stringify(profile), true);

            // Store individual profile properties
            if (typeof profile === 'object' && profile !== null) {
                for (const [key, value] of Object.entries(profile)) {
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                        await this.adapter.setStateAsync(`cloud.profile.${key}`, value, true);
                    }
                }
            }
        } catch (error) {
            this.adapter.log.error(`Error storing user profile: ${error.message}`);
        }
    }

    /**
     * Store device version information in ioBroker states
     *
     * @param {string} deviceId - Device ID
     * @param {object} versionInfo - Version information from API
     */
    async storeDeviceVersionInfo(deviceId, versionInfo) {
        try {
            await this.adapter.setObjectNotExistsAsync(`cloud.devices.${deviceId}.version`, {
                type: 'channel',
                common: {
                    name: 'Firmware Version Info',
                },
            });

            await this.adapter.setStateAsync(
                `cloud.devices.${deviceId}.version.data`,
                JSON.stringify(versionInfo),
                true,
            );

            // Store individual version properties
            if (typeof versionInfo === 'object' && versionInfo !== null) {
                for (const [key, value] of Object.entries(versionInfo)) {
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                        await this.adapter.setStateAsync(`cloud.devices.${deviceId}.version.${key}`, value, true);
                    }
                }
            }
        } catch (error) {
            this.adapter.log.error(`Error storing device version info: ${error.message}`);
        }
    }

    /**
     * Setup WebSocket/MQTT proxy connection
     *
     * @returns {Promise<boolean>} Connection success status
     */
    async setupProxyConnection() {
        if (!this.config.octoEverywhereToken || !this.config.octoEverywhereSecret) {
            this.adapter.log.debug('No OctoEverywhere credentials provided, skipping proxy connection');
            return false;
        }

        try {
            this.adapter.log.info('Setting up OctoEverywhere proxy connection...');

            // Extract app ID from token or use a default
            const appId = this.extractAppId(this.config.octoEverywhereToken) || 'bambu';

            this.mqttClient = mqtt.connect(
                `wss://app${appId}.octoeverywhere.com/octoeverywhere-command-api/proxy/mqtt`,
                {
                    username: this.config.octoEverywhereToken,
                    password: this.config.octoEverywhereSecret,
                    protocol: 'wss',
                    reconnectPeriod: 30000,
                    connectTimeout: 30000,
                },
            );

            return new Promise(resolve => {
                this.mqttClient.on('connect', () => {
                    this.adapter.log.info('OctoEverywhere proxy connection established');

                    // Subscribe to device topics
                    if (this.config.serial) {
                        this.mqttClient.subscribe(`device/${this.config.serial}/report`);
                    }

                    resolve(true);
                });

                this.mqttClient.on('error', error => {
                    this.adapter.log.error(`OctoEverywhere proxy connection error: ${error.message}`);
                    resolve(false);
                });

                this.mqttClient.on('message', (topic, message) => {
                    // Forward messages to the main adapter message handler
                    try {
                        const parsedMessage = JSON.parse(message.toString());
                        this.adapter.log.debug(`Proxy message received: ${JSON.stringify(parsedMessage)}`);

                        // You would integrate this with the existing message handling logic
                        if (this.adapter.messageHandler) {
                            this.adapter.messageHandler(parsedMessage);
                        }
                    } catch (error) {
                        this.adapter.log.error(`Error parsing proxy message: ${error.message}`);
                    }
                });

                setTimeout(() => resolve(false), 30000); // Timeout after 30 seconds
            });
        } catch (error) {
            this.adapter.log.error(`Proxy connection setup error: ${error.message}`);
            return false;
        }
    }

    /**
     * Extract app ID from OctoEverywhere token
     *
     * @param {string} token - OctoEverywhere token
     * @returns {string|null} App ID
     */
    extractAppId(token) {
        // This is a placeholder - you might need to adjust based on actual token format
        try {
            const parts = token.split('.');
            if (parts.length > 1) {
                return parts[0];
            }
        } catch {
            // Ignore parsing errors
        }
        return null;
    }

    /**
     * Start cloud integration
     *
     * @returns {Promise<boolean>} Success status
     */
    async start() {
        try {
            this.adapter.log.info('Starting Bambu Lab Cloud integration...');

            // Authenticate with cloud
            if (!(await this.authenticate())) {
                return false;
            }

            // Initial data poll
            await this.pollCloudData();

            // Setup polling interval (every 5 minutes)
            this.pollingInterval = setInterval(
                async () => {
                    await this.pollCloudData();
                },
                5 * 60 * 1000,
            );

            // Setup proxy connection if credentials are provided
            await this.setupProxyConnection();

            this.adapter.log.info('Bambu Lab Cloud integration started successfully');
            return true;
        } catch (error) {
            this.adapter.log.error(`Error starting cloud integration: ${error.message}`);
            return false;
        }
    }

    /**
     * Stop cloud integration
     */
    async stop() {
        this.adapter.log.info('Stopping Bambu Lab Cloud integration...');

        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        if (this.mqttClient) {
            this.mqttClient.end();
            this.mqttClient = null;
        }

        // Clear auth data
        this.authData = {
            accessToken: null,
            refreshToken: null,
            expiresIn: null,
            tokenExpiry: null,
        };

        this.adapter.log.info('Cloud integration stopped');
    }

    /**
     * Publish MQTT message through proxy
     *
     * @param {object} message - Message to publish
     */
    publishMessage(message) {
        if (this.mqttClient && this.mqttClient.connected && this.config.serial) {
            const topic = `device/${this.config.serial}/request`;
            this.mqttClient.publish(topic, JSON.stringify(message));
            this.adapter.log.debug(`Published message via proxy: ${JSON.stringify(message)}`);
        } else {
            this.adapter.log.warn('Cannot publish message: proxy connection not available');
        }
    }

    /**
     * Get current cloud data
     *
     * @returns {object} Current cloud data
     */
    getCloudData() {
        return { ...this.cloudData };
    }

    /**
     * Get authentication status
     *
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return this.isTokenValid();
    }
}

module.exports = BambuLabCloud;
