import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const CrystalObject = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  // Store current mouse position
  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  // Add animation start time reference
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Scene and camera setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 7;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      precision: 'highp'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Create groups for the main crystal and small crystals
    const crystalGroup = new THREE.Group();
    scene.add(crystalGroup);
    const smallCrystalsGroup = new THREE.Group();
    crystalGroup.add(smallCrystalsGroup);

    // --- Gradient environment texture ---
    function createGradientTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get 2D context');
      const gradient = context.createLinearGradient(0, 0, 0, 256);
      gradient.addColorStop(0, '#111122');
      gradient.addColorStop(1, '#334466');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 256);
      return canvas;
    }
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    scene.add(cubeCamera);
    const envScene = new THREE.Scene();
    const gradientTexture = new THREE.CanvasTexture(createGradientTexture());
    const envSphere = new THREE.Mesh(
      new THREE.SphereGeometry(100, 32, 32),
      new THREE.MeshBasicMaterial({ map: gradientTexture, side: THREE.BackSide })
    );
    envScene.add(envSphere);
    cubeCamera.update(renderer, envScene);

    // --- Main crystal geometry ---
    function createCrystalGeometry() {
      const geometry = new THREE.BufferGeometry();
      const vertices = [
        0, -2, 0,
        1.5, -0.8, 1.2,
        -1.2, -1.0, 1.4,
        -1.7, -0.7, -0.9,
        0.9, -1.2, -1.5,
        2.2, 0.5, 1.8,
        -1.9, 0.7, 2.1,
        -2.4, 0.4, -1.3,
        1.4, 0.2, -2.1,
        1.0, 1.9, 0.8,
        -0.7, 2.3, 1.1,
        -1.2, 1.7, -0.6,
        0.5, 2.1, -0.9,
        0, 3.2, 0
      ];
      const indices = [
        0, 2, 1,
        0, 3, 2,
        0, 4, 3,
        0, 1, 4,
        1, 2, 6,
        1, 6, 5,
        2, 3, 7,
        2, 7, 6,
        3, 4, 8,
        3, 8, 7,
        4, 1, 5,
        4, 5, 8,
        5, 6, 10,
        5, 10, 9,
        6, 7, 11,
        6, 11, 10,
        7, 8, 12,
        7, 12, 11,
        8, 5, 9,
        8, 9, 12,
        9, 10, 13,
        10, 11, 13,
        11, 12, 13,
        12, 9, 13
      ];
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      // Save original vertices for animation
      geometry.userData = { originalPositions: vertices.slice() };
      return geometry;
    }
    const crystalGeometry = createCrystalGeometry();

    // --- Material for the main crystal ---
    const crystalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x9ea4f3,
      metalness: 0.3,
      roughness: 0,
      wireframe: true,
      flatShading: true,
      transmission: 0.95,
      thickness: 1,
      reflectivity: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0,
      ior: 2.5,
      opacity: 1,
      envMap: cubeRenderTarget.texture,
      envMapIntensity: 1.5,
      side: THREE.DoubleSide
    });
    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
    // Scale the main crystal 30% smaller
    crystal.scale.set(0.7, 0.7, 0.7);
    crystalGroup.add(crystal);

    // --- Function to create small crystal geometry ---
    function createSmallCrystalGeometry(scale: number, variation: number) {
      const geometry = new THREE.BufferGeometry();
      // Multiply scale by 0.7 so small crystals are 30% smaller
      const finalScale = 0.7 * scale;
      const applyVariation = (val: number) => val * (1 + (Math.random() - 0.5) * variation);
      const vertices = [
        0, applyVariation(-2) * finalScale, 0,
        applyVariation(1.5) * finalScale, applyVariation(-0.8) * finalScale, applyVariation(1.2) * finalScale,
        applyVariation(-1.2) * finalScale, applyVariation(-1.0) * finalScale, applyVariation(1.4) * finalScale,
        applyVariation(-1.7) * finalScale, applyVariation(-0.7) * finalScale, applyVariation(-0.9) * finalScale,
        applyVariation(0.9) * finalScale, applyVariation(-1.2) * finalScale, applyVariation(-1.5) * finalScale,
        applyVariation(2.2) * finalScale, applyVariation(0.5) * finalScale, applyVariation(1.8) * finalScale,
        applyVariation(-1.9) * finalScale, applyVariation(0.7) * finalScale, applyVariation(2.1) * finalScale,
        applyVariation(-2.4) * finalScale, applyVariation(0.4) * finalScale, applyVariation(-1.3) * finalScale,
        applyVariation(1.4) * finalScale, applyVariation(0.2) * finalScale, applyVariation(-2.1) * finalScale,
        applyVariation(1.0) * finalScale, applyVariation(1.9) * finalScale, applyVariation(0.8) * finalScale,
        applyVariation(-0.7) * finalScale, applyVariation(2.3) * finalScale, applyVariation(1.1) * finalScale,
        applyVariation(-1.2) * finalScale, applyVariation(1.7) * finalScale, applyVariation(-0.6) * finalScale,
        applyVariation(0.5) * finalScale, applyVariation(2.1) * finalScale, applyVariation(-0.9) * finalScale,
        0, applyVariation(3.2) * finalScale, 0
      ];
      const indices = [
        0, 2, 1,
        0, 3, 2,
        0, 4, 3,
        0, 1, 4,
        1, 2, 6,
        1, 6, 5,
        2, 3, 7,
        2, 7, 6,
        3, 4, 8,
        3, 8, 7,
        4, 1, 5,
        4, 5, 8,
        5, 6, 10,
        5, 10, 9,
        6, 7, 11,
        6, 11, 10,
        7, 8, 12,
        7, 12, 11,
        8, 5, 9,
        8, 9, 12,
        9, 10, 13,
        10, 11, 13,
        11, 12, 13,
        12, 9, 13
      ];
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      geometry.userData = { originalPositions: vertices.slice() };
      return geometry;
    }

    // --- Create small crystals ---  
    // This function creates a set of small crystals and adds them to the group.
    function createSmallCrystals(count: number, entranceDirection: string) {
      const crystalColors = [0x9ea4f3, 0x9ea4f3, 0x9ea4f3, 0x9ea4f3, 0x9ea4f3];
      const smallCrystals = [];
      for (let i = 0; i < count; i++) {
        const colorIndex = Math.floor(Math.random() * crystalColors.length);
        const crystalColor = crystalColors[colorIndex];
        const smallCrystalMaterial = new THREE.MeshPhysicalMaterial({
          color: crystalColor,
          metalness: 0.3 + Math.random() * 0.2,
          roughness: Math.random() * 0.1,
          wireframe: true,
          flatShading: true,
          transmission: 0.9 + Math.random() * 0.1,
          thickness: 1,
          reflectivity: 0.5,
          clearcoat: 1,
          clearcoatRoughness: Math.random() * 0.05,
          ior: 2.3 + Math.random() * 0.5,
          opacity: 1,
          envMap: cubeRenderTarget.texture,
          envMapIntensity: 1.2 + Math.random() * 0.6,
          side: THREE.DoubleSide
        });
        // Here, the base scale is reduced by 0.7 (30% smaller)
        const scale = 0.7 * (0.15 + Math.random() * 0.25);
        const smallCrystalGeometry = createSmallCrystalGeometry(scale, 0.4);
        const smallCrystal = new THREE.Mesh(smallCrystalGeometry, smallCrystalMaterial);

        // Position using a spherical distribution
        const radius = 3 + Math.random() * 1.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() * 0.8 + 0.1) * Math.PI;
        
        // Final position (where crystals will end up)
        const finalX = radius * Math.sin(phi) * Math.cos(theta);
        const finalY = radius * Math.cos(phi) + (Math.random() - 0.5) * 1.5;
        const finalZ = radius * Math.sin(phi) * Math.sin(theta);
        
        // Generate a starting position even farther away, based on the entrance direction
        const entranceDistance = 25 + Math.random() * 15; // 25-40 units away for more dramatic effect
        
        let startX, startY, startZ;
        
        // Define different entrance directions
        switch(entranceDirection) {
          case 'random':
            // Completely random direction from far away
            const randomAngle = Math.random() * Math.PI * 2;
            const randomElevation = Math.random() * Math.PI;
            startX = Math.sin(randomElevation) * Math.cos(randomAngle) * entranceDistance;
            startY = Math.cos(randomElevation) * entranceDistance;
            startZ = Math.sin(randomElevation) * Math.sin(randomAngle) * entranceDistance;
            break;
          case 'left':
            // From left side (-X direction)
            startX = -entranceDistance;
            startY = finalY + (Math.random() - 0.5) * 10;
            startZ = finalZ + (Math.random() - 0.5) * 10;
            break;
          case 'right':
            // From right side (+X direction)
            startX = entranceDistance;
            startY = finalY + (Math.random() - 0.5) * 10;
            startZ = finalZ + (Math.random() - 0.5) * 10;
            break;
          case 'top':
            // From top (+Y direction)
            startX = finalX + (Math.random() - 0.5) * 10;
            startY = entranceDistance;
            startZ = finalZ + (Math.random() - 0.5) * 10;
            break;
          case 'bottom':
            // From bottom (-Y direction)
            startX = finalX + (Math.random() - 0.5) * 10;
            startY = -entranceDistance;
            startZ = finalZ + (Math.random() - 0.5) * 10;
            break;
          case 'front':
            // From front (+Z direction)
            startX = finalX + (Math.random() - 0.5) * 10;
            startY = finalY + (Math.random() - 0.5) * 10;
            startZ = entranceDistance;
            break;
          case 'back':
            // From back (-Z direction)
            startX = finalX + (Math.random() - 0.5) * 10;
            startY = finalY + (Math.random() - 0.5) * 10;
            startZ = -entranceDistance;
            break;
          default:
            // Default to random if direction is not recognized
            const defaultAngle = Math.random() * Math.PI * 2;
            const defaultElevation = Math.random() * Math.PI;
            startX = Math.sin(defaultElevation) * Math.cos(defaultAngle) * entranceDistance;
            startY = Math.cos(defaultElevation) * entranceDistance;
            startZ = Math.sin(defaultElevation) * Math.sin(defaultAngle) * entranceDistance;
        }
        
        // Set initial position to start position
        smallCrystal.position.set(startX, startY, startZ);
        
        // Store initial and final positions for animation
        smallCrystal.userData = {
          rotationSpeed: (Math.random() - 0.5) * 0.01,
          oscillationSpeed: 0.5 + Math.random() * 1.5,
          oscillationAmplitude: 0.05 + Math.random() * 0.1,
          // Store both start and target positions
          startPosition: new THREE.Vector3(startX, startY, startZ),
          finalPosition: new THREE.Vector3(finalX, finalY, finalZ),
          originalPosition: new THREE.Vector3(finalX, finalY, finalZ), // for oscillation reference
          // Fixed random mouse response factors for smooth, individual motion
          mouseFactorX: (Math.random() - 0.5) * 0.5,
          mouseFactorY: (Math.random() - 0.5) * 0.5,
          mouseSensitivity: 0.2 + Math.random() * 0.1,
          // Animation params
          entranceSpeed: 0.5 + Math.random() * 0.3, // Slower base speed for entrance animation
          entranceDelay: Math.random() * 1.5, // Longer, more varied delays for more staggered effect
          entranceProgress: 0 // Current progress of entrance animation
        };
        
        smallCrystal.rotation.x = Math.random() * Math.PI * 2;
        smallCrystal.rotation.y = Math.random() * Math.PI * 2;
        smallCrystal.rotation.z = Math.random() * Math.PI * 2;
        
        smallCrystalsGroup.add(smallCrystal);
        smallCrystals.push(smallCrystal);
      }
      return smallCrystals;
    }

    // Create the original set of small crystals (15-25)
    createSmallCrystals(Math.floor(5 + Math.random() * 5), 'random');

    // Create crystal groups with more varied timing for fluid appearance
    // Additional delay offset for each group to create a wave-like formation
    let groupDelayOffset = 0;
    
    // Create additional crystal groups from various directions
    const leftCount = 10 + Math.floor(Math.random() * 5);
    const leftCrystals = createSmallCrystals(leftCount, 'left');
    leftCrystals.forEach(crystal => {
      // Final position adjusted (shifted left)
      crystal.userData.finalPosition.x -= 2;
      crystal.userData.originalPosition.x -= 2;
      // Add delay offset to this group
      crystal.userData.entranceDelay += groupDelayOffset;
    });
    
    // Increase offset for next group
    groupDelayOffset += 0.5;
    
    const rightCount = 5 + Math.floor(Math.random() * 11);
    const rightCrystals = createSmallCrystals(rightCount, 'right');
    rightCrystals.forEach(crystal => {
      // Final position adjusted (shifted right)
      crystal.userData.finalPosition.x += 2;
      crystal.userData.originalPosition.x += 2;
      // Add delay offset to this group
      crystal.userData.entranceDelay += groupDelayOffset;
    });
    
    // Increase offset for next group
    groupDelayOffset += 0.5;
    
    // Add more crystal groups from other directions for a more dramatic effect
    const topCrystals = createSmallCrystals(1 + Math.floor(Math.random() * 7), 'top');
    topCrystals.forEach(crystal => {
      crystal.userData.entranceDelay += groupDelayOffset;
    });
    
    groupDelayOffset += 0.5;
    
    const bottomCrystals = createSmallCrystals(1 + Math.floor(Math.random() * 7), 'bottom');
    bottomCrystals.forEach(crystal => {
      crystal.userData.entranceDelay += groupDelayOffset;
    });
    
    groupDelayOffset += 0.5;
    
    const frontCrystals = createSmallCrystals(1 + Math.floor(Math.random() * 7), 'front');
    frontCrystals.forEach(crystal => {
      crystal.userData.entranceDelay += groupDelayOffset;
    });
    
    groupDelayOffset += 0.5;
    
    const backCrystals = createSmallCrystals(1 + Math.floor(Math.random() * 7), 'back');
    backCrystals.forEach(crystal => {
      crystal.userData.entranceDelay += groupDelayOffset;
    });

    // --- Lighting setup ---
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(1, 2, 4);
    scene.add(directionalLight);
    const fillLight = new THREE.DirectionalLight(0xcce8ff, 1.8);
    fillLight.position.set(-4, -1, 2);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 2.2);
    rimLight.position.set(0, 0, -5);
    scene.add(rimLight);
    const pointLight1 = new THREE.PointLight(0xc7ccf9, 3, 20, 2);
    pointLight1.position.set(5, 3, 5);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0x9a9ec7, 3, 20, 2);
    pointLight2.position.set(-5, -2, 3);
    scene.add(pointLight2);
    const pointLight3 = new THREE.PointLight(0xf5f5ff, 2.5, 20, 2);
    pointLight3.position.set(0, -5, -5);
    scene.add(pointLight3);

    // --- Mouse interaction ---
    const handleMouseMove = (event: { clientX: number; clientY: number; }) => {
      mousePos.current.x = event.clientX;
      mousePos.current.y = event.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // --- Animation loop ---
    let frame = 0;
    const animate = () => {
      frame += 0.01;
      requestAnimationFrame(animate);

      // Calculate elapsed time for entrance animation
      const elapsed = (Date.now() - startTime.current) / 1000; // time in seconds

      // Overall rotation of the crystal group
      crystalGroup.rotation.y = frame * 1;
      crystalGroup.rotation.z = Math.sin(frame * 0.2) * 0.15;
      crystalGroup.rotation.x = Math.sin(frame * 0.3) * 0.15;

      // Normalized mouse coordinates
      const normalizedX = (mousePos.current.x - window.innerWidth / 2) / (window.innerWidth / 2);
      const normalizedY = -(mousePos.current.y - window.innerHeight / 2) / (window.innerHeight / 2);

      // Animate each small crystal individually
      smallCrystalsGroup.children.forEach(smallCrystal => {
        // Handle entrance animation
        const entranceDelay = smallCrystal.userData.entranceDelay;
        const entranceSpeed = smallCrystal.userData.entranceSpeed;
        
        // Only start animation after delay
        if (elapsed > entranceDelay) {
          // Calculate entrance progress (0 to 1) - SLOWED DOWN
          smallCrystal.userData.entranceProgress = Math.min(
            1, 
            (elapsed - entranceDelay) * (entranceSpeed * 0.4) // Reduced speed by 60%
          );
          
          const progress = smallCrystal.userData.entranceProgress;
          
          // Smoother easing function (quintic easing out)
          const easedProgress = 1 - Math.pow(1 - progress, 5);
          
          // Interpolate position from start to final
          if (progress < 1) {
            const startPos = smallCrystal.userData.startPosition;
            const finalPos = smallCrystal.userData.finalPosition;
            
            smallCrystal.position.x = startPos.x + (finalPos.x - startPos.x) * easedProgress;
            smallCrystal.position.y = startPos.y + (finalPos.y - startPos.y) * easedProgress;
            smallCrystal.position.z = startPos.z + (finalPos.z - startPos.z) * easedProgress;
          } else {
            // Animation complete, apply regular oscillation
            const oscSpeed = smallCrystal.userData.oscillationSpeed;
            const oscAmp = smallCrystal.userData.oscillationAmplitude;
            const origPos = smallCrystal.userData.originalPosition;
            const sensitivity = smallCrystal.userData.mouseSensitivity;
            
            // Add a fluid transition between entrance animation and regular oscillation
            const transitionFactor = Math.min(1, (progress - 1) * 5 + 1); // Smooth transition after reaching final position
            
            // Apply oscillation and a fixed, per-crystal mouse offset with transition
            smallCrystal.position.x = origPos.x + Math.sin(frame * oscSpeed) * oscAmp * transitionFactor + normalizedX * sensitivity * smallCrystal.userData.mouseFactorX;
            smallCrystal.position.y = origPos.y + Math.cos(frame * oscSpeed * 0.8) * oscAmp * transitionFactor + normalizedY * sensitivity * smallCrystal.userData.mouseFactorY;
            smallCrystal.position.z = origPos.z + Math.sin(frame * oscSpeed * 1.2) * oscAmp * transitionFactor;
          }
        }

        // Calculate a rotation multiplier that increases as crystals approach their destinations
        // This creates a fluid effect where crystals spin faster as they arrive
        const rotationMultiplier = smallCrystal.userData.entranceProgress > 0 ? 
                                 Math.min(1, smallCrystal.userData.entranceProgress * 3) : 0;
        
        smallCrystal.rotation.x += smallCrystal.userData.rotationSpeed * rotationMultiplier;
        smallCrystal.rotation.y += smallCrystal.userData.rotationSpeed * 1.3 * rotationMultiplier;
        smallCrystal.rotation.z += smallCrystal.userData.rotationSpeed * 0.7 * rotationMultiplier;
      });

      // Animate main crystal vertices (pulsing + subtle magnetic effect)
      const positions = crystalGeometry.attributes.position.array;
      const originalPositions = crystalGeometry.userData.originalPositions;
      for (let i = 0; i < positions.length; i += 3) {
        const origX = originalPositions[i];
        const origY = originalPositions[i + 1];
        const origZ = originalPositions[i + 2];
        const distFromCenter = Math.sqrt(origX * origX + origY * origY + origZ * origZ);
        const pulseX = Math.sin(frame * 1.2 + distFromCenter) * 0.05;
        const pulseY = Math.cos(frame * 0.9 + distFromCenter) * 0.05;
        const pulseZ = Math.sin(frame * 1.5 + distFromCenter) * 0.05;
        const magneticStrength = 1;
        const magneticFactor = Math.exp(-distFromCenter * 1) * magneticStrength;
        positions[i] = origX + pulseX + normalizedX * magneticFactor;
        positions[i + 1] = origY + pulseY + normalizedY * magneticFactor;
        positions[i + 2] = origZ + pulseZ;
      }
      crystalGeometry.attributes.position.needsUpdate = true;

      const hueShift = Math.sin(frame * 0.5) * 0.1;
      crystalMaterial.color.setHSL(0.6 + hueShift, 0.8, 0.7);
      crystalMaterial.transmission = 0.95 + Math.sin(frame * 2) * 0.03;
      crystalMaterial.envMapIntensity = 1.5 + Math.sin(frame * 1.3) * 0.3;

      pointLight1.position.x = Math.sin(frame * 1.2) * 6;
      pointLight1.position.z = Math.cos(frame * 0.9) * 6;
      pointLight1.intensity = 2 + Math.sin(frame * 4) * 1;
      pointLight2.position.y = Math.sin(frame * 1.5) * 6;
      pointLight2.intensity = 2 + Math.cos(frame * 3.5) * 1;
      pointLight3.intensity = 2 + Math.sin(frame * 5) * 1;

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);
    animate();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      crystalGeometry.dispose();
      crystalMaterial.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        position: 'absolute', 
        top: '50vh',
        left: '50vw',
        transform: 'translate(-50%, -50%)',
        width: '100vw', 
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none' 
      }}
    />
  );
};

export default CrystalObject;