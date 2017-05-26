// @flow
import type {Node, Path} from './types';
import * as t from 'babel-types';
import {isReactComponentClass} from 'babel-react-components';
import findPropsClassProperty from './findPropsClassProperty';
import convertTypeToPropTypes from './convertTypeToPropTypes';
import {log} from 'babel-log';

type PluginOptions = {
  resolveOpts?: Object,
};

export default function() {
  return {
    name: 'react-flow-props-to-prop-types',
    visitor: {
      Program(path: Path, state: {opts: PluginOptions}) {
        path.traverse({
          ClassDeclaration(path) {
            if (!isReactComponentClass(path)) {
              return;
            }

            let props = findPropsClassProperty(path.get('body'));
            if (!props) return;

            let typeAnnotation = props.get('typeAnnotation');
            if (!typeAnnotation.node) {
              throw props.buildCodeFrameError(
                'React component props must have type annotation',
              );
            }

            let propTypesRef = path.hub.file.addImport(
              'prop-types',
              'default',
              'PropTypes',
            );

            let objectExpression = convertTypeToPropTypes(
              typeAnnotation,
              propTypesRef,
              state.opts.resolveOpts,
            );

            let propTypesClassProperty = t.classProperty(
              t.identifier('propTypes'),
              objectExpression,
            );

            propTypesClassProperty.static = true;

            props.insertAfter(propTypesClassProperty);
          },
        });
      },
    },
  };
}
