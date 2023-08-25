import {
  needsBrackets,
  iterateNode,
  indent,
  indentMultiline,
  getNodeFromQuery,
  isLogsQuery,
  trimEnd,
} from './utils.js';
import { formatSelector, formatPipelineExpr, formatLabelFilter, formatLogExpr } from './logs.js';
import {
  Identifier,
  String,
  PipelineExpr,
  Selector,
  LabelFilter,
  Duration,
  Number,
  MetricExpr,
  RangeAggregationExpr,
  RangeOp,
  LogRangeExpr,
  Range,
  Grouping,
  OffsetExpr,
  VectorAggregationExpr,
  Expr,
  UnwrapExpr,
  By,
  Without,
  ConvOp,
  LiteralExpr,
  VectorExpr,
  VectorOp,
  Add,
  Sub,
  LabelReplaceExpr,
  BinOpExpr,
  LogExpr,
} from '../parser.js';

export const formatMetricExpr = (node, query) => {
  const { addBrackets, newNode } = needsBrackets(node, MetricExpr);
  node = newNode;
  let formatted = '';

  const childNode = node.firstChild;
  switch (childNode && childNode.type.id) {
    case RangeAggregationExpr:
      formatted = formatRangeAggregationExpr(node, query);
      break;

    case VectorAggregationExpr:
      formatted = formatVectorAggregationExpr(node, query);
      break;

    case BinOpExpr:
      formatted = formatBinOpExpr(node, query);
      break;

    case LiteralExpr:
      formatted = formatLiteralExpr(node, query);
      break;

    case LabelReplaceExpr:
      formatted = formatLabelReplaceExpr(node, query);
      break;

    case VectorExpr:
      formatted = formatVectorExpr(node, query);
      break;
  }

  return addBrackets ? '(' + formatted + ')' : formatted;
};

export function formatRangeAggregationExpr(node, query) {
  let response = '';

  iterateNode(node, [RangeOp, Number, LogRangeExpr, Grouping]).forEach((node) => {
    if (node.parent?.type.id !== RangeAggregationExpr) {
      return;
    }

    switch (node.type.id) {
      case RangeOp:
        response += `${query.substring(node.from, node.to)}(\n`;
        break;

      case Number:
        response += `${indent(1) + query.substring(node.from, node.to)},\n`;
        break;

      case LogRangeExpr:
        response += formatLogRangeExpr(node, query);
        break;

      case Grouping:
        response += formatGrouping(node, query);
        break;
    }
  });

  return response;
}

export function formatLogRangeExpr(node, query) {
  const nodes = [];
  let selector = '';
  let pipeline = '';
  let range = '';
  let offset = '';
  let unwrap = '';

  iterateNode(node, [Selector, Range, OffsetExpr, UnwrapExpr, PipelineExpr]).forEach((node) => {
    if (node.parent?.type.id !== LogRangeExpr) {
      return;
    }

    nodes.push(node);

    switch (node.type.id) {
      case Selector: {
        let logExpr = query.substring(node.from, node.to);
        selector += formatSelector({ ...node, from: 0, to: logExpr.length }, logExpr);
        break;
      }

      case PipelineExpr:
        pipeline += formatPipelineExpr(node, query);
        break;

      case Range:
        range += query.substring(node.from, node.to);
        break;

      case OffsetExpr: {
        const durationNode = node.getChild(Duration);
        offset += ` offset ${durationNode ? query.substring(durationNode.from, durationNode.to) : ''}`;
        break;
      }

      case UnwrapExpr:
        iterateNode(node, [Identifier, ConvOp, LabelFilter]).forEach((node, _, arr) => {
          switch (node.type.id) {
            case Identifier: {
              if (node.parent?.type.id !== UnwrapExpr) {
                return;
              }

              const hasConvOp = arr.find((node) => node.type.id === ConvOp);

              if (hasConvOp) {
                return;
              }

              unwrap += `| unwrap ${query.substring(node.from, node.to)} `;
              return;
            }

            case ConvOp: {
              const identifierNode = arr.find((node) => node.type.id === Identifier);
              const identifier = identifierNode ? query.substring(identifierNode.from, identifierNode.to) : '';
              unwrap += `| unwrap ${query.substring(node.from, node.to)}(${identifier}) `;
              return;
            }

            case LabelFilter:
              unwrap += formatLabelFilter(node, query);
              return;
          }
        });
        break;
    }
  });

  let response = '';
  nodes.forEach((node, index, array) => {
    const previousNode = array[index - 1];

    if (node.type.id === Selector) {
      response += indent(1) + selector;
    }

    if (node.type.id === PipelineExpr) {
      response += indentMultiline(pipeline, 1);
    }

    if (node.type.id === Range) {
      response += '\n' + indent(1) + range;
    }

    if (node.type.id === OffsetExpr) {
      response += offset;
    }

    if (node.type.id === UnwrapExpr) {
      if (previousNode?.type.id !== OffsetExpr && previousNode?.type.id !== Range) {
        response += '\n' + indent(1) + unwrap;
      } else {
        response += ' ' + unwrap;
      }
    }
  });

  return (response += '\n)');
}

