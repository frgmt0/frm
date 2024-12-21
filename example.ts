import { Database, TableSchema } from './src';

async function main() {
  // Initialize database
  const db = new Database('sqlite');
  await db.connect({ filename: 'test.db' });

  // Create a users table
  const userSchema: TableSchema = {
    name: 'users',
    columns: [
      { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
      { name: 'username', type: 'TEXT', nullable: false, unique: true },
      { name: 'email', type: 'TEXT', nullable: false },
      { name: 'created_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    ]
  };

  // Create table
  await db.createTable(userSchema);

  // Insert data
  const insertResult = await db.insert('users', {
    username: 'testuser',
    email: 'test@example.com'
  });
  console.log('Insert result:', insertResult);

  // Query data
  const selectResult = await db.select('users', ['id', 'username', 'email']);
  console.log('Select result:', selectResult);

  // Update data
  const updateResult = await db.update(
    'users',
    { email: 'updated@example.com' },
    { username: 'testuser' }
  );
  console.log('Update result:', updateResult);

  // Disconnect
  await db.disconnect();
}

main().catch(console.error);
