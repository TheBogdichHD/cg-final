export function createShaderProgram(gl, vsSource, fsSource, attribs) {
    const program = webglUtils.createProgramFromSources(gl, [vsSource, fsSource], attribs);
    return {
        program,
        uniformLocations: {},
        attribLocations: {},
    };
}

export function getUniforms(gl, programInfo, names) {
    names.forEach(name => {
        programInfo.uniformLocations[name] = gl.getUniformLocation(programInfo.program, name);
    });
}