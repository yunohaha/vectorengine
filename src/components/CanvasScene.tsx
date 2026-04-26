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
            // Нарисовать фигуры (Пока фигур нет, этот код закомментирован)
            // for (const shape of shapes) {
            // shape.drawRaster(r);
            // }
            // Попробуйте нарисвать красный полигон с черной обводкой или что-нибудь ещё
            const pts = [
                { x: 200, y: 100 },
                { x: 600, y: 100 },
                { x: 400, y: 500 },
            ];
            const red = { r: 255, g: 0, b: 0, a: 255 };
            const black = { r: 0, g: 0, b: 0, a: 255 };
            r.fillPolygon(pts, red);
            r.strokePolygon(pts, black, 0.5);
            
            
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