import { App } from './App.js';

const canvas = document.getElementById('canvas');
if (!canvas) {
    throw new Error('Canvas element not found');
}
const app = new App(canvas);
app.init().catch(console.error);