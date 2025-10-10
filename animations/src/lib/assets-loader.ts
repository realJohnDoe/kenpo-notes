// Central loader for all assets using Vite's glob imports
// This approach automatically includes all files without manual imports

// Import all SVG files as raw text using glob import
const svgModules = import.meta.glob('./assets/*.svg', { 
  query: '?raw',
  eager: true 
}) as Record<string, { default: string }>;

// Import all YAML files using glob import  
const yamlModules = import.meta.glob('./data/*.yml', { 
  eager: true 
}) as Record<string, { default: any }>;

// Create SVG assets map from glob imports
export const svgAssets: Record<string, string> = {};
for (const [path, module] of Object.entries(svgModules)) {
  const filename = path.split('/').pop()!; // Extract filename from path
  svgAssets[filename] = module.default;
}

// Create YAML data map from glob imports
export const yamlData: Record<string, any> = {};
for (const [path, module] of Object.entries(yamlModules)) {
  const filename = path.split('/').pop()!.replace('.yml', ''); // Extract slug from filename
  yamlData[filename] = module.default;
}

export function getSvgContent(filename: string): string {
  return svgAssets[filename] || '';
}

export function getYamlData(slug: string): any {
  return yamlData[slug];
}