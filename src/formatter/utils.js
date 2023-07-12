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
