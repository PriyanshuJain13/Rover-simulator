import { useTexture } from "@react-three/drei";
import { RepeatWrapping, ClampToEdgeWrapping } from "three";

export function Block({ position }) {
    const texture = useTexture("/sim/textures/ground.png");

    // Adjust texture wrapping
    texture.wrapS = texture.wrapT = ClampToEdgeWrapping; 
    texture.repeat.set(0.5, 0.5); 

    return (
      <group position={position}>
        {/* Solid block */}
        <mesh>
          <boxGeometry args={[1, 0.3, 1]} />
          <meshStandardMaterial 
            map={texture}
            roughness={0.5}
            metalness={0.1}
          />
        </mesh>

        {/* Top edge highlight */}
        {/* <mesh position={[0, 0.1, 1]}>
          <boxGeometry args={[1.001, 0.001, 1.001]} />
          <meshBasicMaterial 
            map={texture} 
            roughness={0.7} 
            metalness={0.1} 
          />
        </mesh> */}
      </group>
    );
}
