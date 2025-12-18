/**
 * Game Type Mapping
 * =================
 *
 * Maps XIVPlan object types to FF14 game type IDs
 * and provides scene conversion utilities.
 */

import {
    Scene,
    SceneObject,
    ObjectType,
    isParty,
    isEnemy,
    isConeZone,
    isCircleZone,
    isDonutZone,
    isLineZone,
    isRectangleZone,
    isStackZone,
    isTowerZone,
    isMarker,
    isText,
    isMoveable,
    isRotateable,
    isRadiusObject,
    isColored,
    isEye,
    isStarburstZone,
    PartyObject,
    EnemyObject,
} from '../scene';
import { encodeStrategy, decodeStrategy } from './gameStrategyCodec';

// ============================================================================
// Game Type IDs (from OBJECT_TYPES.md)
// ============================================================================

export const GAME_TYPES = {
    // Generic Roles
    tank: 0x2f,
    healer: 0x32,
    dps: 0x35,
    tank_1: 0x30,
    tank_2: 0x31,
    healer_1: 0x33,
    healer_2: 0x34,
    dps_1: 0x36,
    dps_2: 0x37,
    dps_3: 0x38,
    dps_4: 0x39,

    // Tanks
    paladin: 0x1b,
    warrior: 0x1d,
    dark_knight: 0x26,
    gunbreaker: 0x2b,

    // Healers
    white_mage: 0x20,
    scholar: 0x23,
    astrologian: 0x27,
    sage: 0x2e,

    // Melee DPS
    monk: 0x1c,
    dragoon: 0x1e,
    ninja: 0x24,
    samurai: 0x28,
    reaper: 0x2d,
    viper: 0x65,

    // Physical Ranged DPS
    bard: 0x1f,
    machinist: 0x25,
    dancer: 0x2c,

    // Magical DPS
    black_mage: 0x21,
    summoner: 0x22,
    red_mage: 0x29,
    pictomancer: 0x66,
    blue_mage: 0x2a,

    // AOE Types
    line_aoe: 0x01,
    circle_aoe: 0x09,
    fan_aoe: 0x0a,
    donut_aoe: 0x11,
    proximity: 0x10,

    // Mechanics
    marker: 0x0b,
    gaze: 0x0d,
    stack: 0x0e,
    line_stack: 0x0f,
    radial_knockback: 0x6d,
    linear_knockback: 0x6e,
    tower: 0x6f,

    // Waymarks
    waymark_a: 0x4f,
    waymark_b: 0x50,
    waymark_c: 0x51,
    waymark_d: 0x52,
    waymark_1: 0x53,
    waymark_2: 0x54,
    waymark_3: 0x55,
    waymark_4: 0x56,

    // Enemies
    enemy_small: 0x3c,
    enemy_medium: 0x3e,
    enemy_large: 0x40,

    // Text
    text: 0x64,

    // Line/Arrow
    line: 0x0c,
    up_arrow: 0x5e,

    // Rotation
    rotate_cw: 0x8b,
    rotate_ccw: 0x8c,
} as const;

// Reverse lookup
export const GAME_TYPE_NAMES = Object.fromEntries(
    Object.entries(GAME_TYPES).map(([k, v]) => [v, k])
) as Record<number, string>;

