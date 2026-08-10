'use strict';

const { expect } = require('chai');
const {
    canonicalizeSerial,
    decodeH2NozzleTemperatures,
    decodeH2TemperatureWord,
    decodeH2ChamberTemperatures,
} = require('./lib/h2');

describe('H2 printer protocol helpers', () => {
    it('canonicalizes the serial used in case-sensitive MQTT topics', () => {
        expect(canonicalizeSerial(' 31b8dp632100385 ')).to.equal('31B8DP632100385');
    });

    it('decodes live H2C dual-nozzle temperature words', () => {
        expect(
            decodeH2NozzleTemperatures([
                { id: 0, temp: 16056565 },
                { id: 1, temp: 2621493 },
            ]),
        ).to.deep.equal({
            right_nozzle_temper: 245,
            right_nozzle_target_temper: 245,
            left_nozzle_temper: 53,
            left_nozzle_target_temper: 40,
        });
    });

    it('ignores unknown extruders and invalid values', () => {
        expect(
            decodeH2NozzleTemperatures([
                { id: 2, temp: 123 },
                { id: 0, temp: '123' },
            ]),
        ).to.deep.equal({});
        expect(decodeH2NozzleTemperatures(undefined)).to.deep.equal({});
    });

    it('decodes live H2C chamber target and current temperatures', () => {
        // Observed on an H2C: 0x0041003c = target 65 °C, current 60 °C.
        expect(decodeH2TemperatureWord(0x0041003c)).to.deep.equal({ current: 60, target: 65 });
        expect(decodeH2ChamberTemperatures(0x0041003c)).to.deep.equal({
            chamber_temper: 60,
            chamber_target_temper: 65,
        });
    });

    it('rejects invalid or implausible packed temperature words', () => {
        expect(decodeH2TemperatureWord('4259900')).to.equal(null);
        expect(decodeH2TemperatureWord(0x0200003c)).to.equal(null);
        expect(decodeH2ChamberTemperatures(undefined)).to.deep.equal({});
    });
});
