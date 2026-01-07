import React from 'react';
import { ObjectContext } from '../prefabs/ObjectContext';
import { SceneObject } from '../scene';
import { getRenderer } from './ObjectRegistry';

export interface ObjectRendererProps {
    objects: readonly SceneObject[];
}

export const ObjectRenderer: React.FC<ObjectRendererProps> = ({ objects }) => {
    return (
        <>
            {objects.map((object) => {
                const Component = getRenderer(object);
                return (
                    <ObjectContext key={object.id} value={object}>
                        <Component object={object} />
                    </ObjectContext>
                );
            })}
        </>
    );
};
