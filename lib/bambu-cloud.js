'use strict';

/**
 * Bambu Lab Cloud (Login + MQTT-Broker-Parameter).
 *
 * Warum diese Datei?
 * - LAN: Drucker-IP + LAN-Token am Gerät.
 * - Cloud: Bambu-Konto → Access-Token → MQTT (Drucker darf im normalen Cloud-Modus bleiben).
 *
 * Login-Wege (Cloud):
 * 1) Gespeichertes cloudAccessToken (JWT)
 * 2) E-Mail + Passwort (wenn du in der App ein Bambu-Passwort gesetzt hast)
 * 3) E-Mail + 6-stelliger Code (typisch bei Google/OAuth – ohne Bambu-Passwort)
 */

const { default: axios } = require('axios');

/** API-Endpunkte (Global vs. China). */
const URLS = {
    global: {
        login: 'https://api.bambulab.com/v1/user-service/user/login',
        emailCode: 'https://api.bambulab.com/v1/user-service/user/sendemail/code',
        preference: 'https://api.bambulab.com/v1/design-user-service/my/preference',
        mqttHost: 'us.mqtt.bambulab.com',
    },
    china: {
        login: 'https://api.bambulab.cn/v1/user-service/user/login',
        emailCode: 'https://api.bambulab.cn/v1/user-service/user/sendemail/code',
        preference: 'https://api.bambulab.cn/v1/design-user-service/my/preference',
        mqttHost: 'cn.mqtt.bambulab.com',
    },
};

/** Mindestabstand zwischen E-Mail-Code-Anforderungen (Bambu + Postfach). Erneut senden: Button cloudRequestEmailCode. */
const EMAIL_CODE_COOLDOWN_MS = 3 * 60 * 1000;

/** Header wie Bambu Studio/Orca – sonst blockiert die API Anfragen oft. */
function slicerHeaders() {
    return {
        'User-Agent': 'bambu_network_agent/01.09.05.01',
        'X-BBL-Client-Name': 'OrcaSlicer',
        'X-BBL-Client-Type': 'slicer',
        'X-BBL-Client-Version': '01.09.05.51',
        'X-BBL-Language': 'en-US',
        accept: 'application/json',
        'Content-Type': 'application/json',
    };
}

function regionKey(region) {
    return region === 'china' ? 'china' : 'global';
}

class BambuCloudAuthError extends Error {
    constructor(message, code, extra = {}) {
        super(message);
        this.name = 'BambuCloudAuthError';
        this.code = code;
        Object.assign(this, extra);
    }
}

/** Bambu-MQTT-User ist immer u_<Ziffern> – auch aus reiner User-ID bauen. */
function normalizeMqttUsername(value) {
    if (value === undefined || value === null) {
        return null;
    }
    const s = String(value).trim();
    if (/^u_\d+$/.test(s)) {
        return s;
    }
    if (/^\d+$/.test(s)) {
        return `u_${s}`;
    }
    return null;
}

/** Manche Login-Antworten liefern uid/username direkt – spart den Preference-Aufruf. */
function mqttUsernameHintFromLoginData(data) {
    if (!data || typeof data !== 'object') {
        return null;
    }
    const direct = [data.mqttUsername, data.mqtt_username, data.username, data.userName];
    for (const field of direct) {
        const normalized = normalizeMqttUsername(field);
        if (normalized) {
            return normalized;
        }
    }
    const uid = data.uid ?? data.user_id ?? data.userId ?? data.id;
    return normalizeMqttUsername(uid);
}

function loginResultFromApiData(data) {
    const accessToken = data && data.accessToken;
    if (!accessToken) {
        return null;
    }
    return {
        accessToken,
        mqttUsernameHint: mqttUsernameHintFromLoginData(data),
    };
}

async function postJson(url, body, validate400 = false) {
    const response = await axios.post(url, body, {
        headers: slicerHeaders(),
        timeout: 30000,
        validateStatus: status => (validate400 ? status < 500 : status < 500),
    });
    return response;
}