// Job name to type ID mapping
// Names must match exactly with XIVPlan's jobs.ts (case-insensitive lookup)
const JOB_NAME_TO_ID: Record<string, number> = {
    // Generic Roles (from OBJECT_TYPES.md section 3)
    'any player': 0x2f, // Maps to Tank icon as fallback (no game equivalent)
    tank: 0x2f,
    healer: 0x32,
    support: 0x32, // XIVPlan 'Support' → game Healer
    dps: 0x35,

    // Specific DPS Roles (from OBJECT_TYPES.md section 3: 118-121)
    'melee dps': 0x76,           // 118
    'ranged dps': 0x77,          // 119 (generic ranged)
    'physical ranged dps': 0x78, // 120
    'magic ranged dps': 0x79,    // 121

    // Specific Healer Roles
    'pure healer': 0x7a,         // 122
    'barrier healer': 0x7b,      // 123

    // Tanks
    paladin: 0x1b,
    warrior: 0x1d,
    'dark knight': 0x26,
    gunbreaker: 0x2b,

    // Healers
    'white mage': 0x20,
    scholar: 0x23,
    astrologian: 0x27,
    sage: 0x2e,

    // Melee DPS
    monk: 0x1c,
    dragoon: 0x1e,
    ninja: 0x24,
    samurai: 0x28,
    reaper: 0x2d,
    viper: 0x65,

    // Physical Ranged DPS
    bard: 0x1f,
    machinist: 0x25,
    dancer: 0x2c,

    // Magical Ranged DPS
    'black mage': 0x21,
    summoner: 0x22,
    'red mage': 0x29,
    pictomancer: 0x66,
    'blue mage': 0x2a,
};

// Waymark name to type ID (from OBJECT_TYPES.md section 5)
// XIVPlan uses names like 'Waymark A', 'Waymark 1', etc.
const WAYMARK_NAME_TO_ID: Record<string, number> = {
    // Full names as used in XIVPlan's Markers.tsx
    'waymark a': 0x4f,
    'waymark b': 0x50,
    'waymark c': 0x51,
    'waymark d': 0x52,
    'waymark 1': 0x53,
    'waymark 2': 0x54,
    'waymark 3': 0x55,
    'waymark 4': 0x56,
    // Short names (fallback)
    a: 0x4f,
    b: 0x50,
    c: 0x51,
    d: 0x52,
    '1': 0x53,
    '2': 0x54,
    '3': 0x55,
    '4': 0x56,
};

// Marker shape/attack name to type ID (from OBJECT_TYPES.md section 5)
const MARKER_NAME_TO_ID: Record<string, number> = {
    // Attack markers
    'attack 1': 0x41,
    'attack 2': 0x42,
    'attack 3': 0x43,
    'attack 4': 0x44,
    'attack 5': 0x45,
    'attack 6': 0x73,
    'attack 7': 0x74,
    'attack 8': 0x75,
    // Bind markers
    'bind 1': 0x46,
    'bind 2': 0x47,
    'bind 3': 0x48,
    // Ignore markers
    'ignore 1': 0x49,
    'ignore 2': 0x4a,
    // Shape markers
    square: 0x4b,
    circle: 0x4c,
    plus: 0x4d,
    triangle: 0x4e,
    // Lock-on markers
    'red lock-on': 0x83,
    'blue lock-on': 0x84,
    'purple lock-on': 0x85,
    'green lock-on': 0x86,
};

// ============================================================================
// XivPlan to Game Object Conversion
// ============================================================================

export interface GameObject {
    typeId: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    color: [number, number, number];
    transparency: number;
    paramA: number;
    paramB: number;
    paramC: number;
}

export interface ConversionResult {
    objects: GameObject[];
    skipped: SceneObject[];
    warnings: string[];
}

/**
 * Convert XIVPlan scene objects to game objects
 */
export function sceneToGameObjects(scene: Scene, stepIndex: number = 0): ConversionResult {
    const step = scene.steps[stepIndex];
    if (!step) {
        return { objects: [], skipped: [], warnings: ['No step found at index ' + stepIndex] };
    }

    const objects: GameObject[] = [];
    const skipped: SceneObject[] = [];
    const warnings: string[] = [];

    // XIVPlan uses center-based coordinates with arena origin at center
    // Game uses top-left origin with 512x384 canvas
    const arenaWidth = scene.arena.width;
    const arenaHeight = scene.arena.height;
    const gameWidth = 512;
    const gameHeight = 384;

    const scaleX = gameWidth / arenaWidth;
    const scaleY = gameHeight / arenaHeight;

    for (const obj of step.objects) {
        const gameObj = convertObject(obj, scaleX, scaleY, arenaWidth, arenaHeight);
        if (gameObj) {
            objects.push(gameObj);
        } else {
            skipped.push(obj);
            warnings.push(`Skipped unsupported object type: ${obj.type}`);
        }
    }

    return { objects, skipped, warnings };
}

