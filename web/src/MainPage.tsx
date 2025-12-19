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
import { ZoomProvider } from './ZoomContext';
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
                <div className={classes.stage}>
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
        right: '16px',
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

