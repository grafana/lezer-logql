import { needsBrackets, iterateNode, buildResponse, trimEnd } from './utils.js';
import {
  Identifier,
  String,
  Matcher,
  parser,
  LabelParser,
  LabelFilter,
  JsonExpressionParser,
  LineFormatExpr,
  LabelFormatExpr,
  LineFilter,
  Filter,
  Regexp,
  Pattern,
  LabelExtractionExpression,
  IpLabelFilter,
  UnitFilter,
  NumberFilter,
  DurationFilter,
  BytesFilter,
  Duration,
  Bytes,
  Number,
  LabelFormatMatcher,
  FilterOp,
  DecolorizeExpr,
  LogExpr,
  Selector,
  PipelineExpr,
  LogfmtParser,
} from '../parser.js';

export const formatLogExpr = (node, query) => {
  const { addBrackets, newNode } = needsBrackets(node, LogExpr);
  node = newNode;

  const tree = parser.parse(query.substring(node.from, node.to));
  let formatted = '';

  tree.iterate({
    enter: (ref) => {
      const node = ref.node;

      switch (node.type.id) {
        case Selector:
          formatted += formatSelector(node, query);
          break;

        case PipelineExpr:
          node.parent?.type.id !== PipelineExpr && (formatted += formatPipelineExpr(node, query));
          break;
      }
    },
  });

  return addBrackets ? '(' + formatted + ')' : formatted;
};

export function formatSelector(node, query) {
  const selector = query.substring(node.from, node.to);
  const subtree = parser.parse(selector);
  const labelNodes = [];
  let response = '';

  subtree.iterate({
    enter: (ref) => {
      const node = ref.node;
      if (node.type.id === Matcher) {
        labelNodes.push(node);
      }
    },
  });

  labelNodes.sort((a, b) => {
    const labelNodeA = a.getChild(Identifier);
    const labelNodeB = b.getChild(Identifier);

    const labelValueA = labelNodeA && query.substring(labelNodeA.from, labelNodeA.to);
    const labelValueB = labelNodeB && query.substring(labelNodeB.from, labelNodeB.to);

    if (!labelValueA || !labelValueB) {
      return 0;
    }

    if (labelValueA < labelValueB) {
      return -1;
    }

    if (labelValueA > labelValueB) {
      return 1;
    }

    return 0;
  });

  labelNodes.forEach((node) => {
    const labelNode = node.getChild(Identifier);
    const operatorNode = labelNode ? labelNode.nextSibling : null;
    const valueNode = node.getChild(String);

    const label = labelNode ? query.substring(labelNode.from, labelNode.to) : null;
    const operator = operatorNode ? query.substring(operatorNode.from, operatorNode.to) : null;
    const value = valueNode ? query.substring(valueNode.from, valueNode.to) : null;

    response += `${label}${operator}${value}, `;
  });

  return '{' + trimEnd(response, ', ') + '}';
}

export function formatPipelineExpr(node, query) {
  const pipelineExprNodes = [
    LineFilter,
    LabelParser,
    LogfmtParser,
    LabelFilter,
    JsonExpressionParser,
    LineFormatExpr,
    LabelFormatExpr,
    DecolorizeExpr,
  ];
  let lastPipelineType;
  let response = '';

  iterateNode(node, pipelineExprNodes).forEach((node) => {
    switch (node.type.id) {
      case LineFilter:
        response += buildResponse(LineFilter, lastPipelineType, formatLineFilter(node, query));
        lastPipelineType = LineFilter;
        break;

      case LabelParser:
        response += buildResponse(LabelParser, lastPipelineType, formatLabelParser(node, query));
        lastPipelineType = LabelParser;
        break;

      case LogfmtParser:
        response += buildResponse(LogfmtParser, lastPipelineType, formatLabelParser(node, query));
        lastPipelineType = LogfmtParser;
        break;

      case JsonExpressionParser:
        response += buildResponse(JsonExpressionParser, lastPipelineType, formatJsonExpressionParser(node, query));
        lastPipelineType = JsonExpressionParser;
        break;

      case LabelFilter:
        response += buildResponse(LabelFilter, lastPipelineType, formatLabelFilter(node, query));
        lastPipelineType = LabelFilter;
        break;

      case LineFormatExpr:
        response += buildResponse(LineFormatExpr, lastPipelineType, formatLineFormatExpr(node, query));
        lastPipelineType = LineFormatExpr;
        break;

      case LabelFormatExpr:
        response += buildResponse(LabelFormatExpr, lastPipelineType, formatLabelFormatExpr(node, query));
        lastPipelineType = LabelFormatExpr;
        break;

      case DecolorizeExpr:
        response += buildResponse(DecolorizeExpr, lastPipelineType, formatDecolorizeExpr());
        lastPipelineType = DecolorizeExpr;
        break;
    }
  });

  return response;
}

