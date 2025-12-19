import React from 'react';
import { CompactColorPicker } from '../../CompactColorPicker';
import { CompactSwatchColorPicker } from '../../CompactSwatchColorPicker';
import { ColoredObject } from '../../scene';
import { useScene } from '../../SceneProvider';
import { makeColorSwatch } from '../../theme';
import { commonValue } from '../../util';
import { PropertiesControlProps } from '../PropertiesControl';

// FF14 Game Color Palette (from docs/ColourPalette.md)
// 7 rows × 8 columns = 56 colors
const GAME_COLOR_PALETTE = [
    // Row 0: Pastels
    '#FFFFFF', '#FFBDBF', '#FFE0C8', '#FFF8B0', '#E9FFE2', '#E8FFFE', '#9CD0F4', '#FFDCFF',
    // Row 1: Vibrant
    '#F8F8F8', '#FF0000', '#FF8000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF',
    // Row 2
    '#E0E0E0', '#FF4C4C', '#FFA666', '#FFFFB2', '#80FF00', '#BCFFF0', '#0080FF', '#E26090',
    // Row 3
    '#D8D8D8', '#FF7F7F', '#FFCEAC', '#FFDE73', '#80F860', '#66E6FF', '#94C0FF', '#FF8CC6',
    // Row 4
    '#CCCCCC', '#FFC0C0', '#FF6800', '#F0C86C', '#D4FF7F', '#ACDCE6', '#8080FF', '#FFB8E0',
    // Row 5
    '#BFBFBF', '#D8C0C0', '#D8686C', '#CCCC66', '#ACD848', '#B0E8E8', '#B38CFF', '#E0A8BC',
    // Row 6
    '#A6A6A6', '#C6A2A2', '#D8BEAC', '#C8C0A0', '#3AE8B4', '#3CE8E8', '#E0C0F8', '#E088F4',
];

const GAME_COLOR_SWATCHES = GAME_COLOR_PALETTE.map((color, index) =>
    makeColorSwatch(color, `game-${index}`)
);

export const ColorControl: React.FC<PropertiesControlProps<ColoredObject>> = ({ objects }) => {
    const { dispatch } = useScene();

    const color = commonValue(objects, (obj) => obj.color);

    const onColorChanged = (color: string, transient: boolean) =>
        dispatch({ type: 'update', value: objects.map((obj) => ({ ...obj, color })), transient });

    return (
        <CompactColorPicker
            label="Color"
            color={color ?? ''}
            onChange={(data) => onColorChanged(data.value, data.transient)}
            onCommit={() => dispatch({ type: 'commit' })}
        />
    );
};

export const ColorSwatchControl: React.FC<PropertiesControlProps<ColoredObject>> = ({ objects }) => {
    const { dispatch } = useScene();

    const color = commonValue(objects, (obj) => obj.color);

    const setColor = (color: string) => dispatch({ type: 'update', value: objects.map((obj) => ({ ...obj, color })) });

    return (
        <CompactSwatchColorPicker
            swatches={GAME_COLOR_SWATCHES}
            selectedValue={color ?? ''}
            onSelectionChange={(ev, data) => setColor(data.selectedSwatch)}
        />
    );
};
