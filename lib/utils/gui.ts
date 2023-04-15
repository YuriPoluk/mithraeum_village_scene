import {GUI} from 'dat.gui';

export default addGui() {
    const gui = new GUI()
        const fogFolder = gui.addFolder('fog & back')
        const fog = this.scene.fog as FogExp2
        const paramsToChange = {
            fogColor: fog.color.getHex(),
            //@ts-ignore
            backColor: this.sky.material.color.getHex(),
            pointLightColor: this.pointLight.color.getHex(),
            ambientLightColor: this.ambientLight.color.getHex(),
            fogHeightFactor: this.shaders[0].uniforms.fogHeightFactor.value,
            fogNoiseFrequency: this.shaders[0].uniforms.fogNoiseFrequency.value,
            fogNoiseMoveSpeed: this.shaders[0].uniforms.fogNoiseMoveSpeed.value,
            fogNoiseImpact: this.shaders[0].uniforms.fogNoiseImpact.value,
        }

        fogFolder
            .addColor(paramsToChange, 'backColor')
            //@ts-ignore
            .onChange(value => this.sky.material.color.set(value))
        fogFolder
            .addColor(paramsToChange, 'fogColor')
            .onChange(value => fog.color.set(value))
        fogFolder
            .add(fog, 'density', 0, 0.5)
            .name('fog density')
        fogFolder
            .add(paramsToChange, 'fogHeightFactor', 0, 0.2)
            .name('fog height factor')
            .onChange(value => this.shaders.forEach(s => s.uniforms.fogHeightFactor.value = value))
        fogFolder
            .add(paramsToChange, 'fogNoiseFrequency', 0, 10)
            .name('fog noise frequency')
            .onChange(value => this.shaders.forEach(s => s.uniforms.fogNoiseFrequency.value = value))
        fogFolder
            .add(paramsToChange, 'fogNoiseMoveSpeed', 0, 0.3)
            .name('fog move speed')
            .onChange(value => this.shaders.forEach(s => s.uniforms.fogNoiseMoveSpeed.value = value))
        fogFolder
            .add(paramsToChange, 'fogNoiseImpact', 0, 1)
            .name('fog noise impact')
            .onChange(value => this.shaders.forEach(s => s.uniforms.fogNoiseImpact.value = value))

        fogFolder.open()

        const pointLightFolder = gui.addFolder('point light')
        pointLightFolder
            .addColor(paramsToChange, 'pointLightColor')
            .onChange(value => this.pointLight.color.set(value))
        pointLightFolder.add(this.pointLight, 'intensity', 0, 10)

        const ambientLightFolder = gui.addFolder('ambient light')
        ambientLightFolder
            .addColor(paramsToChange, 'ambientLightColor')
            .onChange(value => this.ambientLight.color.set(value))
        ambientLightFolder.add(this.ambientLight, 'intensity', 0, 10)
}