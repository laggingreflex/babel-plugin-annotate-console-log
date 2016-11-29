// @flow

export default ({
  types: t
}: {
  types: Object
}) => {
  const getExpressionNodeName = (expressionNodePath: Object): string => {
    if (expressionNodePath.node.id) {
      return expressionNodePath.node.id.name;
    } else if (t.isVariableDeclarator(expressionNodePath.parent)) {
      return expressionNodePath.parent.id.name;
    } else if (t.isAssignmentExpression(expressionNodePath.parent)) {
      if (t.isIdentifier(expressionNodePath.parent.left)) {
        return expressionNodePath.parent.left.name;
      } else if (t.isMemberExpression(expressionNodePath.parent.left)) {
        return expressionNodePath.parent.left.object.name + '.' + expressionNodePath.parent.left.property.name;
      }
    }

    return '';
  };

  const getAllParentFunctionNames = (path) => {
    const names = [];

    let currentPath = path;

    while (true) {
      currentPath = currentPath.findParent((subjectPath) => {
        return subjectPath.isFunction() || subjectPath.isProgram() || subjectPath.isClassMethod();
      });

      if (!currentPath) {
        return names;
      }

      if (t.isClassMethod(currentPath)) {
        const parentClass = currentPath.findParent((subjectPath) => {
          return subjectPath.isClassDeclaration() || subjectPath.isClassExpression();
        });

        if (t.isClassDeclaration(parentClass)) {
          names.push(parentClass.node.id.name + '->' + currentPath.node.key.name);
        }

        if (t.isClassExpression(parentClass)) {
          names.push(getExpressionNodeName(parentClass) + '->' + currentPath.node.key.name);
        }
      }

      if (t.isFunctionDeclaration(currentPath.node)) {
        names.push(currentPath.node.id.name);
      }

      if (t.isFunctionExpression(currentPath.node)) {
        names.push(getExpressionNodeName(currentPath));
      }
    }

    throw new Error('Unexpected state.');
  };

  return {
    visitor: {
      CallExpression (path: Object, state: Object) {
        const callee = path.node.callee;

        const calleeObjectName = state.opts.objectName || 'console';
        const calleePropertiesNames = state.opts.objectProperties || ['log', 'info', 'warn', 'error'];
        const objectIsCallable = state.opts.objectIsCallable;

        if (!objectIsCallable && !t.isMemberExpression(callee)) {
          return;
        }

        if (callee.object && callee.object.name !== calleeObjectName) {
          return;
        }

        if (!objectIsCallable && calleePropertiesNames.indexOf(callee.property.name) === -1) {
          return;
        }

        const parentFunctionNames = getAllParentFunctionNames(path)
          .filter((functionName) => {
            // Filter out anonymous function expressions.
            return functionName.length > 0;
          })
          .map((functionName) => {
            const functionInvocationName = functionName + '()';

            return functionInvocationName;
          });

        if (parentFunctionNames.length) {
          path.node.arguments.unshift(
            t.stringLiteral(parentFunctionNames.join(' '))
          );
        }
      }
    }
  };
};
