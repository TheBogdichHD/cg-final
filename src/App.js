import { createShaderProgram, getUniforms } from './ShaderProgram.js';
import { createMeshFromOBJ, bindMeshAttributes } from './Mesh.js';
import { parseOBJ, parseMTL } from './OBJLoader.js';
import { Camera } from './Camera.js';
import { OrbitController } from './OrbitController.js';
import { Light } from './Light.js';
import { createContourProgram, renderContourPass } from './ContourPass.js';
import { loadTexture } from './TextureLoader.js';
import { InputManager } from './InputManager.js';
import { PhysicsSystem } from './PhysicsSystem.js';
import { PlayerController } from './PlayerController.js';
import { createSceneObjects } from './SceneSetup.js';
import vsSource from './shaders/cel.vert?raw';
import fsSource from './shaders/cel.frag?raw';

const m4 = window.m4;
const webglUtils = window.webglUtils;

function boxIntersect(a, b) {
    return (a.min[0] <= b.max[0] && a.max[0] >= b.min[0]) &&
        (a.min[1] <= b.max[1] && a.max[1] >= b.min[1]) &&
        (a.min[2] <= b.max[2] && a.max[2] >= b.min[2]);
}

export class App {
    constructor(canvas) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2', { stencil: true });
        if (!gl) throw new Error('WebGL2 not supported');
        this.gl = gl;
        this.sceneObjects = [];
        this.collectibles = [];
        this.playerObject = null;
        this.inputManager = new InputManager();
        this.physicsSystem = new PhysicsSystem();
        this.playerController = null;
        this.lastTime = 0;
        this.gameOver = false;
        this.collectedCount = 0;
        this.totalCollectibles = 0;
        this.running = true;

