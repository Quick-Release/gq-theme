## Sessions and orchestration

Sessions run inside T3 Code. A session started from this repository edits
this repository only. Work for any other repository runs in a new T3 session
on that repository, in a dedicated worktree of it; this session starts
nothing in the other checkout itself. Claude and Codex can always act as
orchestrators: launch that session with `t3_thread_launch` (a `worktree`
`workspaceStrategy` on the other repository's project), then follow it with
`t3_thread_wait` / `t3_thread_read` and report its outcome.
