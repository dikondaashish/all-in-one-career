export { default as ModernTemplate } from './ModernTemplate';
export { default as ClassicTemplate } from './ClassicTemplate';
export { default as CreativeTemplate } from './CreativeTemplate';
export { default as MinimalTemplate } from './MinimalTemplate';

// Template component mapping
export const TEMPLATE_COMPONENTS = {
  modern: ModernTemplate,
  classic: ClassicTemplate,
  creative: CreativeTemplate,
  minimal: MinimalTemplate,
} as const;

export type TemplateType = keyof typeof TEMPLATE_COMPONENTS;
