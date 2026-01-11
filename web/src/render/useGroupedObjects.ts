import { useMemo } from 'react';
import { SceneObject } from '../scene';
import { getLayerName } from './ObjectRegistry';
import { LayerName } from './layers';

export function useGroupedObjects(objects: readonly SceneObject[]) {
    return useMemo(() => {
        const groups: Record<LayerName, SceneObject[]> = {
            [LayerName.Ground]: [],
            [LayerName.Default]: [],
            [LayerName.Foreground]: [],
            [LayerName.Active]: [],
            [LayerName.Controls]: [],
        };

        for (const obj of objects) {
            const layer = getLayerName(obj);
            if (layer && groups[layer]) {
                groups[layer].push(obj);
            }
        }
        return groups;
    }, [objects]);
}
