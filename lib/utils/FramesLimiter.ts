import { Clock } from "three"

export default class FramesLimiter {

  protected elapsedTimeClock = new Clock(true)
  protected deltaClock = new Clock(true)
  protected previousTime = 0

  protected frameDuration = 0

  constructor(maxFPS: number) {
    this.frameDuration = 1000.0 / maxFPS
    this.elapsedTimeClock.getDelta() // To avoid Infinity value
    this.deltaClock.getDelta()
  }

  get deltaTime(): number {
    return this.deltaClock.getDelta()
  }

  canExecute(): boolean {
    const currentTime = this.elapsedTimeClock.getElapsedTime() * 1000.0
    const elpapsedTime = currentTime - this.previousTime
    if (elpapsedTime >= this.frameDuration) {
      this.previousTime = currentTime - (elpapsedTime % this.frameDuration)
      return true
    }
    return false
  }
}