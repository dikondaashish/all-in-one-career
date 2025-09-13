import ModernTemplate from './ModernTemplate';
import ClassicTemplate from './ClassicTemplate';
import CreativeTemplate from './CreativeTemplate';
import MinimalTemplate from './MinimalTemplate';

export { ModernTemplate, ClassicTemplate, CreativeTemplate, MinimalTemplate };

// Template component mapping
export const TEMPLATE_COMPONENTS = {
  modern: ModernTemplate,
  classic: ClassicTemplate,
  creative: CreativeTemplate,
  minimal: MinimalTemplate,
} as const;

export type TemplateType = keyof typeof TEMPLATE_COMPONENTS;
