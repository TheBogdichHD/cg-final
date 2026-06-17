export function createBoxGeometry(width, height, depth) {
    const hw = width / 2, hh = height / 2, hd = depth / 2;
    const positions = [];
    const normals = [];
    const texcoords = [];

    function addTriangle(p1, p2, p3, n) {
        positions.push(...p1, ...p2, ...p3);
        normals.push(...n, ...n, ...n);
        texcoords.push(0, 0, 0, 0, 0, 0);
    }

    addTriangle([-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [0, 0, 1]);
    addTriangle([-hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd], [0, 0, 1]);
    addTriangle([hw, -hh, -hd], [-hw, -hh, -hd], [-hw, hh, -hd], [0, 0, -1]);
    addTriangle([hw, -hh, -hd], [-hw, hh, -hd], [hw, hh, -hd], [0, 0, -1]);
    addTriangle([-hw, hh, hd], [hw, hh, hd], [hw, hh, -hd], [0, 1, 0]);
    addTriangle([-hw, hh, hd], [hw, hh, -hd], [-hw, hh, -hd], [0, 1, 0]);
    addTriangle([-hw, -hh, -hd], [hw, -hh, -hd], [hw, -hh, hd], [0, -1, 0]);
    addTriangle([-hw, -hh, -hd], [hw, -hh, hd], [-hw, -hh, hd], [0, -1, 0]);
    addTriangle([-hw, -hh, -hd], [-hw, -hh, hd], [-hw, hh, hd], [-1, 0, 0]);
    addTriangle([-hw, -hh, -hd], [-hw, hh, hd], [-hw, hh, -hd], [-1, 0, 0]);
    addTriangle([hw, -hh, hd], [hw, -hh, -hd], [hw, hh, -hd], [1, 0, 0]);
    addTriangle([hw, -hh, hd], [hw, hh, -hd], [hw, hh, hd], [1, 0, 0]);

    return { position: positions, normal: normals, texcoord: texcoords };
}

export function createPlaneGeometry(width, depth) {
    const hw = width / 2, hd = depth / 2;
    const positions = [
        -hw, 0, -hd, hw, 0, hd, hw, 0, -hd,
        -hw, 0, -hd, -hw, 0, hd, hw, 0, hd,
    ];
    const normals = [
        0, 1, 0, 0, 1, 0, 0, 1, 0,
        0, 1, 0, 0, 1, 0, 0, 1, 0,
    ];
    const texcoords = [
        0, 0, 1, 1, 1, 0,
        0, 0, 0, 1, 1, 1,
    ];
    return { position: positions, normal: normals, texcoord: texcoords };
}

export function createSphereGeometry(radius, latBands, longBands) {
    const positions = [];
    const normals = [];
    const texcoords = [];

    for (let lat = 0; lat <= latBands; ++lat) {
        const theta = lat * Math.PI / latBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for (let lon = 0; lon <= longBands; ++lon) {
            const phi = lon * 2 * Math.PI / longBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;
            const u = 1 - lon / longBands;
            const v = 1 - lat / latBands;
            positions.push(radius * x, radius * y, radius * z);
            normals.push(x, y, z);
            texcoords.push(u, v);
        }
    }

    const indices = [];
    for (let lat = 0; lat < latBands; ++lat) {
        for (let lon = 0; lon < longBands; ++lon) {
            const first = lat * (longBands + 1) + lon;
            const second = first + longBands + 1;
            indices.push(first, second, first + 1,
                second, second + 1, first + 1);
        }
    }

    const out = { position: [], normal: [], texcoord: [] };
    for (const i of indices) {
        out.position.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        out.normal.push(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);
        out.texcoord.push(texcoords[i * 2], texcoords[i * 2 + 1]);
    }
    return out;
}