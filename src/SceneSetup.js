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

    const startTop = addPlatform(0, 0.3, -10, 4, 0.4, 4);
    addPlatform(-5, 0.3, -5, 2, 0.4, 2);
    addPlatform(5, 0.3, -5, 2, 0.4, 2);
    const step1Top = addPlatform(0, 2.0, -8, 2, 0.4, 2);

    const w1 = addPlatform(-12, 0.5, -12, 2, 0.4, 2);
    const w2 = addPlatform(-14, 2.3, -10, 2, 0.4, 2);
    const w3 = addPlatform(-16, 4.1, -8, 2, 0.4, 2);
    const w4 = addPlatform(-18, 5.9, -6, 2, 0.4, 2);
    const wTop = addPlatform(-20, 7.7, -4, 2, 0.4, 2);

    const e1 = addPlatform(12, 0.5, -12, 2, 0.4, 2);
    const e2 = addPlatform(14, 2.3, -10, 2, 0.4, 2);
    const e3 = addPlatform(16, 4.1, -8, 2, 0.4, 2);
    const e4 = addPlatform(18, 5.9, -6, 2, 0.4, 2);
    const eTop = addPlatform(20, 7.7, -4, 2, 0.4, 2);

    const n1 = addPlatform(0, 0.5, 15, 3, 0.4, 3);
    const n2 = addPlatform(0, 2.4, 17, 3, 0.4, 3);
    const n3 = addPlatform(0, 4.3, 19, 3, 0.4, 3);
    const n4 = addPlatform(0, 6.2, 21, 2, 0.4, 2);
    const n5 = addPlatform(0, 8.1, 22, 2, 0.4, 2);
    const nTop = addPlatform(0, 10.0, 23, 2, 0.4, 2);

    addPlatform(-6, 1.2, -6, 2, 0.4, 2);
    addPlatform(-10, 3.0, -4, 2, 0.4, 2);

    addPlatform(6, 1.2, -6, 2, 0.4, 2);
    addPlatform(10, 3.0, -4, 2, 0.4, 2);

    addPlatform(-14, 3.5, 8, 2, 0.4, 2);
    addPlatform(-10, 5.3, 14, 2, 0.4, 2);

    addPlatform(14, 3.5, 8, 2, 0.4, 2);
    addPlatform(10, 5.3, 14, 2, 0.4, 2);

    addPlatform(0, 3.8, 10, 2, 0.4, 2);
    addPlatform(0, 5.7, 14, 2, 0.4, 2);

    addPlatform(-22, 1.0, -22, 2, 0.4, 2);
    addPlatform(22, 1.0, -22, 2, 0.4, 2);
    addPlatform(-24, 3.0, -20, 2, 0.4, 2);
    addPlatform(24, 3.0, -20, 2, 0.4, 2);
    addPlatform(0, 2.5, -18, 2, 0.4, 2);

    const sphereGeo = createSphereGeometry(0.5, 16, 16);
    const sphereMesh = createMeshFromOBJ(gl, sphereGeo);
    sphereMesh.material = { diffuse: [1, 0.85, 0], specular: [0, 0, 0], shininess: 32, useTexture: false };

    function placeSphere(x, topY, z) {
        const sphereY = topY + 0.3;
        return [x, sphereY, z];
    }

    const n = 0.1;

    const spherePositions = [
        placeSphere(0, startTop + n, -10),
        placeSphere(-5, 0.7 + n, -5),
        placeSphere(5, 0.7 + n, -5),
        placeSphere(0, step1Top + n, -8),

        placeSphere(-12, w1 + n, -12),
        placeSphere(-14, w2 + n, -10),
        placeSphere(-16, w3 + n, -8),
        placeSphere(-18, w4 + n, -6),
        placeSphere(-20, wTop + n, -4),

        placeSphere(12, e1 + n, -12),
        placeSphere(14, e2 + n, -10),
        placeSphere(16, e3 + n, -8),
        placeSphere(18, e4 + n, -6),
        placeSphere(20, eTop + n, -4),

        placeSphere(0, n1 + n, 15),
        placeSphere(0, n2 + n, 17),
        placeSphere(0, n3 + n, 19),
        placeSphere(0, n4 + n, 21),
        placeSphere(0, n5 + n, 22),
        placeSphere(0, nTop + n, 23),

        placeSphere(-6, 1.7, -6),
        placeSphere(-10, 3.5, -4),
        placeSphere(6, 1.7, -6),
        placeSphere(10, 3.5, -4),
        placeSphere(-14, 4.0, 8),
        placeSphere(-10, 5.8, 14),
        placeSphere(14, 4.0, 8),
        placeSphere(10, 5.8, 14),
        placeSphere(0, 4.3, 10),
        placeSphere(0, 6.2, 14),

        placeSphere(-22, 1.5, -22),
        placeSphere(22, 1.5, -22),
        placeSphere(-24, 3.5, -20),
        placeSphere(24, 3.5, -20),
        placeSphere(0, 3.0, -18),
    ];

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