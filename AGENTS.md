## Scope

This repository is gq-theme, the placeholder WordPress theme GETQUICK headless
sites install; a site's pages render in its Frontend, never here. Which
repository owns what:
[gq-platform ADR 0001](https://github.com/Quick-Release/gq-platform/blob/main/docs/adr/0001-ownership-of-work-across-getquick-repositories.md).

## Sessions and orchestration

Sessions run inside T3 Code. A session started from this repository edits
this repository only. Work for any other repository runs in a new T3 session
on that repository, in a dedicated worktree of it; this session starts
nothing in the other checkout itself. Claude and Codex can always act as
orchestrators: launch that session with `t3_thread_launch` (a `worktree`
`workspaceStrategy` on the other repository's project), then follow it with
`t3_thread_wait` / `t3_thread_read` and report its outcome.
