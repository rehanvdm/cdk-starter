/**
 * Generate a random integer between min and max (inclusive)
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns A random integer between min and max
 */
export function getRandomNumberBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
