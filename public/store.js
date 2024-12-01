/**
 * @typedef {Object} GameState
 * @property {Object} purchasedUpgrades
 * @property {number[]} purchasedUpgrades.informational_upgrades
 * @property {number[]} purchasedUpgrades.passive_interrogation_upgrades
 * @property {number[]} purchasedUpgrades.active_interrogation_upgrades
 * @property {Set<string>} purchasedUpgradeIds
 * @property {number} notes
 * @property {Set<string>} viewedDialogues
 * @property {number} unlockedLevel
 * @property {Object} settings
 * @property {boolean} settings.tts
 * @property {boolean} settings.whisper
 * @property {boolean} settings.gameAudio
 */

/** @type {GameState} */
const DEFAULT_STATE = {
    purchasedUpgrades: {
        informational_upgrades: [],
        passive_interrogation_upgrades: [],
        active_interrogation_upgrades: []
    },
    purchasedUpgradeIds: new Set(),
    notes: 0,
    viewedDialogues: new Set(),
    unlockedLevel: 1,
    settings: {
        tts: true,
        whisper: true,
        gameAudio: true
    }
};

// Current version of the state schema
const STATE_VERSION = 1;

// Get the server URL from the current window location
const SERVER_URL = window.location.origin;
const GAME_STATE_KEY = 'gameState';

/**
 * Validates the structure of loaded state
 * @param {any} state
 * @returns {boolean}
 */
function isValidState(state) {
    if (!state || typeof state !== 'object') return false;

    const hasValidUpgrades = state.purchasedUpgrades &&
        Array.isArray(state.purchasedUpgrades.informational_upgrades) &&
        Array.isArray(state.purchasedUpgrades.passive_interrogation_upgrades) &&
        Array.isArray(state.purchasedUpgrades.active_interrogation_upgrades);

    return hasValidUpgrades;
}

/**
 * Migrates old state versions to current version
 * @param {any} state
 * @returns {GameState}
 */
function migrateState(state) {
    // Add migration logic here when schema changes
    return state;
}

/**
 * Saves current game state to server
 * @throws {Error} If serialization or storage fails
 */
export async function saveGameState() {
    try {
        const serialized = {
            ...window.gameStore,
            purchasedUpgradeIds: Array.from(window.gameStore.purchasedUpgradeIds),
            viewedDialogues: Array.from(window.gameStore.viewedDialogues),
            version: STATE_VERSION
        };

        const response = await fetch(`${SERVER_URL}/data/${GAME_STATE_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(serialized)
        });

        if (!response.ok) {
            throw new Error(`Failed to save game state: ${response.statusText}`);
        }
    } catch (e) {
        console.error('Failed to save game state:', e);
        throw e;
    }
}

/**
 * Loads game state from server
 * @returns {Promise<GameState|null>}
 */
async function loadGameState() {
    try {
        const response = await fetch(`${SERVER_URL}/data/${GAME_STATE_KEY}`);

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`Failed to load game state: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data;
    } catch (e) {
        console.error('Failed to load game state:', e);
        return null;
    }
}

/**
 * Clears game state from server
 */
async function clearGameState() {
    try {
        await fetch(`${SERVER_URL}/data/${GAME_STATE_KEY}`, {
            method: 'DELETE'
        });
    } catch (e) {
        console.error('Failed to clear game state:', e);
    }
}

/**
 * Initializes the global game store and sets up event listeners
 * @returns {Promise<GameState>} The initialized game state
 */
export async function initializeGameStore() {
    // Initialize with default state
    window.gameStore = {...DEFAULT_STATE };

    // Load saved state
    try {
        const saved = await loadGameState();

        if (saved && isValidState(saved)) {
            const migrated = migrateState(saved);

            // Reconstruct Sets since JSON doesn't preserve Set type
            migrated.purchasedUpgradeIds = new Set(
                Array.isArray(saved.purchasedUpgradeIds) ?
                saved.purchasedUpgradeIds : []
            );

            migrated.viewedDialogues = new Set(
                Array.isArray(saved.viewedDialogues) ?
                saved.viewedDialogues : []
            );

            // Copy over common keys
            for (const key in migrated) {
                window.gameStore[key] = migrated[key];
            }
        } else if (saved) {
            console.warn('Invalid saved state found, using defaults');
        }
    } catch (e) {
        console.error('Failed to load game state:', e);
    }

    // Add keyboard shortcut to clear server state
    document.addEventListener('keydown', async(e) => {
        if (e.metaKey && e.key.toLowerCase() === 'l') {
            e.preventDefault();
            await clearGameState();
            console.log('Game state cleared');
            window.location.reload();
        }
    });

    // Add cheat code handler
    /*document.addEventListener('keydown', async(e) => {
        if (e.metaKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            window.gameStore.notes = 999;
            document.getElementById('notes-count').textContent = '999';
            saveGameState();
            console.log('Cheat activated: 999 notes');
        }
    });*/

    window.TTS = window.gameStore.settings.tts;
    return window.gameStore;
}