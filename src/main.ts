import App from '../lib'
import './index.css'

const canvas = document.querySelector('#app-container') as HTMLCanvasElement
const app = new App(canvas)
//@ts-ignore
window.MITHR_APP = app

await app.init()