/**
 * Bambu schickt einen 6-stelligen Code an die Konto-E-Mail (Login ohne Passwort).
 */
async function requestEmailLoginCode(email, region = 'global', log) {
    const logFn = typeof log === 'function' ? log : () => {};
    const urls = URLS[regionKey(region)];
    const body = { email, type: 'codeLogin' };
    let response;
    try {
        response = await postJson(urls.emailCode, body);
    } catch (err) {
        throw new BambuCloudAuthError(`E-Mail-Code anfordern fehlgeschlagen: ${err.message}`, 'network');
    }
    const data = response.data || {};
    if (response.status >= 400 || data.success === false) {
        throw new BambuCloudAuthError(
            `Bambu sendemail/code abgelehnt (HTTP ${response.status}): ${JSON.stringify(data).substring(0, 200)}`,
            'emailCodeFailed',
        );
    }
    logFn(
        'info',
        `Bambu API: Verifizierungs-E-Mail für ${email} ausgelöst (HTTP ${response.status}). Postfach + Spam prüfen (nur eine Mail pro Anforderung).`,
    );
}

/**
 * Login mit E-Mail + 6-stelligem Code (nach requestEmailLoginCode).
 */
async function loginWithEmailCode(email, code, region = 'global') {
    const urls = URLS[regionKey(region)];
    const body = { account: email, code: String(code).trim() };

    let response;
    try {
        response = await postJson(urls.login, body, true);
    } catch (err) {
        throw new BambuCloudAuthError(`Cloud-Login (Code) Netzwerkfehler: ${err.message}`, 'network');
    }

    const data = response.data || {};
    if (response.status === 200 && data.accessToken) {
        return loginResultFromApiData(data);
    }
    if (response.status === 400 && data.code === 2) {
        throw new BambuCloudAuthError('E-Mail-Code falsch – bitte prüfen und erneut eintragen.', 'codeIncorrect');
    }
    if (response.status === 400 && data.code === 1) {
        await requestEmailLoginCode(email, region);
        throw new BambuCloudAuthError(
            'E-Mail-Code abgelaufen – Bambu hat automatisch eine neue E-Mail geschickt. Postfach/Spam prüfen, neuen Code eintragen, speichern, Instanz neu starten.',
            'verifyCodeSent',
        );
    }

    throw new BambuCloudAuthError(
        `Cloud-Login (Code) fehlgeschlagen (HTTP ${response.status}): ${JSON.stringify(data).substring(0, 200)}`,
        'login',
    );
}

/**
 * Login mit E-Mail + Passwort (nur wenn du in der Bambu-App ein Passwort gesetzt hast).
 */
async function loginWithPassword(email, password, region = 'global') {
    const urls = URLS[regionKey(region)];
    const body = { account: email, password, apiError: '' };

    let response;
    try {
        response = await postJson(urls.login, body);
    } catch (err) {
        throw new BambuCloudAuthError(`Cloud-Login Netzwerkfehler: ${err.message}`, 'network');
    }

    const data = response.data || {};

    const loginResult = loginResultFromApiData(data);
    if (loginResult) {
        return loginResult;
    }

    const loginType = data.loginType;
    if (loginType === 'verifyCode') {
        await requestEmailLoginCode(email, region);
        throw new BambuCloudAuthError(
            'Bambu verlangt E-Mail-Code: Code wurde angefordert. Trage ihn unter „Cloud E-Mail verification code“ ein, speichern, Adapter neu starten.',
            'verifyCodeSent',
        );
    }
    if (loginType === 'tfa') {
        throw new BambuCloudAuthError(
            'Bambu verlangt 2FA für dieses Konto – im Adapter noch nicht unterstützt. Workaround: E-Mail-Code-Login (Google/OAuth) oder in der Bambu-App 2FA vorübergehend deaktivieren und Passwort-Login nutzen.',
            'tfa',
        );
    }

    throw new BambuCloudAuthError(
        `Cloud-Login fehlgeschlagen (HTTP ${response.status}): ${JSON.stringify(data).substring(0, 200)}`,
        'login',
    );
}

