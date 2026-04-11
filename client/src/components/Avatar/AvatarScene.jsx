import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function AvatarBody({ avatarState }) {
  const rootRef     = useRef();
  const headRef     = useRef();
  const neckRef     = useRef();
  const torsoRef    = useRef();
  const lShoulderRef = useRef();
  const rShoulderRef = useRef();
  const lForearmRef  = useRef();
  const rForearmRef  = useRef();
  const jawRef       = useRef();
  const mouthRef     = useRef();
  const lEyeScaleRef = useRef();
  const rEyeScaleRef = useRef();
  const lPupilRef    = useRef();
  const rPupilRef    = useRef();
  const blinkRef     = useRef({ t: 0, active: false, p: 0, next: 3 });
  const breathRef    = useRef(0);

  const SKIN   = '#f0c4a0';
  const SKIN2  = '#d4a882';
  const HAIR   = '#1a0f00';
  const SHIRT  = avatarState === 'speaking'  ? '#3730d4'
               : avatarState === 'listening' ? '#0c6e8a'
               : '#4f46e5';
  const PANTS  = '#1a2035';
  const IRIS   = '#2244aa';
  const SHOE   = '#0f1020';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Breathing
    breathRef.current = Math.sin(t * 0.85) * 0.013;
    if (torsoRef.current) {
      torsoRef.current.scale.x = 1 + breathRef.current * 0.4;
      torsoRef.current.scale.z = 1 + breathRef.current * 0.5;
    }

    // Root gentle bob
    if (rootRef.current) {
      rootRef.current.position.y = -0.9 + Math.sin(t * 0.7) * 0.013;
      rootRef.current.rotation.y = Math.sin(t * 0.22) * 0.035;
    }

    // Head
    if (headRef.current) {
      if (avatarState === 'thinking') {
        headRef.current.rotation.z = Math.sin(t * 1.1) * 0.07 - 0.06;
        headRef.current.rotation.x = 0.12 + Math.sin(t * 0.7) * 0.03;
      } else if (avatarState === 'listening') {
        headRef.current.rotation.y = Math.sin(t * 0.9) * 0.1;
        headRef.current.rotation.x = 0.04;
        headRef.current.rotation.z = Math.sin(t * 0.6) * 0.03;
      } else if (avatarState === 'speaking') {
        headRef.current.rotation.y = Math.sin(t * 0.5) * 0.06;
        headRef.current.rotation.x = Math.sin(t * 0.8) * 0.025;
      } else {
        headRef.current.rotation.x = Math.sin(t * 0.35) * 0.015;
        headRef.current.rotation.y = Math.sin(t * 0.28) * 0.025;
      }
    }

    // Pupil drift — eyes track subtly
    const px = Math.sin(t * 0.33) * 0.007;
    const py = Math.sin(t * 0.27) * 0.004;
    if (lPupilRef.current) { lPupilRef.current.position.x = px; lPupilRef.current.position.y = py; }
    if (rPupilRef.current) { rPupilRef.current.position.x = px; rPupilRef.current.position.y = py; }

    // Blink
    const b = blinkRef.current;
    b.t += 0.016;
    if (!b.active && b.t >= b.next) {
      b.active = true; b.p = 0; b.t = 0; b.next = 2.5 + Math.random() * 4;
    }
    if (b.active) {
      b.p += 0.22;
      const lid = b.p < Math.PI ? Math.sin(b.p) : 0;
      const sy = Math.max(0.07, 1 - lid * 0.96);
      if (lEyeScaleRef.current) lEyeScaleRef.current.scale.y = sy;
      if (rEyeScaleRef.current) rEyeScaleRef.current.scale.y = sy;
      if (lPupilRef.current) lPupilRef.current.scale.y = sy;
      if (rPupilRef.current) rPupilRef.current.scale.y = sy;
      if (b.p >= Math.PI) b.active = false;
    } else {
      [lEyeScaleRef, rEyeScaleRef, lPupilRef, rPupilRef].forEach(r => {
        if (r.current) r.current.scale.y = THREE.MathUtils.lerp(r.current.scale.y, 1, 0.2);
      });
    }

    // Arms — upper arm (shoulder)
    if (lShoulderRef.current && rShoulderRef.current) {
      if (avatarState === 'speaking') {
        // Natural hand gestures — mostly forward/up
        lShoulderRef.current.rotation.x = 0.4 + Math.sin(t * 1.5) * 0.15;
        rShoulderRef.current.rotation.x = 0.4 + Math.sin(t * 1.5 + 0.5) * 0.15;
        lShoulderRef.current.rotation.z = 0.2 + Math.sin(t * 1.2) * 0.08;
        rShoulderRef.current.rotation.z = -0.2 - Math.sin(t * 1.2 + 0.3) * 0.08;
      } else {
        lShoulderRef.current.rotation.z = THREE.MathUtils.lerp(lShoulderRef.current.rotation.z, -0.22, 0.07);
        rShoulderRef.current.rotation.z = THREE.MathUtils.lerp(rShoulderRef.current.rotation.z, 0.22, 0.07);
        lShoulderRef.current.rotation.x = THREE.MathUtils.lerp(lShoulderRef.current.rotation.x, 0, 0.07);
        rShoulderRef.current.rotation.x = THREE.MathUtils.lerp(rShoulderRef.current.rotation.x, 0, 0.07);
      }
    }

    // Forearms — bend at elbows
    if (lForearmRef.current && rForearmRef.current) {
      if (avatarState === 'speaking') {
        lForearmRef.current.rotation.x = -0.5 - Math.abs(Math.sin(t * 2.1)) * 0.4;
        rForearmRef.current.rotation.x = -0.5 - Math.abs(Math.sin(t * 2.1 + 0.8)) * 0.4;
      } else {
        lForearmRef.current.rotation.x = THREE.MathUtils.lerp(lForearmRef.current.rotation.x, 0, 0.07);
        rForearmRef.current.rotation.x = THREE.MathUtils.lerp(rForearmRef.current.rotation.x, 0, 0.07);
        lForearmRef.current.rotation.z = 0;
        rForearmRef.current.rotation.z = 0;
      }
    }

    // Lip-sync jaw
    if (jawRef.current && mouthRef.current) {
      if (avatarState === 'speaking') {
        const open = Math.abs(Math.sin(t * 8.5)) * 0.55 + Math.abs(Math.sin(t * 5.8 + 1)) * 0.45;
        jawRef.current.position.y = -0.145 - open * 0.045;
        mouthRef.current.scale.y = 0.5 + open * 1.6;
        mouthRef.current.scale.x = 1 + open * 0.2;
      } else {
        jawRef.current.position.y = THREE.MathUtils.lerp(jawRef.current.position.y, -0.145, 0.14);
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.5, 0.14);
        mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 1, 0.14);
      }
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.9, 0]} scale={[0.92, 0.92, 0.92]}>

      {/* ── LEGS ─────────────────────────────────────── */}
      {[-0.16, 0.16].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* Thigh */}
          <mesh position={[0, 0.28, 0]}>
            <capsuleGeometry args={[0.1, 0.35, 8, 16]} />
            <meshStandardMaterial color={PANTS} roughness={0.75} />
          </mesh>
          {/* Shin */}
          <mesh position={[0, -0.12, 0]}>
            <capsuleGeometry args={[0.09, 0.3, 8, 16]} />
            <meshStandardMaterial color={PANTS} roughness={0.75} />
          </mesh>
          {/* Shoe */}
          <mesh position={[0, -0.36, 0.05]}>
            <boxGeometry args={[0.2, 0.1, 0.32]} />
            <meshStandardMaterial color={SHOE} roughness={0.4} metalness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ── TORSO ─────────────────────────────────────── */}
      <group ref={torsoRef} position={[0, 0.72, 0]}>
        {/* Main body */}
        <RoundedBox args={[0.66, 0.72, 0.38]} radius={0.06} smoothness={4}>
          <meshStandardMaterial color={SHIRT} roughness={0.55} />
        </RoundedBox>
        {/* Shoulder rounding L */}
        <mesh position={[-0.3, 0.28, 0]}>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color={SHIRT} roughness={0.55} />
        </mesh>
        {/* Shoulder rounding R */}
        <mesh position={[0.3, 0.28, 0]}>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color={SHIRT} roughness={0.55} />
        </mesh>
        {/* Shirt collar */}
        <mesh position={[0, 0.36, 0.14]}>
          <torusGeometry args={[0.1, 0.03, 8, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      </group>

      {/* ── LEFT ARM ─────────────────────────────────── */}
      <group ref={lShoulderRef} position={[-0.55, 1.02, 0]} rotation={[0, 0, -0.22]}>
        {/* Upper arm */}
        <mesh position={[0, -0.15, 0]}>
          <capsuleGeometry args={[0.085, 0.25, 8, 14]} />
          <meshStandardMaterial color={SHIRT} roughness={0.55} />
        </mesh>
        {/* Elbow */}
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color={SHIRT} roughness={0.55} />
        </mesh>
        {/* Forearm */}
        <group ref={lForearmRef} position={[0, -0.3, 0]}>
          <mesh position={[0, -0.15, 0]}>
            <capsuleGeometry args={[0.08, 0.25, 8, 14]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
          {/* Hand */}
          <group position={[0, -0.3, 0]}>
            <RoundedBox args={[0.14, 0.18, 0.08]} radius={0.05} smoothness={4}>
              <meshStandardMaterial color={SKIN} roughness={0.65} />
            </RoundedBox>
            {/* Thumb */}
            <mesh position={[0.08, 0.02, 0.03]} rotation={[0, 0, -0.5]}>
              <capsuleGeometry args={[0.025, 0.06, 4, 8]} />
              <meshStandardMaterial color={SKIN} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ── RIGHT ARM ────────────────────────────────── */}
      <group ref={rShoulderRef} position={[0.55, 1.02, 0]} rotation={[0, 0, 0.22]}>
        {/* Upper arm */}
        <mesh position={[0, -0.15, 0]}>
          <capsuleGeometry args={[0.085, 0.25, 8, 14]} />
          <meshStandardMaterial color={SHIRT} roughness={0.55} />
        </mesh>
        {/* Elbow */}
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color={SHIRT} roughness={0.55} />
        </mesh>
        {/* Forearm */}
        <group ref={rForearmRef} position={[0, -0.3, 0]}>
          <mesh position={[0, -0.15, 0]}>
            <capsuleGeometry args={[0.08, 0.25, 8, 14]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
          {/* Hand */}
          <group position={[0, -0.3, 0]}>
            <RoundedBox args={[0.14, 0.18, 0.08]} radius={0.05} smoothness={4}>
              <meshStandardMaterial color={SKIN} roughness={0.65} />
            </RoundedBox>
            {/* Thumb */}
            <mesh position={[-0.08, 0.02, 0.03]} rotation={[0, 0, 0.5]}>
              <capsuleGeometry args={[0.025, 0.06, 4, 8]} />
              <meshStandardMaterial color={SKIN} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ── NECK ─────────────────────────────────────── */}
      <mesh ref={neckRef} position={[0, 1.08, 0]}>
        <capsuleGeometry args={[0.085, 0.1, 8, 14]} />
        <meshStandardMaterial color={SKIN} />
      </mesh>

      {/* ── HEAD ─────────────────────────────────────── */}
      <group ref={headRef} position={[0, 1.48, 0]}>

        {/* Skull — slightly oval */}
        <mesh scale={[1, 1.08, 0.96]}>
          <sphereGeometry args={[0.29, 32, 32]} />
          <meshStandardMaterial color={SKIN} roughness={0.6} />
        </mesh>

        {/* Jaw lower half */}
        <group ref={jawRef} position={[0, -0.145, 0]}>
          <mesh scale={[1, 0.55, 0.95]}>
            <sphereGeometry args={[0.26, 24, 16, 0, Math.PI*2, Math.PI*0.35, Math.PI*0.65]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
        </group>

        {/* ── HAIR ──────────────────────────────────── */}
        {/* Top cap */}
        <mesh position={[0, 0.12, -0.01]} scale={[1.04, 1, 1.02]}>
          <sphereGeometry args={[0.295, 26, 18, 0, Math.PI*2, 0, Math.PI*0.5]} />
          <meshStandardMaterial color={HAIR} roughness={0.9} />
        </mesh>
        {/* Front hairline bump */}
        <mesh position={[0, 0.22, 0.2]}>
          <sphereGeometry args={[0.12, 12, 10, 0, Math.PI*2, 0, Math.PI*0.6]} />
          <meshStandardMaterial color={HAIR} roughness={0.9} />
        </mesh>
        {/* Side tufts */}
        {[-1,1].map(s => (
          <mesh key={s} position={[s*0.26, 0.05, 0.06]} rotation={[0,0,s*-0.3]}>
            <boxGeometry args={[0.06, 0.16, 0.04]} />
            <meshStandardMaterial color={HAIR} roughness={0.95} />
          </mesh>
        ))}

        {/* ── EYES ──────────────────────────────────── */}
        {/* ── EYES ──────────────────────────────────── */}
        {[[-0.105, 'l', lEyeScaleRef, lPupilRef], [0.105, 'r', rEyeScaleRef, rPupilRef]].map(([x, side, eyeRef, pupilRef]) => (
          <group key={side} position={[x, 0.08, 0]}>
            {/* Eye socket shadow */}
            <mesh position={[0, 0, 0.26]}>
              <circleGeometry args={[0.065, 20]} />
              <meshStandardMaterial color="#e8b090" roughness={0.9} />
            </mesh>
            {/* White sclera */}
            <mesh ref={eyeRef} position={[0, 0, 0.266]}>
              <circleGeometry args={[0.056, 20]} />
              <meshStandardMaterial color="white" roughness={0.1} />
            </mesh>
            {/* Iris */}
            <mesh position={[0, 0, 0.272]}>
              <circleGeometry args={[0.036, 18]} />
              <meshStandardMaterial color={IRIS} roughness={0.05} />
            </mesh>
            {/* Pupil */}
            <mesh ref={pupilRef} position={[0, 0, 0.278]}>
              <circleGeometry args={[0.02, 14]} />
              <meshStandardMaterial color="#050510" />
            </mesh>
            {/* Eye-shine */}
            <mesh position={[0.018, 0.022, 0.282]}>
              <circleGeometry args={[0.007, 8]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={2} />
            </mesh>
            {/* Upper eyelid */}
            <mesh position={[0, 0.048, 0.27]}>
              <boxGeometry args={[0.118, 0.014, 0.005]} />
              <meshStandardMaterial color={HAIR} roughness={0.85} />
            </mesh>
          </group>
        ))}

        {/* ── EYEBROWS ──────────────────────────────── */}
        {[-0.105, 0.105].map((x, i) => (
          <mesh key={i} position={[x, 0.17, 0.272]} rotation={[0, 0, x > 0 ? -0.08 : 0.08]}>
            <boxGeometry args={[0.1, 0.016, 0.008]} />
            <meshStandardMaterial color={HAIR} roughness={0.8} />
          </mesh>
        ))}

        {/* ── NOSE ──────────────────────────────────── */}
        <mesh position={[0, -0.02, 0.285]}>
          <sphereGeometry args={[0.028, 10, 10]} />
          <meshStandardMaterial color={SKIN2} roughness={0.75} />
        </mesh>
        {/* Nose bridge */}
        <mesh position={[0, 0.06, 0.278]}>
          <boxGeometry args={[0.018, 0.08, 0.01]} />
          <meshStandardMaterial color={SKIN2} roughness={0.8} />
        </mesh>

        {/* ── MOUTH ─────────────────────────────────── */}
        {/* Upper lip */}
        <mesh position={[0, -0.1, 0.276]}>
          <boxGeometry args={[0.105, 0.022, 0.01]} />
          <meshStandardMaterial color="#b86070" roughness={0.5} />
        </mesh>
        {/* Lower lip (animated) */}
        <group ref={mouthRef} position={[0, -0.124, 0.274]}>
          <mesh>
            <boxGeometry args={[0.1, 0.02, 0.01]} />
            <meshStandardMaterial color="#b86070" roughness={0.5} />
          </mesh>
        </group>
        {/* Mouth interior */}
        <mesh position={[0, -0.112, 0.272]}>
          <boxGeometry args={[0.08, 0.014, 0.008]} />
          <meshStandardMaterial color="#4a1020" roughness={0.95} />
        </mesh>

        {/* ── EARS ──────────────────────────────────── */}
        {[-1,1].map(s => (
          <group key={s} position={[s*0.295, 0.02, 0]}>
            <mesh>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial color={SKIN} roughness={0.75} />
            </mesh>
            <mesh position={[s*0.02, 0, 0]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshStandardMaterial color={SKIN2} roughness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Cheek blush */}
        {[-0.19, 0.19].map((x, i) => (
          <mesh key={i} position={[x, -0.04, 0.267]}>
            <circleGeometry args={[0.045, 14]} />
            <meshStandardMaterial color="#f0a0a0" transparent opacity={0.18} roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Ambient particles
function Particles({ count = 50, avatarState }) {
  const mesh = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 6;
      pos[i*3+1] = (Math.random() - 0.5) * 6;
      pos[i*3+2] = (Math.random() - 0.5) * 3 - 1;
    }
    return pos;
  }, [count]);
  useFrame(s => {
    if (mesh.current) {
      mesh.current.rotation.y = s.clock.getElapsedTime() * 0.035;
      mesh.current.rotation.x = s.clock.getElapsedTime() * 0.015;
    }
  });
  const color = avatarState === 'speaking' ? '#6366f1'
    : avatarState === 'listening' ? '#06b6d4'
    : avatarState === 'thinking'  ? '#f59e0b' : '#818cf8';
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color={color} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// Ground glow
function GroundGlow({ avatarState }) {
  const ref = useRef();
  useFrame(s => {
    if (ref.current) {
      ref.current.rotation.x = -Math.PI / 2;
      const sc = 1 + Math.sin(s.clock.getElapsedTime() * 1.6) * 0.06;
      ref.current.scale.set(sc, sc, 1);
    }
  });
  const color = avatarState === 'speaking' ? '#6366f1'
    : avatarState === 'listening' ? '#0891b2' : '#4f46e5';
  return (
    <mesh ref={ref} position={[0, -1.45, 0]}>
      <ringGeometry args={[0.7, 1.15, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function AvatarScene({ avatarState = 'idle' }) {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0.2, 3.8], fov: 38 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} dpr={[1, 2]} shadows>
        {/* Key light */}
        <directionalLight position={[2, 4, 3]} intensity={1.8} color="#ffffff" castShadow />
        {/* Fill light */}
        <pointLight position={[-3, 2, 1]} intensity={0.7} color="#a0c0ff" />
        {/* Rim / back light */}
        <pointLight position={[0, 3, -3]} intensity={0.5} color="#6366f1" />
        {/* Warm under fill */}
        <pointLight position={[0, -1, 2]} intensity={0.3} color="#ffddbb" />
        <ambientLight intensity={0.45} />

        <Suspense fallback={null}>
          <Float speed={1.1} rotationIntensity={0.04} floatIntensity={0.2}>
            <AvatarBody avatarState={avatarState} />
          </Float>
          <Particles count={50} avatarState={avatarState} />
          <GroundGlow avatarState={avatarState} />
          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          enableZoom={false} enablePan={false}
          minPolarAngle={Math.PI / 3.2} maxPolarAngle={Math.PI / 1.9}
          autoRotate={avatarState === 'idle'} autoRotateSpeed={0.35}
        />
      </Canvas>
    </div>
  );
}