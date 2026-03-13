# Explorer Image Upload

## Summary

Add image upload to the Explorer page so users can attach a screenshot (webpage, component, design mockup) as a visual reference. Claude analyses the image and generates design variants using the project's DESIGN.md tokens.

## UI

### Prompt bar (ExplorerToolbar)

- **Attach button**: Image icon to the left of the text input. Opens native file picker (PNG, JPG, WebP, max 5MB).
- **Paste/Drop**: Cmd+V pastes clipboard image. Drag & drop onto prompt bar also works.
- **Thumbnail chip**: 32x32 rounded preview between attach button and text input. X to remove. Filename on hover tooltip.
- **Client-side resize**: Images over 5MB are downscaled (canvas, max 1600px longest dimension) before converting to base64.

### Reference persistence (ExplorerCanvas)

- Image stored as `referenceImage` on `ExplorationSession` (base64 data URL).
- When viewing a session with a reference image, show it as a small pinned card above the variant grid.

## Data flow

```
User attaches image (file picker / paste / drop)
  -> File -> canvas resize if >5MB -> base64 data URL
  -> ExplorerToolbar passes (prompt, variantCount, imageDataUrl) to ExplorerCanvas
  -> ExplorerCanvas.handleGenerate stores imageDataUrl on ExplorationSession
  -> POST /api/generate/explore { prompt, designMd, variantCount, imageDataUrl? }
  -> lib/claude/explore.ts builds multi-content message:
     [{ type: "image", source: { type: "base64", media_type, data } }, { type: "text", text: prompt }]
  -> Claude vision analyses image + generates variants using DESIGN.md
```

## Files to modify

| File | Change |
|------|--------|
| `lib/types/index.ts` | Add `referenceImage?: string` to `ExplorationSession` |
| `lib/claude/explore.ts` | Accept optional image, build multi-content user message |
| `app/api/generate/explore/route.ts` | Add `imageDataUrl` to Zod schema, pass to stream creator |
| `components/studio/ExplorerToolbar.tsx` | Attach button, paste/drop handlers, thumbnail chip, pass image up |
| `components/studio/ExplorerCanvas.tsx` | Accept image from toolbar, store on session, show reference card |

## Constraints

- Max 5MB (Claude vision limit), auto-resize if over
- PNG, JPG, WebP only
- Single image per prompt (no multi-image)
- Stored as base64 in localStorage with session (no server storage)
- No URL-to-screenshot (future feature)