function decodeJwtPayload(accessToken) {
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
        return null;
    }
    try {
        let payload = parts[1];
        payload += '='.repeat((4 - (payload.length % 4)) % 4);
        return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    } catch {
        return null;
    }
}

/** JWT abgelaufen? (kleine Toleranz gegen Uhr-Abweichung) */
function isAccessTokenExpired(accessToken) {
    const json = decodeJwtPayload(accessToken);
    if (!json || json.exp == null) {
        return false;
    }
    return Date.now() / 1000 > Number(json.exp) - 30;
}

/**
 * Tage bis JWT abläuft (null = kein exp im Token, 0 = abgelaufen).
 * Für Log-Hinweis vor Phase-3-Re-Login – kein automatischer Refresh (Bambu-API unklar).
 */
function accessTokenDaysUntilExpiry(accessToken) {
    const json = decodeJwtPayload(accessToken);
    if (!json || json.exp == null) {
        return null;
    }
    const secLeft = Number(json.exp) - Date.now() / 1000;
    if (secLeft <= 0) {
        return 0;
    }
    return Math.ceil(secLeft / 86400);
}

/**
 * MQTT-User u_<id> aus JWT – neuere Bambu-Tokens haben oft user_id statt username.
 * Preference-API ist Fallback (kann 401 liefern, obwohl MQTT noch ging).
 */
/**
 * MQTT-User u_<id> aus JWT (wie Home Assistant pybambu).
 * Viele Tokens haben nur username; neuere manchmal uid / user_id.
 */
function mqttUsernameFromJwt(accessToken) {
    const json = decodeJwtPayload(accessToken);
    if (!json) {
        return null;
    }
    if (typeof json.username === 'string') {
        const fromName = normalizeMqttUsername(json.username);
        if (fromName) {
            return fromName;
        }
    }
    if (typeof json.sub === 'string') {
        const fromSub = normalizeMqttUsername(json.sub);
        if (fromSub) {
            return fromSub;
        }
    }
    const uid = json.uid ?? json.user_id ?? json.userId ?? json.id;
    return normalizeMqttUsername(uid);
}

/** Gespeicherter MQTT-User aus letztem erfolgreichen Login (Preference-API liefert nach Neustart oft 401). */
function storedMqttUsername(config) {
    const u = (config && config.cloudMqttUsername) || '';
    const trimmed = String(u).trim();
    return /^u_\d+$/.test(trimmed) ? trimmed : null;
}

function cloudUserIdFromMqttUsername(username) {
    if (typeof username === 'string' && /^u_\d+$/.test(username)) {
        return username.replace(/^u_/, '');
    }
    return null;
}

async function fetchMqttUsernameFromPreference(accessToken, region = 'global') {
    const urls = URLS[regionKey(region)];
    let response;
    try {
        response = await axios.get(urls.preference, {
            headers: {
                ...slicerHeaders(),
                Authorization: `Bearer ${accessToken}`,
            },
            timeout: 30000,
            validateStatus: status => status < 500,
        });
    } catch (err) {
        throw new BambuCloudAuthError(`Preference-API Netzwerkfehler: ${err.message}`, 'network');
    }

    if (response.status === 401 || response.status === 403) {
        // Login kann ok sein – nur diese Zusatz-API blockiert (Docker/WAF). Nicht als „Token ungültig“ melden.
        throw new BambuCloudAuthError(
            `Bambu Zusatz-API (Preference) abgelehnt (HTTP ${response.status}). Login-Token kann trotzdem gültig sein. ` +
                'MQTT-Benutzer aus MQTTX (Feld „Username“, z. B. u_1234567890) unter „Cloud MQTT username“ eintragen, speichern, Instanz neu starten.',
            'preferenceFailed',
        );
    }
    if (response.status !== 200) {
        throw new BambuCloudAuthError(
            `Preference-API fehlgeschlagen (HTTP ${response.status})`,
            'uid',
        );
    }

    const uid = response.data && response.data.uid;
    if (uid === undefined || uid === null) {
        throw new BambuCloudAuthError('Cloud: user id (uid) aus Preference-API nicht lesbar', 'uid');
    }
    return `u_${uid}`;
}

