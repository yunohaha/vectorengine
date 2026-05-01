import { Shape, type Bounds, type Transform, type ShapeStyle } from './Shape';
import type { RasterRenderer } from '../raster/RasterRenderer';
import { hexToRGBA } from '../raster/RasterRenderer';
import  {  mat3, type Point2D  } from '../math/mat3';

export class Rect extends Shape {
    width: number;
    height: number;

    constructor(width: number, height: number, transform?: Partial<Transform>, style?: Partial<ShapeStyle>) {
        super(transform, style);
        this.width = width;
        this.height = height;
    }

    getLocalCorners(): Point2D[] {
        const w2 = this.width / 2;
        const h2 = this.height / 2;
        return [
            { x: -w2, y: - h2 },
            { x: w2, y: - h2 },
            { x: w2, y: h2 },
            { x: -w2, y: h2 },
        ];
    }

     getDeviceCorners(): Point2D[] {
        const matrix = this.getLocalToDeviceMatrix();
        return this.getLocalCorners().map(p => mat3.transformPoint(matrix, p.x, p.y));
    }

    drawRaster(r: RasterRenderer): void {
        const corners = this.getDeviceCorners();

        const fillRGBA  = hexToRGBA(this.style.fillStyle, Math.round(this.style.fillOpacity * 255));
        const strokeRGBA = hexToRGBA(this.style.strokeStyle, Math.round(this.style.strokeOpacity* 255));

        if (this.style.fillOpacity > 0) {
            r.fillPolygon(corners, fillRGBA);
        }

        if (this.style.strokeWidth > 0 && this.style.fillOpacity > 0) {
            for ( let i = 0; i < corners.length; i++){
                const p1 = corners[i];
                const p2 = corners[(i+1) % corners.length];
                r.strokeLine(p1.x, p1.y, p2.x, p2.y, strokeRGBA, this.style.strokeWidth);
            }
        }
    }

    hitTest(px: number, py: number): boolean {
        const local = this.transformPointToLocal(px, py);
        if (!local) return false;

        const w2 = this.width / 2;
        const h2 = this.height / 2;
        return local.x >= -w2 && local.x <= w2 && local.y >= -h2 && local.y <= h2;
    }

     getBounds(): Bounds {
        const corners = this.getDeviceCorners();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of corners) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        return { minX, minY, maxX, maxY };
    }

    getLocalBounds(): Bounds {
        const w2 = this.width / 2;
        const h2 = this.height / 2;
        return { minX: -w2, minY: -h2, maxX: w2, maxY: h2 };
    }

    clone(): Rect {
        return new Rect(this.width, this.height, { ...this.transform }, { ...this.style });
    }

    toJSON(): object {
        return {
            type: 'rect',
            id: this.id,
            width: this.width,
            height: this.height,
            transform: { ...this.transform },
            style: { ...this.style },
        };
    }

}