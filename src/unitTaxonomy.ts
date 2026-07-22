/**
 * Unit Taxonomy System for GraphLab AI
 * 
 * Maps physical quantity categories to their valid units,
 * and provides auto-detection of quantity category from column names.
 * This ensures unit dropdowns only show relevant units per column.
 */

// ─── Physical Quantity Categories ────────────────────────────────────────────

export type QuantityCategory =
  | 'frequency'
  | 'voltage'
  | 'current'
  | 'length'
  | 'time'
  | 'temperature'
  | 'resistance'
  | 'power'
  | 'force'
  | 'area'
  | 'intensity'
  | 'angle'
  | 'dimensionless'
  | 'unknown';

/**
 * Master taxonomy: each physical quantity → its allowed unit strings.
 * Order matters: the first unit in each array is the "default" for that category.
 */
export const UNIT_TAXONOMY: Record<QuantityCategory, string[]> = {
  frequency:      ['Hz', 'kHz', 'MHz', 'GHz', '×10¹⁴ Hz'],
  voltage:        ['V', 'mV', 'kV', 'µV'],
  current:        ['mA', 'A', 'µA', 'nA'],
  length:         ['cm', 'mm', 'm', 'µm', 'nm'],
  time:           ['s', 'ms', 'min', 'hr'],
  temperature:    ['°C', 'K', '°F'],
  resistance:     ['Ω', 'kΩ', 'MΩ'],
  power:          ['W', 'mW', 'µW', 'kW'],
  force:          ['N', 'kN', 'mN'],
  area:           ['cm²', 'mm²', 'm²'],
  intensity:      ['µW', 'mW', 'W', 'lux', 'cd'],
  angle:          ['°', 'rad'],
  dimensionless:  ['', '(unitless)'],
  unknown:        [],
};

// ─── Column Name → Category Auto-Detection ───────────────────────────────────

/**
 * Patterns to auto-detect the physical quantity from a column header name.
 * Each entry: [regex pattern (case-insensitive), category].
 * Order matters: more specific patterns first to avoid false matches.
 */
const COLUMN_NAME_PATTERNS: [RegExp, QuantityCategory][] = [
  // Frequency (must be before "force" because "f" alone is ambiguous)
  [/frequen|freq[\s._-]|ν|nu[\s._-]|×10.*hz/i, 'frequency'],

  // Voltage / Potential / EMF / Stopping Voltage
  [/voltag|potential|emf|v[_s₀ₛ]|stopping.?volt|p\.?d\.?|pdiff/i, 'voltage'],

  // Current (must be before "currency" — but that's not a lab term)
  [/\bcurrent\b|ampere|\bI\b(?!nten)/i, 'current'],

  // Resistance
  [/resistan|impedanc/i, 'resistance'],

  // Power (must be before "position")
  [/\bpower\b|\bP\b(?!oten|endu)/i, 'power'],

  // Force / Load / Weight
  [/\bforce\b|\bload\b|\bweight\b|\bF\b(?!req)/i, 'force'],

  // Temperature
  [/temperat|°C|°F|\bT\b(?!ime|otal)/i, 'temperature'],

  // Time / Period
  [/\btime\b|period|\bt\b(?!emp)/i, 'time'],

  // Angle
  [/\bangle\b|θ|theta|degrees?\b/i, 'angle'],

  // Area (derived, e.g. D²)
  [/\barea\b|D²|d²|diameter.*squared/i, 'area'],

  // Length / Distance / Extension / Diameter / Balance Length
  [/length|distance|extension|diameter|displacement|position|balance.?len|ΔL|\bD\b(?!²)|\bL\b(?!og)|\bl\b(?!og)/i, 'length'],

  // Intensity / Output
  [/intensit|output.?int|irradianc/i, 'intensity'],

  // Ring number, S.No., index — dimensionless
  [/ring.?num|s\.?no|index|\bn\b/i, 'dimensionless'],

  // Reverse current (special case — still current)
  [/reverse.?current/i, 'current'],

  // Reverse voltage (special case — still voltage)
  [/reverse.?volt/i, 'voltage'],
];

/**
 * Detect the physical quantity category from a column name string.
 * Returns 'unknown' if no pattern matches.
 */
export function detectQuantityCategory(columnName: string): QuantityCategory {
  if (!columnName || columnName.trim().length === 0) return 'unknown';

  for (const [pattern, category] of COLUMN_NAME_PATTERNS) {
    if (pattern.test(columnName)) {
      return category;
    }
  }

  return 'unknown';
}

/**
 * Detect category from a known unit string (reverse lookup).
 * Used as a fallback when the column name doesn't match any pattern.
 */
export function detectCategoryFromUnit(unit: string): QuantityCategory {
  if (!unit) return 'unknown';

  for (const [category, units] of Object.entries(UNIT_TAXONOMY) as [QuantityCategory, string[]][]) {
    if (units.includes(unit)) {
      return category;
    }
  }
  return 'unknown';
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get the list of valid units for a given column, based on its name and/or
 * its current (default) unit.
 *
 * Strategy:
 * 1. Try to detect category from column name
 * 2. If that fails, try to detect from the current unit
 * 3. If both fail, return a small sensible fallback list (not the full dump)
 *
 * The current unit is always included in the returned list (even if it doesn't
 * belong to the detected category), so the dropdown never loses the active selection.
 */
export function getUnitsForColumn(columnName: string, currentUnit?: string): string[] {
  // Step 1: detect from column name
  let category = detectQuantityCategory(columnName);

  // Step 2: fallback — detect from current unit
  if (category === 'unknown' && currentUnit) {
    category = detectCategoryFromUnit(currentUnit);
  }

  // Step 3: if still unknown, return a minimal generic list
  if (category === 'unknown') {
    const fallback = ['V', 'mV', 'mA', 'A', 'cm', 'mm', 's', 'Hz', 'Ω', 'N', 'W', '°C'];
    if (currentUnit && !fallback.includes(currentUnit)) {
      return [currentUnit, ...fallback];
    }
    return fallback;
  }

  // Get the category's units
  const units = [...UNIT_TAXONOMY[category]];

  // Ensure the current unit is in the list
  if (currentUnit && !units.includes(currentUnit)) {
    units.unshift(currentUnit);
  }

  // Remove empty strings
  return units.filter(u => u.length > 0);
}
