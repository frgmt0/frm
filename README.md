# fRM (form without vowel)

A TypeScript ORM focused on simplicity and extensibility, with powerful query building capabilities.

## Features

- 🚀 Full TypeScript support
- 🎯 Simple and intuitive API
- 🔧 Extensible architecture
- 🔍 Advanced query building
- 🔄 Transaction support
- 🔌 Multi-database support (SQLite now, more coming soon)

## Installation

```bash
npm install frm
```

## Quick Start

```typescript
import { Database, TableSchema } from 'frm';

// Initialize database
const db = new Database('sqlite');
await db.connect({ filename: 'mydb.sqlite' });

// Define schema
const userSchema: TableSchema = {
  name: 'users',
  columns: [
    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
    { name: 'username', type: 'TEXT', nullable: false, unique: true },
    { name: 'email', type: 'TEXT', nullable: false }
  ]
};

// Create table
await db.createTable(userSchema);

// Insert data
await db.insert('users', {
  username: 'john_doe',
  email: 'john@example.com'
});

// Query with advanced where clause
const users = await db.select('users', ['username', 'email'], {
  email: { like: '%@example.com' }
});

// Use transactions
const transaction = await db.beginTransaction();
try {
  await db.insert('users', { username: 'jane', email: 'jane@example.com' });
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
}
```

## Advanced Queries

### Aggregate Functions

```typescript
// Count all records
await db.select('users', [
  { function: 'COUNT', column: '*', alias: 'total_users' }
]);

// Calculate average with GROUP BY
await db.select('orders', [
  { function: 'AVG', column: 'amount', alias: 'avg_amount' },
  'customer_id'
], undefined, undefined, ['customer_id']);

// Multiple aggregates
await db.select('orders', [
  { function: 'SUM', column: 'amount', alias: 'total_amount' },
  { function: 'COUNT', column: '*', alias: 'order_count' },
  { function: 'MAX', column: 'amount', alias: 'highest_order' },
  'customer_id'
], undefined, undefined, ['customer_id']);
```

### Where Clause Operators

```typescript
// Equals
await db.select('users', ['*'], { age: { eq: 25 } });

// Greater than
await db.select('users', ['*'], { age: { gt: 18 } });

// Between
await db.select('users', ['*'], { age: { between: [20, 30] } });

// IN clause
await db.select('users', ['*'], { status: { in: ['active', 'pending'] } });

// LIKE
await db.select('users', ['*'], { email: { like: '%@gmail.com' } });
```

### Joins

```typescript
const result = await db.select(
  'users',
  ['users.username', 'posts.title'],
  undefined,
  [{
    type: 'INNER',
    table: 'posts',
    on: {
      leftField: 'users.id',
      rightField: 'posts.user_id'
    }
  }]
);
```

## API Reference

### Database Class

- `connect(config: DatabaseConfig): Promise<void>`
- `disconnect(): Promise<void>`
- `createTable(schema: TableSchema): Promise<QueryResult>`
- `insert(table: string, data: Record<string, any>): Promise<QueryResult>`
- `select(table: string, columns?: (string | AggregateColumn)[], where?: WhereClause, joins?: JoinClause[], groupBy?: string[]): Promise<QueryResult>`
- `update(table: string, data: Record<string, any>, where: WhereClause): Promise<QueryResult>`
- `delete(table: string, where: WhereClause): Promise<QueryResult>`
- `beginTransaction(): Promise<Transaction>`

### Aggregate Functions

Available aggregate functions:
- `COUNT`: Count records
- `SUM`: Calculate sum of values
- `AVG`: Calculate average of values
- `MAX`: Find maximum value
- `MIN`: Find minimum value

Each aggregate function can be used with an optional alias and combined with GROUP BY clauses.

### Where Clause Operators

- `eq`: Equals
- `neq`: Not equals
- `gt`: Greater than
- `gte`: Greater than or equal
- `lt`: Less than
- `lte`: Less than or equal
- `like`: LIKE pattern matching
- `in`: IN clause
- `between`: BETWEEN range
- `isNull`: IS NULL check

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)

## Roadmap

See our [ROADMAP.md](ROADMAP.md) for planned features and improvements.
