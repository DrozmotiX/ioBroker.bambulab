const { expect } = require('chai');
const {
    isAmsTrayEmptyFromMqtt,
    applyEmptyAmsTrayDefaults,
    isTrayOccupiedInBitmask,
    shouldClearAmsTray,
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
        expect(tray.cols).to.equal('');
        expect(tray.remain_g).to.equal(0);
        expect(tray.tray_weight).to.equal('0');
        expect(tray.remain).to.equal(-1);
        expect(tray.id).to.equal('0');
    });

    it('neutralisiert unbekannte Felder aus altem MQTT', () => {
        const tray = { id: '1', tray_type: 'PETG', ins_cyc: 5, custom_x: 'y' };
        applyEmptyAmsTrayDefaults(tray);
        expect(tray.tray_type).to.equal('');
        expect(tray.ins_cyc).to.equal(0);
        expect(tray.custom_x).to.equal('');
    });

    it('tray_exist_bits 2f: AMS1 Slot1 (tray.0) leer, Slot2 (tray.1) voll', () => {
        expect(isTrayOccupiedInBitmask('2f', 1, 0)).to.equal(false);
        expect(isTrayOccupiedInBitmask('2f', 1, 1)).to.equal(true);
        const stale = { id: '0', tray_type: 'PETG', cols: ['FF00FF'] };
        expect(shouldClearAmsTray(stale, '2f', 1)).to.equal(true);
    });
});
