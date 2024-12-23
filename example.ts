import { Database, TableSchema } from './src';

async function main() {
  // Initialize database
  const db = new Database('sqlite');
  await db.connect({ filename: 'test.db' });

  // Create users table
  const userSchema: TableSchema = {
    name: 'users',
    columns: [
      { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
      { name: 'username', type: 'TEXT', nullable: false, unique: true },
      { name: 'age', type: 'INTEGER', nullable: false },
      { name: 'email', type: 'TEXT', nullable: false }
    ]
  };

  // Create posts table
  const postSchema: TableSchema = {
    name: 'posts',
    columns: [
      { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
      { name: 'user_id', type: 'INTEGER', nullable: false },
      { name: 'title', type: 'TEXT', nullable: false },
      { name: 'created_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
    ]
  };

  // Transaction example: Create tables and insert initial data
  const transaction = await db.beginTransaction();
  try {
    await db.createTable(userSchema);
    await db.createTable(postSchema);
    
    // Insert users
    await db.insert('users', {
      username: 'john_doe',
      age: 25,
      email: 'john@example.com'
    });
    
    await db.insert('users', {
      username: 'jane_doe',
      age: 28,
      email: 'jane@example.com'
    });

    // Insert posts
    await db.insert('posts', {
      user_id: 1,
      title: 'First post'
    });

    await db.insert('posts', {
      user_id: 2,
      title: 'Hello world'
    });

    await transaction.commit();
    console.log('Transaction committed successfully');
  } catch (error) {
    await transaction.rollback();
    console.error('Transaction rolled back:', error);
    return;
  }

  // Where clause builder examples
  console.log('\nWhere clause examples:');
  
  // Find users over 25
  const olderUsers = await db.select('users', ['username', 'age'], {
    age: { gt: 25 }
  });
  console.log('Users over 25:', olderUsers);

  // Find users with specific usernames
  const specificUsers = await db.select('users', ['username', 'email'], {
    username: { in: ['john_doe', 'jane_doe'] }
  });
  console.log('Specific users:', specificUsers);

  // Find users with age between 20 and 30
  const ageRangeUsers = await db.select('users', ['username', 'age'], {
    age: { between: [20, 30] }
  });
  console.log('Users aged 20-30:', ageRangeUsers);

  // Find users with matching email pattern
  const emailUsers = await db.select('users', ['username', 'email'], {
    email: { like: '%@example.com' }
  });
  console.log('Users with example.com email:', emailUsers);

  // Join example: Get all users with their posts
  console.log('\nJoin example:');
  const userPosts = await db.select(
    'users',
    ['users.username', 'posts.title', 'posts.created_at'],
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
  console.log('Users and their posts:', userPosts);

  // Clean up
  await db.disconnect();
}

main().catch(console.error);
