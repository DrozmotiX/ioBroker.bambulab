const { expect } = require('chai');
const { coerceErrCode, coerceTarId, coerceMqttPrintTypes } = require('../lib/mqtt_print_coerce.js');

describe('mqtt_print_coerce', () => {
    it('coerceErrCode: String-Zahl → number (H2D)', () => {
        expect(coerceErrCode('50348044')).to.equal(50348044);
        expect(coerceErrCode(' 12 ')).to.equal(12);
    });

    it('coerceErrCode: Zahl bleibt Zahl', () => {
        expect(coerceErrCode(99)).to.equal(99);
    });

    it('coerceTarId: Zahl → string', () => {
        expect(coerceTarId(3050174)).to.equal('3050174');
    });

    it('coerceMqttPrintTypes setzt err2 und nozzle.tar_id', () => {
        const print = {
            err2: { err_code: '42' },
            device: { nozzle: { tar_id: 7 } },
        };
        coerceMqttPrintTypes(print);
        expect(print.err2.err_code).to.equal(42);
        expect(print.device.nozzle.tar_id).to.equal('7');
    });
});
