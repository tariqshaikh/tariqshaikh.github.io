/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const NJ_STATE_OUTLINE = "M75,15 L115,12 L138,42 L160,32 L180,42 L215,52 L230,95 L220,125 L225,155 L205,175 L200,205 L240,215 L250,255 L270,315 L250,365 L220,375 L190,415 L180,465 L160,485 L140,445 L100,455 L80,435 L30,395 L30,365 L50,355 L60,315 L58,45 Z";

export const COUNTY_CENTERS: Record<string, { x: number, y: number }> = {
  'Sussex': { x: 100, y: 45 },
  'Passaic': { x: 155, y: 65 },
  'Bergen': { x: 200, y: 90 },
  'Warren': { x: 60, y: 90 },
  'Morris': { x: 115, y: 110 },
  'Essex': { x: 165, y: 130 },
  'Hudson': { x: 205, y: 150 },
  'Hunterdon': { x: 80, y: 160 },
  'Somerset': { x: 130, y: 165 },
  'Union': { x: 170, y: 170 },
  'Middlesex': { x: 170, y: 200 },
  'Mercer': { x: 115, y: 210 },
  'Monmouth': { x: 215, y: 240 },
  'Burlington': { x: 160, y: 280 },
  'Ocean': { x: 235, y: 320 },
  'Camden': { x: 110, y: 315 },
  'Gloucester': { x: 75, y: 335 },
  'Atlantic': { x: 170, y: 370 },
  'Salem': { x: 60, y: 385 },
  'Cumberland': { x: 115, y: 420 },
  'Cape May': { x: 165, y: 450 }
};

export const NJ_COUNTY_PATHS = [
  { id: 'Sussex', name: 'Sussex', d: 'M75,15 L115,12 L138,42 L125,75 L95,85 L65,75 L58,45 Z' },
  { id: 'Passaic', name: 'Passaic', d: 'M138,42 L160,32 L180,42 L175,65 L160,85 L150,105 L135,95 L125,75 Z' },
  { id: 'Bergen', name: 'Bergen', d: 'M180,42 L215,52 L230,95 L220,125 L190,135 L175,115 L175,65 Z' },
  { id: 'Warren', name: 'Warren', d: 'M58,45 L65,75 L95,85 L85,115 L55,135 L35,115 L45,65 Z' },
  { id: 'Morris', name: 'Morris', d: 'M95,85 L125,75 L135,95 L150,105 L145,135 L120,145 L90,135 L85,115 Z' },
  { id: 'Essex', name: 'Essex', d: 'M150,105 L175,115 L190,135 L180,155 L160,150 L145,135 Z' },
  { id: 'Hudson', name: 'Hudson', d: 'M190,135 L220,125 L225,155 L205,175 L190,165 L180,155 Z' },
  { id: 'Hunterdon', name: 'Hunterdon', d: 'M55,135 L85,115 L95,135 L120,145 L110,185 L80,205 L50,185 Z' },
  { id: 'Somerset', name: 'Somerset', d: 'M120,145 L145,135 L160,150 L150,165 L140,185 L120,195 L110,185 Z' },
  { id: 'Union', name: 'Union', d: 'M160,150 L180,155 L190,165 L170,185 L150,180 L150,165 Z' },
  { id: 'Middlesex', name: 'Middlesex', d: 'M140,185 L150,180 L170,185 L190,165 L205,175 L200,205 L170,225 L140,215 Z' },
  { id: 'Mercer', name: 'Mercer', d: 'M80,205 L110,185 L120,195 L140,185 L140,215 L120,235 L90,235 Z' },
  { id: 'Monmouth', name: 'Monmouth', d: 'M200,205 L240,215 L250,255 L220,275 L190,265 L170,225 Z' },
  { id: 'Burlington', name: 'Burlington', d: 'M120,235 L140,215 L170,225 L190,265 L220,275 L200,325 L160,345 L130,325 L110,285 L120,265 Z' },
  { id: 'Ocean', name: 'Ocean', d: 'M220,275 L250,255 L270,315 L250,365 L220,375 L200,325 Z' },
  { id: 'Camden', name: 'Camden', d: 'M110,285 L130,325 L120,345 L90,335 L80,305 Z' },
  { id: 'Gloucester', name: 'Gloucester', d: 'M80,305 L90,335 L80,365 L50,355 L60,315 Z' },
  { id: 'Atlantic', name: 'Atlantic', d: 'M120,345 L200,325 L220,375 L190,415 L150,405 L120,385 Z' },
  { id: 'Salem', name: 'Salem', d: 'M50,355 L80,365 L90,385 L60,415 L30,395 L30,365 Z' },
  { id: 'Cumberland', name: 'Cumberland', d: 'M90,385 L120,385 L150,405 L140,445 L100,455 L80,435 Z' },
  { id: 'Cape May', name: 'Cape May', d: 'M150,405 L190,415 L180,465 L160,485 L140,445 Z' }
];
