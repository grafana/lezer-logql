import { lokiGrammar, FUNCTIONS } from '../dist/index.es.js';
import { describe, it, expect } from '@jest/globals';

describe('lokiGrammar', () => {
  it('is exported alongside the parser', () => {
    expect(lokiGrammar).toBeTruthy();
    expect(FUNCTIONS.length).toBeGreaterThan(0);
  });

  it('matches known functions and rejects unknown ones', () => {
    expect(lokiGrammar.function.test('rate(')).toBe(true);
    expect(lokiGrammar.function.test('not_a_real_function(')).toBe(false);
  });
});
