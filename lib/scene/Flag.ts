import { Group, Mesh, Object3D } from 'three'
import AssetLoader from '../utils/AssetLoader'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

export default class Flag extends Object3D {
  private bone?: Group
  private root: Group

  constructor() {
    super()

    this.root = new Group()
    this.add(this.root)
    this.root.rotation.y = -Math.PI / 2
    this.root.scale.setScalar(0.2)
  }

  async init() {
    const flagModel = await AssetLoader.loadModelAsync('/scene/models/flag.glb')
    this.root.add(flagModel.scene)

    this.setBone('palka_2.glb')
  }

  async setBone(path: string) {
    if (this.bone) {
      this.bone.traverse((c) => {
        if (c instanceof Mesh) {
          c.geometry.dispose()
          c.material.dispose()
        }
      })
      this.root.remove(this.bone)
    }

    this.bone = (await AssetLoader.loadModelAsync('/scene/models/' + path)).scene
    this.bone.scale.setScalar(0.0195)
    this.bone.rotation.y = Math.PI / 2
    this.root.add(this.bone)
  }
}

//   if (assetPath == 'flag_fort_positioning.glb') {
//     const flag = scene
//     const mat = (flag.children[0].children[2] as Mesh).material as MeshStandardMaterial
//     const tex = await AssetLoader.loadTextureAsync('/scene/flag.jpg')
//     mat.map = tex
//   }
