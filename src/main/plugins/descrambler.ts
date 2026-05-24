import { writeFileSync } from 'fs'
import { Canvas, CanvasRenderingContext2D, createCanvas, loadImage, Image } from 'canvas'
import { type PathOrFileDescriptor } from 'node:fs'
import { type Buffer } from 'node:buffer'
import { PageExtension } from '../../types/mangaPage'

export class PanelDescrambler {
  DIVIDE_NUM: number
  MULTIPLE: number
  direction: 'row' | 'column'
  reverse: boolean
  pattern: number[]
  input: string | Buffer<ArrayBufferLike> | undefined
  img: Image | undefined
  width: number | undefined
  height: number | undefined
  cell_width: number | undefined
  cell_height: number | undefined
  canvas: Canvas | undefined
  view: CanvasRenderingContext2D | undefined
  constructor({
    DIVIDE_NUM,
    MULTIPLE,
    direction,
    reverse
  }: {
    DIVIDE_NUM?: number
    MULTIPLE?: number
    direction?: 'row' | 'column'
    reverse?: boolean
  } = {}) {
    /**
     * The number of cells in a row/column
     */
    this.DIVIDE_NUM = DIVIDE_NUM || 4
    /**
     * The width will constrained to be dividable by this number
     */
    this.MULTIPLE = MULTIPLE || 8
    this.direction = direction || 'row'
    this.reverse = reverse || false
    this.pattern = this.getTransposePattern()
  }
  async loadImage(
    input: string | Buffer<ArrayBufferLike>,
    {
      DIVIDE_NUM,
      MULTIPLE,
      direction,
      reverse
    }: {
      DIVIDE_NUM?: number
      MULTIPLE?: number
      direction?: 'row' | 'column'
      reverse?: boolean
    } = {}
  ): Promise<void> {
    this.input = input
    const img = await loadImage(input)
    /**
     * raw image
     */
    this.img = img
    this.width = img.width
    this.height = img.height
    if (DIVIDE_NUM) {
      this.DIVIDE_NUM = DIVIDE_NUM
    }
    if (MULTIPLE) {
      this.MULTIPLE = MULTIPLE
    }
    if (direction) {
      this.direction = direction
    }
    if (reverse !== undefined) {
      this.reverse = reverse
    }
    this.cell_width = Math.floor(this.width / (this.DIVIDE_NUM * this.MULTIPLE)) * this.MULTIPLE
    this.cell_height = Math.floor(this.height / (this.DIVIDE_NUM * this.MULTIPLE)) * this.MULTIPLE
    const canvas = createCanvas(this.width, this.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0) // canvas to be painted
    /**
     * Viewer canvas to be painted
     */
    this.canvas = canvas
    /**
     * Viewer canvas context to be painted
     */
    this.view = ctx
  }
  setScramblePattern(pattern: number[]): void {
    this.pattern = pattern
  }
  setDirection(direction: 'row' | 'column'): void {
    this.direction = direction
  }
  setReverse(reverse: boolean): void {
    this.reverse = reverse
  }
  getTransposePattern(): number[] {
    const len = this.DIVIDE_NUM * this.DIVIDE_NUM
    const pattern: number[] = []
    for (let cellIdx = 0; cellIdx < len; cellIdx++) {
      const row = Math.floor(cellIdx / this.DIVIDE_NUM) // 0 0 0 0 1 1 1 1 ...
      pattern.push((cellIdx % this.DIVIDE_NUM) * this.DIVIDE_NUM + row) // 0 4 8 12  1 5 9 13  ...
    }
    return pattern
  }
  async solve(input?: string | Buffer<ArrayBufferLike>): Promise<Buffer<ArrayBufferLike>> {
    if (input) {
      await this.loadImage(input)
    }
    const propCheckArr = ['img', 'view', 'cell_height', 'cell_width'] as const
    for (const propCheck of propCheckArr) {
      if (this[propCheck] == undefined) {
        throw new Error(`Missing ${propCheck} before solve()`)
      }
    }
    // Divide into DIVIDE_NUM * DIVIDE_NUM grid and iterate
    for (let cellIdx = 0; cellIdx < this.DIVIDE_NUM * this.DIVIDE_NUM; cellIdx++) {
      const sourceCellIdx = this.reverse ? this.pattern[cellIdx] : cellIdx
      const destCellIdx = this.reverse ? cellIdx : this.pattern[cellIdx]
      let sourceX: number, sourceY: number, destX: number, destY: number

      if (this.direction === 'column') {
        sourceX = Math.floor(sourceCellIdx / this.DIVIDE_NUM) * this.cell_width!
        sourceY = (sourceCellIdx % this.DIVIDE_NUM) * this.cell_height!
        destX = Math.floor(destCellIdx / this.DIVIDE_NUM) * this.cell_width!
        destY = (destCellIdx % this.DIVIDE_NUM) * this.cell_height!
      } else {
        sourceX = (sourceCellIdx % this.DIVIDE_NUM) * this.cell_width!
        sourceY = Math.floor(sourceCellIdx / this.DIVIDE_NUM) * this.cell_height!
        destX = (destCellIdx % this.DIVIDE_NUM) * this.cell_width!
        destY = Math.floor(destCellIdx / this.DIVIDE_NUM) * this.cell_height!
      }

      this.view!.drawImage(
        this.img!,
        sourceX,
        sourceY,
        this.cell_width!,
        this.cell_height!,
        destX,
        destY,
        this.cell_width!,
        this.cell_height!
      )
    }
    return this.canvas!.toBuffer('raw')
  }
  /**
   * Use **getImageBufferAsync** instead
   * ________________________________
   * Encoding a high-resolution canvas into a PNG or JPEG is a computationally expensive CPU task.
   * Since it is executed synchronously without yielding, it blocks the entire main process
   */
  getImageBuffer(ext: PageExtension): Buffer<ArrayBufferLike> {
    if (!this.canvas) {
      throw new Error('No canvas. Load image first.')
    }
    switch (ext) {
      case '.jpg':
        return this.canvas.toBuffer('image/jpeg', { quality: 1.0 }) // 0.95 is also fine
      case '.png':
      case '.webp':
      default:
        return this.canvas.toBuffer('image/png')
    }
  }

  getImageBufferAsync(ext: PageExtension): Promise<Buffer<ArrayBufferLike>> {
    if (!this.canvas) {
      throw new Error('No canvas. Load image first.')
    }
    return new Promise((resolve, reject) => {
      const callback = (err: Error | null, result: Buffer<ArrayBufferLike>): void => {
        if (err) reject(err)
        else resolve(result)
      }

      switch (ext) {
        case '.jpg':
          this.canvas!.toBuffer(callback, 'image/jpeg', { quality: 1.0 })
          break
        case '.png':
        case '.webp':
        default:
          this.canvas!.toBuffer(callback, 'image/png')
          break
      }
    })
  }

  writeImage(outputPath: PathOrFileDescriptor): void {
    if (!this.canvas) {
      throw new Error('No canvas. Load image first.')
    }
    const outBuffer = this.canvas.toBuffer('image/jpeg')
    writeFileSync(outputPath, outBuffer)
  }
}
