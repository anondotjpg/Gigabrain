import React, { useEffect, useRef, useContext, useCallback, useState } from 'react';
import * as THREE from 'three';
import { ViewerContext } from "../features/vrmViewer/viewerContext";
import { buildUrl } from "@/utils/buildUrl";
import { createGlobalStyle } from 'styled-components';
import { createRoot } from 'react-dom/client';
import HyperTextDemo from './hyper';

const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background-color: #FFFFFF;
  }
`;

interface MousePosition {
  x: number;
  y: number;
}

interface Computer3DWithVrmProps {
  selectedVrm: number;
}

const Computer3DWithVrm: React.FC<Computer3DWithVrmProps> = ({ selectedVrm }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const vrmCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number | null>(null);
  const renderTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const hyperTextContainerRef = useRef<HTMLDivElement | null>(null);
  const reactRootRef = useRef<any>(null);
  
  const { viewer } = useContext(ViewerContext);
  const [isLoading, setIsLoading] = useState(true);

  const AVATAR_SAMPLE_B_VRM_URL = "tard.vrm";
  const AVATAR_SAMPLE_2_VRM_URL = "npc.vrm";
  const AVATAR_SAMPLE_3_VRM_URL = "blank.vrm";
  const AVATAR_SAMPLE_4_VRM_URL = "bot4.vrm";

  const getVrmUrl = (vrmNumber: number) => {
    switch (vrmNumber) {
      case 1:
        return AVATAR_SAMPLE_B_VRM_URL;
      case 2:
        return AVATAR_SAMPLE_2_VRM_URL;
      case 3:
        return AVATAR_SAMPLE_3_VRM_URL;
      case 4:
        return AVATAR_SAMPLE_4_VRM_URL;
      default:
        return AVATAR_SAMPLE_B_VRM_URL;
    }
  };

  const loadVrm = async (url: string) => {
    setIsLoading(true);
    try {
      await viewer.loadVrm(url);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading VRM:', error);
      setIsLoading(false);
    }
  };

  // Function to capture HTML element as canvas image
  const htmlToCanvas = (element: HTMLElement, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use html2canvas-like approach but simplified for our use case
    const rect = element.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Create an SVG with foreign object containing our HTML
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', rect.width.toString());
    svg.setAttribute('height', rect.height.toString());
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    foreignObject.setAttribute('width', '100%');
    foreignObject.setAttribute('height', '100%');
    
    // Clone the element and its styles
    const clonedElement = element.cloneNode(true) as HTMLElement;
    foreignObject.appendChild(clonedElement);
    svg.appendChild(foreignObject);

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    return new Promise<void>((resolve) => {
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    });
  };

  const vrmCanvasCallback = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas && viewer) {
        vrmCanvasRef.current = canvas;
        // Set canvas size
        canvas.width = 512;
        canvas.height = 384;
        viewer.setup(canvas);
        
        const initialVrmUrl = getVrmUrl(selectedVrm);
        loadVrm(buildUrl(initialVrmUrl));

        canvas.addEventListener("dragover", (event) => event.preventDefault());
        canvas.addEventListener("drop", (event) => {
          event.preventDefault();
          const files = event.dataTransfer?.files;
          if (!files) return;

          const file = files[0];
          if (file?.name.endsWith(".vrm")) {
            const blob = new Blob([file], { type: "application/octet-stream" });
            const url = window.URL.createObjectURL(blob);
            loadVrm(url);
          }
        });
      }
    },
    [viewer, selectedVrm]
  );

  useEffect(() => {
    if (viewer && selectedVrm) {
      const vrmUrl = getVrmUrl(selectedVrm);
      loadVrm(buildUrl(vrmUrl));
    }
  }, [selectedVrm, viewer]);

  // Set up the hidden HyperTextDemo component
  useEffect(() => {
    // Create container for HyperTextDemo
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '200px';
    container.style.height = '100px';
    container.style.background = 'transparent';
    container.style.color = '#00ff00';
    container.style.fontFamily = 'monospace';
    container.style.fontSize = '14px';
    document.body.appendChild(container);
    
    hyperTextContainerRef.current = container;

    // Render HyperTextDemo into the container
    const root = createRoot(container);
    reactRootRef.current = root;
    root.render(<HyperTextDemo />);

    return () => {
      if (reactRootRef.current) {
        reactRootRef.current.unmount();
      }
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Store refs
    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Create canvas for compositing VRM and HyperText
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = 512;
    compositeCanvas.height = 384;
    const canvasTexture = new THREE.CanvasTexture(compositeCanvas);
    canvasTexture.flipY = false;

    // Create overlay canvas for HyperText
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = 512;
    overlayCanvas.height = 384;
    overlayCanvasRef.current = overlayCanvas;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(-1, 1, 1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00ff88, 0.5, 10);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);

    // Computer group
    const computerGroup = new THREE.Group();
    scene.add(computerGroup);

    // Materials
    const monitorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    const blackBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });

    // Monitor
    const monitorGeometry = new THREE.BoxGeometry(2, 1.5, 0.1);
    const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
    monitor.position.set(0, 0.35, 0);
    monitor.castShadow = true;
    computerGroup.add(monitor);

    // Screen with composite texture
    const screenGeometry = new THREE.BoxGeometry(1.8, 1.3, 0.05);
    const screenMaterial = new THREE.MeshBasicMaterial({ 
      map: canvasTexture,
      color: 0xffffff
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 0.35, 0.08);
    computerGroup.add(screen);

    // Monitor base
    const baseGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.2, 32);
    const base = new THREE.Mesh(baseGeometry, blackBaseMaterial);
    base.position.set(0, -0.5, 0);
    base.castShadow = true;
    computerGroup.add(base);

    // Monitor stand
    const standGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.3);
    const stand = new THREE.Mesh(standGeometry, baseMaterial);
    stand.position.set(0, -0.15, -0.2);
    stand.castShadow = true;
    computerGroup.add(stand);

    // Mousepad with overlay system
    const mousepadCanvas = document.createElement('canvas');
    mousepadCanvas.width = 512;
    mousepadCanvas.height = 256;
    const mousepadTexture = new THREE.CanvasTexture(mousepadCanvas);
    mousepadTexture.flipY = false;

    // Create mousepad base (30% wider)
    const mousepadGeometry = new THREE.BoxGeometry(1.95, 0.005, 0.8);
    const mousepadBaseMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2a2a2a,
      shininess: 10
    });
    const mousepadBase = new THREE.Mesh(mousepadGeometry, mousepadBaseMaterial);
    mousepadBase.position.set(0.1, -0.597, 0.8);
    mousepadBase.castShadow = true;
    mousepadBase.receiveShadow = true;
    computerGroup.add(mousepadBase);

    // Create mousepad surface with canvas texture (30% wider)
    const mousepadSurfaceGeometry = new THREE.PlaneGeometry(1.885, 0.75);
    const mousepadSurfaceMaterial = new THREE.MeshLambertMaterial({ 
      map: mousepadTexture,
      color: 0xffffff,
      transparent: true
    });
    
    const mousepadSurface = new THREE.Mesh(mousepadSurfaceGeometry, mousepadSurfaceMaterial);
    mousepadSurface.rotation.x = -Math.PI / 2;
    mousepadSurface.position.set(0.1, -0.594, 0.8);
    mousepadSurface.receiveShadow = true;
    computerGroup.add(mousepadSurface);

    // Function to render mousepad with x.png overlay
    const renderMousepadOverlay = () => {
      const ctx = mousepadCanvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, 512, 256);
      
      // Fill with mousepad base color
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 256);
      
      // Load and draw x.png in bottom left corner
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw x.png in bottom left corner (50% smaller, flipped horizontally)
        const xSize = 30; // Size of the x logo (50% smaller than 80)
        // Position at bottom left: x=20 from left, y=20 from bottom
        ctx.save();
        ctx.scale(-1, 1); // Flip horizontally
        ctx.drawImage(img, -(10 + xSize), 10, xSize, xSize);
        ctx.restore();
        mousepadTexture.needsUpdate = true;
      };
      img.onerror = () => {
        // Fallback: draw a simple X shape in bottom left
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(20, 20);
        ctx.lineTo(60, 60);
        ctx.moveTo(60, 20);
        ctx.lineTo(20, 60);
        ctx.stroke();
        mousepadTexture.needsUpdate = true;
      };
      img.src = '/xai.png';
    };

    // Initial mousepad render
    renderMousepadOverlay();

    // Keyboard
    const keyboardGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.4);
    const kbMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2a2a2a,
      shininess: 60
    });

    const keyboard = new THREE.Mesh(keyboardGeometry, kbMaterial);
    keyboard.position.set(0, -0.565, 0.8);
    keyboard.castShadow = true;

    // Green underglow strip
    const glowGeom = new THREE.BoxGeometry(1.15, 0.004, 0.02);
    const glowMat = new THREE.MeshPhongMaterial({ 
      color: 0x1DA1F2,
      emissive: 0x1DA1F2
    });
    const bottomGlow = new THREE.Mesh(glowGeom, glowMat);
    bottomGlow.position.set(0, 0.027, 0.19);
    keyboard.add(bottomGlow);

    // Keys
    const keyGeom = new THREE.BoxGeometry(0.04, 0.008, 0.04);
    const keyMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 15; col++) {
        const key = new THREE.Mesh(keyGeom, keyMat);
        key.position.set(-0.52 + (col * 0.075), 0.029, -0.14 + (row * 0.07));
        key.castShadow = true;
        keyboard.add(key);
      }
    }

    // Spacebar
    const spaceGeom = new THREE.BoxGeometry(0.3, 0.004, 0.035);
    const spacebar = new THREE.Mesh(spaceGeom, keyMat);
    spacebar.position.set(0, 0.04, 0.16);
    spacebar.castShadow = true;
    keyboard.add(spacebar);

    // Keyboard animation
    const animateKB = () => {
      const t = Date.now() * 0.002;
      const glow = (Math.sin(t) + 1) * 0.3;
      bottomGlow.material.emissive.setHSL(0.33, 1, glow);
      requestAnimationFrame(animateKB);
    };
    animateKB();

    computerGroup.add(keyboard);

    // Mouse
    const mouseGeometry = new THREE.BoxGeometry(0.15, 0.03, 0.25);
    const mouseMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const mouseMesh = new THREE.Mesh(mouseGeometry, mouseMaterial);
    mouseMesh.position.set(0.8, -0.555, 0.8);
    mouseMesh.castShadow = true;
    computerGroup.add(mouseMesh);

    // Mouse scroll wheel
    const scrollWheelGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8);
    const scrollWheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const scrollWheelMesh = new THREE.Mesh(scrollWheelGeometry, scrollWheelMaterial);
    scrollWheelMesh.position.set(0.8, -0.525, 0.77);
    scrollWheelMesh.rotation.x = Math.PI / 2;
    scrollWheelMesh.castShadow = true;
    computerGroup.add(scrollWheelMesh);

    // Power button
    const powerButtonGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.01, 16);
    const powerButtonMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const powerButton = new THREE.Mesh(powerButtonGeometry, powerButtonMaterial);
    powerButton.position.set(0.8, 0.3, 0.08);
    powerButton.rotation.x = Math.PI / 2;
    computerGroup.add(powerButton);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(15, 7);
    
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 256;
    floorCanvas.height = 256;
    const floorCtx = floorCanvas.getContext('2d');
    
    if (floorCtx) {
      floorCtx.fillStyle = '#0f0f0f';
      floorCtx.fillRect(0, 0, 256, 256);
      
      for (let y = 0; y < 256; y += 4) {
          for (let x = 0; x < 256; x += 4) {
              if ((Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0) {
                  floorCtx.fillStyle = '#1a1a1a';
              } else {
                  floorCtx.fillStyle = '#333333';
              }
              floorCtx.fillRect(x, y, 4, 4);
          }
      }
      
      floorCtx.strokeStyle = '#444444';
      floorCtx.lineWidth = 1;
      
      for (let i = 0; i < 256; i += 4) {
          floorCtx.beginPath();
          floorCtx.moveTo(0, i);
          floorCtx.lineTo(256, i);
          floorCtx.stroke();
      }
      
      for (let i = 0; i < 256; i += 4) {
          floorCtx.beginPath();
          floorCtx.moveTo(i, 0);
          floorCtx.lineTo(i, 256);
          floorCtx.stroke();
      }
    }
    
    const carbonTexture = new THREE.CanvasTexture(floorCanvas);
    carbonTexture.wrapS = THREE.RepeatWrapping;
    carbonTexture.wrapT = THREE.RepeatWrapping;
    carbonTexture.repeat.set(8, 8);
    
    const floorMaterial = new THREE.MeshLambertMaterial({ 
        map: carbonTexture,
        color: 0x888888
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.6;
    floor.receiveShadow = true;
    scene.add(floor);

    // Position camera
    camera.position.set(0, 1, 3);
    camera.lookAt(0, 0, 0);

    // Mouse interaction
    const mouse: MousePosition = { x: 0, y: 0 };
    let targetCameraX = 0;
    let targetCameraY = 1;

    const onMouseMove = (event: MouseEvent): void => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        const radius = 3;
        targetCameraX = Math.sin(mouse.x * 0.15) * radius;
        targetCameraY = 1 + mouse.y * 0.1;
    };

    window.addEventListener('mousemove', onMouseMove);

    const onWindowResize = (): void => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onWindowResize);

    // Function to render HyperText component to overlay canvas
    const renderHyperTextOverlay = () => {
      if (hyperTextContainerRef.current && overlayCanvasRef.current) {
        const ctx = overlayCanvasRef.current.getContext('2d');
        if (ctx) {
          // Clear the overlay canvas
          ctx.clearRect(0, 0, 512, 384);
          
          try {
            // Get the text content from the HyperTextDemo component
            const container = hyperTextContainerRef.current;
            const textContent = container.textContent || container.innerText || '_';
            
            // Apply the transform for proper orientation
            ctx.save();
            ctx.scale(1, -1);
            ctx.translate(0, -384);
            
            // Use white color instead of computed color
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px monospace';
            ctx.textBaseline = 'top';
            
            // Position at top-left corner (remember we're in flipped coordinates)
            const x = 20;
            const y = 20; // Top position in flipped coordinates
            
            // Split text into lines if needed
            const lines = textContent.split('\n');
            lines.forEach((line, index) => {
              ctx.fillText(line.trim(), x, y + (index * 20));
            });
            
            ctx.restore();
          } catch (error) {
            console.error('Error rendering HyperText:', error);
            // Simple fallback
            ctx.save();
            ctx.scale(1, -1);
            ctx.translate(0, -384);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px monospace';
            ctx.textBaseline = 'top';
            ctx.fillText('HyperText Demo', 20, 20);
            ctx.restore();
          }
        }
      }
    };

    // Initial HyperText render
    setTimeout(renderHyperTextOverlay, 500);

    // Animation loop
    const animate = (): void => {
        animationRef.current = requestAnimationFrame(animate);

        const time = Date.now() * 0.001;

        // Update HyperText overlay animation
        renderHyperTextOverlay();

        // Composite VRM canvas and HyperText overlay
        if (vrmCanvasRef.current && overlayCanvasRef.current && canvasTexture) {
          const ctx = compositeCanvas.getContext('2d');
          if (ctx) {
            // Clear composite canvas
            ctx.clearRect(0, 0, 512, 384);
            
            // Draw VRM canvas (flipped vertically)
            ctx.save();
            ctx.scale(1, -1);
            ctx.translate(0, -384);
            ctx.drawImage(vrmCanvasRef.current, 0, 0, 512, 384);
            ctx.restore();
            
            // Draw HyperText overlay on top (already flipped in renderHyperTextOverlay)
            ctx.drawImage(overlayCanvasRef.current, 0, 0);
            
            canvasTexture.needsUpdate = true;
          }
        }

        // Smooth camera movement
        camera.position.x += (targetCameraX - camera.position.x) * 0.05;
        camera.position.y += (targetCameraY - camera.position.y) * 0.05;
        camera.position.z = Math.sqrt(9 - camera.position.x * camera.position.x);
        
        camera.lookAt(0, 0, 0);

        // Gentle floating animation
        computerGroup.position.y = Math.sin(time) * 0.005;

        // Power button glow
        const powerGlow = 0.5 + Math.sin(time * 5) * 0.3;
        powerButton.material.emissive.setHSL(0.33, 1, powerGlow * 0.5);

        renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onWindowResize);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (renderTargetRef.current) {
        renderTargetRef.current.dispose();
      }
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative">
      <GlobalStyles />
      <div 
        ref={mountRef} 
        className="w-full h-screen bg-black"
      />
      
      {/* Hidden VRM Canvas - renders to texture */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <canvas 
          ref={vrmCanvasCallback} 
          width={512} 
          height={384}
          style={{ width: '512px', height: '384px' }}
        />
        
        {/* Loading Overlay for VRM */}
        {isLoading && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "512px",
            height: "384px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10
          }}>
            <div style={{
              width: "30px",
              height: "30px",
              border: "3px solid #333",
              borderTop: "3px solid #1D9BF0",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Computer3DWithVrm;