/**
 * brain3d.js - Interactive 3D AI Brain Particle Network
 * Built for Varsha Sugur's Portfolio Website using Three.js
 */

(function () {
    // Canvas & Container
    const canvas = document.getElementById('brain-canvas');
    if (!canvas) return;
    
    const container = canvas.parentElement;
    
    // Scene variables
    let scene, camera, renderer;
    let brainGroup;
    let particleSystem, lineSegments, signalsSystem;
    
    // Interaction variables
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;
    
    // Configuration
    const CONFIG = {
        particleCount: 1200,      // Cerebral cortex particles
        cerebellumCount: 250,     // Cerebellum particles
        stemCount: 150,           // Brainstem particles
        maxLineDistance: 0.23,    // Maximum distance to connect nodes
        signalCount: 40,          // Number of active electric pulses
        baseParticleSize: 0.045,  // Base size of brain particles
        signalParticleSize: 0.12  // Size of active pulses
    };
    
    // Arrays for brain geometry
    const points = [];
    const adjacencyList = [];
    const signals = [];
    let signalPositions;
    
    // Initialize Three.js Scene
    function init() {
        // Create Scene
        scene = new THREE.Scene();
        
        // Create Camera
        camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.z = 4.8;
        
        // Create Renderer
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        
        // Group to hold all brain parts
        brainGroup = new THREE.Group();
        // Tilts the brain slightly for a better visual angle initially
        brainGroup.rotation.x = 0.2;
        brainGroup.rotation.y = -0.6;
        scene.add(brainGroup);
        
        // Generate Brain Geometry
        generateBrainPoints();
        buildConnectionLines();
        setupParticles();
        setupLines();
        setupSignals();
        
        // Add subtle light source (primarily self-illuminated, but helps depth)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0xd4af37, 1, 10);
        pointLight.position.set(2, 2, 2);
        scene.add(pointLight);
        
        // Event Listeners
        window.addEventListener('resize', onWindowResize);
        document.addEventListener('mousemove', onMouseMove);
        
        // Start Loop
        animate();
    }
    
    // Soft glowing circle texture for particles
    function createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Draw Radial Gradient
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.2, 'rgba(255, 220, 100, 0.8)');
        grad.addColorStop(0.5, 'rgba(212, 175, 55, 0.3)');
        grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
        
        return new THREE.CanvasTexture(canvas);
    }
    
    // Math-based procedural generation of brain coordinates
    function generateBrainPoints() {
        const tempPoint = new THREE.Vector3();
        
        // 1. Generate Cerebral Cortex (Main Lobes)
        for (let i = 0; i < CONFIG.particleCount; i++) {
            // Decide side: 1 = Right, -1 = Left
            const side = Math.random() > 0.5 ? 1 : -1;
            
            // Generate base spheroid coords
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            
            let x = 1.35 * Math.sin(theta) * Math.cos(phi);
            let y = 1.05 * Math.cos(theta);
            let z = 0.95 * Math.sin(theta) * Math.sin(phi);
            
            // Adjust proportions: Brain is wider at the back (z < 0) and tapers in front (z > 0)
            const zScale = 1.0 - 0.28 * z; 
            x *= zScale;
            y *= (1.0 - 0.1 * z);
            
            // Add Brain Fold Noise (gyri and sulci mapping)
            // Waves represent folding frequencies
            const foldFreq = 11.5;
            const foldAmp = 0.085;
            const wave = Math.sin(x * foldFreq) * Math.cos(y * foldFreq) * Math.sin(z * foldFreq) * foldAmp;
            
            x += wave * Math.sign(x);
            y += wave;
            z += wave;
            
            // Separation fissure gap between left and right hemispheres (X = 0)
            const gap = 0.07;
            x += side * gap;
            
            // Flatten the inner fissure walls slightly
            if (side === 1 && x < gap) x = gap;
            if (side === -1 && x > -gap) x = -gap;
            
            tempPoint.set(x, y, z);
            points.push(tempPoint.clone());
        }
        
        // 2. Generate Cerebellum (Lower back lobes)
        for (let i = 0; i < CONFIG.cerebellumCount; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            
            const u = Math.random() * 2 - 1;
            const phi = Math.random() * Math.PI * 2;
            
            // Smaller, dense spheroid shifted to the bottom-back
            let cx = 0.32 * Math.sqrt(1 - u * u) * Math.cos(phi) + (side * 0.38);
            let cy = 0.25 * u - 0.55; 
            let cz = 0.3 * Math.sqrt(1 - u * u) * Math.sin(phi) - 0.55;
            
            // Tighter folds for cerebellum
            const cFoldFreq = 22.0;
            const cFoldAmp = 0.035;
            const wave = Math.sin(cx * cFoldFreq) * Math.cos(cy * cFoldFreq) * Math.sin(cz * cFoldFreq) * cFoldAmp;
            cx += wave;
            cy += wave;
            cz += wave;
            
            tempPoint.set(cx, cy, cz);
            points.push(tempPoint.clone());
        }
        
        // 3. Generate Brainstem (Vertical base column)
        for (let i = 0; i < CONFIG.stemCount; i++) {
            const h = Math.random(); // Height index (0 to 1)
            const phi = Math.random() * Math.PI * 2;
            
            // Cylinder tapering slightly downward
            const radius = 0.13 * (1.0 - h * 0.35);
            
            let sx = radius * Math.cos(phi);
            let sy = -0.5 - h * 0.75; // Extends downward from the base
            let sz = radius * Math.sin(phi) - 0.2; // Shifted slightly back
            
            // Subtle fiber texturing
            const fiberNoise = Math.sin(sy * 18) * 0.015;
            sx += fiberNoise * Math.cos(phi);
            sz += fiberNoise * Math.sin(phi);
            
            tempPoint.set(sx, sy, sz);
            points.push(tempPoint.clone());
        }
        
        // Initialize Adjacency list for connections
        for (let i = 0; i < points.length; i++) {
            adjacencyList[i] = [];
        }
    }
    
    // Scan vertices and build lines between close points
    function buildConnectionLines() {
        const len = points.length;
        
        // Performance optimization: Check local neighbors instead of O(N^2) full scan
        for (let i = 0; i < len; i += 3) {
            const pI = points[i];
            
            for (let j = i + 1; j < len; j++) {
                // Keep checking window relatively local to limit cycles
                if (j - i > 120) continue; 
                
                const pJ = points[j];
                const dist = pI.distanceTo(pJ);
                
                if (dist < CONFIG.maxLineDistance) {
                    // Prevent connections bridging across the longitudinal fissure
                    if (Math.sign(pI.x) !== Math.sign(pJ.x) && Math.abs(pI.x) > 0.1) {
                        continue;
                    }
                    
                    adjacencyList[i].push(j);
                    adjacencyList[j].push(i);
                }
            }
        }
    }
    
    // Set up Main Node System
    function setupParticles() {
        const count = points.length;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const randomWeights = new Float32Array(count); // For individual animated shifting
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = points[i].x;
            positions[i * 3 + 1] = points[i].y;
            positions[i * 3 + 2] = points[i].z;
            
            // Randomize sizing slightly
            sizes[i] = CONFIG.baseParticleSize * (0.6 + Math.random() * 0.8);
            randomWeights[i] = Math.random();
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Material using circular sprite and blending
        const particleTexture = createCircleTexture();
        const material = new THREE.PointsMaterial({
            size: CONFIG.baseParticleSize,
            map: particleTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: 0xd4af37, // Gold base
            opacity: 0.75
        });
        
        particleSystem = new THREE.Points(geometry, material);
        particleSystem.userData = { weights: randomWeights, sizes: sizes };
        brainGroup.add(particleSystem);
    }
    
    // Set up Connection Lines
    function setupLines() {
        const linePositions = [];
        
        for (let i = 0; i < points.length; i++) {
            const neighbors = adjacencyList[i];
            for (let j = 0; j < neighbors.length; j++) {
                const nIndex = neighbors[j];
                if (i < nIndex) { // Avoid duplicate lines
                    linePositions.push(points[i].x, points[i].y, points[i].z);
                    linePositions.push(points[nIndex].x, points[nIndex].y, points[nIndex].z);
                }
            }
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        
        const material = new THREE.LineBasicMaterial({
            color: 0xaa8416, // Deeper gold
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        lineSegments = new THREE.LineSegments(geometry, material);
        brainGroup.add(lineSegments);
    }
    
    // Set up Active Signal Pulses
    function setupSignals() {
        signalPositions = new Float32Array(CONFIG.signalCount * 3);
        
        for (let i = 0; i < CONFIG.signalCount; i++) {
            // Find a valid node with neighbors
            let startNode = Math.floor(Math.random() * points.length);
            while (adjacencyList[startNode].length === 0) {
                startNode = Math.floor(Math.random() * points.length);
            }
            
            const neighbors = adjacencyList[startNode];
            const targetNode = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            signals.push({
                start: startNode,
                target: targetNode,
                progress: Math.random(), // Stagger starts
                speed: 0.01 + Math.random() * 0.018
            });
            
            // Set initial position
            const pStart = points[startNode];
            const pTarget = points[targetNode];
            const t = signals[i].progress;
            
            signalPositions[i * 3] = pStart.x + (pTarget.x - pStart.x) * t;
            signalPositions[i * 3 + 1] = pStart.y + (pTarget.y - pStart.y) * t;
            signalPositions[i * 3 + 2] = pStart.z + (pTarget.z - pStart.z) * t;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(signalPositions, 3));
        
        const signalTexture = createCircleTexture();
        const material = new THREE.PointsMaterial({
            size: CONFIG.signalParticleSize,
            map: signalTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            color: 0xffffff, // White-hot glow center
            depthWrite: false,
            opacity: 0.95
        });
        
        signalsSystem = new THREE.Points(geometry, material);
        brainGroup.add(signalsSystem);
    }
    
    // Interaction Handlers
    function onMouseMove(event) {
        // Calculate relative coordinates normalized from -1 to 1
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    }
    
    function onWindowResize() {
        if (!container) return;
        
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    // Rendering and Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        render();
    }
    
    function render() {
        const time = Date.now() * 0.0015;
        
        // 1. Slow, premium base rotation of the brain
        brainGroup.rotation.y += 0.0028;
        
        // 2. Interpolate mouse coordinate parallax (inertia tracking)
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;
        
        // Tilt the group based on cursor offsets
        brainGroup.rotation.x = 0.2 + targetY * 0.35;
        brainGroup.rotation.y += targetX * 0.015; // Combines with base auto-rotation
        
        // 3. Animate individual nodes (make them pulsate or breathe)
        if (particleSystem) {
            const positions = particleSystem.geometry.attributes.position.array;
            const count = points.length;
            const weights = particleSystem.userData.weights;
            const baseSizes = particleSystem.userData.sizes;
            const sizeAttribute = particleSystem.geometry.attributes.size;
            
            // Faint breathing scale applied using wave calculations
            for (let i = 0; i < count; i++) {
                const weight = weights[i];
                // Nodes gently pulsate their locations slightly
                const offset = Math.sin(time + weight * 50) * 0.006;
                
                positions[i * 3] = points[i].x + offset * (points[i].x / 1.5);
                positions[i * 3 + 1] = points[i].y + offset;
                positions[i * 3 + 2] = points[i].z + offset;
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
        }
        
        // 4. Animate active signal pulses traveling through connections
        if (signalsSystem) {
            const positions = signalsSystem.geometry.attributes.position.array;
            
            for (let i = 0; i < CONFIG.signalCount; i++) {
                const sig = signals[i];
                sig.progress += sig.speed;
                
                // Signal arrived at node
                if (sig.progress >= 1.0) {
                    sig.progress = 0.0;
                    sig.start = sig.target;
                    
                    const neighbors = adjacencyList[sig.start];
                    if (neighbors && neighbors.length > 0) {
                        // Choose a new random neighbor
                        sig.target = neighbors[Math.floor(Math.random() * neighbors.length)];
                    } else {
                        // Stuck node safety fallback: jump to another random node
                        let randNode = Math.floor(Math.random() * points.length);
                        while (adjacencyList[randNode].length === 0) {
                            randNode = Math.floor(Math.random() * points.length);
                        }
                        sig.start = randNode;
                        const randNeighbors = adjacencyList[randNode];
                        sig.target = randNeighbors[Math.floor(Math.random() * randNeighbors.length)];
                    }
                    // Speed variation
                    sig.speed = 0.012 + Math.random() * 0.02;
                }
                
                // Lerp between start and target points
                const pStart = points[sig.start];
                const pTarget = points[sig.target];
                const t = sig.progress;
                
                positions[i * 3] = pStart.x + (pTarget.x - pStart.x) * t;
                positions[i * 3 + 1] = pStart.y + (pTarget.y - pStart.y) * t;
                positions[i * 3 + 2] = pStart.z + (pTarget.z - pStart.z) * t;
            }
            signalsSystem.geometry.attributes.position.needsUpdate = true;
        }
        
        // Render step
        renderer.render(scene, camera);
    }
    
    // Auto-init on load
    window.addEventListener('DOMContentLoaded', () => {
        // Subtle delay to allow page structure loading
        setTimeout(init, 200);
    });
})();
