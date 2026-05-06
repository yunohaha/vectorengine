import React, { useRef, useEffect, useCallback } from 'react';
import { RasterRenderer, type LineAlg } from '../lib/raster/RasterRenderer';
import type { Shape } from '../lib/shapes/Shape';

interface CanvasSceneProps {
    lineAlg: LineAlg;
    shapes: Shape[];
    selectedId?: string | null;
    onSelect?: (id: string | null) => void;
}

const CANVAS_WIDTH = 1535;
const CANVAS_HEIGHT = 840;

const CanvasScene = ({ lineAlg, shapes, selectedId, onSelect }: CanvasSceneProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer>(null);
    const animationRef = useRef<number>(0);
    
    const shapesRef = useRef(shapes);
    const selectedIdRef = useRef(selectedId);
    
    useEffect(() => {
        shapesRef.current = shapes;
    }, [shapes]);
    
    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.setLineAlgorithm(lineAlg);
        }
    }, [lineAlg]);

    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || !onSelect) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
      
        for (let i = shapesRef.current.length - 1; i >= 0; i--) {
            if (shapesRef.current[i].hitTest(mouseX, mouseY)) {
                onSelect(shapesRef.current[i].id);
                return;
            }
        }
        onSelect(null);
    }, [onSelect]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const renderer = new RasterRenderer(canvas);
        renderer.setLineAlgorithm(lineAlg);
        rendererRef.current = renderer;

        const resizeObserver = new ResizeObserver(() => {
            renderer.resize();
        });
        resizeObserver.observe(canvas);

        const frame = () => {
            const r = rendererRef.current;
            if (r) {
                r.beginFrame(true);
                
                for (const shape of shapesRef.current) {
                    shape.drawRaster(r);
                }
                
                const currentSelectedId = selectedIdRef.current;
                if (currentSelectedId) {
                    const selectedShape = shapesRef.current.find(s => s.id === currentSelectedId);
                    if (selectedShape) {
                        const bounds = selectedShape.getBounds();
                        const obvo = { r: 205, g: 25, b: 150, a: 205 };
                        r.strokeLine(bounds.minX, bounds.minY, bounds.maxX, bounds.minY, obvo, 2);
                        r.strokeLine(bounds.maxX, bounds.minY, bounds.maxX, bounds.maxY, obvo, 2);
                        r.strokeLine(bounds.maxX, bounds.maxY, bounds.minX, bounds.maxY, obvo, 2);
                        r.strokeLine(bounds.minX, bounds.maxY, bounds.minX, bounds.minY, obvo, 2);
                    }
                }
                
                r.commit();
            }
            animationRef.current = requestAnimationFrame(frame);
        };

        frame();

        return () => {
            cancelAnimationFrame(animationRef.current);
            resizeObserver.disconnect();
            renderer.dispose();
        };
    }, []); 

    return (
        <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{
                width: `${CANVAS_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
                display: 'block',
                backgroundColor: 'white',
                borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                flexShrink: 0,
                cursor: 'pointer'
            }}
        />
    );
};

export default CanvasScene;