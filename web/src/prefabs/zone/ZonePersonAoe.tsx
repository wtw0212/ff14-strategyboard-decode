import React from 'react';
import { getDragOffset } from '../../DropHandler';
import { ObjectType } from '../../scene';
import { usePanelDrag } from '../../usePanelDrag';
import { PrefabIcon } from '../PrefabIcon';

// Image paths for person AOE icons
const PERSON_AOE_ICONS = {
    1: '/zone/1-Person-Aoe.webp',
    2: '/zone/2-Person-Aoe.webp',
    3: '/zone/3-Person-Aoe.webp',
    4: '/zone/4-Person-Aoe.webp',
} as const;

const PERSON_AOE_NAMES = {
    1: '1-Person AOE',
    2: '2-Person AOE',
    3: '3-Person AOE',
    4: '4-Person AOE',
} as const;

function makePersonAoeIcon(personCount: 1 | 2 | 3 | 4) {
    const name = PERSON_AOE_NAMES[personCount];
    const iconPath = PERSON_AOE_ICONS[personCount];

    const Component: React.FC = () => {
        const [, setDragObject] = usePanelDrag();

        return (
            <PrefabIcon
                draggable
                name={name}
                icon={iconPath}
                onDragStart={(e) => {
                    setDragObject({
                        object: {
                            type: ObjectType.Icon,
                            image: iconPath,
                            name,
                        },
                        offset: getDragOffset(e),
                    });
                }}
            />
        );
    };
    Component.displayName = `ZonePersonAoe${personCount}`;
    return Component;
}

// Export individual prefab icons
export const ZonePersonAoe1 = makePersonAoeIcon(1);
export const ZonePersonAoe2 = makePersonAoeIcon(2);
export const ZonePersonAoe3 = makePersonAoeIcon(3);
export const ZonePersonAoe4 = makePersonAoeIcon(4);
