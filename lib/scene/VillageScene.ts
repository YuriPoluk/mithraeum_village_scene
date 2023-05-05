import {
  DirectionalLight,
  Mesh,
  Object3D,
  PerspectiveCamera,
  PointLight,
  Raycaster,
  Scene,
  Shader,
  Vector2,
  WebGLRenderer,
  EquirectangularReflectionMapping,
  Material,
  AnimationMixer,
  ShaderMaterial,
  MeshStandardMaterial,
  BoxGeometry,
  Euler,
  Group,
  LinearFilter,
  NormalBlending,
  Quaternion,
  Vector3,
  MeshBasicMaterial,
} from 'three'
import { EffectComposer, Pass } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SelectiveUnrealBloomPass } from '../postprocessing/SelectiveUnrealBloomPass'

import { GUI } from 'dat.gui'
import gsap from 'gsap'

import AssetLoader from '../utils/AssetLoader'
import { MODELS, CAMERA_PARAMS, Building, ZoomableBuilding } from '../constants'
import ResourceDisposer from '../utils/ResourceDisposer'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createFogPlane } from './SDFCloud'
import FogMaterial from './VolumetricCloud'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

export type Building = keyof typeof Building
export type ZoomableBuilding = keyof typeof ZoomableBuilding

export function isZoomableBuildingorNull(b: Building | null): b is ZoomableBuilding | null {
  return b == null || Object.keys(ZoomableBuilding).includes(b)
}

export default class VillageScene {
  private scene!: Scene
  private camera!: PerspectiveCamera
  private renderer!: WebGLRenderer
  private shaders: Shader[] = []
  private composer!: EffectComposer
  private renderPass!: RenderPass
  private raycaster = new Raycaster()
  private objectsCreated = false
  private invalidated = false
  private pointer!: Vector2
  private directionalLight!: DirectionalLight
  private listenerClick: (e: MouseEvent) => void
  private listenerMove: (e: MouseEvent) => void
  private resourceDisposer = new ResourceDisposer()
  private hoverMeshes: Record<string, Mesh | null> = {}
  private animationMixers: Record<string, AnimationMixer> = {}
  private bloomPass!: SelectiveUnrealBloomPass
  private fog!: Mesh
  private currentSelectedBuilding: ZoomableBuilding | null = null
  private controls!: OrbitControls
  hoverChangeExternalCb?: (b: Building | null) => void
  onClickExternalCb?: () => void

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer
    this.initGraphics()

