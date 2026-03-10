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

/**
 * Compute a Gaussian opacity based on the distance in days between a document date
 * and the currently selected date on the timeline.
 *
 * @param {Date|string|null} docDate - The document's publication date
 * @param {Date|string|null} selectedDate - The date selected on the timeline
 * @param {number} sigmaDays - Standard deviation in days (controls falloff width)
 * @returns {number} Opacity in [0, 1]; 1.0 means fully visible (no filter active or delta=0)
 */
export function gaussianOpacity(docDate, selectedDate, sigmaDays) {
  if (docDate == null || selectedDate == null) return 1.0;
  const docMs = new Date(docDate).getTime();
  const selMs = new Date(selectedDate).getTime();
  const deltaDays = Math.abs(docMs - selMs) / 86400000;
  return Math.exp(-(deltaDays * deltaDays) / (2 * sigmaDays * sigmaDays));
}

/**
 * Return the k closest dots to the given dot by Euclidean distance in canvas pixel space.
 *
 * @param {{ cx: number, cy: number }} dot - The reference dot (excluded from results)
 * @param {Array<{ cx: number, cy: number }>} dotPositions - All dot positions
 * @param {number} k - Number of nearest neighbors to return (default 5)
 * @returns {Array<{ cx: number, cy: number }>} Up to k nearest dots (excluding self)
 */
export function kNearest(dot, dotPositions, k = 5) {
  return dotPositions
    .filter(d => d !== dot)
    .map(d => ({ dot: d, dist: Math.sqrt((d.cx - dot.cx) ** 2 + (d.cy - dot.cy) ** 2) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, k)
    .map(entry => entry.dot);
}

/**
 * Compose multiple opacity values by returning their minimum.
 * Callers are responsible for applying any DIM_OPACITY floor before or after calling this.
 *
 * @param {number} tagOp - Opacity from tag filter
 * @param {number} searchOp - Opacity from search filter
 * @param {number} gaussianOp - Opacity from Gaussian timeline filter
 * @returns {number} The minimum of all three opacities
 */
export function composedOpacity(tagOp, searchOp, gaussianOp) {
  return Math.min(tagOp, searchOp, gaussianOp);
}
