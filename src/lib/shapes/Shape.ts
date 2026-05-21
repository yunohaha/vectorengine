import { mat3, type Mat3, type Point2D } from '../math/mat3';
import type { RasterRenderer } from '../raster/RasterRenderer';

export interface ShapeStyle {
    
    fillStyle: string;
    fillOpacity: number;
    strokeStyle: string;
    strokeWidth: number;
    strokeOpacity: number;
}

export interface Transform {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
}

export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number
}

export abstract class Shape {
    id: string;
    transform: Transform;
    style:ShapeStyle;

    constructor(transform?: Partial<Transform>, style?: Partial<ShapeStyle>) {
        this.id = crypto.randomUUID();
        this.transform = {
            x: transform?.x ?? 0,
            y: transform?.y ?? 0,
            rotation: transform?.rotation ?? 0,
            scaleX: transform?.scaleX ?? 1,
            scaleY: transform?.scaleY ?? 1,
        };
        this.style = {
            fillStyle: style?.fillStyle ?? '#000000',
            fillOpacity: style?.fillOpacity ?? 1,
            strokeStyle: style?.strokeStyle ?? '#000000',
            strokeWidth: style?.strokeWidth ?? 1,
            strokeOpacity: style?.strokeOpacity ?? 1,
        };
    }

    setTransform(updates: Partial<Transform>): void {
        this.transform = {
        ...this.transform,
        ...updates,
        };
    }


    getLocalToDeviceMatrix(): Mat3 {
        const {x, y, rotation, scaleX, scaleY } = this.transform;
        return mat3.fromTransform(x, y, rotation, scaleX, scaleY);
    }

    getDeviceToLocalMatrix(): Mat3 | null {
        return mat3.invert(this.getLocalToDeviceMatrix());
    }

    
    transformPointToDevice(px: number, py: number): Point2D {
        return mat3.transformPoint(this.getLocalToDeviceMatrix(), px, py);
    }
    
    transformPointToLocal(px: number, py: number): Point2D | null {
        const inv = this.getDeviceToLocalMatrix();
        if (!inv) return null;
        return mat3.transformPoint(inv, px, py);
    }

    getCenter(): Point2D {

        const bounds = this.getBounds();

        return {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2,
        };
    }

    resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number): void {
        const center = this.getCenter();
        const newCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
        
        this.setTransform({
            x: this.transform.x + (newCenter.x - center.x),
            y: this.transform.y + (newCenter.y - center.y),
        });
        
        const oldBounds = this.getBounds();
        const oldWidth = oldBounds.maxX - oldBounds.minX;
        const oldHeight = oldBounds.maxY - oldBounds.minY;
        const newWidth = maxX - minX;
        const newHeight = maxY - minY;
        
        this.setTransform({
            scaleX:
                oldWidth > 0
                    ? this.transform.scaleX * (newWidth / oldWidth)
                    : this.transform.scaleX,

            scaleY:
                oldHeight > 0
                    ? this.transform.scaleY * (newHeight / oldHeight)
                    : this.transform.scaleY,
        });
    }

    setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
        this.resizeFromDeviceAABB(minX, minY, maxX, maxY);
    }

    abstract clone(): Shape;

    abstract drawRaster(r: RasterRenderer): void;

    abstract hitTest(px: number, py: number): boolean;

    getBounds(): Bounds {

        const pts = this.getLocalPoints().map(p =>
            this.transformPointToDevice(p.x, p.y)
        );

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const p of pts) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }

        return {
            minX,
            minY,
            maxX,
            maxY,
        };
    }

    abstract getLocalBounds(): Bounds;

    abstract toJSON(): object;
    abstract getLocalPoints(): Point2D[];
}