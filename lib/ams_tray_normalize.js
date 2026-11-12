'use strict';

/**
 * GitHub #204: Leerer AMS-Slot kommt oft nur als { "id": "2" } per MQTT.
 * Ohne Nachbearbeitung bleiben alte tray_type/cols in ioBroker hängen.
 */

/** Leer-Slot wie vt_tray / Debug-Log in Issue #204 – Werte werden in bestehende States geschrieben. */
const EMPTY_AMS_TRAY = {
    state: 0,
    remain: -1,
    tray_type: '',
    tray_sub_brands: '',
    tray_color: 'FFFFFF00',
    tray_weight: '0',
    tray_diameter: '0.00',
    tray_temp: '0',
    tray_time: '0',
    bed_temp_type: '0',
    bed_temp: '0',
    nozzle_temp_max: '0',
    nozzle_temp_min: '0',
    tag_uid: '0000000000000000',
    tray_id_name: '',
    tray_info_idx: '',
    tray_uuid: '00000000000000000000000000000000',
    xcam_info: '000000000000000000000000',
    // Leeres Array würde als "[]" stringified – jsonExplorer überspringt genau das (alte Farbe bliebe).
    cols: '',
    ctype: 0,
    cali_idx: -1,
    k: 0,
    n: 0,
    total_len: 0,
    drying_temp: '',
    drying_time: '',
    remain_g: 0,
};

/**
 * Nur id (oder id ohne Filament-Felder) = Slot leer laut Bambu-MQTT.
 *
 * @param {object} tray Eintrag aus ams.ams[n].tray[m]
 * @returns {boolean}
 */
function isAmsTrayEmptyFromMqtt(tray) {
    if (!tray || typeof tray !== 'object' || tray.id === undefined) {
        return false;
    }
    if (!tray.cols && !tray.tray_type && tray.remain === undefined && tray.state === undefined) {
        return true;
    }
    const keys = Object.keys(tray).filter(k => k !== 'id');
    return keys.length === 0;
}

/**
 * Überschreibt den Tray-Eintrag mit Leer-Defaults, id bleibt erhalten.
 *
 * @param {object} tray
 */
function applyEmptyAmsTrayDefaults(tray) {
    const id = tray.id;
    Object.keys(tray).forEach(k => delete tray[k]);
    Object.assign(tray, EMPTY_AMS_TRAY, { id });
}

/**
 * Bambu liefert `ams.tray_exist_bits` als Hex-String (z. B. "1f", "2f").
 * Bit-Index: amsUnitId * 4 + trayId (pro AMS vier Slots 0–3).
 * Beispiel H2D: nur AMS 1 Slot 2 belegt → Bit 5 gesetzt → oft "2f", Bit 4 (Slot 1) leer.
 *
 * @param {string|number} trayExistBits aus MQTT
 * @param {string|number} amsUnitId AMS-Unit (0, 1, …)
 * @param {string|number} trayId Tray im Unit (0–3)
 * @returns {boolean} true = Rolle eingesteckt
 */
function isTrayOccupiedInBitmask(trayExistBits, amsUnitId, trayId) {
    const bits = parseInt(String(trayExistBits).trim(), 16);
    if (Number.isNaN(bits)) {
        return true;
    }
    const unit = Number(amsUnitId);
    const tray = Number(trayId);
    if (Number.isNaN(unit) || Number.isNaN(tray) || tray < 0 || tray > 3 || unit < 0) {
        return true;
    }
    const index = unit * 4 + tray;
    return (bits & (1 << index)) !== 0;
}

/**
 * Leerer Slot: nur { id } ODER Bit in tray_exist_bits aus (H2D sendet manchmal trotzdem altes JSON).
 *
 * @param {object} tray
 * @param {string|number|null|undefined} trayExistBits
 * @param {string|number} amsUnitId
 */
function shouldClearAmsTray(tray, trayExistBits, amsUnitId) {
    if (isAmsTrayEmptyFromMqtt(tray)) {
        return true;
    }
    if (trayExistBits != null && String(trayExistBits).trim() !== '') {
        return !isTrayOccupiedInBitmask(trayExistBits, amsUnitId, tray.id);
    }
    return false;
}

module.exports = {
    isAmsTrayEmptyFromMqtt,
    applyEmptyAmsTrayDefaults,
    isTrayOccupiedInBitmask,
    shouldClearAmsTray,
    EMPTY_AMS_TRAY,
};
