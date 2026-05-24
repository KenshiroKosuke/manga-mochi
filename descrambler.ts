import { writeFileSync } from 'fs'
import { Canvas, CanvasRenderingContext2D, createCanvas, loadImage, Image } from 'canvas'
import { PathOrFileDescriptor } from 'node:fs'

export class PanelDescrambler {
  DIVIDE_NUM: number
  MULTIPLE: number
  pattern: number[]
  input: string | Buffer<ArrayBufferLike> | undefined
  img: Image | undefined
  width: number | undefined
  height: number | undefined
  cell_width: number | undefined
  cell_height: number | undefined
  canvas: Canvas | undefined
  view: CanvasRenderingContext2D | undefined
  constructor({ DIVIDE_NUM, MULTIPLE }: { DIVIDE_NUM?: number; MULTIPLE?: number } = {}) {
    /**
     * The number of cells in a row/column
     */
    this.DIVIDE_NUM = DIVIDE_NUM || 4
    /**
     * The width will constrained to be dividable by this number
     */
    this.MULTIPLE = MULTIPLE || 8
    this.pattern = this.getTransposePattern()
  }
  async loadImage(
    input: string | Buffer<ArrayBufferLike>,
    { DIVIDE_NUM, MULTIPLE }: { DIVIDE_NUM?: number; MULTIPLE?: number } = {}
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
  getTransposePattern(): number[] {
    const len = this.DIVIDE_NUM * this.DIVIDE_NUM
    const pattern = []
    for (let cellIdx = 0; cellIdx < len; cellIdx++) {
      const row = Math.floor(cellIdx / this.DIVIDE_NUM) // 0 0 0 0 1 1 1 1 ...
      pattern.push((cellIdx % this.DIVIDE_NUM) * this.DIVIDE_NUM + row) // 0 4 8 12  1 5 9 13  ...
    }
    return pattern
  }
  async solve(input: string | Buffer<ArrayBufferLike>): Promise<void> {
    if (input) {
      await this.loadImage(input)
    }
    const propCheckArr = ['img', 'view', 'cell_height', 'cell_width'] as const
    for (const propCheck of propCheckArr) {
      if (this[propCheck]) {
        throw new Error(`Missing ${propCheck} before solve()`)
      }
    }
    // Divide into DIVIDE_NUM * DIVIDE_NUM grid and iterate
    for (let cellIdx = 0; cellIdx < this.DIVIDE_NUM * this.DIVIDE_NUM; cellIdx++) {
      const sourceY = Math.floor(cellIdx / this.DIVIDE_NUM) * this.cell_height!,
        sourceX = (cellIdx % this.DIVIDE_NUM) * this.cell_width!,
        destCellIdx = this.pattern[cellIdx],
        destX = (destCellIdx % this.DIVIDE_NUM) * this.cell_width!,
        destY = Math.floor(destCellIdx / this.DIVIDE_NUM) * this.cell_height!
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
  }
  writeImage(outputPath: PathOrFileDescriptor): void {
    if (!this.canvas) {
      throw new Error('No canvas. Load image first.')
    }
    const outBuffer = this.canvas.toBuffer('image/jpeg')
    writeFileSync(outputPath, outBuffer)
  }
}
