"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
const Lint = require("tslint");
const ts = require("typescript");
const util_1 = require("../util");
class Rule extends Lint.Rules.TypedRule {
    static FAILURE_STRING(importName, moduleName) {
        return (0, util_1.failure)(Rule.metadata.ruleName, `The module ${moduleName} uses \`export = \`. Import with \`import ${importName} = require(${moduleName})\`.`);
    }
    applyWithProgram(sourceFile, program) {
        return this.applyWithFunction(sourceFile, ctx => walk(ctx, program.getTypeChecker()));
    }
}
exports.Rule = Rule;
Rule.metadata = {
    ruleName: "no-import-default-of-export-equals",
    description: "Forbid a default import to reference an `export =` module.",
    optionsDescription: "Not configurable.",
    options: null,
    type: "functionality",
    typescriptOnly: true,
};
function walk(ctx, checker) {
    (0, util_1.eachModuleStatement)(ctx.sourceFile, statement => {
        if (!ts.isImportDeclaration(statement)) {
            return;
        }
        const defaultName = statement.importClause && statement.importClause.name;
        if (!defaultName) {
            return;
        }
        const sym = checker.getSymbolAtLocation(statement.moduleSpecifier);
        if (sym && sym.declarations && sym.declarations.some(d => {
            const statements = getStatements(d);
            return statements !== undefined && statements.some(s => ts.isExportAssignment(s) && !!s.isExportEquals);
        })) {
            ctx.addFailureAtNode(defaultName, Rule.FAILURE_STRING(defaultName.text, statement.moduleSpecifier.getText()));
        }
    });
}
function getStatements(decl) {
    return ts.isSourceFile(decl) ? decl.statements
        : ts.isModuleDeclaration(decl) ? (0, util_1.getModuleDeclarationStatements)(decl)
            : undefined;
}
//# sourceMappingURL=noImportDefaultOfExportEqualsRule.js.map