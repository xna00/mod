/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SufTrie = exports.PreTrie = exports.ExplorerFileNestingTrie = void 0;
    /**
     * A sort of double-ended trie, used to efficiently query for matches to "star" patterns, where
     * a given key represents a parent and may contain a capturing group ("*"), which can then be
     * referenced via the token "$(capture)" in associated child patterns.
     *
     * The generated tree will have at most two levels, as subtrees are flattened rather than nested.
     *
     * Example:
     * The config: [
     * [ *.ts , [ $(capture).*.ts ; $(capture).js ] ]
     * [ *.js , [ $(capture).min.js ] ] ]
     * Nests the files: [ a.ts ; a.d.ts ; a.js ; a.min.js ; b.ts ; b.min.js ]
     * As:
     * - a.ts => [ a.d.ts ; a.js ; a.min.js ]
     * - b.ts => [ ]
     * - b.min.ts => [ ]
     */
    class ExplorerFileNestingTrie {
        constructor(config) {
            this.root = new PreTrie();
            for (const [parentPattern, childPatterns] of config) {
                for (const childPattern of childPatterns) {
                    this.root.add(parentPattern, childPattern);
                }
            }
        }
        toString() {
            return this.root.toString();
        }
        getAttributes(filename, dirname) {
            const lastDot = filename.lastIndexOf('.');
            if (lastDot < 1) {
                return {
                    dirname,
                    basename: filename,
                    extname: ''
                };
            }
            else {
                return {
                    dirname,
                    basename: filename.substring(0, lastDot),
                    extname: filename.substring(lastDot + 1)
                };
            }
        }
        nest(files, dirname) {
            const parentFinder = new PreTrie();
            for (const potentialParent of files) {
                const attributes = this.getAttributes(potentialParent, dirname);
                const children = this.root.get(potentialParent, attributes);
                for (const child of children) {
                    parentFinder.add(child, potentialParent);
                }
            }
            const findAllRootAncestors = (file, seen = new Set()) => {
                if (seen.has(file)) {
                    return [];
                }
                seen.add(file);
                const attributes = this.getAttributes(file, dirname);
                const ancestors = parentFinder.get(file, attributes);
                if (ancestors.length === 0) {
                    return [file];
                }
                if (ancestors.length === 1 && ancestors[0] === file) {
                    return [file];
                }
                return ancestors.flatMap(a => findAllRootAncestors(a, seen));
            };
            const result = new Map();
            for (const file of files) {
                let ancestors = findAllRootAncestors(file);
                if (ancestors.length === 0) {
                    ancestors = [file];
                }
                for (const ancestor of ancestors) {
                    let existing = result.get(ancestor);
                    if (!existing) {
                        result.set(ancestor, existing = new Set());
                    }
                    if (file !== ancestor) {
                        existing.add(file);
                    }
                }
            }
            return result;
        }
    }
    exports.ExplorerFileNestingTrie = ExplorerFileNestingTrie;
    /** Export for test only. */
    class PreTrie {
        constructor() {
            this.value = new SufTrie();
            this.map = new Map();
        }
        add(key, value) {
            if (key === '') {
                this.value.add(key, value);
            }
            else if (key[0] === '*') {
                this.value.add(key, value);
            }
            else {
                const head = key[0];
                const rest = key.slice(1);
                let existing = this.map.get(head);
                if (!existing) {
                    this.map.set(head, existing = new PreTrie());
                }
                existing.add(rest, value);
            }
        }
        get(key, attributes) {
            const results = [];
            results.push(...this.value.get(key, attributes));
            const head = key[0];
            const rest = key.slice(1);
            const existing = this.map.get(head);
            if (existing) {
                results.push(...existing.get(rest, attributes));
            }
            return results;
        }
        toString(indentation = '') {
            const lines = [];
            if (this.value.hasItems) {
                lines.push('* => \n' + this.value.toString(indentation + '  '));
            }
            [...this.map.entries()].map(([key, trie]) => lines.push('^' + key + ' => \n' + trie.toString(indentation + '  ')));
            return lines.map(l => indentation + l).join('\n');
        }
    }
    exports.PreTrie = PreTrie;
    /** Export for test only. */
    class SufTrie {
        constructor() {
            this.star = [];
            this.epsilon = [];
            this.map = new Map();
            this.hasItems = false;
        }
        add(key, value) {
            this.hasItems = true;
            if (key === '*') {
                this.star.push(new SubstitutionString(value));
            }
            else if (key === '') {
                this.epsilon.push(new SubstitutionString(value));
            }
            else {
                const tail = key[key.length - 1];
                const rest = key.slice(0, key.length - 1);
                if (tail === '*') {
                    throw Error('Unexpected star in SufTrie key: ' + key);
                }
                else {
                    let existing = this.map.get(tail);
                    if (!existing) {
                        this.map.set(tail, existing = new SufTrie());
                    }
                    existing.add(rest, value);
                }
            }
        }
        get(key, attributes) {
            const results = [];
            if (key === '') {
                results.push(...this.epsilon.map(ss => ss.substitute(attributes)));
            }
            if (this.star.length) {
                results.push(...this.star.map(ss => ss.substitute(attributes, key)));
            }
            const tail = key[key.length - 1];
            const rest = key.slice(0, key.length - 1);
            const existing = this.map.get(tail);
            if (existing) {
                results.push(...existing.get(rest, attributes));
            }
            return results;
        }
        toString(indentation = '') {
            const lines = [];
            if (this.star.length) {
                lines.push('* => ' + this.star.join('; '));
            }
            if (this.epsilon.length) {
                // allow-any-unicode-next-line
                lines.push('ε => ' + this.epsilon.join('; '));
            }
            [...this.map.entries()].map(([key, trie]) => lines.push(key + '$' + ' => \n' + trie.toString(indentation + '  ')));
            return lines.map(l => indentation + l).join('\n');
        }
    }
    exports.SufTrie = SufTrie;
    var SubstitutionType;
    (function (SubstitutionType) {
        SubstitutionType["capture"] = "capture";
        SubstitutionType["basename"] = "basename";
        SubstitutionType["dirname"] = "dirname";
        SubstitutionType["extname"] = "extname";
    })(SubstitutionType || (SubstitutionType = {}));
    const substitutionStringTokenizer = /\$[({](capture|basename|dirname|extname)[)}]/g;
    class SubstitutionString {
        constructor(pattern) {
            this.tokens = [];
            substitutionStringTokenizer.lastIndex = 0;
            let token;
            let lastIndex = 0;
            while (token = substitutionStringTokenizer.exec(pattern)) {
                const prefix = pattern.slice(lastIndex, token.index);
                this.tokens.push(prefix);
                const type = token[1];
                switch (type) {
                    case "basename" /* SubstitutionType.basename */:
                    case "dirname" /* SubstitutionType.dirname */:
                    case "extname" /* SubstitutionType.extname */:
                    case "capture" /* SubstitutionType.capture */:
                        this.tokens.push({ capture: type });
                        break;
                    default: throw Error('unknown substitution type: ' + type);
                }
                lastIndex = token.index + token[0].length;
            }
            if (lastIndex !== pattern.length) {
                const suffix = pattern.slice(lastIndex, pattern.length);
                this.tokens.push(suffix);
            }
        }
        substitute(attributes, capture) {
            return this.tokens.map(t => {
                if (typeof t === 'string') {
                    return t;
                }
                switch (t.capture) {
                    case "basename" /* SubstitutionType.basename */: return attributes.basename;
                    case "dirname" /* SubstitutionType.dirname */: return attributes.dirname;
                    case "extname" /* SubstitutionType.extname */: return attributes.extname;
                    case "capture" /* SubstitutionType.capture */: return capture || '';
                }
            }).join('');
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJGaWxlTmVzdGluZ1RyaWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ZpbGVzL2NvbW1vbi9leHBsb3JlckZpbGVOZXN0aW5nVHJpZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEc7Ozs7Ozs7Ozs7Ozs7Ozs7T0FnQkc7SUFDSCxNQUFhLHVCQUF1QjtRQUduQyxZQUFZLE1BQTRCO1lBRmhDLFNBQUksR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBRzVCLEtBQUssTUFBTSxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDckQsS0FBSyxNQUFNLFlBQVksSUFBSSxhQUFhLEVBQUUsQ0FBQztvQkFDMUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUM1QyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxRQUFRO1lBQ1AsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdCLENBQUM7UUFFTyxhQUFhLENBQUMsUUFBZ0IsRUFBRSxPQUFlO1lBQ3RELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2pCLE9BQU87b0JBQ04sT0FBTztvQkFDUCxRQUFRLEVBQUUsUUFBUTtvQkFDbEIsT0FBTyxFQUFFLEVBQUU7aUJBQ1gsQ0FBQztZQUNILENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPO29CQUNOLE9BQU87b0JBQ1AsUUFBUSxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQztvQkFD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