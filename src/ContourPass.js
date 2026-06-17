import { createShaderProgram, getUniforms } from './ShaderProgram.js';
import { bindMeshAttributes } from './Mesh.js';
import vsSource from './shaders/contour.vert?raw';
import fsSource from './shaders/contour.frag?raw';

export function createContourProgram(gl) {
    const attribs = ['a_position', 'a_normal'];
    const programInfo = createShaderProgram(gl, vsSource, fsSource, attribs);
    getUniforms(gl, programInfo, [
        'u_projection',
        'u_view',
        'u_world',
        'u_contourWidth',
        'u_contourColor'
    ]);
    programInfo.attribLocations = {};
    attribs.forEach(attr => {
        programInfo.attribLocations[attr] = gl.getAttribLocation(programInfo.program, attr);
    });
    return programInfo;
}


export function renderContourPass(gl, programInfo, meshes, camera, worldMatrix,
    contourWidth = 0.05, contourColor = [0, 0, 0], depthFuncOverride = null) {
    gl.useProgram(programInfo.program);

    gl.cullFace(gl.FRONT);
    gl.depthMask(false);
    gl.enable(gl.DEPTH_TEST);


    if (depthFuncOverride) {
        gl.depthFunc(gl[depthFuncOverride]);
    } else {
        gl.depthFunc(gl.LESS);
    }

    const projMatrix = camera.getProjectionMatrix();
    const viewMatrix = camera.getViewMatrix();

    gl.uniformMatrix4fv(programInfo.uniformLocations.u_projection, false, projMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.u_view, false, viewMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.u_world, false, worldMatrix);
    gl.uniform1f(programInfo.uniformLocations.u_contourWidth, contourWidth);
    gl.uniform3fv(programInfo.uniformLocations.u_contourColor, contourColor);

    for (const mesh of meshes) {
        bindMeshAttributes(gl, programInfo, mesh);
        gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
    }

    gl.cullFace(gl.BACK);
    gl.depthMask(true);
    if (depthFuncOverride) {
        gl.depthFunc(gl.LESS);
    }
}
