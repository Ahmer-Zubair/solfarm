import Phaser from 'phaser'
import { TILE_H, TILE_HALF_H, TILE_HALF_W, Z_SCALE, type IsoObjectType } from './IsoConstants'
import type { IsoObject } from './IsoWorld'

type Point = { x: number; y: number }

export function darkenColor(hex: number, factor: number): number {
  const r = Math.floor(((hex >> 16) & 0xff) * factor)
  const g = Math.floor(((hex >> 8) & 0xff) * factor)
  const b = Math.floor((hex & 0xff) * factor)
  return (r << 16) | (g << 8) | b
}

export function lightenColor(hex: number, factor: number): number {
  const r = Math.min(255, Math.floor(((hex >> 16) & 0xff) * factor))
  const g = Math.min(255, Math.floor(((hex >> 8) & 0xff) * factor))
  const b = Math.min(255, Math.floor((hex & 0xff) * factor))
  return (r << 16) | (g << 8) | b
}

function fillPoly(g: Phaser.GameObjects.Graphics, points: Point[]) {
  g.fillPoints(points, true)
}

function strokePoly(g: Phaser.GameObjects.Graphics, points: Point[], color = 0x000000, alpha = 0.14, width = 1) {
  g.lineStyle(width, color, alpha)
  g.strokePoints(points, true)
}

function drawWindow(g: Phaser.GameObjects.Graphics, x: number, y: number, w = 10, h = 8) {
  g.fillStyle(0x8ed8ff, 0.95)
  g.fillRoundedRect(x, y, w, h, 2)
  g.lineStyle(1, 0xffffff, 0.35)
  g.strokeLineShape(new Phaser.Geom.Line(x + 2, y + 2, x + w - 2, y + 2))
  g.lineStyle(1, 0x1b4d66, 0.55)
  g.strokeRoundedRect(x, y, w, h, 2)
}

function drawVoxelSpark(g: Phaser.GameObjects.Graphics, x: number, y: number, color = 0xfff4a8, alpha = 0.9) {
  g.fillStyle(color, alpha)
  g.fillRect(x, y - 5, 2, 10)
  g.fillRect(x - 4, y - 1, 10, 2)
}

function drawPixelFlowers(g: Phaser.GameObjects.Graphics, sx: number, sy: number, count = 5) {
  const colors = [0xff6b8a, 0xffd166, 0x8ed8ff, 0xffffff, 0xb97cff]
  for (let i = 0; i < count; i += 1) {
    const x = sx - 34 + i * 17 + (i % 2) * 5
    const y = sy + TILE_HALF_H - 2 + (i % 3) * 4
    g.fillStyle(0x2d8a1a, 1)
    g.fillRect(x, y - 5, 2, 6)
    g.fillStyle(colors[i % colors.length], 1)
    g.fillRect(x - 2, y - 8, 6, 4)
  }
}

function drawFenceRails(g: Phaser.GameObjects.Graphics, sx: number, sy: number, w: number, color: number) {
  g.lineStyle(3, darkenColor(color, 0.78), 1)
  g.strokeLineShape(new Phaser.Geom.Line(sx - w, sy, sx + w, sy + 10))
  g.strokeLineShape(new Phaser.Geom.Line(sx - w, sy + 9, sx + w, sy + 19))
  g.lineStyle(2, lightenColor(color, 1.14), 0.55)
  g.strokeLineShape(new Phaser.Geom.Line(sx - w + 4, sy - 2, sx + w - 4, sy + 8))
}

function drawRoofStripes(g: Phaser.GameObjects.Graphics, sx: number, sy: number, length: number, slope = 0.5, count = 5) {
  g.lineStyle(1, 0xffffff, 0.16)
  for (let i = 1; i < count; i += 1) {
    const t = i / count
    const x = sx - length + length * 2 * t
    g.strokeLineShape(new Phaser.Geom.Line(x, sy + Math.abs(t - 0.5) * length * slope, sx, sy + length * 0.45))
  }
}

function drawSparkle(g: Phaser.GameObjects.Graphics, x: number, y: number, r = 4) {
  fillPoly(g, [
    { x, y: y - r },
    { x: x + r * 0.55, y },
    { x, y: y + r },
    { x: x - r * 0.55, y },
  ])
}

