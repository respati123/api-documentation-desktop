import type { ApiNode } from '@/shared/models/api-node.model'

// A collection is a top-level node of the workspace tree. Its id is the collection key that branches are stored under.
export function collectionKeys(tree: ApiNode[]): string[] {
  return tree.map((node) => node.id)
}

// The top-level node of one collection, as a one-node tree. Empty when the collection is not in the tree.
export function collectionOf(tree: ApiNode[], key: string): ApiNode[] {
  return tree.filter((node) => node.id === key)
}

// Puts a collection's content into the workspace tree. The node keeps its place. A collection that is not in the tree is added at the end.
// An empty content removes the collection.
export function replaceCollection(tree: ApiNode[], key: string, content: ApiNode[]): ApiNode[] {
  const index = tree.findIndex((node) => node.id === key)
  if (content.length === 0) return tree.filter((node) => node.id !== key)
  if (index === -1) return [...tree, ...content]
  return tree.map((node) => (node.id === key ? content[0] : node))
}
