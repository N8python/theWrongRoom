export class ShopManager {
    constructor(game) {
        this.game = game;
        this.purchasedUpgrades = {
            informational: -1,
            passive: -1,
            active: -1
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
        const { UPGRADES } = await import('./upgrades.js');
        
        // Update each upgrade section
        const updateSection = (type, upgrades) => {
            const currentIndex = this.purchasedUpgrades[type] + 1;
            const currentUpgrade = upgrades[currentIndex];
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
            button.addEventListener('click', () => {
                const type = button.dataset.type;
                const price = parseInt(button.dataset.price);
                
                if (this.game.notes >= price) {
                    // Deduct notes
                    this.game.notes -= price;
                    document.getElementById('notes-count').textContent = this.game.notes;
                    
                    // Update purchased state
                    this.purchasedUpgrades[type]++;
                    
                    // Refresh shop display
                    this.populateShop();
                }
            });
        });
    }
}
