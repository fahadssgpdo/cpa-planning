---
name: Windows self-hosted deploy hangs on pnpm install
description: Why a Windows self-hosted GitHub Actions deploy step can silently hang for hours on `pnpm install`, and the general fix pattern.
---

## The failure mode
On a Windows self-hosted GitHub Actions runner, PowerShell's native call operator (`& pnpm ...`) blocks with no timeout of its own. If GitHub Actions cancels or times out the job, it can only signal the top-level shell process — the actual `cmd.exe` -> `pnpm.cmd` -> `node.exe` tree it spawned does not receive that signal. `cmd.exe` in particular drops into an interactive `Terminate batch job (Y/N)?` prompt that nothing ever answers, so the process (and any lock it holds, e.g. on pnpm's shared local package store) is left running indefinitely. The *next* deploy's `pnpm install --offline` then blocks forever waiting on a lock that a live orphaned process keeps renewing, so it never goes stale on its own — this is what produces multi-hour "silent hang then still-broken rollback" incidents.

**Why the script's own rollback (`catch { Restore-PreviousRelease }`) didn't help:** a hard external cancellation from GitHub Actions' job timeout isn't a normal thrown PowerShell error, so a `try/catch` around the deploy logic never runs at all — the deploy is left half-applied (old `node_modules` deleted, service stopped) until someone intervenes by hand.

## The fix pattern
- Run the risky native command via `Start-Process -PassThru` (routed through `cmd.exe /c` for `.cmd` shims like pnpm on Windows) instead of the `&` call operator, so you hold a real `Process` handle.
- Bound the wait with `$process.WaitForExit($timeoutMs)`; on timeout, kill the whole process tree with `taskkill /PID <id> /T /F` (not `Stop-Process`, which only kills the one process you have a handle to, not its children) and throw a normal catchable error.
- Sweep for leftover processes from a previous, improperly terminated run at the *start* of the next deploy (e.g. via `Get-CimInstance Win32_Process` filtered by command line), since a hang can leave orphans even with the above fix in place for future runs.
- Set `timeout-minutes` on the risky job/step as a backstop, well above the script's own internal timeouts, so GitHub Actions' default ~6 hour job timeout is never the thing that notices.
- Validated the whole approach (timeout fires, catchable error thrown, process actually killed) using cross-platform PowerShell (`pwsh`, installable via `nix-shell -p powershell` in a Linux sandbox) with `sleep`/`kill` standing in for the Windows-only `pnpm`/`taskkill` calls — useful when you don't have direct access to the real Windows self-hosted runner to test against.
