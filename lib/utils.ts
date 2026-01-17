/**
 * Utility function to merge Tailwind CSS classes
 * Versão simplificada que funciona sem dependências externas
 */
type ClassValue = string | undefined | null | boolean | { [key: string]: boolean };

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object' && !Array.isArray(input)) {
      for (const key in input) {
        if (input[key]) {
          classes.push(key);
        }
      }
    }
  }
  
  // Remove classes duplicadas e retorna
  return [...new Set(classes)].join(' ').trim();
}

