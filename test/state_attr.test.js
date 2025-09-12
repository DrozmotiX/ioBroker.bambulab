const { expect } = require('chai');
const stateAttr = require('../lib/state_attr.js');

describe('State Attributes Type Compatibility', () => {
    it('should handle mixed types for id field', () => {
        const idAttr = stateAttr.id;
        expect(idAttr).to.exist;
        expect(idAttr.type).to.equal('mixed');
        expect(idAttr.role).to.equal('state');
    });

    it('should handle mixed types for info field', () => {
        const infoAttr = stateAttr.info;
        expect(infoAttr).to.exist;
        expect(infoAttr.type).to.equal('mixed');
        expect(infoAttr.role).to.equal('state');
    });

    it('should have key state attributes for device functionality', () => {
        // Test some of the newly added state attributes
        expect(stateAttr.dry_time).to.exist;
        expect(stateAttr.dry_time.type).to.equal('number');
        expect(stateAttr.dry_time.unit).to.equal('min');

        expect(stateAttr.state).to.exist;
        expect(stateAttr.state.type).to.equal('number');

        expect(stateAttr.diameter).to.exist;
        expect(stateAttr.diameter.type).to.equal('number');
        expect(stateAttr.diameter.unit).to.equal('mm');

        expect(stateAttr.color).to.exist;
        expect(stateAttr.color.type).to.equal('string');
    });

    it('should have printer-specific attributes', () => {
        expect(stateAttr.aux).to.exist;
        expect(stateAttr.aux.type).to.equal('string');

        expect(stateAttr.canvas_id).to.exist;
        expect(stateAttr.canvas_id.type).to.equal('number');

        expect(stateAttr.design_id).to.exist;
        expect(stateAttr.design_id.type).to.equal('string');
    });
});