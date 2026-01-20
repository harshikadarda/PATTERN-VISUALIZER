
import { GoogleGenAI } from "@google/genai";
import type { GridData, Position } from '../types';

const gridToString = (grid: GridData): string => {
  if (!grid || grid.length === 0 || grid[0].length === 0) return "[Empty Grid]";
  return '`\n' + grid.map(row => row.map(cell => (cell ? '■' : '□')).join(' ')).join('\n') + '\n`';
};

export const getPatternExplanation = async (
  pattern: GridData,
  searchGrid: GridData,
  foundPositions: Position[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const patternString = gridToString(pattern);
  const searchGridString = gridToString(searchGrid);
  const positionsString = foundPositions.length > 0 ? 
    foundPositions.map(p => `(row: ${p.row}, col: ${p.col})`).join(', ') : 
    'no occurrences found';

  const prompt = `
    I am working on a pattern recognition application.
    I searched for a specific pattern within a larger grid.
    
    This was the pattern:
    ${patternString}

    This was the grid I searched in:
    ${searchGridString}

    The search algorithm found ${foundPositions.length} occurrence(s) of the pattern at the following top-left coordinates: ${positionsString}.

    Please provide a short, user-friendly, one-paragraph explanation of these results. Explain that the algorithm scanned the larger grid to find all exact matches of the smaller pattern.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "An error occurred while generating an explanation. Please check the console for details.";
  }
};
