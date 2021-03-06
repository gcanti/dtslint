"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const pm = require("parsimmon");
var TypeScriptVersion;
(function (TypeScriptVersion) {
    TypeScriptVersion.all = [
        '2.0',
        '2.1',
        '2.2',
        '2.3',
        '2.4',
        '2.5',
        '2.6',
        '2.7',
        '2.8',
        '2.9',
        '3.0',
        '3.1',
        '3.2',
        '3.3',
        '3.4',
        '3.5',
        '3.6',
        '3.7',
        '3.8',
        '3.9',
        '4.0',
        '4.1',
        '4.2',
        '4.3'
    ];
    TypeScriptVersion.lowest = TypeScriptVersion.all[0];
    /** Latest version that may be specified in a `// TypeScript Version:` header. */
    TypeScriptVersion.latest = TypeScriptVersion.all[TypeScriptVersion.all.length - 1];
    /** @deprecated */
    function isPrerelease(_version) {
        return false;
    }
    TypeScriptVersion.isPrerelease = isPrerelease;
    function range(min) {
        return TypeScriptVersion.all.filter(v => v >= min);
    }
    TypeScriptVersion.range = range;
    const allTags = [
        'ts2.0',
        'ts2.1',
        'ts2.2',
        'ts2.3',
        'ts2.4',
        'ts2.5',
        'ts2.6',
        'ts2.7',
        'ts2.8',
        'ts2.9',
        'ts3.0',
        'ts3.1',
        'ts3.2',
        'ts3.3',
        'ts3.4',
        'latest'
    ];
    /** List of NPM tags that should be changed to point to the latest version. */
    function tagsToUpdate(typeScriptVersion) {
        // A 2.0-compatible package is assumed compatible with TypeScript 2.1
        // We want the "2.1" tag to always exist.
        const idx = allTags.indexOf(`ts${typeScriptVersion}`);
        if (idx === -1) {
            throw new Error();
        }
        return allTags.slice(idx);
    }
    TypeScriptVersion.tagsToUpdate = tagsToUpdate;
    function previous(v) {
        const index = TypeScriptVersion.all.indexOf(v);
        assert(index !== -1);
        return index === 0 ? undefined : TypeScriptVersion.all[index - 1];
    }
    TypeScriptVersion.previous = previous;
    function isRedirectable(v) {
        return TypeScriptVersion.all.indexOf(v) >= TypeScriptVersion.all.indexOf('3.1');
    }
    TypeScriptVersion.isRedirectable = isRedirectable;
})(TypeScriptVersion = exports.TypeScriptVersion || (exports.TypeScriptVersion = {}));
function isTypeScriptVersion(str) {
    return TypeScriptVersion.all.includes(str);
}
exports.isTypeScriptVersion = isTypeScriptVersion;
function makeTypesVersionsForPackageJson(typesVersions) {
    if (typesVersions.length === 0) {
        return undefined;
    }
    const out = {};
    for (const version of typesVersions) {
        out[`>=${version}.0-0`] = { '*': [`ts${version}/*`] };
    }
    return out;
}
exports.makeTypesVersionsForPackageJson = makeTypesVersionsForPackageJson;
function parseHeaderOrFail(mainFileContent) {
    const header = parseHeader(mainFileContent, /*strict*/ false);
    if (isParseError(header)) {
        throw new Error(renderParseError(header));
    }
    return header;
}
exports.parseHeaderOrFail = parseHeaderOrFail;
function validate(mainFileContent) {
    const h = parseHeader(mainFileContent, /*strict*/ true);
    return isParseError(h) ? h : undefined;
}
exports.validate = validate;
function renderExpected(expected) {
    return expected.length === 1 ? expected[0] : `one of\n\t${expected.join('\n\t')}`;
}
exports.renderExpected = renderExpected;
function renderParseError({ line, column, expected }) {
    return `At ${line}:${column} : Expected ${renderExpected(expected)}`;
}
function isParseError(x) {
    // tslint:disable-next-line strict-type-predicates
    return x.expected !== undefined;
}
/** @param strict If true, we allow fewer things to be parsed. Turned on by linting. */
function parseHeader(text, strict) {
    const res = headerParser(strict).parse(text);
    return res.status
        ? res.value
        : { index: res.index.offset, line: res.index.line, column: res.index.column, expected: res.expected };
}
function headerParser(strict) {
    return pm.seqMap(pm.regex(/\/\/ Type definitions for (non-npm package )?/), parseLabel(strict), pm.string('// Project: '), projectParser, pm.regexp(/\r?\n\/\/ Definitions by: /), contributorsParser(strict), definitionsParser, typeScriptVersionParser, pm.all, // Don't care about the rest of the file
    // tslint:disable-next-line:variable-name
    (str, label, _project, projects, _defsBy, contributors, _definitions, typeScriptVersion) => ({
        libraryName: label.name,
        libraryMajorVersion: label.major,
        libraryMinorVersion: label.minor,
        nonNpm: str.endsWith('non-npm package '),
        projects,
        contributors,
        typeScriptVersion
    }));
}
/*
Allow any of the following:

// Project: https://foo.com
//          https://bar.com

// Project: https://foo.com,
//          https://bar.com

// Project: https://foo.com, https://bar.com

Use `\s\s+` to ensure at least 2 spaces, to  disambiguate from the next line being `// Definitions by:`.
*/
const separator = pm.regexp(/(, )|(,?\r?\n\/\/\s\s+)/);
const projectParser = pm.sepBy1(pm.regexp(/[^,\r\n]+/), separator);
function contributorsParser(strict) {
    const contributor = strict
        ? pm.seqMap(pm.regexp(/([^<]+) /, 1), pm.regexp(/\<https\:\/\/github\.com\/([a-zA-Z\d\-]+)\>/, 1), (name, githubUsername) => ({ name, url: `https://github.com/${githubUsername}`, githubUsername }))
        : // In non-strict mode, allows arbitrary URL, and trailing whitespace.
            pm.seqMap(pm.regexp(/([^<]+) /, 1), pm.regexp(/<([^>]+)> */, 1), (name, url) => {
                const rgx = /^https\:\/\/github.com\/([a-zA-Z\d\-]+)$/;
                const match = rgx.exec(url);
                // tslint:disable-next-line no-null-keyword
                return { name, url, githubUsername: match === null ? undefined : match[1] };
            });
    return pm.sepBy1(contributor, separator);
}
// TODO: Should we do something with the URL?
const definitionsParser = pm.regexp(/\r?\n\/\/ Definitions: [^\r\n]+/);
function parseLabel(strict) {
    return pm.Parser((input, index) => {
        // Take all until the first newline.
        const endIndex = regexpIndexOf(input, /\r|\n/, index);
        if (endIndex === -1) {
            return fail('EOF');
        }
        // Index past the end of the newline.
        const end = input[endIndex] === '\r' ? endIndex + 2 : endIndex + 1;
        const tilNewline = input.slice(index, endIndex);
        // Parse in reverse. Once we've stripped off the version, the rest is the libary name.
        const reversed = reverse(tilNewline);
        // Last digit is allowed to be "x", which acts like "0"
        const rgx = /((\d+|x)\.(\d+)(\.\d+)?(v)? )?(.+)/;
        const match = rgx.exec(reversed);
        if (match === null) {
            // tslint:disable-line no-null-keyword
            return fail();
        }
        const [, version, a, b, c, v, nameReverse] = match;
        let majorReverse;
        let minorReverse;
        if (version !== undefined) {
            // tslint:disable-line strict-type-predicates
            if (c !== undefined) {
                // tslint:disable-line strict-type-predicates
                // There is a patch version
                majorReverse = c;
                minorReverse = b;
                if (strict) {
                    return fail('patch version not allowed');
                }
            }
            else {
                majorReverse = b;
                minorReverse = a;
            }
            if (v !== undefined && strict) {
                // tslint:disable-line strict-type-predicates
                return fail(`'v' not allowed`);
            }
        }
        else {
            if (strict) {
                return fail('Needs MAJOR.MINOR');
            }
            majorReverse = '0';
            minorReverse = '0';
        }
        const [name, major, minor] = [reverse(nameReverse), reverse(majorReverse), reverse(minorReverse)];
        return pm.makeSuccess(end, {
            name,
            major: intOfString(major),
            minor: minor === 'x' ? 0 : intOfString(minor)
        });
        function fail(msg) {
            let expected = 'foo MAJOR.MINOR';
            if (msg !== undefined) {
                expected += ` (${msg})`;
            }
            return pm.makeFailure(index, expected);
        }
    });
}
const typeScriptVersionLineParser = pm
    .regexp(/\/\/ TypeScript Version: (\d.(\d))/, 1)
    .chain(v => TypeScriptVersion.all.includes(v)
    ? pm.succeed(v)
    : pm.fail(`TypeScript ${v} is not yet supported.`));
const typeScriptVersionParser = pm
    .regexp(/\r?\n/)
    .then(typeScriptVersionLineParser)
    .fallback('2.0');
function parseTypeScriptVersionLine(line) {
    const result = typeScriptVersionLineParser.parse(line);
    if (!result.status) {
        throw new Error(`Could not parse version: line is '${line}'`);
    }
    return result.value;
}
exports.parseTypeScriptVersionLine = parseTypeScriptVersionLine;
function reverse(s) {
    let out = '';
    for (let i = s.length - 1; i >= 0; i--) {
        out += s[i];
    }
    return out;
}
function regexpIndexOf(s, rgx, start) {
    const index = s.slice(start).search(rgx);
    return index === -1 ? index : index + start;
}
function intOfString(str) {
    const n = Number.parseInt(str, 10);
    if (Number.isNaN(n)) {
        throw new Error(`Error in parseInt(${JSON.stringify(str)})`);
    }
    return n;
}
//# sourceMappingURL=definitelytyped-header-parser.js.map