import App from './App'
import { Building, ZoomableBuilding, isZoomableBuildingorNull } from './scene/VillageScene'

export default App

const canvas = document.querySelector('#app-container') as HTMLCanvasElement
const app = new App(canvas)
app.init().then(() => {
  let previousHoveredBuilding: Building | null = null
  let currentHoveredBuilding: Building | null = null
  let currentZoomedBuilding: ZoomableBuilding | null = null

  const onHoverChange = (b: Building | null) => {
    if (currentZoomedBuilding) return

    previousHoveredBuilding = currentHoveredBuilding
    currentHoveredBuilding = b

    if (!currentHoveredBuilding && previousHoveredBuilding) {
      app.unhoverBuilding(previousHoveredBuilding)
    } else if (currentHoveredBuilding !== previousHoveredBuilding) {
      if (previousHoveredBuilding) app.unhoverBuilding(previousHoveredBuilding)
      if (currentHoveredBuilding) app.hoverBuilding(currentHoveredBuilding)
    }
  }

  const onClick = () => {
    if (currentZoomedBuilding) {
      app.unzoomBuilding(currentZoomedBuilding)
      app.hoverBuilding(currentZoomedBuilding, 0.3)
      currentHoveredBuilding = currentZoomedBuilding
      currentZoomedBuilding = null
    } else if (isZoomableBuildingorNull(currentHoveredBuilding)) {
      app.zoomBuilding(currentHoveredBuilding, currentZoomedBuilding)
      currentZoomedBuilding = currentHoveredBuilding
      if (currentHoveredBuilding) app.unhoverBuilding(currentHoveredBuilding, 0.3)
    } else {
      //code for selecting non zoomable buildings (army, siege, battle) probably goes here
    }
  }

  app.onHoverChange(onHoverChange)
  app.onClick(onClick)
})
