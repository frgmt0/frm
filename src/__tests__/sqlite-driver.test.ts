import { SQLiteDriver } from '../drivers/sqlite/sqlite-driver';
import { TableSchema } from '../types/database';
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

    it('should select with where clause', async () => {
      const result = await driver.select('test_users', ['*'], { username: 'testuser' });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('test@example.com');
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
