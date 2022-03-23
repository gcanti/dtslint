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
    ruleName: "prefer-declare-function",
    description: "Forbids `export const x = () => void`.",
    optionsDescription: "Not configurable.",
    options: null,
    type: "style",
    typescriptOnly: true,
};
Rule.FAILURE_STRING = (0, util_1.failure)(Rule.metadata.ruleName, "Use a function declaration instead of a variable of function type.");
function walk(ctx) {
    (0, util_1.eachModuleStatement)(ctx.sourceFile, statement => {
        if (ts.isVariableStatement(statement)) {
            for (const varDecl of statement.declarationList.declarations) {
                if (varDecl.type !== undefined && varDecl.type.kind === ts.SyntaxKind.FunctionType) {
                    ctx.addFailureAtNode(varDecl, Rule.FAILURE_STRING);
                }
            }
        }
    });
}
//# sourceMappingURL=preferDeclareFunctionRule.js.map