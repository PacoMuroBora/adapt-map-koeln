/**
 * Valid postal codes (PLZ) for Cologne (Köln), Germany.
 * Source: https://www.plz-info.net/plz-koeln.php
 */
export const COLOGNE_PLZ_CODES = new Set([
  '50667', '50668', '50670', '50672', '50674', '50676', '50677', '50678', '50679',
  '50733', '50735', '50737', '50739', '50765', '50767', '50769',
  '50823', '50825', '50827', '50829', '50858', '50859',
  '50931', '50933', '50935', '50937', '50939', '50968', '50969',
  '50996', '50997', '50999',
  '51061', '51063', '51065', '51067', '51069',
  '51103', '51105', '51107', '51109', '51143', '51145', '51147', '51149',
])

export function isValidColognePlz(plz: string): boolean {
  return plz.length === 5 && COLOGNE_PLZ_CODES.has(plz)
}
