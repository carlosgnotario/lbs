// InteractiveHex class
export class InteractiveHex {
    constructor(element) {
        this.element = element;
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.time = 0;
        this.mouseWorldX = 0;
        this.mouseWorldY = 0;
        this.isMouseOver = false;
        this.hoverZBoost = 0.5;
        this.hoverRadius = 3.0;
        this.animationSpeed = 0.3;
        this.zRange = 0.25;
        
        this.init();
    }

    init() {
        this.createCanvas();
        this.setupWebGL();
        this.createShaderProgram();
        this.setupBuffers();
        this.generateHexagons();
        this.setupMouseInteraction();
        this.animate();
    }

    createCanvas() {
        this.canvas = document.createElement("canvas");
        this.canvas.id = "glCanvas";
        this.canvas.style.position = "absolute";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.element.style.position = "relative";
        this.element.appendChild(this.canvas);
        
        this.resize();
        window.addEventListener("resize", () => this.resize());
    }

    resize() {
        // Use 80% of element dimensions while maintaining proportions
        const rect = this.element.getBoundingClientRect();
        const canvasWidth = Math.floor(rect.width * 0.8);
        const canvasHeight = Math.floor(rect.height * 0.8);
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Regenerate hexagons to fit new screen size
        if (this.canvas.width > 0 && this.canvas.height > 0) {
            this.generateHexagons();
        }
    }

    setupWebGL() {
        this.gl = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
        
        if (!this.gl) {
            console.error("WebGL not supported");
            return;
        }

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.blendEquation(this.gl.FUNC_ADD);
        this.gl.clearColor(0.05, 0.05, 0.05, 1.0);
    }

    createShaderProgram() {
        const vertexShaderSource = `
            precision mediump float;
            
            attribute vec3 a_position;
            attribute vec3 a_normal;
            
            uniform mat4 u_modelViewMatrix;
            uniform mat4 u_projectionMatrix;
            uniform float u_time;
            uniform float u_zOffset;
            uniform float u_isShadow;
            uniform float u_scale;
            
            varying vec3 v_normal;
            varying vec3 v_position;
            varying float v_zDepth;
            varying vec2 v_originalPos;
            
            void main() {
                vec3 position = a_position;
                v_originalPos = a_position.xy;
                position.xy *= u_scale;
                
                if (u_isShadow > 0.5) {
                    position.xy *= 1.05;
                } else {
                    position.xy *= 0.97; // More visible embed effect
                }
                
                vec4 worldPosition = u_modelViewMatrix * vec4(position, 1.0);
                
                if (u_isShadow > 0.5) {
                    worldPosition.z += u_zOffset + 0.1;
                    worldPosition.x += 0.02;
                    worldPosition.y -= 0.02;
                } else {
                    worldPosition.z += u_zOffset;
                }
                
                v_position = worldPosition.xyz;
                v_normal = a_normal;
                v_zDepth = worldPosition.z;
                
                gl_Position = u_projectionMatrix * worldPosition;
            }
        `;

        const fragmentShaderSource = `
            precision mediump float;
            
            varying vec3 v_normal;
            varying vec3 v_position;
            varying float v_zDepth;
            varying vec2 v_originalPos;
            
            uniform float u_time;
            uniform float u_baseGray;
            uniform float u_isShadow;
            
            void main() {
                if (u_isShadow >= 0.5) {
                    float shadowAlpha = 0.3;
                    gl_FragColor = vec4(0.0, 0.0, 0.0, shadowAlpha);
                } else {
                    vec3 baseColor = vec3(u_baseGray);
                    
                    float normalizedZ = clamp((v_zDepth + 20.0) / 0.15, 0.0, 1.0);
                    float shadowIntensity = 1.0 - normalizedZ * 0.2;
                    
                    vec3 lightDir = normalize(vec3(0.3, 0.4, 1.0));
                    float light = dot(normalize(v_normal), lightDir);
                    
                    // Rim lighting for embed effect - more obvious at top
                    vec2 pos = v_originalPos;
                    float hexRadius = 0.192;
                    float angle = atan(pos.y, pos.x);
                    float distFromCenter = length(pos);
                    float normalizedAngle = mod(angle + 1.5708, 1.0472);
                    float expectedRadius = hexRadius / cos(normalizedAngle - 0.5236);
                    float edgeDist = expectedRadius - distFromCenter;
                    
                    // Make edge detection tighter for 1px effect
                    float edgeFactor = smoothstep(0.0, hexRadius * 0.02, edgeDist);
                    
                    // Emphasize top edge (angle near -90 degrees / 1.5708)
                    float topEdgeFactor = 1.0 - clamp(abs(angle + 1.5708) / 0.5, 0.0, 1.0); // Stronger at top
                    
                    // Combine edge detection with top emphasis - clamp to prevent flares
                    float rimLight = clamp(edgeFactor * 0.25 * (0.5 + topEdgeFactor * 0.5), 0.0, 0.3);
                    
                    light = light * 0.5 + 0.5;
                    light = max(light, 0.3);
                    light = min(light + rimLight, 1.0); // Clamp to prevent over-brightening
                    
                    vec3 finalColor = baseColor * shadowIntensity * light;
                    finalColor = max(finalColor, vec3(0.05));
                    finalColor = finalColor * 1.1; // 10% brighter overall
                    finalColor = min(finalColor, vec3(1.0)); // Clamp to prevent over-brightening
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            }
        `;

        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        this.program = this.createProgram(vertexShader, fragmentShader);
        
        if (!this.program) {
            console.error("Failed to create shader program");
            return;
        }

        this.gl.useProgram(this.program);
        
        // Get attribute and uniform locations
        this.positionLocation = this.gl.getAttribLocation(this.program, "a_position");
        this.normalLocation = this.gl.getAttribLocation(this.program, "a_normal");
        this.modelViewMatrixLocation = this.gl.getUniformLocation(this.program, "u_modelViewMatrix");
        this.projectionMatrixLocation = this.gl.getUniformLocation(this.program, "u_projectionMatrix");
        this.timeLocation = this.gl.getUniformLocation(this.program, "u_time");
        this.zOffsetLocation = this.gl.getUniformLocation(this.program, "u_zOffset");
        this.baseGrayLocation = this.gl.getUniformLocation(this.program, "u_baseGray");
        this.isShadowLocation = this.gl.getUniformLocation(this.program, "u_isShadow");
        this.scaleLocation = this.gl.getUniformLocation(this.program, "u_scale");
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error("Shader compilation error:", this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }

    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error("Program linking error:", this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }
        
        return program;
    }

