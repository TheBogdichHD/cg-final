export { parseOBJ, parseMTL, generateTangents };

function parseOBJ(text) {
    const objPositions = [[0, 0, 0]];
    const objTexcoords = [[0, 0]];
    const objNormals = [[0, 0, 0]];
    const objColors = [[0, 0, 0]];

    const objVertexData = [objPositions, objTexcoords, objNormals, objColors];

    let webglVertexData = [[], [], [], []];
    const geometries = [];
    let geometry;
    let groups = ['default'];
    let material = 'default';
    let object = 'default';

    function newGeometry() {
        if (geometry && geometry.data.position.length) {
            geometry = undefined;
        }
    }

    function setGeometry() {
        if (!geometry) {
            geometry = {
                object,
                groups,
                material,
                data: {
                    position: [],
                    texcoord: [],
                    normal: [],
                    color: [],
                },
            };
            geometries.push(geometry);
            webglVertexData = [
                geometry.data.position,
                geometry.data.texcoord,
                geometry.data.normal,
                geometry.data.color,
            ];
        }
    }

    function addVertex(vert) {
        const ptn = vert.split('/');
        ptn.forEach((objIndexStr, i) => {
            if (!objIndexStr) return;
            const objIndex = parseInt(objIndexStr);
            const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
            webglVertexData[i].push(...objVertexData[i][index]);
            if (i === 0 && objColors.length > 1) {
                geometry.data.color.push(...objColors[index]);
            }
        });
    }

    const keywords = {
        v(parts) {
            if (parts.length > 3) {
                objPositions.push(parts.slice(0, 3).map(parseFloat));
                objColors.push(parts.slice(3).map(parseFloat));
            } else {
                objPositions.push(parts.map(parseFloat));
            }
        },
        vn(parts) {
            objNormals.push(parts.map(parseFloat));
        },
        vt(parts) {
            objTexcoords.push(parts.map(parseFloat));
        },
        f(parts) {
            setGeometry();
            const numTriangles = parts.length - 2;
            for (let tri = 0; tri < numTriangles; ++tri) {
                addVertex(parts[0]);
                addVertex(parts[tri + 1]);
                addVertex(parts[tri + 2]);
            }
        },
        s: () => { },
        mtllib(parts) { },
        usemtl(parts, unparsedArgs) {
            material = unparsedArgs;
            newGeometry();
        },
        g(parts) {
            groups = parts;
            newGeometry();
        },
        o(parts, unparsedArgs) {
            object = unparsedArgs;
            newGeometry();
        },
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) continue;
        const m = keywordRE.exec(line);
        if (!m) continue;
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.warn('unhandled keyword:', keyword);
            continue;
        }
        handler(parts, unparsedArgs);
    }

    for (const geom of geometries) {
        geom.data = Object.fromEntries(
            Object.entries(geom.data).filter(([, arr]) => arr.length > 0)
        );
    }

    return {
        geometries,
        materialLibs: [],
    };
}
function parseMTL(text) {
    const materials = {};
    let material;

    text = text.trim().replace(/^\uFEFF/, '');

    const keywords = {
        newmtl(parts, unparsedArgs) {
            material = {};
            materials[unparsedArgs.trim()] = material;
        },
        Ns(parts) { if (material) material.shininess = parseFloat(parts[0]); },
        Ni(parts) { if (material) material.shininess = parseFloat(parts[0]); },
        Ka(parts) { if (material) material.ambient = parts.map(parseFloat); },
        Kd(parts) { if (material) material.diffuse = parts.map(parseFloat); },
        Ks(parts) { if (material) material.specular = parts.map(parseFloat); },
        Ke(parts) { if (material) material.emissive = parts.map(parseFloat); },
        d(parts) { if (material) material.opacity = parseFloat(parts[0]); },
        illum(parts) { if (material) material.illum = parseInt(parts[0]); },
        map_Kd(parts, unparsedArgs) {
            if (material) material.diffuseMap = unparsedArgs.trim();
        },
        map_Ks(parts, unparsedArgs) {
            if (material) material.specularMap = unparsedArgs.trim();
        },
        map_Bump(parts, unparsedArgs) {
            if (material) material.normalMap = unparsedArgs.trim();
        },
    };

    const keywordRE = /^(\w+)\s*(.*)/;

    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim();
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();

        if (line === '' || line.startsWith('#')) continue;
        const m = keywordRE.exec(line);

        if (!m) continue;
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.warn('unhandled keyword:', keyword);
            continue;
        }
        handler(parts, unparsedArgs);
    }

    console.log('parseMTL result:', materials);
    return materials;
}

function generateTangents(position, texcoord) {
    const numFaces = position.length / 3 / 3;
    const tangents = [];
    for (let i = 0; i < numFaces; ++i) {
        const n0 = i * 3;
        const n1 = n0 + 1;
        const n2 = n0 + 2;

        const p0 = position.slice(n0 * 3, n0 * 3 + 3);
        const p1 = position.slice(n1 * 3, n1 * 3 + 3);
        const p2 = position.slice(n2 * 3, n2 * 3 + 3);

        const uv0 = texcoord.slice(n0 * 2, n0 * 2 + 2);
        const uv1 = texcoord.slice(n1 * 2, n1 * 2 + 2);
        const uv2 = texcoord.slice(n2 * 2, n2 * 2 + 2);

        const dp1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
        const dp2 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];

        const duv1 = [uv1[0] - uv0[0], uv1[1] - uv0[1]];
        const duv2 = [uv2[0] - uv0[0], uv2[1] - uv0[1]];

        const f = 1.0 / (duv1[0] * duv2[1] - duv2[0] * duv1[1]);
        let tangent = [1, 0, 0];
        if (Number.isFinite(f)) {
            tangent = [
                f * (duv2[1] * dp1[0] - duv1[1] * dp2[0]),
                f * (duv2[1] * dp1[1] - duv1[1] * dp2[1]),
                f * (duv2[1] * dp1[2] - duv1[1] * dp2[2]),
            ];
            const len = Math.sqrt(tangent[0] ** 2 + tangent[1] ** 2 + tangent[2] ** 2);
            if (len > 0.00001) {
                tangent = tangent.map(v => v / len);
            }
        }
        tangents.push(...tangent, ...tangent, ...tangent);
    }
    return tangents;
}