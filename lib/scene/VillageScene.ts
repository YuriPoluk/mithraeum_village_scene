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
    MeshStandardMaterial
} from 'three';
import { EffectComposer, Pass } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SelectiveUnrealBloomPass } from '../postprocessing/SelectiveUnrealBloomPass'

import {GUI} from 'dat.gui';
import gsap from 'gsap';

import AssetLoader from '../utils/AssetLoader'
import { MODELS, CAMERA_PARAMS, Building, BUILDINGS_LOOKAT_POINTS } from '../constants'
import ResourceDisposer from '../utils/ResourceDisposer' 
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createFogPlane } from './CoolCloud'


type Building = keyof typeof Building
    
export default class VillageScene {
    private scene!: Scene
    private camera!: PerspectiveCamera
    private renderer!: WebGLRenderer
    private shaders: Shader[] = []
    private fogNoiseFrequency = 8.2
    private fogHeightFactor = 0.098
    private fogNoiseMoveSpeed = 0.3
    private fogNoiseImpact = 0.07
    private composer!: EffectComposer
    private renderPass!: RenderPass
    private raycaster = new Raycaster()
    private objectsCreated = false
    private invalidated = false
    private pointer?: Vector2
    private directionalLight!: DirectionalLight
    private listener: (e: MouseEvent) => void
    private resourceDisposer = new ResourceDisposer()
    private hoverMeshes: Record<string, Mesh | null>  = {}
    private animationMixers: Record<string, AnimationMixer> = {}
    private bloomPass!: SelectiveUnrealBloomPass
    // private fog!: Mesh

    constructor(renderer: WebGLRenderer) {
        this.renderer = renderer
        this.initGraphics()

        this.listener = this.findBuildingByClick.bind(this)
        addEventListener('pointerdown', this.listener)
        this.addFogUniforms = this.addFogUniforms.bind(this)
    }

    async initScene() {
        await this.initObjects()
        this.initGui()
    }

    addFogUniforms = (s: Shader) => {
        this.shaders.push(s)
        s.uniforms.fogTime = {value: 0.0};
        s.uniforms.shouldApplyFog = {value: true}
        s.uniforms.fogNoiseFrequency = {value: this.fogNoiseFrequency}
        s.uniforms.fogHeightFactor = {value: this.fogHeightFactor}
        s.uniforms.fogNoiseMoveSpeed = {value: this.fogNoiseMoveSpeed}
        s.uniforms.fogNoiseImpact = {value: this.fogNoiseImpact}
    }

    private currentBuilding: Building | null = null

    findBuildingByClick(e: MouseEvent) {
        if (!this.pointer) this.pointer = new Vector2()

        this.pointer.x = (e.clientX / this.renderer.domElement.offsetWidth) * 2 - 1
        this.pointer.y = -(e.clientY / this.renderer.domElement.offsetHeight) * 2 + 1

        this.raycaster.setFromCamera(this.pointer, this.camera)
        const intersects = this.raycaster.intersectObjects(this.scene.children)
        if (intersects.length == 0) {
            this.selectBuilding(null)
            return
        }
        else {
            const intersected = intersects[0].object
            let name

            intersected.traverse(o => {
                if (Object.keys(Building).includes(o.name))
                    name = o.name
            })

            if (!name) {
                intersected.traverseAncestors(o => {
                    console.log('ancestor', o.name)
                    if (Object.keys(Building).includes(o.name))
                        name = o.name
                })
            }

            name = name || null

            this.selectBuilding(name)    
        }

    }

    private cameraRotateAnimation?: gsap.core.Tween
    private isZoomedIn = false

    selectBuilding(b: Building | null) {
        if (this.currentBuilding == b) 
            return

            console.log(b, this.currentBuilding)
        if (this.currentBuilding)
            this.deselectBuilding(this.currentBuilding)

        this.currentBuilding = b
        if (!b) return

        const currRotation = this.camera.rotation.clone()
        this.camera.lookAt(BUILDINGS_LOOKAT_POINTS[b])
        const targetRotation = this.camera.rotation.clone()
        this.camera.rotation.set(currRotation.x, currRotation.y, currRotation.z)
        this.cameraRotateAnimation?.kill()
        this.cameraRotateAnimation = gsap.to(this.camera.rotation, {
            x: targetRotation.x,
            y: targetRotation.y,
            z: targetRotation.z,
            ease: 'power3.inOut',
            duration: 0.6
        })

        if (!this.isZoomedIn) {
            console.log('select', this.camera)
            this.isZoomedIn = true
            gsap.to(this.camera, {
                zoom: 2,
                ease: 'power3.inOut',
                duration: 0.6,
                onUpdate: () => {
                    this.camera.updateProjectionMatrix()
                }
            })
        }

        const hoverMesh = this.hoverMeshes[b]
        if (hoverMesh != null) {
            console.log(hoverMesh)
            const hoverMaterial = hoverMesh.material as Material
            gsap.to(hoverMaterial, {
                opacity: 1,
                onStart: () => { hoverMesh.visible = true },
                duration: 0.3,
                delay: 0.3
            })
        }
    }