function convertObject(
    obj: SceneObject,
    scaleX: number,
    scaleY: number,
    arenaWidth: number,
    arenaHeight: number
): GameObject | null {
    // Coordinate conversion:
    // XIVPlan now uses top-left origin matching the game canvas
    // Both use (0,0) at top-left, +Y going down
    // If arena is 512x384, coords are direct (scale = 1)

    let x = 0,
        y = 0;
    if (isMoveable(obj)) {
        // Direct mapping with optional scaling if arena size differs from 512x384
        x = obj.x * scaleX;
        y = obj.y * scaleY;
    }

    // Get rotation
    let rotation = 0;
    if (isRotateable(obj)) {
        rotation = obj.rotation;
    }

    // Get color
    let color: [number, number, number] = [255, 255, 255];
    if (isColored(obj)) {
        color = hexToRgb(obj.color);
    }

    // Default values
    const gameObj: GameObject = {
        typeId: 0,
        x: Math.round(x),
        y: Math.round(y),
        rotation: Math.round(rotation),
        scale: 100, // Default size
        color,
        transparency: 100 - (obj.opacity ?? 100), // Map opacity (100=visible) to transparency (0=visible)
        paramA: 0,
        paramB: 0,
        paramC: 0,
    };

    // Convert based on type
    if (isParty(obj)) {
        const jobName = (obj as PartyObject).name.toLowerCase();
        gameObj.typeId = JOB_NAME_TO_ID[jobName] ?? GAME_TYPES.dps;
        return gameObj;
    }

    if (isEnemy(obj)) {
        const enemy = obj as EnemyObject;
        // Map enemy size to game type
        if (enemy.radius <= 20) {
            gameObj.typeId = GAME_TYPES.enemy_small;
        } else if (enemy.radius <= 40) {
            gameObj.typeId = GAME_TYPES.enemy_medium;
        } else {
            gameObj.typeId = GAME_TYPES.enemy_large;
        }
        return gameObj;
    }

    if (isCircleZone(obj)) {
        switch (obj.type) {
            case ObjectType.Circle:
                gameObj.typeId = GAME_TYPES.circle_aoe;
                break;
            case ObjectType.Proximity:
                gameObj.typeId = GAME_TYPES.proximity;
                break;
            case ObjectType.Knockback:
                gameObj.typeId = GAME_TYPES.radial_knockback;
                break;
            case ObjectType.RotateCW:
                // Game's RotateCW is a symbol, not a circle zone
                gameObj.typeId = GAME_TYPES.rotate_cw;
                gameObj.scale = 100; // Default symbol size
                break;
            case ObjectType.RotateCCW:
                // Game's RotateCCW is a symbol, not a circle zone
                gameObj.typeId = GAME_TYPES.rotate_ccw;
                gameObj.scale = 100; // Default symbol size
                break;
            default:
                // Unknown circle type - skip
                return null;
        }
        if (isRadiusObject(obj) && (obj.type === ObjectType.Circle || obj.type === ObjectType.Proximity || obj.type === ObjectType.Knockback)) {
            // Game scale formula: size = radius / 2.47 (observed ratio: radius_pixels = size * 2.47)
            gameObj.scale = Math.round(obj.radius / 2.47);
        }
        return gameObj;
    }

    if (isStackZone(obj)) {
        gameObj.typeId = GAME_TYPES.stack;
        return gameObj;
    }

    if (isConeZone(obj)) {
        gameObj.typeId = GAME_TYPES.fan_aoe;
        gameObj.paramA = Math.round(obj.coneAngle); // Arc angle
        return gameObj;
    }

    if (isDonutZone(obj)) {
        gameObj.typeId = GAME_TYPES.donut_aoe;
        gameObj.paramA = 360; // Full circle
        gameObj.paramB = Math.round(obj.innerRadius * 10); // Inner radius
        return gameObj;
    }

    if (isLineZone(obj)) {
        gameObj.typeId = GAME_TYPES.line_aoe;
        gameObj.paramA = Math.round(obj.width);
        gameObj.paramB = Math.round(obj.length);
        return gameObj;
    }

    if (isRectangleZone(obj)) {
        // Rectangle zones use paramA for width and paramB for length
        gameObj.paramA = Math.round(obj.width);
        gameObj.paramB = Math.round(obj.height);
        switch (obj.type) {
            case ObjectType.Rect:
            case ObjectType.LineStack:
                gameObj.typeId = GAME_TYPES.line_aoe;
                break;
            case ObjectType.LineKnockback:
            case ObjectType.LineKnockAway:
                gameObj.typeId = GAME_TYPES.linear_knockback;
                break;
        }
        return gameObj;
    }

    if (isTowerZone(obj)) {
        gameObj.typeId = GAME_TYPES.tower;
        return gameObj;
    }

    // XIVPlan Eye zone maps to game Gaze marker (0x0D)
    if (isEye(obj)) {
        gameObj.typeId = GAME_TYPES.gaze;
        if (isRadiusObject(obj)) {
            // Game scale formula: size = radius / 2.47 (observed ratio: radius_pixels = size * 2.47)
            gameObj.scale = Math.round(obj.radius / 2.47);
        }
        return gameObj;
    }

    // XIVPlan Starburst zone maps to game Tower (0x6F)
    if (isStarburstZone(obj)) {
        gameObj.typeId = GAME_TYPES.tower;
        if (isRadiusObject(obj)) {
            // Game scale formula: size = radius / 2.47 (observed ratio: radius_pixels = size * 2.47)
            gameObj.scale = Math.round(obj.radius / 2.47);
        }
        return gameObj;
    }

    if (isMarker(obj)) {
        const markerName = obj.name.toLowerCase();
        // Check waymarks first
        const waymarkId = WAYMARK_NAME_TO_ID[markerName];
        if (waymarkId !== undefined) {
            gameObj.typeId = waymarkId;
            return gameObj;
        }
        // Check attack/bind/shape markers
        const markerId = MARKER_NAME_TO_ID[markerName];
        if (markerId !== undefined) {
            gameObj.typeId = markerId;
            return gameObj;
        }
        // Default to general marker
        gameObj.typeId = GAME_TYPES.marker;
        return gameObj;
    }

    if (isText(obj)) {
        gameObj.typeId = GAME_TYPES.text;
        // Note: Game text encoding is complex, may need special handling
        return gameObj;
    }

    // Unsupported types: Tether, Draw, Arrow, etc.
    return null;
}