    createHexagon() {
        const vertices = [];
        const normals = [];
        const indices = [];
        
        const radius = 0.192;
        const center = [0, 0, 0];
        
        vertices.push(...center);
        normals.push(0, 0, 1);
        
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const x = center[0] + radius * Math.cos(angle);
            const y = center[1] + radius * Math.sin(angle);
            const z = center[2];
            
            vertices.push(x, y, z);
            normals.push(0, 0, 1);
        }
        
        for (let i = 0; i < 6; i++) {
            // Ensure counter-clockwise winding for front-facing triangles
            indices.push(0, ((i + 1) % 6) + 1, i + 1);
        }
        
        return { vertices, normals, indices };
    }

    calculateGridSize() {
        // Calculate visible world space at z = 0 (where hexagons are)
        // Camera is at z = -16, FOV = π/15 (very small for flatter perspective)
        const cameraZ = -20.0;
        const fov = Math.PI / 15;
        const distance = Math.abs(cameraZ);
        
        const aspect = this.canvas.width / this.canvas.height;
        const tanHalfFov = Math.tan(fov / 2);
        
        // Visible world dimensions at z = 0
        const visibleHeight = tanHalfFov * distance * 2;
        const visibleWidth = visibleHeight * aspect;
        
        // Hexagon dimensions
        const hexRadius = 0.192;
        const hexWidth = hexRadius * Math.sqrt(3);
        const hexHeight = hexRadius * 1.5; // Tighter vertical spacing for hex comb
        
        // Calculate how many hexagons we need with padding (1.2x to avoid edges)
        const cols = Math.ceil((visibleWidth * 1.2) / hexWidth);
        const rows = Math.ceil((visibleHeight * 1.2) / hexHeight);
        
        return { rows, cols, hexWidth, hexHeight };
    }

    generateHexCombPattern(rows, cols, hexWidth, hexHeight) {
        const hexagons = [];
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const xOffset = (row % 2) * (hexWidth / 2);
                const x = (col * hexWidth) + xOffset - (cols * hexWidth) / 2;
                const y = (row * hexHeight) - (rows * hexHeight) / 2;
                const z = 0;
                
                // Raise minimum 10%, lower max 10%
                const minGray = 0.033 * 1.1; // 0.0363
                const maxGray = (0.033 + 0.099) * 0.9; // 0.1188
                const baseGray = minGray + Math.random() * (maxGray - minGray);
                const phaseOffset = Math.random() * Math.PI * 2;
                
                hexagons.push({
                    x, y, z,
                    baseGray,
                    phaseOffset
                });
            }
        }
        
        return hexagons;
    }

    setupBuffers() {
        const hexData = this.createHexagon();
        this.hexData = hexData;
        
        this.hexVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hexVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(hexData.vertices), this.gl.STATIC_DRAW);

        this.hexNormalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hexNormalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(hexData.normals), this.gl.STATIC_DRAW);

        this.hexIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.hexIndexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(hexData.indices), this.gl.STATIC_DRAW);
    }

    generateHexagons() {
        if (!this.canvas || !this.canvas.width || !this.canvas.height) {
            // Fallback if canvas not ready
            this.hexagons = this.generateHexCombPattern(30, 40, 0.192 * Math.sqrt(3), 0.192 * 1.5);
            return;
        }
        
        const { rows, cols, hexWidth, hexHeight } = this.calculateGridSize();
        this.hexagons = this.generateHexCombPattern(rows, cols, hexWidth, hexHeight);
    }

    createPerspectiveMatrix(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const rangeInv = 1.0 / (near - far);
        
        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ];
    }

    createOrthographicMatrix(left, right, bottom, top, near, far) {
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);
        
        return [
            -2 * lr, 0, 0, 0,
            0, -2 * bt, 0, 0,
            0, 0, 2 * nf, 0,
            (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1
        ];
    }

    createModelViewMatrix(x, y, z) {
        const cameraZ = -20.0;
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z + cameraZ, 1
        ];
    }

    setupMouseInteraction() {
        const updateMousePosition = (e) => {
            // Get element's bounding rect accounting for scroll
            const rect = this.element.getBoundingClientRect();
            
            // Calculate mouse position relative to element (accounting for scroll)
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Convert to canvas coordinates (canvas is 80% of element)
            // Clamp to canvas bounds for coordinate conversion
            const clampedX = Math.max(0, Math.min(rect.width, x));
            const clampedY = Math.max(0, Math.min(rect.height, y));
            const canvasX = (clampedX / rect.width) * this.canvas.width;
            const canvasY = (clampedY / rect.height) * this.canvas.height;
            
            // Convert to normalized device coordinates
            const ndcX = (canvasX / this.canvas.width) * 2 - 1;
            const ndcY = 1 - (canvasY / this.canvas.height) * 2;
            
            // Convert to world coordinates (perspective projection)
            const aspect = this.canvas.width / this.canvas.height;
            const fov = Math.PI / 15; // Match the FOV used in projection
            const cameraZ = -20.0;
            const distance = Math.abs(cameraZ);
            
            const tanHalfFov = Math.tan(fov / 2);
            this.mouseWorldY = tanHalfFov * distance * ndcY;
            this.mouseWorldX = tanHalfFov * distance * aspect * ndcX;
            
            // Always keep mouse tracking active
            this.isMouseOver = true;
        };

        // Listen on document to catch mouse movement even over elements above canvas
        document.addEventListener("mousemove", updateMousePosition);
    }

    getHoverEffect(hexX, hexY, baseZOffset) {
        if (!this.isMouseOver) return { zBoost: 0.0, scale: 1.0 };
        
        const dx = this.mouseWorldX - hexX;
        const dy = this.mouseWorldY - hexY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.hoverRadius) {
            const factor = 1.0 - (dist / this.hoverRadius);
            // Use exponential easing - closer hexagons accelerate faster
            // Power of 3 makes closer ones respond much faster
            const easedFactor = factor * factor * factor;
            
            // Calculate target z position (bring to front)
            // Target is the maximum forward position (positive z = closer to camera)
            const targetZ = this.zRange + this.hoverZBoost;
            // Current z position with animation
            const currentZ = baseZOffset;
            // Calculate how much boost is needed to reach target
            // Use eased factor for faster response when closer
            const zBoost = (targetZ - currentZ) * easedFactor;
            
            return {
                zBoost: zBoost,
                scale: 1.0
            };
        }
        
        return { zBoost: 0.0, scale: 1.0 };
    }

    animate() {
        this.time += 0.008;
        
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        const aspect = this.canvas.width / this.canvas.height;
        // Use perspective with very small FOV for flatter, more subtle perspective
        const fov = Math.PI / 15; // Very small FOV (~12 degrees) for flatter perspective
        const projectionMatrix = this.createPerspectiveMatrix(fov, aspect, 0.1, 100.0);
        this.gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix);
        
        this.gl.uniform1f(this.timeLocation, this.time);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hexVertexBuffer);
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(this.positionLocation, 3, this.gl.FLOAT, false, 0, 0);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hexNormalBuffer);
        this.gl.enableVertexAttribArray(this.normalLocation);
        this.gl.vertexAttribPointer(this.normalLocation, 3, this.gl.FLOAT, false, 0, 0);
        
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.hexIndexBuffer);
        
        // Draw all hexagons
        this.gl.depthMask(true);
        this.gl.uniform1f(this.isShadowLocation, 0.0);
        this.hexagons.forEach((hex) => {
            const baseZOffset = Math.sin(this.time * this.animationSpeed + hex.phaseOffset) * this.zRange;
            const hoverEffect = this.getHoverEffect(hex.x, hex.y, baseZOffset);
            const zOffset = baseZOffset + hoverEffect.zBoost;
            const modelViewMatrix = this.createModelViewMatrix(hex.x, hex.y, hex.z);
            this.gl.uniformMatrix4fv(this.modelViewMatrixLocation, false, modelViewMatrix);
            this.gl.uniform1f(this.zOffsetLocation, zOffset);
            this.gl.uniform1f(this.baseGrayLocation, hex.baseGray);
            this.gl.uniform1f(this.scaleLocation, hoverEffect.scale);
            this.gl.drawElements(this.gl.TRIANGLES, this.hexData.indices.length, this.gl.UNSIGNED_SHORT, 0);
        });
        
        requestAnimationFrame(() => this.animate());
    }
}
