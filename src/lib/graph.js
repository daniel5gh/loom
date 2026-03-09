/**
 * Build-time graph data library for Loom knowledge graph.
 *
 * Pure functions — no Astro imports, no side effects.
 * Called from Astro frontmatter scripts at build time.
 *
 * Input doc shape:
 *   { id: string, data: { title: string, tags: string[] }, category: string }
 */

const CLUSTER_COLORS = ['#00E5FF', '#FF2D78', '#39FF14'];
const FALLBACK_COLOR = '#8888AA';

/**
 * buildGraphData(allDocs)
 *
 * Returns { nodes, edges } for D3 graph rendering.
 *
 * nodes: Array of { id, title, tags, url, tagCount, color, cluster }
 * edges: Array of { source, target, weight, sharedTags } — only pairs with >= 2 shared tags
 *
 * Color assignment: identify the 3 most frequent tags across all docs.
 * Each node gets colored by the first top tag it contains.
 * Nodes with no top tag match get the fallback color.
 *
 * @param {Array<{id: string, data: {title: string, tags: string[]}, category: string}>} allDocs
 * @returns {{ nodes: Array, edges: Array }}
 */
function buildGraphData(allDocs) {
  // 1. Map docs to nodes
  const nodes = allDocs.map(doc => ({
    id: doc.id,
    title: doc.data.title,
    tags: doc.data.tags,
    url: `/${doc.category}/${doc.id}/`,
    tagCount: doc.data.tags.length,
    color: FALLBACK_COLOR,
    cluster: null,
  }));

  // 2. Build edges (O(n^2) — acceptable for typical collection sizes <500)
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const sharedTags = nodes[i].tags.filter(t => nodes[j].tags.includes(t));
      if (sharedTags.length >= 2) {
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
          weight: sharedTags.length,
          sharedTags,
        });
      }
    }
  }

  // 3. Tag frequency map
  const tagFreq = {};
  for (const node of nodes) {
    for (const tag of node.tags) {
      tagFreq[tag] = (tagFreq[tag] || 0) + 1;
    }
  }

  // 4. Top 3 tags by frequency
  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  // 5. Color assignment
  for (const node of nodes) {
    for (let i = 0; i < topTags.length; i++) {
      if (node.tags.includes(topTags[i])) {
        node.color = CLUSTER_COLORS[i];
        node.cluster = topTags[i];
        break;
      }
    }
  }

  return { nodes, edges };
}

/**
 * getRelatedDocs(currentDoc, allDocs)
 *
 * Returns up to 5 docs related to currentDoc, sorted by shared tag count descending.
 * Excludes currentDoc itself.
 *
 * Each result item: { doc, sharedTags, category }
 *
 * @param {{id: string, data: {title: string, tags: string[]}, category: string}} currentDoc
 * @param {Array<{id: string, data: {title: string, tags: string[]}, category: string}>} allDocs
 * @returns {Array<{doc: object, sharedTags: string[], category: string}>}
 */
function getRelatedDocs(currentDoc, allDocs) {
  return allDocs
    .filter(other => other.id !== currentDoc.id)
    .map(other => ({
      doc: other,
      sharedTags: currentDoc.data.tags.filter(t => other.data.tags.includes(t)),
      category: other.category,
    }))
    .filter(item => item.sharedTags.length > 0)
    .sort((a, b) => b.sharedTags.length - a.sharedTags.length)
    .slice(0, 5);
}

export { buildGraphData, getRelatedDocs };