/**
 * Convert hex color to RGB tuple
 */
function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result && result[1] && result[2] && result[3]) {
        return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
    }
    return [255, 255, 255];
}

// ============================================================================
// Binary Strategy Generation
// ============================================================================

/**
 * Generate FF14 strategy binary data from game objects
 */
export function generateStrategyBinary(title: string, objects: GameObject[]): Uint8Array {
    const num = objects.length;

    // Title encoding
    const titleBytes = new TextEncoder().encode(title + '\0');
    // Pad to 4-byte alignment
    const paddedTitleLen = Math.ceil((28 + titleBytes.length) / 4) * 4 - 28;
    const titlePadded = new Uint8Array(paddedTitleLen);
    titlePadded.set(titleBytes);

    // Build content blocks
    const content: number[] = [];

    // TYPE blocks: 4 bytes each (0x0002, typeId)
    for (const obj of objects) {
        content.push(0x02, 0x00); // Block ID
        content.push(obj.typeId & 0xff, (obj.typeId >> 8) & 0xff);
    }

    // LAYER block: uint16 per object
    content.push(0x04, 0x00, 0x01, 0x00); // Block header
    content.push(num & 0xff, (num >> 8) & 0xff); // Count
    for (let i = 0; i < num; i++) {
        content.push(0x01, 0x00); // Layer = 1
    }

    // COORD block: int16 pairs (x * 10, y * 10)
    content.push(0x05, 0x00, 0x03, 0x00); // Block header
    content.push(num & 0xff, (num >> 8) & 0xff); // Count
    for (const obj of objects) {
        const x10 = Math.round(obj.x * 10);
        const y10 = Math.round(obj.y * 10);
        content.push(x10 & 0xff, (x10 >> 8) & 0xff);
        content.push(y10 & 0xff, (y10 >> 8) & 0xff);
    }

    // ANGLE block: int16 per object
    content.push(0x06, 0x00, 0x01, 0x00); // Block header
    content.push(num & 0xff, (num >> 8) & 0xff); // Count
    for (const obj of objects) {
        const angle = obj.rotation & 0xffff;
        content.push(angle & 0xff, (angle >> 8) & 0xff);
    }

    // SIZE block: uint8 per object + padding
    content.push(0x07, 0x00, 0x00, 0x00); // Block header
    content.push(num & 0xff, (num >> 8) & 0xff); // Count
    for (const obj of objects) {
        content.push(obj.scale & 0xff);
    }
    if (num % 2 === 1) content.push(0x00); // Padding

    // TRANS block: 4 bytes per object (RGBA)
    content.push(0x08, 0x00, 0x02, 0x00); // Block header
    content.push(num & 0xff, (num >> 8) & 0xff); // Count
    for (const obj of objects) {
        content.push(obj.color[0], obj.color[1], obj.color[2], obj.transparency || 0);
    }

    // PARAM A, B, C blocks: uint16 per object
    for (const blockId of [0x0a, 0x0b, 0x0c]) {
        content.push(blockId, 0x00, 0x01, 0x00); // Block header
        content.push(num & 0xff, (num >> 8) & 0xff); // Count
        for (const obj of objects) {
            const param = blockId === 0x0a ? obj.paramA : blockId === 0x0b ? obj.paramB : obj.paramC;
            content.push(param & 0xff, (param >> 8) & 0xff);
        }
    }

    // FOOTER block
    content.push(0x03, 0x00, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00);

    // Build header
    const contentBytes = new Uint8Array(content);
    const totalLen = 28 + titlePadded.length + contentBytes.length;

    const header = new Uint8Array(28);
    const headerView = new DataView(header.buffer);
    headerView.setUint32(0, 2, true); // Version
    headerView.setUint32(4, totalLen - 16, true); // Size
    // bytes 8-17: reserved (zeros)
    headerView.setUint16(18, totalLen - 28, true); // Content size
    // bytes 20-23: reserved
    headerView.setUint16(24, 1, true); // Object count marker
    headerView.setUint16(26, titlePadded.length, true); // Title length

    // Combine all parts
    const binary = new Uint8Array(totalLen);
    binary.set(header, 0);
    binary.set(titlePadded, 28);
    binary.set(contentBytes, 28 + titlePadded.length);

    return binary;
}

