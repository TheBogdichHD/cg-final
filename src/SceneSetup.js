import { createMeshFromOBJ } from './Mesh.js';
import { createBoxGeometry, createPlaneGeometry, createSphereGeometry } from './GeometryFactory.js';

export function createSceneObjects(gl) {
    const sceneObjects = [];
    const collectibles = [];

    const floorGeo = createPlaneGeometry(60, 60);
    const floorMesh = createMeshFromOBJ(gl, floorGeo);
    floorMesh.material = { diffuse: [0.5, 0.6, 0.5], specular: [0, 0, 0], shininess: 1, useTexture: false };
    sceneObjects.push({
        mesh: floorMesh,
        position: [0, 0, 0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
        boundingBox: { min: [-30, -0.1, -30], max: [30, 0.0, 30] },
        isStatic: true,
        drawContour: false,
        doubleSided: true,
    });

    const wallMat = { diffuse: [0.7, 0.6, 0.5], specular: [0, 0, 0], shininess: 1, useTexture: false };
    function createWall(x, z, w, d) {
        const h = 8;
        const geo = createBoxGeometry(w, h, d);
        const mesh = createMeshFromOBJ(gl, geo);
        mesh.material = wallMat;
        sceneObjects.push({
            mesh,
            position: [x, h / 2, z],
            scale: [1, 1, 1],
            rotation: [0, 0, 0],
            boundingBox: { min: [x - w / 2, 0, z - d / 2], max: [x + w / 2, h, z + d / 2] },
            isStatic: true,
            drawContour: false,
        });
    }
    createWall(0, -30, 60, 1);
    createWall(0, 30, 60, 1);
    createWall(-30, 0, 1, 60);
    createWall(30, 0, 1, 60);

    const platMat = { diffuse: [0.8, 0.5, 0.3], specular: [0, 0, 0], shininess: 1, useTexture: false };

    function addPlatform(x, y, z, w = 2, h = 0.4, d = 2) {
        const geo = createBoxGeometry(w, h, d);
        const mesh = createMeshFromOBJ(gl, geo);
        mesh.material = platMat;
        const topY = y + h;
        sceneObjects.push({
            mesh,
            position: [x, y + h / 2, z],
            scale: [1, 1, 1],
            rotation: [0, 0, 0],
            boundingBox: { min: [x - w / 2, y, z - d / 2], max: [x + w / 2, topY, z + d / 2] },
            isStatic: true,
            drawContour: false,
        });
        return topY;
    }


    const sphereGeo = createSphereGeometry(0.5, 16, 16);
    const sphereMesh = createMeshFromOBJ(gl, sphereGeo);
    sphereMesh.material = { diffuse: [1, 0.85, 0], specular: [0, 0, 0], shininess: 32, useTexture: false };

    function placeSphere(x, topY, z) {
        const sphereY = topY + 1.0;
        return [x, sphereY, z];
    }

    const spherePositions = [];

    for (let i = 0; i < 5; i++) {
        addPlatform(-10 - i * 4, 0.3 + i * 1.8, 10 + i * 2);
        spherePositions.push(placeSphere(-10 - i * 4, 0.3 + i * 1.8, 10 + i * 2));
    }

    for (let i = 0; i < 5; i++) {
        addPlatform(-8 + i * 4, 0.3 + i * 1.8, 10 + i * 2);
        spherePositions.push(placeSphere(-8 + i * 4, 0.3 + i * 1.8, 10 + i * 2));
    }


    for (let i = 0; i < 5; i++) {
        addPlatform(8 + i * 4.2, 9.6, 10 + i * 2);
        spherePositions.push(placeSphere(8 + i * 4.2, 9.6, 10 + i * 2));
    }


    for (let i = 0; i < 5; i++) {
        addPlatform(2 - i * 4.2, 9.6 - i * 0.5, 10 + i * 2);
        spherePositions.push(placeSphere(2 - i * 4.2, 9.6 - i * 0.5, 10 + i * 2));
    }


    for (const pos of spherePositions) {
        collectibles.push({
            mesh: sphereMesh,
            basePosition: [...pos],
            position: [...pos],
            scale: [0.5, 0.5, 0.5],
            rotation: [0, 0, 0],
            collected: false,
            drawContour: true,
            isStatic: false,
            boundingBox: {
                min: [pos[0] - 0.5, pos[1] - 0.5, pos[2] - 0.5],
                max: [pos[0] + 0.5, pos[1] + 0.5, pos[2] + 0.5],
            },
            bobPhase: Math.random() * Math.PI * 2,
        });
    }

    return { sceneObjects, collectibles };
}