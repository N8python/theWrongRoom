import * as THREE from 'three';

class Lightning {
    constructor(scene) {
        this.scene = scene;

        // Load lightning texture
        const texture = new THREE.TextureLoader().load('sprites/lightning.png');
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;

        // Create lightning mesh
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        const geometry = new THREE.PlaneGeometry(1, 4);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.visible = false;
        scene.add(this.mesh);

        this.reset();
    }

    reset() {
        this.startTime = performance.now();
        this.duration = 200 + Math.random() * 300; // Random duration between 200-500ms
        this.isDone = false;

        // Random position and rotation
        this.mesh.position.set(-2 + Math.random() * 4, // Random x position
            -1 + Math.random() * 2, // Random y position
            0.5 // Slightly in front of background
        );

        this.mesh.rotation.z = (Math.random() - 0.5) * Math.PI / 4; // Random rotation
        this.mesh.scale.set(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 1);
        this.mesh.visible = true;
        this.mesh.renderOrder = 1002;
    }

    update(currentTime) {
        const age = currentTime - this.startTime;

        if (age > this.duration) {
            this.mesh.visible = false;
            this.isDone = true;
            return;
        }

        // Fade out
        const progress = age / this.duration;
        const alpha = Math.max(0, 1 - progress);
        this.mesh.material.opacity = alpha * (0.5 + 0.5 * Math.random()); // Flicker effect
    }
}

export { Lightning };