// ============================================================================
// Strategy Import (Binary to Scene)
// ============================================================================

/**
 * Convert Game Code to XIVPlan Scene
 */
export function gameCodeToScene(code: string): Scene {
    // 1. Decode base64/compression
    const binary = decodeStrategy(code);

    // 2. Parse binary to GameObjects
    const gameObjects = parseStrategyBinary(binary);

    // 3. Convert GameObjects to SceneObjects
    const sceneObjects: SceneObject[] = [];

    // Create reverse mapping for types
    const ID_TO_GAME_TYPE: Record<number, string> = {};
    for (const [key, value] of Object.entries(GAME_TYPES)) {
        ID_TO_GAME_TYPE[value] = key;
    }
    // Add markers
    for (const [key, value] of Object.entries(WAYMARK_NAME_TO_ID)) {
        ID_TO_GAME_TYPE[value] = key;
    }
    for (const [key, value] of Object.entries(MARKER_NAME_TO_ID)) {
        ID_TO_GAME_TYPE[value] = key;
    }

    for (const gameObj of gameObjects) {
        const sceneObj = convertGameToSceneObject(gameObj, ID_TO_GAME_TYPE);
        if (sceneObj) {
            sceneObjects.push(sceneObj);
        }
    }

    // 4. Construct Scene
    return {
        nextId: sceneObjects.length + 1,
        arena: {
            shape: 'rectangle',
            width: 512,
            height: 384,
            padding: 0,
            grid: { type: 'rectangular', rows: 6, columns: 8 }
        } as any, // Cast to avoid import circular dependency issues if types differ slightly
        steps: [{ objects: sceneObjects }],
    };
}

