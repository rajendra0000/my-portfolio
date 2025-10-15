'use client';

import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

// Enhanced pLDDT scoring that's more realistic to AlphaFold
const generateRealisticPLDDTScores = (morphFactor: number) => {
  const scores = [];
  
  for (let i = 0; i < 50; i++) {
    const t = i / 49;
    
    // Base confidence increases as protein folds
    let baseScore = 30 + morphFactor * 60;
    
    // Add structural confidence based on position
    // Helices and sheets get higher confidence
    const structuralConfidence = Math.sin(t * 4 * Math.PI) * 0.3 + 
                                Math.cos(t * 3 * Math.PI) * 0.2;
    
    // Loop regions (unstructured) have lower confidence
    const loopPenalty = Math.sin(t * 8 * Math.PI) * 0.4;
    
    // Terminal regions often have lower confidence
    const terminalPenalty = (t < 0.1 || t > 0.9) ? 0.3 : 0;
    
    let finalScore = baseScore + structuralConfidence * 20 - loopPenalty * 15 - terminalPenalty * 20;
    finalScore = Math.max(0, Math.min(100, finalScore));
    
    scores.push(finalScore);
  }
  
  return scores;
};

// AlphaFold color scheme based on pLDDT (Apple-style monochromatic blue)
const getAlphaFoldColor = (plddt: number) => {
  if (plddt >= 90) return '#007AFF'; // Apple Blue
  if (plddt >= 70) return '#5AC8FA'; // Light Blue
  if (plddt >= 50) return '#BCE3F7'; // Lighter Blue
  return '#EBF7FF'; // Very Light Blue
};

// Animation controller component (inside Canvas)
const AnimationController = ({ 
  isPlaying, 
  onMorphFactorChange, 
  onAnimationComplete 
}: { 
  isPlaying: boolean;
  onMorphFactorChange: (factor: number) => void;
  onAnimationComplete: () => void;
}) => {
  const currentMorphFactor = useRef(0);
  
  useFrame(() => {
    if (isPlaying) {
      const next = currentMorphFactor.current + 0.01;
      if (next >= 1) {
        onMorphFactorChange(1);
        onAnimationComplete();
      } else {
        currentMorphFactor.current = next;
        onMorphFactorChange(next);
      }
    }
  });
  
  return null; // This component doesn't render anything
};

// Enhanced protein backbone component with smooth curves
const ProteinBackbone = ({ morphFactor }: { morphFactor: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Generate protein structure with realistic pLDDT scores
  const { positions, colors, plddtScores } = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const plddtScores = generateRealisticPLDDTScores(morphFactor);
    
    // Create a more complex protein structure with realistic secondary structure
    for (let i = 0; i < 50; i++) {
      const t = i / 49;
      const morphT = t * morphFactor;
      
      // Unfolded state: straight line
      const unfoldedX = (t - 0.5) * 10;
      const unfoldedY = 0;
      const unfoldedZ = 0;
      
      // Folded state: realistic protein structure with alpha-helices and beta-sheets
      // Alpha-helix regions (residues 10-25 and 35-45)
      let foldedX, foldedY, foldedZ;
      
      if (t >= 0.2 && t <= 0.5) {
        // Alpha-helix 1
        const helixT = (t - 0.2) / 0.3;
        foldedX = Math.sin(helixT * 4 * Math.PI) * 2;
        foldedY = Math.cos(helixT * 4 * Math.PI) * 2;
        foldedZ = helixT * 3;
      } else if (t >= 0.7 && t <= 0.9) {
        // Alpha-helix 2
        const helixT = (t - 0.7) / 0.2;
        foldedX = Math.sin(helixT * 4 * Math.PI) * 1.5 + 1;
        foldedY = Math.cos(helixT * 4 * Math.PI) * 1.5 - 1;
        foldedZ = helixT * 2 - 2;
      } else {
        // Loop regions
        foldedX = Math.sin(t * 6 * Math.PI) * 1;
        foldedY = Math.cos(t * 5 * Math.PI) * 1;
        foldedZ = Math.sin(t * 3 * Math.PI) * 0.5;
      }
      
      // Interpolate between unfolded and folded
      const x = unfoldedX * (1 - morphT) + foldedX * morphT;
      const y = unfoldedY * (1 - morphT) + foldedY * morphT;
      const z = unfoldedZ * (1 - morphT) + foldedZ * morphT;
      
      positions.push(x, y, z);
      
      // Color based on pLDDT score
      const plddt = plddtScores[i];
      const color = new THREE.Color(getAlphaFoldColor(plddt));
      colors.push(color.r, color.g, color.b);
    }
    
    return { positions, colors, plddtScores };
  }, [morphFactor]);
  
  // Create smooth curve from positions
  const curve = useMemo(() => {
    const points = [];
    for (let i = 0; i < positions.length; i += 3) {
      points.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
    }
    return new THREE.CatmullRomCurve3(points);
  }, [positions]);
  
  // Create tube geometry from curve
  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, 0.15, 8, false);
  }, [curve]);
  
  // Create vertex colors for the tube
  const tubeColors = useMemo(() => {
    const tubeColors = [];
    const segments = 64;
    
    for (let i = 0; i < segments; i++) {
      const t = i / (segments - 1);
      const colorIndex = Math.floor(t * (colors.length / 3 - 1));
      const baseIndex = colorIndex * 3;
      
      tubeColors.push(colors[baseIndex], colors[baseIndex + 1], colors[baseIndex + 2]);
    }
    
    return tubeColors;
  }, [colors]);
  
  const geometry = useMemo(() => {
    const geo = tubeGeometry.clone();
    geo.setAttribute('color', new THREE.Float32BufferAttribute(tubeColors, 3));
    return geo;
  }, [tubeGeometry, tubeColors]);
  
  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        vertexColors
        transparent
        opacity={0.9}
        roughness={0.2}
        metalness={0.1}
        clearcoat={0.3}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
};

