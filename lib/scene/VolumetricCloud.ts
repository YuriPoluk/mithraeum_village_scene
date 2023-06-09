import { Color, Data3DTexture, FrontSide, GLSL3, LinearFilter, PerspectiveCamera, RawShaderMaterial, RedFormat, Vector2, Vector3 } from "three";
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
// import * as OpenVDB from 'openvdb/three';

export default class FogMaterial extends RawShaderMaterial {
  constructor(camera: PerspectiveCamera) {    
    super({
      glslVersion: GLSL3,
			uniforms: {
				base: { value: new Color( 0x39294a ) },
				map: { value: null },
				cameraPos: { value: camera.position },
				threshold: { value: 0.25 },
				opacity: { value: 0.25 },
				range: { value: 0.1 },
				steps: { value: 50 },
				frame: { value: 0 }
			},
			vertexShader,
      fragmentShader,
      depthWrite: true,
      depthTest: true,
	  side: FrontSide,
      transparent: true,
    })

    this.uniforms.map.value = this.createPseudo3DTexture()
	// this.importVDB()
  }

//   async importVDB() {
// 	const vdb = await new Promise(resolve => {
// 		new OpenVDB.VDBLoader().load('/test_cube.vdb', (vdb:any) => {
// 		  resolve(vdb);  
// 		}, null, (err) => {
// 		  console.error('Could not load the VDB file.', { name, err });
// 		});
// 	  });

// 	console.log(vdb)

// 	let grids;
// 	let source = vdb

//     if (source instanceof Array) {
//       // NOTE Treat first argument as set of grids
//       grids = source;
//     } else if (typeof source.grids !== 'undefined') {
//       // NOTE Treat first argument as VDB source
//       grids = Object.values(source.grids);
//     } else {
//       // NOTE Hope for the best
//       grids = [source];
//     }

//   }

  createPseudo3DTexture() {
    const size = 128;
		const data = new Uint8Array( size * size * size )
		let i = 0;
		const scale = 0.05 ;
		const perlin = new ImprovedNoise();
		// const vector = new Vector3();
		// const point = new Vector3(0+ size/2, 0 + size/2, 0 + size/2)
		const side = size// * 0.4


    for ( let z = 0; z < size; z ++ ) {

      for ( let y = 0; y < size; y ++ ) {

        for ( let x = 0; x < size; x ++ ) {

			//   const d = 1.0 - vector.set( x, y, z ).subScalar( size / 2 ).divideScalar( size ).length();
			//   data[ i ] = ( 128 + 128 * perlin.noise( x * scale / 1.5, y * scale, z * scale / 1.5 ) ) * d * d;
			const isVolume = ( x < side && y < side && z < side ) ? 1 : 0
			data[ i ] = (128 + 128 * perlin.noise( x * scale / 1.5, y * scale, z * scale / 1.5 )) * isVolume * 0.5;
			data[ i ] = (128 + 128 * 0.5)
			i ++;

        }

      }

    }

    const texture = new Data3DTexture( data, size, size, size );
    texture.format = RedFormat;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;
        
    return texture
  }
}

const vertexShader = /* glsl */`
	in vec3 position;
	uniform mat4 modelMatrix;
	uniform mat4 modelViewMatrix;
	uniform mat4 projectionMatrix;
	uniform vec3 cameraPos;
	out vec3 vOrigin;
	out vec3 vDirection;
	out float vFragDepth;
	void main() {
		vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
		vOrigin = vec3( inverse( modelMatrix ) * vec4( cameraPos, 1.0 ) ).xyz;
		vDirection = position - vOrigin;
		gl_Position = projectionMatrix * mvPosition;
		vFragDepth = 1.0 + gl_Position.w;
	}
`;

const fragmentShader = /* glsl */`
	precision highp float;
	precision highp sampler3D;
	uniform mat4 modelViewMatrix;
	uniform mat4 projectionMatrix;
	in vec3 vOrigin;
  in vec3 vDirection;
  in float vFragDepth;
  out vec4 color;
	uniform vec3 base;
	uniform sampler3D map;
	uniform float threshold;
	uniform float range;
	uniform float opacity;
	uniform float steps;
  uniform float frame;
  uniform float logDepthBufFC;
  
	uint wang_hash(uint seed)
	{
			seed = (seed ^ 61u) ^ (seed >> 16u);
			seed *= 9u;
			seed = seed ^ (seed >> 4u);
			seed *= 0x27d4eb2du;
			seed = seed ^ (seed >> 15u);
			return seed;
	}
	float randomFloat(inout uint seed)
	{
			return float(wang_hash(seed)) / 4294967296.;
  }
  
	vec2 hitBox( vec3 orig, vec3 dir ) {
		const vec3 box_min = vec3( - 0.5 * 2.0 );
		const vec3 box_max = vec3( 0.5 * 2.0 );
		vec3 inv_dir = 1.0 / dir;
		vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
		vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
		vec3 tmin = min( tmin_tmp, tmax_tmp );
		vec3 tmax = max( tmin_tmp, tmax_tmp );
		float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
		float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
		return vec2( t0, t1 );
	}
	float sample1( vec3 p ) {
		p += vec3(1.5);
		p = vec3(1) / p;
		return texture( map, p ).r;
	}
	float shading( vec3 coord ) {
		float step = 0.01;
		return sample1( coord + vec3( - step ) ) - sample1( coord + vec3( step ) );
  }
  
	void main(){
		vec3 rayDir = normalize( vDirection );
		vec2 bounds = hitBox( vOrigin, rayDir );
		if ( bounds.x > bounds.y ) discard;
		bounds.x = max( bounds.x, 0.0 );
		vec3 p = vOrigin + bounds.x * rayDir;
		vec3 inc = 1.0 / abs( rayDir );
		float delta = min( inc.x, min( inc.y, inc.z ) );
		delta /= steps;
		// Jitter
		// Nice little seed from
		// https://blog.demofox.org/2020/05/25/casual-shadertoy-path-tracing-1-basic-camera-diffuse-emissive/
		uint seed = uint( gl_FragCoord.x ) * uint( 1973 ) + uint( gl_FragCoord.y ) * uint( 9277 ) + uint( frame ) * uint( 26699 );
		vec3 size = vec3( textureSize( map, 0 ) );
		float randNum = randomFloat( seed ) * 2.0 - 1.0;
		p += rayDir * randNum * ( 1.0 / size );
		//
		vec4 ac = vec4( base, 0.0 );
		float i;
		for (float t = bounds.x; t < bounds.y; t += delta ) {
      		i += 1.0;
			float d = sample1( p + 0.5 );
			d = smoothstep( threshold - range, threshold + range, d ) * opacity;
			float col = shading( p + 0.5 ) * 3.0 + ( ( p.x + p.y ) * 0.25 ) + 0.2;
			ac.rgb += ( 1.0 - ac.a ) * d * col;
			ac.a += ( 1.0 - ac.a ) * d;
			if ( ac.a >= 0.95 ) break;
			p += rayDir * delta;
    	} 

		color = ac;
		color.ra += vec2(0.25);

		if ( color.a == 0.0 ) discard;

		float fragDepth = vFragDepth - delta * (i-1.0);

		gl_FragDepth = log2( fragDepth ) * logDepthBufFC * 0.5;
	}
`;