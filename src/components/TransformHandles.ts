import type { RasterRenderer } from '../lib/raster/RasterRenderer';
import type { Shape } from '../lib/shapes/Shape';
import type { Point2D } from '../lib/math/mat3';

export class TransformHandles {
    private static readonly HANDLE_SIZE = 7;
    private static readonly ROTATE_HANDLE_DISTANCE = 30;

    static getHandles(shape: Shape): { type: string; position: Point2D }[] {
        const bounds = shape.getBounds();
        const center = shape.getCenter();
        const handles: { type: string; position: Point2D }[] = [];
        
        const positions = [
            { type: 'nw', x: bounds.minX, y: bounds.minY },
            { type: 'ne', x: bounds.maxX, y: bounds.minY },
            { type: 'se', x: bounds.maxX, y: bounds.maxY },
            { type: 'sw', x: bounds.minX, y: bounds.maxY },
        ];
        
        for (const pos of positions) {
            handles.push({ type: pos.type, position: { x: pos.x, y: pos.y } });
        }
        
        handles.push({
            type: 'rotate',
            position: { x: center.x, y: bounds.minY - this.ROTATE_HANDLE_DISTANCE }
        });
        
        return handles;
    }

    static hitTest(shape: Shape, point: Point2D): string | null {
        const handles = this.getHandles(shape);
        for (const handle of handles) {
            const dx = point.x - handle.position.x;
            const dy = point.y - handle.position.y;
            if (Math.abs(dx) <= this.HANDLE_SIZE + 5 && Math.abs(dy) <= this.HANDLE_SIZE + 5) {
                return handle.type;
            }
        }
        return null;
    }

    static getCursor(handleType: string | null): string {
        switch (handleType) {
            case 'nw': case 'se': return 'nw-resize';
            case 'ne': case 'sw': return 'ne-resize';
            case 'rotate': return 'grab';
            default: return 'default';
        }
    }

    static resize(
        shape: Shape,
        startTransform: { x: number; y: number; scaleX: number; scaleY: number; rotation: number },
        startPoint: Point2D,
        currentPoint: Point2D,
        handleType: string | null
    ): Partial<{ x: number; y: number; scaleX: number; scaleY: number }> | null {
        if (!handleType || handleType === 'rotate') return null;
        
        const bounds = shape.getBounds();
        const center = shape.getCenter();
        
        let dx = currentPoint.x - startPoint.x;
        let dy = currentPoint.y - startPoint.y;
        
        const cos = Math.cos(-startTransform.rotation);
        const sin = Math.sin(-startTransform.rotation);
        const localDx = dx * cos - dy * sin;
        const localDy = dx * sin + dy * cos;
        
        const minScale = 0.15;
        let scaleX = startTransform.scaleX;
        let scaleY = startTransform.scaleY;
        let newX = startTransform.x;
        let newY = startTransform.y;
        
        const baseWidth = (bounds.maxX - bounds.minX) / startTransform.scaleX;
        const baseHeight = (bounds.maxY - bounds.minY) / startTransform.scaleY;
        
        if (baseWidth <= 0 || baseHeight <= 0) return null;
        
        const sensitivity = 0.5;
        
        switch (handleType) {
            case 'se': 
                scaleX = Math.max(minScale, startTransform.scaleX + (localDx / baseWidth) * sensitivity);
                scaleY = Math.max(minScale, startTransform.scaleY + (localDy / baseHeight) * sensitivity);
                break;
            case 'nw': 
                scaleX = Math.max(minScale, startTransform.scaleX - (localDx / baseWidth) * sensitivity);
                scaleY = Math.max(minScale, startTransform.scaleY - (localDy / baseHeight) * sensitivity);
           
                newX = startTransform.x + (dx / 2);
                newY = startTransform.y + (dy / 2);
                break;
            case 'ne': 
                scaleX = Math.max(minScale, startTransform.scaleX + (localDx / baseWidth) * sensitivity);
                scaleY = Math.max(minScale, startTransform.scaleY - (localDy / baseHeight) * sensitivity);
                newY = startTransform.y + (dy / 2);
                break;
            case 'sw': 
                scaleX = Math.max(minScale, startTransform.scaleX - (localDx / baseWidth) * sensitivity);
                scaleY = Math.max(minScale, startTransform.scaleY + (localDy / baseHeight) * sensitivity);
                newX = startTransform.x + (dx / 2);
                break;
        }
        
        return { x: newX, y: newY, scaleX, scaleY };
    }

    static draw(r: RasterRenderer, shape: Shape, hoveredHandle: string | null): void {
        const handles = this.getHandles(shape);
        const outlineColor = { r: 0, g: 120, b: 255, a: 200 };
    
        const bounds = shape.getBounds();
        r.strokeLine(bounds.minX, bounds.minY, bounds.maxX, bounds.minY, outlineColor, 2);
        r.strokeLine(bounds.maxX, bounds.minY, bounds.maxX, bounds.maxY, outlineColor, 2);
        r.strokeLine(bounds.maxX, bounds.maxY, bounds.minX, bounds.maxY, outlineColor, 2);
        r.strokeLine(bounds.minX, bounds.maxY, bounds.minX, bounds.minY, outlineColor, 2);
      
        for (const handle of handles) {
            const isHovered = hoveredHandle === handle.type;
            const size = isHovered ? this.HANDLE_SIZE + 2 : this.HANDLE_SIZE;
            const color = handle.type === 'rotate' 
                ? { r: 255, g: 80, b: 80, a: 200 }
                : { r: 255, g: 255, b: 255, a: 200 };
            
            r.fillCircle(handle.position.x, handle.position.y, size, color);
            r.strokeCircle(handle.position.x, handle.position.y, size, { r: 0, g: 0, b: 0, a: 150 }, 1);
        }
    }
}