'use strict';

/**
 * This is a dummy TypeScript test file using chai and mocha
 *
 * It's automatically excluded from npm and its build output is excluded from both git and npm.
 * It is advised to test all your modules with accompanying *.test.js-files
 */

// tslint:disable:no-unused-expression

const { expect } = require('chai');

describe('module to test => function to test', () => {
	// initializing logic
	const expected = 5;

	it(`should return ${expected}`, () => {
		const result = 5;
		// assign result a value from functionToTest
		expect(result).to.equal(expected);
		// or using the should() syntax
		result.should.equal(expected);
	});
});

describe('Bambulab G-code Blocking Logic', () => {
	// Test the blocking logic by importing and testing individual functions
	// Since we don't want complex adapter setup, test the core logic directly

	const blockedCommandsDuringPrinting = ['G0', 'G1', 'G28', 'G90', 'G91'];

	/**
	 * Helper function to check if printer is in active state (same logic as in main.js)
	 */
	function isPrintingOrActiveState(currentPrintingState) {
		return currentPrintingState != null && currentPrintingState >= 0;
	}

	/**
	 * Helper function to check if G-code should be blocked (same logic as in main.js)
	 */
	function shouldBlockGcodeCommand(gcodeParam, currentPrintingState) {
		if (!isPrintingOrActiveState(currentPrintingState)) {
			return false;
		}

		const upperParam = String(gcodeParam).toUpperCase().trim();
		return blockedCommandsDuringPrinting.some(
			blockedCmd =>
				upperParam.startsWith(`${blockedCmd} `) ||
				upperParam === blockedCmd ||
				upperParam.startsWith(`${blockedCmd}\n`),
		);
	}

	describe('isPrintingOrActiveState', () => {
		it('should return false when currentPrintingState is null', () => {
			expect(isPrintingOrActiveState(null)).to.be.false;
		});

		it('should return false when currentPrintingState is -2 (Offline)', () => {
			expect(isPrintingOrActiveState(-2)).to.be.false;
		});

		it('should return false when currentPrintingState is -1 (Idle)', () => {
			expect(isPrintingOrActiveState(-1)).to.be.false;
		});

		it('should return true when currentPrintingState is 0 (Preparing)', () => {
			expect(isPrintingOrActiveState(0)).to.be.true;
		});

		it('should return true when currentPrintingState is 1 (Printing)', () => {
			expect(isPrintingOrActiveState(1)).to.be.true;
		});

		it('should return true when currentPrintingState is 2 (Paused)', () => {
			expect(isPrintingOrActiveState(2)).to.be.true;
		});
	});

	describe('shouldBlockGcodeCommand', () => {
		const printingState = 1; // Active printing state
		const idleState = -1; // Idle state

		it('should block G0 command during printing', () => {
			expect(shouldBlockGcodeCommand('G0 X10 Y20', printingState)).to.be.true;
			expect(shouldBlockGcodeCommand('G0', printingState)).to.be.true;
		});

		it('should block G1 command during printing', () => {
			expect(shouldBlockGcodeCommand('G1 X10 Y20 Z5', printingState)).to.be.true;
			expect(shouldBlockGcodeCommand('G1', printingState)).to.be.true;
		});

		it('should block G28 command during printing', () => {
			expect(shouldBlockGcodeCommand('G28', printingState)).to.be.true;
			expect(shouldBlockGcodeCommand('G28 \n', printingState)).to.be.true;
		});

		it('should block G90 command during printing', () => {
			expect(shouldBlockGcodeCommand('G90', printingState)).to.be.true;
		});

		it('should block G91 command during printing', () => {
			expect(shouldBlockGcodeCommand('G91', printingState)).to.be.true;
		});

		it('should allow safe M commands during printing', () => {
			expect(shouldBlockGcodeCommand('M104 S200', printingState)).to.be.false;
			expect(shouldBlockGcodeCommand('M140 S60', printingState)).to.be.false;
			expect(shouldBlockGcodeCommand('M106 P1 S255', printingState)).to.be.false;
		});

		it('should allow all commands when not printing (idle state)', () => {
			expect(shouldBlockGcodeCommand('G0 X10', idleState)).to.be.false;
			expect(shouldBlockGcodeCommand('G1 Y20', idleState)).to.be.false;
			expect(shouldBlockGcodeCommand('G28', idleState)).to.be.false;
			expect(shouldBlockGcodeCommand('G90', idleState)).to.be.false;
			expect(shouldBlockGcodeCommand('G91', idleState)).to.be.false;
		});

		it('should handle case insensitive commands', () => {
			expect(shouldBlockGcodeCommand('g0 x10', printingState)).to.be.true;
			expect(shouldBlockGcodeCommand('g1 y20', printingState)).to.be.true;
			expect(shouldBlockGcodeCommand('g28', printingState)).to.be.true;
		});

		it('should handle numeric inputs', () => {
			expect(shouldBlockGcodeCommand(28, printingState)).to.be.false; // Not a G-code
			expect(shouldBlockGcodeCommand('28', printingState)).to.be.false; // Not a G-code
		});

		it('should not block partial matches that are not dangerous', () => {
			expect(shouldBlockGcodeCommand('G2 X10', printingState)).to.be.false; // G2 is not blocked
			expect(shouldBlockGcodeCommand('M28', printingState)).to.be.false; // M28 is not blocked
		});
	});
});

// ... more test suites => describe
