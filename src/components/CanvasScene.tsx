import React, { useRef, useEffect, useCallback } from 'react';
import { RasterRenderer, type LineAlg } from '../lib/raster/RasterRenderer';
import type { Shape } from '../lib/shapes/Shape';
import type { Point2D } from '../lib/math/mat3';

interface CanvasSceneProps {
    lineAlg: LineAlg;
    shapes: Shape[];
    selectedId?: string | null;
    editingShapeId?: string | null;
    onSelect?: (id: string | null) => void;
    onShapesChange?: (shapes: Shape[]) => void;
}

const CANVAS_WIDTH = 1535;
const CANVAS_HEIGHT = 840;
const HANDLE_SIZE = 8;
const ROTATE_HANDLE_DISTANCE = 30;

const CanvasScene = ({ 
    lineAlg, 
    shapes, 
    selectedId, 
    editingShapeId,
    onSelect, 
    onShapesChange
}: CanvasSceneProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RasterRenderer>(null);
    const animationRef = useRef<number>(0);
 
    const shapesRef = useRef(shapes);
    const selectedIdRef = useRef(selectedId);

    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const dragShape = useRef<Shape | null>(null);
    const dragStartTransform = useRef<any>(null);
    const dragType = useRef<'move' | 'resize' | 'rotate' | null>(null);
    const dragHandle = useRef<string | null>(null);

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

    const getMouseCoords = (e: React.MouseEvent): Point2D => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const getHandles = useCallback((shape: Shape) => {
        const bounds = shape.getBounds();
        const center = shape.getCenter();
        return {
            se: { x: bounds.maxX, y: bounds.maxY },
            nw: { x: bounds.minX, y: bounds.minY },
            ne: { x: bounds.maxX, y: bounds.minY },
            sw: { x: bounds.minX, y: bounds.maxY },
            rotate: { x: center.x, y: bounds.minY - ROTATE_HANDLE_DISTANCE }
        };
    }, []);

    const hitTestHandle = useCallback((shape: Shape, point: Point2D): string | null => {
        const handles = getHandles(shape);
        
        if (Math.abs(point.x - handles.se.x) <= HANDLE_SIZE && Math.abs(point.y - handles.se.y) <= HANDLE_SIZE) return 'se';
        if (Math.abs(point.x - handles.nw.x) <= HANDLE_SIZE && Math.abs(point.y - handles.nw.y) <= HANDLE_SIZE) return 'nw';
        if (Math.abs(point.x - handles.ne.x) <= HANDLE_SIZE && Math.abs(point.y - handles.ne.y) <= HANDLE_SIZE) return 'ne';
        if (Math.abs(point.x - handles.sw.x) <= HANDLE_SIZE && Math.abs(point.y - handles.sw.y) <= HANDLE_SIZE) return 'sw';
        if (Math.abs(point.x - handles.rotate.x) <= HANDLE_SIZE && Math.abs(point.y - handles.rotate.y) <= HANDLE_SIZE) return 'rotate';
        
        return null;
    }, [getHandles]);

    const findShapeAtPoint = useCallback((point: Point2D): Shape | null => {
        const currentShapes = shapesRef.current;
        for (let i = currentShapes.length - 1; i >= 0; i--) {
            if (currentShapes[i].hitTest(point.x, point.y)) {
                return currentShapes[i];
            }
        }
        return null;
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const point = getMouseCoords(e);
        const selected = shapesRef.current.find(s => s.id === selectedIdRef.current);

        if (selected) {
            const handle = hitTestHandle(selected, point);
            if (handle) {
                e.preventDefault();
                isDragging.current = true;
                dragStart.current = point;
                dragShape.current = selected;
                dragType.current = handle === 'rotate' ? 'rotate' : 'resize';
                dragHandle.current = handle;
                dragStartTransform.current = {
                    x: selected.transform.x,
                    y: selected.transform.y,
                    scaleX: selected.transform.scaleX,
                    scaleY: selected.transform.scaleY,
                    rotation: selected.transform.rotation
                };
                return;
            }
        }

        const hit = findShapeAtPoint(point);
        if (hit) {
            if (selectedIdRef.current !== hit.id) {
                onSelect?.(hit.id);
            }
            isDragging.current = true;
            dragStart.current = point;
            dragShape.current = hit;
            dragType.current = 'move';
            dragStartTransform.current = {
                x: hit.transform.x,
                y: hit.transform.y,
                scaleX: hit.transform.scaleX,
                scaleY: hit.transform.scaleY,
                rotation: hit.transform.rotation
            };
        }
    }, [hitTestHandle, findShapeAtPoint, onSelect]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current || !dragShape.current || !dragStartTransform.current) return;
        
        const point = getMouseCoords(e);
        const shape = dragShape.current;
        const start = dragStartTransform.current;
        const dx = point.x - dragStart.current.x;
        const dy = point.y - dragStart.current.y;

        if (dragType.current === 'move') {
            shape.transform.x = start.x + dx;
            shape.transform.y = start.y + dy;
            return;
        }
        
        if (dragType.current === 'rotate') {
            const center = shape.getCenter();
            const startAngle = Math.atan2(dragStart.current.y - center.y, dragStart.current.x - center.x);
            const currentAngle = Math.atan2(point.y - center.y, point.x - center.x);
            shape.transform.rotation = start.rotation + (currentAngle - startAngle);
            return;
        }
 
        if (dragType.current === 'resize' && dragHandle.current) {
            const bounds = shape.getBounds();
            const baseWidth = (bounds.maxX - bounds.minX) / start.scaleX;
            const baseHeight = (bounds.maxY - bounds.minY) / start.scaleY;
            
            if (baseWidth <= 0 || baseHeight <= 0) return;
            
            const sensitivity = 0.5;
            const minScale = 0.1;
            const handle = dragHandle.current;
            
            switch (handle) {
                case 'se':
                    shape.transform.scaleX = Math.max(minScale, start.scaleX + (dx / baseWidth) * sensitivity);
                    shape.transform.scaleY = Math.max(minScale, start.scaleY + (dy / baseHeight) * sensitivity);
                    break;
                case 'nw':
                    shape.transform.scaleX = Math.max(minScale, start.scaleX - (dx / baseWidth) * sensitivity);
                    shape.transform.scaleY = Math.max(minScale, start.scaleY - (dy / baseHeight) * sensitivity);
                    shape.transform.x = start.x + dx / 2;
                    shape.transform.y = start.y + dy / 2;
                    break;
                case 'ne':
                    shape.transform.scaleX = Math.max(minScale, start.scaleX + (dx / baseWidth) * sensitivity);
                    shape.transform.scaleY = Math.max(minScale, start.scaleY - (dy / baseHeight) * sensitivity);
                    shape.transform.y = start.y + dy / 2;
                    break;
                case 'sw':
                    shape.transform.scaleX = Math.max(minScale, start.scaleX - (dx / baseWidth) * sensitivity);
                    shape.transform.scaleY = Math.max(minScale, start.scaleY + (dy / baseHeight) * sensitivity);
                    shape.transform.x = start.x + dx / 2;
                    break;
            }
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        if (isDragging.current && dragShape.current && onShapesChange) {
            onShapesChange([...shapesRef.current]);
        }
        isDragging.current = false;
        dragShape.current = null;
        dragType.current = null;
        dragHandle.current = null;
        dragStartTransform.current = null;
    }, [onShapesChange]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Delete' && selectedIdRef.current && onShapesChange) {
            const newShapes = shapesRef.current.filter(s => s.id !== selectedIdRef.current);
            shapesRef.current = newShapes;
            onShapesChange(newShapes);
            onSelect?.(null);
        }
    }, [onShapesChange, onSelect]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

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
                        const outlineColor = { r: 0, g: 120, b: 255, a: 200 };
       
                        r.strokeLine(bounds.minX, bounds.minY, bounds.maxX, bounds.minY, outlineColor, 2);
                        r.strokeLine(bounds.maxX, bounds.minY, bounds.maxX, bounds.maxY, outlineColor, 2);
                        r.strokeLine(bounds.maxX, bounds.maxY, bounds.minX, bounds.maxY, outlineColor, 2);
                        r.strokeLine(bounds.minX, bounds.maxY, bounds.minX, bounds.minY, outlineColor, 2);
                        
                        const center = selectedShape.getCenter();
                        const handleColor = { r: 255, g: 255, b: 255, a: 200 };
                        const rotateColor = { r: 255, g: 80, b: 80, a: 200 };
                        
                        r.fillCircle(bounds.maxX, bounds.maxY, HANDLE_SIZE, handleColor);
                        r.fillCircle(bounds.minX, bounds.minY, HANDLE_SIZE, handleColor);
                        r.fillCircle(bounds.maxX, bounds.minY, HANDLE_SIZE, handleColor);
                        r.fillCircle(bounds.minX, bounds.maxY, HANDLE_SIZE, handleColor);
                        r.fillCircle(center.x, bounds.minY - ROTATE_HANDLE_DISTANCE, HANDLE_SIZE, rotateColor);
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
    }, [lineAlg]);

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                width: `${CANVAS_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
                display: 'block',
                backgroundColor: 'white',
                borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                flexShrink: 0,
                cursor: 'default'
            }}
        />
    );
};

export default CanvasScene;