import { generateTangents } from './OBJLoader.js';

export function createMeshFromOBJ(gl, geometryData) {
    const data = { ...geometryData };

    if (data.texcoord && data.normal) {
        data.tangent = generateTangents(data.position, data.texcoord);
    } else {
        data.tangent = new Array(data.position.length).fill(0).map((_, i) => i % 3 === 0 ? 1 : 0);
    }

    if (!data.normal) {
        data.normal = data.position.map((_, i) => i % 3 === 2 ? 1 : 0);
    }

    if (!data.texcoord) {
        data.texcoord = new Array((data.position.length / 3) * 2).fill(0);
    }

    const hasColors = data.color && data.color.length > 0;
    let colorData;
    if (hasColors) {
        colorData = data.color;
    } else {
        const vertexCount = data.position.length / 3;
        colorData = new Array(vertexCount * 3).fill(1);
    }

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    function createBuffer(data, numComponents, type = gl.FLOAT, normalize = false) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        return { buffer, numComponents, type, normalize };
    }

    const buffers = {
        position: createBuffer(data.position, 3),
        normal: createBuffer(data.normal, 3),
        texcoord: createBuffer(data.texcoord, 2),
        tangent: createBuffer(data.tangent, 3),
        color: createBuffer(colorData, 3),
    };

    gl.bindVertexArray(null);

    const originalPositions = data.position.slice();

    return {
        vao,
        buffers,
        vertexCount: data.position.length / 3,
        hasColors,
        positions: originalPositions,
        texture: null,
        material: {
            diffuse: [1, 1, 1],
            specular: [0.3, 0.3, 0.3],
            shininess: 32,
            useTexture: false,
        }
    };
}

export function bindMeshAttributes(gl, programInfo, mesh) {
    gl.bindVertexArray(mesh.vao);

    for (const [attrName, loc] of Object.entries(programInfo.attribLocations)) {
        if (loc === undefined || loc === -1) continue;

        const shortName = attrName.replace(/^a_/, '');
        const buf = mesh.buffers[shortName];

        if (buf) {
            gl.enableVertexAttribArray(loc);
            gl.bindBuffer(gl.ARRAY_BUFFER, buf.buffer);
            gl.vertexAttribPointer(loc, buf.numComponents, buf.type, buf.normalize, 0, 0);
        }
    }
}