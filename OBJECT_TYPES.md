# Object Type Mapping (Preliminary)

This document catalogs the observed binary identifiers for various object types within the FFXIV Strategy Board system. Data is derived from analysis of strategy codes containing known object configurations.

## Metadata Structure
Each object is defined by a 6-byte metadata block, followed by its spatial coordinates. The metadata block determines the visual representation (icon, shape) of the object.

**Format**: `[Type ID (2 bytes)] [Subtype/Data A (2 bytes)] [Data B (2 bytes)]`

## Observed Values

| Type ID (Hex) | Subtype (Hex) | Data B (Hex) | Description / Role | Context |
| :--- | :--- | :--- | :--- | :--- |
| **0x0002** | 0x0035 | 0x0004 | **Tank** | Sample 1 (Obj 1) |
| **0x0001** | 0x0004 | 0x0001 | **DPS** (Variant A) | Sample 1 (Obj 2) |
| **0x0001** | 0x0001 | 0x0001 | **Healer** | Sample 1 (Obj 3) |
| **0x0005** | 0x0003 | 0x0004 | **DPS** (Variant B) | Sample 1 (Obj 4) |
| **0x0002** | 0x0057 | 0x0002 | **Fan AOE** | Sample 2 (Obj 5) |
| **0x0002** | 0x000A | 0x0002 | **Text Label / Circle** | Sample 2 (Obj 9) |
| **0x0002** | 0x000A | 0x0004 | **Donut AOE** | Sample 2 (Obj 11) |

## Hypothesis
- **Type 0x0001**: Primarily associated with **Player Role Icons** (Healer, DPS). Subtype may distinguish specific roles or job categories.
- **Type 0x0002**: A generic container for **Field Markers and Shapes** (Tank icons, AOEs). The specific shape or icon is likely determined by the Subtype field.
- **Type 0x0005**: Represents specific distinct markers (observed as a DPS icon variant).

## Usage
To modify an object's type in a strategy code:
1. Decode the strategy to binary.
2. Locate the metadata block for the target object.
3. Overwrite the first 2 bytes (Type ID) and subsequent bytes (Subtype) with the desired values from the table above.
4. Re-encode the binary.
