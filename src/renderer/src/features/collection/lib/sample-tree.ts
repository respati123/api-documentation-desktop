import type { TreeNode } from '@/features/workspace'

export const initialTree: TreeNode[] = [
  {
    id: 'example-api',
    kind: 'folder',
    name: 'Example API',
    children: [
      {
        id: 'list-users',
        kind: 'request',
        name: 'List users',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/users',
        body: '{\n  "name": ""\n}',
      },
      {
        id: 'create-user',
        kind: 'request',
        name: 'Create user',
        method: 'POST',
        url: 'https://jsonplaceholder.typicode.com/users',
        body: '{\n  "name": ""\n}',
      },
      {
        id: 'health-check',
        kind: 'request',
        name: 'Health check',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        body: '',
      },
    ],
  },
]