async function resolveCloudMqttUsername(accessToken, region = 'global', config = {}, loginMqttUsernameHint = null) {
    const fromJwt = mqttUsernameFromJwt(accessToken);
    if (fromJwt) {
        return fromJwt;
    }
    const fromLogin = normalizeMqttUsername(loginMqttUsernameHint);
    if (fromLogin) {
        return fromLogin;
    }
    const fromStore = storedMqttUsername(config);
    if (fromStore) {
        return fromStore;
    }
    const storedUid = (config.cloudUserId || '').trim();
    if (/^\d+$/.test(storedUid)) {
        return `u_${storedUid}`;
    }
    return fetchMqttUsernameFromPreference(accessToken, region);
}

/**
 * Numerische Bambu-user_id für MQTT-Befehle (pushall).
 */
async function resolveCloudUserId(accessToken, region = 'global', config = {}, mqttUsername = null) {
    const fromJwt = cloudUserIdFromMqttUsername(mqttUsernameFromJwt(accessToken));
    if (fromJwt) {
        return fromJwt;
    }
    const storedUid = (config.cloudUserId || '').trim();
    if (storedUid && /^\d+$/.test(storedUid)) {
        return storedUid;
    }
    const fromUser = cloudUserIdFromMqttUsername(mqttUsername || storedMqttUsername(config));
    if (fromUser) {
        return fromUser;
    }
    const username = mqttUsername || (await resolveCloudMqttUsername(accessToken, region, config));
    return cloudUserIdFromMqttUsername(username);
}

/**
 * Cloud-MQTT-Verbindung vorbereiten (Login + Broker-URL).
 */
