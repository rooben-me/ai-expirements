import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Icosahedron, shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// Custom shader for the inner glow
const GlowShaderMaterial = shaderMaterial(
  { color: new THREE.Color(0.1, 0.3, 0.6), intensity: 1.5 },
  `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform vec3 color;
    uniform float intensity;
    varying vec3 vNormal;
    void main() {
      float strength = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
      gl_FragColor = vec4(color * intensity * strength, 1.0);
    }
  `
);

extend({ GlowShaderMaterial });

const AudioSphere = ({ frequencies }) => {
  const outerRef = useRef();
  const innerRef = useRef();
  const glowRef = useRef();

  // Use the first 8 frequencies (typically bass range)
  const bassFrequencies = frequencies.slice(0, 8);
  const bassIntensity = useMemo(() => {
    const sum = bassFrequencies.reduce((a, b) => a + b, 0);
    return sum / (bassFrequencies.length * 255); // Normalize to 0-1 range
  }, [bassFrequencies]);

  const distortionAmount = useMemo(() => new THREE.Vector3(0.2, 0.2, 0.2), []);

  useFrame(() => {
    if (outerRef.current && innerRef.current && glowRef.current) {
      const scale = 1 + bassIntensity * 0.2;
      outerRef.current.scale.setScalar(scale);
      innerRef.current.scale.setScalar(scale * 0.9);
      glowRef.current.scale.setScalar(scale * 0.95);

      outerRef.current.rotation.y += 0.005;
      innerRef.current.rotation.y -= 0.003;

      glowRef.current.material.intensity =  Math.tanh(bassIntensity)*5;
    }
  });

  return (
    <group>
      <Icosahedron args={[2, 4]} ref={outerRef}>
        <MeshTransmissionMaterial
          color={"white"}
          wireframe
          samples={4}
          thickness={5}
          roughness={0.1}
          chromaticAberration={0.1}
          anisotropy={0.3}
          distortion={0.3}
          distortionScale={0.2}
          temporalDistortion={0.1}
          iridescence={1}
          iridescenceIOR={1}
          iridescenceThicknessRange={[0, 1400]}
          distort={distortionAmount}
        />
      </Icosahedron>

      <Icosahedron args={[1.8, 3]} ref={innerRef}>
        <meshPhongMaterial color="#fe2fee" shininess={100} opacity={0.7} transparent />
      </Icosahedron>

      <Icosahedron args={[1.9, 3]} ref={glowRef}>
        <glowShaderMaterial color={new THREE.Color(0.1, 0.31, 0.6)} intensity={20} transparent opacity={0.8} />
      </Icosahedron>
    </group>
  );
};

export default AudioSphere;