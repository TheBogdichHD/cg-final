export class OrbitController {
    constructor(canvas, camera) {
        this.canvas = canvas;
        this.camera = camera;
        this.isPointerLocked = false;
        this.sensitivity = 0.002;
        this.zoomSpeed = 0.2;

        this.invertX = true;
        this.invertY = true;

        this._onMouseMove = this._onMouseMove.bind(this);
        this._onWheel = this._onWheel.bind(this);
        this._onPointerLockChange = this._onPointerLockChange.bind(this);
        this._onClick = this._onClick.bind(this);

        canvas.addEventListener('click', this._onClick);
        document.addEventListener('pointerlockchange', this._onPointerLockChange);
    }

    _onClick() {
        if (!this.isPointerLocked) {
            this.canvas.requestPointerLock();
        }
    }

    _onPointerLockChange() {
        if (document.pointerLockElement === this.canvas) {
            this.isPointerLocked = true;
            document.addEventListener('mousemove', this._onMouseMove);
            document.addEventListener('wheel', this._onWheel, { passive: false });
        } else {
            this.isPointerLocked = false;
            document.removeEventListener('mousemove', this._onMouseMove);
            document.removeEventListener('wheel', this._onWheel, { passive: false });
        }
    }

    _onMouseMove(e) {
        if (!this.isPointerLocked) return;
        let dx = e.movementX;
        let dy = e.movementY;

        if (this.invertX) dx = -dx;
        if (!this.invertY) dy = -dy;

        this.camera.theta -= dx * this.sensitivity;
        this.camera.phi -= dy * this.sensitivity;

        const epsilon = 0.001;
        this.camera.phi = Math.max(epsilon, Math.min(Math.PI - epsilon, this.camera.phi));

        this.camera.updateViewMatrix();
    }

    _onWheel(e) {
        if (!this.isPointerLocked) return;
        e.preventDefault();
        this.camera.radius += e.deltaY * this.zoomSpeed * 0.01;
        this.camera.radius = Math.max(0.5, Math.min(20, this.camera.radius));
        this.camera.updateViewMatrix();
    }

    dispose() {
        document.removeEventListener('pointerlockchange', this._onPointerLockChange);
        this.canvas.removeEventListener('click', this._onClick);
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('wheel', this._onWheel, { passive: false });
    }
}