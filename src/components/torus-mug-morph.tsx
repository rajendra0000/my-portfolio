"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { Html, OrbitControls } from "@react-three/drei";

// Utility to interpolate between two arrays
function lerpArray(a: number[], b: number[], t: number) {
  return a.map((v, i) => v + (b[i] - v) * t);
}

// Utility to interpolate colors
function lerpColor(color1: string, color2: string, t: number) {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);
  return c1.clone().lerp(c2, t);
}

function generateTorusVertices(radialSegments = 64, tubularSegments = 32, R = 2, r = 0.7) {
  const positions: number[][] = [];
  for (let i = 0; i < radialSegments; i++) {
    const u = (i / radialSegments) * Math.PI * 2;
    for (let j = 0; j < tubularSegments; j++) {
      const v = (j / tubularSegments) * Math.PI * 2;
      const x = (R + r * Math.cos(v)) * Math.cos(u);
      const y = (R + r * Math.cos(v)) * Math.sin(u);
      const z = r * Math.sin(v);
      positions.push([x, y, z]);
    }
  }
  return positions;
}

function generateMugVertices(radialSegments = 64, tubularSegments = 32, R = 2, r = 0.7) {
  // Mug: deform torus into a cylinder with a handle
  const positions: number[][] = [];
  for (let i = 0; i < radialSegments; i++) {
    const u = (i / radialSegments) * Math.PI * 2;
    for (let j = 0; j < tubularSegments; j++) {
      const v = (j / tubularSegments) * Math.PI * 2;
      // Main body: cylinder
      let x = (R - r) * Math.cos(u);
      let y = (R - r) * Math.sin(u);
      let z = r * Math.sin(v);
      
      // Stretch the body vertically for the mug
      if (v < Math.PI) {
        z = -r + (2 * r * v) / Math.PI;
      }
      
      // Handle: create a smoother, more gradual transition
      const handleStart = Math.PI * 1.1;
      const handleEnd = Math.PI * 1.9;
      const handleWidth = handleEnd - handleStart;
      
      if (u > handleStart && u < handleEnd) {
        // Calculate handle influence with smooth falloff
        const handleProgress = (u - handleStart) / handleWidth;
        const handleInfluence = Math.sin(handleProgress * Math.PI); // Smooth bell curve
        
        // Handle vertical range
        const handleVStart = Math.PI * 0.6;
        const handleVEnd = Math.PI * 1.4;
        
        if (v > handleVStart && v < handleVEnd) {
          const vProgress = (v - handleVStart) / (handleVEnd - handleVStart);
          const vInfluence = Math.sin(vProgress * Math.PI); // Smooth vertical falloff
          
          // Calculate handle position
          const handleRadius = R + r * 0.3;
          const handleAngle = Math.PI * 1.5;
          const handleX = handleRadius * Math.cos(handleAngle);
          const handleY = handleRadius * Math.sin(handleAngle);
          const handleZ = r * Math.sin(v);
          
          // Apply smooth interpolation
          const totalInfluence = handleInfluence * vInfluence;
          x = x + (handleX - x) * totalInfluence;
          y = y + (handleY - y) * totalInfluence;
          z = z + (handleZ - z) * totalInfluence;
        }
      }
      
      positions.push([x, y, z]);
    }
  }
  return positions;
}

function generateIndices(radialSegments = 64, tubularSegments = 32) {
  const indices: number[] = [];
  for (let i = 0; i < radialSegments; i++) {
    for (let j = 0; j < tubularSegments; j++) {
      const a = i * tubularSegments + j;
      const b = ((i + 1) % radialSegments) * tubularSegments + j;
      const c = ((i + 1) % radialSegments) * tubularSegments + (j + 1) % tubularSegments;
      const d = i * tubularSegments + (j + 1) % tubularSegments;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }
  return indices;
}

function computeNormals(vertices: number[], indices: number[]) {
  const normals = new Float32Array(vertices.length);
  
  // Initialize normals to zero
  for (let i = 0; i < normals.length; i++) {
    normals[i] = 0;
  }
  
  // Compute face normals and accumulate vertex normals
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3;
    const b = indices[i + 1] * 3;
    const c = indices[i + 2] * 3;
    
    const v1 = new THREE.Vector3(vertices[a], vertices[a + 1], vertices[a + 2]);
    const v2 = new THREE.Vector3(vertices[b], vertices[b + 1], vertices[b + 2]);
    const v3 = new THREE.Vector3(vertices[c], vertices[c + 1], vertices[c + 2]);
    
    const edge1 = v2.clone().sub(v1);
    const edge2 = v3.clone().sub(v1);
    const faceNormal = edge1.cross(edge2).normalize();
    
    // Accumulate face normal to each vertex
    normals[a] += faceNormal.x;
    normals[a + 1] += faceNormal.y;
    normals[a + 2] += faceNormal.z;
    
    normals[b] += faceNormal.x;
    normals[b + 1] += faceNormal.y;
    normals[b + 2] += faceNormal.z;
    
    normals[c] += faceNormal.x;
    normals[c + 1] += faceNormal.y;
    normals[c + 2] += faceNormal.z;
  }
  
  // Normalize accumulated normals
  for (let i = 0; i < normals.length; i += 3) {
    const normal = new THREE.Vector3(normals[i], normals[i + 1], normals[i + 2]);
    normal.normalize();
    normals[i] = normal.x;
    normals[i + 1] = normal.y;
    normals[i + 2] = normal.z;
  }
  
  return normals;
}

