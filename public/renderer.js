import * as THREE from 'https://unpkg.com/three@0.170.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.170.0/examples/jsm/controls/OrbitControls.js';
import { initPostProcessing } from './post-processing.js';

class Renderer {
    constructor(game) {
        this.game = game;
    }

    async initialize() {
        // Create the scene
        this.scene = new THREE.Scene();

        // Create the camera
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);

        // Position the camera
        this.camera.position.z = 7;

        // Create the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        // Set the size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);

        // Append renderer's canvas to the DOM
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Create background mesh
        await this.createBackgroundMesh();

        const { composer, effectPass } = initPostProcessing(this.renderer, this.scene, this.camera);
        this.composer = composer;
        this.effectPass = effectPass;

        // Start animation loop
        this.animate();
    }

    onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    async createBackgroundMesh() {
        const backgroundMesh = (await (new GLTFLoader()).loadAsync('sprites/background.glb')).scene;
        // Make all materials 'basic'
        backgroundMesh.traverse((child) => {
            if (child.isMesh) {
                child.material.map.minFilter = THREE.NearestFilter;
                child.material.map.magFilter = THREE.NearestFilter;
                child.material = new THREE.MeshBasicMaterial({ map: child.material.map });
            }
        });
        backgroundMesh.scale.set(3, 3, 1.5);
        this.scene.add(backgroundMesh);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        if (this.game.debugCamera) {
            this.camera.rotation.order = 'XYZ';
            this.orbitControls.enabled = true;
        } else {
            this.orbitControls.enabled = false;
        }
        const currentTime = performance.now();

        // Update character animations
        if (this.game.isAnimating) {
            this.game.currentCharacterSprite.update(currentTime);
            this.game.handleAnimation();
        }

        // Update character position
        if (this.game.currentCharacterSprite) {
            this.game.currentCharacterSprite.mesh.position.x = this.game.currentCharacterSprite.x;
            this.game.currentCharacterSprite.mesh.position.y = this.game.currentCharacterSprite.y;
        }

        if (!this.game.debugCamera) {
            this.camera.rotation.order = 'YXZ';
            const targetQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1 * this.game.mouse.y, 0.1 * this.game.mouse.x, 0, 'YXZ'));
            this.camera.quaternion.slerp(targetQuaternion, 0.1);
            const noise = this.game.noise;
            const targetX = 0.1 * noise.simplex2(currentTime / 3000, 100) - 0.25 * this.game.mouse.x;
            const targetY = 0.1 * noise.simplex2(currentTime / 3000, 201) + 0.1 * this.game.mouse.y;
            const targetZ = 7 + 0.1 * noise.simplex2(currentTime / 3000, 301) + (0.1 * Math.sqrt(this.game.mouse.x ** 2 + this.game.mouse.y ** 2));
            const targetPosition = new THREE.Vector3(targetX, targetY, targetZ);
            this.camera.position.lerp(targetPosition, 0.1);
        }

        // Render the scene
        if (this.composer) {
            const currentTime = performance.now();
            if (this.effectPass) {
                // Compute flicker using fractal noise
                let flicker = 0;
                let frequency = 0.1;
                let amplitude = 0.5;
                const noise = this.game.noise;
                for (let i = 0; i < 5; i++) {
                    flicker += amplitude * noise.simplex2(frequency * currentTime / 100, i);
                    frequency *= 2;
                    amplitude *= 0.5;
                }
                this.effectPass.uniforms.flicker.value = 0.75 + 0.25 * flicker;
                this.effectPass.uniforms.time.value = (currentTime / 1000) % 1000;
            }
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

export { Renderer };