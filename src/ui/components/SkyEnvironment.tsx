import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 天光 — an image-based lighting environment generated from the scene's own
 * sky colours. No HDRI file, no download.
 *
 * Every 3D scene here is built from `meshStandardMaterial`, which is a PBR
 * material: its `metalness` and `roughness` describe how a surface reflects
 * *its surroundings*. With no environment map there is nothing to reflect, so
 * all that shading work collapses — a bronze blade, a lacquered roof tile and
 * a mud wall differ only by their diffuse colour, and metal in particular
 * reads as flat dark plastic.
 *
 * This builds a small cube environment out of the same top/horizon/sun colours
 * the sky dome already uses, runs it through PMREM, and hands it to
 * `scene.environment`. Suddenly armour catches the sky, water and tile pick up
 * the sunset, and a night scene goes cool on every reflective surface — all
 * from three colours the scene already had.
 *
 * Deliberately gentle by default (`intensity` well under 1): this is meant to
 * seat the existing palette in a believable light, not to turn the game
 * chrome. It also costs a one-off render at mount and on colour change, not
 * per frame.
 */
export function SkyEnvironment({
  top,
  horizon,
  sun,
  intensity = 0.45,
  /** 地面反照 — bounce colour from below (grass, sand, snow). */
  ground = '#4a4235',
}: {
  top: string;
  horizon: string;
  sun: string;
  intensity?: number;
  ground?: string;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();

    // A tiny stand-in world: a sky gradient dome, a ground plane for bounce,
    // and one bright patch where the sun is. PMREM blurs it into usable
    // irradiance, so it does not need to be detailed — only correctly
    // coloured.
    const envScene = new THREE.Scene();

    const skyGeo = new THREE.SphereGeometry(50, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        uTop: { value: new THREE.Color(top) },
        uHorizon: { value: new THREE.Color(horizon) },
        uGround: { value: new THREE.Color(ground) },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGround;
        varying vec3 vPos;
        void main() {
          float h = normalize(vPos).y;
          // Sky above the horizon, bounced ground below it.
          vec3 c = h >= 0.0
            ? mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.55))
            : mix(uHorizon, uGround, pow(clamp(-h, 0.0, 1.0), 0.35));
          gl_FragColor = vec4(c, 1.0);
        }
      `,
    });
    const dome = new THREE.Mesh(skyGeo, skyMat);
    envScene.add(dome);

    // 日輪 — a soft bright disc so highlights have a direction to come from.
    const sunGeo = new THREE.SphereGeometry(6, 12, 8);
    const sunMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(sun) });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(18, 26, 12);
    envScene.add(sunMesh);

    const rt = pmrem.fromScene(envScene, 0.06);
    const prevEnv = scene.environment;
    const prevIntensity = scene.environmentIntensity;
    // Mutating the three.js Scene is how this API works — `scene.environment`
    // is the documented way to bind an IBL map, and R3F hands us the live
    // object precisely so effects can do this. The compiler rule assumes React
    // state semantics; the cleanup below restores the previous values.
    /* eslint-disable react-hooks/immutability */
    scene.environment = rt.texture;
    scene.environmentIntensity = intensity;
    /* eslint-enable react-hooks/immutability */

    return () => {
      scene.environment = prevEnv;
      scene.environmentIntensity = prevIntensity;
      rt.dispose();
      pmrem.dispose();
      skyGeo.dispose(); skyMat.dispose();
      sunGeo.dispose(); sunMat.dispose();
    };
  }, [gl, scene, top, horizon, sun, ground, intensity]);

  return null;
}
