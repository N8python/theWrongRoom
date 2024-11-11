export class ShopManager {
    constructor(game) {
        this.game = game;
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

    createUpgradeElement(upgrade) {
        return `
            <div class="shop-item" style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: rgba(90, 72, 54, 0.5); border-radius: 8px; margin-bottom: 12px;">
                <div style="flex-grow: 1; margin-right: 16px;">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 18px; font-weight: bold;">${upgrade.title}</span>
                    </div>
                    <div style="font-size: 14px; opacity: 0.8;">${upgrade.description}</div>
                </div>
                <button class="buy-button" data-item="${upgrade.id}" data-price="${upgrade.price}" style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; white-space: nowrap;">
                    <img src="sprites/note.png" style="width: 24px; height: 24px; image-rendering: pixelated;">
                    <span>${upgrade.price}</span>
                </button>
            </div>
        `;
    }

    async populateShop() {
        const { UPGRADES } = await import('./upgrades.js');
        
        document.getElementById('informational-upgrades').innerHTML = 
            UPGRADES.informational_upgrades.map(upgrade => this.createUpgradeElement(upgrade)).join('');
        document.getElementById('passive-upgrades').innerHTML = 
            UPGRADES.passive_interrogation_upgrades.map(upgrade => this.createUpgradeElement(upgrade)).join('');
        document.getElementById('active-upgrades').innerHTML = 
            UPGRADES.active_interrogation_upgrades.map(upgrade => this.createUpgradeElement(upgrade)).join('');

        // Add buy handlers
        document.querySelectorAll('.buy-button').forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.dataset.item;
                const price = parseInt(button.dataset.price);
                console.log(`Purchased ${itemId} for ${price} notes`);
                // For now, purchases are free
            });
        });
    }
}
