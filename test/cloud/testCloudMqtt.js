const { expect } = require('chai');
const bambuCloud = require('../../lib/bambu-cloud.js');

/** Kleines Hilfs-JWT nur für Tests (Signatur wird nicht geprüft). */
function fakeJwt(payload) {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `e30.${body}.sig`;
}

describe('bambu-cloud MQTT username', () => {
    it('normalizeMqttUsername akzeptiert u_ und reine Zahlen', () => {
        expect(bambuCloud.normalizeMqttUsername('u_99')).to.equal('u_99');
        expect(bambuCloud.normalizeMqttUsername(12345)).to.equal('u_12345');
        expect(bambuCloud.normalizeMqttUsername('abc')).to.be.null;
    });

    it('mqttUsernameFromJwt liest username wie Home Assistant', () => {
        const token = fakeJwt({ username: 'u_42424242' });
        expect(bambuCloud.mqttUsernameFromJwt(token)).to.equal('u_42424242');
    });

    it('mqttUsernameFromJwt nutzt uid-Felder', () => {
        const token = fakeJwt({ user_id: '111222333' });
        expect(bambuCloud.mqttUsernameFromJwt(token)).to.equal('u_111222333');
    });

    it('mqttUsernameHintFromLoginData aus Login-JSON', () => {
        expect(bambuCloud.mqttUsernameHintFromLoginData({ accessToken: 'x', uid: 55 })).to.equal('u_55');
        expect(bambuCloud.mqttUsernameHintFromLoginData({ accessToken: 'x', username: 'u_77' })).to.equal('u_77');
    });

    it('resolveCloudMqttUsername nutzt gespeicherten Admin-Wert ohne API', async () => {
        const token = fakeJwt({});
        const user = await bambuCloud.resolveCloudMqttUsername(token, 'global', {
            cloudMqttUsername: 'u_888',
        });
        expect(user).to.equal('u_888');
    });

    it('resolveCloudMqttUsername nutzt cloudUserId als u_', async () => {
        const token = fakeJwt({});
        const user = await bambuCloud.resolveCloudMqttUsername(token, 'global', {
            cloudUserId: '1234567890',
        });
        expect(user).to.equal('u_1234567890');
    });

    it('resolveCloudMqttUsername nutzt Login-Hint vor gespeicherten Werten', async () => {
        const token = fakeJwt({});
        const user = await bambuCloud.resolveCloudMqttUsername(token, 'global', { cloudMqttUsername: 'u_1' }, 'u_2');
        expect(user).to.equal('u_2');
    });
});
