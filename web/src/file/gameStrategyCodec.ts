/**
 * FF14 Strategy Code Codec
 * ========================
 *
 * TypeScript port of ff14_strategy.py for encoding/decoding
 * FF14 Strategy Board codes in the format [stgy:aXXXX...]
 *
 * Features:
 * - Decode strategy codes to binary data
 * - Encode binary data to strategy codes
 * - Uses pako for zlib compression (already available in XIVPlan)
 */

import { deflate, inflate } from 'pako';

// Substitution table from game (address 0x1420cf4a0, 256 bytes)
const SUBSTITUTION_TABLE = new Uint8Array([
    // ENC table (bytes 0-127) - for encoding
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x62, 0x00, 0x00,
    0x32, 0x77, 0x37, 0x71, 0x53, 0x74, 0x45, 0x56, 0x34, 0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x66, 0x52, 0x65, 0x41, 0x46, 0x42, 0x75, 0x64, 0x6b, 0x36, 0x33, 0x4b, 0x4c, 0x2b, 0x59,
    0x2d, 0x7a, 0x54, 0x35, 0x44, 0x6e, 0x48, 0x68, 0x51, 0x55, 0x39, 0x00, 0x00, 0x00, 0x00, 0x57,
    0x00, 0x47, 0x5a, 0x49, 0x6a, 0x4e, 0x72, 0x31, 0x6d, 0x61, 0x4f, 0x70, 0x6f, 0x4d, 0x58, 0x69,
    0x4a, 0x6c, 0x67, 0x38, 0x43, 0x78, 0x63, 0x76, 0x30, 0x73, 0x79, 0x00, 0x00, 0x00, 0x00, 0x00,
    // DEC table (bytes 128-255) - for decoding
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x4e, 0x00, 0x50, 0x00, 0x00,
    0x78, 0x67, 0x30, 0x4b, 0x38, 0x53, 0x4a, 0x32, 0x73, 0x5a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x44, 0x46, 0x74, 0x54, 0x36, 0x45, 0x61, 0x56, 0x63, 0x70, 0x4c, 0x4d, 0x6d, 0x65, 0x6a,
    0x39, 0x58, 0x42, 0x34, 0x52, 0x59, 0x37, 0x5f, 0x6e, 0x4f, 0x62, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x69, 0x2d, 0x76, 0x48, 0x43, 0x41, 0x72, 0x57, 0x6f, 0x64, 0x49, 0x71, 0x68, 0x55, 0x6c,
    0x6b, 0x33, 0x66, 0x79, 0x35, 0x47, 0x77, 0x31, 0x75, 0x7a, 0x51, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

/**
 * Convert Base64 character to 6-bit value
 */
function charToValue(c: string): number {
    const o = c.charCodeAt(0);
    if (o >= 65 && o <= 90) return o - 65;      // A-Z -> 0-25
    if (o >= 97 && o <= 122) return o - 71;     // a-z -> 26-51
    if (o >= 48 && o <= 57) return o + 4;       // 0-9 -> 52-61
    if (c === '-') return 62;
    if (c === '_') return 63;
    return 0;
}

/**
 * Convert 6-bit value to Base64 character
 */
function valueToChar(v: number): string {
    v &= 0x3f;
    if (v < 26) return String.fromCharCode(65 + v);        // 0-25 -> A-Z
    if (v < 52) return String.fromCharCode(97 + v - 26);   // 26-51 -> a-z
    if (v < 62) return String.fromCharCode(48 + v - 52);   // 52-61 -> 0-9
    return v === 62 ? '-' : '_';
}

/**
 * Apply ENC substitution table
 */
function substituteEncode(c: string): string {
    const idx = c.charCodeAt(0);
    const tableValue = SUBSTITUTION_TABLE[idx];
    if (idx < 128 && tableValue !== undefined && tableValue !== 0) {
        return String.fromCharCode(tableValue);
    }
    return c;
}

/**
 * Apply DEC substitution table
 */
function substituteDecode(c: string): string {
    const idx = c.charCodeAt(0);
    const tableValue = SUBSTITUTION_TABLE[128 + idx];
    if (idx < 128 && tableValue !== undefined && tableValue !== 0) {
        return String.fromCharCode(tableValue);
    }
    return c;
}

/**
 * CRC32 implementation
 */
function crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    const table = getCrc32Table();

    for (let i = 0; i < data.length; i++) {
        const dataVal = data[i] ?? 0;
        const tableVal = table[(crc ^ dataVal) & 0xff] ?? 0;
        crc = (crc >>> 8) ^ tableVal;
    }

    return (crc ^ 0xffffffff) >>> 0;
}

let crc32Table: Uint32Array | null = null;
function getCrc32Table(): Uint32Array {
    if (crc32Table) return crc32Table;

    crc32Table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crc32Table[i] = c;
    }
    return crc32Table;
}

