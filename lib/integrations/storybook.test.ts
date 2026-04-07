import { describe, it, expect } from 'vitest'
import { parseStoryFile, matchComponents, type StoryComponentMeta } from './storybook'

// ─── parseStoryFile ─────────────────────────────────────────────────────────

describe('parseStoryFile', () => {
  describe('meta extraction', () => {
    it('extracts component name from inline default export with title', () => {
      const content = `
        export default {
          title: 'Button',
          component: Button,
        };
        export const Primary = {};
      `
      const result = parseStoryFile(content, 'components/Button.stories.tsx')
      expect(result).not.toBeNull()
      expect(result!.componentName).toBe('Button')
    })

    it('extracts last segment from path title', () => {
      const content = `
        export default {
          title: 'Components/Forms/TextInput',
          component: TextInput,
        };
      `
      const result = parseStoryFile(content, 'components/TextInput.stories.tsx')
      expect(result!.componentName).toBe('TextInput')
    })

    it('handles variable meta pattern with export default', () => {
      const content = `
        import { Button } from './Button';
        const meta = {
          title: 'UI/Button',
          component: Button,
        };
        export default meta;
        export const Primary = {};
      `
      const result = parseStoryFile(content, 'Button.stories.tsx')
      expect(result).not.toBeNull()
      expect(result!.componentName).toBe('Button')
    })

    it('handles typed Meta variable with satisfies', () => {
      const content = `
        import type { Meta } from '@storybook/react';
        import { Card } from './Card';
        const meta: Meta<typeof Card> = {
          component: Card,
        };
        export default meta;
      `
      const result = parseStoryFile(content, 'Card.stories.tsx')
      expect(result).not.toBeNull()
      expect(result!.componentName).toBe('Card')
    })

    it('falls back to component field when no title', () => {
      const content = `
        import { Avatar } from './Avatar';
        export default {
          component: Avatar,
        };
      `
      const result = parseStoryFile(content, 'Avatar.stories.tsx')
      expect(result!.componentName).toBe('Avatar')
    })

    it('returns null when no meta block found', () => {
      const content = `
        // Just a regular file
        export function helper() { return 42; }
      `
      const result = parseStoryFile(content, 'helper.ts')
      expect(result).toBeNull()
    })

    it('returns null when no component name extractable', () => {
      const content = `
        export default {
          parameters: { layout: 'fullscreen' },
        };
      `
      const result = parseStoryFile(content, 'misc.stories.tsx')
      expect(result).toBeNull()
    })
  })

  describe('component import path', () => {
    it('resolves named import path', () => {
      const content = `
        import { Button } from '../ui/Button';
        export default {
          title: 'Button',
          component: Button,
        };
      `
      const result = parseStoryFile(content, 'Button.stories.tsx')
      expect(result!.componentImportPath).toBe('../ui/Button')
    })

    it('resolves default import path', () => {
      const content = `
        import Modal from '@/components/Modal';
        export default {
          title: 'Modal',
          component: Modal,
        };
      `
      const result = parseStoryFile(content, 'Modal.stories.tsx')
      expect(result!.componentImportPath).toBe('@/components/Modal')
    })
  })

  describe('argTypes parsing', () => {
    it('extracts arg names and control types', () => {
      const content = `
        export default {
          title: 'Button',
          component: Button,
          argTypes: {
            variant: {
              control: { type: 'select' },
              options: ['primary', 'secondary', 'ghost'],
              description: 'Visual style variant',
            },
            size: {
              control: 'radio',
            },
          },
        };
      `
      const result = parseStoryFile(content, 'Button.stories.tsx')

      const variant = result!.args.find(a => a.name === 'variant')
      expect(variant).toBeDefined()
      expect(variant!.type).toBe('select')

      const size = result!.args.find(a => a.name === 'size')
      expect(size).toBeDefined()
      expect(size!.type).toBe('radio')
    })

    it('extracts options when in simple flat structure', () => {
      const content = `
        export default {
          title: 'Select',
          component: Select,
          argTypes: {
            colour: { control: 'select', options: ['red', 'blue', 'green'] },
          },
        };
      `
      const result = parseStoryFile(content, 'Select.stories.tsx')
      const colour = result!.args.find(a => a.name === 'colour')
      expect(colour).toBeDefined()
      expect(colour!.options).toEqual(['red', 'blue', 'green'])
    })
  })

  describe('args (default values)', () => {
    it('extracts default values and merges with argTypes', () => {
      const content = `
        export default {
          title: 'Button',
          component: Button,
          argTypes: {
            label: { control: 'text' },
          },
          args: {
            label: 'Click me',
            disabled: false,
          },
        };
      `
      const result = parseStoryFile(content, 'Button.stories.tsx')
      const label = result!.args.find(a => a.name === 'label')
      expect(label).toBeDefined()
      expect(label!.type).toBe('text')
      expect(label!.defaultValue).toBe('Click me')

      const disabled = result!.args.find(a => a.name === 'disabled')
      expect(disabled).toBeDefined()
      expect(disabled!.defaultValue).toBe('false')
    })
  })

  describe('named story exports', () => {
    it('extracts named exports as story names', () => {
      const content = `
        export default { title: 'Button', component: Button };
        export const Primary = { args: { variant: 'primary' } };
        export const Secondary = { args: { variant: 'secondary' } };
        export const Disabled = { args: { disabled: true } };
      `
      const result = parseStoryFile(content, 'Button.stories.tsx')
      expect(result!.stories).toEqual(['Primary', 'Secondary', 'Disabled'])
    })

    it('handles function story exports', () => {
      const content = `
        export default { title: 'Card', component: Card };
        export function WithImage() { return <Card image="test.png" />; }
        export const Simple = {};
      `
      const result = parseStoryFile(content, 'Card.stories.tsx')
      expect(result!.stories).toContain('WithImage')
      expect(result!.stories).toContain('Simple')
    })

    it('excludes default export from stories list', () => {
      const content = `
        export default { title: 'Nav', component: Nav };
        export const Basic = {};
      `
      const result = parseStoryFile(content, 'Nav.stories.tsx')
      expect(result!.stories).not.toContain('default')
    })
  })

  describe('tags', () => {
    it('extracts tags array', () => {
      const content = `
        export default {
          title: 'Button',
          component: Button,
          tags: ['autodocs', 'stable'],
        };
      `
      const result = parseStoryFile(content, 'Button.stories.tsx')
      expect(result!.tags).toEqual(['autodocs', 'stable'])
    })

    it('returns empty tags when none specified', () => {
      const content = `
        export default { title: 'Icon', component: Icon };
      `
      const result = parseStoryFile(content, 'Icon.stories.tsx')
      expect(result!.tags).toEqual([])
    })
  })

  describe('filePath', () => {
    it('passes through the provided file path', () => {
      const content = `export default { title: 'Foo', component: Foo };`
      const result = parseStoryFile(content, 'src/components/Foo.stories.tsx')
      expect(result!.filePath).toBe('src/components/Foo.stories.tsx')
    })
  })
})

