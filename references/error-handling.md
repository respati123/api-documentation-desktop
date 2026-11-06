# Error handling

Read this when you handle a failed request, add an error state, or add an error boundary.

## API errors

- The cloud API returns JSON with an `error` string and the HTTP status, sometimes with `details`.
- `apiCall` (`@/shared/services/api-client`) throws an `ApiError` whose `message` is the backend `error` text, plus `status`, `code`, `requestId`, and `details`.
- Show `message` as received. Branch on `code` or `status` only when the UI must react differently.
- Never replace the backend message with your own text, and never invent error codes. If there is no useful message, show the shared generic error state.
- The session ends only on `401`.

| Status | What the app does |
|---|---|
| 401 | clear the session and return to sign-in |
| 403 | show the backend message next to the control |
| 404 | show the "unavailable" state |
| 409 | show the backend message and refetch the data |
| 429 | show the backend message and disable the submit until the user tries again |
| 5xx | show the error state with retry |

## Where errors go

- **Queries and mutations**: the ViewModel returns `status` and `errorMessage`. The View renders them.
- **Forms**: the ViewModel holds field and form messages.
- **Toasts**: short action results. The ViewModel triggers them.
- **Main process (IPC)**: the service turns a failed IPC result into a thrown error with the main process message. The ViewModel handles it like an API error.
- **Render errors**: caught by an error boundary.

## Error boundaries

- Use `react-error-boundary`, wrapped in `QueryErrorResetBoundary` so "Try again" also resets failed queries.
- The wrapper and fallback live in `shared/errors/`. The fallback uses the library `Alert` and `Button`, and its text comes from i18n.
- Every page is wrapped at the app level in `app/`. A page may add a smaller boundary around one section.
- Boundaries catch render errors only. Async and handler errors are caught in the ViewModel.
- `console.error` in development only. Never show a stack trace.

## Not-found and access

- An unknown route shows the not-found page.
- A workspace the user cannot access shows the "unavailable" state, not the error boundary.

## Checklist

1. The ViewModel exposes `status`, `errorMessage`, and `onRetry`.
2. The View renders the error state with a `data-testid` and a retry button.
3. All text comes from the backend or from i18n.
