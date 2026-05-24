import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { createCanvas, loadImage } from "canvas";

// --- CONFIGURATION ---
const INPUT_DIR = "./test_raw_images";
const OUTPUT_DIR = "./test_clean_images";

export class PanelDescrambler {
  /**
   * @param {{DIVIDE_NUM?: number, MULTIPLE?: number}} [config]
   */
  constructor({ DIVIDE_NUM, MULTIPLE } = {}) {
    /**
     * The number of cells in a row/column
     */
    this.DIVIDE_NUM = DIVIDE_NUM || 4;
    /**
     * The width will constrained to be dividable by this number
     */
    this.MULTIPLE = MULTIPLE || 8;
    this.pattern = this.getTransposePattern()
  }
  /**
   *
   * @param {string} inputPath
   * @param {{DIVIDE_NUM?: number, MULTIPLE?: number}} [config]
   */
  async loadImage(inputPath, { DIVIDE_NUM, MULTIPLE } = {}) {
    this.inputPath = inputPath;
    const img = await loadImage(inputPath);
    /**
     * raw image
     */
    this.img = img;
    this.width = img.width;
    this.height = img.height;
    if (DIVIDE_NUM) {
      this.DIVIDE_NUM = DIVIDE_NUM;
    }
    if (MULTIPLE) {
      this.MULTIPLE = MULTIPLE;
    }
    this.cell_width = Math.floor(this.width / (this.DIVIDE_NUM * this.MULTIPLE)) * this.MULTIPLE;
    this.cell_height = Math.floor(this.height / (this.DIVIDE_NUM * this.MULTIPLE)) * this.MULTIPLE;
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0); // canvas to be painted
    /**
     * Viewer canvas to be painted
     */
    this.canvas = canvas;
    /**
     * Viewer canvas context to be painted
     */
    this.view = ctx;
  }
  /**
   * 
   * @param {number[]} pattern 
   */
  setScramblePattern(pattern){
    this.pattern = pattern
  }
  getTransposePattern(){
    const len = this.DIVIDE_NUM * this.DIVIDE_NUM
    const pattern = []
    for (let cellIdx = 0; cellIdx < len; cellIdx++) {
      const row = Math.floor(cellIdx / this.DIVIDE_NUM); // 0 0 0 0 1 1 1 1 ....
      pattern.push((cellIdx % this.DIVIDE_NUM) * this.DIVIDE_NUM + row); // 0 4 8 12  1 5 9 13
    }
    return pattern
  }
  /**
   *
   * @param {string} [inputPath]
   */
  async solve(inputPath) {
    if (inputPath) {
      await this.loadImage(inputPath);
    }
    if (!this.img || !this.view) {
      throw new Error("Missing img.");
    }
    // Divide into DIVIDE_NUM * DIVIDE_NUM grid and iterate
    for (let cellIdx = 0; cellIdx < this.DIVIDE_NUM * this.DIVIDE_NUM; cellIdx++) {
      const sourceY = Math.floor(cellIdx / this.DIVIDE_NUM) * this.cell_height,
        sourceX = (cellIdx % this.DIVIDE_NUM) * this.cell_width,
        destCellIdx = this.pattern[cellIdx],
        destX = (destCellIdx % this.DIVIDE_NUM) * this.cell_width,
        destY = Math.floor(destCellIdx / this.DIVIDE_NUM) * this.cell_height;
      this.view.drawImage(
        this.img,
        sourceX,
        sourceY,
        this.cell_width,
        this.cell_height,
        destX,
        destY,
        this.cell_width,
        this.cell_height
      );
    }
  }
  /**
   * @param {string} outputPath
   */
  writeImage(outputPath) {
    if (!this.canvas) {
      throw new Error("No canvas. Load image first.");
    }
    const outBuffer = this.canvas.toBuffer("image/jpeg");
    writeFileSync(outputPath, outBuffer);
  }
}

async function mainTest() {
  if (!existsSync(INPUT_DIR)) {
    throw new Error(`Directory ${INPUT_DIR} does not exist.`);
  }
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR);
  const files = readdirSync(INPUT_DIR).filter((f) => f.endsWith(".jpg"));
  const descrambler = new PanelDescrambler({DIVIDE_NUM: 4, MULTIPLE: 8});
  for (const file of files) {
    const inputPath = join(INPUT_DIR, file);
    const outputPath = join(OUTPUT_DIR, file.replace(/_\[.+\]/, ""));
    await descrambler.solve(inputPath);
    descrambler.writeImage(outputPath);
  }
}

mainTest()