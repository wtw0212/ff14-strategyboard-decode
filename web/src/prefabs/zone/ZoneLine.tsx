import React, { useState } from 'react';
import { Circle, Group, Rect } from 'react-konva';
import Icon from '../../assets/zone/line.svg?react';
import { getPointerAngle, snapAngle } from '../../coord';
import { getResizeCursor } from '../../cursor';
import { getDragOffset, registerDropHandler } from '../../DropHandler';
import { DetailsItem } from '../../panel/DetailsItem';
import { ListComponentProps, registerListComponent } from '../../panel/ListComponentRegistry';
import { LayerName } from '../../render/layers';
import { registerRenderer, RendererProps } from '../../render/ObjectRegistry';
import { ActivePortal } from '../../render/Portals';
import { ObjectType, RectangleZone } from '../../scene';
import { useScene } from '../../SceneProvider';
import { useIsDragging } from '../../selection';
import { CENTER_DOT_RADIUS, DEFAULT_AOE_COLOR, DEFAULT_AOE_OPACITY, panelVars } from '../../theme';
import { usePanelDrag } from '../../usePanelDrag';
import { distance, getDistanceFromLine, VEC_ZERO, vecAtAngle } from '../../vector';
import { MIN_LINE_LENGTH, MIN_LINE_WIDTH } from '../bounds';
import { CONTROL_POINT_BORDER_COLOR, createControlPointManager, HandleFuncProps, HandleStyle } from '../ControlPoint';
import { DraggableObject } from '../DraggableObject';
import { HideGroup } from '../HideGroup';
import { useHighlightProps, useShowResizer } from '../highlight';
import { PrefabIcon } from '../PrefabIcon';
import { getZoneStyle } from './style';

const NAME = 'Line';

const DEFAULT_WIDTH = 100;
const DEFAULT_LENGTH = 250;

const ICON_SIZE = 32;

export const ZoneLine: React.FC = () => {
    const [, setDragObject] = usePanelDrag();
    return (
        <PrefabIcon
            draggable
            name={NAME}
            icon={<Icon />}
            onDragStart={(e) => {
                const offset = getDragOffset(e);
                setDragObject({
                    object: {
                        type: ObjectType.Rect,  // Line AOE uses Rect internally
                    },
                    offset: {
                        x: offset.x,
                        y: offset.y - ICON_SIZE / 2,
                    },
                });
            }}
        />
    );
};

registerDropHandler<RectangleZone>(ObjectType.Rect, (object, position) => {
    return {
        type: 'add',
        object: {
            color: DEFAULT_AOE_COLOR,
            opacity: DEFAULT_AOE_OPACITY,
            width: DEFAULT_WIDTH,
            height: DEFAULT_LENGTH,
            rotation: 0,
            hollow: false,
            ...object,
            ...position,
            type: ObjectType.Rect, // Ensure type is explicitly set to Rect
        },
    };
});

const LineDetails: React.FC<ListComponentProps<RectangleZone>> = ({ object, ...props }) => {
    return (
        <DetailsItem
            icon={<Icon width="100%" height="100%" style={{ [panelVars.colorZoneOrange]: object.color }} />}
            name={NAME}
            object={object}
            {...props}
        />
    );
};

registerListComponent<RectangleZone>(ObjectType.Rect, LineDetails);

enum HandleId {
    Height,
    Width,
}

interface LineState {
    height: number;
    width: number;
    rotation: number;
}

const ROTATE_SNAP_DIVISION = 15;
const ROTATE_SNAP_TOLERANCE = 2;

const OUTSET = 2;

function getHeight(object: RectangleZone, { pointerPos, activeHandleId }: HandleFuncProps) {
    if (pointerPos && activeHandleId === HandleId.Height) {
        return Math.max(MIN_LINE_LENGTH, Math.round(distance(pointerPos) - OUTSET));
    }

    return object.height;
}

function getRotation(object: RectangleZone, { pointerPos, activeHandleId }: HandleFuncProps) {
    if (pointerPos && activeHandleId === HandleId.Height) {
        const angle = getPointerAngle(pointerPos);
        return snapAngle(angle, ROTATE_SNAP_DIVISION, ROTATE_SNAP_TOLERANCE);
    }

    return object.rotation;
}

