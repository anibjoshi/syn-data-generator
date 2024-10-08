import React, { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { DatabaseType, DataType, dataTypes, modifierExamples, modifierPlaceholders } from '../../utils/constants'
import styles from './SchemaTable.module.css'
import { Tooltip } from '../Tooltip'

interface SchemaTableProps {
  parsedSchema: ColumnType[];
  database: DatabaseType;
  onSchemaChange: (newSchema: ColumnType[]) => void;
}

interface ColumnType {
  name: string;
  type: DataType;
  modifier?: string;
}

const unsupportedTypes: DataType[] = ['Boolean', 'JSON', 'Geometric', 'Network', 'XML', 'Key-Value', 'UUID', 'Binary', 'ENUM'];

export default function SchemaTable({ parsedSchema, database, onSchemaChange }: SchemaTableProps) {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const uniqueDataTypes = Array.from(new Set(Object.values(dataTypes[database]).flat()));

  const handleTypeChange = (originalIndex: number, newType: DataType) => {
    const newSchema = parsedSchema.map((col, i) => 
      i === originalIndex ? { ...col, type: newType, modifier: isTypeSupported(newType) ? col.modifier : undefined } : col
    );
    onSchemaChange(newSchema);
  };

  const handleModifierChange = (originalIndex: number, newModifier: string) => {
    const newSchema = parsedSchema.map((col, i) => 
      i === originalIndex ? { ...col, modifier: newModifier } : col
    );
    onSchemaChange(newSchema);
  };

  const handleTooltipToggle = (index: number, event: React.MouseEvent) => {
    if (activeTooltip === index) {
      setActiveTooltip(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
      setActiveTooltip(index);
    }
  };

  const handleDeleteColumn = (originalIndex: number) => {
    const newSchema = parsedSchema.filter((_, index) => index !== originalIndex);
    onSchemaChange(newSchema);
  };

  // Filter out rows with "Unknown" column names
  const validColumns = parsedSchema.filter(column => column.name !== 'Unknown');

  if (validColumns.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Schema</h3>
        <p>No valid columns found in the schema. Please check your CREATE TABLE statement.</p>
      </div>
    );
  }

  const isTypeSupported = (type: DataType) => !unsupportedTypes.includes(type);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Schema</h3>
      <div className="overflow-x-auto relative">
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeader}>
              <th className={styles.tableHeaderCell}>Column Name</th>
              <th className={styles.tableHeaderCell}>Data Type</th>
              <th className={styles.tableHeaderCell}>Modifiers</th>
              <th className={styles.tableHeaderCell}></th>
            </tr>
          </thead>
          <tbody>
            {parsedSchema.map((column, index) => (
              column.name !== 'Unknown' && (
                <tr key={index} className={`${styles.tableRow} group`}>
                  <td className={styles.tableCell}>
                    <span className={styles.columnName}>{column.name}</span>
                  </td>
                  <td className={styles.tableCell}>
                    <select
                      value={column.type}
                      onChange={(e) => handleTypeChange(index, e.target.value as DataType)}
                      className={styles.select}
                    >
                      {uniqueDataTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </td>
                  <td className={styles.tableCell}>
                    {isTypeSupported(column.type) ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={column.modifier || ''}
                          onChange={(e) => handleModifierChange(index, e.target.value)}
                          className={styles.input}
                          // Removed the placeholder attribute
                        />
                        <button
                          onClick={(e) => handleTooltipToggle(index, e)}
                          className={styles.tooltipButton}
                        >
                          <HelpCircle size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className={styles.unsupportedType}>
                        Type not supported in current version
                      </div>
                    )}
                  </td>
                  <td className={styles.tableCell}>
                    <button
                      onClick={() => handleDeleteColumn(index)}
                      className={`${styles.deleteButton} text-red-500 hover:text-red-700 transition-colors duration-200 opacity-0 group-hover:opacity-100`}
                      title="Remove column"
                    >
                      <X size={18} />
                    </button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
      <Tooltip
        content={activeTooltip !== null && isTypeSupported(parsedSchema[activeTooltip].type) ? modifierExamples[parsedSchema[activeTooltip].type] || "No specific modifiers available" : ""}
        isOpen={activeTooltip !== null && isTypeSupported(parsedSchema[activeTooltip].type)}
        onClose={() => setActiveTooltip(null)}
        position={tooltipPosition}
      />
    </div>
  )
}