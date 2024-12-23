import { SQLiteDriver } from '../drivers/sqlite/sqlite-driver';
import { TableSchema, WhereClause, JoinClause } from '../types/database';
import fs from 'fs';

describe('SQLiteDriver', () => {
  const TEST_DB = 'test.db';
  let driver: SQLiteDriver;

  beforeEach(async () => {
    driver = new SQLiteDriver();
    await driver.connect({ filename: TEST_DB });
  });

  afterEach(async () => {
    await driver.disconnect();
    // Clean up test database
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
  });

  describe('transactions', () => {
    it('should commit transaction successfully', async () => {
      const schema: TableSchema = {
        name: 'test_users',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
          { name: 'username', type: 'TEXT', nullable: false }
        ]
      };
      await driver.createTable(schema);

      const transaction = await driver.beginTransaction();
      await driver.insert('test_users', { username: 'user1' });
      await transaction.commit();

      const result = await driver.select('test_users');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should rollback transaction successfully', async () => {
      const schema: TableSchema = {
        name: 'test_users',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
          { name: 'username', type: 'TEXT', nullable: false }
        ]
      };
      await driver.createTable(schema);

      const transaction = await driver.beginTransaction();
      await driver.insert('test_users', { username: 'user1' });
      await transaction.rollback();

      const result = await driver.select('test_users');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('where clause builder', () => {
    beforeEach(async () => {
      const schema: TableSchema = {
        name: 'test_users',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
          { name: 'username', type: 'TEXT', nullable: false },
          { name: 'age', type: 'INTEGER' },
          { name: 'email', type: 'TEXT' }
        ]
      };
      await driver.createTable(schema);
      await driver.insert('test_users', { username: 'user1', age: 25, email: 'user1@test.com' });
      await driver.insert('test_users', { username: 'user2', age: 30, email: 'user2@test.com' });
    });

    it('should handle equals operator', async () => {
      const where: WhereClause = { age: { eq: 25 } };
      const result = await driver.select('test_users', ['username'], where);
      expect(result.data[0].username).toBe('user1');
    });

    it('should handle greater than operator', async () => {
      const where: WhereClause = { age: { gt: 27 } };
      const result = await driver.select('test_users', ['username'], where);
      expect(result.data[0].username).toBe('user2');
    });

    it('should handle LIKE operator', async () => {
      const where: WhereClause = { email: { like: '%@test.com' } };
      const result = await driver.select('test_users', ['username'], where);
      expect(result.data).toHaveLength(2);
    });

    it('should handle IN operator', async () => {
      const where: WhereClause = { username: { in: ['user1', 'user2'] } };
      const result = await driver.select('test_users', ['username'], where);
      expect(result.data).toHaveLength(2);
    });

    it('should handle BETWEEN operator', async () => {
      const where: WhereClause = { age: { between: [20, 27] } };
      const result = await driver.select('test_users', ['username'], where);
      expect(result.data[0].username).toBe('user1');
    });
  });

  describe('joins', () => {
    beforeEach(async () => {
      // Create users table
      const usersSchema: TableSchema = {
        name: 'users',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
          { name: 'username', type: 'TEXT', nullable: false }
        ]
      };
      await driver.createTable(usersSchema);

      // Create posts table
      const postsSchema: TableSchema = {
        name: 'posts',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
          { name: 'user_id', type: 'INTEGER', nullable: false },
          { name: 'title', type: 'TEXT', nullable: false }
        ]
      };
      await driver.createTable(postsSchema);

      // Insert test data
      await driver.insert('users', { username: 'user1' });
      await driver.insert('posts', { user_id: 1, title: 'Post 1' });
    });

    it('should perform INNER JOIN', async () => {
      const joins: JoinClause[] = [{
        type: 'INNER',
        table: 'posts',
        on: {
          leftField: 'users.id',
          rightField: 'posts.user_id'
        }
      }];

      const result = await driver.select('users', ['users.username', 'posts.title'], undefined, joins);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('username', 'user1');
      expect(result.data[0]).toHaveProperty('title', 'Post 1');
    });
  });

  describe('createTable', () => {
    it('should create a table with the specified schema', async () => {
      const schema: TableSchema = {
        name: 'test_users',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
          { name: 'username', type: 'TEXT', nullable: false },
          { name: 'email', type: 'TEXT', nullable: false }
        ]
      };

      const result = await driver.createTable(schema);
      expect(result.success).toBe(true);
    });
  });

  describe('insert', () => {
    beforeEach(async () => {
      const schema: TableSchema = {
        name: 'test_users',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
          { name: 'username', type: 'TEXT', nullable: false },
          { name: 'email', type: 'TEXT', nullable: false }
        ]
      };
      await driver.createTable(schema);
    });

    it('should insert data into the table', async () => {
      const result = await driver.insert('test_users', {
        username: 'testuser',
        email: 'test@example.com'
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(1);
    });
  });

  describe('select', () => {
    beforeEach(async () => {
      const schema: TableSchema = {
        name: 'test_users',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
          { name: 'username', type: 'TEXT', nullable: false },
          { name: 'email', type: 'TEXT', nullable: false }
        ]
      };
      await driver.createTable(schema);
      await driver.insert('test_users', {
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    it('should select all data from the table', async () => {
      const result = await driver.select('test_users');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    it('should select specific columns', async () => {
      const result = await driver.select('test_users', ['username']);
      expect(result.success).toBe(true);
      expect(result.data[0]).toHaveProperty('username');
      expect(result.data[0]).not.toHaveProperty('email');
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      const schema: TableSchema = {
        name: 'test_users',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
          { name: 'username', type: 'TEXT', nullable: false },
          { name: 'email', type: 'TEXT', nullable: false }
        ]
      };
      await driver.createTable(schema);
      await driver.insert('test_users', {
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    it('should update data in the table', async () => {
      const updateResult = await driver.update(
        'test_users',
        { email: 'updated@example.com' },
        { username: 'testuser' }
      );

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.changes).toBe(1);

      const selectResult = await driver.select('test_users');
      expect(selectResult.data[0].email).toBe('updated@example.com');
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      const schema: TableSchema = {
        name: 'test_users',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
          { name: 'username', type: 'TEXT', nullable: false },
          { name: 'email', type: 'TEXT', nullable: false }
        ]
      };
      await driver.createTable(schema);
      await driver.insert('test_users', {
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    it('should delete data from the table', async () => {
      const deleteResult = await driver.delete('test_users', { username: 'testuser' });
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.data?.changes).toBe(1);

      const selectResult = await driver.select('test_users');
      expect(selectResult.data).toHaveLength(0);
    });

    it('should handle deletion with non-existent where clause', async () => {
      const deleteResult = await driver.delete('test_users', { username: 'nonexistent' });
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.data?.changes).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle table creation with invalid schema', async () => {
      const result = await driver.createTable({
        name: 'invalid table name with spaces',
        columns: []
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle insertion with invalid data', async () => {
      const schema: TableSchema = {
        name: 'test_users',
        columns: [
          { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
          { name: 'username', type: 'TEXT', nullable: false }
        ]
      };
      await driver.createTable(schema);

      const result = await driver.insert('test_users', {
        nonexistent_column: 'value'
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
