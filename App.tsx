import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { GridData, GridSize, Position } from './types';
import Grid from './components/Grid';

const MIN_SIZE = 2;
const MAX_SIZE = 12;

const createGrid = (rows: number, cols: number): GridData => {
  return Array(rows).fill(null).map(() => Array(cols).fill(false));
};

const Header: React.FC = () => (
    <header className="text-center p-4">
        <h1 className="text-4xl font-bold text-cyan-400 tracking-tight">Pattern Recognition Visualizer</h1>
        <p className="text-gray-400 mt-2">Define a pattern, draw a search space, and find where it appears.</p>
    </header>
);

const SizeInput: React.FC<{label: string; value: number; onChange: (value: number) => void;}> = ({ label, value, onChange }) => (
    <div className="flex flex-col items-center">
        <label className="text-sm text-gray-400 mb-1">{label}</label>
        <input
            type="number"
            min={MIN_SIZE}
            max={MAX_SIZE}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="w-16 bg-gray-700 border border-gray-600 text-white rounded-md text-center p-1 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        />
    </div>
);


const App: React.FC = () => {
    type Shape = 'freehand' | 'square' | 'rectangle' | 'line' | 'cross';

    const [patternSize, setPatternSize] = useState<GridSize>({ rows: 3, cols: 3 });
    const [searchSize, setSearchSize] = useState<GridSize>({ rows: 8, cols: 8 });

    const [patternGrid, setPatternGrid] = useState<GridData>(() => createGrid(patternSize.rows, patternSize.cols));
    const [searchGrid, setSearchGrid] = useState<GridData>(() => createGrid(searchSize.rows, searchSize.cols));
    
    const [selectedShape, setSelectedShape] = useState<Shape>('freehand');

    const [foundPositions, setFoundPositions] = useState<Position[]>([]);
    const [hasSearched, setHasSearched] = useState<boolean>(false);

    useEffect(() => {
        setPatternGrid(createGrid(patternSize.rows, patternSize.cols));
    }, [patternSize]);

    useEffect(() => {
        setSearchGrid(createGrid(searchSize.rows, searchSize.cols));
    }, [searchSize]);


    const handleGridCellClick = useCallback((
        grid: GridData, 
        setter: React.Dispatch<React.SetStateAction<GridData>>, 
        row: number, 
        col: number
    ) => {
        const newGrid = grid.map(r => [...r]);
        newGrid[row][col] = !newGrid[row][col];
        setter(newGrid);
    }, []);

    const drawShape = useCallback((shape: Shape, size: GridSize, center: Position): GridData => {
        const newGrid = createGrid(size.rows, size.cols);
        const { rows, cols } = size;
        const { row: r, col: c } = center;

        const setCell = (row: number, col: number) => {
            if (row >= 0 && row < rows && col >= 0 && col < cols) {
                newGrid[row][col] = true;
            }
        };

        switch (shape) {
            case 'square': // 3x3 square
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        setCell(r + i, c + j);
                    }
                }
                break;
            case 'rectangle': // 2x3 rectangle
                for (let i = -1; i <= 0; i++) {
                    for (let j = -1; j <= 1; j++) {
                        setCell(r + i, c + j);
                    }
                }
                break;
            case 'line': // horizontal line of 3
                setCell(r, c - 1);
                setCell(r, c);
                setCell(r, c + 1);
                break;
            case 'cross': // 3x3 cross
                setCell(r, c);
                setCell(r - 1, c);
                setCell(r + 1, c);
                setCell(r, c - 1);
                setCell(r, c + 1);
                break;
        }
        return newGrid;
    }, []);

    const handlePatternCellClick = useCallback((row: number, col: number) => {
        if (selectedShape === 'freehand') {
            handleGridCellClick(patternGrid, setPatternGrid, row, col);
        } else {
            const newGrid = drawShape(selectedShape, patternSize, { row, col });
            setPatternGrid(newGrid);
        }
    }, [selectedShape, patternGrid, handleGridCellClick, drawShape, patternSize]);

    const potentialMatches = useMemo(() => {
        const patternRows = patternGrid.length;
        const patternCols = patternGrid[0]?.length || 0;
        const searchRows = searchGrid.length;
        const searchCols = searchGrid[0]?.length || 0;

        const isPatternEmpty = patternGrid.every(row => row.every(cell => !cell));

        if (patternRows === 0 || patternCols === 0 || isPatternEmpty) return [];
        
        const found: Position[] = [];
        for (let r = 0; r <= searchRows - patternRows; r++) {
            for (let c = 0; c <= searchCols - patternCols; c++) {
                let match = true;
                for (let pr = 0; pr < patternRows; pr++) {
                    for (let pc = 0; pc < patternCols; pc++) {
                        if (patternGrid[pr][pc] !== searchGrid[r + pr][c + pc]) {
                            match = false;
                            break;
                        }
                    }
                    if (!match) break;
                }
                if (match) {
                    found.push({ row: r, col: c });
                }
            }
        }
        return found;
    }, [patternGrid, searchGrid]);

    const handleSearch = useCallback(() => {
        setHasSearched(true);
        setFoundPositions(potentialMatches);
    }, [potentialMatches]);
    
    const handleReset = useCallback(() => {
        setPatternGrid(createGrid(patternSize.rows, patternSize.cols));
        setSearchGrid(createGrid(searchSize.rows, searchSize.cols));
        setFoundPositions([]);
        setHasSearched(false);
        setSelectedShape('freehand');
    }, [patternSize, searchSize]);
    
    const isSearchDisabled = useMemo(() => {
        return patternGrid.every(row => row.every(cell => !cell));
    }, [patternGrid]);

    const shapeTools: {id: Shape, name: string}[] = [
        { id: 'freehand', name: 'Freehand' },
        { id: 'square', name: 'Square' },
        { id: 'rectangle', name: 'Rectangle' },
        { id: 'line', name: 'Line' },
        { id: 'cross', name: 'Cross' },
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Header />

                <main className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Controls and Grids */}
                    <div className="flex flex-col gap-8">
                        {/* Controls */}
                        <div className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-around items-center gap-4">
                           <div className="flex gap-4">
                             <SizeInput label="Pattern Rows" value={patternSize.rows} onChange={(v) => setPatternSize({...patternSize, rows: v})} />
                             <SizeInput label="Pattern Cols" value={patternSize.cols} onChange={(v) => setPatternSize({...patternSize, cols: v})} />
                           </div>
                           <div className="flex gap-4">
                             <SizeInput label="Search Rows" value={searchSize.rows} onChange={(v) => setSearchSize({...searchSize, rows: v})} />
                             <SizeInput label="Search Cols" value={searchSize.cols} onChange={(v) => setSearchSize({...searchSize, cols: v})} />
                           </div>
                        </div>

                        {/* Shape Tools */}
                        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                           <h3 className="text-lg font-semibold text-gray-200 mb-3 text-center">Pattern Tools</h3>
                           <div className="flex justify-center flex-wrap gap-2">
                                {shapeTools.map((tool) => (
                                    <button
                                        key={tool.id}
                                        onClick={() => setSelectedShape(tool.id)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                            selectedShape === tool.id
                                                ? 'bg-cyan-500 text-white shadow-md'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        {tool.name}
                                    </button>
                                ))}
                           </div>
                        </div>

                        {/* Input Grids */}
                        <Grid 
                            title="1. Define Your Pattern"
                            gridData={patternGrid}
                            onCellClick={handlePatternCellClick}
                        />
                         <Grid 
                            title="2. Create the Search Space"
                            gridData={searchGrid}
                            onCellClick={(row, col) => handleGridCellClick(searchGrid, setSearchGrid, row, col)}
                        />
                    </div>

                     {/* Right Column: Actions and Results */}
                    <div className="flex flex-col gap-8">
                        {/* Actions */}
                        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                           <h3 className="text-lg font-semibold text-gray-200 mb-3 text-center">3. Find Pattern</h3>
                           <div className="flex justify-center gap-4">
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearchDisabled}
                                    className="px-6 py-2 bg-cyan-500 text-white font-bold rounded-lg shadow-md hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                >
                                    Find Pattern
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-6 py-2 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-600 transition-colors"
                                >
                                    Reset
                                </button>
                           </div>
                           {isSearchDisabled && <p className="text-xs text-center mt-2 text-gray-400">Draw a pattern to enable search.</p>}
                        </div>

                        {/* Results */}
                        {hasSearched && (
                             <div className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col gap-6">
                                <Grid 
                                    title={`Result: Found ${foundPositions.length} instance(s)`}
                                    gridData={searchGrid}
                                    enableHighlighting={true}
                                    highlightedPositions={foundPositions}
                                    patternSize={patternSize}
                                />
                            </div>
                        )}
                        {!hasSearched && (
                            <div className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col gap-6 items-center justify-center h-full">
                                <p className="text-gray-400 text-center">Your results will be displayed here after you perform a search.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;