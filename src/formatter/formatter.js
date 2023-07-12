import { MetricExpr, LogExpr, parser, Expr, BinOpExpr } from '../parser.js';
import { formatMetricExpr } from './metrics.js';
import { formatLogExpr } from './logs.js';
import { trimMultiline } from './utils.js';

/**
 * @experimental This feature is subject to change or removal in future versions.
 */
export const formatLokiQuery = (query) => {
  const tree = parser.parse(query);
  let formatted = '';

  tree.iterate({
    enter: (ref) => {
      const node = ref.node;

      if (node.parent?.type.id !== Expr || node.parent?.parent?.type.id === BinOpExpr) {
        return;
      }

      switch (node.type.id) {
        case MetricExpr:
          formatted = formatMetricExpr(node, query);
          return false;

        case LogExpr:
          formatted = formatLogExpr(node, query);
          return false;
      }
    },
  });

  return trimMultiline(formatted);
};
