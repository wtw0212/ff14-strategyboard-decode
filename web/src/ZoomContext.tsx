import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ZoomContextType {
    zoom: number;
    setZoom: (zoom: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.1;
const DEFAULT_ZOOM = 2.0;

const ZoomContext = createContext<ZoomContextType | null>(null);

export const ZoomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [zoom, setZoomState] = useState(DEFAULT_ZOOM);

    const setZoom = useCallback((newZoom: number) => {
        setZoomState(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)));
    }, []);

    const zoomIn = useCallback(() => {
        setZoom(zoom + ZOOM_STEP);
    }, [zoom, setZoom]);

    const zoomOut = useCallback(() => {
        setZoom(zoom - ZOOM_STEP);
    }, [zoom, setZoom]);

    const resetZoom = useCallback(() => {
        setZoomState(DEFAULT_ZOOM);
    }, []);

    return (
        <ZoomContext value={{ zoom, setZoom, zoomIn, zoomOut, resetZoom }}>
            {children}
        </ZoomContext>
    );
};

export function useZoom(): ZoomContextType {
    const context = useContext(ZoomContext);
    if (!context) {
        throw new Error('useZoom must be used within a ZoomProvider');
    }
    return context;
}

export { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, DEFAULT_ZOOM };