    deselectBuilding(b: Building) {
        console.log('deselect', b)
        const hoverMesh = this.hoverMeshes[b]
        if (hoverMesh != null) {
            const hoverMaterial = hoverMesh.material as Material
            gsap.to(hoverMaterial, {
                opacity: 0,
                onComplete: () => { hoverMesh.visible = false },
                duration: 0.1

            })


            if (this.isZoomedIn) {
                console.log('deselect')
                this.isZoomedIn = false
                gsap.to(this.camera, {
                    zoom: 1,
                    ease: 'power3.inOut',
                    duration: 0.6,
                    onUpdate: () => { this.camera.updateProjectionMatrix()}
                })
            }
        }
    }

    initGraphics() {
        this.scene = new Scene()
        this.camera = new PerspectiveCamera(22.9, 1, 0.001, 25.0);
        this.camera.position.copy(CAMERA_PARAMS.position)
        this.camera.rotation.setFromQuaternion(CAMERA_PARAMS.quaternion)
        this.directionalLight = new DirectionalLight(0x9488C3, 1.48)
        this.scene.add(this.directionalLight)
        const lightTarget = new Object3D()
        lightTarget.position.set(0, 0, -10)
        this.directionalLight.target = lightTarget

        AssetLoader.loadEXRTextureAsync('/scene/textures/Autumn_Forest.exr').then(envTexture => {
            envTexture.mapping = EquirectangularReflectionMapping
            this.scene.environment = envTexture
            this.scene.background = envTexture
        })

        this.composer = new EffectComposer( this.renderer );
        this.renderPass = new RenderPass( this.scene, this.camera );
		this.bloomPass = new SelectiveUnrealBloomPass(new Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.7, null, this.scene, this.camera )
		this.composer.addPass( this.renderPass );
        this.composer.addPass(this.bloomPass as unknown as Pass)

        const purpleLight1 = new PointLight(0xFF3500, 5, 3)
        purpleLight1.position.set(-0.66, -0.2, 3.953)
        this.scene.add(purpleLight1)

        const purpleLight2 = new PointLight(0xFF3500, 5, 3)
        purpleLight2.position.set(1.53, -0.07, 3.146)
        this.scene.add(purpleLight2)

        // this.fog = new Mesh(new BoxGeometry(5, 5, 5), new FogMaterial(this.camera))
        // this.fog.position.y = 1
        // this.fog.position.z = -1
        // this.fog.scale.set(3, 3, 3)
        // this.scene.add(this.fog)

        // this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    }

    async initObjects() {

        const animations = ['farm.glb', 'lumbermill.glb', 'mine.glb'] 
        const bloomModels = ['army.glb', 'siege.glb', 'battle.glb']
        
        for (let assetPath of MODELS) {
            const gltf = await AssetLoader.loadModelAsync('/scene/models/' + assetPath)
            this.resourceDisposer.addModel(gltf.scene)
            this.scene.add(gltf.scene)
            if (assetPath == 'flag_fort_positioning.glb') {
                const flag = gltf.scene
                const mat = (flag.children[0].children[2] as Mesh).material as MeshStandardMaterial
                const tex = await AssetLoader.loadTextureAsync('/scene/flag.jpg')
                mat.map = tex
            }

            if (bloomModels.includes(assetPath)) {
                gltf.scene.traverse(c => {
                    if (c instanceof Mesh)
                        this.bloomPass.selectedObjects.push(c)
                })
            }

            if (animations.includes(assetPath)) {
                const mixer = new AnimationMixer( gltf.scene )
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
            mesh.visible = false
            this.hoverMeshes[building] = mesh
            console.log('hoverable building')
        }

        this.hoverMeshes[Building.army] = null
        this.hoverMeshes[Building.siege] = null
        this.hoverMeshes[Building.battle] = null

        const cloud = createFogPlane()
        cloud.position.y = 2
        // this.scene.add( cloud)
        this.cloudPlane = cloud

        this.scene.traverse(c => {
            if (c instanceof Mesh)
                if (c.material instanceof Material)
                    c.material.onBeforeCompile = this.addFogUniforms
        })

        this.objectsCreated = true
    }

    cloudPlane!: Mesh

    elapsedTime = 0

    update(dt: number) {
        if (!this.objectsCreated) return

        this.elapsedTime += dt
        this.shaders.forEach(s => {
            s.uniforms.fogTime = {value: this.elapsedTime}
        })
        for (const animationName in this.animationMixers) {
            this.animationMixers[animationName].update(dt)
        }

        // this.controls.update()
        const mat = this.cloudPlane?.material as ShaderMaterial
        if (mat)
            mat.uniforms.frame.value++
    }

    render(dt: number) {
        if (this.invalidated) return

        this.update(dt)
        this.composer.render()
    }

    dispose() {
        this.invalidated = true
        removeEventListener('pointermove', this.listener)
        
        this.renderPass.dispose()
        this.composer.dispose()
    }

    resize(w: number, h: number) {
        this.camera.aspect = w / h
        this.camera.updateProjectionMatrix()
        this.composer?.setSize(w, h)
    }

    initGui() {
        const gui = new GUI()
        gui.addFolder('light')     
            .add(this.directionalLight, 'intensity', 0, 5)
 
        const bloomFolder = gui.addFolder('bloom')      
        bloomFolder
            .add(this.bloomPass, 'strength', 0, 8)
        bloomFolder
            .add(this.bloomPass, 'threshold', 0, 1)
        bloomFolder
            .add(this.bloomPass, 'radius', 0, 2)

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
