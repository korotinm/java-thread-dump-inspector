# Thread Dump Inspector

Reads jstack-style Java thread dumps and points at what is wrong. One HTML file, parsed in the
browser, never uploaded.

**[Open Thread Dump Inspector](https://korotinm.github.io/java-thread-dump-inspector/)**

- No upload, no backend, no analytics, no external request — not even a font. Works offline.
- Reads `"name" - Thread t@N` and `"name" #N ... tid=0x... nid=0x...`.
- Tabs: Findings, Pools, Population, Top frame, States, Creation order, Locks, Stack search, Compare.

## Findings

Most checks are generic: a pool with every worker busy, threads piling up in one frame, several
waiters on one lock, a deadlock the JVM reported itself.

Checks that match frames of a specific library carry a `signature:` badge, so a library-specific
guess never reads as a universal truth. Only HikariCP ships built in; narrower ones live in
[`rules/`](rules) and are pasted in when you need them.

## Custom rules

Anything specific to your stack can be added without touching the source: **Findings → Custom
rules → + New rule**. Rules live in `localStorage` — your browser only, never sent anywhere.

Ready-made ones live in [`rules/`](rules) — paste a file into the form to use it. Nothing is loaded
automatically, so the inspector stays a single file that works offline.

The same reference below is built into the rule editor, collapsed under *How to write a rule*.

## Writing a rule

What you write is the **body** of `function (d, helpers)` — no wrapper, just the statements,
ending in a `return`. Return one finding object or an array of them. Return nothing, `null` or
`[]` when the dump does not match; that is how a rule stays quiet.

```js
// Threads blocked inside our own code, and what most of them are doing
var mine = d.threads.filter(function (t) {
  return t.state === "BLOCKED" && t.top.indexOf("com.acme.") === 0;
});
if (mine.length < 5) return [];

var top = sortedGroups(groupBy(mine, function (t) { return t.top; }))[0];
return [{
  level: "alert",
  title: nThreads(mine.length) + " blocked in application code",
  text: "Most of them in " + top.key + ".",
  items: mine
}];
```

### What to return

| Field | |
|:--|:--|
| `title` | Required. Headline of the card. |
| `text` | Optional. The explanation under it — say what to do next, not just what was found. |
| `level` | Optional. `"alert"` (red, Action) or `"warn"` (yellow, Check). Default `"warn"`. |
| `items` | Optional. Array of threads. Adds the *Show threads* button with their stacks. |

### `d` — the loaded dump

| Field | |
|:--|:--|
| `d.threads` | Array of every thread in the dump. Fields below. |
| `d.byState` | Counts per state: `{ RUNNABLE: 12, BLOCKED: 3, … }`. |
| `d.deadlock` | The JVM's own deadlock report as text, or `null` if it printed none. |

### `t` — one thread

| Field | |
|:--|:--|
| `t.name` | Name exactly as the dump spells it. |
| `t.norm` | Name with instance numbers collapsed to `N`. Use this to group siblings, `name` to match one specific thread. |
| `t.state` | `RUNNABLE`, `BLOCKED`, `WAITING`, `TIMED_WAITING`, `NEW`, `TERMINATED`, or `UNKNOWN` when the dump did not say. Careful: RUNNABLE in a native call means idle, not busy. |
| `t.top` | Topmost frame as a string — what the thread is doing right now. `"(no stack)"` if the dump gave no frames. |
| `t.frames` | All frames, top first. `t.frames.join("\n")` to regex the whole stack. |
| `t.waitsFor` | `{ name, id, lock }` of the thread holding the lock this one waits on, or `null`. Resolved for both monitors and j.u.c. locks. |
| `t.waitingOn` | Id of the lock it is waiting for, or `null`. |
| `t.locksHeld` | Ids of the locks it currently owns. |
| `t.id` | Thread id (`t@N` / `#N`), or `null` if absent. |
| `t.raw` | The thread's original dump lines, unparsed. |

### `helpers` — the same building blocks the built-in checks use

Callable by bare name, or as `helpers.groupBy(…)` — whichever you prefer.

| Helper | |
|:--|:--|
| `groupBy(arr, fn)` | → `{ key: [items] }`, keyed by whatever `fn` returns. |
| `sortedGroups(map)` | → `[{ key, items }]`, biggest group first. Feed it a `groupBy` result. |
| `pools(d)` | → `[{ name, items, busy, ratio }]` — the groups behind the Pools tab. `ratio` is 1 when every worker is busy. |
| `poolOf(t)` | → the group name for a thread (its `norm`). |
| `isIdleWorker(t)` | → `true` for a worker parked on its task queue or an event loop — waiting for work, not doing it. |
| `nThreads(n)` | → `"1 thread"` / `"5 threads"`. For titles. |

### Limits

Code runs synchronously — `await` and `fetch` will not work. Only Dump A is visible, not the
comparison dump.

A syntax error is caught when you press Save, and the rule is not stored. Anything that throws at
runtime becomes its own finding card with the message, so a broken rule never takes down the tab.
Note that only syntax is checked on Save: `blocked.nThreads(…)` parses fine and fails at run time,
like any other JavaScript.

## Contributing a rule

A heuristic that was never run against a real dump is a guess. Before opening a PR:

- **Test on two dumps** — one where the rule fires, one where it must stay silent. The silent one
  matters more: after a few false alarms people stop reading the whole tab.
- **Attach them.** Parsing and name normalization change; without its input, nobody can tell
  whether a rule still works.
- **Scrub or synthesize first.** Dumps leak tenant ids, hostnames, IPs, queue names, paths. A
  hand-written minimal dump is best — smaller, better test, leaks nothing. If you cannot sanitize
  a real one, describe it in the PR instead; a leak cannot be undone.
- **Write `text` as advice, not observation** — the next move, and what it looks like when the
  rule is wrong.
- **Say what it ignores on purpose.** Reviewers cannot infer that from the code, and it rots first.

## License

[MIT](LICENSE)
