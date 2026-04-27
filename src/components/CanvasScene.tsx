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

            const triangle = [
                { x: 200, y: 100 },
                { x: 600, y: 100 },
                { x: 400, y: 450 },
            ];
            const pink = { r: 215, g: 100, b: 125, a: 255 };
            const black = { r: 35, g: 5, b: 12, a: 255 };
            
            r.fillPolygon(triangle, pink);        
            r.strokePolygon(triangle, black, 2);    
            
            const blue = { r: 0, g: 0, b: 255, a: 125 };  
            r.fillCircle(520, 280, 70, blue);
            
            const polyline = [
                { x: 50, y: 500 },
                { x: 200, y: 440 },
                { x: 400, y: 520 },
                { x: 600, y: 460 },
                { x: 750, y: 530 },
            ];
            const b = { r: 85, g: 12, b: 28, a: 255 };
            
            for (let i = 0; i < polyline.length - 1; i++) {
                r.strokeLine(polyline[i].x, polyline[i].y, polyline[i + 1].x, polyline[i + 1].y, b, 8);
            }
            
            const en = { r: 42, g: 6, b: 45, a: 255 };
            r.drawLine(50, 50, 750, 550, en);   
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