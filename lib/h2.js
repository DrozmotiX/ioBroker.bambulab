'use strict';

/** @param {unknown} serial - Configured printer serial number. */
function canonicalizeSerial(serial) {
    return String(serial || '')
        .trim()
        .toUpperCase();
}

/** @param {Array<{id?: number, temp?: unknown}> | undefined} extruders - H2 extruder status entries. */
function decodeH2NozzleTemperatures(extruders) {
    const temperatures = {};
    if (!Array.isArray(extruders)) {
        return temperatures;
    }
    for (const extruder of extruders) {
        const temperatureWord = extruder?.temp;
        if (typeof temperatureWord !== 'number' || !Number.isInteger(temperatureWord)) {
            continue;
        }
        const side = extruder.id === 0 ? 'right' : extruder.id === 1 ? 'left' : null;
        if (side) {
            temperatures[`${side}_nozzle_temper`] = temperatureWord & 0xffff;
            temperatures[`${side}_nozzle_target_temper`] = (temperatureWord >>> 16) & 0xffff;
        }
    }
    return temperatures;
}

/**
 * H2 chamber/bed temperature words store the target in the high 16 bits and
 * the current temperature in the low 16 bits.
 *
 * @param {unknown} temperatureWord - Packed unsigned 32-bit temperature word.
 * @returns {{current: number, target: number} | null} Decoded temperatures, or null for invalid input.
 */
function decodeH2TemperatureWord(temperatureWord) {
    if (typeof temperatureWord !== 'number' || !Number.isInteger(temperatureWord)) {
        return null;
    }

    const current = temperatureWord & 0xffff;
    const target = (temperatureWord >>> 16) & 0xffff;
    // Temperatures outside the physical printer range indicate a different
    // field layout or a sentinel value and must not become ioBroker states.
    if (current > 500 || target > 500) {
        return null;
    }
    return { current, target };
}

/** @param {unknown} temperatureWord - H2 device.ctc.info.temp value. */
function decodeH2ChamberTemperatures(temperatureWord) {
    const decoded = decodeH2TemperatureWord(temperatureWord);
    return decoded
        ? {
              chamber_temper: decoded.current,
              chamber_target_temper: decoded.target,
          }
        : {};
}

module.exports = {
    canonicalizeSerial,
    decodeH2NozzleTemperatures,
    decodeH2TemperatureWord,
    decodeH2ChamberTemperatures,
};
