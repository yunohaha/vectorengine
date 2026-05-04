import React, { useRef, useEffect, useState } from 'react';
import { RasterRenderer, type LineAlg } from '../lib/raster/RasterRenderer';
import { Rect } from '../lib/shapes/Rect';
import { Line } from '../lib/shapes/Line';
import { Oval } from '../lib/shapes/Oval';
import type { Shape } from '../lib/shapes/Shape';

interface CanvasSceneProps {
    lineAlg: LineAlg;
}

const CanvasScene = ({ lineAlg }: CanvasSceneProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer>(null);
    const [shapes] = useState<Shape[]>([
        // Прямоугольник
        new Rect(150, 100, { x: 300, y: 200, rotation: 0.3, scaleX: 1, scaleY: 1 }, {
            fillStyle: '#FF6B6B',
            fillOpacity: 0.8,
            strokeStyle: '#333333',
            strokeWidth: 3,
            strokeOpacity: 1,
        }),
        // Линия
        new Line(-50, -50, 50, 50, { x: 500, y: 150, rotation: 0, scaleX: 1, scaleY: 1 }, {
            fillStyle: '#000000',
            fillOpacity: 0,
            strokeStyle: '#4ECDC4',
            strokeWidth: 4,
            strokeOpacity: 1,
        }),
        // Овал
        new Oval(80, 50, { x: 500, y: 350, rotation: 0.5, scaleX: 1, scaleY: 1 }, {
            fillStyle: '#45B7D1',
            fillOpacity: 0.7,
            strokeStyle: '#2C3E50',
            strokeWidth: 2,
            strokeOpacity: 1,
        }),
    ]);

    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.setLineAlgorithm(lineAlg);
        }
    }, [lineAlg]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const renderer = new RasterRenderer(canvas);
        renderer.setLineAlgorithm(lineAlg);
        rendererRef.current = renderer;

        const ro = new ResizeObserver(() => {
            renderer.resize();
        });
        ro.observe(canvas);

        let raf = 0;

        const frame = () => {
            const r = rendererRef.current;
            if (r) {
                r.beginFrame(true);

                // Отрисовка всех фигур
                for (const shape of shapes) {
                    shape.drawRaster(r);
                }

                r.commit();
            }
            raf = requestAnimationFrame(frame);
        };

        raf = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            renderer.dispose();
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            style={{ 
                width: '100%', 
                height: '100%', 
                display: 'block',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }} 
        />
    );
};

export default CanvasScene;