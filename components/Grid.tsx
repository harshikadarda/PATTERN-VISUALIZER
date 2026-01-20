import React from 'react';
import type { GridData, GridSize, Position } from '../types';

interface GridProps {
  title: string;
  gridData: GridData;
  onCellClick?: (row: number, col: number) => void;
  highlightedPositions?: Position[];
  patternSize?: GridSize;
  enableHighlighting?: boolean;
}

const Grid: React.FC<GridProps> = ({
  title,
  gridData,
  onCellClick,
  highlightedPositions = [],
  patternSize,
  enableHighlighting = false,
}) => {
  const rows = gridData.length;
  const cols = rows > 0 ? gridData[0].length : 0;

  const isHighlighted = (row: number, col: number): boolean => {
    if (!enableHighlighting || !patternSize) return false;
    return highlightedPositions.some(pos => 
      row >= pos.row && row < pos.row + patternSize.rows &&
      col >= pos.col && col < pos.col + patternSize.cols
    );
  };

  const getCellClasses = (isFilled: boolean, isHighlight: boolean) => {
    const baseClass = "w-6 h-6 sm:w-8 sm:h-8 border border-gray-600 transition-all duration-150";
    if (isHighlight) {
      return `${baseClass} ${isFilled ? 'bg-emerald-400' : 'bg-emerald-600'} scale-110 shadow-lg shadow-emerald-500/50`;
    }
    if (isFilled) {
      return `${baseClass} bg-cyan-400`;
    }
    return `${baseClass} bg-gray-700 ${onCellClick ? 'hover:bg-gray-600 cursor-pointer' : 'cursor-default'}`;
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md w-full">
      <h3 className="text-lg font-semibold text-gray-200 mb-3 text-center">{title}</h3>
      {rows > 0 && cols > 0 ? (
         <div className="flex justify-center">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {gridData.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={getCellClasses(cell, isHighlighted(rowIndex, colIndex))}
                    onClick={() => onCellClick && onCellClick(rowIndex, colIndex)}
                    aria-label={`Cell at row ${rowIndex}, column ${colIndex}`}
                  />
                ))
              )}
            </div>
         </div>
      ) : (
        <p className="text-gray-400 text-center text-sm">Grid not initialized.</p>
      )}
    </div>
  );
};

export default Grid;