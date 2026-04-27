import React, { useRef, useEffect } from 'react';
import { RasterRenderer, type LineAlg } from '../lib/raster/RasterRenderer';

interface CanvasSceneProps {
    // shapes: Shape[];
    // selectedId: string | null;
    // onSelect: (id: string | null) => void;
    // onUpdate: () => void;
    // overlayTick: number;
    lineAlg: LineAlg;
}
const CanvasScene = ({ lineAlg }: CanvasSceneProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // react to lineAlg changes
    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.setLineAlgorithm(lineAlg);
        }
    }, [lineAlg]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const renderer = new RasterRenderer(canvas);
        renderer.setLineAlgorithm(lineAlg)
        rendererRef.current = renderer;

        const ro = new ResizeObserver(() => {
            renderer.resize();
        });

        if (containerRef.current) {
            ro.observe(containerRef.current);
        } else {
            ro.observe(canvas);
        }

        let raf = 0;

        const frame = () => {
        const r = rendererRef.current;
        if (r) {
            r.beginFrame(true);

            // ===== 1. ЗАКРАШЕННЫЙ МНОГОУГОЛЬНИК (треугольник) =====
            const triangle = [
                { x: 200, y: 100 },
                { x: 600, y: 100 },
                { x: 400, y: 450 },
            ];
            const red = { r: 255, g: 0, b: 0, a: 255 };
            const black = { r: 0, g: 0, b: 0, a: 255 };
            
            r.fillPolygon(triangle, red);           // заливка
            r.strokePolygon(triangle, black, 3);    // обводка толщиной 3
            
            // ===== 2. ОКРУЖНОСТЬ (полупрозрачная) =====
            const blue = { r: 0, g: 0, b: 255, a: 185 };  // полупрозрачный синий
            r.fillCircle(520, 280, 70, blue);
            
            // ===== 3. ТОЛСТАЯ ЛОМАНАЯ ЛИНИЯ =====
            const polyline = [
                { x: 50, y: 500 },
                { x: 200, y: 440 },
                { x: 400, y: 520 },
                { x: 600, y: 460 },
                { x: 750, y: 530 },
            ];
            const white = { r: 25, g: 25, b: 255, a: 255 };
            
            // Рисуем ломаную (каждый отрезок отдельно, чтобы избежать проблем с нормалью)
            for (let i = 0; i < polyline.length - 1; i++) {
                r.strokeLine(polyline[i].x, polyline[i].y, polyline[i + 1].x, polyline[i + 1].y, white, 8);
            }
            
            // ===== 4. ЛИНИЯ ДЛЯ ПРОВЕРКИ АЛГОРИТМОВ =====
            const green = { r: 0, g: 255, b: 0, a: 255 };
            r.drawLine(50, 50, 750, 550, green);   // диагональ через весь холст
            
            r.commit();
        }
        raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.dispose();
        renderer.dispose();
    };       

    }, []);

     return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
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
        </div>
    );
        
};

export default CanvasScene;