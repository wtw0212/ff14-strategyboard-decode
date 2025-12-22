import { makeStyles, Tab, TabList } from '@fluentui/react-components';
import React, { useState } from 'react';
import { TabActivity } from '../TabActivity';
import { PANEL_WIDTH } from './PanelStyles';
import { PrefabsPanel } from './PrefabsPanel';
import { StatusPanel } from './StatusPanel';

type Tabs = 'objects' | 'status';

export const MainPanel: React.FC = () => {
    const classes = useStyles();
    const [tab, setTab] = useState<Tabs>('objects');

    return (
        <div className={classes.wrapper}>
            <TabList selectedValue={tab} onTabSelect={(ev, data) => setTab(data.value as Tabs)}>
                <Tab value="objects">Objects</Tab>
                <Tab value="status">Icons</Tab>
            </TabList>
            <div className={classes.container}>
                <TabActivity value="objects" activeTab={tab}>
                    <PrefabsPanel />
                </TabActivity>
                <TabActivity value="status" activeTab={tab}>
                    <StatusPanel />
                </TabActivity>
            </div>
        </div>
    );
};

const useStyles = makeStyles({
    wrapper: {
        gridArea: 'left-panel',
        width: `${PANEL_WIDTH}px`,
        userSelect: 'none',
    },

    container: {
        height: 'calc(100% - 44px)',
        overflow: 'auto',
    },
});
