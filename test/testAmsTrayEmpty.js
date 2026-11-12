const { expect } = require('chai');
const {
    isAmsTrayEmptyFromMqtt,
    applyEmptyAmsTrayDefaults,
} = require('../lib/ams_tray_normalize.js');

describe('AMS leerer Slot (#204)', () => {
    it('erkennt Minimal-JSON { id } wie in Issue #204', () => {
        expect(isAmsTrayEmptyFromMqtt({ id: '1' })).to.equal(true);
        expect(isAmsTrayEmptyFromMqtt({ id: 2, cols: ['FF0000FF'] })).to.equal(false);
    });

    it('setzt Leer-Defaults ohne alte cols', () => {
        const tray = { id: '0' };
        applyEmptyAmsTrayDefaults(tray);
        expect(tray.tray_type).to.equal('');
        expect(tray.cols).to.deep.equal([]);
        expect(tray.remain).to.equal(-1);
        expect(tray.id).to.equal('0');
    });
});