export default function TorusMugMorph() {
  const [morph, setMorph] = useState(0);
  const meshRef = useRef<THREE.Mesh>(null);
  const radialSegments = 64;
  const tubularSegments = 32;
  const torusVerts = useMemo(() => generateTorusVertices(radialSegments, tubularSegments), []);
  const mugVerts = useMemo(() => generateMugVertices(radialSegments, tubularSegments), []);
  const indices = useMemo(() => generateIndices(radialSegments, tubularSegments), []);

  // Interpolate vertices
  const morphedVerts = useMemo(() => {
    return torusVerts.map((v, i) => lerpArray(v, mugVerts[i], morph));
  }, [torusVerts, mugVerts, morph]);

  // Flatten for BufferGeometry
  const flatVerts = useMemo(() => morphedVerts.flat(), [morphedVerts]);
  
  // Compute normals for smooth shading
  const normals = useMemo(() => computeNormals(flatVerts, indices), [flatVerts, indices]);

  // Calculate interpolated color
  const materialColor = useMemo(() => {
    return lerpColor("#fbbf24", "#ffffff", morph);
  }, [morph]);

  // Move useFrame into a child component
  function MorphingMesh({ meshRef, flatVerts, indices, normals, color }: { 
    meshRef: React.RefObject<THREE.Mesh>, 
    flatVerts: number[], 
    indices: number[], 
    normals: Float32Array,
    color: THREE.Color
  }) {
    useFrame(() => {
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.003; // Slower rotation for better viewing
      }
    });
    
    return (
      <mesh ref={meshRef} castShadow receiveShadow>
        <bufferGeometry attach="geometry">
          <bufferAttribute attach="attributes-position" args={[new Float32Array(flatVerts), 3]} />
          <bufferAttribute attach="attributes-normal" args={[normals, 3]} />
          <bufferAttribute attach="index" args={[new Uint16Array(indices), 1]} />
        </bufferGeometry>
        <meshStandardMaterial 
          color={color} 
          metalness={0.1} 
          roughness={0.3} 
          flatShading={false}
          envMapIntensity={0.5}
        />
      </mesh>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 600, margin: "0 auto" }}>
      {/* Morph control at the top */}
      <div style={{ 
        width: "100%", 
        background: "rgba(255,255,255,0.1)", 
        borderRadius: 12, 
        padding: 16, 
        marginBottom: 20,
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)", 
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.2)"
      }}>
        <label style={{ fontWeight: 500, fontSize: 16, display: "block", textAlign: "center", color: "#374151" }}>
          <div style={{ marginBottom: 8 }}>Morph: {morph.toFixed(2)}</div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={morph}
            onChange={e => setMorph(Number(e.target.value))}
            style={{ 
              width: "100%", 
              height: "8px", 
              borderRadius: "4px", 
              background: `linear-gradient(to right, #fbbf24 0%, ${lerpColor("#fbbf24", "#ffffff", 0.5).getHexString()} 50%, #ffffff 100%)`, 
              outline: "none", 
              cursor: "pointer",
              WebkitAppearance: "none",
              appearance: "none"
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 8, color: "#6b7280" }}>
            <span>Torus</span>
            <span>Mug</span>
          </div>
        </label>
      </div>
      
      {/* 3D model below the control */}
      <div style={{ height: 400 }}>
        <Canvas 
          camera={{ position: [0, 0, 8], fov: 50 }}
          shadows
          gl={{ antialias: true }}
        >
          {/* Enhanced lighting setup */}
          <ambientLight intensity={0.4} />
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={0.8}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <pointLight position={[-5, 5, 5]} intensity={0.3} />
          <pointLight position={[0, -5, 0]} intensity={0.2} />
          
          {/* Ground plane for shadows */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#f0f0f0" transparent opacity={0.3} />
          </mesh>
          
          <MorphingMesh 
            meshRef={meshRef} 
            flatVerts={flatVerts} 
            indices={indices} 
            normals={normals}
            color={materialColor}
          />
          
          {/* Orbit controls for interactive viewing */}
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={15}
            autoRotate={false}
          />
        </Canvas>
      </div>
    </div>
  );
} 