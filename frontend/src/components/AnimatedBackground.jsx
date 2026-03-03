import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Stars(props) {
  const ref = useRef();
  
  // Generate random particle positions
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(5000 * 3);
    const colors = new Float32Array(5000 * 3);
    
    for (let i = 0; i < 5000; i++) {
      const i3 = i * 3;
      
      // Random positions in a sphere
      positions[i3] = (Math.random() - 0.5) * 10;
      positions[i3 + 1] = (Math.random() - 0.5) * 10;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;
      
      // Gradient colors (purple to blue)
      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.6);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    return [positions, colors];
  }, []);

  // Animate rotation
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          vertexColors
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

function FloatingOrbs() {
  const orbs = useRef([]);
  
  useFrame((state) => {
    orbs.current.forEach((orb, i) => {
      if (orb) {
        const t = state.clock.elapsedTime + i * 2;
        orb.position.y = Math.sin(t * 0.5) * 0.5;
        orb.position.x = Math.cos(t * 0.3) * 1.5;
        orb.position.z = Math.sin(t * 0.2) * 0.5;
      }
    });
  });

  return (
    <group>
      {[...Array(3)].map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (orbs.current[i] = el)}
          position={[i * 2 - 2, 0, -2]}
        >
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial
            color={i === 0 ? '#4f46e5' : i === 1 ? '#7c3aed' : '#fbbf24'}
            emissive={i === 0 ? '#4f46e5' : i === 1 ? '#7c3aed' : '#fbbf24'}
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function AnimatedBackground() {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      zIndex: -1,
      background: 'linear-gradient(to bottom, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
    }}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Stars />
        <FloatingOrbs />
      </Canvas>
    </div>
  );
}
