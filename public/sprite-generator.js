async function getRandomFileFromDir(dirPath) {
    try {
        const response = await fetch(`/sprite-parts${dirPath}`);
        const files = await response.json();
        return files[Math.floor(Math.random() * files.length)];
    } catch (error) {
        console.error('Error loading sprite parts:', error);
        return null;
    }
}

export async function generateRandomSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;  // Adjust based on your sprite size
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const layers = ['skin', 'top', 'pants', 'shoes', 'hair', 'extras'];
    
    for (const layer of layers) {
        const file = await getRandomFileFromDir(`/npc-parts/${layer}`);
        if (file) {
            const img = new Image();
            img.src = `/sprites/npc-parts/${layer}/${file}`;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            ctx.drawImage(img, 0, 0);
        }
    }

    return canvas.toDataURL();
}
