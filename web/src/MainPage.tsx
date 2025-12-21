import { makeStyles, tokens } from '@fluentui/react-components';
import React from 'react';
import { EditModeProvider } from './EditModeProvider';
import { RegularHotkeyHandler } from './HotkeyHandler';
import { MainToolbar } from './MainToolbar';
import { PanelDragProvider } from './PanelDragProvider';
import { SceneLoadErrorNotifier } from './SceneLoadErrorNotifier';
import { useScene } from './SceneProvider';
import { SelectionProvider } from './SelectionProvider';
import { StepSelect } from './StepSelect';
import { ZoomProvider, useZoom } from './ZoomContext';
import { ZoomControls } from './ZoomControls';
import { DetailsPanel } from './panel/DetailsPanel';
import { MainPanel } from './panel/MainPanel';
import { SceneRenderer } from './render/SceneRenderer';
import { MIN_STAGE_WIDTH } from './theme';
import { useIsDirty } from './useIsDirty';
import { removeFileExtension } from './util';

export const MainPage: React.FC = () => {
    return (
        <EditModeProvider>
            <SelectionProvider>
                <PanelDragProvider>
                    <ZoomProvider>
                        <MainPageContent />
                    </ZoomProvider>
                </PanelDragProvider>
            </SelectionProvider>
        </EditModeProvider>
    );
};

const MainPageContent: React.FC = () => {
    const classes = useStyles();
    const title = usePageTitle();
    const { scene } = useScene();
    const { setZoom } = useZoom();
    const stageRef = React.useRef<HTMLDivElement>(null);
    const hasInitializedZoom = React.useRef(false);

    // Calculate and set fit-to-screen zoom on initial mount
    React.useEffect(() => {
        if (hasInitializedZoom.current) return;
        if (!scene) return;

        // Use window dimensions minus estimated UI chrome
        // Left panel: ~268px, Right panel: ~268px, some padding
        const ESTIMATED_PANELS_WIDTH = 268 * 2 + 40; // Two panels + gaps
        const ESTIMATED_TOOLBAR_HEIGHT = 100; // Toolbar + step select + padding

        const availableWidth = window.innerWidth - ESTIMATED_PANELS_WIDTH;
        const availableHeight = window.innerHeight - ESTIMATED_TOOLBAR_HEIGHT;

        // Get canvas dimensions (arena + padding)
        const canvasWidth = scene.arena.width + scene.arena.padding * 2;
        const canvasHeight = scene.arena.height + scene.arena.padding * 2;

        console.log('[FitZoom] Window dimensions:', { innerWidth: window.innerWidth, innerHeight: window.innerHeight });
        console.log('[FitZoom] Available space:', { availableWidth, availableHeight });
        console.log('[FitZoom] Canvas size:', { canvasWidth, canvasHeight });

        // Calculate zoom that fits the canvas in the available space
        const fitZoomX = availableWidth / canvasWidth;
        const fitZoomY = availableHeight / canvasHeight;
        const fitZoom = Math.min(fitZoomX, fitZoomY, 2.0); // Cap at MAX_ZOOM (2.0)

        // Set the calculated zoom, ensuring it's at least MIN_ZOOM (0.25)
        const clampedZoom = Math.max(0.25, fitZoom);
        console.log('[FitZoom] Calculated zoom:', { fitZoomX, fitZoomY, fitZoom, clampedZoom });

        setZoom(clampedZoom);
        hasInitializedZoom.current = true;
    }, [scene, setZoom]);

    return (
        <>
            <title>{title}</title>

            <RegularHotkeyHandler />
            <SceneLoadErrorNotifier />

            <MainToolbar />

            {/* TODO: make panel collapsable */}
            <MainPanel />

            <StepSelect />

            <div className={classes.stageContainer}>
                <div className={classes.zoomControls}>
                    <ZoomControls />
                </div>
                <div ref={stageRef} className={classes.stage}>
                    <SceneRenderer />
                </div>
            </div>

            {/* TODO: make panel collapsable */}
            <DetailsPanel />
        </>
    );
};

const TITLE = 'XIVPlan';

function usePageTitle() {
    const { source } = useScene();
    const isDirty = useIsDirty();

    let title = TITLE;
    if (source) {
        title += ': ';
        title += removeFileExtension(source?.name);
    }
    if (isDirty) {
        title += ' ●';
    }
    return title;
}

const useStyles = makeStyles({
    stageContainer: {
        gridArea: 'content',
        display: 'flex',
        flexDirection: 'column',
        minWidth: MIN_STAGE_WIDTH,
        backgroundColor: tokens.colorNeutralBackground1,
        position: 'relative',
    },
    zoomControls: {
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        zIndex: 100,
    },
    stage: {
        flex: 1,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        overflow: 'auto',
    },
});

