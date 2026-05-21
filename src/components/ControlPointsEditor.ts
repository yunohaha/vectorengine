import type { RasterRenderer } from '../lib/raster/RasterRenderer';
import type { Shape } from '../lib/shapes/Shape';
import type { Point2D } from '../lib/math/mat3';

export class ControlPointsEditor {
    private static readonly POINT_SIZE = 6;

    static getControlPoints(shape: Shape): Point2D[] {
        if (typeof (shape as any).getControlPoints === 'function') {
            const points = (shape as any).getControlPoints();
            console.log('getControlPoints returned:', points);
            return points || [];
        }
        
        if ((shape as any).points) {
            console.log('points property:', (shape as any).points);
            return (shape as any).points;
        }
        
        console.warn('No control points found for shape:', shape.constructor.name);
        return [];
    }

    static hitTest(shape: Shape, point: Point2D): { index: number; point: Point2D } | null {
        const points = this.getControlPoints(shape);
        if (points.length === 0) return null;
        
        for (let i = 0; i < points.length; i++) {
            try {
                const devicePoint = shape.transformPointToDevice(points[i].x, points[i].y);
                const dx = Math.abs(point.x - devicePoint.x);
                const dy = Math.abs(point.y - devicePoint.y);
                if (dx <= this.POINT_SIZE + 5 && dy <= this.POINT_SIZE + 5) {
                    console.log(`Hit control point ${i} at`, devicePoint);
                    return { index: i, point: points[i] };
                }
            } catch (e) {
                console.warn('HitTest error for point', i, e);
            }
        }
        return null;
    }

    static draw(r: RasterRenderer, shape: Shape): void {
        const points = this.getControlPoints(shape);
        
        
        for (let i = 0; i < points.length; i++) {
            try {
                const devicePoint = shape.transformPointToDevice(points[i].x, points[i].y);
                console.log(`Point ${i}: local(${points[i].x}, ${points[i].y}) -> device(${devicePoint.x}, ${devicePoint.y})`);
                
                r.fillCircle(devicePoint.x, devicePoint.y, this.POINT_SIZE, { r: 63, g: 194, b: 149, a: 255 });
                r.strokeCircle(devicePoint.x, devicePoint.y, this.POINT_SIZE, { r: 0, g: 0, b: 0, a: 200 }, 1.5);
            } catch (e) {
                console.warn('Draw error for point', i, e);
            }
        }
    }
}