import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const PostProcessingShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "time": { value: 0 },
        "vignetteIntensity": { value: 0.975 },
        "noiseIntensity": { value: 0.025 },
        "scanlineIntensity": { value: 0.0 },
        "scanlineCount": { value: 800.0 },
        "scanlineSpeed": { value: 100.0 },
        "flicker": { value: 0.5 },
        "distortion": { value: 4.0 },
        "chromaOffset": { value: 0.003 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float vignetteIntensity;
        uniform float noiseIntensity;
        uniform float scanlineIntensity;
        uniform float scanlineCount;
        uniform float scanlineSpeed;
        uniform float flicker;
        uniform float distortion;
        uniform float chromaOffset;
        varying vec2 vUv;

        float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
        vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
        vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

        float hash13(vec3 p3) {
            p3 = fract(p3 * .1031);
            p3 += dot(p3, p3.zyx + 31.32);
            return fract((p3.x + p3.y) * p3.z);
        }

        vec2 curveRemapUV(vec2 uv) {
            uv = uv * 2.0 - 1.0;
            uv *= 0.8875;
            vec2 offset = abs(uv.yx) / vec2(5.0, 5.0);
            uv = uv + uv * offset * offset * distortion;
            uv = uv * 0.5 + 0.5;
            return uv;
        }

        vec4 scanlineEffect(vec2 uv, vec4 color) {
            float scanline = sin(uv.y * scanlineCount - time * scanlineSpeed) * 0.5 + 0.5;            
            color *= scanline;
            return color;
        }

        vec4 chromaticAberration(sampler2D tex, vec2 uv) {
            float r = texture2D(tex, vec2(uv.x + chromaOffset * sqrt(length(uv - 0.5) * 1.41421356237), uv.y)).r;
            float g = texture2D(tex, uv).g;
            float b = texture2D(tex, vec2(uv.x - chromaOffset * sqrt(length(uv - 0.5) * 1.41421356237), uv.y)).b;
            return vec4(r, g, b, 1.0);
        }

        void main() {
            // Apply curved screen distortion
            vec2 curvedUv = curveRemapUV(vUv);
        

            // Apply chromatic aberration
            vec4 texel = chromaticAberration(tDiffuse, curvedUv);
            if (curvedUv.x < 0.0 || curvedUv.x > 1.0 || curvedUv.y < 0.0 || curvedUv.y > 1.0) {
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                return;
            }

          
            
            // Vignette effect
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(curvedUv, center);
            float vignette = smoothstep(0.5, 0.2, dist);
            texel.rgb *= mix(1.0 - vignetteIntensity, 1.0, vignette);

            // Apply scanlines with external flicker
            texel = scanlineEffect(curvedUv, texel);
            if (flicker < 2.0) {
                texel.rgb = pow(texel.rgb, vec3(1.0 / flicker));
            } else {
                texel.rgb *= flicker;
            }

            // Static noise with temporal variation
            float n = hash13(vec3(gl_FragCoord.xy, time)) * noiseIntensity;
            texel.rgb += vec3(n);
        
            gl_FragColor = vec4(texel.rgb, 1.0);
        }
    `
};

function initPostProcessing(renderer, scene, camera) {
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const effectPass = new ShaderPass(PostProcessingShader);
    composer.addPass(effectPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    return {
        composer,
        effectPass
    };
}

// Export the initialization function and shader
export { initPostProcessing, PostProcessingShader };