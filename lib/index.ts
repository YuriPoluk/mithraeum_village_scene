import App from './App'

export default App

const canvas = document.querySelector('#app-container') as HTMLCanvasElement
const app = new App(canvas)
//@ts-ignore
window.MITHR_APP = app

app.init()

// private previousHoveredBuilding: Building | null = null
//   private currentHoveredBuilding: Building | null = null

//   checkHover(e: MouseEvent) {
//     if (!this.pointer || this.currentSelectedBuilding) return

//     this.previousHoveredBuilding = this.currentHoveredBuilding
//     this.currentHoveredBuilding = this.findBuildingByPoint(e)
//     if (!this.currentHoveredBuilding && this.previousHoveredBuilding) {
//       this.unhoverBuilding(this.previousHoveredBuilding)
//     } else if (this.currentHoveredBuilding !== this.previousHoveredBuilding) {
//       if (this.previousHoveredBuilding) this.unhoverBuilding(this.previousHoveredBuilding)
//       if (this.currentHoveredBuilding) this.hoverBuilding(this.currentHoveredBuilding)
//     }
//   }

//   onClick() {
//     if (isSelectableBuildingorNull(this.currentHoveredBuilding)) this.selectBuilding(this.currentHoveredBuilding)
//   }

// this.listenerClick = this.onClick.bind(this)
// addEventListener('pointerdown', this.listenerClick)
// this.listenerMove = this.checkHover.bind(this)
// addEventListener('pointermove', this.listenerMove)
// private currentSelectedBuilding: SelectableBuilding | null = null
//
