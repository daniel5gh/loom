/**
 * Pure helper functions for the /map page.
 * Importable from Node.js (map.test.mjs) and from the build-time map.astro script.
 */

/**
 * Build linear scale functions that map document UMAP coordinates to canvas pixels.
 *
 * @param {Array<{x: number, y: number}>} docs
 * @param {number} canvasW - Canvas logical width in CSS pixels
 * @param {number} canvasH - Canvas logical height in CSS pixels
 * @param {number} padding - Inset from each edge in pixels (default 40)
 * @returns {{ scaleX: (v: number) => number, scaleY: (v: number) => number }}
 */
export function buildScales(docs, canvasW, canvasH, padding = 40) {
  const xs = docs.map(d => d.x);
  const ys = docs.map(d => d.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);

  const scaleX = xMax === xMin
    ? () => canvasW / 2
    : v => padding + (v - xMin) / (xMax - xMin) * (canvasW - 2 * padding);

  const scaleY = yMax === yMin
    ? () => canvasH / 2
    : v => padding + (v - yMin) / (yMax - yMin) * (canvasH - 2 * padding);

  return { scaleX, scaleY };
}

/**
 * Find the first dot in dotPositions within hitRadius of (mx, my).
 *
 * @param {number} mx - Mouse x in CSS pixels (relative to canvas)
 * @param {number} my - Mouse y in CSS pixels (relative to canvas)
 * @param {Array<{doc: object, cx: number, cy: number}>} dotPositions
 * @param {number} hitRadius - Hit radius in CSS pixels (default 8)
 * @returns {{ doc: object, cx: number, cy: number } | null}
 */
export function hitTest(mx, my, dotPositions, hitRadius = 8) {
  for (const dot of dotPositions) {
    const dx = dot.cx - mx;
    const dy = dot.cy - my;
    if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
      return dot;
    }
  }
  return null;
}
