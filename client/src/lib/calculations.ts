import { TileConfiguration } from '@/types/inspection';

/**
 * Converts dimension string (e.g., "2,44m") to meters as number
 */
export function parseDimension(dimension: string): number {
  return parseFloat(dimension.replace('m', '').replace(',', '.'));
}

/**
 * Calculate gross area in square meters
 */
export function calculateGrossArea(length: string, width: string, quantity: number): number {
  const lengthM = parseDimension(length);
  const widthM = parseDimension(width);
  return lengthM * widthM * quantity;
}

/**
 * Calculate corrected area with 12% overlap correction
 */
export function calculateCorrectedArea(grossArea: number): number {
  return grossArea * 0.88; // 12% reduction for overlap
}

/**
 * Calculate area in cm² for database storage (better precision)
 */
export function areaToSquareCm(areaM2: number): number {
  return Math.round(areaM2 * 10000); // 1 m² = 10000 cm²
}

/**
 * Convert cm² back to m² for display
 */
export function squareCmToArea(areaCm2: number): number {
  return areaCm2 / 10000;
}

/**
 * Calculate totals for all tiles
 */
export function calculateTileTotals(tiles: TileConfiguration[]) {
  const totalGrossArea = tiles.reduce((sum, tile) => sum + squareCmToArea(tile.grossArea), 0);
  const totalCorrectedArea = tiles.reduce((sum, tile) => sum + squareCmToArea(tile.correctedArea), 0);
  const totalQuantity = tiles.reduce((sum, tile) => sum + tile.quantity, 0);
  
  return {
    totalGrossArea,
    totalCorrectedArea,
    totalQuantity,
    totalTypes: tiles.length
  };
}

/**
 * Update tile configuration with calculated areas
 */
export function updateTileAreas(tile: Partial<TileConfiguration>): TileConfiguration {
  const { length, width, quantity = 0 } = tile;
  
  if (!length || !width || quantity <= 0) {
    return {
      ...tile,
      grossArea: 0,
      correctedArea: 0
    } as TileConfiguration;
  }
  
  const grossAreaM2 = calculateGrossArea(length, width, quantity);
  const correctedAreaM2 = calculateCorrectedArea(grossAreaM2);
  
  return {
    ...tile,
    grossArea: areaToSquareCm(grossAreaM2),
    correctedArea: areaToSquareCm(correctedAreaM2)
  } as TileConfiguration;
}

/**
 * Validate tile configuration compatibility
 */
export function validateTileConfiguration(thickness: string, length: string, width: string): string | null {
  // 8mm tiles with 3,66m length can only use 1,10m width
  if (thickness === "8mm" && length === "3,66m" && width !== "1,10m") {
    return "Telhas de 8mm com comprimento 3,66m só permitem largura 1,10m";
  }
  
  return null;
}

/**
 * Format area for display
 */
export function formatArea(areaCm2: number): string {
  const areaM2 = squareCmToArea(areaCm2);
  return `${areaM2.toFixed(2)}m²`;
}

/**
 * Generate tile description for report
 */
export function generateTileDescription(tile: TileConfiguration): string {
  const { quantity, thickness, length, width } = tile;
  return `${quantity}: Telha Ondulada ${thickness} CRFS, dimensão ${length} x ${width}`;
}
