// ─── Icon Pack Registry ─────────────────────────────────────────────────────
// Static registry of supported open source icon packs.
// No database needed — these are well-known libraries.

export interface IconPack {
  id: string;
  name: string;
  npmPackage: string;
  /** UMD bundle URL for iframe preview loading (null = use stub fallback) */
  cdnUrl: string | null;
  /** Global variable name exposed by the UMD bundle */
  cdnGlobalName: string | null;
  iconCount: number;
  license: string;
  /** Import syntax template for layout.md documentation */
  importSyntax: string;
  namingConvention: string;
  /** 25-30 commonly used icon names to guide AI generation */
  commonIcons: string[];
  website: string;
  description: string;
}

export const ICON_PACKS: Record<string, IconPack> = {
  lucide: {
    id: "lucide",
    name: "Lucide",
    npmPackage: "lucide-react",
    cdnUrl: "https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js",
    cdnGlobalName: "LucideReact",
    iconCount: 1000,
    license: "MIT",
    importSyntax: 'import { IconName } from "lucide-react";',
    namingConvention: "PascalCase (e.g. ArrowRight, ChevronDown, Settings)",
    commonIcons: [
      "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown",
      "Check", "X", "Plus", "Minus",
      "ChevronDown", "ChevronRight", "ChevronUp", "ChevronLeft",
      "Search", "Menu", "MoreHorizontal", "MoreVertical",
      "Star", "Heart", "Settings", "User",
      "Mail", "Phone", "Calendar", "Clock",
      "Download", "Upload", "ExternalLink", "Copy",
      "Trash2", "Edit", "Eye", "EyeOff", "Filter",
    ],
    website: "https://lucide.dev",
    description: "Community-driven fork of Feather Icons with 1000+ clean, consistent icons",
  },

  heroicons: {
    id: "heroicons",
    name: "Heroicons",
    npmPackage: "@heroicons/react/24/outline",
    cdnUrl: null,
    cdnGlobalName: null,
    iconCount: 300,
    license: "MIT",
    importSyntax: 'import { ArrowRightIcon } from "@heroicons/react/24/outline";',
    namingConvention: "PascalCase with Icon suffix (e.g. ArrowRightIcon, CheckIcon). Variants: /24/outline, /24/solid, /20/solid, /16/solid",
    commonIcons: [
      "ArrowRightIcon", "ArrowLeftIcon", "ArrowUpIcon", "ArrowDownIcon",
      "CheckIcon", "XMarkIcon", "PlusIcon", "MinusIcon",
      "ChevronDownIcon", "ChevronRightIcon", "ChevronUpIcon",
      "MagnifyingGlassIcon", "Bars3Icon", "EllipsisHorizontalIcon",
      "StarIcon", "HeartIcon", "Cog6ToothIcon", "UserIcon",
      "EnvelopeIcon", "PhoneIcon", "CalendarIcon", "ClockIcon",
      "ArrowDownTrayIcon", "ArrowUpTrayIcon", "ArrowTopRightOnSquareIcon",
      "ClipboardIcon", "TrashIcon", "PencilIcon", "EyeIcon", "FunnelIcon",
    ],
    website: "https://heroicons.com",
    description: "Beautiful hand-crafted SVG icons by the makers of Tailwind CSS",
  },

  phosphor: {
    id: "phosphor",
    name: "Phosphor",
    npmPackage: "@phosphor-icons/react",
    cdnUrl: null,
    cdnGlobalName: null,
    iconCount: 1248,
    license: "MIT",
    importSyntax: 'import { ArrowRight, Check } from "@phosphor-icons/react";',
    namingConvention: "PascalCase (e.g. ArrowRight, Check). Weight prop: thin, light, regular, bold, fill, duotone",
    commonIcons: [
      "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown",
      "Check", "X", "Plus", "Minus",
      "CaretDown", "CaretRight", "CaretUp",
      "MagnifyingGlass", "List", "DotsThree",
      "Star", "Heart", "Gear", "User",
      "Envelope", "Phone", "Calendar", "Clock",
      "DownloadSimple", "UploadSimple", "ArrowSquareOut",
      "Copy", "Trash", "PencilSimple", "Eye", "Funnel",
    ],
    website: "https://phosphoricons.com",
    description: "Flexible icon family with 6 weights per icon for expressive design",
  },

  tabler: {
    id: "tabler",
    name: "Tabler Icons",
    npmPackage: "@tabler/icons-react",
    cdnUrl: null,
    cdnGlobalName: null,
    iconCount: 6092,
    license: "MIT",
    importSyntax: 'import { IconArrowRight, IconCheck } from "@tabler/icons-react";',
    namingConvention: "PascalCase with Icon prefix (e.g. IconArrowRight, IconCheck, IconStar)",
    commonIcons: [
      "IconArrowRight", "IconArrowLeft", "IconArrowUp", "IconArrowDown",
      "IconCheck", "IconX", "IconPlus", "IconMinus",
      "IconChevronDown", "IconChevronRight", "IconChevronUp",
      "IconSearch", "IconMenu2", "IconDots",
      "IconStar", "IconHeart", "IconSettings", "IconUser",
      "IconMail", "IconPhone", "IconCalendar", "IconClock",
      "IconDownload", "IconUpload", "IconExternalLink",
      "IconCopy", "IconTrash", "IconEdit", "IconEye", "IconFilter",
    ],
    website: "https://tabler.io/icons",
    description: "Over 6000 free MIT-licensed SVG icons, the largest open source set",
  },

  radix: {
    id: "radix",
    name: "Radix Icons",
    npmPackage: "@radix-ui/react-icons",
    cdnUrl: null,
    cdnGlobalName: null,
    iconCount: 333,
    license: "MIT",
    importSyntax: 'import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons";',
    namingConvention: "PascalCase with Icon suffix (e.g. ArrowRightIcon, CheckIcon, StarIcon)",
    commonIcons: [
      "ArrowRightIcon", "ArrowLeftIcon", "ArrowUpIcon", "ArrowDownIcon",
      "CheckIcon", "Cross2Icon", "PlusIcon", "MinusIcon",
      "ChevronDownIcon", "ChevronRightIcon", "ChevronUpIcon",
      "MagnifyingGlassIcon", "HamburgerMenuIcon", "DotsHorizontalIcon",
      "StarIcon", "HeartIcon", "GearIcon", "PersonIcon",
      "EnvelopeClosedIcon", "CalendarIcon", "ClockIcon",
      "DownloadIcon", "UploadIcon", "ExternalLinkIcon",
      "CopyIcon", "TrashIcon", "Pencil1Icon", "EyeOpenIcon",
    ],
    website: "https://www.radix-ui.com/icons",
    description: "Crisp 15x15 minimalist icons designed for tight UI spaces",
  },

  "simple-icons": {
    id: "simple-icons",
    name: "Simple Icons",
    npmPackage: "simple-icons",
    cdnUrl: null,
    cdnGlobalName: null,
    iconCount: 3400,
    license: "CC0-1.0",
    importSyntax: '<img src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/{slug}.svg" alt="Brand" className="h-6 opacity-60" />',
    namingConvention: "Lowercase slugs (e.g. stripe, github, figma, openai, slack)",
    commonIcons: [
      "stripe", "github", "figma", "openai", "slack", "discord",
      "notion", "shopify", "vercel", "react", "nextdotjs",
      "tailwindcss", "typescript", "linkedin", "x", "youtube",
      "meta", "apple", "microsoft", "google", "nvidia", "adobe",
      "dropbox", "netlify", "railway", "linear", "asana",
      "docker", "kubernetes", "postgresql", "mongodb",
    ],
    website: "https://simpleicons.org",
    description: "3400+ brand and company logo icons, used via CDN for trust bars and logos",
  },
} as const;

export const ICON_PACK_IDS = Object.keys(ICON_PACKS);

export function getIconPack(id: string): IconPack | undefined {
  return ICON_PACKS[id];
}

export function getIconPacks(ids: string[]): IconPack[] {
  return ids.map((id) => ICON_PACKS[id]).filter(Boolean) as IconPack[];
}
