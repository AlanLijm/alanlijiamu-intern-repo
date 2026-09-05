# API Debugging with Bruno

## What Bruno is, and how it differs from Postman / cURL

The biggest difference: Bruno doesn't need a login/account. Collections
are stored as plain files in a local folder on your own machine (e.g.
`C:\Users\...\bruno\cats-demo`), not synced to a cloud account like
Postman. Same request-testing experience, but no account required to use
or store anything.

## How to send an authenticated request in Bruno

1. Open the request, go to the **Auth** tab.
2. Change the type from **No Auth** to **Bearer Token**.
3. Paste the token into the token field.
4. Send.

One gotcha I ran into: after setting the token this way, the **Headers**
tab still looked empty — the Auth tab config doesn't show up there as a
row. To actually confirm the token was being sent, I used **Generate
Code** (the `</>` icon), which showed the real `curl` command — that's
where I could see `Authorization: Bearer ...` in the final request.

I tested this against a real protected endpoint (`DELETE /cats/:id`) with
a token that only had the `delete:cats` permission, and it succeeded
(200) — confirming the header was actually being checked server-side.

## Advantages of organizing requests into collections

Having them saved in a collection means there's a history — I can come
back and reuse or look at a request later instead of rebuilding it (URL,
auth, everything) from scratch every time. Since it's stored as local
files, it can also be committed to the repo, so the same saved requests
are available to teammates or to future-me without re-explaining how to
test each endpoint.

## How I'd structure a Bruno collection for a NestJS backend project

By resource/module, not by HTTP method. My `CatsController` already
handles GET/POST/DELETE all in one place for the `cats` resource, so the
Bruno collection should mirror that: one folder per resource (e.g.
`cats/`) containing all its requests (Get All Cats, Get Cat by ID, Create
Cat, Delete Cat), rather than splitting into separate `get/` `post/`
`delete/` folders. That way, testing a given part of the API means going
to one folder, not jumping between three.