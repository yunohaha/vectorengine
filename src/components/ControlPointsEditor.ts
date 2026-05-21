import type { RasterRenderer } from '../lib/raster/RasterRenderer';
import type { Shape } from '../lib/shapes/Shape';
import type { Point2D } from '../lib/math/mat3';

export class ControlPointsEditor {
    private static readonly POINT_SIZE = 6;

    static getControlPoints(shape: Shape): Point2D[] | null {
        if ((shape as any).points) {
            return (shape as any).points;
        }
        if ((shape as any).getControlPoints) {
            return (shape as any).getControlPoints();
        }
        return null;
    }

    static hitTest(shape: Shape, point: Point2D): { index: number; point: Point2D } | null {
        const points = this.getControlPoints(shape);
        if (!points || points.length === 0) return null;
        
        for (let i = 0; i < points.length; i++) {
            try {
                const devicePoint = shape.transformPointToDevice(points[i].x, points[i].y);
                const dx = Math.abs(point.x - devicePoint.x);
                const dy = Math.abs(point.y - devicePoint.y);
                if (dx <= this.POINT_SIZE + 5 && dy <= this.POINT_SIZE + 5) {
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
        if (!points || points.length === 0) return;
        
        for (let i = 0; i < points.length; i++) {
            try {
                const devicePoint = shape.transformPointToDevice(points[i].x, points[i].y);
                
   
                r.fillCircle(devicePoint.x, devicePoint.y, this.POINT_SIZE + 2, { r: 255, g: 255, b: 255, a: 200 });
                r.fillCircle(devicePoint.x, devicePoint.y, this.POINT_SIZE, { r: 0, g: 200, b: 100, a: 220 });
                r.strokeCircle(devicePoint.x, devicePoint.y, this.POINT_SIZE, { r: 0, g: 0, b: 0, a: 150 }, 1);
            } catch (e) {
                console.warn('Draw error for point', i, e);
            }
        }
    }
}