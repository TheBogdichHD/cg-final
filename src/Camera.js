export class Camera {
    constructor(fov, aspect, near, far) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;

        this.theta = Math.PI / 4;
        this.phi = Math.PI / 4;
        this.radius = 5;
        this.target = [0, 0, 0];

        this.viewMatrix = m4.identity();
        this.projectionMatrix = m4.perspective(fov, aspect, near, far);
    }

    updateViewMatrix() {
        const eye = [
            this.target[0] + this.radius * Math.sin(this.phi) * Math.cos(this.theta),
            this.target[1] + this.radius * Math.cos(this.phi),
            this.target[2] + this.radius * Math.sin(this.phi) * Math.sin(this.theta),
        ];
        const up = [0, 1, 0];
        this.viewMatrix = m4.inverse(m4.lookAt(eye, this.target, up));
        this.eye = eye;
    }

    setAspect(aspect) {
        this.aspect = aspect;
        this.projectionMatrix = m4.perspective(this.fov, aspect, this.near, this.far);
    }

    getViewMatrix() { return this.viewMatrix; }
    getProjectionMatrix() { return this.projectionMatrix; }
}