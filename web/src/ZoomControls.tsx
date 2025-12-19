import React from 'react';
import { Button, makeStyles, tokens, Tooltip } from '@fluentui/react-components';
import { ZoomInRegular, ZoomOutRegular } from '@fluentui/react-icons';
import { useZoom, MIN_ZOOM, MAX_ZOOM } from './ZoomContext';

const useStyles = makeStyles({
    container: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: tokens.shadow4,
    },
    zoomText: {
        minWidth: '48px',
        textAlign: 'center',
        fontSize: tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
    },
});

export const ZoomControls: React.FC = () => {
    const classes = useStyles();
    const { zoom, zoomIn, zoomOut, resetZoom } = useZoom();

    const zoomPercent = Math.round(zoom * 100);

    return (
        <div className={classes.container}>
            <Tooltip content="Zoom Out (Ctrl + Scroll Down)" relationship="label">
                <Button
                    icon={<ZoomOutRegular />}
                    appearance="subtle"
                    size="small"
                    onClick={zoomOut}
                    disabled={zoom <= MIN_ZOOM}
                />
            </Tooltip>

            <Tooltip content="Reset Zoom" relationship="label">
                <Button
                    appearance="subtle"
                    size="small"
                    onClick={resetZoom}
                    className={classes.zoomText}
                >
                    {zoomPercent}%
                </Button>
            </Tooltip>

            <Tooltip content="Zoom In (Ctrl + Scroll Up)" relationship="label">
                <Button
                    icon={<ZoomInRegular />}
                    appearance="subtle"
                    size="small"
                    onClick={zoomIn}
                    disabled={zoom >= MAX_ZOOM}
                />
            </Tooltip>
        </div>
    );
};
