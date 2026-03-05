import type { FigmaClient } from "../client";
import type { ExtractedComponent } from "@/lib/types";

export async function parseComponents(
  fileKey: string,
  client: FigmaClient,
  onProgress?: (msg: string) => void
): Promise<ExtractedComponent[]> {
  onProgress?.("Fetching components...");
  const [componentsRes, componentSetsRes] = await Promise.all([
    client.getComponents(fileKey),
    client.getComponentSets(fileKey),
  ]);

  const components = componentsRes.meta.components;
  const componentSets = componentSetsRes.meta.component_sets;

  onProgress?.(`Found ${components.length} components, ${componentSets.length} component sets`);

  const setNodeIds = componentSets.map((s) => s.node_id);
  const componentNodeIds = components.slice(0, 50).map((c) => c.node_id);
  const allNodeIds = [...new Set([...setNodeIds, ...componentNodeIds])];

  let nodeData: Record<string, { document: { componentPropertyDefinitions?: Record<string, { type: string }> } }> = {};

  if (allNodeIds.length > 0) {
    onProgress?.(`Enriching top ${allNodeIds.length} components with full data...`);
    const nodesRes = await client.getNodesBatched(fileKey, allNodeIds);
    nodeData = nodesRes.nodes as typeof nodeData;
  }

  const setNamesMap = new Map<string, string>();
  for (const set of componentSets) {
    setNamesMap.set(set.node_id, set.name);
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

  return Array.from(groupedBySet.values());
}
