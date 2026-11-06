import type { ReactElement, ReactNode } from 'react'
import { type InlineNode, type MarkdownBlock, parseMarkdown } from '@/shared/lib/markdown'
import { ScrollArea, Separator } from '@/shared/ui'
import { cn } from '@/shared/utils/cn'

export type MarkdownViewProps = {
  source: string
  className?: string
  testId?: string
}

// A parsed document is static until its source changes, and its children keep their order, so their position is a stable key.

const headingClass: Record<number, string> = {
  1: 'text-[18px] font-bold text-foreground',
  2: 'text-[16px] font-bold text-foreground',
  3: 'mt-1.5 text-[14px] font-bold text-foreground',
  4: 'text-[13px] font-semibold text-foreground',
  5: 'text-[13px] font-medium text-foreground',
  6: 'text-[13px] font-medium text-muted-foreground',
}

function renderInlineNode(node: InlineNode, key: number): ReactNode {
  switch (node.kind) {
    case 'text':
      return <span key={key}>{node.text}</span>
    case 'code':
      return (
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">
          {node.text}
        </code>
      )
    case 'strong':
      return (
        <strong key={key} className="font-semibold text-foreground">
          {renderInline(node.children)}
        </strong>
      )
    case 'em':
      return <em key={key}>{renderInline(node.children)}</em>
    case 'link':
      // Shown as text with its address on hover. Documents do not open links on their own.
      return (
        <span key={key} title={node.href} className="text-primary underline underline-offset-2">
          {renderInline(node.children)}
        </span>
      )
  }
}

function renderInline(nodes: InlineNode[]): ReactNode[] {
  return nodes.map((node, index) => renderInlineNode(node, index))
}

function renderBlock(block: MarkdownBlock, key: number): ReactElement {
  switch (block.kind) {
    case 'heading': {
      const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return (
        <Tag key={key} className={headingClass[block.level]}>
          {renderInline(block.children)}
        </Tag>
      )
    }
    case 'paragraph':
      return (
        <p key={key} className="leading-relaxed text-foreground/90">
          {renderInline(block.children)}
        </p>
      )
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul'
      return (
        <ListTag
          key={key}
          className={cn('grid gap-1 pl-5 leading-relaxed text-foreground/90', block.ordered ? 'list-decimal' : 'list-disc')}
        >
          {block.items.map((item, itemIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the parsed items are static and keep their order
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ListTag>
      )
    }
    case 'code':
      return (
        <div key={key} className="grid gap-1">
          {block.language && <p className="text-xs text-muted-foreground">{block.language}</p>}
          <ScrollArea type="auto" className="rounded-md border border-border bg-muted">
            <pre className="p-3 font-mono text-xs leading-relaxed text-foreground">{block.text}</pre>
          </ScrollArea>
        </div>
      )
    case 'quote':
      return (
        <blockquote key={key} className="border-l border-border pl-3 text-muted-foreground">
          {renderInline(block.children)}
        </blockquote>
      )
    case 'rule':
      return <Separator key={key} />
  }
}

// Shows a markdown document as readable text. The source is never run as HTML.
export function MarkdownView({ source, className, testId }: MarkdownViewProps): ReactElement {
  const blocks = parseMarkdown(source)
  return (
    <div data-testid={testId} className={cn('grid min-w-0 content-start gap-3 text-sm', className)}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  )
}
