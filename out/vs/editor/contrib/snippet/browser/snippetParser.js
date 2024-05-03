/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetParser = exports.TextmateSnippet = exports.Variable = exports.FormatString = exports.Transform = exports.Choice = exports.Placeholder = exports.TransformableMarker = exports.Text = exports.Marker = exports.Scanner = exports.TokenType = void 0;
    var TokenType;
    (function (TokenType) {
        TokenType[TokenType["Dollar"] = 0] = "Dollar";
        TokenType[TokenType["Colon"] = 1] = "Colon";
        TokenType[TokenType["Comma"] = 2] = "Comma";
        TokenType[TokenType["CurlyOpen"] = 3] = "CurlyOpen";
        TokenType[TokenType["CurlyClose"] = 4] = "CurlyClose";
        TokenType[TokenType["Backslash"] = 5] = "Backslash";
        TokenType[TokenType["Forwardslash"] = 6] = "Forwardslash";
        TokenType[TokenType["Pipe"] = 7] = "Pipe";
        TokenType[TokenType["Int"] = 8] = "Int";
        TokenType[TokenType["VariableName"] = 9] = "VariableName";
        TokenType[TokenType["Format"] = 10] = "Format";
        TokenType[TokenType["Plus"] = 11] = "Plus";
        TokenType[TokenType["Dash"] = 12] = "Dash";
        TokenType[TokenType["QuestionMark"] = 13] = "QuestionMark";
        TokenType[TokenType["EOF"] = 14] = "EOF";
    })(TokenType || (exports.TokenType = TokenType = {}));
    class Scanner {
        constructor() {
            this.value = '';
            this.pos = 0;
        }
        static { this._table = {
            [36 /* CharCode.DollarSign */]: 0 /* TokenType.Dollar */,
            [58 /* CharCode.Colon */]: 1 /* TokenType.Colon */,
            [44 /* CharCode.Comma */]: 2 /* TokenType.Comma */,
            [123 /* CharCode.OpenCurlyBrace */]: 3 /* TokenType.CurlyOpen */,
            [125 /* CharCode.CloseCurlyBrace */]: 4 /* TokenType.CurlyClose */,
            [92 /* CharCode.Backslash */]: 5 /* TokenType.Backslash */,
            [47 /* CharCode.Slash */]: 6 /* TokenType.Forwardslash */,
            [124 /* CharCode.Pipe */]: 7 /* TokenType.Pipe */,
            [43 /* CharCode.Plus */]: 11 /* TokenType.Plus */,
            [45 /* CharCode.Dash */]: 12 /* TokenType.Dash */,
            [63 /* CharCode.QuestionMark */]: 13 /* TokenType.QuestionMark */,
        }; }
        static isDigitCharacter(ch) {
            return ch >= 48 /* CharCode.Digit0 */ && ch <= 57 /* CharCode.Digit9 */;
        }
        static isVariableCharacter(ch) {
            return ch === 95 /* CharCode.Underline */
                || (ch >= 97 /* CharCode.a */ && ch <= 122 /* CharCode.z */)
                || (ch >= 65 /* CharCode.A */ && ch <= 90 /* CharCode.Z */);
        }
        text(value) {
            this.value = value;
            this.pos = 0;
        }
        tokenText(token) {
            return this.value.substr(token.pos, token.len);
        }
        next() {
            if (this.pos >= this.value.length) {
                return { type: 14 /* TokenType.EOF */, pos: this.pos, len: 0 };
            }
            const pos = this.pos;
            let len = 0;
            let ch = this.value.charCodeAt(pos);
            let type;
            // static types
            type = Scanner._table[ch];
            if (typeof type === 'number') {
                this.pos += 1;
                return { type, pos, len: 1 };
            }
            // number
            if (Scanner.isDigitCharacter(ch)) {
                type = 8 /* TokenType.Int */;
                do {
                    len += 1;
                    ch = this.value.charCodeAt(pos + len);
                } while (Scanner.isDigitCharacter(ch));
                this.pos += len;
                return { type, pos, len };
            }
            // variable name
            if (Scanner.isVariableCharacter(ch)) {
                type = 9 /* TokenType.VariableName */;
                do {
                    ch = this.value.charCodeAt(pos + (++len));
                } while (Scanner.isVariableCharacter(ch) || Scanner.isDigitCharacter(ch));
                this.pos += len;
                return { type, pos, len };
            }
            // format
            type = 10 /* TokenType.Format */;
            do {
                len += 1;
                ch = this.value.charCodeAt(pos + len);
            } while (!isNaN(ch)
                && typeof Scanner._table[ch] === 'undefined' // not static token
                && !Scanner.isDigitCharacter(ch) // not number
                && !Scanner.isVariableCharacter(ch) // not variable
            );
            this.pos += len;
            return { type, pos, len };
        }
    }
    exports.Scanner = Scanner;
    class Marker {
        constructor() {
            this._children = [];
        }
        appendChild(child) {
            if (child instanceof Text && this._children[this._children.length - 1] instanceof Text) {
                // this and previous child are text -> merge them
                this._children[this._children.length - 1].value += child.value;
            }
            else {
                // normal adoption of child
                child.parent = this;
                this._children.push(child);
            }
            return this;
        }
        replace(child, others) {
            const { parent } = child;
            const idx = parent.children.indexOf(child);
            const newChildren = parent.children.slice(0);
            newChildren.splice(idx, 1, ...others);
            parent._children = newChildren;
            (function _fixParent(children, parent) {
                for (const child of children) {
                    child.parent = parent;
                    _fixParent(child.children, child);
                }
            })(others, parent);
        }
        get children() {
            return this._children;
        }
        get rightMostDescendant() {
            if (this._children.length > 0) {
                return this._children[this._children.length - 1].rightMostDescendant;
            }
            return this;
        }
        get snippet() {
            let candidate = this;
            while (true) {
                if (!candidate) {
                    return undefined;
                }
                if (candidate instanceof TextmateSnippet) {
                    return candidate;
                }
                candidate = candidate.parent;
            }
        }
        toString() {
            return this.children.reduce((prev, cur) => prev + cur.toString(), '');
        }
        len() {
            return 0;
        }
    }
    exports.Marker = Marker;
    class Text extends Marker {
        static escape(value) {
            return value.replace(/\$|}|\\/g, '\\$&');
        }
        constructor(value) {
            super();
            this.value = value;
        }
        toString() {
            return this.value;
        }
        toTextmateString() {
            return Text.escape(this.value);
        }
        len() {
            return this.value.length;
        }
        clone() {
            return new Text(this.value);
        }
    }
    exports.Text = Text;
    class TransformableMarker extends Marker {
    }
    exports.TransformableMarker = TransformableMarker;
    class Placeholder extends TransformableMarker {
        static compareByIndex(a, b) {
            if (a.index === b.index) {
                return 0;
            }
            else if (a.isFinalTabstop) {
                return 1;
            }
            else if (b.isFinalTabstop) {
                return -1;
            }
            else if (a.index < b.index) {
                return -1;
            }
            else if (a.index > b.index) {
                return 1;
            }
            else {
                return 0;
            }
        }
        constructor(index) {
            super();
            this.index = index;
        }
        get isFinalTabstop() {
            return this.index === 0;
        }
        get choice() {
            return this._children.length === 1 && this._children[0] instanceof Choice
                ? this._children[0]
                : undefined;
        }
        toTextmateString() {
            let transformString = '';
            if (this.transform) {
                transformString = this.transform.toTextmateString();
            }
            if (this.children.length === 0 && !this.transform) {
                return `\$${this.index}`;
            }
            else if (this.children.length === 0) {
                return `\${${this.index}${transformString}}`;
            }
            else if (this.choice) {
                return `\${${this.index}|${this.choice.toTextmateString()}|${transformString}}`;
            }
            else {
                return `\${${this.index}:${this.children.map(child => child.toTextmateString()).join('')}${transformString}}`;
            }
        }
        clone() {
            const ret = new Placeholder(this.index);
            if (this.transform) {
                ret.transform = this.transform.clone();
            }
            ret._children = this.children.map(child => child.clone());
            return ret;
        }
    }
    exports.Placeholder = Placeholder;
    class Choice extends Marker {
        constructor() {
            super(...arguments);
            this.options = [];
        }
        appendChild(marker) {
            if (marker instanceof Text) {
                marker.parent = this;
                this.options.push(marker);
            }
            return this;
        }
        toString() {
            return this.options[0].value;
        }
        toTextmateString() {
            return this.options
                .map(option => option.value.replace(/\||,|\\/g, '\\$&'))
                .join(',');
        }
        len() {
            return this.options[0].len();
        }
        clone() {
            const ret = new Choice();
            this.options.forEach(ret.appendChild, ret);
            return ret;
        }
    }
    exports.Choice = Choice;
    class Transform extends Marker {
        constructor() {
            super(...arguments);
            this.regexp = new RegExp('');
        }
        resolve(value) {
            const _this = this;
            let didMatch = false;
            let ret = value.replace(this.regexp, function () {
                didMatch = true;
                return _this._replace(Array.prototype.slice.call(arguments, 0, -2));
            });
            // when the regex didn't match and when the transform has
            // else branches, then run those
            if (!didMatch && this._children.some(child => child instanceof FormatString && Boolean(child.elseValue))) {
                ret = this._replace([]);
            }
            return ret;
        }
        _replace(groups) {
            let ret = '';
            for (const marker of this._children) {
                if (marker instanceof FormatString) {
                    let value = groups[marker.index] || '';
                    value = marker.resolve(value);
                    ret += value;
                }
                else {
                    ret += marker.toString();
                }
            }
            return ret;
        }
        toString() {
            return '';
        }
        toTextmateString() {
            return `/${this.regexp.source}/${this.children.map(c => c.toTextmateString())}/${(this.regexp.ignoreCase ? 'i' : '') + (this.regexp.global ? 'g' : '')}`;
        }
        clone() {
            const ret = new Transform();
            ret.regexp = new RegExp(this.regexp.source, '' + (this.regexp.ignoreCase ? 'i' : '') + (this.regexp.global ? 'g' : ''));
            ret._children = this.children.map(child => child.clone());
            return ret;
        }
    }
    exports.Transform = Transform;
    class FormatString extends Marker {
        constructor(index, shorthandName, ifValue, elseValue) {
            super();
            this.index = index;
            this.shorthandName = shorthandName;
            this.ifValue = ifValue;
            this.elseValue = elseValue;
        }
        resolve(value) {
            if (this.shorthandName === 'upcase') {
                return !value ? '' : value.toLocaleUpperCase();
            }
            else if (this.shorthandName === 'downcase') {
                return !value ? '' : value.toLocaleLowerCase();
            }
            else if (this.shorthandName === 'capitalize') {
                return !value ? '' : (value[0].toLocaleUpperCase() + value.substr(1));
            }
            else if (this.shorthandName === 'pascalcase') {
                return !value ? '' : this._toPascalCase(value);
            }
            else if (this.shorthandName === 'camelcase') {
                return !value ? '' : this._toCamelCase(value);
            }
            else if (Boolean(value) && typeof this.ifValue === 'string') {
                return this.ifValue;
            }
            else if (!Boolean(value) && typeof this.elseValue === 'string') {
                return this.elseValue;
            }
            else {
                return value || '';
            }
        }
        _toPascalCase(value) {
            const match = value.match(/[a-z0-9]+/gi);
            if (!match) {
                return value;
            }
            return match.map(word => {
                return word.charAt(0).toUpperCase() + word.substr(1);
            })
                .join('');
        }
        _toCamelCase(value) {
            const match = value.match(/[a-z0-9]+/gi);
            if (!match) {
                return value;
            }
            return match.map((word, index) => {
                if (index === 0) {
                    return word.charAt(0).toLowerCase() + word.substr(1);
                }
                return word.charAt(0).toUpperCase() + word.substr(1);
            })
                .join('');
        }
        toTextmateString() {
            let value = '${';
            value += this.index;
            if (this.shorthandName) {
                value += `:/${this.shorthandName}`;
            }
            else if (this.ifValue && this.elseValue) {
                value += `:?${this.ifValue}:${this.elseValue}`;
            }
            else if (this.ifValue) {
                value += `:+${this.ifValue}`;
            }
            else if (this.elseValue) {
                value += `:-${this.elseValue}`;
            }
            value += '}';
            return value;
        }
        clone() {
            const ret = new FormatString(this.index, this.shorthandName, this.ifValue, this.elseValue);
            return ret;
        }
    }
    exports.FormatString = FormatString;
    class Variable extends TransformableMarker {
        constructor(name) {
            super();
            this.name = name;
        }
        resolve(resolver) {
            let value = resolver.resolve(this);
            if (this.transform) {
                value = this.transform.resolve(value || '');
            }
            if (value !== undefined) {
                this._children = [new Text(value)];
                return true;
            }
            return false;
        }
        toTextmateString() {
            let transformString = '';
            if (this.transform) {
                transformString = this.transform.toTextmateString();
            }
            if (this.children.length === 0) {
                return `\${${this.name}${transformString}}`;
            }
            else {
                return `\${${this.name}:${this.children.map(child => child.toTextmateString()).join('')}${transformString}}`;
            }
        }
        clone() {
            const ret = new Variable(this.name);
            if (this.transform) {
                ret.transform = this.transform.clone();
            }
            ret._children = this.children.map(child => child.clone());
            return ret;
        }
    }
    exports.Variable = Variable;
    function walk(marker, visitor) {
        const stack = [...marker];
        while (stack.length > 0) {
            const marker = stack.shift();
            const recurse = visitor(marker);
            if (!recurse) {
                break;
            }
            stack.unshift(...marker.children);
        }
    }
    class TextmateSnippet extends Marker {
        get placeholderInfo() {
            if (!this._placeholders) {
                // fill in placeholders
                const all = [];
                let last;
                this.walk(function (candidate) {
                    if (candidate instanceof Placeholder) {
                        all.push(candidate);
                        last = !last || last.index < candidate.index ? candidate : last;
                    }
                    return true;
                });
                this._placeholders = { all, last };
            }
            return this._placeholders;
        }
        get placeholders() {
            const { all } = this.placeholderInfo;
            return all;
        }
        offset(marker) {
            let pos = 0;
            let found = false;
            this.walk(candidate => {
                if (candidate === marker) {
                    found = true;
                    return false;
                }
                pos += candidate.len();
                return true;
            });
            if (!found) {
                return -1;
            }
            return pos;
        }
        fullLen(marker) {
            let ret = 0;
            walk([marker], marker => {
                ret += marker.len();
                return true;
            });
            return ret;
        }
        enclosingPlaceholders(placeholder) {
            const ret = [];
            let { parent } = placeholder;
            while (parent) {
                if (parent instanceof Placeholder) {
                    ret.push(parent);
                }
                parent = parent.parent;
            }
            return ret;
        }
        resolveVariables(resolver) {
            this.walk(candidate => {
                if (candidate instanceof Variable) {
                    if (candidate.resolve(resolver)) {
                        this._placeholders = undefined;
                    }
                }
                return true;
            });
            return this;
        }
        appendChild(child) {
            this._placeholders = undefined;
            return super.appendChild(child);
        }
        replace(child, others) {
            this._placeholders = undefined;
            return super.replace(child, others);
        }
        toTextmateString() {
            return this.children.reduce((prev, cur) => prev + cur.toTextmateString(), '');
        }
        clone() {
            const ret = new TextmateSnippet();
            this._children = this.children.map(child => child.clone());
            return ret;
        }
        walk(visitor) {
            walk(this.children, visitor);
        }
    }
    exports.TextmateSnippet = TextmateSnippet;
    class SnippetParser {
        constructor() {
            this._scanner = new Scanner();
            this._token = { type: 14 /* TokenType.EOF */, pos: 0, len: 0 };
        }
        static escape(value) {
            return value.replace(/\$|}|\\/g, '\\$&');
        }
        /**
         * Takes a snippet and returns the insertable string, e.g return the snippet-string
         * without any placeholder, tabstop, variables etc...
         */
        static asInsertText(value) {
            return new SnippetParser().parse(value).toString();
        }
        static guessNeedsClipboard(template) {
            return /\${?CLIPBOARD/.test(template);
        }
        parse(value, insertFinalTabstop, enforceFinalTabstop) {
            const snippet = new TextmateSnippet();
            this.parseFragment(value, snippet);
            this.ensureFinalTabstop(snippet, enforceFinalTabstop ?? false, insertFinalTabstop ?? false);
            return snippet;
        }
        parseFragment(value, snippet) {
            const offset = snippet.children.length;
            this._scanner.text(value);
            this._token = this._scanner.next();
            while (this._parse(snippet)) {
                // nothing
            }
            // fill in values for placeholders. the first placeholder of an index
            // that has a value defines the value for all placeholders with that index
            const placeholderDefaultValues = new Map();
            const incompletePlaceholders = [];
            snippet.walk(marker => {
                if (marker instanceof Placeholder) {
                    if (marker.isFinalTabstop) {
                        placeholderDefaultValues.set(0, undefined);
                    }
                    else if (!placeholderDefaultValues.has(marker.index) && marker.children.length > 0) {
                        placeholderDefaultValues.set(marker.index, marker.children);
                    }
                    else {
                        incompletePlaceholders.push(marker);
                    }
                }
                return true;
            });
            const fillInIncompletePlaceholder = (placeholder, stack) => {
                const defaultValues = placeholderDefaultValues.get(placeholder.index);
                if (!defaultValues) {
                    return;
                }
                const clone = new Placeholder(placeholder.index);
                clone.transform = placeholder.transform;
                for (const child of defaultValues) {
                    const newChild = child.clone();
                    clone.appendChild(newChild);
                    // "recurse" on children that are again placeholders
                    if (newChild instanceof Placeholder && placeholderDefaultValues.has(newChild.index) && !stack.has(newChild.index)) {
                        stack.add(newChild.index);
                        fillInIncompletePlaceholder(newChild, stack);
                        stack.delete(newChild.index);
                    }
                }
                snippet.replace(placeholder, [clone]);
            };
            const stack = new Set();
            for (const placeholder of incompletePlaceholders) {
                fillInIncompletePlaceholder(placeholder, stack);
            }
            return snippet.children.slice(offset);
        }
        ensureFinalTabstop(snippet, enforceFinalTabstop, insertFinalTabstop) {
            if (enforceFinalTabstop || insertFinalTabstop && snippet.placeholders.length > 0) {
                const finalTabstop = snippet.placeholders.find(p => p.index === 0);
                if (!finalTabstop) {
                    // the snippet uses placeholders but has no
                    // final tabstop defined -> insert at the end
                    snippet.appendChild(new Placeholder(0));
                }
            }
        }
        _accept(type, value) {
            if (type === undefined || this._token.type === type) {
                const ret = !value ? true : this._scanner.tokenText(this._token);
                this._token = this._scanner.next();
                return ret;
            }
            return false;
        }
        _backTo(token) {
            this._scanner.pos = token.pos + token.len;
            this._token = token;
            return false;
        }
        _until(type) {
            const start = this._token;
            while (this._token.type !== type) {
                if (this._token.type === 14 /* TokenType.EOF */) {
                    return false;
                }
                else if (this._token.type === 5 /* TokenType.Backslash */) {
                    const nextToken = this._scanner.next();
                    if (nextToken.type !== 0 /* TokenType.Dollar */
                        && nextToken.type !== 4 /* TokenType.CurlyClose */
                        && nextToken.type !== 5 /* TokenType.Backslash */) {
                        return false;
                    }
                }
                this._token = this._scanner.next();
            }
            const value = this._scanner.value.substring(start.pos, this._token.pos).replace(/\\(\$|}|\\)/g, '$1');
            this._token = this._scanner.next();
            return value;
        }
        _parse(marker) {
            return this._parseEscaped(marker)
                || this._parseTabstopOrVariableName(marker)
                || this._parseComplexPlaceholder(marker)
                || this._parseComplexVariable(marker)
                || this._parseAnything(marker);
        }
        // \$, \\, \} -> just text
        _parseEscaped(marker) {
            let value;
            if (value = this._accept(5 /* TokenType.Backslash */, true)) {
                // saw a backslash, append escaped token or that backslash
                value = this._accept(0 /* TokenType.Dollar */, true)
                    || this._accept(4 /* TokenType.CurlyClose */, true)
                    || this._accept(5 /* TokenType.Backslash */, true)
                    || value;
                marker.appendChild(new Text(value));
                return true;
            }
            return false;
        }
        // $foo -> variable, $1 -> tabstop
        _parseTabstopOrVariableName(parent) {
            let value;
            const token = this._token;
            const match = this._accept(0 /* TokenType.Dollar */)
                && (value = this._accept(9 /* TokenType.VariableName */, true) || this._accept(8 /* TokenType.Int */, true));
            if (!match) {
                return this._backTo(token);
            }
            parent.appendChild(/^\d+$/.test(value)
                ? new Placeholder(Number(value))
                : new Variable(value));
            return true;
        }
        // ${1:<children>}, ${1} -> placeholder
        _parseComplexPlaceholder(parent) {
            let index;
            const token = this._token;
            const match = this._accept(0 /* TokenType.Dollar */)
                && this._accept(3 /* TokenType.CurlyOpen */)
                && (index = this._accept(8 /* TokenType.Int */, true));
            if (!match) {
                return this._backTo(token);
            }
            const placeholder = new Placeholder(Number(index));
            if (this._accept(1 /* TokenType.Colon */)) {
                // ${1:<children>}
                while (true) {
                    // ...} -> done
                    if (this._accept(4 /* TokenType.CurlyClose */)) {
                        parent.appendChild(placeholder);
                        return true;
                    }
                    if (this._parse(placeholder)) {
                        continue;
                    }
                    // fallback
                    parent.appendChild(new Text('${' + index + ':'));
                    placeholder.children.forEach(parent.appendChild, parent);
                    return true;
                }
            }
            else if (placeholder.index > 0 && this._accept(7 /* TokenType.Pipe */)) {
                // ${1|one,two,three|}
                const choice = new Choice();
                while (true) {
                    if (this._parseChoiceElement(choice)) {
                        if (this._accept(2 /* TokenType.Comma */)) {
                            // opt, -> more
                            continue;
                        }
                        if (this._accept(7 /* TokenType.Pipe */)) {
                            placeholder.appendChild(choice);
                            if (this._accept(4 /* TokenType.CurlyClose */)) {
                                // ..|} -> done
                                parent.appendChild(placeholder);
                                return true;
                            }
                        }
                    }
                    this._backTo(token);
                    return false;
                }
            }
            else if (this._accept(6 /* TokenType.Forwardslash */)) {
                // ${1/<regex>/<format>/<options>}
                if (this._parseTransform(placeholder)) {
                    parent.appendChild(placeholder);
                    return true;
                }
                this._backTo(token);
                return false;
            }
            else if (this._accept(4 /* TokenType.CurlyClose */)) {
                // ${1}
                parent.appendChild(placeholder);
                return true;
            }
            else {
                // ${1 <- missing curly or colon
                return this._backTo(token);
            }
        }
        _parseChoiceElement(parent) {
            const token = this._token;
            const values = [];
            while (true) {
                if (this._token.type === 2 /* TokenType.Comma */ || this._token.type === 7 /* TokenType.Pipe */) {
                    break;
                }
                let value;
                if (value = this._accept(5 /* TokenType.Backslash */, true)) {
                    // \, \|, or \\
                    value = this._accept(2 /* TokenType.Comma */, true)
                        || this._accept(7 /* TokenType.Pipe */, true)
                        || this._accept(5 /* TokenType.Backslash */, true)
                        || value;
                }
                else {
                    value = this._accept(undefined, true);
                }
                if (!value) {
                    // EOF
                    this._backTo(token);
                    return false;
                }
                values.push(value);
            }
            if (values.length === 0) {
                this._backTo(token);
                return false;
            }
            parent.appendChild(new Text(values.join('')));
            return true;
        }
        // ${foo:<children>}, ${foo} -> variable
        _parseComplexVariable(parent) {
            let name;
            const token = this._token;
            const match = this._accept(0 /* TokenType.Dollar */)
                && this._accept(3 /* TokenType.CurlyOpen */)
                && (name = this._accept(9 /* TokenType.VariableName */, true));
            if (!match) {
                return this._backTo(token);
            }
            const variable = new Variable(name);
            if (this._accept(1 /* TokenType.Colon */)) {
                // ${foo:<children>}
                while (true) {
                    // ...} -> done
                    if (this._accept(4 /* TokenType.CurlyClose */)) {
                        parent.appendChild(variable);
                        return true;
                    }
                    if (this._parse(variable)) {
                        continue;
                    }
                    // fallback
                    parent.appendChild(new Text('${' + name + ':'));
                    variable.children.forEach(parent.appendChild, parent);
                    return true;
                }
            }
            else if (this._accept(6 /* TokenType.Forwardslash */)) {
                // ${foo/<regex>/<format>/<options>}
                if (this._parseTransform(variable)) {
                    parent.appendChild(variable);
                    return true;
                }
                this._backTo(token);
                return false;
            }
            else if (this._accept(4 /* TokenType.CurlyClose */)) {
                // ${foo}
                parent.appendChild(variable);
                return true;
            }
            else {
                // ${foo <- missing curly or colon
                return this._backTo(token);
            }
        }
        _parseTransform(parent) {
            // ...<regex>/<format>/<options>}
            const transform = new Transform();
            let regexValue = '';
            let regexOptions = '';
            // (1) /regex
            while (true) {
                if (this._accept(6 /* TokenType.Forwardslash */)) {
                    break;
                }
                let escaped;
                if (escaped = this._accept(5 /* TokenType.Backslash */, true)) {
                    escaped = this._accept(6 /* TokenType.Forwardslash */, true) || escaped;
                    regexValue += escaped;
                    continue;
                }
                if (this._token.type !== 14 /* TokenType.EOF */) {
                    regexValue += this._accept(undefined, true);
                    continue;
                }
                return false;
            }
            // (2) /format
            while (true) {
                if (this._accept(6 /* TokenType.Forwardslash */)) {
                    break;
                }
                let escaped;
                if (escaped = this._accept(5 /* TokenType.Backslash */, true)) {
                    escaped = this._accept(5 /* TokenType.Backslash */, true) || this._accept(6 /* TokenType.Forwardslash */, true) || escaped;
                    transform.appendChild(new Text(escaped));
                    continue;
                }
                if (this._parseFormatString(transform) || this._parseAnything(transform)) {
                    continue;
                }
                return false;
            }
            // (3) /option
            while (true) {
                if (this._accept(4 /* TokenType.CurlyClose */)) {
                    break;
                }
                if (this._token.type !== 14 /* TokenType.EOF */) {
                    regexOptions += this._accept(undefined, true);
                    continue;
                }
                return false;
            }
            try {
                transform.regexp = new RegExp(regexValue, regexOptions);
            }
            catch (e) {
                // invalid regexp
                return false;
            }
            parent.transform = transform;
            return true;
        }
        _parseFormatString(parent) {
            const token = this._token;
            if (!this._accept(0 /* TokenType.Dollar */)) {
                return false;
            }
            let complex = false;
            if (this._accept(3 /* TokenType.CurlyOpen */)) {
                complex = true;
            }
            const index = this._accept(8 /* TokenType.Int */, true);
            if (!index) {
                this._backTo(token);
                return false;
            }
            else if (!complex) {
                // $1
                parent.appendChild(new FormatString(Number(index)));
                return true;
            }
            else if (this._accept(4 /* TokenType.CurlyClose */)) {
                // ${1}
                parent.appendChild(new FormatString(Number(index)));
                return true;
            }
            else if (!this._accept(1 /* TokenType.Colon */)) {
                this._backTo(token);
                return false;
            }
            if (this._accept(6 /* TokenType.Forwardslash */)) {
                // ${1:/upcase}
                const shorthand = this._accept(9 /* TokenType.VariableName */, true);
                if (!shorthand || !this._accept(4 /* TokenType.CurlyClose */)) {
                    this._backTo(token);
                    return false;
                }
                else {
                    parent.appendChild(new FormatString(Number(index), shorthand));
                    return true;
                }
            }
            else if (this._accept(11 /* TokenType.Plus */)) {
                // ${1:+<if>}
                const ifValue = this._until(4 /* TokenType.CurlyClose */);
                if (ifValue) {
                    parent.appendChild(new FormatString(Number(index), undefined, ifValue, undefined));
                    return true;
                }
            }
            else if (this._accept(12 /* TokenType.Dash */)) {
                // ${2:-<else>}
                const elseValue = this._until(4 /* TokenType.CurlyClose */);
                if (elseValue) {
                    parent.appendChild(new FormatString(Number(index), undefined, undefined, elseValue));
                    return true;
                }
            }
            else if (this._accept(13 /* TokenType.QuestionMark */)) {
                // ${2:?<if>:<else>}
                const ifValue = this._until(1 /* TokenType.Colon */);
                if (ifValue) {
                    const elseValue = this._until(4 /* TokenType.CurlyClose */);
                    if (elseValue) {
                        parent.appendChild(new FormatString(Number(index), undefined, ifValue, elseValue));
                        return true;
                    }
                }
            }
            else {
                // ${1:<else>}
                const elseValue = this._until(4 /* TokenType.CurlyClose */);
                if (elseValue) {
                    parent.appendChild(new FormatString(Number(index), undefined, undefined, elseValue));
                    return true;
                }
            }
            this._backTo(token);
            return false;
        }
        _parseAnything(marker) {
            if (this._token.type !== 14 /* TokenType.EOF */) {
                marker.appendChild(new Text(this._scanner.tokenText(this._token)));
                this._accept(undefined);
                return true;
            }
            return false;
        }
    }
    exports.SnippetParser = SnippetParser;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldFBhcnNlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc25pcHBldC9icm93c2VyL3NuaXBwZXRQYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBSWhHLElBQWtCLFNBZ0JqQjtJQWhCRCxXQUFrQixTQUFTO1FBQzFCLDZDQUFNLENBQUE7UUFDTiwyQ0FBSyxDQUFBO1FBQ0wsMkNBQUssQ0FBQTtRQUNMLG1EQUFTLENBQUE7UUFDVCxxREFBVSxDQUFBO1FBQ1YsbURBQVMsQ0FBQTtRQUNULHlEQUFZLENBQUE7UUFDWix5Q0FBSSxDQUFBO1FBQ0osdUNBQUcsQ0FBQTtRQUNILHlEQUFZLENBQUE7UUFDWiw4Q0FBTSxDQUFBO1FBQ04sMENBQUksQ0FBQTtRQUNKLDBDQUFJLENBQUE7UUFDSiwwREFBWSxDQUFBO1FBQ1osd0NBQUcsQ0FBQTtJQUNKLENBQUMsRUFoQmlCLFNBQVMseUJBQVQsU0FBUyxRQWdCMUI7SUFTRCxNQUFhLE9BQU87UUFBcEI7WUEwQkMsVUFBSyxHQUFXLEVBQUUsQ0FBQztZQUNuQixRQUFHLEdBQVcsQ0FBQyxDQUFDO1FBb0VqQixDQUFDO2lCQTdGZSxXQUFNLEdBQWdDO1lBQ3BELDhCQUFxQiwwQkFBa0I7WUFDdkMseUJBQWdCLHlCQUFpQjtZQUNqQyx5QkFBZ0IseUJBQWlCO1lBQ2pDLG1DQUF5Qiw2QkFBcUI7WUFDOUMsb0NBQTBCLDhCQUFzQjtZQUNoRCw2QkFBb0IsNkJBQXFCO1lBQ3pDLHlCQUFnQixnQ0FBd0I7WUFDeEMseUJBQWUsd0JBQWdCO1lBQy9CLHdCQUFlLHlCQUFnQjtZQUMvQix3QkFBZSx5QkFBZ0I7WUFDL0IsZ0NBQXVCLGlDQUF3QjtTQUMvQyxBQVpvQixDQVluQjtRQUVGLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxF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SUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzFCLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDO1FBRVEsUUFBUTtZQUNoQixPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRCxnQkFBZ0I7WUFDZixPQUFPLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQzFKLENBQUM7UUFFRCxLQUFLO1lBQ0osTUFBTSxHQUFHLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUM1QixHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4SCxHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDMUQsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDO0tBRUQ7SUFoREQsOEJBZ0RDO0lBRUQsTUFBYSxZ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