---
name: api-documentation
description: Use the api-documentation MCP server to inspect and maintain API Documentation desktop workspaces, collections, requests, environments, and variables for frontend integration.
---

# API Documentation Workflow

The `api-documentation` MCP server reads and writes the same local database as the desktop app. Tool names are `mcp__api-documentation__<name>`, with dots in command ids written as underscores (for example `request.create` is `request_create`). Legacy names still work: `list_workspaces`, `get_collection_tree`, `search_requests`, `get_request`, `preview_changes`, `apply_changes`.

## Start

- Call `list_commands` once to confirm the parameters of the command you need.
- Call `workspace_list` to find the target workspace. Ask if more than one could match.
- Call `tree_get` or `request_search` before creating anything, so an existing request is updated rather than duplicated.

## Documentation standard

Include every applicable item when its facts are available. Leave out an item that does not apply, and never add placeholder rows to fill the list.

- **Identity:** a clear request name, HTTP method, and route.
- **Parameters:** path parameters, query parameters with known values and descriptions, and whether each is required. Keep URL query text and `params` in sync.
- **Headers:** endpoint-specific required or useful headers with descriptions. Do not add transport headers, and do not duplicate a content type that the body mode already sets.
- **Body:** for a request with a payload, the body mode, content type, and a representative body or fields. Use `bodyMode: "none"` when there is no body.
- **Auth:** the known auth type and inheritance. Never write a real credential.
- **Variables:** `{{baseUrl}}`, `{{apiPrefix}}`, and similar references for values that change between environments. Keep fixed endpoint data literal.
- **Responses:** each known success and relevant error status, with description, content type, schema, and an example when known. Use an empty content list for a response with no body.
- **Documentation:** purpose, behavior, validation rules, side effects, and integration notes that the fields above do not cover.

Verify facts before writing them. Read the project source, OpenAPI specs, or existing examples first. Ask the user for route, auth, body shape, or response contract when they cannot be verified. Never invent parameters, headers, schemas, status codes, or example values. If the user asks for a draft with unknown details, record only verified facts, and list each gap in `documentation` and in the preview summary.

## Secrets and variables

- Put `{{accessToken}}` or another reference in a request only where a credential is required. Never write the real value into a request, example, or documentation.
- Tell the user to mark the variable as **Secret** in the desktop Variables UI. Secret values stay on the device and out of cloud sync.
- The server cannot list, create, or change variable definitions or values, except that `variable.set` can create one. A secret variable is always created empty, and its value is entered in the app. Do not claim a referenced variable exists, and do not invent its value. Name each variable the user still needs to define.

## Changing collections

- Use `changes_preview` before every change to a collection: create, update, move, rename, deprecate, or delete. It accepts `create_folder`, `create_request`, `update_request`, `rename_folder`, `move_node`, `deprecate_request`, and `delete_node`.
- Show the preview in chat before applying. Include the workspace name, the full folder path of each item, each action, and the target. For a request, show method, URL, params, headers, auth type, body mode and body, responses, and documentation. For an edit, show each changed field as before → after. For a move or rename, show old → new. For a deletion, name the exact item and, for a folder, count every nested item that will be removed. Name the variables the user still has to define. Redact secret values, and never paste raw tool JSON as the only preview.
- End with a request for approval of that exact preview, then stop. A request to make a change is not approval. Call `changes_apply` only after the user approves the displayed preview. `changes_apply` refuses a preview whose workspace has changed since, so re-preview after any change.
- Destructive commands (`*_delete`) need `confirm: true`. Set it only after the user explicitly asks for that deletion.
- Environment and variable commands have no preview step. Show the intended change in chat and get approval before running them.
- Mark a deprecated endpoint with `request_deprecate` (through `changes_preview` when it is a collection change), include the user's reason, and name a replacement when one is known.

## Limits to tell the user about

- Cloud workspaces are read from the MCP server, but not created, renamed, or deleted there. Cloud copies also refuse edits, because an edit would stay unpushed. Make those changes in the desktop app and push from there.
- Only the active account's workspaces are visible. Workspaces that predate accounts are visible to everyone on the device.
- Viewer workspaces refuse writes.
- `request_send` sends JSON, text, XML, YAML, GraphQL, and urlencoded bodies with bearer, basic, or API-key auth. Multipart and file bodies must be sent from the app. Path parameters are not substituted yet. Confirm the target URL before sending, since a send reaches a real server.
- The app must be open to see changes. Keep the app idle while the server writes, and check the workspace again after an apply.
- Commit and push are the user's job unless they explicitly ask for them.
