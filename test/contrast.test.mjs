import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';

/**
 * Parse a hex color string (#RRGGBB) to [r, g, b] in [0, 1] range.
 */
function hexToLinear(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Linearize a sRGB channel value per WCAG formula.
 * c <= 0.04045 ? c/12.92 : ((c + 0.055) / 1.055) ^ 2.4
 */
function linearize(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Calculate relative luminance of a hex color.
 * L = 0.2126*R + 0.7152*G + 0.0722*B (linearized channels)
 */
function luminance(hex) {
  const [r, g, b] = hexToLinear(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Calculate WCAG contrast ratio between two hex colors.
 * ratio = (L_lighter + 0.05) / (L_darker + 0.05)
 */
function contrastRatio(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Ground truth hex values from public/styles/global.css :root
const BG_BASE          = '#0D0D1A';
const TEXT_PRIMARY     = '#D0D0D0';
const TEXT_SECONDARY   = '#8888AA';
const NEON_CYAN        = '#00E5FF';
const NEON_MAGENTA     = '#FF2D78';
const NEON_GREEN       = '#39FF14';

describe('WCAG contrast ratios against --bg-base (#0D0D1A)', () => {
  test('--text-primary (#D0D0D0) vs --bg-base meets WCAG AA normal text (>= 4.5:1)', () => {
    const ratio = contrastRatio(TEXT_PRIMARY, BG_BASE);
    assert.ok(
      ratio >= 4.5,
      `Expected contrast >= 4.5:1 for --text-primary, got ${ratio.toFixed(2)}:1`
    );
  });

  test('--neon-cyan (#00E5FF) vs --bg-base meets WCAG AA normal text (>= 4.5:1)', () => {
    const ratio = contrastRatio(NEON_CYAN, BG_BASE);
    assert.ok(
      ratio >= 4.5,
      `Expected contrast >= 4.5:1 for --neon-cyan, got ${ratio.toFixed(2)}:1`
    );
  });

  test('--neon-magenta (#FF2D78) vs --bg-base meets WCAG AA normal text (>= 4.5:1)', () => {
    const ratio = contrastRatio(NEON_MAGENTA, BG_BASE);
    assert.ok(
      ratio >= 4.5,
      `Expected contrast >= 4.5:1 for --neon-magenta, got ${ratio.toFixed(2)}:1`
    );
  });

  test('--neon-green (#39FF14) vs --bg-base meets WCAG AA normal text (>= 4.5:1)', () => {
    const ratio = contrastRatio(NEON_GREEN, BG_BASE);
    assert.ok(
      ratio >= 4.5,
      `Expected contrast >= 4.5:1 for --neon-green, got ${ratio.toFixed(2)}:1`
    );
  });

  test('--text-secondary (#8888AA) vs --bg-base meets large text / UI threshold (>= 3.0:1)', () => {
    const ratio = contrastRatio(TEXT_SECONDARY, BG_BASE);
    assert.ok(
      ratio >= 3.0,
      `Expected contrast >= 3.0:1 for --text-secondary, got ${ratio.toFixed(2)}:1`
    );
  });
});
