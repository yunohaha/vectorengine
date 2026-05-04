import { test, expect } from 'vitest';
import { Rect } from './Rect';
import { Line } from './Line';
import { Oval } from './Oval';

test('Rect hitTest', () => {
    const rect = new Rect(100, 100, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
    
    expect(rect.hitTest(0, 0)).toBe(true);      
    expect(rect.hitTest(40, 40)).toBe(true);    
    expect(rect.hitTest(60, 60)).toBe(false);  
});

test('Rect bounds', () => {
    const rect = new Rect(100, 100, { x: 50, y: 50, rotation: 0, scaleX: 1, scaleY: 1 });
    const bounds = rect.getBounds();
    
    expect(bounds.minX).toBeCloseTo(0);
    expect(bounds.minY).toBeCloseTo(0);
    expect(bounds.maxX).toBeCloseTo(100);
    expect(bounds.maxY).toBeCloseTo(100);
});

test('Line hitTest', () => {
    const line = new Line(-50, 0, 50, 0, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
    
    expect(line.hitTest(0, 0)).toBe(true);      
    expect(line.hitTest(30, 0)).toBe(true);    
    expect(line.hitTest(30, 5)).toBe(false);  
});

test('Oval hitTest', () => {
    const oval = new Oval(50, 30, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
    
    expect(oval.hitTest(0, 0)).toBe(true);      
    expect(oval.hitTest(40, 0)).toBe(true);     
    expect(oval.hitTest(50, 0)).toBe(true);     
    expect(oval.hitTest(60, 0)).toBe(false);    
});

test('Rect transform', () => {
    const rect = new Rect(100, 100, { x: 100, y: 100, rotation: Math.PI / 2, scaleX: 1, scaleY: 1 });
    
    
    const point = rect.transformPointToDevice(0, 0);
    expect(point.x).toBeCloseTo(100);
    expect(point.y).toBeCloseTo(100);
});