export function formatLineFilter(node, query) {
  const filterNode = node.getChild(Filter);
  const filterOperationNode = node.getChild(FilterOp);
  const stringNode = node.getChild(String);

  const filter = filterNode && query.substring(filterNode.from, filterNode.to);
  const string = stringNode && query.substring(stringNode.from, stringNode.to);

  if (filterOperationNode) {
    return `${filter} ip(${string})`;
  }
  return `${filter} ${string}`;
}

export function formatLabelParser(node, query) {
  const hasString = node.getChild(String);

  if (hasString) {
    const parserNode = node.getChild(Regexp) || node.getChild(Pattern);
    const stringNode = node.getChild(String);

    const parser = parserNode && query.substring(parserNode.from, parserNode.to);
    const string = stringNode && query.substring(stringNode.from, stringNode.to);

    return `| ${parser}${string}`;
  }

  const labelParser = query.substring(node.from, node.to);
  return `| ${labelParser}`;
}

export function formatJsonExpressionParser(node, query) {
  const jsonExpressionNodes = iterateNode(node, [LabelExtractionExpression]);
  let response = '';

  jsonExpressionNodes.forEach((node) => {
    const identifierNode = node.getChild(Identifier);
    const valueNode = node.getChild(String);

    const identifier = identifierNode && query.substring(identifierNode.from, identifierNode.to);
    const value = valueNode && query.substring(valueNode.from, valueNode.to);

    response += `${identifier}=${value}, `;
  });

  return `| json ${trimEnd(response, ', ')}`;
}

export function formatLabelFilter(node, query) {
  const selectedFilter =
    node.getChild(Matcher) ||
    node.getChild(IpLabelFilter) ||
    node.getChild(NumberFilter) ||
    node.getChild(UnitFilter)?.getChild(DurationFilter) ||
    node.getChild(UnitFilter)?.getChild(BytesFilter);

  if (!selectedFilter) {
    return '';
  }

  const selectedFilterType = selectedFilter.type.id;

  const identifierNode = selectedFilter.getChild(Identifier);
  const operatorNode = identifierNode && identifierNode.nextSibling;
  let valueNode;

  if (selectedFilterType === DurationFilter) {
    valueNode = selectedFilter.getChild(Duration);
  } else if (selectedFilterType === BytesFilter) {
    valueNode = selectedFilter.getChild(Bytes);
  } else if (selectedFilterType === NumberFilter) {
    valueNode = selectedFilter.getChild(Number);
  } else {
    valueNode = selectedFilter.getChild(String);
  }

  const identifier = identifierNode && query.substring(identifierNode.from, identifierNode.to);
  const operator = operatorNode && query.substring(operatorNode.from, operatorNode.to);
  const value = valueNode && query.substring(valueNode.from, valueNode.to);

  if (selectedFilterType === IpLabelFilter) {
    return `| ${identifier}${operator}ip(${value})`;
  }

  return `| ${identifier}${operator}${value}`;
}

export function formatLineFormatExpr(node, query) {
  const stringNode = node.getChild(String);
  const string = stringNode && query.substring(stringNode.from, stringNode.to);
  return `| line_format ${string}`;
}

export function formatLabelFormatExpr(node, query) {
  const labelFormatMatcherNodes = iterateNode(node, [LabelFormatMatcher]);
  let response = '| label_format ';

  labelFormatMatcherNodes.forEach((labelFormatMatcherNode) => {
    let identifierNode;
    let valueNode;

    if (labelFormatMatcherNode.getChildren(Identifier).length === 2) {
      [identifierNode, valueNode] = labelFormatMatcherNode.getChildren(Identifier);
    } else {
      identifierNode = labelFormatMatcherNode.getChild(Identifier);
      valueNode = labelFormatMatcherNode.getChild(String);
    }

    const identifier = identifierNode && query.substring(identifierNode.from, identifierNode.to);
    const value = valueNode && query.substring(valueNode.from, valueNode.to);

    response += `${identifier}=${value}, `;
  });

  return trimEnd(response, ', ');
}

export function formatDecolorizeExpr() {
  return `| decolorize`;
}
