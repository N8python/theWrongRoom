// Global store for game state
window.gameStore = {
    purchasedUpgrades: {
        informational_upgrades: [],
        passive_interrogation_upgrades: [], 
        active_interrogation_upgrades: []
    },
    // Flat dictionary to track all purchased upgrade IDs
    purchasedUpgradeIds: new Set()
};

// Load any saved state from localStorage
try {
    const saved = localStorage.getItem('gameStore');
    if (saved) {
        window.gameStore = JSON.parse(saved);
    }
} catch (e) {
    console.error('Failed to load game state:', e);
}

// Save state whenever it changes
function saveGameState() {
    try {
        localStorage.setItem('gameStore', JSON.stringify(window.gameStore));
    } catch (e) {
        console.error('Failed to save game state:', e);
    }
}