export function drawIsoCube(
  graphics: Phaser.GameObjects.Graphics,
  sx: number,
  sy: number,
  height: number,
  topColor: number,
  leftColor: number,
  rightColor: number
) {
  const hw = TILE_HALF_W
  const hh = TILE_HALF_H
  const h = Math.max(0, height) * Z_SCALE
  const topPts = [{ x: sx, y: sy }, { x: sx + hw, y: sy + hh }, { x: sx, y: sy + hh * 2 }, { x: sx - hw, y: sy + hh }]

  graphics.fillStyle(topColor, 1)
  graphics.fillPoints(topPts, true)
  graphics.lineStyle(1, lightenColor(topColor, 1.12), 0.22)
  graphics.strokePoints(topPts, true)
  graphics.lineStyle(1, 0x000000, 0.08)
  graphics.strokeLineShape(new Phaser.Geom.Line(sx - hw + 2, sy + hh + 1, sx, sy + hh * 2 - 1))
  graphics.strokeLineShape(new Phaser.Geom.Line(sx, sy + hh * 2 - 1, sx + hw - 2, sy + hh + 1))
  graphics.fillStyle(lightenColor(topColor, 1.18), 0.1)
  graphics.fillPoints([{ x: sx, y: sy + 3 }, { x: sx + hw - 8, y: sy + hh }, { x: sx, y: sy + hh * 0.86 }, { x: sx - hw + 8, y: sy + hh }], true)

  if (h <= 0) return
  const leftPts = [{ x: sx - hw, y: sy + hh }, { x: sx, y: sy + hh * 2 }, { x: sx, y: sy + hh * 2 + h }, { x: sx - hw, y: sy + hh + h }]
  const rightPts = [{ x: sx, y: sy + hh * 2 }, { x: sx + hw, y: sy + hh }, { x: sx + hw, y: sy + hh + h }, { x: sx, y: sy + hh * 2 + h }]
  graphics.fillStyle(leftColor, 1)
  graphics.fillPoints(leftPts, true)
  graphics.fillStyle(rightColor, 1)
  graphics.fillPoints(rightPts, true)
  graphics.lineStyle(1, 0x000000, 0.1)
  graphics.strokePoints(leftPts, true)
  graphics.strokePoints(rightPts, true)
  if (h > 18) {
    graphics.lineStyle(1, lightenColor(leftColor, 1.18), 0.14)
    for (let y = sy + hh + 8; y < sy + hh + h; y += 13) {
      graphics.strokeLineShape(new Phaser.Geom.Line(sx - hw + 3, y, sx - 3, y + hh * 0.5))
    }
    graphics.lineStyle(1, darkenColor(rightColor, 0.78), 0.16)
    for (let y = sy + hh + 8; y < sy + hh + h; y += 13) {
      graphics.strokeLineShape(new Phaser.Geom.Line(sx + 3, y + hh * 0.5, sx + hw - 3, y))
    }
  }
}

export function drawSoftShadow(g: Phaser.GameObjects.Graphics, sx: number, sy: number, w: number, h: number, alpha = 0.16) {
  g.fillStyle(0x000000, alpha)
  g.fillEllipse(sx, sy, w, h)
}

export function drawTileBlend(g: Phaser.GameObjects.Graphics, sx: number, sy: number, color: number, side: 'north' | 'south' | 'east' | 'west', alpha = 0.28) {
  const hw = TILE_HALF_W
  const hh = TILE_HALF_H
  g.fillStyle(color, alpha)
  if (side === 'north') g.fillPoints([{ x: sx, y: sy }, { x: sx + hw, y: sy + hh }, { x: sx, y: sy + hh * 0.72 }, { x: sx - hw, y: sy + hh }], true)
  if (side === 'south') g.fillPoints([{ x: sx, y: sy + TILE_H }, { x: sx + hw, y: sy + hh }, { x: sx, y: sy + hh * 1.28 }, { x: sx - hw, y: sy + hh }], true)
  if (side === 'east') g.fillPoints([{ x: sx + hw, y: sy + hh }, { x: sx, y: sy }, { x: sx + hw * 0.38, y: sy + hh }, { x: sx, y: sy + TILE_H }], true)
  if (side === 'west') g.fillPoints([{ x: sx - hw, y: sy + hh }, { x: sx, y: sy }, { x: sx - hw * 0.38, y: sy + hh }, { x: sx, y: sy + TILE_H }], true)
}

export function drawPathConnectors(g: Phaser.GameObjects.Graphics, sx: number, sy: number, connections: { n: boolean; s: boolean; e: boolean; w: boolean }) {
  const centerY = sy + TILE_HALF_H
  g.fillStyle(0x8b6436, 0.18)
  g.fillEllipse(sx, centerY + 3, 44, 18)
  g.fillStyle(0xd0aa68, 0.92)
  g.fillEllipse(sx, centerY, 38, 17)
  g.fillStyle(0xe4c27c, 0.72)
  g.fillEllipse(sx - 3, centerY - 2, 26, 9)
  if (connections.n) g.fillPoints([{ x: sx, y: sy + 3 }, { x: sx + 12, y: centerY }, { x: sx, y: centerY + 5 }, { x: sx - 12, y: centerY }], true)
  if (connections.s) g.fillPoints([{ x: sx, y: sy + TILE_H - 3 }, { x: sx + 12, y: centerY }, { x: sx, y: centerY - 5 }, { x: sx - 12, y: centerY }], true)
  if (connections.e) g.fillPoints([{ x: sx + TILE_HALF_W - 4, y: centerY }, { x: sx, y: centerY - 8 }, { x: sx + 5, y: centerY }, { x: sx, y: centerY + 8 }], true)
  if (connections.w) g.fillPoints([{ x: sx - TILE_HALF_W + 4, y: centerY }, { x: sx, y: centerY - 8 }, { x: sx - 5, y: centerY }, { x: sx, y: centerY + 8 }], true)
  g.lineStyle(1, 0x6f4322, 0.2)
  g.strokeEllipse(sx, centerY, 38, 17)
}

export function drawTileHighlight(g: Phaser.GameObjects.Graphics, sx: number, sy: number, color = 0xffffff, alpha = 0.55) {
  g.lineStyle(2, color, alpha)
  g.strokePoints([{ x: sx, y: sy }, { x: sx + TILE_HALF_W, y: sy + TILE_HALF_H }, { x: sx, y: sy + TILE_H }, { x: sx - TILE_HALF_W, y: sy + TILE_HALF_H }], true)
}

