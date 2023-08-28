import {
  Json,
  Logfmt,
  Unpack,
  Pattern,
  Regexp,
  Ip,
  LabelFormat,
  LineFormat,
  LabelReplace,
  Vector,
  Offset,
  By,
  Without,
  And,
  Or,
  Unless,
  Bool,
  On,
  Ignoring,
  GroupLeft,
  GroupRight,
  Unwrap,
  Sum,
  Avg,
  Count,
  Max,
  Min,
  Stddev,
  Stdvar,
  Bottomk,
  Topk,
  Decolorize,
  Drop,
  Keep,
} from './parser.terms.js';

const keywordTokens = {
  json: Json,
  logfmt: Logfmt,
  unpack: Unpack,
  pattern: Pattern,
  regexp: Regexp,
  ip: Ip,
  label_format: LabelFormat,
  line_format: LineFormat,
  label_replace: LabelReplace,
  vector: Vector,
  offset: Offset,
  bool: Bool,
  on: On,
  ignoring: Ignoring,
  group_left: GroupLeft,
  group_right: GroupRight,
  unwrap: Unwrap,
  decolorize: Decolorize,
  drop: Drop,
  keep: Keep,
};

export const specializeIdentifier = (value) => {
  return keywordTokens[value.toLowerCase()] || -1;
};

const contextualKeywordTokens = {
  by: By,
  without: Without,
  and: And,
  or: Or,
  unless: Unless,
  sum: Sum,
  avg: Avg,
  count: Count,
  max: Max,
  min: Min,
  stddev: Stddev,
  stdvar: Stdvar,
  bottomk: Bottomk,
  topk: Topk,
};

export const extendIdentifier = (value) => {
  return contextualKeywordTokens[value.toLowerCase()] || -1;
};
