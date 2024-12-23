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
exports.SQLiteDriver = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
class SQLiteTransaction {
    constructor(db) {
        this.db = db;
    }
    commit() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run('COMMIT', (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
        });
    }
    rollback() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run('ROLLBACK', (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
        });
    }
}
class SQLiteDriver {
    constructor() {
        this.db = null;
    }
    buildWhereClause(where) {
        if (!where || Object.keys(where).length === 0) {
            return { sql: '', params: [] };
        }
        const conditions = [];
        const params = [];
        Object.entries(where).forEach(([field, condition]) => {
            if (typeof condition === 'object' && condition !== null) {
                const operatorMap = {
                    eq: '=',
                    neq: '!=',
                    gt: '>',
                    gte: '>=',
                    lt: '<',
                    lte: '<=',
                    like: 'LIKE'
                };
                const operator = Object.keys(condition).find(op => op in operatorMap);
                if (operator && operator in operatorMap) {
                    conditions.push(`${field} ${operatorMap[operator]} ?`);
                    params.push(condition[operator]);
                }
                else if ('in' in condition) {
                    conditions.push(`${field} IN (${condition.in.map(() => '?').join(', ')})`);
                    params.push(...condition.in);
                }
                else if ('between' in condition) {
                    conditions.push(`${field} BETWEEN ? AND ?`);
                    params.push(condition.between[0], condition.between[1]);
                }
                else if ('isNull' in condition) {
                    conditions.push(`${field} IS ${condition.isNull ? '' : 'NOT '}NULL`);
                }
            }
            else {
                // Direct value comparison (equals)
                conditions.push(`${field} = ?`);
                params.push(condition);
            }
        });
        return {
            sql: conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '',
            params
        };
    }
    buildJoinClauses(joins) {
        if (!joins || joins.length === 0)
            return '';
        return joins.map(join => `${join.type} JOIN ${join.table} ON ${join.on.leftField} = ${join.on.rightField}`).join(' ');
    }
    beginTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                throw new Error('Not connected to database');
            }
            return new Promise((resolve, reject) => {
                this.db.run('BEGIN TRANSACTION', (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(new SQLiteTransaction(this.db));
                    }
                });
            });
        });
    }
    connect(config) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!config.filename) {
                    reject(new Error('SQLite requires a filename'));
                    return;
                }
                this.db = new sqlite3_1.default.Database(config.filename, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    resolve();
                    return;
                }
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        this.db = null;
                        resolve();
                    }
                });
            });
        });
    }
    createDatabase(name) {
        return __awaiter(this, void 0, void 0, function* () {
            // SQLite creates database automatically when connecting
            return {
                success: true,
                data: { message: `Database ${name} ready` }
            };
        });
    }
    createTable(schema) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                return { success: false, error: new Error('Not connected to database') };
            }
            const columns = schema.columns.map(col => {
                let def = `${col.name} ${col.type}`;
                if (col.primaryKey)
                    def += ' PRIMARY KEY';
                if (col.autoIncrement)
                    def += ' AUTOINCREMENT';
                if (!col.nullable)
                    def += ' NOT NULL';
                if (col.unique)
                    def += ' UNIQUE';
                if (col.default !== undefined)
                    def += ` DEFAULT ${col.default}`;
                return def;
            }).join(', ');
            const query = `CREATE TABLE IF NOT EXISTS ${schema.name} (${columns})`;
            return new Promise((resolve) => {
                this.db.run(query, (err) => {
                    if (err) {
                        resolve({ success: false, error: err });
                    }
                    else {
                        resolve({ success: true });
                    }
                });
            });
        });
    }
    insert(table, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                return { success: false, error: new Error('Not connected to database') };
            }
            const columns = Object.keys(data);
            const values = Object.values(data);
            const placeholders = new Array(values.length).fill('?').join(', ');
            const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
            return new Promise((resolve) => {
                this.db.run(query, values, function (err) {
                    if (err) {
                        resolve({ success: false, error: err });
                    }
                    else {
                        resolve({
                            success: true,
                            data: { id: this.lastID }
                        });
                    }
                });
            });
        });
    }
    select(table_1) {
        return __awaiter(this, arguments, void 0, function* (table, columns = ['*'], where, joins) {
            if (!this.db) {
                return { success: false, error: new Error('Not connected to database') };
            }
            let query = `SELECT ${columns.join(', ')} FROM ${table}`;
            // Add joins if provided
            if (joins) {
                query += ' ' + this.buildJoinClauses(joins);
            }
            // Build where clause
            const { sql: whereClause, params: whereParams } = this.buildWhereClause(where);
            query += whereClause;
            return new Promise((resolve) => {
                this.db.all(query, whereParams, (err, rows) => {
                    if (err) {
                        resolve({ success: false, error: err });
                    }
                    else {
                        resolve({ success: true, data: rows });
                    }
                });
            });
        });
    }
    update(table, data, where) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                return { success: false, error: new Error('Not connected to database') };
            }
            const setColumns = Object.keys(data).map(key => `${key} = ?`);
            const { sql: whereClause, params: whereParams } = this.buildWhereClause(where);
            const values = [...Object.values(data), ...whereParams];
            const query = `UPDATE ${table} SET ${setColumns.join(', ')}${whereClause}`;
            return new Promise((resolve) => {
                this.db.run(query, values, function (err) {
                    if (err) {
                        resolve({ success: false, error: err });
                    }
                    else {
                        resolve({
                            success: true,
                            data: { changes: this.changes }
                        });
                    }
                });
            });
        });
    }
    delete(table, where) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                return { success: false, error: new Error('Not connected to database') };
            }
            const { sql: whereClause, params: whereParams } = this.buildWhereClause(where);
            const query = `DELETE FROM ${table}${whereClause}`;
            return new Promise((resolve) => {
                this.db.run(query, whereParams, function (err) {
                    if (err) {
                        resolve({ success: false, error: err });
                    }
                    else {
                        resolve({
                            success: true,
                            data: { changes: this.changes }
                        });
                    }
                });
            });
        });
    }
}
exports.SQLiteDriver = SQLiteDriver;
