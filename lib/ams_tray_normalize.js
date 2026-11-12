'use strict';

/**
 * GitHub #204: Leerer AMS-Slot kommt oft nur als { "id": "2" } per MQTT.
 * Ohne Nachbearbeitung bleiben alte tray_type/cols in ioBroker hängen.
 */

/** Leer-Slot: alle typischen Filament-/RFID-Felder (MQTT + jsonExplorer). */
const EMPTY_AMS_TRAY = {
    state: 0,
    remain: -1,
    remain_g: 0,
    tray_type: '',
    tray_sub_brands: '',
    tray_color: '',
    tray_weight: '0',
    tray_diameter: '0.00',
    tray_temp: '0',
    tray_time: '0',
    bed_temp_type: '0',
    bed_temp: 0,
    nozzle_temp_max: '0',
    nozzle_temp_min: '0',
    tag_uid: '0000000000000000',
    tray_id_name: '',
    tray_info_idx: '',
    tray_uuid: '00000000000000000000000000000000',
    xcam_info: '000000000000000000000000',
    // Leeres Array → jsonExplorer schreibt "[]" nicht (alte Farbe bliebe).
    cols: '',
    ctype: 0,
    cali_idx: -1,
    k: 0,
    n: 0,
    total_len: 0,
    drying_temp: '',
    drying_time: '',
    // H2D / neuere Firmware (States können schon existieren)
    ins_cyc: 0,
    fila_id: '',
    color_m: '',
    p_t: 0,
};

/**
 * @param {string} key Feldname aus MQTT
 * @returns {string|number}
 */
function defaultEmptyTrayField(key) {
    if (key === 'remain' || key === 'cali_idx') {
        return -1;
    }
    if (/^(state|ctype|k|n|total_len|remain_g|ins_cyc|p_t|bed_temp)$/.test(key)) {
        return 0;
    }
    return '';
}

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
 * Zusätzliche Keys aus altem MQTT werden neutralisiert (jsonExplorer-Update).
 *
 * @param {object} tray
 */
function applyEmptyAmsTrayDefaults(tray) {
    const id = tray.id;
    const staleKeys = Object.keys(tray).filter(k => k !== 'id');
    Object.keys(tray).forEach(k => delete tray[k]);
    Object.assign(tray, EMPTY_AMS_TRAY, { id });
    for (const key of staleKeys) {
        if (tray[key] === undefined) {
            tray[key] = defaultEmptyTrayField(key);
        }
    }
}

/**
 * Bambu liefert `ams.tray_exist_bits` als Hex-String (z. B. "1f", "2f").
 * Bit-Index: amsUnitId * 4 + trayId (pro AMS vier Slots 0–3).
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

/**
 * Nach jsonExplorer: bestehende Tray-States gezielt zurücksetzen (auch wenn MQTT nur { id } hatte).
 *
 * @param {object} adapter ioBroker-Adapterinstanz (this)
 * @param {string} serial Drucker-Seriennummer
 * @param {Array<{ unit: string, tray: string }>} clearedSlots
 */
async function syncClearedTrayStates(adapter, serial, clearedSlots) {
    if (!clearedSlots || clearedSlots.length === 0 || !serial) {
        return;
    }
    const emptyVals = { ...EMPTY_AMS_TRAY };
    const ns = adapter.namespace;
    for (const { unit, tray } of clearedSlots) {
        const base = `${serial}.ams.ams.${unit}.tray.${tray}`;
        for (const [key, val] of Object.entries(emptyVals)) {
            const stateId = `${base}.${key}`;
            try {
                if (await adapter.existsStateAsync(stateId)) {
                    await adapter.setStateAsync(stateId, { val, ack: true });
                }
            } catch (e) {
                adapter.log.debug(`AMS leer: setState ${stateId}: ${e.message}`);
            }
        }
        try {
            const view = await adapter.getObjectViewAsync('state', {
                start: `${ns}.${base}.`,
                count: 250,
            });
            const objects = view && view.objects ? view.objects : {};
            for (const fullId of Object.keys(objects)) {
                const leaf = fullId.split('.').pop();
                if (leaf === 'id') {
                    continue;
                }
                if (Object.prototype.hasOwnProperty.call(emptyVals, leaf)) {
                    continue;
                }
                const stateId = fullId.startsWith(`${ns}.`) ? fullId.slice(ns.length + 1) : fullId;
                const val = defaultEmptyTrayField(leaf);
                try {
                    await adapter.setStateAsync(stateId, { val, ack: true });
                } catch (e) {
                    adapter.log.debug(`AMS leer: setState ${stateId}: ${e.message}`);
                }
            }
        } catch (e) {
            adapter.log.debug(`AMS leer: ObjectView ${base}: ${e.message}`);
        }
    }
}

module.exports = {
    isAmsTrayEmptyFromMqtt,
    applyEmptyAmsTrayDefaults,
    isTrayOccupiedInBitmask,
    shouldClearAmsTray,
    syncClearedTrayStates,
    defaultEmptyTrayField,
    EMPTY_AMS_TRAY,
};
