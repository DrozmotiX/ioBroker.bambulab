'use strict';

/**
 * Bambu MQTT liefert dieselben Felder mal als Zahl, mal als String (v. a. H2D).
 * ioBroker prüft den Datentyp der States – falscher Typ = info-Spam im Log.
 * Diese Hilfe läuft direkt vor jsonExplorer, damit die Werte passen.
 */

/**
 * err2.err_code: State-Metadaten oft „number“, H2D sendet teils String.
 *
 * @param {unknown} value Roher MQTT-Wert
 * @returns {unknown} Wert für setState (Zahl wenn möglich, sonst unverändert)
 */
function coerceErrCode(value) {
    if (value == null) {
        return value;
    }
    if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') {
            return value;
        }
        const n = Number(trimmed);
        if (!Number.isNaN(n)) {
            return n;
        }
    }
    return value;
}

/**
 * device.nozzle.tar_id: State oft „string“, MQTT sendet teils Zahl.
 *
 * @param {unknown} value Roher MQTT-Wert
 * @returns {unknown} String für ioBroker-State
 */
function coerceTarId(value) {
    if (value == null) {
        return value;
    }
    if (typeof value === 'string') {
        return value;
    }
    return String(value);
}

/**
 * Normalisiert bekannte Problemfelder im print-JSON (ein Durchlauf pro MQTT-Nachricht).
 *
 * @param {object} [print] message.print aus dem Drucker-Report
 */
function coerceMqttPrintTypes(print) {
    if (!print || typeof print !== 'object') {
        return;
    }

    if (print.err2 && print.err2.err_code != null) {
        print.err2.err_code = coerceErrCode(print.err2.err_code);
    }

    const nozzle = print.device && print.device.nozzle;
    if (nozzle && nozzle.tar_id != null) {
        nozzle.tar_id = coerceTarId(nozzle.tar_id);
    }
}

module.exports = {
    coerceErrCode,
    coerceTarId,
    coerceMqttPrintTypes,
};