export function drawIsoObject(g: Phaser.GameObjects.Graphics, sx: number, sy: number, obj: IsoObject, tileHeight: number) {
  const baseY = sy - tileHeight * Z_SCALE
  const type: IsoObjectType = obj.type
  if (type === 'tree') drawIsoTree(g, sx, baseY, obj.variant, obj.color, obj.accentColor)
  else if (type === 'house') drawIsoHouse(g, sx, baseY, obj.color, obj.accentColor)
  else if (type === 'barn') drawIsoBarn(g, sx, baseY, obj.color, obj.accentColor)
  else if (type === 'well') drawIsoWell(g, sx, baseY, obj.color, obj.accentColor)
  else if (type === 'rock') drawIsoRock(g, sx, baseY, obj.variant, obj.color, obj.accentColor)
  else if (type === 'crop') drawIsoCrop(g, sx, baseY, obj.variant, obj.color, obj.accentColor)
  else if (type === 'chest') drawIsoChest(g, sx, baseY, obj.color, obj.accentColor)
  else if (type === 'tower') drawIsoTower(g, sx, baseY, obj.color, obj.accentColor)
  else if (type === 'mine') drawIsoMine(g, sx, baseY, obj.color, obj.accentColor)
  else if (type === 'fence') drawIsoFence(g, sx, baseY, obj.color, obj.accentColor)
  else if (type === 'lamp') drawIsoLamp(g, sx, baseY, obj.color, obj.accentColor)
  else if (type === 'animal') drawIsoAnimal(g, sx, baseY, obj.variant, obj.color, obj.accentColor)
  else if (type === 'fountain') drawIsoFountain(g, sx, baseY, obj.color, obj.accentColor)
  else if (type === 'garden') drawIsoGarden(g, sx, baseY, obj.variant, obj.color, obj.accentColor)
  else if (type === 'portal') drawIsoPortal(g, sx, baseY, obj.color, obj.accentColor)
  else drawIsoWindmill(g, sx, baseY, obj.color, obj.accentColor)
}

export function drawIsoFountain(g: Phaser.GameObjects.Graphics, sx: number, sy: number, stone: number, water: number) {
  const baseY = sy + TILE_HALF_H + 12
  drawSoftShadow(g, sx, baseY + 7, 88, 26, 0.18)
  g.fillStyle(0x5d6370, 1)
  g.fillEllipse(sx, baseY, 84, 30)
  g.fillStyle(lightenColor(stone, 1.08), 1)
  g.fillEllipse(sx, baseY - 4, 76, 27)
  g.fillStyle(0x347cb0, 1)
  g.fillEllipse(sx, baseY - 8, 58, 19)
  g.fillStyle(water, 0.7)
  g.fillEllipse(sx - 2, baseY - 10, 42, 12)
  g.fillStyle(darkenColor(stone, 0.78), 1)
  g.fillRoundedRect(sx - 10, baseY - 54, 20, 48, 5)
  g.fillStyle(lightenColor(stone, 1.18), 1)
  g.fillRoundedRect(sx - 7, baseY - 58, 14, 18, 4)
  const t = Date.now() / 170
  g.lineStyle(3, water, 0.72)
  g.strokeLineShape(new Phaser.Geom.Line(sx, baseY - 84 + Math.sin(t) * 2, sx, baseY - 56))
  g.strokeLineShape(new Phaser.Geom.Line(sx - 18, baseY - 48, sx - 27, baseY - 13))
  g.strokeLineShape(new Phaser.Geom.Line(sx + 18, baseY - 48, sx + 27, baseY - 13))
  g.fillStyle(0xdffcff, 0.75)
  g.fillCircle(sx, baseY - 84 + Math.sin(t) * 2, 4)
  g.fillCircle(sx - 27, baseY - 13, 3)
  g.fillCircle(sx + 27, baseY - 13, 3)
}

export function drawIsoGarden(g: Phaser.GameObjects.Graphics, sx: number, sy: number, variant: number, grass: number, flower: number) {
  const baseY = sy + TILE_HALF_H + 8
  const wide = variant === 1
  const w = wide ? 92 : 58
  const h = wide ? 42 : 28
  drawSoftShadow(g, sx, baseY + 7, w, h * 0.55, 0.11)
  g.fillStyle(darkenColor(grass, 0.72), 1)
  fillPoly(g, [
    { x: sx, y: baseY - h },
    { x: sx + w * 0.55, y: baseY - h * 0.46 },
    { x: sx, y: baseY + 5 },
    { x: sx - w * 0.55, y: baseY - h * 0.46 },
  ])
  g.fillStyle(lightenColor(grass, 1.08), 1)
  fillPoly(g, [
    { x: sx, y: baseY - h + 5 },
    { x: sx + w * 0.45, y: baseY - h * 0.46 },
    { x: sx, y: baseY - 3 },
    { x: sx - w * 0.45, y: baseY - h * 0.46 },
  ])
  g.lineStyle(2, 0x8b6b42, 0.8)
  g.strokePoints([
    { x: sx, y: baseY - h },
    { x: sx + w * 0.55, y: baseY - h * 0.46 },
    { x: sx, y: baseY + 5 },
    { x: sx - w * 0.55, y: baseY - h * 0.46 },
  ], true)
  const colors = [flower, 0xffd45a, 0xffffff, 0xb97cff, 0xff7ab6]
  for (let i = 0; i < (wide ? 12 : 7); i += 1) {
    const px = sx - w * 0.32 + (i % 4) * (w * 0.2) + (Math.floor(i / 4) % 2) * 6
    const py = baseY - h * 0.62 + Math.floor(i / 4) * 9 + (i % 2) * 2
    g.fillStyle(0x2f8a34, 1)
    g.fillRect(px, py, 2, 5)
    g.fillStyle(colors[i % colors.length], 1)
    g.fillRect(px - 2, py - 3, 6, 4)
  }
}

