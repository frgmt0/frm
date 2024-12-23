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

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

export interface JoinClause {
  type: JoinType;
  table: string;
  on: {
    leftField: string;
    rightField: string;
  };
}

export interface WhereOperator {
  eq?: any;    // equals
  neq?: any;   // not equals
  gt?: any;    // greater than
  gte?: any;   // greater than or equal
  lt?: any;    // less than
  lte?: any;   // less than or equal
  like?: string; // LIKE pattern
  in?: any[];   // IN array of values
  between?: [any, any]; // BETWEEN two values
  isNull?: boolean; // IS NULL
}

export type WhereClause = {
  [field: string]: WhereOperator | any; // Direct value means eq
};

export interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface DatabaseDriver {
  connect(config: DatabaseConfig): Promise<void>;
  disconnect(): Promise<void>;
  createDatabase(name: string): Promise<QueryResult>;
  createTable(schema: TableSchema): Promise<QueryResult>;
  
  // Transaction support
  beginTransaction(): Promise<Transaction>;
  
  // Enhanced CRUD operations
  insert(table: string, data: Record<string, any>): Promise<QueryResult>;
  select(
    table: string, 
    columns?: string[], 
    where?: WhereClause,
    joins?: JoinClause[]
  ): Promise<QueryResult>;
  update(
    table: string, 
    data: Record<string, any>, 
    where: WhereClause
  ): Promise<QueryResult>;
  delete(
    table: string, 
    where: WhereClause
  ): Promise<QueryResult>;
}
