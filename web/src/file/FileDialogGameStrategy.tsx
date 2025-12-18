
import {
    Button,
    Field,
    MessageBar,
    MessageBarBody,
    Textarea,
    Toast,
    ToastTitle,
    makeStyles,
    useToastController,
} from '@fluentui/react-components';
import { ArrowDownloadRegular } from '@fluentui/react-icons';
import React, { useState } from 'react';
import { HtmlPortalNode, InPortal } from 'react-reverse-portal';
import { useLoadScene } from '../SceneProvider';
import { gameCodeToScene } from './gameTypeMapping';
import { useCloseDialog } from '../useCloseDialog';

const useStyles = makeStyles({
    textarea: {
        fontFamily: 'monospace',
        fontSize: '12px',
        minHeight: '200px',
    },
    warning: {
        marginTop: '12px',
    },
    actions: {
        display: 'flex',
        gap: '8px',
    },
});

export interface ImportGameStrategyProps {
    actions: HtmlPortalNode | null;
}

export const ImportGameStrategy: React.FC<ImportGameStrategyProps> = ({ actions }) => {
    const classes = useStyles();
    const loadScene = useLoadScene();
    const closeDialog = useCloseDialog();
    const { dispatchToast } = useToastController();

    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleImport = () => {
        try {
            setError(null);
            if (!code.trim()) return;

            const newScene = gameCodeToScene(code.trim());

            // Check if scene has objects
            if (!newScene.steps[0] || newScene.steps[0].objects.length === 0) {
                setError('No valid objects found in strategy code.');
                return;
            }

            loadScene(newScene);
            dispatchToast(
                <Toast>
                    <ToastTitle>Strategy imported successfully!</ToastTitle>
                </Toast>,
                { intent: 'success' }
            );
            closeDialog();
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'Failed to parse strategy code');
        }
    };

    return (
        <>
            <Field label="Strategy Code">
                <Textarea
                    value={code}
                    onChange={(e, data) => setCode(data.value)}
                    placeholder="Paste [stgy:a...] code here"
                    className={classes.textarea}
                />
            </Field>

            {error && (
                <MessageBar intent="error" className={classes.warning}>
                    <MessageBarBody>
                        {error}
                    </MessageBarBody>
                </MessageBar>
            )}

            <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                Importing will replace the current strategy.
            </p>

            {actions && (
                <InPortal node={actions}>
                    <div className={classes.actions}>
                        <Button
                            appearance="primary"
                            icon={<ArrowDownloadRegular />}
                            onClick={handleImport}
                            disabled={!code.trim()}
                        >
                            Import Strategy
                        </Button>
                        <Button onClick={closeDialog}>Close</Button>
                    </div>
                </InPortal>
            )}
        </>
    );
};