export function drawIsoPortal(g: Phaser.GameObjects.Graphics, sx: number, sy: number, glow: number, stone: number) {
  const pulse = 0.72 + Math.sin(Date.now() / 260) * 0.14
  drawSoftShadow(g, sx, sy + 13, 68, 22, 0.26)
  g.lineStyle(8, stone, 1)
  g.strokeEllipse(sx, sy - 28, 42, 68)
  g.lineStyle(4, glow, pulse)
  g.strokeEllipse(sx, sy - 28, 29, 54)
  g.fillStyle(glow, 0.16 + pulse * 0.1)
  g.fillEllipse(sx, sy - 28, 25, 49)
  g.fillStyle(0xdffcff, pulse)
  g.fillCircle(sx - 7, sy - 38, 3)
  g.fillCircle(sx + 8, sy - 20, 2)
  g.fillCircle(sx, sy - 7, 2)
  g.fillStyle(stone, 1)
  g.fillRoundedRect(sx - 28, sy + 2, 56, 12, 4)
}

export function drawIsoAnimal(g: Phaser.GameObjects.Graphics, sx: number, sy: number, variant: number, color: number, accent: number) {
  const isCow = variant === 3
  const bodyW = isCow ? 44 : 24
  const bodyH = isCow ? 25 : 19
  const bodyY = sy - (isCow ? 12 : 6)
  drawSoftShadow(g, sx, sy + 9, isCow ? 52 : 30, isCow ? 17 : 11, 0.2)
  g.fillStyle(darkenColor(color, 0.72), 1)
  g.fillEllipse(sx + 2, bodyY + 3, bodyW, bodyH)
  g.fillStyle(color, 1)
  g.fillEllipse(sx - 2, bodyY, bodyW, bodyH)
  g.fillCircle(sx - bodyW * 0.38, bodyY - 5, isCow ? 12 : 9)
  g.fillStyle(accent, 0.95)
  if (isCow) {
    g.fillEllipse(sx + 7, bodyY - 3, 13, 9)
    g.fillEllipse(sx - 9, bodyY + 4, 11, 8)
    g.fillRect(sx - 16, bodyY + 7, 5, 18)
    g.fillRect(sx + 11, bodyY + 7, 5, 18)
    g.fillStyle(0xe8b9a4, 1)
    g.fillEllipse(sx - 20, bodyY - 1, 12, 8)
    g.fillStyle(0x2a211b, 1)
    g.fillCircle(sx - 23, bodyY - 7, 2)
    g.lineStyle(2, 0xd9c39e, 1)
    g.strokeLineShape(new Phaser.Geom.Line(sx - 25, bodyY - 14, sx - 31, bodyY - 19))
    g.strokeLineShape(new Phaser.Geom.Line(sx - 16, bodyY - 14, sx - 11, bodyY - 19))
  } else {
    g.fillStyle(accent, 1)
    g.fillTriangle(sx - 18, bodyY - 13, sx - 13, bodyY - 23, sx - 8, bodyY - 12)
    g.fillEllipse(sx - 19, bodyY - 3, 9, 6)
    g.fillStyle(0x24211c, 1)
    g.fillCircle(sx - 17, bodyY - 8, 2)
    g.lineStyle(2, 0xc99028, 1)
    g.strokeLineShape(new Phaser.Geom.Line(sx - 6, bodyY + 7, sx - 7, bodyY + 18))
    g.strokeLineShape(new Phaser.Geom.Line(sx + 5, bodyY + 7, sx + 6, bodyY + 18))
  }
}

export function drawIsoTree(g: Phaser.GameObjects.Graphics, sx: number, sy: number, variant: number, color: number, trunkColor = 0x6b4226) {
  const trunkH = 24 + variant * 4
  const crownR = 17 + variant * 4
  const darkLeaf = darkenColor(color, 0.72)
  const lightLeaf = lightenColor(color, 1.16)
  drawSoftShadow(g, sx, sy + 9, crownR * 2.05, crownR * 0.72, 0.18)
  g.fillStyle(darkenColor(trunkColor, 0.72), 1)
  g.fillRoundedRect(sx - 5, sy - trunkH + 2, 5, trunkH + 7, 2)
  g.fillStyle(trunkColor, 1)
  g.fillRoundedRect(sx, sy - trunkH, 6, trunkH + 9, 2)
  g.lineStyle(1, lightenColor(trunkColor, 1.22), 0.45)
  g.strokeLineShape(new Phaser.Geom.Line(sx + 3, sy - trunkH + 4, sx + 3, sy + 4))
  if (variant === 1) {
    for (let layer = 0; layer < 3; layer += 1) {
      const ly = sy - trunkH - crownR * (1.3 - layer * 0.5)
      const lr = crownR * (0.74 + layer * 0.24)
      g.fillStyle(layer === 1 ? color : darkLeaf, 1)
      g.fillTriangle(sx, ly - lr * 0.9, sx - lr, ly + lr * 0.8, sx + lr, ly + lr * 0.8)
      g.lineStyle(1, lightLeaf, 0.18)
      g.strokeTriangle(sx, ly - lr * 0.9, sx - lr, ly + lr * 0.8, sx + lr, ly + lr * 0.8)
    }
  } else {
    g.fillStyle(darkLeaf, 1)
    g.fillCircle(sx + 7, sy - trunkH - 8, crownR * 0.85)
    g.fillCircle(sx - 10, sy - trunkH - 5, crownR * 0.72)
    g.fillStyle(color, 1)
    g.fillCircle(sx - 5, sy - trunkH - 13, crownR * 0.86)
    g.fillCircle(sx + 10, sy - trunkH - 17, crownR * 0.76)
    g.fillStyle(lightLeaf, 1)
    g.fillCircle(sx + 1, sy - trunkH - 24, crownR * 0.72)
    if (variant === 2) {
      g.fillStyle(0xff4444, 1)
      g.fillCircle(sx + 11, sy - trunkH - 18, 3)
      g.fillCircle(sx - 8, sy - trunkH - 11, 3)
      g.fillCircle(sx + 1, sy - trunkH - 27, 2)
    }
  }
}

