import { describe, it, expect } from '@jest/globals';
import { formatLokiQuery } from '../src/exports';
import {
  parser,
  Selector,
  PipelineExpr,
  LineFilter,
  JsonExpressionParser,
  LabelFilter,
  LineFormatExpr,
  LabelFormatExpr,
  DecolorizeExpr,
  RangeAggregationExpr,
  LogRangeExpr,
  Grouping,
  VectorAggregationExpr,
  BinOpExpr,
  LiteralExpr,
  LabelReplaceExpr,
  VectorExpr,
} from '../src/parser';
import {
  formatSelector,
  formatPipelineExpr,
  formatLineFilter,
  formatLabelParser,
  formatJsonExpressionParser,
  formatLabelFilter,
  formatLineFormatExpr,
  formatLabelFormatExpr,
  formatDecolorizeExpr,
} from '../src/formatter/logs';
import {
  formatRangeAggregationExpr,
  formatLogRangeExpr,
  formatGrouping,
  formatVectorAggregationExpr,
  formatBinOpExpr,
  formatLiteralExpr,
  formatLabelReplaceExpr,
  formatVectorExpr,
} from '../src/formatter/metrics';
import { LogfmtParser } from '../src/parser.terms';

describe('formatLokiQuery', () => {
  describe('LogExpr', () => {
    it('spaces labels in selectors', () => {
      expect(formatLokiQuery(`{labelA="A",labelB="B",labelC="C",labelD="D"}`)).toBe(
        `{labelA="A", labelB="B", labelC="C", labelD="D"}`
      );
    });

    it('orders labels in selectors', () => {
      expect(formatLokiQuery(`{labelB="B", labelA="A"}`)).toBe(`{labelA="A", labelB="B"}`);
    });

    it('formats mixed pipeline expressions', () => {
      expect(formatLokiQuery(`{label=""}|=""|json|decolorize`)).toBe(`{label=""}\n  |= ""\n  | json\n  | decolorize`);
    });

    it('handles line filters', () => {
      expect(formatLokiQuery(`{label=""}|="contains"!="not contains"|~"regex match"!~"not regex match"`)).toBe(
        `{label=""}\n  |= "contains" != "not contains" |~ "regex match" !~ "not regex match"`
      );
      expect(formatLokiQuery(`{label=""}|=""`)).toBe(`{label=""}\n  |= ""`);
      expect(formatLokiQuery(`{label=""}!=""`)).toBe(`{label=""}\n  != ""`);
      expect(formatLokiQuery(`{label=""}|~""`)).toBe(`{label=""}\n  |~ ""`);
      expect(formatLokiQuery(`{label=""}!~""`)).toBe(`{label=""}\n  !~ ""`);
    });

    it('handles label parsers', () => {
      expect(formatLokiQuery(`{label=""}|json`)).toBe(`{label=""}\n  | json`);
      expect(formatLokiQuery(`{label=""}|logfmt`)).toBe(`{label=""}\n  | logfmt`);
      expect(formatLokiQuery(`{label=""}|regexp ""`)).toBe(`{label=""}\n  | regexp""`);
      expect(formatLokiQuery(`{label=""}|unpack`)).toBe(`{label=""}\n  | unpack`);
      expect(formatLokiQuery(`{label=""}|pattern ""`)).toBe(`{label=""}\n  | pattern""`);
    });

    it('handles json expression parsers', () => {
      expect(formatLokiQuery(`{label=""}|json label=""`)).toBe(`{label=""}\n  | json label=""`);
      expect(formatLokiQuery(`{label=""}|json labelA="A",labelB="B"`)).toBe(
        `{label=""}\n  | json labelA="A", labelB="B"`
      );
    });

    it('handles label filters', () => {
      expect(formatLokiQuery(`{label=""} | label=""`)).toBe(`{label=""}\n  | label=""`);
      expect(formatLokiQuery(`{label=""} | label=ip("")`)).toBe(`{label=""}\n  | label=ip("")`);
      expect(formatLokiQuery(`{label=""} | label=10s`)).toBe(`{label=""}\n  | label=10s`);
      expect(formatLokiQuery(`{label=""} | label=1GB`)).toBe(`{label=""}\n  | label=1GB`);
      expect(formatLokiQuery(`{label=""} | label=42`)).toBe(`{label=""}\n  | label=42`);

      // This is a missing implementation / bug, to be fixed.
      // expect(formatLokiQuery(`{label=""} | labelA="A" and labelB="B"`)).toBe(
      //   `{label=""}\n  | labelA="A" and labelB="B"`
      // );

      // This is a missing implementation / bug, to be fixed.
      // expect(formatLokiQuery(`{label=""} | labelA="A" or labelB="B"`)).toBe(
      //   `{label=""}\n  | labelA="A" or labelB="B"`
      // );

      /// This is a missing implementation / bug, to be fixed.
      // expect(formatLokiQuery(`{label=""} | labelA="A", labelB="B"`)).toBe(`{label=""}\n  | labelA="A", labelB="B"`);
    });

    it('handles line format expressions', () => {
      expect(formatLokiQuery(`{label=""}|line_format""`)).toBe(`{label=""}\n  | line_format ""`);
    });

    it('handles label format expressions', () => {
      expect(formatLokiQuery(`{label=""}|label_format label=""`)).toBe(`{label=""}\n  | label_format label=""`);
      expect(formatLokiQuery(`{label=""}|label_format label="",label=""`)).toBe(
        `{label=""}\n  | label_format label="", label=""`
      );
      expect(formatLokiQuery(`{label=""}|label_format labelA=labelB`)).toBe(
        `{label=""}\n  | label_format labelA=labelB`
      );
      expect(formatLokiQuery(`{label=""}|label_format labelA=labelB,labelA=labelB`)).toBe(
        `{label=""}\n  | label_format labelA=labelB, labelA=labelB`
      );
      expect(formatLokiQuery(`{label=""}|label_format label="",labelA=labelB`)).toBe(
        `{label=""}\n  | label_format label="", labelA=labelB`
      );
    });

    it('handles decolorize expressions', () => {
      expect(formatLokiQuery(`{label=""}|decolorize`)).toBe(`{label=""}\n  | decolorize`);
    });

    it('handles log expressions wrapped in "(" ")"', () => {
      expect(formatLokiQuery(`({labelB="B",labelA="A"})`)).toBe(`({labelA="A", labelB="B"})`);

      // This is a missing implementation / bug, to be fixed.
      // expect(formatLokiQuery(`({label=""}|=""|json|decolorize)`)).toBe(`({label=""}\n  |= ""\n  | json\n  | decolorize)`);
    });
  });

  describe('MetricExpr', () => {
    it('handles range aggregation expressions', () => {
      expect(formatLokiQuery(`rate({label=""}[1s])`)).toBe(`rate(\n  {label=""}\n  [1s]\n)`);
      expect(formatLokiQuery(`rate(0.99,{label=""}[1s])`)).toBe(`rate(\n  0.99,\n  {label=""}\n  [1s]\n)`);
      expect(formatLokiQuery(`rate({label=""}[1s])by(label)`)).toBe(`rate(\n  {label=""}\n  [1s]\n) by (label)`);
    });

    // This has been a source of many bugs throughout the development process, so we test it thoroughly.
    it('handles complex range aggregation expressions', () => {
      // Selector Range
      expect(formatLokiQuery(`rate({label=""}[1s])`)).toBe(`rate(\n  {label=""}\n  [1s]\n)`);

      // Selector Range OffsetExpr
      expect(formatLokiQuery(`rate({label=""}[1s]offset 1h)`)).toBe(`rate(\n  {label=""}\n  [1s] offset 1h\n)`);

      // "(" Selector ")" Range
      expect(formatLokiQuery(`rate(({label=""})[1s])`)).toBe(`rate(\n  {label=""}\n  [1s]\n)`);

      // "(" Selector ")" Range OffsetExpr
      expect(formatLokiQuery(`rate(({label=""})[1s]offset 1h)`)).toBe(`rate(\n  {label=""}\n  [1s] offset 1h\n)`);

      // Selector Range UnwrapExpr
      expect(formatLokiQuery(`rate({label=""}[1s]|unwrap label)`)).toBe(
        `rate(\n  {label=""}\n  [1s] | unwrap label\n)`
      );

      // Selector Range OffsetExpr UnwrapExpr
      expect(formatLokiQuery(`rate({label=""}[1s]offset 1h|unwrap label)`)).toBe(
        `rate(\n  {label=""}\n  [1s] offset 1h | unwrap label\n)`
      );

      // "(" Selector ")" Range UnwrapExpr |
      expect(formatLokiQuery(`rate(({label=""})[1s]|unwrap label)`)).toBe(
        `rate(\n  {label=""}\n  [1s] | unwrap label\n)`
      );

      // "(" Selector ")" Range OffsetExpr UnwrapExpr |
      expect(formatLokiQuery(`rate(({label=""})[1s]offset 1h|unwrap label)`)).toBe(
        `rate(\n  {label=""}\n  [1s] offset 1h | unwrap label\n)`
      );

      // Selector UnwrapExpr Range
      expect(formatLokiQuery(`rate({label=""}|unwrap label[1s])`)).toBe(
        `rate(\n  {label=""}\n  | unwrap label\n  [1s]\n)`
      );

      // Selector UnwrapExpr Range OffsetExpr
      expect(formatLokiQuery(`rate({label=""}|unwrap label[1s]offset 1h)`)).toBe(
        `rate(\n  {label=""}\n  | unwrap label\n  [1s] offset 1h\n)`
      );

      // "(" Selector UnwrapExpr ")" Range
      expect(formatLokiQuery(`rate(({label=""} |unwrap label)[1s])`)).toBe(
        `rate(\n  {label=""}\n  | unwrap label\n  [1s]\n)`
      );

      // "(" Selector UnwrapExpr ")" Range OffsetExpr
      expect(formatLokiQuery(`rate(({label=""} |unwrap label)[1s] offset 1h)`)).toBe(
        `rate(\n  {label=""}\n  | unwrap label\n  [1s] offset 1h\n)`
      );

      // Selector PipelineExpr Range
      expect(formatLokiQuery(`rate({label=""}|=""|logfmt[1s])`)).toBe(
        `rate(\n  {label=""}\n    |= ""\n    | logfmt\n  [1s]\n)`
      );

      // Selector PipelineExpr Range OffsetExpr
      expect(formatLokiQuery(`rate({label=""}|=""|logfmt[1s]offset 1h)`)).toBe(
        `rate(\n  {label=""}\n    |= ""\n    | logfmt\n  [1s] offset 1h\n)`
      );

      // "(" Selector PipelineExpr ")" Range
      expect(formatLokiQuery(`rate(({label=""}|=""|logfmt)[1s])`)).toBe(
        `rate(\n  {label=""}\n    |= ""\n    | logfmt\n  [1s]\n)`
      );

      // "(" Selector PipelineExpr ")" Range OffsetExpr
      expect(formatLokiQuery(`rate(({label=""}|=""|logfmt)[1s]offset 1h)`)).toBe(
        `rate(\n  {label=""}\n    |= ""\n    | logfmt\n  [1s] offset 1h\n)`
      );

      // Selector Range PipelineExpr
      expect(formatLokiQuery(`rate({label=""}[1s]|=""|logfmt)`)).toBe(
        `rate(\n  {label=""}\n  [1s]\n    |= ""\n    | logfmt\n)`
      );

      // Selector Range OffsetExpr PipelineExpr
      expect(formatLokiQuery(`rate({label=""}[1s]offset 1h|=""|logfmt)`)).toBe(
        `rate(\n  {label=""}\n  [1s] offset 1h\n    |= ""\n    | logfmt\n)`
      );

      // Selector Range PipelineExpr UnwrapExpr
      expect(formatLokiQuery(`rate({label=""}[1s]|=""|logfmt|unwrap label)`)).toBe(
        `rate(\n  {label=""}\n  [1s]\n    |= ""\n    | logfmt\n  | unwrap label\n)`
      );

      // Selector PipelineExpr UnwrapExpr Range
      expect(formatLokiQuery(`rate({label=""}|=""|logfmt|unwrap label[1s])`)).toBe(
        `rate(\n  {label=""}\n    |= ""\n    | logfmt\n  | unwrap label\n  [1s]\n)`
      );

      // Selector Range OffsetExpr PipelineExpr UnwrapExpr
      expect(formatLokiQuery(`rate({label=""}[1s]offset 1h|=""|logfmt|unwrap label)`)).toBe(
        `rate(\n  {label=""}\n  [1s] offset 1h\n    |= ""\n    | logfmt\n  | unwrap label\n)`
      );

      // "(" LogRangeExpr ")"
      expect(formatLokiQuery(`(rate({label=""}[1s]))`)).toBe(`(rate(\n  {label=""}\n  [1s]\n))`);
      expect(formatLokiQuery(`(rate({label=""}[1s]offset 1h|=""|logfmt|unwrap label))`)).toBe(
        `(rate(\n  {label=""}\n  [1s] offset 1h\n    |= ""\n    | logfmt\n  | unwrap label\n))`
      );
    });

    it('handles vector aggregation expressions', () => {
      expect(formatLokiQuery(`sum(rate({label=""}[1s]))`)).toBe(`sum(\n  rate(\n    {label=""}\n    [1s]\n  )\n)`);
      expect(formatLokiQuery(`sum by(abc)(rate({label=""}[1s]))`)).toBe(
        `sum by (abc) (\n  rate(\n    {label=""}\n    [1s]\n  )\n)`
      );
      expect(formatLokiQuery(`sum(rate({label=""}[1s]))by(abc)`)).toBe(
        `sum(\n  rate(\n    {label=""}\n    [1s]\n  )\n) by (abc)`
      );
      expect(formatLokiQuery(`sum(0.99, rate({label=""}[1s]))`)).toBe(
        `sum(\n  0.99,\n  rate(\n    {label=""}\n    [1s]\n  )\n)`
      );
      expect(formatLokiQuery(`sum(0.99, rate({label=""}[1s]))by(abc)`)).toBe(
        `sum(\n  0.99,\n  rate(\n    {label=""}\n    [1s]\n  )\n) by (abc)`
      );
      expect(formatLokiQuery(`sum by(abc)(0.99, rate({label=""}[1s]))by(abc)`)).toBe(
        `sum by (abc) (\n  0.99,\n  rate(\n    {label=""}\n    [1s]\n  )\n)`
      );

      // This is a missing implementation / bug, to be fixed.
      // expect(formatLokiQuery(`sum(sum(rate({label=""}[1s])))`)).toBe(
      //   `sum(\n  sum(\n    rate(\n      {label=""}\n      [1s]\n    )\n  )\n)`
      // );
    });

    it('handles binary operator expressions', () => {
      expect(formatLokiQuery(`rate({label=""}[1s]) + rate({label=""}[5s])`)).toBe(
        `rate(\n  {label=""}\n  [1s]\n)\n+\nrate(\n  {label=""}\n  [5s]\n)`
      );
      expect(formatLokiQuery(`10 + rate({label=""}[1s])`)).toBe(`10\n+\nrate(\n  {label=""}\n  [1s]\n)`);
      // expect(formatLokiQuery(`1 + 2 + 3`)).toBe(`1\n+\n2\n+\n3`);
    });

    it('handles literal expressions', () => {
      expect(formatLokiQuery(`10`)).toBe(`10`);
      expect(formatLokiQuery(`- 10`)).toBe(`-10`);
      expect(formatLokiQuery(`+ 10`)).toBe(`+10`);
    });

    it('handles label replace expressions', () => {
      expect(formatLokiQuery(`label_replace(rate({label=""}[1s]), "", "", "", "")`)).toBe(
        `label_replace(\n  rate(\n    {label=""}\n    [1s]\n  ),\n  "",\n  "",\n  "",\n  ""\n)`
      );
    });

    it('handles vector expressions', () => {
      expect(formatLokiQuery(`rate({source="data"}[1s]) or vector( 10 )`)).toBe(
        `rate(\n  {source="data"}\n  [1s]\n)\nor\nvector(10)`
      );
      expect(formatLokiQuery(`vector ( 10 )`)).toBe(`vector(10)`);
    });

    it('handles metric expressions wrapped in "(" ")"', () => {
      expect(formatLokiQuery(`(rate({source="data"}[1s]))`)).toBe(`(rate(\n  {source="data"}\n  [1s]\n))`);
      expect(formatLokiQuery(`(+1 + -1)`)).toBe(`(+1\n+\n-1)`);
    });
  });
});

