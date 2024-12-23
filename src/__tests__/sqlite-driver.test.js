"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite_driver_1 = require("../drivers/sqlite/sqlite-driver");
const fs_1 = __importDefault(require("fs"));
describe('SQLiteDriver', () => {
    const TEST_DB = 'test.db';
    let driver;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        driver = new sqlite_driver_1.SQLiteDriver();
        yield driver.connect({ filename: TEST_DB });
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield driver.disconnect();
        // Clean up test database
        if (fs_1.default.existsSync(TEST_DB)) {
            fs_1.default.unlinkSync(TEST_DB);
        }
    }));
    describe('transactions', () => {
        it('should commit transaction successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const schema = {
                name: 'test_users',
                columns: [
                    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                    { name: 'username', type: 'TEXT', nullable: false }
                ]
            };
            yield driver.createTable(schema);
            const transaction = yield driver.beginTransaction();
            yield driver.insert('test_users', { username: 'user1' });
            yield transaction.commit();
            const result = yield driver.select('test_users');
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
        }));
        it('should rollback transaction successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const schema = {
                name: 'test_users',
                columns: [
                    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                    { name: 'username', type: 'TEXT', nullable: false }
                ]
            };
            yield driver.createTable(schema);
            const transaction = yield driver.beginTransaction();
            yield driver.insert('test_users', { username: 'user1' });
            yield transaction.rollback();
            const result = yield driver.select('test_users');
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(0);
        }));
    });
    describe('where clause builder', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const schema = {
                name: 'test_users',
                columns: [
                    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                    { name: 'username', type: 'TEXT', nullable: false },
                    { name: 'age', type: 'INTEGER' },
                    { name: 'email', type: 'TEXT' }
                ]
            };
            yield driver.createTable(schema);
            yield driver.insert('test_users', { username: 'user1', age: 25, email: 'user1@test.com' });
            yield driver.insert('test_users', { username: 'user2', age: 30, email: 'user2@test.com' });
        }));
        it('should handle equals operator', () => __awaiter(void 0, void 0, void 0, function* () {
            const where = { age: { eq: 25 } };
            const result = yield driver.select('test_users', ['username'], where);
            expect(result.data[0].username).toBe('user1');
        }));
        it('should handle greater than operator', () => __awaiter(void 0, void 0, void 0, function* () {
            const where = { age: { gt: 27 } };
            const result = yield driver.select('test_users', ['username'], where);
            expect(result.data[0].username).toBe('user2');
        }));
        it('should handle LIKE operator', () => __awaiter(void 0, void 0, void 0, function* () {
            const where = { email: { like: '%@test.com' } };
            const result = yield driver.select('test_users', ['username'], where);
            expect(result.data).toHaveLength(2);
        }));
        it('should handle IN operator', () => __awaiter(void 0, void 0, void 0, function* () {
            const where = { username: { in: ['user1', 'user2'] } };
            const result = yield driver.select('test_users', ['username'], where);
            expect(result.data).toHaveLength(2);
        }));
        it('should handle BETWEEN operator', () => __awaiter(void 0, void 0, void 0, function* () {
            const where = { age: { between: [20, 27] } };
            const result = yield driver.select('test_users', ['username'], where);
            expect(result.data[0].username).toBe('user1');
        }));
    });
    describe('joins', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Create users table
            const usersSchema = {
                name: 'users',
                columns: [
                    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                    { name: 'username', type: 'TEXT', nullable: false }
                ]
            };
            yield driver.createTable(usersSchema);
            // Create posts table
            const postsSchema = {
                name: 'posts',
                columns: [
                    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                    { name: 'user_id', type: 'INTEGER', nullable: false },
                    { name: 'title', type: 'TEXT', nullable: false }
                ]
            };
            yield driver.createTable(postsSchema);
            // Insert test data
            yield driver.insert('users', { username: 'user1' });
            yield driver.insert('posts', { user_id: 1, title: 'Post 1' });
        }));
        it('should perform INNER JOIN', () => __awaiter(void 0, void 0, void 0, function* () {
            const joins = [{
                    type: 'INNER',
                    table: 'posts',
                    on: {
                        leftField: 'users.id',
                        rightField: 'posts.user_id'
                    }
                }];
            const result = yield driver.select('users', ['users.username', 'posts.title'], undefined, joins);
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0]).toHaveProperty('username', 'user1');
            expect(result.data[0]).toHaveProperty('title', 'Post 1');
        }));
    });
    // Previous test cases...
    describe('createTable', () => {
        it('should create a table with the specified schema', () => __awaiter(void 0, void 0, void 0, function* () {
            const schema = {
                name: 'test_users',
                columns: [
                    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                    { name: 'username', type: 'TEXT', nullable: false },
                    { name: 'email', type: 'TEXT', nullable: false }
                ]
            };
            const result = yield driver.createTable(schema);
            expect(result.success).toBe(true);
        }));
    });
    describe('insert', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const schema = {
                name: 'test_users',
                columns: [
                    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                    { name: 'username', type: 'TEXT', nullable: false },
                    { name: 'email', type: 'TEXT', nullable: false }
                ]
            };
            yield driver.createTable(schema);
        }));
        it('should insert data into the table', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const result = yield driver.insert('test_users', {
                username: 'testuser',
                email: 'test@example.com'
            });
            expect(result.success).toBe(true);
            expect((_a = result.data) === null || _a === void 0 ? void 0 : _a.id).toBe(1);
        }));
    });
    describe('select', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const schema = {
                name: 'test_users',
                columns: [
                    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                    { name: 'username', type: 'TEXT', nullable: false },
                    { name: 'email', type: 'TEXT', nullable: false }
                ]
            };
            yield driver.createTable(schema);
            yield driver.insert('test_users', {
                username: 'testuser',
                email: 'test@example.com'
            });
        }));
        it('should select all data from the table', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield driver.select('test_users');
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0]).toMatchObject({
                username: 'testuser',
                email: 'test@example.com'
            });
        }));
        it('should select specific columns', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield driver.select('test_users', ['username']);
            expect(result.success).toBe(true);
            expect(result.data[0]).toHaveProperty('username');
            expect(result.data[0]).not.toHaveProperty('email');
        }));
    });
    describe('update', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const schema = {
                name: 'test_users',
                columns: [
                    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                    { name: 'username', type: 'TEXT', nullable: false },
                    { name: 'email', type: 'TEXT', nullable: false }
                ]
            };
            yield driver.createTable(schema);
            yield driver.insert('test_users', {
                username: 'testuser',
                email: 'test@example.com'
            });
        }));
        it('should update data in the table', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const updateResult = yield driver.update('test_users', { email: 'updated@example.com' }, { username: 'testuser' });
            expect(updateResult.success).toBe(true);
            expect((_a = updateResult.data) === null || _a === void 0 ? void 0 : _a.changes).toBe(1);
            const selectResult = yield driver.select('test_users');
            expect(selectResult.data[0].email).toBe('updated@example.com');
        }));
    });
    describe('delete', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            const schema = {
                name: 'test_users',
                columns: [
                    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                    { name: 'username', type: 'TEXT', nullable: false },
                    { name: 'email', type: 'TEXT', nullable: false }
                ]
            };
            yield driver.createTable(schema);
            yield driver.insert('test_users', {
                username: 'testuser',
                email: 'test@example.com'
            });
        }));
        it('should delete data from the table', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const deleteResult = yield driver.delete('test_users', { username: 'testuser' });
            expect(deleteResult.success).toBe(true);
            expect((_a = deleteResult.data) === null || _a === void 0 ? void 0 : _a.changes).toBe(1);
            const selectResult = yield driver.select('test_users');
            expect(selectResult.data).toHaveLength(0);
        }));
        it('should handle deletion with non-existent where clause', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const deleteResult = yield driver.delete('test_users', { username: 'nonexistent' });
            expect(deleteResult.success).toBe(true);
            expect((_a = deleteResult.data) === null || _a === void 0 ? void 0 : _a.changes).toBe(0);
        }));
    });
    describe('error handling', () => {
        it('should handle table creation with invalid schema', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield driver.createTable({
                name: 'invalid table name with spaces',
                columns: []
            });
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        }));
        it('should handle insertion with invalid data', () => __awaiter(void 0, void 0, void 0, function* () {
            const schema = {
                name: 'test_users',
                columns: [
                    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                    { name: 'username', type: 'TEXT', nullable: false }
                ]
            };
            yield driver.createTable(schema);
            const result = yield driver.insert('test_users', {
                nonexistent_column: 'value'
            });
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        }));
    });
});