export function drawIsoHouse(g: Phaser.GameObjects.Graphics, sx: number, sy: number, wallColor: number, roofColor: number) {
  const baseY = sy + TILE_HALF_H + 12
  const w = TILE_HALF_W * 1.8
  const h = Z_SCALE * 1.55
  drawSoftShadow(g, sx, baseY + 7, 132, 44, 0.24)
  g.fillStyle(0x2d8a1a, 0.7)
  fillPoly(g, [
    { x: sx - w - 22, y: baseY - h + 44 },
    { x: sx, y: baseY - h + 76 },
    { x: sx + w + 22, y: baseY - h + 44 },
    { x: sx, y: baseY - h + 14 },
  ])
  drawPixelFlowers(g, sx, baseY - h + 48, 7)
  drawFenceRails(g, sx, baseY - h + 36, 64, 0xc8a060)
  g.fillStyle(0x6f7a58, 0.92)
  fillPoly(g, [
    { x: sx - w - 10, y: baseY - h + 35 },
    { x: sx, y: baseY - h + 60 },
    { x: sx + w + 10, y: baseY - h + 35 },
    { x: sx, y: baseY - h + 10 },
  ])
  g.fillStyle(darkenColor(wallColor, 0.78), 1)
  fillPoly(g, [
    { x: sx - w, y: baseY - h + 16 },
    { x: sx, y: baseY - h + 36 },
    { x: sx, y: baseY + 8 },
    { x: sx - w, y: baseY - 12 },
  ])
  g.fillStyle(darkenColor(wallColor, 0.66), 1)
  fillPoly(g, [
    { x: sx, y: baseY - h + 36 },
    { x: sx + w, y: baseY - h + 16 },
    { x: sx + w, y: baseY - 12 },
    { x: sx, y: baseY + 8 },
  ])
  g.fillStyle(lightenColor(wallColor, 1.04), 1)
  fillPoly(g, [
    { x: sx - w, y: baseY - h + 16 },
    { x: sx, y: baseY - h },
    { x: sx + w, y: baseY - h + 16 },
    { x: sx, y: baseY - h + 36 },
  ])
  strokePoly(g, [
    { x: sx - w, y: baseY - h + 16 },
    { x: sx, y: baseY - h },
    { x: sx + w, y: baseY - h + 16 },
    { x: sx, y: baseY - h + 36 },
  ])
  g.fillStyle(roofColor, 1)
  fillPoly(g, [
    { x: sx - w - 10, y: baseY - h + 15 },
    { x: sx, y: baseY - h - 34 },
    { x: sx, y: baseY - h - 4 },
    { x: sx - w, y: baseY - h + 42 },
  ])
  g.fillStyle(darkenColor(roofColor, 0.72), 1)
  fillPoly(g, [
    { x: sx, y: baseY - h - 34 },
    { x: sx + w + 10, y: baseY - h + 15 },
    { x: sx + w, y: baseY - h + 42 },
    { x: sx, y: baseY - h - 4 },
  ])
  g.lineStyle(2, lightenColor(roofColor, 1.2), 0.32)
  g.strokeLineShape(new Phaser.Geom.Line(sx - w - 5, baseY - h + 16, sx, baseY - h - 31))
  g.strokeLineShape(new Phaser.Geom.Line(sx, baseY - h - 31, sx + w + 5, baseY - h + 16))
  drawRoofStripes(g, sx, baseY - h - 22, w + 2, 0.46, 7)
  drawWindow(g, sx + 18, baseY - h + 17, 13, 10)
  drawWindow(g, sx - 35, baseY - h + 21, 12, 9)
  g.fillStyle(0x9ce55a, 1)
  g.fillRoundedRect(sx + 17, baseY - h + 28, 16, 4, 2)
  g.fillRoundedRect(sx - 36, baseY - h + 31, 15, 4, 2)
  g.fillStyle(0xff7a7a, 1)
  g.fillCircle(sx + 20, baseY - h + 27, 2)
  g.fillCircle(sx + 28, baseY - h + 27, 2)
  g.fillStyle(0x7a4a24, 1)
  g.fillRoundedRect(sx - 8, baseY - 17, 15, 22, 2)
  g.fillStyle(0xf0c040, 1)
  g.fillCircle(sx + 3, baseY - 6, 2)
  g.fillStyle(0xb9854e, 1)
  fillPoly(g, [
    { x: sx - 22, y: baseY - 4 },
    { x: sx + 16, y: baseY + 5 },
    { x: sx + 27, y: baseY },
    { x: sx - 10, y: baseY - 10 },
  ])
  g.lineStyle(1, 0x7a4a24, 0.65)
  g.strokeLineShape(new Phaser.Geom.Line(sx - 16, baseY - 5, sx + 21, baseY + 3))
  g.fillStyle(0x8b4a28, 1)
  g.fillRect(sx + 24, baseY - h - 30, 9, 18)
  g.fillStyle(0x6a2a18, 1)
  g.fillRect(sx + 22, baseY - h - 34, 13, 5)
  g.fillStyle(0xffffff, 0.45)
  g.fillEllipse(sx + 30, baseY - h - 45, 11, 5)
  g.fillEllipse(sx + 39, baseY - h - 51, 8, 4)
  g.fillStyle(0xfff4a8, 0.75)
  drawVoxelSpark(g, sx - 48, baseY - h + 12, 0xfff4a8, 0.72)
}