        this.scoreElement = document.getElementById('score');
        this.winScreen = document.getElementById('winScreen');
        this.restartBtn = document.getElementById('restartBtn');
        this.restartBtn.addEventListener('click', () => this.restart());
    }

    async init() {
        const gl = this.gl;
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        const attribs = ['a_position', 'a_normal', 'a_texcoord', 'a_tangent', 'a_color'];
        this.programInfo = createShaderProgram(gl, vsSource, fsSource, attribs);
        getUniforms(gl, this.programInfo, [
            'u_projection', 'u_view', 'u_world', 'u_viewWorldPosition',
            'u_lightDirection', 'u_ambientLight', 'u_diffuseColor', 'u_specularColor',
            'u_shininess', 'u_texture', 'u_useTexture'
        ]);
        this.programInfo.attribLocations = {};
        attribs.forEach(attr => {
            this.programInfo.attribLocations[attr] = gl.getAttribLocation(this.programInfo.program, attr);
        });

        this.contourProgramInfo = createContourProgram(gl);

        this.camera = new Camera(Math.PI / 4, 1, 0.1, 100);
        this.camera.radius = 10;
        this.camera.target = [0, 1, 0];
        this.camera.updateViewMatrix();

        this.controller = new OrbitController(this.canvas, this.camera);

        await this.setupScene();
        this.totalCollectibles = this.collectibles.length;
        this.updateScore();

        window.addEventListener('resize', this.resize.bind(this));
        this.resize();

        requestAnimationFrame(this.render.bind(this));
    }

    resize() {
        const gl = this.gl;
        webglUtils.resizeCanvasToDisplaySize(gl.canvas, window.devicePixelRatio);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        this.camera.setAspect(gl.canvas.width / gl.canvas.height);
    }

    async loadModel(modelName, folderPath = 'models/') {
        const gl = this.gl;
        const baseURL = `${folderPath}${modelName}/${modelName}`;

        const objResponse = await fetch(`${baseURL}.obj`);
        if (!objResponse.ok) throw new Error(`Failed to load ${baseURL}.obj`);
        const objText = await objResponse.text();
        const obj = parseOBJ(objText);

        let materials = {};
        let mtlURL = `${baseURL}.mtl`;
        if (obj.materialLibs && obj.materialLibs.length > 0) {
            mtlURL = `${folderPath}${modelName}/${obj.materialLibs[0]}`;
        }
        try {
            const mtlResponse = await fetch(mtlURL);
            if (mtlResponse.ok) {
                const mtlText = await mtlResponse.text();
                const cleanText = mtlText.replace(/^\uFEFF/, '').trim();
                materials = parseMTL(cleanText);
            }
        } catch (e) {
            console.warn('Failed to load MTL:', e);
        }

        const textureMap = new Map();
        for (const [matName, mat] of Object.entries(materials)) {
            if (mat.diffuseMap) {
                const textureURL = `${folderPath}${modelName}/${mat.diffuseMap}`;
                try {
                    const tex = await loadTexture(gl, textureURL);
                    textureMap.set(matName, tex);
                } catch (e) {
                    console.warn(`Failed to load texture ${textureURL}: ${e.message}`);
                }
            }
        }

        const loadedMeshes = [];
        for (const geom of obj.geometries) {
            const mesh = createMeshFromOBJ(gl, geom.data);
            const matName = geom.material.trim();
            const mat = materials[matName] || {};
            const hasTex = textureMap.has(matName);

            mesh.material = {
                diffuse: mat.diffuse || [1, 1, 1],
                specular: mat.specular || [0.3, 0.3, 0.3],
                shininess: mat.shininess || 32,
                useTexture: hasTex,
            };
            mesh.texture = textureMap.get(matName) || null;
            loadedMeshes.push(mesh);
        }
        return loadedMeshes;
    }

    async setupScene() {
        const gl = this.gl;
        const { sceneObjects, collectibles } = createSceneObjects(gl);
        this.sceneObjects = sceneObjects;
        this.collectibles = collectibles;

        const playerMeshes = await this.loadModel('mc', 'models/');
        if (playerMeshes.length > 0) {
            this.playerObject = {
                meshes: playerMeshes,
                position: [0, 0.5, 0],
                scale: [1, 1, 1],
                rotation: [0, 0, 0],
                velocity: [0, 0, 0],
                grounded: false,
                isStatic: false,
                drawContour: true,
                heightTotal: 2.8,
                footOffset: 0.03,
                halfWidth: 0.4,
                contourWidth: 0.03,
            };
            this.sceneObjects.push(this.playerObject);
            this.physicsSystem.setPlayer(this.playerObject);
            this.playerController = new PlayerController(this.playerObject, this.inputManager);
        }

        const freddyMeshes = await this.loadModel('freddy', 'models/');
        if (freddyMeshes.length > 0) {
            this.sceneObjects.push({
                meshes: freddyMeshes,
                position: [0, 0, 5],
                scale: [5, 5, 5],
                rotation: [0, 0, 0],
                drawContour: true,
                isStatic: true,
                doubleSided: false,
                contourWidth: 0.006,
            });
        }
    }

    updateScore() {
        if (this.scoreElement) {
            this.scoreElement.textContent = `Сфер: ${this.collectedCount} / ${this.totalCollectibles}`;
        }
    }

    restart() {
        this.gameOver = false;
        this.collectedCount = 0;
        this.collectibles.forEach(c => c.collected = false);
        if (this.playerObject) {
            this.playerObject.position = [0, 0.5, 0];
            this.playerObject.velocity = [0, 0, 0];
            this.playerObject.rotation = [0, 0, 0];
        }
        this.winScreen.style.display = 'none';
        this.updateScore();
    }

    respawnPlayer() {
        if (!this.playerObject) return;

        this.playerObject.position = [0, 0.5, 0];
        this.playerObject.velocity = [0, 0, 0];
        this.playerObject.rotation = [0, 0, 0];

        this.playerObject.grounded = false;
    }

    render(time) {
        if (!this.running) return;

        time *= 0.001;
        const deltaTime = Math.min(0.05, time - this.lastTime);
        this.lastTime = time;

        if (!this.gameOver) {
            if (this.playerController) this.playerController.update(deltaTime, this.camera);
            if (this.physicsSystem) this.physicsSystem.update(deltaTime, this.sceneObjects);

            if (this.playerObject && this.playerObject.position[1] < -10) {
                this.respawnPlayer();
            }

            if (this.playerObject) {
                this.camera.target = this.playerObject.position;
                this.camera.updateViewMatrix();
            }

            for (const c of this.collectibles) {
                if (c.collected) continue;
                const bob = Math.sin(time * 3 + c.bobPhase) * 0.15;
                c.position = [...c.basePosition];
                c.position[1] += bob;
            }

            const p = this.playerObject;
            if (p) {
                const playerBox = {
                    min: [p.position[0] - 0.5, p.position[1] - p.footOffset, p.position[2] - 0.5],
                    max: [p.position[0] + 0.5, p.position[1] + (p.heightTotal - p.footOffset), p.position[2] + 0.5],
                };
                for (const c of this.collectibles) {
                    if (c.collected) continue;
                    if (boxIntersect(playerBox, c.boundingBox)) {
                        c.collected = true;
                        this.collectedCount++;
                        this.updateScore();
                    }
                }
                if (this.collectibles.length > 0 && this.collectibles.every(c => c.collected)) {
                    this.gameOver = true;
                    this.winScreen.style.display = 'flex';
                }
            }
        }

        const gl = this.gl;
        gl.clearColor(0.8, 0.9, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

        const prog = this.programInfo;
        gl.useProgram(prog.program);

        const viewMatrix = this.camera.getViewMatrix();
        const projMatrix = this.camera.getProjectionMatrix();
        const eye = this.camera.eye;

        gl.uniformMatrix4fv(prog.uniformLocations.u_projection, false, projMatrix);
        gl.uniformMatrix4fv(prog.uniformLocations.u_view, false, viewMatrix);
        gl.uniform3fv(prog.uniformLocations.u_viewWorldPosition, eye);
        gl.uniform3fv(prog.uniformLocations.u_lightDirection, Light.direction);
        gl.uniform3f(prog.uniformLocations.u_ambientLight, ...Light.ambient);

        const drawList = [
            ...this.sceneObjects,
            ...this.collectibles.filter(c => !c.collected),
        ];

        gl.enable(gl.STENCIL_TEST);
        for (const obj of drawList) {
            const meshes = obj.meshes || [obj.mesh];

            if (obj.doubleSided) {
                gl.disable(gl.CULL_FACE);
            }

            if (obj.drawContour) {
                gl.stencilMask(0xFF);
                gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
                gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
            } else {
                gl.stencilMask(0x00);
            }
            for (const mesh of meshes) {
                bindMeshAttributes(gl, prog, mesh);
                let worldMatrix = m4.identity();
                worldMatrix = m4.translate(worldMatrix, ...obj.position);
                if (obj.rotation) worldMatrix = m4.yRotate(worldMatrix, obj.rotation[1] || 0);
                worldMatrix = m4.scale(worldMatrix, ...obj.scale);

                gl.uniformMatrix4fv(prog.uniformLocations.u_world, false, worldMatrix);
                gl.uniform3fv(prog.uniformLocations.u_diffuseColor, mesh.material.diffuse);
                gl.uniform3fv(prog.uniformLocations.u_specularColor, mesh.material.specular);
                gl.uniform1f(prog.uniformLocations.u_shininess, mesh.material.shininess);
                if (mesh.texture && mesh.material.useTexture) {
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, mesh.texture);
                    gl.uniform1i(prog.uniformLocations.u_texture, 0);
                } else {
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                    gl.uniform1i(prog.uniformLocations.u_texture, 0);
                }
                gl.uniform1i(prog.uniformLocations.u_useTexture, mesh.material.useTexture ? 1 : 0);
                gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
            }

            if (obj.doubleSided) {
                gl.enable(gl.CULL_FACE);
            }
        }
        gl.stencilMask(0xFF);

        const contourObjects = drawList.filter(o => o.drawContour);
        if (contourObjects.length > 0) {
            gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
            gl.stencilMask(0x00);
            for (const obj of contourObjects) {
                const meshes = obj.meshes || [obj.mesh];
                let worldMatrix = m4.identity();
                worldMatrix = m4.translate(worldMatrix, ...obj.position);
                if (obj.rotation) worldMatrix = m4.yRotate(worldMatrix, obj.rotation[1] || 0);
                worldMatrix = m4.scale(worldMatrix, ...obj.scale);
                renderContourPass(gl, this.contourProgramInfo, meshes, this.camera, worldMatrix,
                    obj.contourWidth || 0.03,
                    obj.contourColor || [0, 0, 0]
                );
            }
            gl.disable(gl.STENCIL_TEST);
            gl.stencilMask(0xFF);
            gl.depthFunc(gl.LESS);
        }

        requestAnimationFrame(this.render.bind(this));
    }

    dispose() {
        this.running = false;
        this.controller.dispose();
        window.removeEventListener('resize', this.resize);
    }
}