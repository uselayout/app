import { describe, it, expect, vi } from "vitest";
import { parseComponentsFromTree } from "./components";
import type { FigmaClient, FigmaNode, FigmaFileResponse } from "../client";

function makeClient(tree: FigmaNode): FigmaClient {
  return {
    getFile: vi.fn(async () =>
      ({
        name: "Test File",
        lastModified: "2026-04-20T00:00:00Z",
        thumbnailUrl: "",
        document: tree,
      } satisfies FigmaFileResponse)
    ),
  } as unknown as FigmaClient;
}

function node(partial: Partial<FigmaNode> & Pick<FigmaNode, "id" | "name" | "type">): FigmaNode {
  return { ...partial } as FigmaNode;
}

describe("parseComponentsFromTree", () => {
  it("extracts standalone COMPONENT nodes at any depth", async () => {
    const tree = node({
      id: "0:0",
      name: "root",
      type: "DOCUMENT",
      children: [
        node({
          id: "1:0",
          name: "Page 1",
          type: "CANVAS",
          children: [
            node({
              id: "2:0",
              name: "Frame",
              type: "FRAME",
              children: [
                node({ id: "3:0", name: "Button", type: "COMPONENT" }),
                node({ id: "3:1", name: "Card", type: "COMPONENT" }),
              ],
            }),
          ],
        }),
      ],
    });

    const result = await parseComponentsFromTree("file", makeClient(tree));

    expect(result.components).toHaveLength(2);
    expect(result.components.map((c) => c.name).sort()).toEqual(["Button", "Card"]);
    expect(result.components.every((c) => c.variantCount === 1)).toBe(true);
  });

  it("groups COMPONENTs under their COMPONENT_SET and counts variants", async () => {
    const tree = node({
      id: "0:0",
      name: "root",
      type: "DOCUMENT",
      children: [
        node({
          id: "1:0",
          name: "Page 1",
          type: "CANVAS",
          children: [
            node({
              id: "2:0",
              name: "Button",
              type: "COMPONENT_SET",
              children: [
                node({ id: "3:0", name: "Variant=Primary", type: "COMPONENT" }),
                node({ id: "3:1", name: "Variant=Secondary", type: "COMPONENT" }),
                node({ id: "3:2", name: "Variant=Ghost", type: "COMPONENT" }),
              ],
            }),
          ],
        }),
      ],
    });

    const result = await parseComponentsFromTree("file", makeClient(tree));

    expect(result.components).toHaveLength(1);
    expect(result.components[0].name).toBe("Button");
    expect(result.components[0].variantCount).toBe(3);
    expect(result.components[0].variants).toEqual([
      "Variant=Primary",
      "Variant=Secondary",
      "Variant=Ghost",
    ]);
  });

  it("does not emit a COMPONENT twice if nested inside a COMPONENT_SET", async () => {
    const tree = node({
      id: "0:0",
      name: "root",
      type: "DOCUMENT",
      children: [
        node({
          id: "2:0",
          name: "Button",
          type: "COMPONENT_SET",
          children: [node({ id: "3:0", name: "Primary", type: "COMPONENT" })],
        }),
      ],
    });

    const result = await parseComponentsFromTree("file", makeClient(tree));

    // Set is emitted; the COMPONENT inside should NOT be emitted as a standalone
    expect(result.components).toHaveLength(1);
    expect(result.components[0].name).toBe("Button");
  });

  it("dedupes components that share a name across pages", async () => {
    const tree = node({
      id: "0:0",
      name: "root",
      type: "DOCUMENT",
      children: [
        node({
          id: "1:0",
          name: "Page A",
          type: "CANVAS",
          children: [node({ id: "3:0", name: "Card", type: "COMPONENT" })],
        }),
        node({
          id: "1:1",
          name: "Page B",
          type: "CANVAS",
          children: [node({ id: "3:1", name: "Card", type: "COMPONENT" })],
        }),
      ],
    });

    const result = await parseComponentsFromTree("file", makeClient(tree));

    expect(result.components).toHaveLength(1);
    expect(result.components[0].name).toBe("Card");
  });

  it("returns empty result for a file with no components", async () => {
    const tree = node({
      id: "0:0",
      name: "root",
      type: "DOCUMENT",
      children: [
        node({
          id: "1:0",
          name: "Page 1",
          type: "CANVAS",
          children: [node({ id: "2:0", name: "Frame", type: "FRAME" })],
        }),
      ],
    });

    const result = await parseComponentsFromTree("file", makeClient(tree));

    expect(result.components).toEqual([]);
    expect(result.nodeData).toEqual({});
  });

  it("carries componentPropertyDefinitions through as properties", async () => {
    const tree = node({
      id: "0:0",
      name: "root",
      type: "DOCUMENT",
      children: [
        node({
          id: "3:0",
          name: "Button",
          type: "COMPONENT",
          componentPropertyDefinitions: {
            "Label#1:0": {
              type: "TEXT",
              defaultValue: "Click me",
            },
            "Disabled#1:1": {
              type: "BOOLEAN",
              defaultValue: false,
            },
          } as FigmaNode["componentPropertyDefinitions"],
        }),
      ],
    });

    const result = await parseComponentsFromTree("file", makeClient(tree));

    expect(result.components[0].properties).toBeDefined();
    expect(result.components[0].properties?.["Label#1:0"].type).toBe("TEXT");
    expect(result.components[0].properties?.["Label#1:0"].defaultValue).toBe("Click me");
    expect(result.components[0].properties?.["Disabled#1:1"].type).toBe("BOOLEAN");
    expect(result.components[0].properties?.["Disabled#1:1"].defaultValue).toBe("false");
  });
});
