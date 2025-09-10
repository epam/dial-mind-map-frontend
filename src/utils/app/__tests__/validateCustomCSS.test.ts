import { CustomClassesSafeList } from '@/constants/custom-styles';

import { validateCustomCSS } from '../validateCustomCSS';

describe('validateCustomCSS', () => {
  it('should return valid result for correct CSS using safe classes', async () => {
    const result = await validateCustomCSS(`
      .chat-footer {
        background: white;

        .chat-footer__submit-btn {
          color: red;

          &::before {
            content: '';
          }

          svg {
            display: none;
          }
        }
      }
    `);

    expect(result.status).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.errors).toBeUndefined();
  });

  it('should catch unknown class', async () => {
    const result = await validateCustomCSS(`
      .unknown-class {
        color: red;
      }
    `);

    expect(result.status).toBe(false);
    expect(result.errors?.[0].message).toMatch(/not part of the public override API/);
    expect(result.errors?.[0].line).toBe(2);
  });

  it('should catch missing known class in selector', async () => {
    const result = await validateCustomCSS(`
      svg {
        display: none;
      }
    `);

    expect(result.status).toBe(false);
    expect(result.errors?.[0].message).toMatch(/Use elements and pseudo-elements only inside known class selectors/);
    expect(result.errors?.[0].line).toBe(2);
  });

  it('should catch element-only selector without known class context', async () => {
    const result = await validateCustomCSS(`
      ::before {
        content: '';
      }
    `);

    expect(result.status).toBe(false);
    expect(result.errors?.[0].message).toMatch(/too generic/);
    expect(result.errors?.[0].line).toBe(2);
  });

  it('should allow ::before and svg inside safe class', async () => {
    const result = await validateCustomCSS(`
      .chat-footer__submit-btn {
        svg {
          display: none;
        }

        &::before {
          content: '✓';
        }
      }
    `);

    expect(result.status).toBe(true);
  });

  it('should return syntax error for invalid CSS', async () => {
    const result = await validateCustomCSS(`
      .chat-footer__input {
        color: red
      }
      .chat-conversation {
    `); // Missing closing brace

    expect(result.status).toBe(false);
    expect(result.error).toMatch(/syntax errors or invalid nesting/);
    expect(result.errors?.[0].line).toBe(1);
  });

  it('should catch multiple issues with accurate lines', async () => {
    const result = await validateCustomCSS(`
      .bad-class {
        color: red;
      }

      svg {
        display: block;
      }

      .chat-footer {
        &.also-bad {
          background: red;
        }
      }
    `);

    expect(result.status).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(1);

    const messages = result.errors?.map(e => e.message) || [];
    expect(messages[0]).toMatch(/not part of the public override API/);
    expect(messages[1]).toMatch(/must include at least one known class/);
    expect(messages[2]).toMatch(/Use elements and pseudo-elements only inside known class selectors/);
  });

  it('should allow deeply nested safe classes', async () => {
    const result = await validateCustomCSS(`
      .chat-container {
        .chat-header {
          .history-reset-button {
            color: red;
          }
        }
      }
    `);

    expect(result.status).toBe(true);
  });

  it('should treat a single safe class as valid', async () => {
    const safeClass = CustomClassesSafeList[0];
    const result = await validateCustomCSS(`
      .${safeClass} {
        color: green;
      }
    `);

    expect(result.status).toBe(true);
  });
});
