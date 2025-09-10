import postcss, { ChildNode, Root, Rule } from 'postcss';
import postcssNested from 'postcss-nested';

import { CustomClassesSafeList } from '@/constants/custom-styles';

export interface ValidationError {
  message: string;
  line: number;
}

export interface ValidationResult {
  status: boolean;
  error?: string;
  errors?: ValidationError[];
}

const safeClassesSet = new Set(CustomClassesSafeList);

// Helper to extract line number
function getLine(node: ChildNode): number {
  return node.source?.start?.line ?? 1;
}

export async function validateCustomCSS(css: string): Promise<ValidationResult> {
  let root: Root;

  try {
    const result = await postcss([postcssNested]).process(css, { from: undefined });
    root = result.root;
  } catch {
    return {
      status: false,
      error: 'CSS contains syntax errors or invalid nesting. Please fix them before saving.',
      errors: [
        {
          message: 'CSS contains syntax errors or invalid nesting.',
          line: 1,
        },
      ],
    };
  }

  const errors: ValidationError[] = [];

  root.walkRules((rule: Rule) => {
    const selectors = rule.selectors || [];

    for (const selector of selectors) {
      const line = getLine(rule);

      const classMatches = selector.match(/\.[\w-]+/g) || [];
      const knownMatches = classMatches.filter(cls => safeClassesSet.has(cls.slice(1)));

      // Disallow any unknown classes
      for (const fullMatch of classMatches) {
        const className = fullMatch.slice(1);
        if (!safeClassesSet.has(className)) {
          errors.push({
            message: `Class ".${className}" in selector "${selector}" is not part of the public override API.`,
            line,
          });
        }
      }

      // Disallow unscoped element or pseudo selectors (unless inside a known class)
      const unsafeGlobalElementPattern = /^\s*(svg|::?[\w-]+|[a-zA-Z][\w-]*)/;
      if (unsafeGlobalElementPattern.test(selector) && knownMatches.length === 0) {
        errors.push({
          message: `Selector "${selector}" is too generic. Use elements and pseudo-elements only inside known class selectors.`,
          line,
        });
      }

      // Disallow selectors without any known classes
      if (knownMatches.length === 0) {
        errors.push({
          message: `Selector "${selector}" must include at least one known class from the public override API.`,
          line,
        });
      }
    }
  });

  if (errors.length > 0) {
    return {
      status: false,
      error: errors[0].message,
      errors,
    };
  }

  return { status: true };
}