function parseStrategyBinary(binary: Uint8Array): GameObject[] {
    const view = new DataView(binary.buffer);
    let offset = 28; // Header size

    // Read Title Length from header
    const titleLen = view.getUint16(26, true);
    offset += titleLen;

    const objects: GameObject[] = [];

    // 1. Parse TYPE blocks (start of content)
    // Structure: 02 00 [ID] 00
    while (offset < binary.length) {
        if (view.getUint8(offset) !== 0x02) break; // Not a type block

        const typeId = view.getUint16(offset + 2, true);
        objects.push({
            typeId,
            x: 0,
            y: 0,
            rotation: 0,
            scale: 100,
            color: [255, 255, 255],
            transparency: 0,
            paramA: 0,
            paramB: 0,
            paramC: 0
        });
        offset += 4;
    }

    const num = objects.length;

    // 2. Parse remaining blocks
    while (offset < binary.length) {
        const blockId = view.getUint8(offset);
        if (blockId === 0x03) break; // Footer

        // Standard block header: [ID] 00 [SUB] 00 [COUNT] 00
        // But count is at offset+4 (2 bytes)
        // const count = view.getUint16(offset + 4, true); // Unused
        const dataStart = offset + 6;
        let blockSize = 6; // Header size

        // Calculate block data size
        switch (blockId) {
            case 0x04: // Layer (2 bytes per obj)
                blockSize += num * 2;
                break;
            case 0x05: // Coords (4 bytes per obj)
                for (let i = 0; i < num; i++) {
                    const x = view.getInt16(dataStart + i * 4, true);
                    const y = view.getInt16(dataStart + i * 4 + 2, true);
                    const obj = objects[i];
                    if (obj) {
                        obj.x = x / 10;
                        obj.y = y / 10;
                    }
                }
                blockSize += num * 4;
                break;
            case 0x06: // Angle (2 bytes per obj)
                for (let i = 0; i < num; i++) {
                    const angle = view.getUint16(dataStart + i * 2, true);
                    const obj = objects[i];
                    if (obj) obj.rotation = angle;
                }
                blockSize += num * 2;
                break;
            case 0x07: // Size (1 byte per obj + padding)
                for (let i = 0; i < num; i++) {
                    const scale = view.getUint8(dataStart + i);
                    const obj = objects[i];
                    if (obj) obj.scale = scale;
                }
                blockSize += num;
                if (num % 2 === 1) blockSize += 1; // Padding
                break;
            case 0x08: // Transparency/Color (4 bytes per obj)
                for (let i = 0; i < num; i++) {
                    const r = view.getUint8(dataStart + i * 4);
                    const g = view.getUint8(dataStart + i * 4 + 1);
                    const b = view.getUint8(dataStart + i * 4 + 2);
                    const t = view.getUint8(dataStart + i * 4 + 3);
                    const obj = objects[i];
                    if (obj) {
                        obj.color = [r, g, b];
                        obj.transparency = t;
                    }
                }
                blockSize += num * 4;
                break;
            case 0x0A: // Param A (2 bytes per obj)
                for (let i = 0; i < num; i++) {
                    const val = view.getUint16(dataStart + i * 2, true);
                    const obj = objects[i];
                    if (obj) obj.paramA = val;
                }
                blockSize += num * 2;
                break;
            case 0x0B: // Param B (2 bytes per obj)
                for (let i = 0; i < num; i++) {
                    const val = view.getUint16(dataStart + i * 2, true);
                    const obj = objects[i];
                    if (obj) obj.paramB = val;
                }
                blockSize += num * 2;
                break;
            case 0x0C: // Param C (2 bytes per obj)
                for (let i = 0; i < num; i++) {
                    const val = view.getUint16(dataStart + i * 2, true);
                    const obj = objects[i];
                    if (obj) obj.paramC = val;
                }
                blockSize += num * 2;
                break;
            default:
                break;
        }

        offset += blockSize;
    }

    return objects;
}

