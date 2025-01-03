import sqlite3 from 'sqlite3';
import { 
  DatabaseConfig, 
  DatabaseDriver, 
  QueryResult, 
  TableSchema,
  Transaction,
  WhereClause,
  JoinClause
} from '../../types/database';

class SQLiteTransaction implements Transaction {
  constructor(private db: sqlite3.Database) {}

  async commit(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async rollback(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('ROLLBACK', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export class SQLiteDriver implements DatabaseDriver {
  private db: sqlite3.Database | null = null;

  private buildWhereClause(where?: WhereClause): { sql: string; params: any[] } {
    if (!where || Object.keys(where).length === 0) {
      return { sql: '', params: [] };
    }

    const conditions: string[] = [];
    const params: any[] = [];

    Object.entries(where).forEach(([field, condition]) => {
      // Quote field name unless it contains a dot
      const quotedField = field.includes('.') ? field : `"${field}"`;
      
      if (typeof condition === 'object' && condition !== null) {
          const operatorMap = {
              eq: '=',
              neq: '!=',
              gt: '>',
              gte: '>=',
              lt: '<',
              lte: '<=',
              like: 'LIKE'
          } as const;
  
          const operator = Object.keys(condition).find(op => op in operatorMap) as keyof typeof operatorMap;
  
          if (operator && operator in operatorMap) {
              conditions.push(`${quotedField} ${operatorMap[operator]} ?`);
              params.push(condition[operator]);
          } else if ('in' in condition) {
              conditions.push(`${quotedField} IN (${condition.in.map(() => '?').join(', ')})`);
              params.push(...condition.in);
          } else if ('between' in condition) {
              conditions.push(`${quotedField} BETWEEN ? AND ?`);
              params.push(condition.between[0], condition.between[1]);
          } else if ('isNull' in condition) {
              conditions.push(`${quotedField} IS ${condition.isNull ? '' : 'NOT '}NULL`);
          }
      } else {
          // Direct value comparison (equals)
          conditions.push(`${quotedField} = ?`);
          params.push(condition);
      }
    });

    return {
      sql: conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  }

  private buildJoinClauses(joins?: JoinClause[]): string {
    if (!joins || joins.length === 0) return '';
    
    return joins.map(join => {
      const tableName = join.table.includes('.') ? join.table : `"${join.table}"`;
      // Don't quote field names if they contain dots (table.column format)
      const leftField = join.on.leftField.includes('.') ? join.on.leftField : `"${join.on.leftField}"`;
      const rightField = join.on.rightField.includes('.') ? join.on.rightField : `"${join.on.rightField}"`;
      return `${join.type} JOIN ${tableName} ON ${leftField} = ${rightField}`;
    }).join(' ');
  }

  private quoteIdentifier(identifier: string): string {
    return identifier.includes('.') ? identifier : `"${identifier}"`;
  }

  async beginTransaction(): Promise<Transaction> {
    if (!this.db) {
      throw new Error('Not connected to database');
    }

    return new Promise((resolve, reject) => {
      this.db!.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(new SQLiteTransaction(this.db!));
        }
      });
    });
  }

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
      let def = `"${col.name}" ${col.type}`;
      if (col.primaryKey) def += ' PRIMARY KEY';
      if (col.autoIncrement) def += ' AUTOINCREMENT';
      if (!col.nullable) def += ' NOT NULL';
      if (col.unique) def += ' UNIQUE';
      if (col.default !== undefined) def += ` DEFAULT ${col.default}`;
      return def;
    }).join(', ');

    const query = `CREATE TABLE IF NOT EXISTS "${schema.name}" (${columns})`;

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

    const columns = Object.keys(data).map(col => `"${col}"`);
    const values = Object.values(data);
    const placeholders = new Array(values.length).fill('?').join(', ');
    const query = `INSERT INTO "${table}" (${columns.join(', ')}) VALUES (${placeholders})`;

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

  private buildColumnList(columns?: string[]): string {
    if (!columns || columns.length === 0) return '*';
    return columns.map(col => this.quoteIdentifier(col)).join(', ');
  }

  async select(
    table: string, 
    columns?: string[], 
    where?: WhereClause,
    joins?: JoinClause[]
  ): Promise<QueryResult> {
    if (!this.db) {
      return { success: false, error: new Error('Not connected to database') };
    }

    try {
      const tableName = table.includes('.') ? table : `"${table}"`;
      let query = `SELECT ${this.buildColumnList(columns)} FROM ${tableName}`;
      
      if (joins) {
        query += ' ' + this.buildJoinClauses(joins);
      }

      const { sql: whereClause, params: whereParams } = this.buildWhereClause(where);
      query += whereClause;

      return new Promise((resolve) => {
        this.db!.all(query, whereParams, (err, rows) => {
          if (err) {
            resolve({ success: false, error: err });
          } else {
            resolve({ success: true, data: rows });
          }
        });
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      };
    }
  }

  async update(table: string, data: Record<string, any>, where: WhereClause): Promise<QueryResult> {
    if (!this.db) {
      return { success: false, error: new Error('Not connected to database') };
    }

    const setColumns = Object.keys(data).map(key => `"${key}" = ?`);
    const { sql: whereClause, params: whereParams } = this.buildWhereClause(where);
    const values = [...Object.values(data), ...whereParams];
    
    const query = `UPDATE "${table}" SET ${setColumns.join(', ')}${whereClause}`;

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

  async delete(table: string, where: WhereClause): Promise<QueryResult> {
    if (!this.db) {
      return { success: false, error: new Error('Not connected to database') };
    }

    const { sql: whereClause, params: whereParams } = this.buildWhereClause(where);
    const query = `DELETE FROM "${table}"${whereClause}`;

    return new Promise((resolve) => {
      this.db!.run(query, whereParams, function(err) {
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