describe('log expression syntaxnode functions', () => {
  it('formatSelector should return a formatted selector', () => {
    const MOCK_NODE = generateMockNode(Selector, `{label="",label=""}`);
    expect(formatSelector(MOCK_NODE, `{label="",label=""}`)).toBe(`{label="", label=""}`);
  });

  it('formatPipelineExpr should return a formatted selector', () => {
    const MOCK_NODE = generateMockNode(PipelineExpr, `{}|=""!=""|logfmt|label=""`);
    expect(formatPipelineExpr(MOCK_NODE, `{}|=""!=""|logfmt|label=""`)).toBe(
      `\n  |= "" != ""\n  | logfmt\n  | label=""`
    );
  });

  it('formatLineFilter should return a formatted line filter', () => {
    const MOCK_NODE = generateMockNode(LineFilter, `{}|=""`);
    expect(formatLineFilter(MOCK_NODE, `{}|=""`)).toBe(`|= ""`);
  });

  it('formatLabelParser should return a formatted label parser', () => {
    const MOCK_NODE = generateMockNode(LogfmtParser, `{}|logfmt`);
    expect(formatLabelParser(MOCK_NODE, `{}|logfmt`)).toBe(`| logfmt`);
  });

  it('formatJsonExpressionParser should return formatted json expr parser', () => {
    const MOCK_NODE = generateMockNode(JsonExpressionParser, `{}|json label="",label=""`);
    expect(formatJsonExpressionParser(MOCK_NODE, `{}|json label="",label=""`)).toBe(`| json label="", label=""`);
  });

  it('formatLabelFilter should return formatted label filter', () => {
    const MOCK_NODE = generateMockNode(LabelFilter, `{}|label = ""`);
    expect(formatLabelFilter(MOCK_NODE, `{}|label = ""`)).toBe(`| label=""`);
  });

  it('formatLineFormatExpr should return formatted line format expr', () => {
    const MOCK_NODE = generateMockNode(LineFormatExpr, `{}|line_format""`);
    expect(formatLineFormatExpr(MOCK_NODE, `{}|line_format""`)).toBe(`| line_format ""`);
  });

  it('formatLabelFormatExpr should return formatted label format expr', () => {
    const MOCK_NODE = generateMockNode(LabelFormatExpr, `{}|label_format label="",label=""`);
    expect(formatLabelFormatExpr(MOCK_NODE, `{}|label_format label="",label=""`)).toBe(
      `| label_format label="", label=""`
    );
  });

  it('formatDecolorizeExpr should return formatted label format expr', () => {
    const MOCK_NODE = generateMockNode(DecolorizeExpr, `{}|decolorize`);
    expect(formatDecolorizeExpr(MOCK_NODE, `{}|decolorize`)).toBe(`| decolorize`);
  });
});

