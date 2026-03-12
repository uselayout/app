const FIGMA_API_BASE = "https://api.figma.com/v1";
const MIN_REQUEST_DELAY_MS = 100;
const MAX_RETRIES = 3;
const BATCH_SIZE = 50;

interface FigmaClientOptions {
  accessToken: string;
  onProgress?: (message: string) => void;
}

export class FigmaClient {
  private accessToken: string;
  private lastRequestTime = 0;
  private onProgress: (message: string) => void;

  constructor({ accessToken, onProgress }: FigmaClientOptions) {
    this.accessToken = accessToken;
    this.onProgress = onProgress ?? (() => {});
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < MIN_REQUEST_DELAY_MS) {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_REQUEST_DELAY_MS - elapsed)
      );
    }
    this.lastRequestTime = Date.now();
  }

  private async fetchWithRetry<T>(path: string): Promise<T> {
    await this.rateLimit();

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(`${FIGMA_API_BASE}${path}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (response.status === 429) {
        const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        this.onProgress(`Rate limited, retrying in ${Math.round(backoff / 1000)}s...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "Unknown error");
        throw new FigmaApiError(
          `Figma API error ${response.status}: ${text}`,
          response.status
        );
      }

      return response.json() as Promise<T>;
    }

    throw new FigmaApiError("Max retries exceeded", 429);
  }

  async getFile(fileKey: string, depth?: number): Promise<FigmaFileResponse> {
    const depthParam = depth ? `?depth=${depth}` : "";
    return this.fetchWithRetry<FigmaFileResponse>(
      `/files/${fileKey}${depthParam}`
    );
  }

  async getStyles(fileKey: string): Promise<FigmaStylesResponse> {
    return this.fetchWithRetry<FigmaStylesResponse>(
      `/files/${fileKey}/styles`
    );
  }

  async getNodes(
    fileKey: string,
    nodeIds: string[]
  ): Promise<FigmaNodesResponse> {
    const ids = encodeURIComponent(nodeIds.join(","));
    return this.fetchWithRetry<FigmaNodesResponse>(
      `/files/${fileKey}/nodes?ids=${ids}`
    );
  }

  async getNodesBatched(
    fileKey: string,
    nodeIds: string[]
  ): Promise<FigmaNodesResponse> {
    const batches: string[][] = [];
    for (let i = 0; i < nodeIds.length; i += BATCH_SIZE) {
      batches.push(nodeIds.slice(i, i + BATCH_SIZE));
    }

    const allNodes: Record<string, FigmaNodeResponse> = {};

    for (let i = 0; i < batches.length; i++) {
      this.onProgress(
        `Resolving node values (batch ${i + 1}/${batches.length})...`
      );
      const result = await this.getNodes(fileKey, batches[i]);
      Object.assign(allNodes, result.nodes);
    }

    return { nodes: allNodes };
  }

  async getComponents(fileKey: string): Promise<FigmaComponentsResponse> {
    return this.fetchWithRetry<FigmaComponentsResponse>(
      `/files/${fileKey}/components`
    );
  }

  async getComponentSets(
    fileKey: string
  ): Promise<FigmaComponentSetsResponse> {
    return this.fetchWithRetry<FigmaComponentSetsResponse>(
      `/files/${fileKey}/component_sets`
    );
  }

  async getImages(
    fileKey: string,
    nodeIds: string[],
    format: "png" | "svg" = "png",
    scale = 2
  ): Promise<FigmaImagesResponse> {
    const ids = encodeURIComponent(nodeIds.join(","));
    return this.fetchWithRetry<FigmaImagesResponse>(
      `/images/${fileKey}?ids=${ids}&format=${format}&scale=${scale}`
    );
  }

  async getVariables(fileKey: string): Promise<FigmaVariablesResponse> {
    return this.fetchWithRetry<FigmaVariablesResponse>(
      `/files/${fileKey}/variables/local`
    );
  }

  static extractFileKey(url: string): string | null {
    const match = url.match(/figma\.com\/(file|design)\/([a-zA-Z0-9]+)/);
    return match ? match[2] : null;
  }
}

export class FigmaApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "FigmaApiError";
  }
}

// Figma API response types

export interface FigmaFileResponse {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  document: FigmaNode;
}

export interface FigmaStylesResponse {
  meta: {
    styles: FigmaStyleMeta[];
  };
}

export interface FigmaStyleMeta {
  key: string;
  name: string;
  description: string;
  style_type: "FILL" | "TEXT" | "EFFECT" | "GRID";
  node_id: string;
}

export interface FigmaNodesResponse {
  nodes: Record<string, FigmaNodeResponse>;
}

export interface FigmaNodeResponse {
  document: FigmaNode;
  components?: Record<string, FigmaComponentMeta>;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  fills?: FigmaFill[];
  style?: FigmaTypeStyle;
  effects?: FigmaEffect[];
  componentPropertyDefinitions?: Record<string, FigmaComponentProperty>;
  layoutMode?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  cornerRadius?: number;
}

export interface FigmaFill {
  type: string;
  color?: { r: number; g: number; b: number; a: number };
  opacity?: number;
}

export interface FigmaTypeStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  letterSpacing?: number;
  textCase?: string;
}

export interface FigmaEffect {
  type: string;
  color?: { r: number; g: number; b: number; a: number };
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
  visible?: boolean;
}

export interface FigmaComponentProperty {
  type: "BOOLEAN" | "TEXT" | "VARIANT" | "INSTANCE_SWAP";
  defaultValue?: string | boolean;
  preferredValues?: Array<{ type: string; value: string }>;
}

export interface FigmaComponentMeta {
  key: string;
  name: string;
  description: string;
}

export interface FigmaComponentsResponse {
  meta: {
    components: FigmaComponentInfo[];
  };
}

export interface FigmaComponentSetsResponse {
  meta: {
    component_sets: FigmaComponentSetInfo[];
  };
}

export interface FigmaComponentInfo {
  key: string;
  name: string;
  description: string;
  node_id: string;
  containing_frame?: { name: string };
}

export interface FigmaComponentSetInfo {
  key: string;
  name: string;
  description: string;
  node_id: string;
}

export interface FigmaImagesResponse {
  images: Record<string, string | null>;
}

export interface FigmaVariablesResponse {
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaVariableCollection>;
  };
}

export interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: string;
  valuesByMode: Record<string, unknown>;
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
}
