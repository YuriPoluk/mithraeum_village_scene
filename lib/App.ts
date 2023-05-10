import { WebGLRenderer } from 'three'
import FramesLimiter from './utils/FramesLimiter'
import VillageScene, { Building, ZoomableBuilding } from './scene/VillageScene'
const APP_MAX_FPS = 60

export default class MithraeumBannersScene {
  private renderer: WebGLRenderer
  private invalidated = false
  private framesLimiter: FramesLimiter
  private currentScene!: VillageScene

  constructor(container: HTMLCanvasElement) {
    this.framesLimiter = new FramesLimiter(APP_MAX_FPS)

    this.renderer = new WebGLRenderer({
      canvas: container,
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true,
    })

    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.setScene(new VillageScene(this.renderer))
    this.onResize()
    this.render()

    addEventListener('resize', this.onResize.bind(this))
  }

  setScene(scene: VillageScene) {
    this.currentScene = scene
  }

  onResize() {
    const { width, height } = this.renderer.domElement.getBoundingClientRect()

    this.renderer.setSize(width, height, false)
    if (this.currentScene) {
      this.currentScene.resize(width, height)
    }
  }

  private render() {
    if (this.invalidated) {
      return
    }

    if (this.framesLimiter.canExecute()) {
      this.currentScene?.render(this.framesLimiter.deltaTime)
    }

    requestAnimationFrame(() => {
      this.render()
    })
  }

  // API

  async init() {
    await this.currentScene.initScene()
  }

  onHoverChange(cb: (b: Building | null) => void) {
    this.currentScene.hoverChangeExternalCb = cb
  }

  onClick(cb: () => void) {
    this.currentScene.onClickExternalCb = cb
  }

  hoverBuilding(b: Building, delay: number = 0) {
    this.currentScene.hoverBuilding(b, delay)
  }

  unhoverBuilding(b: Building, delay: number = 0) {
    this.currentScene.unhoverBuilding(b, delay)
  }

  zoomBuilding(newZoomtarget: ZoomableBuilding | null, currentlyZoomedTo: ZoomableBuilding | null) {
    this.currentScene.zoomBuilding(newZoomtarget, currentlyZoomedTo)
  }

  unzoomBuilding(b: ZoomableBuilding | null) {
    this.currentScene.unzoomBuilding(b)
  }

  async setFlagsBone(path: string) {
    this.currentScene.setFlagsBone(path)
  }

  dispose() {
    this.invalidated = true
    this.currentScene.dispose()
    this.renderer.clear()
    this.renderer.dispose()
  }
}