/**
 * Standard Base64 decode (handles URL-safe variant)
 */
function base64Decode(str: string): Uint8Array {
    // Convert URL-safe to standard Base64
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding
    while (b64.length % 4) b64 += '=';

    const binString = atob(b64);
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
        bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
}

/**
 * Standard Base64 encode (returns URL-safe variant)
 */
function base64Encode(bytes: Uint8Array): string {
    let binString = '';
    for (let i = 0; i < bytes.length; i++) {
        const byteVal = bytes[i] ?? 0;
        binString += String.fromCharCode(byteVal);
    }
    // Standard to URL-safe, strip padding
    return btoa(binString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode FF14 strategy code to binary data
 *
 * @param stgyCode - Strategy code in format "[stgy:aXXXX...]"
 * @returns Decoded binary data
 * @throws Error if CRC check fails or format is invalid
 */
export function decodeStrategy(stgyCode: string): Uint8Array {
    // Remove wrapper - prefix is "stgy:a" (6 chars)
    const code = stgyCode.replace('[stgy:a', '').replace(/\]$/, '');

    // Step 1: Apply DEC substitution
    const substituted = Array.from(code).map(substituteDecode).join('');

    // Step 2: Extract seed from first char
    const firstChar = substituted[0];
    const seed = firstChar ? charToValue(firstChar) : 0;

    // Step 3: Deobfuscate remaining chars
    const deobfuscated: string[] = [];
    for (let i = 0; i < substituted.length - 1; i++) {
        const char = substituted[i + 1];
        const val = char ? charToValue(char) : 0;
        const newVal = (val - i - seed) & 0x3f;
        deobfuscated.push(valueToChar(newVal));
    }
    const deobStr = deobfuscated.join('');

    // Step 4: Base64 decode
    const raw = base64Decode(deobStr);

    // Step 5: Parse and verify CRC
    const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
    const crcStored = view.getUint32(0, true); // little-endian
    const payload = raw.slice(4);
    const crcCalc = crc32(payload);

    if (crcStored !== crcCalc) {
        throw new Error(`CRC mismatch: stored=0x${crcStored.toString(16)}, calc=0x${crcCalc.toString(16)}`);
    }

    // Step 6: Decompress (skip 2-byte length field)
    const compressed = raw.slice(6);
    return inflate(compressed);
}

/**
 * Encode binary data to FF14 strategy code
 *
 * @param binaryData - Binary data to encode
 * @param seed - Obfuscation seed (0-63), default 10
 * @returns Strategy code in format "[stgy:aXXXX...]"
 */
export function encodeStrategy(binaryData: Uint8Array, seed: number = 10): string {
    // Step 1: Compress (Level 6 matches game's 78 9c header)
    const compressed = deflate(binaryData, { level: 6 });

    // Step 2: Build raw: [CRC32][length][compressed]
    const length = binaryData.length;
    const payload = new Uint8Array(2 + compressed.length);
    const payloadView = new DataView(payload.buffer);
    payloadView.setUint16(0, length, true); // little-endian
    payload.set(compressed, 2);

    const crc = crc32(payload);

    const raw = new Uint8Array(4 + payload.length);
    const rawView = new DataView(raw.buffer);
    rawView.setUint32(0, crc, true); // little-endian
    raw.set(payload, 4);

    // Step 3: Base64 encode (URL-safe)
    const b64 = base64Encode(raw);

    // Step 4: Obfuscate: (val + index + seed) & 0x3f
    const obfuscated: string[] = [];
    for (let i = 0; i < b64.length; i++) {
        const char = b64[i];
        const val = char ? charToValue(char) : 0;
        const newVal = (val + i + seed) & 0x3f;
        obfuscated.push(valueToChar(newVal));
    }
    const obfStr = obfuscated.join('');

    // Step 5: Apply ENC substitution
    const substituted = Array.from(obfStr).map(substituteEncode).join('');

    // Step 6: Add seed char (with ENC substitution)
    const seedChar = valueToChar(seed);
    const seedSub = substituteEncode(seedChar);

    return `[stgy:a${seedSub}${substituted}]`;
}

/**
 * Verify that a strategy code is valid by decoding and re-encoding
 */
export function verifyStrategy(stgyCode: string): boolean {
    try {
        const decoded = decodeStrategy(stgyCode);
        const reEncoded = encodeStrategy(decoded);
        const reDecoded = decodeStrategy(reEncoded);

        // Compare bytes
        if (decoded.length !== reDecoded.length) return false;
        for (let i = 0; i < decoded.length; i++) {
            if (decoded[i] !== reDecoded[i]) return false;
        }
        return true;
    } catch {
        return false;
    }
}
