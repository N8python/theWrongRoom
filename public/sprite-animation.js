// Import three.js
import * as THREE from 'three';

export class SpriteSheet {
    constructor(canvas, frameWidth = 16, frameHeight = 32) {
        // Check the image data
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        this.canvas = canvas;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.sheetWidth = canvas.width;
        this.sheetHeight = canvas.height;

        // Calculate frames per row/column
        this.framesPerRow = Math.floor(this.sheetWidth / frameWidth);
        this.framesPerColumn = Math.floor(this.sheetHeight / frameHeight);

        // Direction constants (matching sheet layout)
        this.FACING = {
            LEFT: 0,
            DOWN: 1,
            UP: 2,
            RIGHT: 3
        };

        // Create a texture from the canvas
        this.texture = new THREE.DataTexture(data, canvas.width, canvas.height, THREE.RGBAFormat);
        // Set texture parameters
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.NearestFilter;

        // Set wrapS and wrapT for proper texture mapping
        this.texture.wrapS = THREE.RepeatWrapping;
        this.texture.wrapT = THREE.RepeatWrapping;
        this.texture.colorSpace = THREE.SRGBColorSpace;
        this.texture.flipY = true;
        this.texture.needsUpdate = true;
    }
}

export class CharacterSprite {
    constructor(spriteSheet, x = 0, y = 0) {
        this.spriteSheet = spriteSheet;
        this.x = x;
        this.y = y;
        this.currentDirection = spriteSheet.FACING.DOWN;
        this.walkFrame = 0;
        this.animationSpeed = 200; // ms per frame
        this.lastFrameTime = 0;

        // Create a material using the sprite sheet texture
        this.material = new THREE.MeshBasicMaterial({
            map: this.spriteSheet.texture,
            color: 0xffffff,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.5
        });
        this.shadowMaterial = this.material.clone();
        this.shadowMaterial.color.setHex(0x000000);
        this.shadowMaterial.depthTest = false;

        // Initialize the geometry for the sprite
        const aspectRatio = this.spriteSheet.frameWidth / this.spriteSheet.frameHeight;
        const characterHeight = 2; // Adjust as needed for scale
        const characterWidth = characterHeight * aspectRatio;
        this.geometry = new THREE.PlaneGeometry(characterWidth, characterHeight);

        // Create the mesh
        /*this.mesh = new THREE.Mesh(this.geometry, this.material);

        // Position the character mesh
        this.mesh.position.set(0, 0, 1);
        this.mesh.scale.set(2, 2, 2);

        this.shadowGeometry = new THREE.PlaneGeometry(this.geometry, this.material);
        this.shadowGeometry.rotateX(-Math.PI / 2);
        this.mesh.add(this.shadowGeometry);*/
        this.mesh = new THREE.Object3D();

        this.characterMesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.add(this.characterMesh);
        this.mesh.position.set(0, 0, 1);
        this.mesh.scale.set(2, 2, 2);

        this.shadowMesh = new THREE.Mesh(this.geometry, this.shadowMaterial);
        this.shadowMesh.rotateX(-Math.PI / 2);
        this.shadowMesh.position.set(0, -0.98, 1);
        this.shadowMesh.scale.set(1, -1, 1);
        this.mesh.add(this.shadowMesh);



        // Set initial texture offset and repeat
        this.updateTexture();
    }

    update(currentTime) {
        this.mesh.position.x = this.x;
        this.mesh.position.y = this.y - 0.1;
        if (currentTime - this.lastFrameTime > this.animationSpeed) {
            this.walkFrame = (this.walkFrame + 1) % 3; // Assuming 3 frames per animation
            this.lastFrameTime = currentTime;
            this.updateTexture();
        }
    }

    updateTexture() {
        const frameWidth = this.spriteSheet.frameWidth;
        const frameHeight = this.spriteSheet.frameHeight;

        const sheetWidth = this.spriteSheet.sheetWidth;
        const sheetHeight = this.spriteSheet.sheetHeight;

        // Calculate frame indices
        const frameX = this.currentDirection;
        const frameY = this.walkFrame;

        // Calculate texture offsets and repeats
        const u = frameX * frameWidth / sheetWidth;
        const v = frameY * frameHeight / sheetHeight;

        const uWidth = frameWidth / sheetWidth;
        const vHeight = frameHeight / sheetHeight;

        // Flip v coordinate because three.js texture origin is bottom-left
        const flippedV = 1 - v - vHeight;

        this.material.map.offset.set(u, flippedV);
        this.material.map.repeat.set(uWidth, vHeight);
        this.material.map.needsUpdate = true;
    }

    setDirection(direction) {
        this.currentDirection = direction;
        this.walkFrame = 0; // Reset walk frame when direction changes
        this.updateTexture();
    }

    // Optional method to update position
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.mesh.position.set(this.x, this.y, 0);
    }
}