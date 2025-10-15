"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Fish } from "lucide-react";

interface SeaCreature {
  id: number;
  type: "fish" | "shrimp";
  x: number;
  y: number;
  direction: number;
  speed: number;
  size: number;
  color: string;
  opacity: number;
}

const fishColors = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEAA7", // Yellow
  "#DDA0DD", // Plum
];

const shrimpColors = [
  "#FF8C69", // Salmon
  "#FFB6C1", // Light pink
  "#F0E68C", // Khaki
  "#98FB98", // Pale green
];

interface AquariumProps {
  isActive: boolean;
}

export const Aquarium = ({ isActive }: AquariumProps) => {
  const [creatures, setCreatures] = useState<SeaCreature[]>([]);

  useEffect(() => {
    if (!isActive) {
      setCreatures([]);
      return;
    }

    // Create initial creatures
    const initialCreatures: SeaCreature[] = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      type: Math.random() > 0.6 ? "shrimp" : "fish",
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      direction: Math.random() * 360,
      speed: 0.5 + Math.random() * 1.5,
      size: 12 + Math.random() * 20,
      color: Math.random() > 0.6 ? 
        fishColors[Math.floor(Math.random() * fishColors.length)] :
        shrimpColors[Math.floor(Math.random() * shrimpColors.length)],
      opacity: 0.6 + Math.random() * 0.4,
    }));

    setCreatures(initialCreatures);

    // Animation loop
    const animate = () => {
      if (!isActive) return;

      setCreatures(prev => prev.map(creature => {
        const radians = (creature.direction * Math.PI) / 180;
        let newX = creature.x + Math.cos(radians) * creature.speed;
        let newY = creature.y + Math.sin(radians) * creature.speed;
        let newDirection = creature.direction;

        // Bounce off walls
        if (newX <= 0 || newX >= window.innerWidth) {
          newDirection = 180 - newDirection;
          newX = Math.max(0, Math.min(window.innerWidth, newX));
        }
        if (newY <= 0 || newY >= window.innerHeight) {
          newDirection = -newDirection;
          newY = Math.max(0, Math.min(window.innerHeight, newY));
        }

        // Random direction changes
        if (Math.random() < 0.02) {
          newDirection += (Math.random() - 0.5) * 60;
        }

        return {
          ...creature,
          x: newX,
          y: newY,
          direction: newDirection,
        };
      }));

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive]);

  const renderCreature = (creature: SeaCreature) => {
    const style = {
      position: "fixed" as const,
      left: `${creature.x}px`,
      top: `${creature.y}px`,
      transform: `translate(-50%, -50%) rotate(${creature.direction}deg)`,
      opacity: creature.opacity,
      zIndex: 1000,
      pointerEvents: "none" as const,
    };

    if (creature.type === "fish") {
      return (
        <div key={creature.id} style={style}>
          <svg
            width={creature.size}
            height={creature.size * 0.6}
            viewBox="0 0 40 24"
            fill={creature.color}
          >
            {/* Fish body */}
            <ellipse cx="20" cy="12" rx="15" ry="8" />
            {/* Fish tail */}
            <path d="M5 12 L0 8 L0 16 Z" />
            {/* Fish eye */}
            <circle cx="25" cy="10" r="2" fill="white" />
            <circle cx="25" cy="10" r="1" fill="black" />
            {/* Fish fin */}
            <path d="M15 8 L12 5 L9 8 Z" fill={creature.color} opacity="0.8" />
          </svg>
        </div>
      );
    } else {
      return (
        <div key={creature.id} style={style}>
          <svg
            width={creature.size * 0.8}
            height={creature.size}
            viewBox="0 0 20 25"
            fill={creature.color}
          >
            {/* Shrimp body segments */}
            <ellipse cx="10" cy="8" rx="6" ry="4" />
            <ellipse cx="10" cy="12" rx="6" ry="4" />
            <ellipse cx="10" cy="16" rx="6" ry="4" />
            <ellipse cx="10" cy="20" rx="6" ry="4" />
            {/* Shrimp tail */}
            <path d="M4 20 L0 22 L0 18 Z" />
            {/* Shrimp antennae */}
            <line x1="10" y1="6" x2="8" y2="3" stroke={creature.color} strokeWidth="1" />
            <line x1="10" y1="6" x2="12" y2="3" stroke={creature.color} strokeWidth="1" />
            {/* Shrimp eyes */}
            <circle cx="8" cy="6" r="1" fill="white" />
            <circle cx="12" cy="6" r="1" fill="white" />
          </svg>
        </div>
      );
    }
  };

  return (
    <>
      {/* Floating Creatures */}
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {creatures.map(renderCreature)}
        </div>
      )}
    </>
  );
}; 