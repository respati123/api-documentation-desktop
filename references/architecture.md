# Frontend architecture

Read this when you create a feature, move code between layers, or decide where a file belongs.

## Layers

| Layer | Responsibility | File suffix | May import |
|---|---|---|---|
| Model | Types, interfaces, enums, constants | `*.model.ts` | nothing from React or other layers |
| Service | HTTP calls and data transformation | `*.service.ts` | `@/shared/services/api-client`, models |
| ViewModel | All process logic for one view: queries, mutations, handlers, state, derived values | `*.viewmodel.ts` | services, models, stores, i18n |
| View | Render only. Props in, callbacks out | `*.view.tsx` | models, components, props |
| Store | Client-only UI state shared by several components | `*.store.ts` | models |
| Page | Route entry. Calls one ViewModel and renders one View | `*.page.tsx` | `@/features/<name>` index, views |

Rules:

- **Views render. Nothing else.** A View has no `if` branches that decide business state, no `useQuery`, no `useMutation`, no `useState` for process state, no `fetch`, no service calls, and no event logic beyond calling a prop.
- **Pages have no logic.** A Page reads route params, calls its ViewModel, and renders its View. Nothing else.
- **ViewModels own the process.** Anything that is a process goes in the ViewModel: fetching, mutations, handlers, loading and error state, form state, derived lists, and the choice of what to show.
- **Services call the API only.** No React imports and no hooks.
- **Models import nothing** from React or from other layers.

A View receives a ready-to-render shape from its ViewModel. If a View needs a condition like `isOwner && !memberIsOwner`, compute it in the ViewModel and pass a boolean.

## Imports: absolute paths only

Every import uses the `@/` alias, which points to `src/`. This applies inside a feature too.

```ts
// correct
import { teamService } from '@/features/team/services/team.service'
import { Button } from '@/shared/components/ui/button'

// wrong
import { teamService } from '../services/team.service'
import { Button } from './ui/button'
```

The alias is set in `tsconfig.json` (`paths`) and in `vite.config.ts` (`resolve.alias`). Keep both in sync when you change it.

Other features still import only from `@/features/<name>` (the index file), never from an internal path.

## Folder layout

```
src/
├── app/                      App shell, providers, router, error boundary wiring
│   ├── app.tsx
│   ├── providers.tsx         QueryClientProvider, i18n, ThemeProvider, Toaster
│   └── router.tsx
├── features/                 One folder per domain
│   ├── auth/
│   ├── desktop-login/
│   ├── workspaces/           list, create, overview
│   ├── endpoint-docs/        collection tree and endpoint documentation
│   ├── activity/             commit history, diff, restore
│   ├── team/                 members, invitations
│   └── workspace-settings/   rename, delete
└── shared/
    ├── components/
    │   ├── ui/               shadcn/ui components, generated, do not hand-edit
    │   ├── atoms/
    │   ├── molecules/
    │   ├── organisms/
    │   └── templates/
    ├── errors/               error boundary and API error helpers
    ├── hooks/                generic hooks only
    ├── i18n/                 config and locale files
    ├── services/             api-client.ts
    ├── stores/
    ├── models/               types used by two or more features
    └── utils/                pure helpers
```

A feature contains only what it needs:

```
features/team/
├── index.ts                  public API: pages and needed types only
├── models/team.model.ts
├── services/team.service.ts
├── viewmodels/use-team.viewmodel.ts
├── stores/                   only if the feature needs shared UI state
├── components/               feature-only components
├── views/team.view.tsx
└── pages/team.page.tsx
```

## Where types go

Every type has exactly one owner. Pick the location by who uses it:

| Kind of type | Location | Example |
|---|---|---|
| Domain type used by two or more features | `shared/models/<name>.model.ts` | `workspace.model.ts` (`WorkspaceRole`, `CloudWorkspaceRef`), `api-tree.model.ts` (`ApiNode`, `RequestNode`), `commit.model.ts` (`CloudCommit`), `user.model.ts` (`CloudUser`) |
| Response or input used by one feature | `features/<name>/models/<name>.model.ts` | `auth.model.ts` (`AuthSession`, `AuthMode`) |
| Props of a view | Exported from the view file, next to the component | `AuthViewProps` in `auth.view.tsx` |
| Zod schema and the type inferred from it | The same model file as the type | `authSessionSchema` and `AuthSession` |

Rules:

- **One definition per type.** If two files describe the same shape (for example `CloudUser` and `AuthUser`), keep one and import it everywhere.
- **Feature code imports shared domain types from `@/shared/models/...`.** It never imports a model file from another feature.
- **A type moves to `shared/models` when a second feature needs it.** Move it in the same change that adds the second use.
- **No types defined inline inside components**, except the props interface of that component.
- **The legacy `src/types.ts` is split by owner during migration.** Each part moves to `shared/models` (domain) or to the feature that owns it, and the file is deleted when empty.

## Naming

- Files are kebab-case with the layer suffix: `team.view.tsx`, `use-team.viewmodel.ts`, `team.service.ts`.
- File, folder, and identifier names are English, even when the UI text is Indonesian. See `code-quality.md`.
- Components are PascalCase: `export const TeamView = ...`.
- Hooks start with `use`.
- Query key factories are named `[domain]Keys`, for example `teamKeys`.
- When a feature is migrated, rename its old PascalCase files (such as `ActivityView.tsx`) to the suffixed kebab-case name.

## Feature boundaries

- Other features and pages import from `@/features/<name>` only. Never import an internal path from outside the feature.
- A feature may import from `shared/`. A feature must not import from another feature.
- Put a component in `shared/components/` only when two or more features use it. Otherwise it stays in its feature.
- Atoms import no other components. Molecules import atoms. Organisms import atoms and molecules. Templates handle layout only and never fetch data.

## Pages

```tsx
export const TeamPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const vm = useTeamViewModel(workspaceId)
  return <TeamView {...vm} />
}
```

Keep the View's props typed explicitly. Do not spread untyped objects into props.

## Views

A View receives typed props and returns JSX. Example shape:

```tsx
interface TeamViewProps {
  members: TeamMemberRow[]
  isLoading: boolean
  canManage: boolean
  onRemove: (memberId: string) => void
}

export const TeamView = ({ members, isLoading, canManage, onRemove }: TeamViewProps) => (
  <section data-testid="team-view-container">
    {isLoading ? <TeamSkeleton /> : members.map((row) => (
      <MemberRow key={row.id} row={row} canManage={canManage} onRemove={onRemove} />
    ))}
  </section>
)
```

`TeamMemberRow` already contains the labels and flags the View needs, so the View does not decide them.
