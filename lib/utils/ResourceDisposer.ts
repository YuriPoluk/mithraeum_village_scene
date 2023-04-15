import { BufferGeometry, Mesh, Material, Texture, Group } from "three"

export default class ResourceDisposer {
    private geometries: BufferGeometry[] = []
    private meshes: Mesh[] = []
    private materials: Material[] = []
    private textures: Texture[] = []
    private models: Group[] = []

    addModel(gltf: Group) {
        this.models.push(gltf)
    }

    addMesh(m: Mesh) {
        this.meshes.push(m)
    }

    dispose() {
        this.textures.forEach(t => t.dispose())
        this.materials.forEach(m => m.dispose())
        this.geometries.forEach(g => g.dispose())
        this.meshes.forEach(m => {
            m.geometry.dispose()
            const material = m.material as Material
            material.dispose()
        })
        this.models.forEach(m => {
            m.traverse(o => {
                if (o instanceof Mesh) {
                    o.geometry.dispose()
                    o.material.dispose()
                }
            })
        })
    }
}