import App from './App'

export default App

const canvas = document.querySelector('#app-container') as HTMLCanvasElement
const app = new App(canvas)
//@ts-ignore
window.MITHR_APP = app

app.init()
