import { UPGRADES } from './upgrades.js';
import { saveGameState } from './store.js';

export class ShopManager {
    constructor(game) {
        this.game = game;
        this.purchasedUpgrades = {
            informational: 0,
            passive: 0,
            active: 0
        };
        this.setupShopMenu();
    }

    setupShopMenu() {
        const shopMenu = document.getElementById('shop-menu');
        const openShop = document.getElementById('open-shop');
        const closeShop = document.getElementById('close-shop');

        openShop.addEventListener('click', () => {
            document.getElementById('main-menu').style.display = 'none';
            shopMenu.style.display = 'flex';
        });

        closeShop.addEventListener('click', () => {
            shopMenu.style.display = 'none';
            document.getElementById('main-menu').style.display = 'flex';
        });

        // Import upgrades
        this.populateShop();
    }

    createUpgradeElement(upgrade, type) {
        // Convert type to full upgrade type name
        const upgradeType = type === 'informational' ? 'informational_upgrades' :
            type === 'passive' ? 'passive_interrogation_upgrades' :
            'active_interrogation_upgrades';

        // Check if this upgrade is already purchased by ID
        if (upgrade && window.gameStore.purchasedUpgradeIds.has(upgrade.id)) {
            return '<div>Upgrade purchased!</div>';
        }

        if (!upgrade) return '<div>All upgrades purchased!</div>';

        return `
            <div style="flex-grow: 1; margin-right: 16px;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 18px; font-weight: bold;">${upgrade.title}</span>
                </div>
                <div style="font-size: 14px; opacity: 0.8;">${upgrade.description}</div>
            </div>
            <button class="buy-button" data-type="${type}" data-price="${upgrade.price}" 
                    style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; white-space: nowrap;"
                    ${this.game.notes < upgrade.price ? 'disabled' : ''}>
                <img src="sprites/note.png" style="width: 24px; height: 24px; image-rendering: pixelated;">
                <span>${upgrade.price}</span>
            </button>
        `;
    }

    async populateShop() {
        // Update each upgrade section
        const updateSection = (type, upgrades) => {
            const nextUpgradeIndex = this.purchasedUpgrades[type];
            const nextUpgrade = upgrades[nextUpgradeIndex];
            const element = document.getElementById(`${type}-upgrade`);
            if (element) {
                element.innerHTML = this.createUpgradeElement(currentUpgrade, type);
            }
        };

        updateSection('informational', UPGRADES.informational_upgrades);
        updateSection('passive', UPGRADES.passive_interrogation_upgrades);
        updateSection('active', UPGRADES.active_interrogation_upgrades);

        // Add buy handlers
        document.querySelectorAll('.buy-button').forEach(button => {
            button.addEventListener('click', async () => {
                try {
                const type = button.dataset.type;
                const price = parseInt(button.dataset.price);

                if (this.game.notes >= price) {
                    // Deduct notes
                    this.game.notes -= price;
                    document.getElementById('notes-count').textContent = this.game.notes;

                    // Update purchased state
                    const upgradeType = type === 'informational' ? 'informational_upgrades' :
                        type === 'passive' ? 'passive_interrogation_upgrades' :
                        'active_interrogation_upgrades';

                    // Update both price list and ID tracking
                    window.gameStore.purchasedUpgrades[upgradeType].push(price);
                    // Find and store the upgrade ID
                    const upgrade = UPGRADES[upgradeType].find(u => u.price === price);
                    if (upgrade) {
                        window.gameStore.purchasedUpgradeIds.add(upgrade.id);
                    }

                    saveGameState();

                    // Refresh shop display
                    await this.populateShop();
                }
                } catch (error) {
                    console.error('Error processing purchase:', error);
                }
            });
        });
    }
}
