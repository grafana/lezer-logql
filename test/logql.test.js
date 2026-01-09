import { parser } from '../dist/index.es.js';
import { fileTests } from './utils.js';

import * as fs from 'fs';
import * as path from 'path';
import { describe, it } from '@jest/globals';

// __dirname is available after Babel transforms ESM to CommonJS
// eslint-disable-next-line no-undef
const caseDir = __dirname;
for (const file of fs.readdirSync(caseDir)) {
  if (!/\.txt$/.test(file)) continue;

  const name = /^[^.]*/.exec(file)[0];
  describe(name, () => {
    for (const { name, run } of fileTests(fs.readFileSync(path.join(caseDir, file), 'utf8'), file))
      it(name, () => run(parser));
  });
}
