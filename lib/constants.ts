import { Vector3, Quaternion } from "three"

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
    // 'flag_townhall_positioning.glb',
]

export const Building = {
    army: 'army',
    barracks: 'barracks',
    battle: 'battle',
    farm: 'farm',
    fort: 'fort',
    lumbermill: 'lumbermill',
    mine: 'mine',
    siege: 'siege',
    smithy: 'smithy',
    townhall: 'townhall'
}

// export const BUILDINGS_NAMES = [
//     'army',
//     'barracks',
//     'battle',
//     'farm',
//     'fort',
//     'lumbermill',
//     'mine',
//     'siege',
//     'smithy',
//     'townhall'
// ]

export const CAMERA_PARAMS = {
    position: new Vector3(0.4012297987937927, 10.531002044677734, 15.307682037353516),
    quaternion: new Quaternion(-0.27563581179186203, 0, 0, 0.9612621386790603)
}

export const BUILDINGS_LOOKAT_POINTS = {
    [Building.army]: new Vector3(2.979, 0.355, 2.683),
    [Building.siege]: new Vector3(0.685, 0.422, 2.848),
    [Building.battle]: new Vector3(-1.7, 0.46, 2.931),
    [Building.lumbermill]: new Vector3(4.688, 0.460, -0.396),
    [Building.fort]: new Vector3(0.858, 0.862, 1.116),
    [Building.farm]: new Vector3(2.067, 0.296, -0.582),
    [Building.mine]: new Vector3(-1.023, 1.296, -0.084),
    [Building.smithy]: new Vector3(-3.279, 1.168, 0.341),
    [Building.townhall]: new Vector3(-1.648, 2.031, -2.374),
    [Building.barracks]: new Vector3(1.46, 2.031, -2.374),
}

