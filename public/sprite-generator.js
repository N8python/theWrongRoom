// Cache for storing preloaded images
const imageCache = {
    skin: [],
    top: [],
    pants: [],
    shoes: [],
    hair: [],
    extras: []
};

// Load an image and return a promise
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Initialize by loading all sprite assets
async function initializeSpriteAssets() {
    const layers = Object.keys(imageCache);
    
    for (const layer of layers) {
        try {
            const response = await fetch(`/sprite-parts/npc-parts/${layer}`);
            const files = await response.json();
            
            const loadPromises = files.map(file => 
                loadImage(`/sprites/npc-parts/${layer}/${file}`)
                    .then(img => imageCache[layer].push(img))
            );
            
            await Promise.all(loadPromises);
        } catch (error) {
            console.error(`Error loading ${layer} sprites:`, error);
        }
    }
}

// Initialize on script load
initializeSpriteAssets();

export async function generateRandomSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    // Draw a random image from each layer
    for (const layer of Object.keys(imageCache)) {
        const images = imageCache[layer];
        if (images.length > 0) {
            const randomImg = images[Math.floor(Math.random() * images.length)];
            ctx.drawImage(randomImg, 0, 0);
        }
    }

    return canvas.toDataURL();
}