// Enhanced side chains component with better materials
const SideChains = ({ morphFactor }: { morphFactor: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const sideChains = useMemo(() => {
    const chains = [];
    const plddtScores = generateRealisticPLDDTScores(morphFactor);
    
    for (let i = 0; i < 50; i += 2) { // Every other residue
      const t = i / 49;
      const morphT = t * morphFactor;
      
      // Base position (same as backbone)
      let baseX, baseY, baseZ;
      
      if (t >= 0.2 && t <= 0.5) {
        // Alpha-helix 1
        const helixT = (t - 0.2) / 0.3;
        baseX = (t - 0.5) * 10 * (1 - morphT) + Math.sin(helixT * 4 * Math.PI) * 2 * morphT;
        baseY = 0 * (1 - morphT) + Math.cos(helixT * 4 * Math.PI) * 2 * morphT;
        baseZ = 0 * (1 - morphT) + helixT * 3 * morphT;
      } else if (t >= 0.7 && t <= 0.9) {
        // Alpha-helix 2
        const helixT = (t - 0.7) / 0.2;
        baseX = (t - 0.5) * 10 * (1 - morphT) + (Math.sin(helixT * 4 * Math.PI) * 1.5 + 1) * morphT;
        baseY = 0 * (1 - morphT) + (Math.cos(helixT * 4 * Math.PI) * 1.5 - 1) * morphT;
        baseZ = 0 * (1 - morphT) + (helixT * 2 - 2) * morphT;
      } else {
        // Loop regions
        baseX = (t - 0.5) * 10 * (1 - morphT) + Math.sin(t * 6 * Math.PI) * 1 * morphT;
        baseY = 0 * (1 - morphT) + Math.cos(t * 5 * Math.PI) * 1 * morphT;
        baseZ = 0 * (1 - morphT) + Math.sin(t * 3 * Math.PI) * 0.5 * morphT;
      }
      
      // Side chain offset (more realistic)
      const offsetX = Math.sin(i * 0.5) * 0.5;
      const offsetY = Math.cos(i * 0.3) * 0.5;
      const offsetZ = Math.sin(i * 0.7) * 0.5;
      
      const x = baseX + offsetX * morphT;
      const y = baseY + offsetY * morphT;
      const z = baseZ + offsetZ * morphT;
      
      const plddt = plddtScores[i];
      const color = getAlphaFoldColor(plddt);
      
      chains.push({ x, y, z, color, plddt });
    }
    
    return chains;
  }, [morphFactor]);
  
  return (
    <group ref={groupRef}>
      {sideChains.map((chain, index) => (
        <mesh key={index} position={[chain.x, chain.y, chain.z]} castShadow>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshPhysicalMaterial
            color={chain.color}
            transparent
            opacity={0.8}
            roughness={0.1}
            metalness={0.2}
            clearcoat={0.5}
            clearcoatRoughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
};

// Enhanced PAE Plot Component with more realistic AlphaFold-like data
const PAEPlot = ({ morphFactor }: { morphFactor: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useMemo(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Generate more realistic PAE data that changes with folding
    const size = 50;
    const paeData = Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) => {
        // Base error decreases as protein folds
        const baseError = 15 - morphFactor * 10;
        
        // Structural domains have lower error (better prediction)
        const domain1 = (i >= 10 && i <= 25) && (j >= 10 && j <= 25);
        const domain2 = (i >= 35 && i <= 45) && (j >= 35 && j <= 45);
        
        let error = baseError;
        if (domain1 || domain2) {
          error *= 0.3; // Much lower error in structured regions
        }
        
        // Add some noise
        const noise = (Math.random() - 0.5) * 3;
        error = Math.max(0, Math.min(20, error + noise));
        
        return error;
      })
    );
    
    // Draw PAE heatmap with AlphaFold-like coloring
    const cellSize = canvas.width / size;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const pae = paeData[i][j];
        
            // Apple-style PAE color scheme: light blue (low error) to darker blue (high error)
    const normalizedError = pae / 20;
    const r = Math.round(235 * (1 - normalizedError) + 0 * normalizedError); // EB to 00
    const g = Math.round(247 * (1 - normalizedError) + 122 * normalizedError); // F7 to 7A
    const b = Math.round(255 * (1 - normalizedError) + 255 * normalizedError); // FF to FF
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
    
    // Add labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Residue i', canvas.width / 2 - 40, canvas.height - 10);
    ctx.save();
    ctx.translate(20, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Residue j', 0, 0);
    ctx.restore();
    
  }, [morphFactor]);
  
  return (
    <div className="bg-white rounded-2xl p-8 flex flex-col items-center max-w-xl mx-auto shadow-sm border border-gray-100">
      <h3 className="text-gray-900 text-xl font-semibold mb-4 text-center">Predicted Aligned Error (PAE)</h3>
      <canvas
        ref={canvasRef}
        width={350}
        height={350}
        className="border border-gray-200 rounded-xl shadow-sm"
      />
      <div className="flex justify-between text-sm text-gray-500 mt-3 w-full">
        <span>0 Å</span>
        <span>20 Å</span>
      </div>
      <div className="flex justify-between text-sm text-gray-500 mt-1 w-full">
        <span className="text-blue-400">Low Error</span>
        <span className="text-blue-600">High Error</span>
      </div>
      <p className="text-sm text-gray-600 mt-6 text-center max-w-md leading-relaxed">
        The PAE plot shows how confident the model is about the relative positions of different parts of the protein. Light blue means the model is very sure, darker blue means less certain.
      </p>
    </div>
  );
};

// Main Protein Folding Component
const ProteinFolding = () => {
  const [morphFactor, setMorphFactor] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleReset = () => {
    setMorphFactor(0);
    setIsPlaying(false);
  };
  
  const handleMorphFactorChange = (newFactor: number) => {
    setMorphFactor(newFactor);
  };
  
  const handleAnimationComplete = () => {
    setIsPlaying(false);
  };
  
  // Calculate current pLDDT statistics
  const currentPLDDTScores = generateRealisticPLDDTScores(morphFactor);
  const averagePLDDT = Math.round(currentPLDDTScores.reduce((a, b) => a + b, 0) / currentPLDDTScores.length);
  const highConfidenceCount = currentPLDDTScores.filter(score => score >= 70).length;
  
  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Protein Folding Visualization
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
          Interactive 3D model showing how a protein chain folds into its functional structure. 
          Colors indicate confidence levels in the prediction.
        </p>
      </div>
      
      {/* Clean Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayPause}
            className="px-6 py-2 bg-gray-800 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-700 dark:hover:bg-gray-200 transition-all duration-200 font-medium text-sm"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 font-medium text-sm"
          >
            Reset
          </button>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Unfolded</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={morphFactor}
            onChange={(e) => setMorphFactor(parseFloat(e.target.value))}
            className="w-full sm:w-40 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Folded</span>
        </div>
      </div>
      
      {/* Clean Legend */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-8 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Confidence Levels
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 bg-[#007AFF] rounded-full"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Very High</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 bg-[#5AC8FA] rounded-full"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">High</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 bg-[#BCE3F7] rounded-full"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Medium</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 bg-[#EBF7FF] rounded-full"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Low</span>
          </div>
        </div>
      </div>
      
      {/* 3D Visualization with Light Background */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-8">
        <div className="h-96">
          <Canvas
            camera={{ position: [0, 0, 15], fov: 50 }}
            style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)' }}
            shadows
          >
            {/* Clean lighting setup */}
            <ambientLight intensity={0.6} />
            <directionalLight 
              position={[10, 10, 10]} 
              intensity={0.8}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <pointLight position={[-10, -10, -10]} intensity={0.3} />
            
            <ProteinBackbone morphFactor={morphFactor} />
            <SideChains morphFactor={morphFactor} />
            
            <AnimationController 
              isPlaying={isPlaying}
              onMorphFactorChange={handleMorphFactorChange}
              onAnimationComplete={handleAnimationComplete}
            />
            
            <OrbitControls 
              enablePan={true} 
              enableZoom={true} 
              enableRotate={true}
              minDistance={5}
              maxDistance={25}
              autoRotate={false}
            />
          </Canvas>
        </div>
      </div>
      
      {/* Quick Stats Below Visualization */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Structure Analysis
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-gray-50 rounded-2xl">
            <div className="text-3xl font-bold text-gray-900">{50}</div>
            <div className="text-sm text-gray-600 font-medium">Residues</div>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-2xl">
            <div className="text-3xl font-bold text-blue-600">{Math.round(morphFactor * 100)}%</div>
            <div className="text-sm text-gray-600 font-medium">Progress</div>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-2xl">
            <div className="text-3xl font-bold text-blue-500">{highConfidenceCount}</div>
            <div className="text-sm text-gray-600 font-medium">High Confidence</div>
          </div>
          <div className="text-center p-6 bg-gray-50 rounded-2xl">
            <div className="text-3xl font-bold text-blue-700">{averagePLDDT}</div>
            <div className="text-sm text-gray-600 font-medium">Avg Score</div>
          </div>
        </div>
      </div>
      
      {/* PAE plot moved to a new section below */}
      <div className="mt-16">
        <PAEPlot morphFactor={morphFactor} />
      </div>
    </div>
  );
};

export default ProteinFolding; 