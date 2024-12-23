import { 
  DatabaseConfig, 
  DatabaseDriver, 
  QueryResult, 
  TableSchema,
  Transaction,
  WhereClause,
  JoinClause
} from '../types/database';
import { SQLiteDriver } from '../drivers/sqlite/sqlite-driver';

export class Database {
  private driver: DatabaseDriver;

  constructor(driverType: 'sqlite' = 'sqlite') {
    switch (driverType) {
      case 'sqlite':
        this.driver = new SQLiteDriver();
        break;
      default:
        throw new Error(`Unsupported database type: ${driverType}`);
    }
  }

  async connect(config: DatabaseConfig): Promise<void> {
    return this.driver.connect(config);
  }

  async disconnect(): Promise<void> {
    return this.driver.disconnect();
  }

  async createDatabase(name: string): Promise<QueryResult> {
    return this.driver.createDatabase(name);
  }

  async createTable(schema: TableSchema): Promise<QueryResult> {
    return this.driver.createTable(schema);
  }

  async beginTransaction(): Promise<Transaction> {
    return this.driver.beginTransaction();
  }

  async insert(table: string, data: Record<string, any>): Promise<QueryResult> {
    return this.driver.insert(table, data);
  }

  async select(
    table: string, 
    columns?: string[], 
    where?: WhereClause,
    joins?: JoinClause[]
  ): Promise<QueryResult> {
    return this.driver.select(table, columns, where, joins);
  }

  async update(table: string, data: Record<string, any>, where: WhereClause): Promise<QueryResult> {
    return this.driver.update(table, data, where);
  }

  async delete(table: string, where: WhereClause): Promise<QueryResult> {
    return this.driver.delete(table, where);
  }
}
