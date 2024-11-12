import * as THREE from 'https://unpkg.com/three@0.170.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.170.0/examples/jsm/controls/OrbitControls.js';
import { Lightning } from './lightning.js';
import { initPostProcessing } from './post-processing.js';

class Renderer {
    constructor(game) {
        this.game = game;
        this.lightnings = [];
        this.lightningPool = [];
        this.maxLightnings = 3;
        this.lastLightningTime = 0;
        this.lightningFrequency = 5000; // Average ms between strikes
        this.lightningVariance = 2000; // Variance in timing
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
        // Add rainbow gas
        const gas = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            depthWrite: false,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /*glsl*/ `
                uniform float time;
                varying vec2 vUv;
                vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}
                                float fbm(vec3 x) {
	float v = 0.0;
	float a = 0.5;
	vec3 shift = vec3(100);
	for (int i = 0; i < 5; ++i) {
		v += a * snoise(x);
		x = x * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}
                void main() {
                    vec2 sampleUv = vUv;
                    sampleUv.xy *= 2.0;
                    //vec3 color = vec3(0.5 + 0.5 * sin(time + vUv.x * 10.0));
                    float iTime = 0.1 * time;
                    float alpha = fbm(vec3(sampleUv, -iTime));
                    vec3 color = hsv2rgb(vec3(fbm(vec3(sampleUv, iTime + fbm(vec3(sampleUv, iTime)))), 1.0, 1.0));
                    color = clamp(color, vec3(0.0), vec3(1.0));
                    alpha = clamp(alpha, 0.0, 1.0);
                    // Apply sepia
                    /*color.r = 0.393 * color.r + 0.769 * color.g + 0.189 * color.b;
                    color.g = 0.349 * color.r + 0.686 * color.g + 0.168 * color.b;
                    color.b = 0.272 * color.r + 0.534 * color.g + 0.131 * color.b;*/
                    mat3 sepiaMatrix = mat3(
                        0.393, 0.349, 0.272,
                        0.769, 0.686, 0.534,
                        0.189, 0.168, 0.131
                    );
                    color = mix(color, sepiaMatrix * color, 0.9);
                    gl_FragColor = vec4((color), alpha);
                }
            `,
            transparent: true
        }));
        gas.position.z = 1.25;
        this.gas = gas;
        this.scene.add(gas);

        const lampTexture = await new THREE.TextureLoader().loadAsync('sprites/lamp.png');
        lampTexture.magFilter = THREE.NearestFilter;
        lampTexture.minFilter = THREE.NearestFilter;
        const lampMaterial = new THREE.MeshBasicMaterial({ map: lampTexture, transparent: true, side: THREE.DoubleSide });
        const lampGeometry = new THREE.PlaneGeometry(2, 4);
        const lampMesh = new THREE.Mesh(lampGeometry, lampMaterial);
        lampMesh.position.set(-1, 0.3, -0.5);
        lampMesh.frustumCulled = false;
        this.scene.add(lampMesh);
        const lightShine = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
            /* color: 0xffffaa,
             transparent: true,
             side: THREE.DoubleSide,*/
            side: THREE.DoubleSide,
            depthWrite: false,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                void main() {
                    float falloff = (clamp(1.0 - length(2.0 * (vUv - 0.5)), 0.0, 1.0));
                    gl_FragColor = vec4(1.0, 1.0, 0.7, falloff);
                }
            `,
            transparent: true
        }));
        lightShine.position.set(-1 + 0.1, 1.75 - 0.25, -0.4);
        this.scene.add(lightShine);
        this.lightShine = lightShine;
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
        this.gas.material.uniforms.time.value = currentTime / 1000;
        const shineSize = this.game.noise.simplex2(currentTime / 1000, 0);
        this.lightShine.scale.set(1 + 0.25 * shineSize, 1 + 0.25 * shineSize, 1);
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

            // Handle lightning
            const now = currentTime;
            if (now - this.lastLightningTime > this.lightningFrequency + (Math.random() * 2 - 1) * this.lightningVariance) {
                this.lastLightningTime = now;
                if (this.lightnings.length < this.maxLightnings) {
                    let lightning;
                    if (this.lightningPool.length > 0) {
                        lightning = this.lightningPool.pop();
                        lightning.reset();
                    } else {
                        lightning = new Lightning(this.scene);
                    }
                    this.lightnings.push(lightning);
                }
            }

            // Update existing lightnings
            for (let i = this.lightnings.length - 1; i >= 0; i--) {
                const lightning = this.lightnings[i];
                lightning.update(now);
                if (lightning.isDone) {
                    this.lightnings.splice(i, 1);
                    this.lightningPool.push(lightning);
                }
            }

            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

export { Renderer };