export function drawIsoBarn(g: Phaser.GameObjects.Graphics, sx: number, sy: number, wallColor: number, trimColor: number) {
  const baseY = sy + TILE_HALF_H + 22
  const w = TILE_HALF_W * 2.05
  const h = Z_SCALE * 1.8
  drawSoftShadow(g, sx, baseY + 8, 140, 48, 0.22)
  g.fillStyle(darkenColor(wallColor, 0.8), 1)
  fillPoly(g, [{ x: sx - w, y: baseY - h + 18 }, { x: sx, y: baseY - h + 42 }, { x: sx, y: baseY + 9 }, { x: sx - w, y: baseY - 14 }])
  g.fillStyle(darkenColor(wallColor, 0.62), 1)
  fillPoly(g, [{ x: sx, y: baseY - h + 42 }, { x: sx + w, y: baseY - h + 18 }, { x: sx + w, y: baseY - 14 }, { x: sx, y: baseY + 9 }])
  g.fillStyle(wallColor, 1)
  fillPoly(g, [{ x: sx - w, y: baseY - h + 18 }, { x: sx, y: baseY - h - 8 }, { x: sx + w, y: baseY - h + 18 }, { x: sx, y: baseY - h + 42 }])
  g.fillStyle(trimColor, 1)
  g.fillRoundedRect(sx - 15, baseY - 34, 30, 38, 2)
  g.lineStyle(1, darkenColor(wallColor, 0.5), 0.35)
  for (let i = -4; i <= 4; i += 1) {
    g.strokeLineShape(new Phaser.Geom.Line(sx + i * 12, baseY - h + 24, sx + i * 12 - 8, baseY - 2))
  }
  g.lineStyle(2, darkenColor(wallColor, 0.48), 1)
  g.strokeLineShape(new Phaser.Geom.Line(sx - 14, baseY - 32, sx + 14, baseY + 2))
  g.strokeLineShape(new Phaser.Geom.Line(sx + 14, baseY - 32, sx - 14, baseY + 2))
  g.fillStyle(0xf5f5e8, 1)
  fillPoly(g, [{ x: sx - w - 8, y: baseY - h + 16 }, { x: sx, y: baseY - h - 38 }, { x: sx, y: baseY - h - 7 }, { x: sx - w, y: baseY - h + 45 }])
  g.fillStyle(0xd8d8d8, 1)
  fillPoly(g, [{ x: sx, y: baseY - h - 38 }, { x: sx + w + 8, y: baseY - h + 16 }, { x: sx + w, y: baseY - h + 45 }, { x: sx, y: baseY - h - 7 }])
  drawRoofStripes(g, sx, baseY - h - 28, w + 4, 0.38, 8)
  g.fillStyle(0xf7e7c2, 1)
  g.fillRoundedRect(sx - 9, baseY - h + 6, 18, 14, 2)
}

export function drawIsoWell(g: Phaser.GameObjects.Graphics, sx: number, sy: number, stone: number, wood: number) {
  drawSoftShadow(g, sx, sy + TILE_HALF_H + 7, 42, 16, 0.15)
  g.fillStyle(darkenColor(stone, 0.72), 1)
  g.fillEllipse(sx, sy + 7, 36, 14)
  g.fillStyle(stone, 1)
  g.fillEllipse(sx, sy - 2, 38, 15)
  g.fillStyle(0x1a5a8a, 1)
  g.fillEllipse(sx, sy - 3, 25, 8)
  g.lineStyle(4, wood, 1)
  g.strokeLineShape(new Phaser.Geom.Line(sx - 17, sy - 8, sx - 17, sy - 38))
  g.strokeLineShape(new Phaser.Geom.Line(sx + 17, sy - 8, sx + 17, sy - 38))
  g.fillStyle(0xcc4444, 1)
  g.fillTriangle(sx - 24, sy - 38, sx, sy - 55, sx + 24, sy - 38)
  g.fillStyle(darkenColor(0xcc4444, 0.72), 1)
  g.fillTriangle(sx, sy - 55, sx + 24, sy - 38, sx, sy - 34)
  g.lineStyle(1, 0x8b6914, 1)
  g.strokeLineShape(new Phaser.Geom.Line(sx, sy - 39, sx, sy - 9))
  g.fillStyle(0x8b6914, 1)
  g.fillRoundedRect(sx - 5, sy - 20, 10, 9, 2)
}