function getWidth(object: RectangleZone, { pointerPos, activeHandleId }: HandleFuncProps) {
    if (pointerPos && activeHandleId == HandleId.Width) {
        const start = VEC_ZERO;
        const end = vecAtAngle(object.rotation);
        const distance = getDistanceFromLine(start, end, pointerPos);

        return Math.max(MIN_LINE_WIDTH, Math.round(distance * 2));
    }

    return object.width;
}

const LineControlPoints = createControlPointManager<RectangleZone, LineState>({
    handleFunc: (object, handle) => {
        const height = getHeight(object, handle) + OUTSET;
        const width = getWidth(object, handle);
        const rotation = getRotation(object, handle);

        const x = width / 2;
        const y = -height / 2;

        return [
            { id: HandleId.Height, style: HandleStyle.Square, cursor: getResizeCursor(rotation), x: 0, y: -height },
            { id: HandleId.Width, style: HandleStyle.Diamond, cursor: getResizeCursor(rotation + 90), x: x, y: y },
            { id: HandleId.Width, style: HandleStyle.Diamond, cursor: getResizeCursor(rotation + 90), x: -x, y: y },
        ];
    },
    getRotation: getRotation,
    stateFunc: (object, handle) => {
        const height = getHeight(object, handle);
        const width = getWidth(object, handle);
        const rotation = getRotation(object, handle);

        return { height, width, rotation };
    },
    onRenderBorder: (object, state) => {
        const strokeWidth = 1;
        const width = state.width + strokeWidth * 2;
        const height = state.height + strokeWidth * 2;

        return (
            <>
                <Rect
                    x={-width / 2}
                    y={-height + strokeWidth}
                    width={width}
                    height={height}
                    stroke={CONTROL_POINT_BORDER_COLOR}
                    strokeWidth={strokeWidth}
                    fillEnabled={false}
                />
                <Circle radius={CENTER_DOT_RADIUS} fill={CONTROL_POINT_BORDER_COLOR} />
            </>
        );
    },
});

interface LineRendererProps extends RendererProps<RectangleZone> {
    height: number;
    width: number;
    rotation: number;
    isDragging?: boolean;
}

const LineRenderer: React.FC<LineRendererProps> = ({ object, height, width, rotation, isDragging }) => {
    const highlightProps = useHighlightProps(object);
    const style = getZoneStyle(object.color, object.opacity, Math.min(height, width), object.hollow);

    const x = -width / 2;
    const y = -height;
    const highlightOffset = style.strokeWidth;
    const highlightWidth = width + highlightOffset;
    const highlightHeight = height + highlightOffset;

    return (
        <Group rotation={rotation}>
            {highlightProps && (
                <Rect
                    x={x}
                    y={y}
                    width={highlightWidth}
                    height={highlightHeight}
                    offsetX={highlightOffset / 2}
                    offsetY={highlightOffset / 2}
                    {...highlightProps}
                />
            )}
            <HideGroup>
                <Rect x={x} y={y} width={width} height={height} {...style} />

                {isDragging && <Circle radius={CENTER_DOT_RADIUS} fill={style.stroke} />}
            </HideGroup>
        </Group>
    );
};

function stateChanged(object: RectangleZone, state: LineState) {
    return state.height !== object.height || state.rotation !== object.rotation || state.width !== object.width;
}

const LineContainer: React.FC<RendererProps<RectangleZone>> = ({ object }) => {
    const { dispatch } = useScene();
    const showResizer = useShowResizer(object);
    const [resizing, setResizing] = useState(false);
    const dragging = useIsDragging(object);

    const updateObject = (state: LineState) => {
        state.rotation = Math.round(state.rotation);
        state.width = Math.round(state.width);

        if (!stateChanged(object, state)) {
            return;
        }

        dispatch({ type: 'update', value: { ...object, ...state } });
    };

    return (
        <ActivePortal isActive={dragging || resizing}>
            <DraggableObject object={object}>
                <LineControlPoints
                    object={object}
                    onActive={setResizing}
                    visible={showResizer && !dragging}
                    onTransformEnd={updateObject}
                >
                    {(props) => <LineRenderer object={object} isDragging={dragging || resizing} {...props} />}
                </LineControlPoints>
            </DraggableObject>
        </ActivePortal>
    );
};

registerRenderer<RectangleZone>(ObjectType.Rect, LayerName.Ground, LineContainer);
