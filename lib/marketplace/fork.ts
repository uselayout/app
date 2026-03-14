import { getTemplateById, incrementForkCount } from "@/lib/supabase/templates";
import { getTokensByOrg, bulkCreateTokens } from "@/lib/supabase/tokens";
import {
  getTypefacesByOrg,
  createTypeface,
  getTypeScaleByTypeface,
  createTypeScaleEntry,
} from "@/lib/supabase/typography";
import { getIconsByOrg, bulkCreateIcons } from "@/lib/supabase/icons";
import {
  getComponentsByOrg,
  createComponent,
  nameToComponentSlug,
} from "@/lib/supabase/components";

export async function forkTemplate(
  templateId: string,
  targetOrgId: string,
  userId: string
): Promise<{
  tokensForked: number;
  componentsForked: number;
  typefacesForked: number;
  iconsForked: number;
}> {
  const template = await getTemplateById(templateId);
  if (!template) {
    throw new Error("Template not found");
  }

  const sourceOrgId = template.sourceOrgId;

  // 1. Fork tokens
  const tokens = await getTokensByOrg(sourceOrgId);
  const tokensForked = await bulkCreateTokens(
    targetOrgId,
    tokens.map((t) => ({
      name: t.name,
      type: t.type,
      value: t.value,
      category: t.category,
      cssVariable: t.cssVariable ?? undefined,
      groupName: t.groupName ?? undefined,
      sortOrder: t.sortOrder,
      description: t.description ?? undefined,
      source: "manual" as const,
    }))
  );

  // 2. Fork typefaces + type scale entries
  const typefaces = await getTypefacesByOrg(sourceOrgId);
  let typefacesForked = 0;

  for (const typeface of typefaces) {
    const newTypeface = await createTypeface({
      orgId: targetOrgId,
      family: typeface.family,
      source: typeface.source ?? undefined,
      googleFontsUrl: typeface.googleFontsUrl ?? undefined,
      weights: typeface.weights,
      role: typeface.role ?? undefined,
    });

    if (newTypeface) {
      typefacesForked++;

      // Copy type scale entries
      const scaleEntries = await getTypeScaleByTypeface(typeface.id);
      for (const entry of scaleEntries) {
        await createTypeScaleEntry({
          orgId: targetOrgId,
          typefaceId: newTypeface.id,
          name: entry.name,
          fontSize: entry.fontSize,
          fontWeight: entry.fontWeight,
          lineHeight: entry.lineHeight,
          letterSpacing: entry.letterSpacing,
          textTransform: entry.textTransform ?? undefined,
          sortOrder: entry.sortOrder,
        });
      }
    }
  }

  // 3. Fork icons
  const icons = await getIconsByOrg(sourceOrgId);
  const forkedIcons = await bulkCreateIcons(
    targetOrgId,
    icons.map((i) => ({
      name: i.name,
      svg: i.svg,
      viewbox: i.viewbox,
      category: i.category,
      tags: i.tags,
      sizes: i.sizes,
      strokeWidth: i.strokeWidth,
      source: i.source ?? undefined,
      libraryName: i.libraryName ?? undefined,
    }))
  );

  // 4. Fork approved components
  const components = await getComponentsByOrg(sourceOrgId, {
    status: "approved",
  });
  let componentsForked = 0;

  for (const comp of components) {
    const slug = nameToComponentSlug(comp.name);
    const result = await createComponent({
      orgId: targetOrgId,
      name: comp.name,
      slug,
      code: comp.code,
      compiledJs: comp.compiledJs ?? undefined,
      description: comp.description ?? undefined,
      category: comp.category,
      tags: comp.tags,
      props: comp.props,
      variants: comp.variants,
      states: comp.states,
      source: "manual",
      createdBy: userId,
    });

    if (result) {
      componentsForked++;
    }
  }

  // 5. Increment fork count on template
  await incrementForkCount(templateId);

  return {
    tokensForked,
    componentsForked,
    typefacesForked,
    iconsForked: forkedIcons.length,
  };
}
