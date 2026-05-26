'use strict';
/**
 * Web / Storybook stub for react-native's codegenNativeComponent.
 * react-native-safe-area-context (and similar packages) import this in their
 * native spec files. On web we just return a no-op React fragment wrapper so
 * those spec modules load without errors (react-native-web provides the real
 * web implementations anyway).
 */
const React = require('react');

function codegenNativeComponent(viewName) {
  function Stub(props) {
    return React.createElement(React.Fragment, null, props.children || null);
  }
  Stub.displayName = 'Codegen_' + viewName;
  return Stub;
}

module.exports = codegenNativeComponent;
module.exports.default = codegenNativeComponent;
