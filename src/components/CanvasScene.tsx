import React, { useRef, useEffect, useState } from 'react';
import { RasterRenderer, type LineAlg } from '../lib/raster/RasterRenderer';
import { Rect } from '../lib/shapes/Rect';
import { Line } from '../lib/shapes/Line';
import { Oval } from '../lib/shapes/Oval';
import type { Shape } from '../lib/shapes/Shape';
import { Triangle } from '../lib/shapes/Triangle';
import { QuadraticBezier } from '../lib/shapes/QuadraticBezier';
import { CubicBezier } from '../lib/shapes/CubicBezier';
import { PathBezier } from '../lib/shapes/PathBezier';

interface CanvasSceneProps {
    lineAlg: LineAlg;
}

const CanvasScene = ({ lineAlg }: CanvasSceneProps) => {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer>(null);
    const [shapes] = useState<Shape[]>([
        new Triangle(0, -50, -43, 25, 43, 25,
            { x: 150, y: 150, rotation: 0.3 },
            { fillStyle: '#FF6B6B', fillOpacity: 0.8, strokeStyle: '#333', strokeWidth: 2 }
        ),

        new QuadraticBezier(
            { x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 },
            { x: 400, y: 150, rotation: 0 },
            { strokeStyle: '#4ECDC4', strokeWidth: 3, strokeOpacity: 1 }
        ),

        new CubicBezier(
            { x: 0, y: 0 }, { x: 30, y: 100 }, { x: 70, y: -100 }, { x: 100, y: 0 },
            { x: 600, y: 350, rotation: 0 },
            { strokeStyle: '#45B7D1', strokeWidth: 3, strokeOpacity: 1 }
        ),

        new PathBezier(
            [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
            'polyline', true,
            { x: 300, y: 350 },
            { fillStyle: '#96CEB4', fillOpacity: 0.6, strokeStyle: '#333', strokeWidth: 2 }
        ),
        new Rect(150, 100, { x: 300, y: 200, rotation: 0.3, scaleX: 1, scaleY: 1 }, {
            fillStyle: '#FF6B6B',
            fillOpacity: 0.8,
            strokeStyle: '#333333',
            strokeWidth: 3,
            strokeOpacity: 1,
        }),
        new Line(-50, -50, 50, 50, { x: 500, y: 150, rotation: 0, scaleX: 1, scaleY: 1 }, {
            fillStyle: '#000000',
            fillOpacity: 0,
            strokeStyle: '#4ECDC4',
            strokeWidth: 4,
            strokeOpacity: 1,
        }),
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

    const CANVAS_WIDTH = 1500;
    const CANVAS_HEIGHT = 800;
    return (
        <canvas
            ref={canvasRef}
            style={{
                width: `${CANVAS_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
                display: 'block',
                backgroundColor: 'white',
                borderRadius: '12px'
            }}
        />
    );
};

export default CanvasScene;