import { useEffect, useRef } from 'react';
import * as THREE from 'three';

class SimplexNoise {
  private perm: number[];
  constructor(seed?: string) {
    const s = seed || 'globe';
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    this.perm = new Array(512);
    const p = new Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      h = (h * 16807 + 2147483647) | 0;
      const j = Math.abs(h) % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }
  noise3D(x: number, y: number, z: number): number {
    const perm = this.perm;
    const grad3 = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];
    const F3 = 1/3, G3 = 1/6;
    const s = (x+y+z)*F3;
    const i = Math.floor(x+s), j = Math.floor(y+s), k = Math.floor(z+s);
    const t = (i+j+k)*G3;
    const x0 = x-(i-t), y0 = y-(j-t), z0 = z-(k-t);
    let i1,j1,k1,i2,j2,k2;
    if(x0>=y0){if(y0>=z0){i1=1;j1=0;k1=0;i2=1;j2=1;k2=0;}else if(x0>=z0){i1=1;j1=0;k1=0;i2=1;j2=0;k2=1;}else{i1=0;j1=0;k1=1;i2=1;j2=0;k2=1;}}
    else{if(y0<z0){i1=0;j1=0;k1=1;i2=0;j2=1;k2=1;}else if(x0<z0){i1=0;j1=1;k1=0;i2=0;j2=1;k2=1;}else{i1=0;j1=1;k1=0;i2=1;j2=1;k2=0;}}
    const x1=x0-i1+G3,y1=y0-j1+G3,z1=z0-k1+G3;
    const x2=x0-i2+2*G3,y2=y0-j2+2*G3,z2=z0-k2+2*G3;
    const x3=x0-1+3*G3,y3=y0-1+3*G3,z3=z0-1+3*G3;
    const ii=i&255,jj=j&255,kk=k&255;
    const gi0=perm[ii+perm[jj+perm[kk]]]%12;
    const gi1=perm[ii+i1+perm[jj+j1+perm[kk+k1]]]%12;
    const gi2=perm[ii+i2+perm[jj+j2+perm[kk+k2]]]%12;
    const gi3=perm[ii+1+perm[jj+1+perm[kk+1]]]%12;
    let n0=0,n1=0,n2=0,n3=0;
    let t0=0.6-x0*x0-y0*y0-z0*z0;
    if(t0>=0){t0*=t0;n0=t0*t0*(grad3[gi0][0]*x0+grad3[gi0][1]*y0+grad3[gi0][2]*z0);}
    let t1=0.6-x1*x1-y1*y1-z1*z1;
    if(t1>=0){t1*=t1;n1=t1*t1*(grad3[gi1][0]*x1+grad3[gi1][1]*y1+grad3[gi1][2]*z1);}
    let t2=0.6-x2*x2-y2*y2-z2*z2;
    if(t2>=0){t2*=t2;n2=t2*t2*(grad3[gi2][0]*x2+grad3[gi2][1]*y2+grad3[gi2][2]*z2);}
    let t3=0.6-x3*x3-y3*y3-z3*z3;
    if(t3>=0){t3*=t3;n3=t3*t3*(grad3[gi3][0]*x3+grad3[gi3][1]*y3+grad3[gi3][2]*z3);}
    return 32*(n0+n1+n2+n3);
  }
}

function fibonacciSphere(samples: number) {
  const points: { x: number; y: number; z: number }[] = [];
  const offset = 2 / samples;
  const increment = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < samples; i++) {
    const y = ((i * offset) - 1) + (offset / 2);
    const r = Math.sqrt(1 - y * y);
    const phi = ((i + 1) % samples) * increment;
    points.push({
      x: Math.cos(phi) * r,
      y: y,
      z: Math.sin(phi) * r,
    });
  }
  return points;
}

function getNoise(x: number, y: number, z: number, scale: number, seed?: string) {
  const noise = new SimplexNoise(seed || 'globe');
  return noise.noise3D(x * scale, y * scale, z * scale);
}

const continentData = [
  { lat: 0.72, lon: -1.25, radius: 0.42 },
  { lat: 0.45, lon: -0.10, radius: 0.38 },
  { lat: -0.28, lon: -0.78, radius: 0.35 },
  { lat: -0.60, lon: -1.05, radius: 0.28 },
  { lat: -0.20, lon: 2.40, radius: 0.30 },
  { lat: -0.35, lon: 2.15, radius: 0.32 },
  { lat: 0.82, lon: 0.30, radius: 0.25 },
  { lat: 0.65, lon: 0.90, radius: 0.38 },
  { lat: 1.15, lon: 0.35, radius: 0.22 },
  { lat: 0.25, lon: 1.35, radius: 0.35 },
  { lat: -0.48, lon: 1.40, radius: 0.18 },
  { lat: 0.50, lon: -1.75, radius: 0.25 },
  { lat: 0.40, lon: 2.80, radius: 0.20 },
  { lat: -0.75, lon: -1.50, radius: 0.22 },
  { lat: -0.10, lon: 0.45, radius: 0.30 },
  { lat: -0.55, lon: 2.80, radius: 0.18 },
];

