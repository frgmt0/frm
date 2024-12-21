# fRM: a TypeScript ORM that’s all about keeping it simple (and powerful) :>

**fRM** (pronounced “form,” because why not?) is a lightweight, TypeScript-first ORM designed to bring structure and sanity to your database interactions. built from scratch, fRM skips the fluff and focuses on giving you the tools you need to handle your data like a pro. whether you’re spinning up a quick SQLite project or planning a multi-database empire, fRM is here for the ride.

## what is fRM? 🛠️

fRM is an object-relational mapper (ORM) built to:
• handle database operations with minimal setup and maximum flexibility.

• provide type safety (this is TypeScript, after all).

• grow with your project—from simple SQLite queries to multi-database setups with PostgreSQL, MongoDB, and beyond.

oh, and did we mention it’s built entirely in TypeScript from scratch? no unnecessary bloat, no weird dependencies—just clean, customizable code. We will be rewriting this in Rust and adding some fun features in the future, so stay tuned for the big reveal!

# the roadmap 🚧

### here’s where we’re going, one step at a time:

**phase 0: the basics (aka “getting our feet wet”)**
• core operations: create, insert, query, update (the essentials).

• basic SQLite support: start small, think big.

• documentation: because no one likes guessing how stuff works.

*(status: nailed it.)*

**phase 1: advanced operations (aka “let’s get serious”)**
• delete operations (because mistakes happen).

• transaction support (money moves).

• where clauses, joins, aggregates—all the spicy query stuff.

• connection pooling and error handling for those production vibes.

*(status: we’re working on it. patience is a virtue.)*

**phase 2: custom schema system (aka “making it fancy”)**
• introduce .frm schema files with XML-like syntax for easy management.

• auto-generate TypeScript models and migrations (less typing, more TypeScript-ing).

• CLI tools for schema management, because who doesn’t love a good command line flex?

*(status: coming soon, stay hyped.)*

**phase 3: SQLite optimization (aka “speed demon mode”)**
• query optimization and index management (make SQLite zoom).

• bulk operations and caching (because time is money).

• advanced features: full-text search, JSON support, window functions.

*(status: buckle up.)*

**phase 4: multi-database support (aka “the big leagues”)**
• abstract database interface (one ORM to rule them all).

• PostgreSQL and MongoDB support with database-specific features.

• cross-database migration tools (because switching shouldn’t suck).

*(status: future us will handle it.)*

## why fRM? 🤔

because you deserve an ORM that’s:
• simple: handles the hard stuff so you can focus on building.

• powerful: scales with your project without breaking a sweat.

• lightweight: no bloat, no nonsense—just the tools you need.

• and best of all: built by a chill guy.

now fRM can’t solve world hunger, but it can handle a SELECT * faster than you can say “sql injection is bad.” probably. :>
