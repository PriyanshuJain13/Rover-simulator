import React, { useRef, Suspense, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sky, useGLTF } from "@react-three/drei";
import { Block } from "./components/Block";

const WS_URL = "ws://" + window.location.host + "/sim";

const WebSocketOverlay = ({ data }) => {
  const {
    mode = 'Locked',
    throttle = 0,
    dir_x = 0,
    dir_y = 0,
    dir_rot = 0
  } = data;

  let angle = Math.atan2(dir_y, dir_x) * (180 / Math.PI);
  if (angle < 0) {
    angle += 360; 
  }

  const overlayStyle = {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    padding: '0.8rem',
    borderRadius: '0.5rem',
    fontFamily: 'monospace',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',  // For Safari support
  };

  const headerStyle = {
    fontSize: '1.125rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem'
  };
  const ipStyle = {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem'
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '0.25rem'
  };

  const valueStyle = {
    fontWeight: 'bold'
  };

  return (
    <div style={overlayStyle}>
      <h5 style={ipStyle}>IP Address :{window.location.host}</h5>
      <h3 style={headerStyle}>Rover Movements</h3>
      <div>
        <div style={rowStyle}>
          <span>Mode:</span>
          <span style={valueStyle}>{mode}</span>
        </div>
        <div style={rowStyle}>
          <span>Throttle:</span>
          <span style={valueStyle}>{throttle.toFixed(2)}</span>
        </div>
        <div style={rowStyle}>
          <span>Angle:</span>
          <span style={valueStyle}>{angle.toFixed(0)}°</span>
        </div>
        {/* <div style={rowStyle}>
          <span>Direction Y:</span>
          <span style={valueStyle}>{dir_y.toFixed(2)}</span>
        </div> */}
        <div style={rowStyle}>
          <span>Rotation:</span>
          <span style={valueStyle}>{dir_rot.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

function CarBody() {
  const { scene } = useGLTF("/sim/new_model.glb");
  return (
    <group>
      <primitive object={scene} scale={5} />
    </group>
  );
}

function Surface({ movement }) {
  const tileSize = 10;
  const rotationSpeed = 0.001;
  const [offset, setOffset] = useState([0, 0]);
  const [angle, setAngle] = useState(0);

  useFrame(() => {
    // Update rotation
    
    setAngle((prevAngle) => prevAngle + movement.rotation * rotationSpeed);

    setOffset((prev) => {
      let [ox, oz] = prev;
      const speed = 0.2;
      const factor = 100;

      if (movement.forward === 0 && movement.left === 0) {
        // Basic movement in car's current direction
        ox -= speed * (movement.speed / factor) * Math.cos(angle);
        oz -= speed * (movement.speed / factor) * Math.sin(angle);
      } else {
        // Convert movement into a direction vector
        const moveX = movement.left / factor; // Left/Right movement
        const moveZ = movement.forward / factor; // Forward/Backward movement

        // Apply rotation transformation
        const rotatedX = moveX * Math.cos(angle) - moveZ * Math.sin(angle);
        const rotatedZ = moveX * Math.sin(angle) + moveZ * Math.cos(angle);

        // Update offset
        ox -= speed * rotatedX * (movement.speed / factor);
        oz -= speed * rotatedZ * (movement.speed / factor);
      }

      // Wrap around logic
      if (ox > tileSize / 4) ox -= tileSize;
      if (ox < -tileSize / 4) ox += tileSize;
      if (oz > tileSize / 4) oz -= tileSize;
      if (oz < -tileSize / 4) oz += tileSize;

      return [ox, oz];
    });
  });

  const blocks = [];
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      blocks.push(
        <group key={`${x}-${z}`} position={[x * tileSize + offset[0], -0.5, z * tileSize + offset[1]]}>
          {Array.from({ length: 10 }, (_, i) =>
            Array.from({ length: 10 }, (_, j) => (
              <Block key={`${i}-${j}`} position={[i - 5, 0, j - 5]} />
            ))
          )}
        </group>
      );
    }
  }

  return <group rotation={[0, angle, 0]}>{blocks}</group>;
}


function MecanumWheel({ position, rotation, flag, id, movement, angle }) {
  const wheelRef = useRef();
  const { scene } = flag
    ? useGLTF("/sim/optimized_model.glb")
    : useGLTF("/sim/optimized_model2.glb");
  const wheelScene = scene.clone(true);

  const speed = 0.2;

  useFrame(() => {
    // Transform movement vectors based on current rotation
    const rotatedForward = movement.forward * Math.cos(angle) - movement.left * Math.sin(angle);
    const rotatedLeft = movement.forward * Math.sin(angle) + movement.left * Math.cos(angle);

    let v2 = rotatedLeft + rotatedForward;
    let v1 = rotatedLeft - rotatedForward;
    let v4 = rotatedLeft - rotatedForward;
    let v3 = rotatedLeft + rotatedForward;


    let vMax = Math.max(Math.abs(v1), Math.abs(v2), Math.abs(v3), Math.abs(v4));
    if (vMax > 1) {
      v1 /= vMax;
      v2 /= vMax;
      v3 /= vMax;
      v4 /= vMax;
    }

    if (wheelRef.current) {
      if (movement.rotation != 0) {
        if (movement.rotation > 0) {
          if (id == 1 || id == 4) {
            wheelRef.current.rotation.y += speed * (Math.abs(movement.rotation) * 0.01);
          } else {
            wheelRef.current.rotation.y -= speed * (Math.abs(movement.rotation) * 0.01);
          }
        } else {
          if (id == 1 || id == 4) {
            wheelRef.current.rotation.y -= speed * (Math.abs(movement.rotation) * 0.01);
          } else {
            wheelRef.current.rotation.y += speed * (Math.abs(movement.rotation) * 0.01);
          }
        }
      } else if (movement.forward == 0 && movement.left == 0) {
        const rotationValue = speed * (movement.speed / 100);
        switch (id) {
          case 1:
          case 2:
            wheelRef.current.rotation.y -= rotationValue;
            break;
          case 3:
          case 4:
            wheelRef.current.rotation.y += rotationValue;
            break;
        }
      } else {
        switch (id) {
          case 1:
            wheelRef.current.rotation.y -= speed * v1 * (movement.speed / 100);
            break;
          case 2:
            wheelRef.current.rotation.y -= speed * v2 * (movement.speed / 100);
            break;
          case 3:
            wheelRef.current.rotation.y += speed * v3 * (movement.speed / 100);
            break;
          case 4:
            wheelRef.current.rotation.y += speed * v4 * (movement.speed / 100);
            break;
        }
      }
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <group position={[0, 0, 0]}>
        <group ref={wheelRef}>
          <group position={[0, -1, 0]}>
            <primitive object={wheelScene} scale={0.02} />
          </group>
        </group>
      </group>
    </group>
  );
}

function Wheels({ movement, angle }) {
  const wheelConfigs = [
    {
      position: [0.46, -0.1, 1.73],
      rotation: [Math.PI / 2, 0, 0],
      flag: false,
      id: 1,
    },
    {
      position: [0.46, -0.1, 0.5],
      rotation: [Math.PI / 2, 0, 0],
      flag: true,
      id: 2,
    },
    {
      position: [-0.5, -0.1, -0.55],
      rotation: [-Math.PI / 2, 0, 0],
      flag: true,
      id: 3,
    },
    {
      position: [-0.5, -0.1, -1.78],
      rotation: [-Math.PI / 2, 0, 0],
      flag: false,
      id: 4,
    },
  ];

  return (
    <group>
      {wheelConfigs.map((config, index) => (
        <Suspense key={index} fallback={null}>
          <MecanumWheel {...config} movement={movement} angle={angle} />
        </Suspense>
      ))}
    </group>
  );
}

function useMovementControls(obj) {
  const [currentMode, setCurrentMode] = useState('locked');
  const modeRef = useRef('locked');
  const [movement, setMovement] = useState({
    forward: 0,
    left: 0,
    speed: 0,
    rotation: 0,
  });

  useEffect(() => {
    if ('mode' in obj) {
      modeRef.current = obj.mode;
      setCurrentMode(obj.mode);
    }

    if (modeRef.current !== 'locked') {
      if ('throttle' in obj) {
        setMovement((prev) => ({
          ...prev,
          speed: obj.throttle,
        }));
      }
      if ('dir_x' in obj && 'dir_y' in obj) {
        setMovement((prev) => ({
          ...prev,
          forward: obj.dir_x,
          left: obj.dir_y,
        }));
      }
      if ('dir_rot' in obj) {
        setMovement((prev) => ({
          ...prev,
          rotation: obj.dir_rot,
        }));
      }
    } else {
      setMovement({
        forward: 0,
        left: 0,
        speed: 0,
        rotation: 0,
      });
    }
  }, [obj]);

  return movement;
}

function Vehicle({ movement }) {
  const [angle, setAngle] = useState(0);
  
  useEffect(() => {
    setAngle(prev => prev + movement.rotation * 0.001);
  }, [movement.rotation]);

  return (
    <group>
      <Suspense fallback={null}>
        <CarBody />
      </Suspense>
      <Wheels movement={movement} angle={angle} />
    </group>
  );
}

function Scene(data) {
  const movement = useMovementControls(data);

  return (
    <Canvas gl={{ antialias: false, powerPreference: "high-performance" }} camera={{ position: [-10, 8, -5], fov: 20 }}>
      <Sky
        sunPosition={[10, 20, 100]}
        turbidity={10}
        rayleigh={5}
        mieCoefficient={0.5}
        mieDirectionalG={0.95}
      />
      <ambientLight intensity={0.9} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, 10, -5]} intensity={0.9} />
      <hemisphereLight skyColor={"#b1e1ff"} groundColor={"#000000"} intensity={0.5} />

      <OrbitControls enableDamping />
      <Surface movement={movement} />
      <Vehicle movement={movement} />
    </Canvas>
  );
}

export default function App() {
  const ws = useRef(null);
  const [wsData, setWsData] = useState({});

  useEffect(() => {
    console.log("Ws data updated:", wsData);
  }, [wsData]);

  useEffect(() => {
    if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received message:", data);
          setWsData((prevData) => ({
            ...prevData,
            ...data,
          }));
        } catch (error) {
          console.error("Error parsing WebSocket message:", event.data);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected, attempting reconnect...");
        setTimeout(() => {
          if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
            ws.current = new WebSocket(WS_URL);
          }
        }, 3000);
      };
    }

    return () => {
      ws.current?.close();
    };
  }, []);

  const containerStyle = {
    width: '100vw',
    height: '100vh',
    position: 'relative'
  };

  return (
    
    <div style={containerStyle}>
      <Scene {...wsData} />
      <WebSocketOverlay data={wsData} />
    </div>
  );
}

useGLTF.preload("/sim/optimized_model2.glb");
useGLTF.preload("/sim/optimized_model.glb");
useGLTF.preload("/sim/new_model.glb");