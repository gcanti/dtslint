"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
const Lint = require("tslint");
const ts = require("typescript");
const util_1 = require("../util");
class Rule extends Lint.Rules.AbstractRule {
    apply(sourceFile) {
        return this.applyWithFunction(sourceFile, walk);
    }
}
exports.Rule = Rule;
Rule.metadata = {
    ruleName: 'no-single-element-tuple-type',
    description: 'Forbids `[T]`, which should be `T[]`.',
    optionsDescription: 'Not configurable.',
    options: null,
    type: 'functionality',
    typescriptOnly: true,
};
function walk(ctx) {
    const { sourceFile } = ctx;
    sourceFile.forEachChild(function cb(node) {
        var _a;
        if (ts.isTupleTypeNode(node) && ((_a = node.elements) !== null && _a !== void 0 ? _a : node.elementTypes).length === 1) {
            ctx.addFailureAtNode(node, (0, util_1.failure)(Rule.metadata.ruleName, 'Type [T] is a single-element tuple type. You probably meant T[].'));
        }
        node.forEachChild(cb);
    });
}
//# sourceMappingURL=noSingleElementTupleTypeRule.js.map