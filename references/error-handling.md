# Error handling

Read this when you handle a failed request, add an error state, or add an error boundary.

## API errors: use the backend's response

- The backend always returns JSON with an `error` string and the HTTP status. Some responses also include `details`.
- Show the `error` string from the response. Do not write your own text for an API failure.
- The shared `apiCall` throws an `ApiError` with the backend's `error` text as the message, plus `status`, `code`, `requestId`, and `details`. Branch on `code` when the UI must react to a specific error. Show `message`. Do not parse the response again.
- The session ends only on a `401`. Other failures keep the session, so a server error does not sign the user out.
- Do not add a catch block that replaces the backend message with a generic one. If a request has no useful message, show the generic error state from the shared component, not a made-up sentence.
- Do not invent error codes on the client.

Status codes that need special handling:

| Status | Meaning | What the app does |
|---|---|---|
| 401 | session expired or invalid | the auth ViewModel clears the session and returns to sign-in |
| 403 | role does not allow the action | show the backend message next to the control |
| 404 | workspace or resource not found, or no access | show the "unavailable" view state |
| 409 | conflict, such as a remote change or an already-latest version | show the backend message and refresh the data |
| 429 | rate limited | show the backend message and disable the submit button until the user tries again |
| 5xx | server failure | show the error state with retry |

## Where errors go

- **Queries and mutations**: the ViewModel reads `status` and `error` and returns a message, as in `data-and-state.md`. The View shows it.
- **Forms**: the ViewModel keeps the field-level and form-level message. The View renders it next to the form.
- **Toasts**: for short results of an action, such as "role updated". The ViewModel triggers them.
- **Render errors** (a bug in a View): caught by an error boundary, not by the ViewModel.

## Error boundaries

Every route has an error boundary. Each feature page may also have a smaller boundary around one section, so one broken section does not blank the whole page.

- Use `react-error-boundary` (`ErrorBoundary`).
- Wrap the boundary in `QueryErrorResetBoundary` so the "Try again" button also resets failed queries.
- Put the wrapper in `shared/errors/error-boundary.tsx`. Put the fallback UI in `shared/errors/` too, built from shadcn `Alert` and `Button`.
- The route-level boundary goes in `app/`, around each page's outlet.
- Boundaries catch render errors only. Errors from event handlers and async code must be caught in the ViewModel and shown as state.
- Log the error with `console.error` in development. Do not show the stack trace to users.

The fallback shows a short message, a "Try again" button, and a link back to the workspace list. Both messages come from `i18n` (see `i18n.md`).

## Not-found and access states

- A route that does not match any feature shows a not-found page.
- A workspace the user cannot access shows the "unavailable" state, not the error boundary. The request returned a normal response, so it is not a crash.

## Checklist for a new error state

1. The ViewModel exposes `status` and the backend message.
2. The View renders the error state with a `data-testid` and a retry action.
3. Retry calls the query's `refetch` through the ViewModel.
4. The text comes from the backend or from `i18n`. Nothing is hard-coded.
