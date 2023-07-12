import { describe, it, expect } from '@jest/globals';
import {
  parser,
  Selector,
  PipelineExpr,
  LineFilter,
  LabelParser,
  JsonExpressionParser,
  LabelFilter,
  LineFormatExpr,
  LabelFormatExpr,
  DistinctFilter,
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
  formatDistinctFilter,
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
    const MOCK_NODE = generateMockNode(LabelParser, `{}|logfmt`);
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

  it('formatDistinctFilter should return formatted label format expr', () => {
    const MOCK_NODE = generateMockNode(DistinctFilter, `{}|distinct label,label,label`);
    expect(formatDistinctFilter(MOCK_NODE, `{}|distinct label,label,label`)).toBe(`| distinct label, label, label`);
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
