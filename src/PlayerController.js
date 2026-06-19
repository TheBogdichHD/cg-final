export class PlayerController {
    constructor(playerObject, inputManager) {
        this.player = playerObject;
        this.input = inputManager;
        this.speed = 10;
        this.jumpForce = 8;
        this.currentAngle = 0;
        this.targetAngle = 0;
        this.turnSpeed = 15;

        this.coyoteTime = 0.15;
        this.coyoteTimer = 0;
    }

    update(deltaTime, camera) {
        this.player.velocity[0] = 0;
        this.player.velocity[2] = 0;

        const forward = [
            camera.target[0] - camera.eye[0],
            0,
            camera.target[2] - camera.eye[2]
        ];
        const len = Math.sqrt(forward[0] ** 2 + forward[2] ** 2);
        if (len > 0.001) {
            forward[0] /= len;
            forward[2] /= len;
        }
        const right = [forward[2], 0, -forward[0]];

        let moveZ = 0;
        let moveX = 0;

        if (this.input.isKeyDown('KeyW') || this.input.isKeyDown('ArrowUp')) moveZ += 1;
        if (this.input.isKeyDown('KeyS') || this.input.isKeyDown('ArrowDown')) moveZ -= 1;
        if (this.input.isKeyDown('KeyA') || this.input.isKeyDown('ArrowLeft')) moveX += 1;
        if (this.input.isKeyDown('KeyD') || this.input.isKeyDown('ArrowRight')) moveX -= 1;

        if (moveX !== 0 || moveZ !== 0) {
            const dirX = forward[0] * moveZ + right[0] * moveX;
            const dirZ = forward[2] * moveZ + right[2] * moveX;
            const dirLen = Math.sqrt(dirX * dirX + dirZ * dirZ);
            this.player.velocity[0] = (dirX / dirLen) * this.speed;
            this.player.velocity[2] = (dirZ / dirLen) * this.speed;
            this.targetAngle = Math.atan2(dirX, dirZ);
        }

        if (this.player.grounded) {
            this.coyoteTimer = this.coyoteTime;
        } else {
            this.coyoteTimer -= deltaTime;
        }

        if (this.input.isKeyDown('Space') && (this.player.grounded || this.coyoteTimer > 0)) {
            this.player.velocity[1] = this.jumpForce;
            this.player.grounded = false;
            this.coyoteTimer = 0;
        }

        let angleDiff = this.targetAngle - this.currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const maxTurn = this.turnSpeed * deltaTime;
        if (Math.abs(angleDiff) <= maxTurn) {
            this.currentAngle = this.targetAngle;
        } else {
            this.currentAngle += Math.sign(angleDiff) * maxTurn;
        }

        this.player.rotation[1] = this.currentAngle;
    }
}