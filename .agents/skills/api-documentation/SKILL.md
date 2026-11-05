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
- **Scripts:** a `preScript` or `postScript` only when the request needs setup before the send, or checks after the response. Say in the documentation what each script does and why. Never write a real secret in a script, and read a secret only through `apidocs.vars.get`.

Verify facts before writing them. Read the project source, OpenAPI specs, or existing examples first. Ask the user for route, auth, body shape, or response contract when they cannot be verified. Never invent parameters, headers, schemas, status codes, or example values. If the user asks for a draft with unknown details, record only verified facts, and list each gap in `documentation` and in the preview summary.

## Secrets and variables

- Put `{{accessToken}}` or another reference in a request only where a credential is required. Never write the real value into a request, example, or documentation.
- Tell the user to mark the variable as **Secret** in the desktop Variables UI. Secret values stay on the device and out of cloud sync.
- Variables are written with a read-first routine, so the server never overwrites a value it has not seen:
  1. Call `variable_get` with the scope, environment id when the scope is `environment`, and the name. It returns the value, or `<secret>` for a secret, and a `revision`. `exists: false` means there is nothing to overwrite.
  2. Show the change in chat: scope, environment, name, and before → after. For a secret, say the value is set in the desktop app. Then wait for approval. Approval of a request to change a value is not given until the user has seen this exact change.
  3. Call `variable_set` with the same fields and `expectedRevision` set to the revision from step 1, or `null` for a new variable. If the server answers "changed since you read it", stop, read the variable again, and show the new state before trying again.
  4. `variable_delete` follows the same routine, and also needs `confirm: true` after the user explicitly asks for the deletion.
- A secret variable is created empty. Its value is entered in the desktop app, and the server cannot set or change it. Do not claim a referenced variable exists or invent its value. Name each variable the user still needs to define.

## Changing collections

- Use `changes_preview` before every change to a collection: create, update, move, rename, deprecate, or delete. It accepts `create_folder`, `create_request`, `update_request`, `rename_folder`, `move_node`, `deprecate_request`, and `delete_node`.
- Show the preview in chat before applying. Include the workspace name, the full folder path of each item, each action, and the target. For a request, show method, URL, params, headers, auth type, body mode and body, responses, documentation, and the pre-request and post-response scripts. For an edit, show each changed field as before → after. For a move or rename, show old → new. For a deletion, name the exact item and, for a folder, count every nested item that will be removed. Name the variables the user still has to define. Redact secret values, and never paste raw tool JSON as the only preview.
- End with a request for approval of that exact preview, then stop. A request to make a change is not approval. Call `changes_apply` only after the user approves the displayed preview. `changes_apply` refuses a preview whose workspace has changed since, so re-preview after any change.
- Deleting a folder or request is a collection change: put `delete_node` in `changes_preview`, then `changes_apply`. Deleting an environment or a variable uses `environment_delete` or `variable_delete`, which need `confirm: true`. Set it only after the user explicitly asks for that deletion.
- Environment and variable commands have no preview step. Show the intended change in chat and get approval before running them.
- Mark a deprecated endpoint with a `deprecate_request` operation in `changes_preview`, include the user's reason, and name a replacement when one is known.
- The MCP server does not expose direct collection writes such as `request_create`, `request_update`, `folder_create`, or `node_move`. Those exist only in the CLI. Every collection change goes through `changes_preview` and then `changes_apply`.

## Limits to tell the user about

- Cloud workspaces are read from the MCP server, but not created, renamed, or deleted there. Cloud copies also refuse edits, because an edit would stay unpushed. Make those changes in the desktop app and push from there.
- Only the active account's workspaces are visible. Workspaces that predate accounts are visible to everyone on the device.
- Viewer workspaces refuse writes.
- `request_send` sends JSON, text, XML, YAML, GraphQL, and urlencoded bodies with bearer, basic, or API-key auth. Multipart and file bodies must be sent from the app. Path parameters are not substituted yet.
- Scripts run only in the desktop app. The MCP server stores `preScript` and `postScript` but never runs them, and `request_send` does not run them either. When the user expects a script to run, say that it runs only when the request is sent from the app.

Sending reaches a real server, so it takes two steps. First call `request_send` with `dryRun: true`. It returns the URL the request would call, with secret query values removed. Show that URL to the user and wait for approval. Then call `request_send` with `confirmUrl` set to exactly that URL. The server refuses the send if the URL has changed since the dry run. Without `dryRun` or `confirmUrl`, the MCP server refuses to send.
- The app must be open to see changes. Keep the app idle while the server writes, and check the workspace again after an apply.
- Commit and push are the user's job unless they explicitly ask for them.