function convertGameToSceneObject(gameObj: GameObject, idMap: Record<number, string>): SceneObject | null {
    const typeName = idMap[gameObj.typeId];
    if (!typeName) return null;

    const base = {
        id: Math.floor(Math.random() * 100000000), // Numeric ID
        type: ObjectType.Undefined,
        x: gameObj.x,
        y: gameObj.y,
        rotation: gameObj.rotation,
        opacity: Math.max(0, 100 - gameObj.transparency),
        color: `#${gameObj.color.map(c => c.toString(16).padStart(2, '0')).join('')}`
    };

    // Helper to calc radius
    const getRadius = () => Math.round(gameObj.scale * 2.47);

    // Map Types

    // 1. Circle AOE
    if (gameObj.typeId === GAME_TYPES.circle_aoe) {
        return { ...base, type: ObjectType.Circle, radius: getRadius() } as any;
    }
    // 2. Fan AOE (Cone)
    if (gameObj.typeId === GAME_TYPES.fan_aoe) {
        return {
            ...base,
            type: ObjectType.Cone,
            radius: getRadius(),
            degree: gameObj.paramA
        } as any;
    }
    // 3. Donut
    if (gameObj.typeId === GAME_TYPES.donut_aoe) {
        return {
            ...base,
            type: ObjectType.Donut,
            radius: getRadius(),
            innerRadius: Math.round(gameObj.paramB / 2.47)
        } as any;
    }
    // 4. Line/Rect
    if (gameObj.typeId === GAME_TYPES.line_aoe) {
        // Line AOE params: Width (A), Height (B)
        // XIVPlan Rect: width, height
        return {
            ...base,
            type: ObjectType.Rect,
            width: Math.round(gameObj.paramA / 2.47),
            height: Math.round(gameObj.paramB / 2.47)
        } as any;
    }
    // 5. Mechanics
    if (gameObj.typeId === GAME_TYPES.stack) {
        return { ...base, type: ObjectType.Stack, radius: getRadius() } as any;
    }
    if (gameObj.typeId === GAME_TYPES.tower) {
        return { ...base, type: ObjectType.Tower, radius: getRadius() } as any;
    }
    if (gameObj.typeId === GAME_TYPES.gaze) {
        return { ...base, type: ObjectType.Eye, radius: getRadius() } as any;
    }
    if (gameObj.typeId === GAME_TYPES.proximity) {
        return { ...base, type: ObjectType.Proximity, radius: getRadius() } as any;
    }
    if (gameObj.typeId === GAME_TYPES.radial_knockback) {
        return { ...base, type: ObjectType.Knockback, radius: getRadius() } as any;
    }
    if (gameObj.typeId === GAME_TYPES.linear_knockback) {
        return { ...base, type: ObjectType.LineKnockback, width: 20, height: 60 } as any; // Approximate defaults
    }

    // 6. Jobs/Roles (Party)
    // Check if name is a job
    if (gameObj.typeId >= 0x1B && gameObj.typeId <= 0x39) { // Job ID range roughly
        // e.g. "paladin", "white_mage"
        const jobName = typeName.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
        return { ...base, type: ObjectType.Party, name: jobName } as any;
    }

    // 7. Marker
    if (gameObj.typeId >= 0x4F && gameObj.typeId <= 0x56) { // Waymarks
        // typeName is 'waymark a' etc.
        const markerChar = typeName.replace('waymark ', '').toUpperCase();
        return { ...base, type: ObjectType.Marker, name: markerChar } as any;
    }

    // Default fallback
    return null;
}

