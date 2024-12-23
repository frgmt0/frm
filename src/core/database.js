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
exports.Database = void 0;
const sqlite_driver_1 = require("../drivers/sqlite/sqlite-driver");
class Database {
    constructor(driverType = 'sqlite') {
        switch (driverType) {
            case 'sqlite':
                this.driver = new sqlite_driver_1.SQLiteDriver();
                break;
            default:
                throw new Error(`Unsupported database type: ${driverType}`);
        }
    }
    connect(config) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.driver.connect(config);
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.driver.disconnect();
        });
    }
    createDatabase(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.driver.createDatabase(name);
        });
    }
    createTable(schema) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.driver.createTable(schema);
        });
    }
    beginTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.driver.beginTransaction();
        });
    }
    insert(table, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.driver.insert(table, data);
        });
    }
    select(table, columns, where, joins) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.driver.select(table, columns, where, joins);
        });
    }
    update(table, data, where) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.driver.update(table, data, where);
        });
    }
    delete(table, where) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.driver.delete(table, where);
        });
    }
}
exports.Database = Database;
