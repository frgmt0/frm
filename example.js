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
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("./src");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Initialize database
        const db = new src_1.Database('sqlite');
        yield db.connect({ filename: 'test.db' });
        // Create users table
        const userSchema = {
            name: 'users',
            columns: [
                { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                { name: 'username', type: 'TEXT', nullable: false, unique: true },
                { name: 'age', type: 'INTEGER', nullable: false },
                { name: 'email', type: 'TEXT', nullable: false }
            ]
        };
        // Create posts table
        const postSchema = {
            name: 'posts',
            columns: [
                { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                { name: 'user_id', type: 'INTEGER', nullable: false },
                { name: 'title', type: 'TEXT', nullable: false },
                { name: 'created_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
            ]
        };
        // Transaction example: Create tables and insert initial data
        const transaction = yield db.beginTransaction();
        try {
            yield db.createTable(userSchema);
            yield db.createTable(postSchema);
            // Insert users
            yield db.insert('users', {
                username: 'john_doe',
                age: 25,
                email: 'john@example.com'
            });
            yield db.insert('users', {
                username: 'jane_doe',
                age: 28,
                email: 'jane@example.com'
            });
            // Insert posts
            yield db.insert('posts', {
                user_id: 1,
                title: 'First post'
            });
            yield db.insert('posts', {
                user_id: 2,
                title: 'Hello world'
            });
            yield transaction.commit();
            console.log('Transaction committed successfully');
        }
        catch (error) {
            yield transaction.rollback();
            console.error('Transaction rolled back:', error);
            return;
        }
        // Where clause builder examples
        console.log('\nWhere clause examples:');
        // Find users over 25
        const olderUsers = yield db.select('users', ['username', 'age'], {
            age: { gt: 25 }
        });
        console.log('Users over 25:', olderUsers);
        // Find users with specific usernames
        const specificUsers = yield db.select('users', ['username', 'email'], {
            username: { in: ['john_doe', 'jane_doe'] }
        });
        console.log('Specific users:', specificUsers);
        // Find users with age between 20 and 30
        const ageRangeUsers = yield db.select('users', ['username', 'age'], {
            age: { between: [20, 30] }
        });
        console.log('Users aged 20-30:', ageRangeUsers);
        // Find users with matching email pattern
        const emailUsers = yield db.select('users', ['username', 'email'], {
            email: { like: '%@example.com' }
        });
        console.log('Users with example.com email:', emailUsers);
        // Join example: Get all users with their posts
        console.log('\nJoin example:');
        const userPosts = yield db.select('users', ['users.username', 'posts.title', 'posts.created_at'], undefined, [{
                type: 'INNER',
                table: 'posts',
                on: {
                    leftField: 'users.id',
                    rightField: 'posts.user_id'
                }
            }]);
        console.log('Users and their posts:', userPosts);
        // Clean up
        yield db.disconnect();
    });
}
main().catch(console.error);