export function drawIsoRock(g: Phaser.GameObjects.Graphics, sx: number, sy: number, variant: number, color: number, accent: number) {
  const r = 9 + variant * 3
  g.fillStyle(0x000000, 0.12)
  g.fillEllipse(sx, sy + 5, r * 2.4, r)
  const pts = [{ x: sx - r, y: sy }, { x: sx - 4, y: sy - r }, { x: sx + r, y: sy - r * 0.4 }, { x: sx + r * 0.6, y: sy + r }, { x: sx - r * 0.8, y: sy + r * 0.7 }]
  g.fillStyle(color, 1)
  g.fillPoints(pts, true)
  g.fillStyle(lightenColor(color, 1.18), 0.7)
  fillPoly(g, [{ x: sx - 5, y: sy - r + 1 }, { x: sx + r * 0.5, y: sy - r * 0.45 }, { x: sx, y: sy - 1 }])
  g.fillStyle(darkenColor(color, 0.62), 0.65)
  fillPoly(g, [{ x: sx, y: sy - 1 }, { x: sx + r * 0.55, y: sy + r }, { x: sx - r * 0.2, y: sy + r * 0.55 }])
  g.fillStyle(accent, 0.8)
  g.fillCircle(sx + 4, sy - 3, Math.max(2, r * 0.2))
  if (variant >= 2) {
    g.fillStyle(lightenColor(accent, 1.2), 0.9)
    drawSparkle(g, sx - 3, sy - 6, 5)
  }
}

export function drawIsoCrop(g: Phaser.GameObjects.Graphics, sx: number, sy: number, variant: number, color: number, accent: number) {
  drawSoftShadow(g, sx, sy + TILE_HALF_H + 5, 86, 26, 0.11)
  g.fillStyle(0x6b3d1e, 0.58)
  fillPoly(g, [
    { x: sx - 46, y: sy + TILE_HALF_H + 1 },
    { x: sx, y: sy + TILE_HALF_H + 18 },
    { x: sx + 46, y: sy + TILE_HALF_H + 1 },
    { x: sx, y: sy - 14 },
  ])
  g.fillStyle(0x8a5a2b, 0.36)
  for (let row = -1; row <= 1; row += 1) {
    g.fillEllipse(sx + row * 17, sy + TILE_HALF_H + row * 3, 38, 10)
  }
  g.lineStyle(1, 0x6f4322, 0.25)
  for (let i = -3; i <= 3; i += 1) {
    g.strokeLineShape(new Phaser.Geom.Line(sx - 38 + i * 6, sy + 17, sx + 36 + i * 6, sy + 22))
  }
  if (variant <= 0) {
    g.fillStyle(0x4ab5e8, 0.18)
    g.fillEllipse(sx - 18, sy + 9, 9, 4)
    g.fillEllipse(sx + 19, sy + 12, 8, 4)
    return
  }
  for (let row = -1; row <= 1; row += 1) {
    for (let i = -2; i <= 2; i += 1) {
      const px = sx + i * 8 + row * 16
      const py = sy + 8 + row * 6
      const plantH = 9 + variant * 9
      g.lineStyle(2, color, 1)
      g.strokeLineShape(new Phaser.Geom.Line(px, py, px, py - plantH))
      g.lineStyle(2, darkenColor(color, 0.75), 0.9)
      g.strokeLineShape(new Phaser.Geom.Line(px, py - plantH * 0.45, px - 6, py - plantH * 0.65))
      g.strokeLineShape(new Phaser.Geom.Line(px, py - plantH * 0.55, px + 6, py - plantH * 0.78))
      g.fillStyle(variant >= 3 ? accent : lightenColor(color, 1.15), 1)
      g.fillEllipse(px + 2, py - plantH - 2, variant >= 3 ? 8 : 5, variant >= 3 ? 12 : 7)
      if (variant >= 3) {
        drawVoxelSpark(g, px + 6, py - plantH - 13, 0xfff4a8, 0.8)
      } else if (variant === 1) {
        g.lineStyle(1, lightenColor(accent, 1.15), 0.8)
        g.strokeLineShape(new Phaser.Geom.Line(px + 2, py - plantH - 6, px + 7, py - plantH - 9))
      }
    }
  }
}

export function drawPlacementPreview(
  g: Phaser.GameObjects.Graphics,
  sx: number,
  sy: number,
  footprint: { w: number; h: number },
  valid: boolean
) {
  const color = valid ? 0x9ce55a : 0xff6b6b
  const alpha = valid ? 0.24 : 0.3
  const w = TILE_HALF_W * Math.max(1, footprint.w)
  const h = TILE_HALF_H * Math.max(1, footprint.h)
  g.fillStyle(color, alpha)
  fillPoly(g, [
    { x: sx, y: sy - 4 },
    { x: sx + w, y: sy + h },
    { x: sx, y: sy + h * 2 + 4 },
    { x: sx - w, y: sy + h },
  ])
  g.lineStyle(2, color, valid ? 0.85 : 0.95)
  g.strokePoints([
    { x: sx, y: sy - 4 },
    { x: sx + w, y: sy + h },
    { x: sx, y: sy + h * 2 + 4 },
    { x: sx - w, y: sy + h },
  ], true)
}

