export class PhysicsSystem {
    constructor() {
        this.gravity = -15;
        this.player = null;
        this.friction = 0.85;
        this.airFriction = 0.98;
    }

    setPlayer(playerObject) {
        this.player = playerObject;
    }

    update(deltaTime, sceneObjects) {
        if (!this.player) return;
        const player = this.player;
        const halfWidth = player.halfWidth ?? 0.35;
        const height = player.heightTotal ?? 2.0;
        const footOffset = player.footOffset ?? 0.7;
        const epsilon = 0.001;

        player.velocity[1] += this.gravity * deltaTime;

        let newY = player.position[1] + player.velocity[1] * deltaTime;
        let grounded = false;
        for (const obj of sceneObjects) {
            if (!obj.isStatic || !obj.boundingBox) continue;
            const bb = obj.boundingBox;
            if (player.position[0] + halfWidth <= bb.min[0] || player.position[0] - halfWidth >= bb.max[0]) continue;
            if (player.position[2] + halfWidth <= bb.min[2] || player.position[2] - halfWidth >= bb.max[2]) continue;

            const playerMinY = newY - footOffset;
            const playerMaxY = newY + (height - footOffset);
            if (playerMaxY <= bb.min[1] || playerMinY >= bb.max[1]) continue;

            if (player.velocity[1] > 0) {
                newY = bb.min[1] - (height - footOffset) - epsilon;
                player.velocity[1] = 0;
            } else {
                newY = bb.max[1] + footOffset + epsilon;
                player.velocity[1] = 0;
                grounded = true;
            }
            break;
        }
        player.position[1] = newY;
        player.grounded = grounded;

        if (grounded) {
            player.velocity[0] *= this.friction;
            player.velocity[2] *= this.friction;
            if (Math.abs(player.velocity[0]) < 0.01) player.velocity[0] = 0;
            if (Math.abs(player.velocity[2]) < 0.01) player.velocity[2] = 0;
        } else {
            player.velocity[0] *= this.airFriction;
            player.velocity[2] *= this.airFriction;
        }

        let newX = player.position[0] + player.velocity[0] * deltaTime;
        for (const obj of sceneObjects) {
            if (!obj.isStatic || !obj.boundingBox) continue;
            const bb = obj.boundingBox;
            const playerMinY = player.position[1] - footOffset;
            const playerMaxY = player.position[1] + (height - footOffset);
            if (playerMaxY <= bb.min[1] || playerMinY >= bb.max[1]) continue;
            if (player.position[2] + halfWidth <= bb.min[2] || player.position[2] - halfWidth >= bb.max[2]) continue;

            const playerMinX = newX - halfWidth;
            const playerMaxX = newX + halfWidth;
            if (playerMaxX <= bb.min[0] || playerMinX >= bb.max[0]) continue;

            if (player.velocity[0] > 0) {
                newX = bb.min[0] - halfWidth - epsilon;
            } else {
                newX = bb.max[0] + halfWidth + epsilon;
            }
            player.velocity[0] = 0;
            break;
        }
        player.position[0] = newX;

        let newZ = player.position[2] + player.velocity[2] * deltaTime;
        for (const obj of sceneObjects) {
            if (!obj.isStatic || !obj.boundingBox) continue;
            const bb = obj.boundingBox;
            const playerMinY = player.position[1] - footOffset;
            const playerMaxY = player.position[1] + (height - footOffset);
            if (playerMaxY <= bb.min[1] || playerMinY >= bb.max[1]) continue;
            if (player.position[0] + halfWidth <= bb.min[0] || player.position[0] - halfWidth >= bb.max[0]) continue;

            const playerMinZ = newZ - halfWidth;
            const playerMaxZ = newZ + halfWidth;
            if (playerMaxZ <= bb.min[2] || playerMinZ >= bb.max[2]) continue;

            if (player.velocity[2] > 0) {
                newZ = bb.min[2] - halfWidth - epsilon;
            } else {
                newZ = bb.max[2] + halfWidth + epsilon;
            }
            player.velocity[2] = 0;
            break;
        }
        player.position[2] = newZ;
    }
}