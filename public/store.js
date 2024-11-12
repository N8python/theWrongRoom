/**
 * @typedef {Object} GameState
 * @property {Object} purchasedUpgrades
 * @property {number[]} purchasedUpgrades.informational_upgrades
 * @property {number[]} purchasedUpgrades.passive_interrogation_upgrades
 * @property {number[]} purchasedUpgrades.active_interrogation_upgrades
 * @property {Set<string>} purchasedUpgradeIds
 */

/** @type {GameState} */
const DEFAULT_STATE = {
    purchasedUpgrades: {
        informational_upgrades: [],
        passive_interrogation_upgrades: [],
        active_interrogation_upgrades: []
    },
    purchasedUpgradeIds: new Set()
};

// Current version of the state schema
const STATE_VERSION = 1;

/**
 * Validates the structure of loaded state
 * @param {any} state
 * @returns {boolean}
 */
function isValidState(state) {
    if (!state || typeof state !== 'object') return false;
    
    const hasValidUpgrades = state.purchasedUpgrades 
        && Array.isArray(state.purchasedUpgrades.informational_upgrades)
        && Array.isArray(state.purchasedUpgrades.passive_interrogation_upgrades)
        && Array.isArray(state.purchasedUpgrades.active_interrogation_upgrades);

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

// Initialize global store
window.gameStore = {...DEFAULT_STATE};

// Load saved state
try {
    const saved = localStorage.getItem('gameStore');
    if (saved) {
        const parsed = JSON.parse(saved);
        
        if (isValidState(parsed)) {
            const migrated = migrateState(parsed);
            
            // Reconstruct Set since JSON doesn't preserve Set type
            migrated.purchasedUpgradeIds = new Set(
                Array.isArray(parsed.purchasedUpgradeIds) 
                    ? parsed.purchasedUpgradeIds 
                    : []
            );
            
            window.gameStore = migrated;
        } else {
            console.warn('Invalid saved state found, using defaults');
        }
    }
} catch (e) {
    console.error('Failed to load game state:', e);
}

// Add keyboard shortcut to clear localStorage
document.addEventListener('keydown', (e) => {
    if (e.metaKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        localStorage.clear();
        console.log('localStorage cleared');
        window.location.reload();
    }
});

/**
 * Saves current game state to localStorage
 * @throws {Error} If serialization or storage fails
 */
export function saveGameState() {
    try {
        const serialized = JSON.stringify({
            ...window.gameStore,
            purchasedUpgradeIds: Array.from(window.gameStore.purchasedUpgradeIds),
            version: STATE_VERSION
        });
        
        localStorage.setItem('gameStore', serialized);
    } catch (e) {
        console.error('Failed to save game state:', e);
        throw e; // Re-throw to allow caller to handle
    }
}

