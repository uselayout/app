import type { FigmaClient, FigmaNode } from "../client";
import type { ExtractedComponent } from "@/lib/types";

export interface ParseComponentsResult {
  components: ExtractedComponent[];
  /** Raw node data from the batch fetch, reusable for mining radius/spacing. */
  nodeData: Record<string, { document: FigmaNode }>;
}

export async function parseComponents(
  fileKey: string,
  client: FigmaClient,
  onProgress?: (msg: string) => void,
  onWarning?: (msg: string) => void
): Promise<ParseComponentsResult> {
  onProgress?.("Fetching components...");
  const [componentsRes, componentSetsRes] = await Promise.all([
    client.getComponents(fileKey),
    client.getComponentSets(fileKey),
  ]);

  const components = componentsRes.meta.components;
  const componentSets = componentSetsRes.meta.component_sets;

  onProgress?.(`Found ${components.length} components, ${componentSets.length} component sets`);

  // Fallback: when the REST endpoints return nothing, walk the document
  // tree for COMPONENT / COMPONENT_SET nodes. This recovers components on
  // community-file duplicates, which don't expose them via the metadata
  // endpoints until the owner explicitly publishes them.
  if (components.length === 0 && componentSets.length === 0) {
    try {
      onProgress?.("No components via REST — walking document tree as fallback");
      return await parseComponentsFromTree(fileKey, client, onProgress);
    } catch (err) {
      onWarning?.(
        `Component fallback failed: ${err instanceof Error ? err.message : String(err)}`
      );
      return { components: [], nodeData: {} };
    }
  }

  const COMPONENT_ENRICH_LIMIT = 200;
  if (components.length > COMPONENT_ENRICH_LIMIT) {
    onWarning?.(`${components.length} components found but only first ${COMPONENT_ENRICH_LIMIT} enriched with full property data.`);
  }

  const setNodeIds = componentSets.map((s) => s.node_id);
  const componentNodeIds = components.slice(0, COMPONENT_ENRICH_LIMIT).map((c) => c.node_id);
  const allNodeIds = [...new Set([...setNodeIds, ...componentNodeIds])];

  let nodeData: Record<string, { document: FigmaNode }> = {};

  if (allNodeIds.length > 0) {
    onProgress?.(`Enriching top ${allNodeIds.length} components with full data...`);
    const nodesRes = await client.getNodesBatched(fileKey, allNodeIds);
    nodeData = nodesRes.nodes as Record<string, { document: FigmaNode }>;
  }

  const setNamesMap = new Map<string, string>();
  for (const set of componentSets) {
    setNamesMap.set(set.node_id, set.name);
  }

  // Build a component key → name lookup for resolving instance swap targets
  const componentKeyToName = new Map<string, string>();
  for (const comp of components) {
    if (comp.key) componentKeyToName.set(comp.key, comp.name);
  }
  for (const set of componentSets) {
    if (set.key) componentKeyToName.set(set.key, set.name);
  }

  const groupedBySet = new Map<string, ExtractedComponent>();

  for (const comp of components) {
    const setName = comp.containing_frame?.name;
    const isInSet = setName && setNamesMap.has(comp.containing_frame?.name ?? "");

    if (isInSet && setName) {
      const existing = groupedBySet.get(setName);
      if (existing) {
        existing.variantCount += 1;
        if (!existing.variants) existing.variants = [];
        existing.variants.push(comp.name);
      } else {
        const node = nodeData[comp.node_id];
        const props = node?.document?.componentPropertyDefinitions;

        groupedBySet.set(setName, {
          name: setName,
          description: comp.description || undefined,
          variantCount: 1,
          variants: [comp.name],
          properties: props
            ? Object.fromEntries(
                Object.entries(props).map(([key, val]) => [
                  key,
                  {
                    type: val.type as "BOOLEAN" | "TEXT" | "VARIANT" | "INSTANCE_SWAP",
                    defaultValue: val.defaultValue !== undefined
                      ? String(val.defaultValue)
                      : undefined,
                    preferredValues: val.preferredValues?.map((pv) => {
                      // For INSTANCE_SWAP, preferredValues contain { type, key }.
                      // Resolve to component name if available, otherwise include key with type prefix.
                      if (typeof pv === "object" && pv.type) {
                        const resolvedName = componentKeyToName.get(pv.value);
                        return resolvedName || `${pv.type.toLowerCase()}:${pv.value}`;
                      }
                      return pv.value;
                    }),
                  },
                ])
              )
            : undefined,
        });
      }
    } else {
      groupedBySet.set(comp.name, {
        name: comp.name,
        description: comp.description || undefined,
        variantCount: 1,
      });
    }
  }

  return { components: Array.from(groupedBySet.values()), nodeData };
}

/**
 * Fallback component extraction for files where /components and /component_sets
 * return empty (typically community-file duplicates that haven't been
 * re-published). Walks the full document tree and collects every
 * COMPONENT_SET and top-level COMPONENT node.
 */
export async function parseComponentsFromTree(
  fileKey: string,
  client: FigmaClient,
  onProgress?: (msg: string) => void
): Promise<ParseComponentsResult> {
  onProgress?.("Fetching full document tree...");
  const fileRes = await client.getFile(fileKey);

  const components: ExtractedComponent[] = [];
  const nodeData: Record<string, { document: FigmaNode }> = {};
  const seenNames = new Set<string>();

  walkComponentNodes(fileRes.document, (node, inSet) => {
    if (node.type === "COMPONENT_SET") {
      if (seenNames.has(node.name)) return;
      seenNames.add(node.name);

      const variants = (node.children ?? [])
        .filter((c) => c.type === "COMPONENT")
        .map((c) => c.name);

      components.push({
        name: node.name,
        variantCount: Math.max(1, variants.length),
        variants: variants.length > 0 ? variants : undefined,
        properties: toComponentProperties(node.componentPropertyDefinitions),
      });
      nodeData[node.id] = { document: node };
    } else if (node.type === "COMPONENT" && !inSet) {
      // Standalone component (not wrapped in a COMPONENT_SET)
      if (seenNames.has(node.name)) return;
      seenNames.add(node.name);

      components.push({
        name: node.name,
        variantCount: 1,
        properties: toComponentProperties(node.componentPropertyDefinitions),
      });
      nodeData[node.id] = { document: node };
    }
  });

  onProgress?.(`Found ${components.length} components via document tree`);
  return { components, nodeData };
}

function walkComponentNodes(
  node: FigmaNode,
  callback: (node: FigmaNode, inSet: boolean) => void,
  inSet = false
): void {
  callback(node, inSet);
  // Don't recurse into COMPONENT or COMPONENT_SET bodies — we've already
  // captured them and their internal structure isn't relevant to the inventory.
  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") return;
  if (node.children) {
    for (const child of node.children) {
      walkComponentNodes(child, callback, inSet);
    }
  }
}

function toComponentProperties(
  defs: FigmaNode["componentPropertyDefinitions"]
): ExtractedComponent["properties"] {
  if (!defs) return undefined;
  return Object.fromEntries(
    Object.entries(defs).map(([key, val]) => [
      key,
      {
        type: val.type as "BOOLEAN" | "TEXT" | "VARIANT" | "INSTANCE_SWAP",
        defaultValue:
          val.defaultValue !== undefined ? String(val.defaultValue) : undefined,
        preferredValues: val.preferredValues?.map((pv) =>
          typeof pv === "object" && pv.type
            ? `${pv.type.toLowerCase()}:${pv.value}`
            : pv.value
        ),
      },
    ])
  );
}
