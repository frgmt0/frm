import sqlite3 from 'sqlite3';
import { DatabaseConfig, DatabaseDriver, QueryResult, TableSchema } from '../../types/database';

export class SQLiteDriver implements DatabaseDriver {
  private db: sqlite3.Database | null = null;

  async connect(config: DatabaseConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!config.filename) {
        reject(new Error('SQLite requires a filename'));
        return;
      }

      this.db = new sqlite3.Database(config.filename, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.db = null;
          resolve();
        }
      });
    });
  }

  async createDatabase(name: string): Promise<QueryResult> {
    // SQLite creates database automatically when connecting
    return {
      success: true,
      data: { message: `Database ${name} ready` }
    };
  }

  async createTable(schema: TableSchema): Promise<QueryResult> {
    if (!this.db) {
      return { success: false, error: new Error('Not connected to database') };
    }

    const columns = schema.columns.map(col => {
      let def = `${col.name} ${col.type}`;
      if (col.primaryKey) def += ' PRIMARY KEY';
      if (col.autoIncrement) def += ' AUTOINCREMENT';
      if (!col.nullable) def += ' NOT NULL';
      if (col.unique) def += ' UNIQUE';
      if (col.default !== undefined) def += ` DEFAULT ${col.default}`;
      return def;
    }).join(', ');

    const query = `CREATE TABLE IF NOT EXISTS ${schema.name} (${columns})`;

    return new Promise((resolve) => {
      this.db!.run(query, (err) => {
        if (err) {
          resolve({ success: false, error: err });
        } else {
          resolve({ success: true });
        }
      });
    });
  }

  async insert(table: string, data: Record<string, any>): Promise<QueryResult> {
    if (!this.db) {
      return { success: false, error: new Error('Not connected to database') };
    }

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = new Array(values.length).fill('?').join(', ');
    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    return new Promise((resolve) => {
      this.db!.run(query, values, function(err) {
        if (err) {
          resolve({ success: false, error: err });
        } else {
          resolve({ 
            success: true, 
            data: { id: this.lastID }
          });
        }
      });
    });
  }

  async select(table: string, columns: string[] = ['*'], where?: Record<string, any>): Promise<QueryResult> {
    if (!this.db) {
      return { success: false, error: new Error('Not connected to database') };
    }

    let query = `SELECT ${columns.join(', ')} FROM ${table}`;
    const values: any[] = [];

    if (where) {
      const conditions = Object.entries(where).map(([key]) => `${key} = ?`);
      values.push(...Object.values(where));
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    return new Promise((resolve) => {
      this.db!.all(query, values, (err, rows) => {
        if (err) {
          resolve({ success: false, error: err });
        } else {
          resolve({ success: true, data: rows });
        }
      });
    });
  }

  async update(table: string, data: Record<string, any>, where: Record<string, any>): Promise<QueryResult> {
    if (!this.db) {
      return { success: false, error: new Error('Not connected to database') };
    }

    const setColumns = Object.keys(data).map(key => `${key} = ?`);
    const whereColumns = Object.keys(where).map(key => `${key} = ?`);
    const values = [...Object.values(data), ...Object.values(where)];
    
    const query = `UPDATE ${table} SET ${setColumns.join(', ')} WHERE ${whereColumns.join(' AND ')}`;

    return new Promise((resolve) => {
      this.db!.run(query, values, function(err) {
        if (err) {
          resolve({ success: false, error: err });
        } else {
          resolve({ 
            success: true, 
            data: { changes: this.changes }
          });
        }
      });
    });
  }
}