export function formatGrouping(node, query) {
  let response = '';

  const labels = iterateNode(node, [Identifier]).map((node) => {
    return query.substring(node.from, node.to);
  });

  iterateNode(node, [By, Without]).forEach((node) => {
    if (node.parent?.type.id !== Grouping) {
      return;
    }

    switch (node.type.id) {
      case By:
        response = ` by (${labels.join(', ')}) `;
        break;

      case Without:
        response = ` without (${labels.join(', ')}) `;
        break;
    }
  });

  return response;
}

export function formatVectorAggregationExpr(node, query) {
  let response = '';

  iterateNode(node, [VectorOp, Number, MetricExpr, Grouping]).forEach((node, _, arr) => {
    if (node.parent?.type.id !== VectorAggregationExpr) {
      return;
    }

    switch (node.type.id) {
      case VectorOp:
        response += `${query.substring(node.from, node.to)}`;
        break;

      case Number:
        response += `(\n`;
        response += `${indent(1) + query.substring(node.from, node.to)},\n`;
        break;

      case MetricExpr: {
        const hasNumber = arr.find((node) => node.type.id === Number && node.parent?.type.id === VectorAggregationExpr);
        response += hasNumber ? '' : '(\n';

        const metricExpr = query.substring(node.from, node.to);
        const metricNode = getNodeFromQuery(metricExpr, MetricExpr);
        response += indentMultiline(formatMetricExpr(metricNode, metricExpr), 1);
        response += '\n)';
        break;
      }

      case Grouping:
        response += formatGrouping(node, query);
        break;
    }
  });

  return response;
}

export function formatBinOpExpr(node, query) {
  let operator;

  const [leftExpr, rightExpr] = iterateNode(node, [Expr]).map((node, idx) => {
    if (idx === 0) {
      operator = query.substring(node.nextSibling?.from ?? 0, node.nextSibling?.to);
    }

    const expr = query.substring(node.from, node.to);
    let expressionNode;

    if (isLogsQuery(expr)) {
      expressionNode = getNodeFromQuery(expr, LogExpr);
      return formatLogExpr(expressionNode, expr);
    } else {
      expressionNode = getNodeFromQuery(expr, MetricExpr);
      return formatMetricExpr(expressionNode, expr);
    }
  });

  return leftExpr + '\n' + operator + '\n' + rightExpr;
}

export function formatLiteralExpr(node, query) {
  node = node.getChild(LiteralExpr) ?? node;
  const addNode = node.getChild(Add);
  const subNode = node.getChild(Sub);
  const numberNode = node.getChild(Number);

  if (!numberNode) {
    return '';
  }

  if (addNode) {
    return `+${query.substring(numberNode.from, numberNode.to)}`;
  }

  if (subNode) {
    return `-${query.substring(numberNode.from, numberNode.to)}`;
  }

  return query.substring(numberNode.from, numberNode.to);
}

export function formatLabelReplaceExpr(node, query) {
  let response = 'label_replace(\n';

  iterateNode(node, [MetricExpr, String]).forEach((node) => {
    if (node.parent?.type.id !== LabelReplaceExpr) {
      return;
    }

    if (node.type.id === MetricExpr) {
      const metricExpr = query.substring(node.from, node.to);
      const metricNode = getNodeFromQuery(metricExpr, MetricExpr);
      response += indentMultiline(formatMetricExpr(metricNode, metricExpr), 1) + ',\n';
    } else {
      response += indent(1) + query.substring(node.from, node.to) + ',\n';
    }
  });

  return trimEnd(response, ',\n') + '\n)';
}

export function formatVectorExpr(node, query) {
  node = node.getChild(VectorExpr) ?? node;
  const numberNode = node.getChild(Number);

  if (!numberNode) {
    return '';
  }

  return `vector(${query.substring(numberNode.from, numberNode.to)})`;
}