/**
 * Convert XIVPlan Scene to FF14 game strategy code
 */
export function sceneToGameCode(scene: Scene, stepIndex: number = 0, title: string = 'XIVPlan Export'): string {
    const { objects, warnings } = sceneToGameObjects(scene, stepIndex);

    if (objects.length === 0) {
        throw new Error('No exportable objects found. ' + warnings.join('; '));
    }

    const binary = generateStrategyBinary(title, objects);
    return encodeStrategy(binary);
}

/**
 * Check which objects in a scene can be exported to game code
 */
export function getExportableStats(
    scene: Scene,
    stepIndex: number = 0
): { exportable: number; total: number; unsupported: string[] } {
    const step = scene.steps[stepIndex];
    if (!step) return { exportable: 0, total: 0, unsupported: [] };

    const unsupportedTypes = new Set<string>();
    let exportable = 0;

    for (const obj of step.objects) {
        // Check if object is exportable
        if (
            isParty(obj) ||
            isEnemy(obj) ||
            isCircleZone(obj) ||
            isStackZone(obj) ||
            isConeZone(obj) ||
            isDonutZone(obj) ||
            isLineZone(obj) ||
            isRectangleZone(obj) ||
            isTowerZone(obj) ||
            isEye(obj) ||
            isStarburstZone(obj) ||
            isMarker(obj) ||
            isText(obj)
        ) {
            exportable++;
        } else {
            unsupportedTypes.add(obj.type);
        }
    }

    return {
        exportable,
        total: step.objects.length,
        unsupported: Array.from(unsupportedTypes),
    };
}

/**
 * Export debug information for troubleshooting conversions
 */
export interface DebugObjectInfo {
    originalType: string;
    originalName: string;
    gameTypeId: number;
    gameTypeName: string;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    color: [number, number, number];
    paramA: number;
    paramB: number;
    paramC: number;
}

export function getDebugExportData(
    scene: Scene,
    stepIndex: number = 0
): { objects: DebugObjectInfo[]; skipped: string[]; arenaInfo: { width: number; height: number; scaleX: number; scaleY: number } } {
    const step = scene.steps[stepIndex];
    if (!step) {
        return { objects: [], skipped: [], arenaInfo: { width: 0, height: 0, scaleX: 0, scaleY: 0 } };
    }

    const arenaWidth = scene.arena.width;
    const arenaHeight = scene.arena.height;
    const gameWidth = 512;
    const gameHeight = 384;
    const scaleX = gameWidth / arenaWidth;
    const scaleY = gameHeight / arenaHeight;

    const debugObjects: DebugObjectInfo[] = [];
    const skipped: string[] = [];

    for (const obj of step.objects) {
        const gameObj = convertObject(obj, scaleX, scaleY, arenaWidth, arenaHeight);
        if (gameObj) {
            debugObjects.push({
                originalType: obj.type,
                originalName: 'name' in obj ? (obj as { name: string }).name : '',
                gameTypeId: gameObj.typeId,
                gameTypeName: GAME_TYPE_NAMES[gameObj.typeId] ?? `unknown_0x${gameObj.typeId.toString(16)}`,
                x: gameObj.x,
                y: gameObj.y,
                rotation: gameObj.rotation,
                scale: gameObj.scale,
                color: gameObj.color,
                paramA: gameObj.paramA,
                paramB: gameObj.paramB,
                paramC: gameObj.paramC,
            });
        } else {
            skipped.push(`${obj.type}${'name' in obj ? ` (${(obj as { name: string }).name})` : ''}`);
        }
    }

    return {
        objects: debugObjects,
        skipped,
        arenaInfo: { width: arenaWidth, height: arenaHeight, scaleX, scaleY },
    };
}