export function drawIsoChest(g: Phaser.GameObjects.Graphics, sx: number, sy: number, color: number, accent: number) {
  drawSoftShadow(g, sx, sy + TILE_HALF_H + 4, 38, 14, 0.18)
  drawIsoCube(g, sx, sy - 6, 0.45, color, darkenColor(color, 0.8), darkenColor(color, 0.62))
  g.fillStyle(accent, 1)
  g.fillRect(sx - 3, sy - 12, 6, 8)
  g.fillStyle(0xffe58a, 0.75)
  drawSparkle(g, sx - 12, sy - 15, 4)
  drawSparkle(g, sx + 13, sy - 18, 3)
}

export function drawIsoTower(g: Phaser.GameObjects.Graphics, sx: number, sy: number, color: number, accent: number) {
  drawSoftShadow(g, sx, sy + TILE_HALF_H + 14, 58, 22, 0.18)
  drawIsoCube(g, sx, sy - Z_SCALE * 2.4, 2.8, color, darkenColor(color, 0.75), darkenColor(color, 0.55))
  g.fillStyle(accent, 1)
  g.fillTriangle(sx - 24, sy - Z_SCALE * 5.3, sx + 24, sy - Z_SCALE * 5.3, sx, sy - Z_SCALE * 6.2)
  g.fillStyle(lightenColor(color, 1.18), 1)
  for (let i = -2; i <= 2; i += 1) g.fillRect(sx + i * 9 - 3, sy - Z_SCALE * 5.05, 6, 10)
  drawWindow(g, sx + 7, sy - Z_SCALE * 3.1, 8, 13)
}

export function drawIsoMine(g: Phaser.GameObjects.Graphics, sx: number, sy: number, color: number, accent: number) {
  drawIsoCube(g, sx, sy - 10, 0.8, color, darkenColor(color, 0.7), darkenColor(color, 0.5))
  g.fillStyle(accent, 1)
  g.fillRect(sx - 19, sy - 28, 38, 5)
  g.fillRect(sx - 16, sy - 28, 5, 21)
  g.fillRect(sx + 11, sy - 28, 5, 21)
}

export function drawIsoWindmill(g: Phaser.GameObjects.Graphics, sx: number, sy: number, wall: number, blade: number) {
  drawSoftShadow(g, sx, sy + TILE_HALF_H + 18, 92, 32, 0.18)
  const baseY = sy + TILE_HALF_H + 14
  g.fillStyle(darkenColor(wall, 0.74), 1)
  fillPoly(g, [{ x: sx - 22, y: baseY }, { x: sx - 12, y: baseY - 112 }, { x: sx, y: baseY - 104 }, { x: sx, y: baseY + 6 }])
  g.fillStyle(wall, 1)
  fillPoly(g, [{ x: sx, y: baseY + 6 }, { x: sx, y: baseY - 104 }, { x: sx + 12, y: baseY - 112 }, { x: sx + 22, y: baseY }])
  g.fillStyle(0xcc4444, 1)
  g.fillTriangle(sx - 20, baseY - 112, sx, baseY - 138, sx + 20, baseY - 112)
  const cy = baseY - 96
  g.lineStyle(5, darkenColor(blade, 0.82), 1)
  g.strokeLineShape(new Phaser.Geom.Line(sx - 36, cy, sx + 36, cy))
  g.strokeLineShape(new Phaser.Geom.Line(sx, cy - 30, sx, cy + 30))
  g.fillStyle(0xf7e7c2, 0.95)
  g.fillEllipse(sx - 32, cy, 22, 9)
  g.fillEllipse(sx + 32, cy, 22, 9)
  g.fillEllipse(sx, cy - 27, 9, 20)
  g.fillEllipse(sx, cy + 27, 9, 20)
  g.fillStyle(0xf0c040, 1)
  g.fillCircle(sx, cy, 6)
}

export function drawIsoFence(g: Phaser.GameObjects.Graphics, sx: number, sy: number, color: number, accent: number) {
  const baseY = sy + TILE_HALF_H
  const dark = darkenColor(color, 0.72)
  g.fillStyle(dark, 1)
  g.fillRect(sx - 18, baseY - 16, 4, 16)
  g.fillRect(sx + 14, baseY - 16, 4, 16)
  g.fillStyle(color, 1)
  g.fillRect(sx - 19, baseY - 14, 38, 4)
  g.fillRect(sx - 19, baseY - 6, 38, 4)
  g.fillStyle(accent, 1)
  g.fillTriangle(sx - 16, baseY - 21, sx - 20, baseY - 16, sx - 12, baseY - 16)
  g.fillTriangle(sx + 16, baseY - 21, sx + 12, baseY - 16, sx + 20, baseY - 16)
}

export function drawIsoLamp(g: Phaser.GameObjects.Graphics, sx: number, sy: number, metal: number, glow: number) {
  const baseY = sy + TILE_HALF_H
  g.fillStyle(0x000000, 0.14)
  g.fillEllipse(sx, baseY + 2, 18, 8)
  g.fillStyle(metal, 1)
  g.fillEllipse(sx, baseY, 14, 6)
  g.fillRect(sx - 2, baseY - 46, 4, 44)
  g.fillRect(sx - 8, baseY - 54, 16, 10)
  g.fillStyle(glow, 0.16)
  g.fillCircle(sx, baseY - 50, 26)
  g.fillStyle(glow, 0.82)
  g.fillEllipse(sx, baseY - 50, 18, 13)
}
