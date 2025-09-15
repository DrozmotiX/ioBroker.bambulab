const { expect } = require('chai');

// Mock adapter and dependencies for testing type conversion
let mockAdapter;
let jsonExplorer;
let stateAttr;

describe('Type Conversion Tests', () => {
    before(() => {
        // Mock adapter
        mockAdapter = {
            log: {
                silly: () => {},
                debug: () => {},
                info: () => {},
                warn: () => {},
                error: () => {}
            },
            FORBIDDEN_CHARS: /[\]\[*,;'"`<>\\?]/g,
            setObjectAsync: async () => {},
            extendObjectAsync: async () => {},
            getObjectAsync: async () => null,
            setStateAsync: async () => {},
            subscribeStates: () => {},
            createdStatesDetails: {}
        };

        // Load the real modules
        jsonExplorer = require('../node_modules/iobroker-jsonexplorer/jsonExplorer');
        stateAttr = require('../lib/state_attr');
        jsonExplorer.init(mockAdapter, stateAttr);
    });

    describe('JsonExplorer modify function', () => {
        it('should convert string to integer using TOINTEGER', () => {
            const jsonExplorerModule = require('../node_modules/iobroker-jsonexplorer/jsonExplorer');
            // Access the private modify function through reflection
            const modifyFunction = jsonExplorerModule.__proto__.constructor.prototype.modify;
            if (modifyFunction) {
                const result = modifyFunction('TOINTEGER', '42');
                expect(result).to.equal(42);
                expect(typeof result).to.equal('number');
            }
        });

        it('should convert string to float using TOFLOAT', () => {
            const jsonExplorerModule = require('../node_modules/iobroker-jsonexplorer/jsonExplorer');
            // Access the private modify function through reflection
            const modifyFunction = jsonExplorerModule.__proto__.constructor.prototype.modify;
            if (modifyFunction) {
                const result = modifyFunction('TOFLOAT', '42.5');
                expect(result).to.equal(42.5);
                expect(typeof result).to.equal('number');
            }
        });
    });

    describe('State attribute definitions', () => {
        it('should have proper modify attributes for fan speed states', () => {
            expect(stateAttr.heatbreak_fan_speed).to.exist;
            expect(stateAttr.heatbreak_fan_speed.modify).to.be.an('array');
            expect(stateAttr.heatbreak_fan_speed.type).to.equal('number');
            
            expect(stateAttr.cooling_fan_speed).to.exist;
            expect(stateAttr.cooling_fan_speed.modify).to.be.an('array');
            expect(stateAttr.cooling_fan_speed.type).to.equal('number');
        });

        it('should not have any states using deprecated tonumber modifier', () => {
            // Check that no states use the deprecated 'tonumber' modifier
            const problematicStates = [];
            Object.keys(stateAttr).forEach(key => {
                const attr = stateAttr[key];
                if (attr.modify && Array.isArray(attr.modify) && attr.modify.includes('tonumber')) {
                    problematicStates.push(key);
                }
            });
            
            expect(problematicStates).to.have.lengthOf(0, `States still using deprecated 'tonumber': ${problematicStates.join(', ')}`);
        });

        it('should use proper conversion methods for number types', () => {
            // Check specific states mentioned in the issue have proper converters
            expect(stateAttr.heatbreak_fan_speed.modify).to.include('TOINTEGER');
            expect(stateAttr.cooling_fan_speed.modify).to.include('TOINTEGER'); 
            expect(stateAttr.nozzle_temper.modify).to.include('TOFLOAT');
            expect(stateAttr.bed_temper.modify).to.include('TOFLOAT');
        });
    });
});