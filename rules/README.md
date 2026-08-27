# Rules

Detection rules that are too stack-specific to ship inside the inspector. Copy one in when you
need it.

## Using a rule

1. Open a dump in the [inspector](https://korotinm.github.io/java-thread-dump-inspector/).
2. **Findings → Custom rules → + New rule**.
3. Paste the whole file into the code box, give it a name, **Save**.

Each file is a complete rule body — comments included, paste it verbatim. The rule then lives in
your browser and runs on every dump you load until you delete it.

There is no automatic loading, on purpose. The inspector is one HTML file that has to work offline
from a local disk, and fetching sibling files would break exactly that.

## Adding a rule

One file per rule, named `<library>-<what-it-catches>.js`. Split into folders per library once one
of them collects several rules.

Start the file with a comment saying what it detects and what has to be in the stack for it to
fire. See [Writing a rule](../README.md#writing-a-rule) for the fields and helpers available, and
[Contributing a rule](../README.md#contributing-a-rule) for what a PR needs.

## What lives here and what ships built in

The inspector carries a few library signatures itself (currently HikariCP). The bar for those is
that a stranger with a JVM dump could plausibly be running that library.

Everything narrower goes here: one company's stack, an uncommon library, a pattern that only makes
sense with the rest of your setup. Rules here are patterns other people found useful — read what
one does before trusting what it tells you to do.
