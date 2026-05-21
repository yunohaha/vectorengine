import React, { useRef, useEffect, useCallback } from 'react';
import { RasterRenderer, type LineAlg } from '../lib/raster/RasterRenderer';
import type { Shape } from '../lib/shapes/Shape';
import type { Point2D } from '../lib/math/mat3';
import { ControlPointsEditor } from './ControlPointsEditor';

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
const HANDLE_SIZE = 7;
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
    const editingShapeIdRef = useRef(editingShapeId);

    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const dragShape = useRef<Shape | null>(null);
    const dragStartTransform = useRef<any>(null);
    const dragType = useRef<'move' | 'resize' | 'rotate' | 'control-point' | null>(null);
    const dragHandle = useRef<string | null>(null);
    const dragControlPointIndex = useRef<number | null>(null);

    useEffect(() => {
        shapesRef.current = shapes;
    }, [shapes]);
    
    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);
    
    useEffect(() => {
        editingShapeIdRef.current = editingShapeId;
    }, [editingShapeId]);

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
        const hitZone = HANDLE_SIZE + 5;
        
        if (Math.abs(point.x - handles.se.x) <= hitZone && Math.abs(point.y - handles.se.y) <= hitZone) return 'se';
        if (Math.abs(point.x - handles.nw.x) <= hitZone && Math.abs(point.y - handles.nw.y) <= hitZone) return 'nw';
        if (Math.abs(point.x - handles.ne.x) <= hitZone && Math.abs(point.y - handles.ne.y) <= hitZone) return 'ne';
        if (Math.abs(point.x - handles.sw.x) <= hitZone && Math.abs(point.y - handles.sw.y) <= hitZone) return 'sw';
        if (Math.abs(point.x - handles.rotate.x) <= hitZone && Math.abs(point.y - handles.rotate.y) <= hitZone) return 'rotate';
        
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
        
        const isEditing = editingShapeIdRef.current === selectedIdRef.current;
        
        if (isEditing && selected) {
            const controlPoint = ControlPointsEditor.hitTest(selected, point);
            if (controlPoint) {
                e.preventDefault();
                isDragging.current = true;
                dragStart.current = point;
                dragShape.current = selected;
                dragType.current = 'control-point';
                dragControlPointIndex.current = controlPoint.index;
                
                const points = ControlPointsEditor.getControlPoints(selected);
                if (points) {
                    dragStartTransform.current = {
                        points: points.map(p => ({ ...p }))
                    };
                }
                return;
            }
        }

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
            } else {
                onSelect?.(null);
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
            if (onShapesChange) {
                onShapesChange([...shapesRef.current]);
            }
            return;
        }
        
        if (dragType.current === 'rotate') {
            const center = shape.getCenter();
            const startAngle = Math.atan2(dragStart.current.y - center.y, dragStart.current.x - center.x);
            const currentAngle = Math.atan2(point.y - center.y, point.x - center.x);
            shape.transform.rotation = start.rotation + (currentAngle - startAngle);
            if (onShapesChange) {
                onShapesChange([...shapesRef.current]);
            }
            return;
        }
        
        if (dragType.current === 'control-point' && dragControlPointIndex.current !== null) {
            const index = dragControlPointIndex.current;
            const points = ControlPointsEditor.getControlPoints(shape);
            if (points && points[index]) {
                const localPoint = shape.transformPointToLocal(point.x, point.y);
               
                if ('setControlPoint' in shape) {
                    (shape as any).setControlPoint(index, localPoint);
                    if (onShapesChange) {
                        onShapesChange([...shapesRef.current]);
                    }
                }
            }
            return;
        }
 

        if (dragType.current === 'resize' && dragHandle.current) {
            const sensitivity = 0.02; 
            const minScale = 0.5;
            const handle = dragHandle.current;
            
            switch (handle) {
                case 'se':
                    shape.transform.scaleX = Math.max(minScale, start.scaleX + dx * sensitivity);
                    shape.transform.scaleY = Math.max(minScale, start.scaleY + dy * sensitivity);
                    break;
                case 'nw':
                    shape.transform.scaleX = Math.max(minScale, start.scaleX - dx * sensitivity);
                    shape.transform.scaleY = Math.max(minScale, start.scaleY - dy * sensitivity);
                    shape.transform.x = start.x + dx / 2;
                    shape.transform.y = start.y + dy / 2;
                    break;
                case 'ne':
                    shape.transform.scaleX = Math.max(minScale, start.scaleX + dx * sensitivity);
                    shape.transform.scaleY = Math.max(minScale, start.scaleY - dy * sensitivity);
                    shape.transform.y = start.y + dy / 2;
                    break;
                case 'sw':
                    shape.transform.scaleX = Math.max(minScale, start.scaleX - dx * sensitivity);
                    shape.transform.scaleY = Math.max(minScale, start.scaleY + dy * sensitivity);
                    shape.transform.x = start.x + dx / 2;
                    break;
            }
            if (onShapesChange) {
                onShapesChange([...shapesRef.current]);
            }
        }
    }, [onShapesChange]);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        dragShape.current = null;
        dragType.current = null;
        dragHandle.current = null;
        dragControlPointIndex.current = null;
        dragStartTransform.current = null;
    }, []);

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
                const currentEditingId = editingShapeIdRef.current;
                
                if (currentSelectedId) {
                    const selectedShape = shapesRef.current.find(s => s.id === currentSelectedId);
                    if (selectedShape) {
                        const bounds = selectedShape.getBounds();
                        const outlineColor = { r: 41, g: 34, b: 77, a: 200 };
       
                        r.strokeLine(bounds.minX, bounds.minY, bounds.maxX, bounds.minY, outlineColor, 2);
                        r.strokeLine(bounds.maxX, bounds.minY, bounds.maxX, bounds.maxY, outlineColor, 2);
                        r.strokeLine(bounds.maxX, bounds.maxY, bounds.minX, bounds.maxY, outlineColor, 2);
                        r.strokeLine(bounds.minX, bounds.maxY, bounds.minX, bounds.minY, outlineColor, 2);
                        
                        const center = selectedShape.getCenter();
                        const handleColor = { r: 41, g: 34, b: 77, a: 200 };
                        const rotateColor = { r: 106, g: 90, b: 205, a: 255 };
                        
                        r.fillCircle(bounds.maxX, bounds.maxY, HANDLE_SIZE, handleColor);
                        r.fillCircle(bounds.minX, bounds.minY, HANDLE_SIZE, handleColor);
                        r.fillCircle(bounds.maxX, bounds.minY, HANDLE_SIZE, handleColor);
                        r.fillCircle(bounds.minX, bounds.maxY, HANDLE_SIZE, handleColor);
                        r.fillCircle(center.x, bounds.minY - ROTATE_HANDLE_DISTANCE, HANDLE_SIZE, rotateColor);
                    }
                }
                
                if (currentEditingId) {
                    const editingShape = shapesRef.current.find(s => s.id === currentEditingId);
                    if (editingShape) {
                        ControlPointsEditor.draw(r, editingShape);
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