    this.listenerClick = this.onClick.bind(this)
    addEventListener('pointerdown', this.listenerClick)
    this.listenerMove = this.checkHover.bind(this)
    addEventListener('pointermove', this.listenerMove)
  }

  async initScene() {
    await this.initObjects()
    this.initGui()
  }

  onClick() {
    if (this.onClickExternalCb) this.onClickExternalCb()
    // if (isSelectableBuildingorNull(this.currentHoveredBuilding)) this.selectBuilding(this.currentHoveredBuilding)
  }

  findBuildingByPoint(e: MouseEvent): Building | null {
    this.pointer.x = (e.clientX / this.renderer.domElement.offsetWidth) * 2 - 1
    this.pointer.y = -(e.clientY / this.renderer.domElement.offsetHeight) * 2 + 1

    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersects = this.raycaster.intersectObjects(this.scene.children)
    if (intersects.length == 0) {
      return null
    } else {
      const intersected = intersects[0].object
      let name

      const buildings = Object.keys(Building)

      intersected.traverse((o) => {
        if (buildings.includes(o.name) || buildings.includes(o.name.split('.')[0])) {
          name = o.name
        }
      })

      if (!name) {
        intersected.traverseAncestors((o) => {
          if (buildings.includes(o.name) || buildings.includes(o.name.split('.')[0])) {
            name = o.name
          }
        })
      }

      return name || null
    }
  }

  private previousHoveredBuilding: Building | null = null
  private currentHoveredBuilding: Building | null = null

  checkHover(e: MouseEvent) {
    if (!this.pointer /*|| this.currentSelectedBuilding*/) return

    // this.previousHoveredBuilding = this.currentHoveredBuilding
    // this.currentHoveredBuilding =
    const hoveredBuilding = this.findBuildingByPoint(e)
    if (this.hoverChangeExternalCb) this.hoverChangeExternalCb(hoveredBuilding)
    // if (!this.currentHoveredBuilding && this.previousHoveredBuilding) {
    //   this.unhoverBuilding(this.previousHoveredBuilding)
    // } else if (this.currentHoveredBuilding !== this.previousHoveredBuilding) {
    //   if (this.previousHoveredBuilding) this.unhoverBuilding(this.previousHoveredBuilding)
    //   if (this.currentHoveredBuilding) this.hoverBuilding(this.currentHoveredBuilding)
    // }
  }

  hoverBuilding(b: Building, delay: number = 0) {
    const hoverMesh = this.hoverMeshes[b]
    if (hoverMesh != null) {
      const hoverMaterial = hoverMesh.material as Material
      gsap.to(hoverMaterial, {
        opacity: 1,
        onStart: () => {
          hoverMesh.visible = true
        },
        duration: 0.3,
        delay,
      })
    }
  }

  unhoverBuilding(b: Building, delay: number = 0) {
    const hoverMesh = this.hoverMeshes[b]
    if (hoverMesh) {
      const hoverMaterial = hoverMesh.material as Material
      gsap.to(hoverMaterial, {
        opacity: 0,
        onComplete: () => {
          hoverMesh.visible = false
        },
        duration: 0.05,
        delay,
      })
    }
  }

  zoomBuilding(newZoomtarget: ZoomableBuilding | null, currentlyZoomedTo: ZoomableBuilding | null) {
    if (currentlyZoomedTo) {
      this.unzoomBuilding(currentlyZoomedTo)
      return
    }

    // this.currentSelectedBuilding = b
    const target = newZoomtarget || 'default'
    this.animateCameraTo(target)
    // this.unhoverBuilding(this.currentHoveredBuilding, 0.3)
  }

  unzoomBuilding(b: ZoomableBuilding | null) {
    if (!b) return

    this.animateCameraTo('default')
    // this.currentSelectedBuilding = null
    // this.hoverBuilding(this.currentHoveredBuilding!, 0.3)
  }

  private cameraAnimations: gsap.core.Tween[] = []

  animateCameraTo(b: ZoomableBuilding | 'default') {
    const cameraParams = CAMERA_PARAMS[b]
    const { quaternion, position, rotationDelay, rotationDuration, translationDelay, translationDuration } = cameraParams
    const defaultDuration = 0.7
    const defaultDelay = 0
    this.cameraAnimations.forEach((a) => {
      a.kill()
    })

    const rotation = new Euler().setFromQuaternion(quaternion)
    const rotationAnim = gsap.to(this.camera.rotation, {
      x: rotation.x,
      y: rotation.y,
      z: rotation.z,
      ease: 'power3.inOut',
      duration: rotationDuration || defaultDuration,
      delay: rotationDelay || defaultDelay,
    })

    const positionAnim = gsap.to(this.camera.position, {
      x: position.x,
      y: position.y,
      z: position.z,
      ease: 'power3.inOut',
      duration: translationDuration || defaultDuration,
      delay: translationDelay || defaultDelay,
    })

    this.cameraAnimations = [positionAnim, rotationAnim]
  }

  initGraphics() {
    this.scene = new Scene()
    this.camera = new PerspectiveCamera(22.9, 1, 0.001, 25.0)
    this.camera.position.copy(CAMERA_PARAMS.default.position)
    this.camera.rotation.setFromQuaternion(CAMERA_PARAMS.default.quaternion)
    this.directionalLight = new DirectionalLight(0x9488c3, 1.48)
    this.scene.add(this.directionalLight)
    const lightTarget = new Object3D()
    lightTarget.position.set(0, 0, -10)
    this.directionalLight.target = lightTarget

    AssetLoader.loadEXRTextureAsync('/scene/textures/Autumn_Forest.exr').then((envTexture) => {
      envTexture.mapping = EquirectangularReflectionMapping
      this.scene.environment = envTexture
      this.scene.background = envTexture
    })

    this.composer = new EffectComposer(this.renderer)
    this.renderPass = new RenderPass(this.scene, this.camera)
    this.bloomPass = new SelectiveUnrealBloomPass(
      new Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.45,
      null,
      this.scene,
      this.camera,
    )
    this.composer.addPass(this.renderPass)
    this.composer.addPass(this.bloomPass as unknown as Pass)

    const purpleLight1 = new PointLight(0xff3500, 5, 3)
    purpleLight1.position.set(-0.66, -0.2, 3.953)
    this.scene.add(purpleLight1)

    const purpleLight2 = new PointLight(0xff3500, 5, 3)
    purpleLight2.position.set(1.53, -0.07, 3.146)
    this.scene.add(purpleLight2)

    this.fog = new Mesh(new BoxGeometry(5, 5, 5), new FogMaterial(this.camera))
    this.fog.position.y = 1
    this.fog.position.z = -1
    // this.fog.scale.set(3, 3, 3)
    // this.scene.add(this.fog)

    // this.controls = new OrbitControls(this.camera, this.renderer.domElement)
  }

  fixGroupNames(assetPath: string, asset: GLTF) {
    const buildings = Object.keys(Building)

    if (buildings.includes(assetPath.split('.')[0])) asset.scene.name = assetPath.split('.')[0]

    return asset
  }

  async initObjects() {
    const animations = ['farm.glb', 'lumbermill.glb', 'mine.glb', 'townhall.glb']
    const bloomModels = ['army.glb', 'siege.glb', 'battle.glb']

    for (let assetPath of MODELS) {
      let gltf = await AssetLoader.loadModelAsync('/scene/models/' + assetPath)
      gltf = this.fixGroupNames(assetPath, gltf)
      const scene = gltf.scene
      this.resourceDisposer.addModel(scene)
      this.scene.add(scene)

      scene.traverse((c) => {
        if (c instanceof Mesh) {
          const material = c.material as MeshStandardMaterial
          material.alphaTest = 0.87
        }
      })

      if (assetPath == 'flag_fort_positioning.glb') {
        const flag = scene
        const mat = (flag.children[0].children[2] as Mesh).material as MeshStandardMaterial
        const tex = await AssetLoader.loadTextureAsync('/scene/flag.jpg')
        mat.map = tex
      }

      if (bloomModels.includes(assetPath)) {
        scene.traverse((c) => {
          if (c instanceof Mesh) this.bloomPass.selectedObjects.push(c)
        })
      }

      if (animations.includes(assetPath)) {
        const mixer = new AnimationMixer(scene)
        const assetName = assetPath.split('.')[0]
        this.animationMixers[assetName] = mixer
        const clips = gltf.animations
        clips.forEach(function (clip) {
          mixer.clipAction(clip).play()
        })
      }
    }

    const hoverableBuildings = ['barracks', 'farm', 'fort', 'lumbermill', 'mine', 'smithy', 'townhall']

    for (let building of hoverableBuildings) {
      const gltfScene = (await AssetLoader.loadModelAsync('/scene/models/' + building + '_hover.glb')).scene
      this.scene.add(gltfScene)
      this.bloomPass.selectedObjects.push(gltfScene.children[0])
      const mesh = gltfScene.children[0] as Mesh
      const material = mesh.material as Material
      material.dispose()
      mesh.material = new MeshBasicMaterial({ color: 0xf57e02 })
      mesh.visible = false
      this.hoverMeshes[building] = mesh
    }

    this.hoverMeshes[Building.army] = null
    this.hoverMeshes[Building.siege] = null
    this.hoverMeshes[Building.battle] = null

    const cloud = createFogPlane()
    cloud.position.y = 2
    // this.scene.add( cloud)
    this.cloudPlane = cloud

    this.objectsCreated = true
    this.pointer = new Vector2()
  }

  cameras!: Group

  cloudPlane!: Mesh

  elapsedTime = 0

  update(dt: number) {
    if (!this.objectsCreated) return

    this.elapsedTime += dt
    this.shaders.forEach((s) => {
      s.uniforms.fogTime = { value: this.elapsedTime }
    })
    for (const animationName in this.animationMixers) {
      this.animationMixers[animationName].update(dt)
    }

    // this.controls.update()
    const mat = this.cloudPlane?.material as ShaderMaterial
    if (mat) mat.uniforms.frame.value++
  }

  render(dt: number) {
    if (this.invalidated) return

    this.update(dt)
    this.composer.render()
  }

  dispose() {
    this.invalidated = true
    removeEventListener('pointermove', this.listenerMove)
    removeEventListener('pointerdown', this.listenerClick)

    this.renderPass.dispose()
    this.composer.dispose()
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h
    this.camera.fov = 22.9
    this.camera.updateProjectionMatrix()
    this.composer?.setSize(w, h)
  }

  initGui() {
    const gui = new GUI()
    gui.addFolder('light').add(this.directionalLight, 'intensity', 0, 5)

    const bloomFolder = gui.addFolder('bloom')
    bloomFolder.add(this.bloomPass, 'strength', 0, 8)
    bloomFolder.add(this.bloomPass, 'threshold', 0, 1)
    bloomFolder.add(this.bloomPass, 'radius', 0, 2)

    // const fogFolder = gui.addFolder('fog')
    // fogFolder
    //     .add(this.fog.position, 'x', -5, 5)
    //     .name('position x')
    // fogFolder
    //     .add(this.fog.position, 'y', -5, 5)
    //     .name('position y')
    // fogFolder
    //     .add(this.fog.position, 'z', -15, 5)
    //     .name('position z')
    // fogFolder
    //     .add(this.fog.rotation, 'x', -Math.PI, Math.PI)
    //     .name('rotation x')
    // fogFolder
    //     .add(this.fog.rotation, 'y', -Math.PI, Math.PI)
    //     .name('rotation y')
    // fogFolder
    //     .add(this.fog.rotation, 'z', -Math.PI, Math.PI)
    //     .name('rotation z')
  }
}