async function buildCloudMqttConnect(config, log) {
    const region = config.cloudRegion || 'global';
    const email = (config.cloudEmail || '').trim();
    const loginMethod = config.cloudLoginMethod || 'emailCode';
    let accessToken = (config.cloudAccessToken || '').trim();
    const verifyCode = (config.cloudVerifyCode || '').trim();
    let loginMqttUsernameHint = null;

    if (accessToken && isAccessTokenExpired(accessToken)) {
        log('warn', 'Gespeichertes Cloud Access Token ist abgelaufen (JWT exp).');
        throw new BambuCloudAuthError(
            'Cloud Access Token abgelaufen (JWT abgelaufen) – Feld „Cloud access token“ leeren, speichern, Instanz neu starten (E-Mail-Code).',
            'tokenInvalid',
        );
    }

    if (!accessToken) {
        if (!email) {
            throw new BambuCloudAuthError('Cloud: Bambu-E-Mail (cloudEmail) fehlt', 'config');
        }

        if (verifyCode) {
            log('info', 'Cloud-Login mit E-Mail-Bestätigungscode…');
            const loginResult = await loginWithEmailCode(email, verifyCode, region);
            accessToken = loginResult.accessToken;
            loginMqttUsernameHint = loginResult.mqttUsernameHint;
            log('info', 'Cloud-Login (E-Mail-Code) erfolgreich');
        } else if (loginMethod === 'password') {
            const password = config.cloudPassword || '';
            if (!password) {
                throw new BambuCloudAuthError(
                    'Cloud Login-Methode „Passwort“: Bambu-Passwort fehlt (in App unter Kontosicherheit setzen, nicht Google-Passwort).',
                    'config',
                );
            }
            log('info', 'Cloud-Login bei Bambu (Passwort wird nicht geloggt)…');
            try {
                const loginResult = await loginWithPassword(email, password, region);
                accessToken = loginResult.accessToken;
                loginMqttUsernameHint = loginResult.mqttUsernameHint;
            } catch (err) {
                if (err instanceof BambuCloudAuthError && err.code === 'verifyCodeSent') {
                    log('warn', err.message);
                }
                throw err;
            }
            log('info', 'Cloud-Login (Passwort) erfolgreich');
        } else {
            // emailCode: Standard für Google/OAuth – kein Passwort nötig
            const lastRequest = Number(config.cloudEmailCodeRequestedAt) || 0;
            if (
                !config.forceCloudEmailCodeRequest &&
                lastRequest &&
                Date.now() - lastRequest < EMAIL_CODE_COOLDOWN_MS
            ) {
                const waitMin = Math.ceil((EMAIL_CODE_COOLDOWN_MS - (Date.now() - lastRequest)) / 60000);
                throw new BambuCloudAuthError(
                    `Vor kurzem wurde bereits eine Bambu-Mail ausgelöst – zuerst Postfach/Spam prüfen und den letzten Code eintragen (speichern, neu starten). Neue Mail erst nach ${waitMin} Min. oder über State „Cloud: E-Mail-Code erneut anfordern“ (bambulab.0.control.cloudRequestEmailCode).`,
                    'verifyCodePending',
                );
            }
            log('info', `Fordere Bambu E-Mail-Logincode für ${email} an…`);
            await requestEmailLoginCode(email, region, log);
            throw new BambuCloudAuthError(
                'E-Mail mit 6-stelligem Code wurde angefordert. Postfach und Spam prüfen. Code unter „Cloud E-Mail verification code“ eintragen, speichern, bambulab.0 neu starten. Keine zweite Mail, bis der Code abgelaufen ist oder „E-Mail-Code erneut anfordern“ gedrückt wurde.',
                'verifyCodeSent',
            );
        }
    }

    let username;
    try {
        username = await resolveCloudMqttUsername(accessToken, region, config, loginMqttUsernameHint);
    } catch (err) {
        // Frisch eingeloggtes Token mitgeben – main.js kann es speichern, ohne erneuten E-Mail-Code.
        if (err instanceof BambuCloudAuthError && err.code === 'preferenceFailed') {
            throw new BambuCloudAuthError(err.message, 'preferenceFailed', {
                cloudAccessTokenFromLogin: accessToken,
            });
        }
        throw err;
    }
    const host = URLS[regionKey(region)].mqttHost;

    const cloudUserId = await resolveCloudUserId(accessToken, region, config, username);

    return {
        url: `mqtts://${host}:8883`,
        options: {
            username,
            password: accessToken,
            reconnectPeriod: 30,
            rejectUnauthorized: true,
        },
        accessToken,
        cloudUserId,
        mqttUsername: username,
    };
}

function buildLanMqttConnect(config) {
    const host = (config.host || '').trim();
    if (!host) {
        throw new Error('LAN-Modus: Drucker-IP (host) fehlt');
    }
    return {
        url: `mqtts://${host}:8883`,
        options: {
            username: 'bblp',
            password: config.Password,
            reconnectPeriod: 30,
            rejectUnauthorized: false,
        },
    };
}

async function buildMqttConnect(config, log) {
    const mode = config.connectionMode || 'lan';
    if (mode === 'cloud') {
        return buildCloudMqttConnect(config, log);
    }
    return buildLanMqttConnect(config);
}

module.exports = {
    BambuCloudAuthError,
    buildMqttConnect,
    buildCloudMqttConnect,
    buildLanMqttConnect,
    loginWithPassword,
    loginWithEmailCode,
    requestEmailLoginCode,
    resolveCloudUserId,
    isAccessTokenExpired,
    accessTokenDaysUntilExpiry,
    normalizeMqttUsername,
    mqttUsernameFromJwt,
    mqttUsernameHintFromLoginData,
    resolveCloudMqttUsername,
};
