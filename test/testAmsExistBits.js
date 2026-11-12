const { expect } = require('chai');

/**
 * Dokumentation: ams_exist_bits ist eine Bitmaske (hex als String).
 * 1 = nur AMS 0, 3 = AMS 0 + 1 (z. B. zwei AMS 2 Pro am H2D).
 */
function shouldRunAmsHandler(amsBlock) {
    const amsUnits = amsBlock && amsBlock.ams;
    if (Array.isArray(amsUnits)) {
        return amsUnits.length > 0;
    }
    return amsUnits != null && typeof amsUnits === 'object';
}

describe('AMS exist_bits / mehrere Einheiten', () => {
    it('zwei AMS: bits „3“, Liste nicht leer → Handler ja', () => {
        const block = { ams_exist_bits: '3', ams: [{ id: '0' }, { id: '1' }] };
        expect(shouldRunAmsHandler(block)).to.equal(true);
    });

    it('ein AMS: bits „1“', () => {
        expect(shouldRunAmsHandler({ ams_exist_bits: '1', ams: [{ id: '0' }] })).to.equal(true);
    });

    it('kein AMS in JSON', () => {
        expect(shouldRunAmsHandler({ ams_exist_bits: '0', ams: [] })).to.equal(false);
    });
});