function pointOnContinent(p: { x: number; y: number; z: number }) {
  const lat = Math.asin(p.y);
  const lon = Math.atan2(p.z, p.x);
  for (const f of continentData) {
    const d = Math.acos(
      Math.sin(lat) * Math.sin(f.lat) +
      Math.cos(lat) * Math.cos(f.lat) * Math.cos(lon - f.lon)
    );
    if (d < f.radius) return 1 - (d / f.radius);
  }
  return 0;
}

export default function GlobeBackground({ isDarkMode }: { isDarkMode: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = width / height;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const camera = new THREE.PerspectiveCamera(60, ratio, 0.1, 20000);
    camera.position.set(0, 20, 220);
    camera.lookAt(0, 0, 0);

    const scene = new THREE.Scene();
    scene.add(camera);

    const SPHERE_RADIUS = 60;
    const PARTICLE_COUNT = 25000;
    const PARTICLE_SIZE = 0.45;
    const GLOBE_COLOR = isDarkMode ? 0xC8A45C : 0xD4A574;

    // Generate particles
    const points = fibonacciSphere(PARTICLE_COUNT);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const color = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const fi = 0.8 + Math.random() * 0.2;
      const radius = SPHERE_RADIUS * fi;
      const p = points[i];

      let px = p.x * radius;
      let py = p.y * radius;
      let pz = p.z * radius;

      const noise = getNoise(p.x, p.y, p.z, 1.8, 'elevation');
      const disturbance = noise * 1.2;
      px += p.x * disturbance;
      py += p.y * disturbance;
      pz += p.z * disturbance;

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      const continent = pointOnContinent(p);
      const brightness = 0.15 + (continent * 0.85);

      const n = getNoise(p.x, p.y, p.z, 4.5, 'warp');
      const warp = n * 0.35;

      const r = (GLOBE_COLOR >> 16) & 0xFF;
      let g = (GLOBE_COLOR >> 8) & 0xFF;
      const b = GLOBE_COLOR & 0xFF;

      if (continent > 0.1) {
        const colorShift = getNoise(p.x, p.y, p.z, 2.2, 'green');
        g += (colorShift * 60) + (continent * 30);
      }

      color.setRGB(r / 255, g / 255, b / 255);
      colors[i * 3] = color.r + warp * 0.1;
      colors[i * 3 + 1] = color.g + warp * 0.05;
      colors[i * 3 + 2] = color.b;
      sizes[i] = PARTICLE_SIZE * (0.5 + (brightness * 0.5));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Shader material
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          float alpha = 1.0 - smoothstep(0.35, 0.5, dist);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha * 0.9);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent: true,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // Atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(SPHERE_RADIUS * 1.15, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          vec3 ATMOSPHERE_COLOR = vec3(0.78, 0.64, 0.36);
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(ATMOSPHERE_COLOR, intensity * ${isDarkMode ? '0.4' : '0.6'});
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Stars
    const starsGroup = new THREE.Group();
    scene.add(starsGroup);
    const STAR_COUNT = 1500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starSizes = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 300 + Math.random() * 2700;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
      starSizes[i] = 0.5 + Math.random() * 2.5;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        varying float vAlpha;
        uniform float time;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          vAlpha = 0.3 + 0.7 * abs(sin(time * 0.5 + position.x * 0.01));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          gl_FragColor = vec4(1.0, 0.95, 0.8, vAlpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent: true,
    });

    const starField = new THREE.Points(starGeo, starMaterial);
    starsGroup.add(starField);

    // Mouse tracking
    let targetRotationY = 0;
    let targetRotationX = 0;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseX = nx * 0.5;
      mouseY = ny * 0.3;
      targetRotationY = mouseX;
      targetRotationX = mouseY;
    };
    document.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const animate = (time: number) => {
      frameRef.current = requestAnimationFrame(animate);
      time *= 0.001;

      particleMaterial.uniforms.time.value = time;
      starMaterial.uniforms.time.value = time;

      particles.rotation.y += 0.0005;
      particles.rotation.y += (targetRotationY - particles.rotation.y) * 0.05;
      particles.rotation.x += (targetRotationX - particles.rotation.x) * 0.05;

      starsGroup.rotation.y = particles.rotation.y * -0.25;

      renderer.render(scene, camera);
    };
    frameRef.current = requestAnimationFrame(animate);

    // Resize
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      geometry.dispose();
      particleMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      starGeo.dispose();
      starMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isDarkMode]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
