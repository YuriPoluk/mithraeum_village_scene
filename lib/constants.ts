import { Vector3, Quaternion } from 'three'

export const MODELS = [
  'army.glb',
  'barracks.glb',
  'battle.glb',
  'decor.glb',
  'farm.glb',
  'fort.glb',
  'lumbermill.glb',
  'mine.glb',
  'siege.glb',
  'smithy.glb',
  'townhall.glb',
  'flag_fort_positioning.glb',
  'back_plane.glb',
]

export const ZoomableBuilding = {
  barracks: 'barracks',
  farm: 'farm',
  fort: 'fort',
  lumbermill: 'lumbermill',
  mine: 'mine',
  smithy: 'smithy',
  townhall: 'townhall',
}

export const NonZoomableBuilding = {
  army: 'army',
  battle: 'battle',
  siege: 'siege',
}

export const Building = { ...ZoomableBuilding, ...NonZoomableBuilding }

interface CameraParam {
  position: Vector3
  quaternion: Quaternion
  translationDuration?: number
  translationDelay?: number
  rotationDuration?: number
  rotationDelay?: number
}

export const CAMERA_PARAMS: { [key: string]: CameraParam } = {
  default: {
    position: new Vector3(0.4012297987937927, 10.531002044677734, 15.307682037353516),
    quaternion: new Quaternion(-0.27563581179186203, 0, 0, 0.9612621386790603),
  },
  lumbermill: {
    position: new Vector3(3.1561856269836426, 2.52581524848938, 2.3858437538146973),
    quaternion: new Quaternion(-0.21486375435776106, -0.23756165120715614, -0.05396988856900414, 0.9457723191760575),
    translationDuration: 0.62,
  },
  barracks: {
    position: new Vector3(1.4978179931640625, 3.4888758659362793, 0.7625362873077393),
    quaternion: new Quaternion(-0.25881903232490105, 0, 0, 0.9659258297128211),
  },
  fort: {
    position: new Vector3(-0.385295033454895, 2.5790581703186035, 4.1443257331848145),
    quaternion: new Quaternion(-0.22597134194402127, -0.18235603354098442, -0.04310654989832961, 0.9559419724802319),
    translationDuration: 0.64,
  },
  smithy: {
    position: new Vector3(-3.3099994373321533, 2.340320110321045, 3.074000120162964),
    quaternion: new Quaternion(-0.22834512685404268, -0.006796923888665046, -0.0015941849860827265, 0.9735552184860211),
    translationDuration: 0.65,
    rotationDuration: 0.75,
  },
  mine: {
    position: new Vector3(0.18761569261550903, 3.4805965423583984, 2.837275743484497),
    quaternion: new Quaternion(-0.2912153369037883, 0.165881946753489, 0.051349083182053334, 0.9407656875691567),
    translationDuration: 0.65,
  },
  farm: {
    position: new Vector3(1.0612096786499023, 2.801100254058838, 2.2313594818115234),
    quaternion: new Quaternion(-0.23880936024881816, -0.15513250926197478, -0.03867905564071254, 0.9578141388170637),
  },
  townhall: {
    position: new Vector3(-0.6894432902336121, 3.0451433658599854, 1.13101327419281),
    quaternion: new Quaternion(-0.12912547172907513, 0.14483334065301426, 0.019067637663711823, 0.9808090238509344),
    translationDuration: 0.65,
    rotationDuration: 0.72,
  },
}

export const BUILDINGS_LOOKAT_POINTS = {
  [Building.army]: new Vector3(2.979, 0.355, 2.683),
  [Building.siege]: new Vector3(0.685, 0.422, 2.848),
  [Building.battle]: new Vector3(-1.7, 0.46, 2.931),
  [Building.lumbermill]: new Vector3(4.688, 0.46, -0.396),
  [Building.fort]: new Vector3(0.858, 0.862, 1.116),
  [Building.farm]: new Vector3(2.067, 0.296, -0.582),
  [Building.mine]: new Vector3(-1.023, 1.296, -0.084),
  [Building.smithy]: new Vector3(-3.279, 1.168, 0.341),
  [Building.townhall]: new Vector3(-1.648, 2.031, -2.374),
  [Building.barracks]: new Vector3(1.46, 2.031, -2.374),
}