describe('metric expression syntaxnode functions', () => {
  it('formatRangeAggregationExpr should return a formatted range aggregation expression', () => {
    const MOCK_NODE = generateMockNode(RangeAggregationExpr, `rate({label=""}[5m])`);
    expect(formatRangeAggregationExpr(MOCK_NODE, `rate({label=""}[5m])`)).toBe(`rate(\n  {label=""}\n  [5m]\n)`);
  });

  it('formatLogRangeExpr should return a formatted log range expression', () => {
    const MOCK_NODE = generateMockNode(LogRangeExpr, `rate({label=""}[5m])`);
    expect(formatLogRangeExpr(MOCK_NODE, `rate({label=""}[5m])`)).toBe(`  {label=""}\n  [5m]\n)`);
  });

  it('formatGrouping should return a formatted grouping', () => {
    const MOCK_NODE = generateMockNode(Grouping, `rate({label=""}[5m])by(abc)`);
    expect(formatGrouping(MOCK_NODE, `rate({label=""}[5m])by(abc)`)).toBe(` by (abc) `);
  });

  it('formatVectorAggregationExpr should return a formatted vector expr', () => {
    const MOCK_NODE = generateMockNode(VectorAggregationExpr, `sum(rate({label=""}[1s]))`);
    expect(formatVectorAggregationExpr(MOCK_NODE, `sum(rate({label=""}[1s]))`)).toBe(
      `sum(\n  rate(\n    {label=""}\n    [1s]\n  )\n)`
    );
  });

  it('formatBinOpExpr should return a formatted binop', () => {
    const MOCK_NODE = generateMockNode(BinOpExpr, `1 + 1`);
    expect(formatBinOpExpr(MOCK_NODE, `1 + 1`)).toBe(`1\n+\n1`);
  });

  it('formatLiteralExpr should return a formatted literal expr', () => {
    const MOCK_NODE_1 = generateMockNode(LiteralExpr, `+ 1`);
    expect(formatLiteralExpr(MOCK_NODE_1, `+ 1`)).toBe(`+1`);

    const MOCK_NODE_2 = generateMockNode(LiteralExpr, `- 1`);
    expect(formatLiteralExpr(MOCK_NODE_2, `- 1`)).toBe(`-1`);
  });

  it('formatLabelReplaceExpr should return a formatted expr', () => {
    const MOCK_NODE = generateMockNode(LabelReplaceExpr, `label_replace(rate({label=""}[1s]), "", "", "", "")`);
    expect(formatLabelReplaceExpr(MOCK_NODE, `label_replace(rate({label=""}[1s]), "", "", "", "")`)).toBe(
      `label_replace(\n  rate(\n    {label=""}\n    [1s]\n  ),\n  "",\n  "",\n  "",\n  ""\n)`
    );
  });

  it('formatVectorExpr should return a formatted literal expr', () => {
    const MOCK_NODE_1 = generateMockNode(VectorExpr, `{label=""} or vector ( 1 )`);
    expect(formatVectorExpr(MOCK_NODE_1, `{label=""} or vector ( 1 )`)).toBe(`vector(1)`);
  });
});

function generateMockNode(type, query) {
  const tree = parser.parse(query);
  let lookingFor = {};

  tree.iterate({
    enter: (ref) => {
      const node = ref.node;
      if (node.type.id === type) {
        lookingFor = node;
        return false;
      }
    },
  });

  return lookingFor;
}