// ─── matchComponents ────────────────────────────────────────────────────────

describe('matchComponents', () => {
  function makeStoryComponent(name: string): StoryComponentMeta {
    return {
      componentName: name,
      filePath: `${name}.stories.tsx`,
      args: [],
      stories: [],
      tags: [],
    }
  }

  it('returns exact match with confidence 1.0', () => {
    const stories = [makeStoryComponent('Button')]
    const dsNames = ['Button']
    const results = matchComponents(stories, dsNames)

    expect(results).toHaveLength(1)
    expect(results[0].designSystemMatch).toBe('Button')
    expect(results[0].confidence).toBe(1.0)
  })

  it('matches case-insensitively with confidence 1.0', () => {
    const stories = [makeStoryComponent('button')]
    const dsNames = ['Button']
    const results = matchComponents(stories, dsNames)

    expect(results[0].designSystemMatch).toBe('Button')
    expect(results[0].confidence).toBe(1.0)
  })

  it('matches after stripping prefix with confidence 0.8', () => {
    const stories = [makeStoryComponent('CustomButton')]
    const dsNames = ['Button']
    const results = matchComponents(stories, dsNames)

    expect(results[0].designSystemMatch).toBe('Button')
    expect(results[0].confidence).toBe(0.8)
  })

  it('strips prefix from design system name too', () => {
    const stories = [makeStoryComponent('Button')]
    const dsNames = ['AppButton']
    const results = matchComponents(stories, dsNames)

    expect(results[0].designSystemMatch).toBe('AppButton')
    expect(results[0].confidence).toBe(0.8)
  })

  it('returns substring match with confidence 0.5', () => {
    const stories = [makeStoryComponent('NavButton')]
    const dsNames = ['Button']
    const results = matchComponents(stories, dsNames)

    expect(results[0].designSystemMatch).toBe('Button')
    expect(results[0].confidence).toBe(0.5)
  })

  it('returns null match with confidence 0 when no match', () => {
    const stories = [makeStoryComponent('Sidebar')]
    const dsNames = ['Button', 'Card', 'Input']
    const results = matchComponents(stories, dsNames)

    expect(results[0].designSystemMatch).toBeNull()
    expect(results[0].confidence).toBe(0)
  })

  it('handles empty story components array', () => {
    const results = matchComponents([], ['Button'])
    expect(results).toEqual([])
  })

  it('handles empty design system names', () => {
    const stories = [makeStoryComponent('Button')]
    const results = matchComponents(stories, [])

    expect(results).toHaveLength(1)
    expect(results[0].designSystemMatch).toBeNull()
    expect(results[0].confidence).toBe(0)
  })

  it('prefers exact match over prefix match', () => {
    const stories = [makeStoryComponent('Button')]
    const dsNames = ['Button', 'CustomButton']
    const results = matchComponents(stories, dsNames)

    expect(results[0].designSystemMatch).toBe('Button')
    expect(results[0].confidence).toBe(1.0)
  })

  it('matches multiple story components independently', () => {
    const stories = [
      makeStoryComponent('Button'),
      makeStoryComponent('Card'),
      makeStoryComponent('Zebra'),
    ]
    const dsNames = ['Button', 'Card']
    const results = matchComponents(stories, dsNames)

    expect(results[0].designSystemMatch).toBe('Button')
    expect(results[0].confidence).toBe(1.0)
    expect(results[1].designSystemMatch).toBe('Card')
    expect(results[1].confidence).toBe(1.0)
    expect(results[2].designSystemMatch).toBeNull()
    expect(results[2].confidence).toBe(0)
  })
})
