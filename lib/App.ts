import { WebGLRenderer } from 'three'
import FramesLimiter from './utils/FramesLimiter'
import VillageScene from './scene/VillageScene'

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

  onHoverChange(cb: (b: Building) => void) {
    this.currentScene.hoverChangeCallback = cb
  }

  onSelectChange(cb: (b: Building) => void) {
    this.currentScene.selectChangeCallback = cb
  }

  dispose() {
    this.invalidated = true
    this.currentScene.dispose()
    this.renderer.clear()
    this.renderer.dispose()
  }
}
