import { parser } from '../parser.js';
import { MetricExpr } from '../parser.terms.js';

export function getNodeFromQuery(query, nodeType) {
  const nodes = [];
  const tree = parser.parse(query);
  tree.iterate({
    enter: (node) => {
      if (nodeType === undefined || nodeType === node.type.id) {
        nodes.push(node.node);
      }
    },
  });
  return nodes[0];
}

export function isLogsQuery(query) {
  if (getNodeFromQuery(query, MetricExpr)) {
    return false;
  }
  return true;
}

export function indent(level) {
  return '  '.repeat(level);
}

export function indentMultiline(block, level) {
  const lines = block.split('\n');
  return lines.map((line) => indent(level) + line).join('\n');
}

export function trimMultiline(block) {
  const lines = block.split('\n');
  return lines.map((line) => line.trimEnd()).join('\n');
}

export function needsBrackets(node, queryType) {
  const childNodeIsSame = node.firstChild?.type.id === queryType;
  let addBrackets = false;

  if (node.firstChild && childNodeIsSame) {
    addBrackets = true;
    node = node.firstChild;
  }

  return { addBrackets, newNode: node };
}

export function iterateNode(node, lookingFor) {
  const nodes = [];
  let child = node.firstChild;

  while (child) {
    if (lookingFor.includes(child.type.id)) {
      nodes.push(child);
    }

    nodes.push(...iterateNode(child, lookingFor));
    child = child.nextSibling;
  }

  return nodes;
}

export function buildResponse(pipelineType, lastPipelineType, formattedNode) {
  if (lastPipelineType === pipelineType) {
    return ` ${formattedNode}`;
  }

  return `\n${indent(1)}${formattedNode}`;
}

export function trimEnd(input, charactersToTrim) {
  let endIndex = input.length - 1;
  while (endIndex >= 0 && charactersToTrim.includes(input[endIndex])) {
    endIndex--;
  }
  return input.substring(0, endIndex + 1);
}
