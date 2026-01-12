import { memo } from "react";
import { TableSchema } from "../../data/database-schema";
import { Table as TableIcon, Key, Link2, Database } from "lucide-react";
import { useLanguage } from "../../providers/LanguageProvider";

interface DatabaseTableProps {
  table: TableSchema;
  compact?: boolean;
}

/**
 * DatabaseTable Component
 * Hiển thị chi tiết một bảng dữ liệu với các thuộc tính
 */
export const DatabaseTable = memo(({ table, compact = false }: DatabaseTableProps) => {
  const { t } = useLanguage();

  if (compact) {
    // Compact mode - chỉ hiển thị bảng columns, không có wrapper
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('database.columnName')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('database.dataType')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('database.constraints')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('database.description')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {table.columns.map((column) => (
              <tr 
                key={column.name} 
                className="hover:bg-muted/20 transition-colors duration-150"
              >
                {/* Column Name */}
                <td className="px-4 py-3">
                  <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                    {column.name}
                  </code>
                </td>

                {/* Data Type */}
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-muted-foreground">
                    {column.type}
                  </span>
                </td>

                {/* Constraints */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    {column.primaryKey && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
                        <Key className="w-3 h-3" />
                        PK
                      </span>
                    )}
                    {column.foreignKey && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        <Link2 className="w-3 h-3" />
                        FK
                      </span>
                    )}
                    {column.unique && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        UQ
                      </span>
                    )}
                    {!column.nullable && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                        NOT NULL
                      </span>
                    )}
                  </div>
                </td>

                {/* Description */}
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{column.description}</p>
                    {column.default && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Default: <code className="bg-muted/50 px-1 py-0.5 rounded">{column.default}</code>
                      </p>
                    )}
                    {column.foreignKey && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                        → {column.foreignKey.table}.{column.foreignKey.column}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Footer Stats */}
        <div className="bg-muted/20 px-4 py-3 border-t border-border/40 mt-2 rounded-lg">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{table.columns.length} {t('database.columns')}</span>
            <div className="flex items-center gap-4">
              <span>
                {table.columns.filter(c => c.primaryKey).length} PK
              </span>
              <span>
                {table.columns.filter(c => c.foreignKey).length} FK
              </span>
              <span>
                {table.columns.filter(c => c.unique).length} UQ
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/40 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 px-6 py-4 border-b border-border/40">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <TableIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-primary" />
              <code className="text-primary">{table.name}</code>
            </h3>
            <p className="text-sm text-muted-foreground">{table.description}</p>
          </div>
        </div>
      </div>

      {/* Columns Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('database.columnName')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('database.dataType')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('database.constraints')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('database.description')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {table.columns.map((column) => (
              <tr 
                key={column.name} 
                className="hover:bg-muted/20 transition-colors duration-150"
              >
                {/* Column Name */}
                <td className="px-4 py-3">
                  <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                    {column.name}
                  </code>
                </td>

                {/* Data Type */}
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-muted-foreground">
                    {column.type}
                  </span>
                </td>

                {/* Constraints */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    {column.primaryKey && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
                        <Key className="w-3 h-3" />
                        PK
                      </span>
                    )}
                    {column.foreignKey && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        <Link2 className="w-3 h-3" />
                        FK
                      </span>
                    )}
                    {column.unique && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        UQ
                      </span>
                    )}
                    {!column.nullable && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                        NOT NULL
                      </span>
                    )}
                  </div>
                </td>

                {/* Description */}
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{column.description}</p>
                    {column.default && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Default: <code className="bg-muted/50 px-1 py-0.5 rounded">{column.default}</code>
                      </p>
                    )}
                    {column.foreignKey && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                        → {column.foreignKey.table}.{column.foreignKey.column}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      <div className="bg-muted/20 px-6 py-3 border-t border-border/40">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{table.columns.length} {t('database.columns')}</span>
          <div className="flex items-center gap-4">
            <span>
              {table.columns.filter(c => c.primaryKey).length} PK
            </span>
            <span>
              {table.columns.filter(c => c.foreignKey).length} FK
            </span>
            <span>
              {table.columns.filter(c => c.unique).length} UQ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

DatabaseTable.displayName = "DatabaseTable";