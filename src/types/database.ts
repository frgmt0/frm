export interface DatabaseConfig {
  filename?: string;  // For SQLite
  host?: string;      // For future database types
  port?: number;      // For future database types
  username?: string;  // For future database types
  password?: string;  // For future database types
  database?: string;  // For future database types
}

export interface ColumnDefinition {
  name: string;
  type: string;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  nullable?: boolean;
  unique?: boolean;
  default?: any;
}

export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
}

export interface QueryResult {
  success: boolean;
  data?: any;
  error?: Error;
}

export interface DatabaseDriver {
  connect(config: DatabaseConfig): Promise<void>;
  disconnect(): Promise<void>;
  createDatabase(name: string): Promise<QueryResult>;
  createTable(schema: TableSchema): Promise<QueryResult>;
  insert(table: string, data: Record<string, any>): Promise<QueryResult>;
  select(table: string, columns?: string[], where?: Record<string, any>): Promise<QueryResult>;
  update(table: string, data: Record<string, any>, where: Record<string, any>): Promise<QueryResult>;
}
