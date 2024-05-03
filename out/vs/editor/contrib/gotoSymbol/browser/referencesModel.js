/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/idGenerator", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/resources", "vs/base/common/strings", "vs/editor/common/core/range", "vs/nls"], function (require, exports, errors_1, event_1, idGenerator_1, lifecycle_1, map_1, resources_1, strings, range_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReferencesModel = exports.FileReferences = exports.FilePreview = exports.OneReference = void 0;
    class OneReference {
        constructor(isProviderFirst, parent, link, _rangeCallback) {
            this.isProviderFirst = isProviderFirst;
            this.parent = parent;
            this.link = link;
            this._rangeCallback = _rangeCallback;
            this.id = idGenerator_1.defaultGenerator.nextId();
        }
        get uri() {
            return this.link.uri;
        }
        get range() {
            return this._range ?? this.link.targetSelectionRange ?? this.link.range;
        }
        set range(value) {
            this._range = value;
            this._rangeCallback(this);
        }
        get ariaMessage() {
            const preview = this.parent.getPreview(this)?.preview(this.range);
            if (!preview) {
                return (0, nls_1.localize)('aria.oneReference', "in {0} on line {1} at column {2}", (0, resources_1.basename)(this.uri), this.range.startLineNumber, this.range.startColumn);
            }
            else {
                return (0, nls_1.localize)({ key: 'aria.oneReference.preview', comment: ['Placeholders are: 0: filename, 1:line number, 2: column number, 3: preview snippet of source code'] }, "{0} in {1} on line {2} at column {3}", preview.value, (0, resources_1.basename)(this.uri), this.range.startLineNumber, this.range.startColumn);
            }
        }
    }
    exports.OneReference = OneReference;
    class FilePreview {
        constructor(_modelReference) {
            this._modelReference = _modelReference;
        }
        dispose() {
            this._modelReference.dispose();
        }
        preview(range, n = 8) {
            const model = this._modelReference.object.textEditorModel;
            if (!model) {
                return undefined;
            }
            const { startLineNumber, startColumn, endLineNumber, endColumn } = range;
            const word = model.getWordUntilPosition({ lineNumber: startLineNumber, column: startColumn - n });
            const beforeRange = new range_1.Range(startLineNumber, word.startColumn, startLineNumber, startColumn);
            const afterRange = new range_1.Range(endLineNumber, endColumn, endLineNumber, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
            const before = model.getValueInRange(beforeRange).replace(/^\s+/, '');
            const inside = model.getValueInRange(range);
            const after = model.getValueInRange(afterRange).replace(/\s+$/, '');
            return {
                value: before + inside + after,
                highlight: { start: before.length, end: before.length + inside.length }
            };
        }
    }
    exports.FilePreview = FilePreview;
    class FileReferences {
        constructor(parent, uri) {
            this.parent = parent;
            this.uri = uri;
            this.children = [];
            this._previews = new map_1.ResourceMap();
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._previews.values());
            this._previews.clear();
        }
        getPreview(child) {
            return this._previews.get(child.uri);
        }
        get ariaMessage() {
            const len = this.children.length;
            if (len === 1) {
                return (0, nls_1.localize)('aria.fileReferences.1', "1 symbol in {0}, full path {1}", (0, resources_1.basename)(this.uri), this.uri.fsPath);
            }
            else {
                return (0, nls_1.localize)('aria.fileReferences.N', "{0} symbols in {1}, full path {2}", len, (0, resources_1.basename)(this.uri), this.uri.fsPath);
            }
        }
        async resolve(textModelResolverService) {
            if (this._previews.size !== 0) {
                return this;
            }
            for (const child of this.children) {
                if (this._previews.has(child.uri)) {
                    continue;
                }
                try {
                    const ref = await textModelResolverService.createModelReference(child.uri);
                    this._previews.set(child.uri, new FilePreview(ref));
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
            }
            return this;
        }
    }
    exports.FileReferences = FileReferences;
    class ReferencesModel {
        constructor(links, title) {
            this.groups = [];
            this.references = [];
            this._onDidChangeReferenceRange = new event_1.Emitter();
            this.onDidChangeReferenceRange = this._onDidChangeReferenceRange.event;
            this._links = links;
            this._title = title;
            // grouping and sorting
            const [providersFirst] = links;
            links.sort(ReferencesModel._compareReferences);
            let current;
            for (const link of links) {
                if (!current || !resources_1.extUri.isEqual(current.uri, link.uri, true)) {
                    // new group
                    current = new FileReferences(this, link.uri);
                    this.groups.push(current);
                }
                // append, check for equality first!
                if (current.children.length === 0 || ReferencesModel._compareReferences(link, current.children[current.children.length - 1]) !== 0) {
                    const oneRef = new OneReference(providersFirst === link, current, link, ref => this._onDidChangeReferenceRange.fire(ref));
                    this.references.push(oneRef);
                    current.children.push(oneRef);
                }
            }
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.groups);
            this._onDidChangeReferenceRange.dispose();
            this.groups.length = 0;
        }
        clone() {
            return new ReferencesModel(this._links, this._title);
        }
        get title() {
            return this._title;
        }
        get isEmpty() {
            return this.groups.length === 0;
        }
        get ariaMessage() {
            if (this.isEmpty) {
                return (0, nls_1.localize)('aria.result.0', "No results found");
            }
            else if (this.references.length === 1) {
                return (0, nls_1.localize)('aria.result.1', "Found 1 symbol in {0}", this.references[0].uri.fsPath);
            }
            else if (this.groups.length === 1) {
                return (0, nls_1.localize)('aria.result.n1', "Found {0} symbols in {1}", this.references.length, this.groups[0].uri.fsPath);
            }
            else {
                return (0, nls_1.localize)('aria.result.nm', "Found {0} symbols in {1} files", this.references.length, this.groups.length);
            }
        }
        nextOrPreviousReference(reference, next) {
            const { parent } = reference;
            let idx = parent.children.indexOf(reference);
            const childCount = parent.children.length;
            const groupCount = parent.parent.groups.length;
            if (groupCount === 1 || next && idx + 1 < childCount || !next && idx > 0) {
                // cycling within one file
                if (next) {
                    idx = (idx + 1) % childCount;
                }
                else {
                    idx = (idx + childCount - 1) % childCount;
                }
                return parent.children[idx];
            }
            idx = parent.parent.groups.indexOf(parent);
            if (next) {
                idx = (idx + 1) % groupCount;
                return parent.parent.groups[idx].children[0];
            }
            else {
                idx = (idx + groupCount - 1) % groupCount;
                return parent.parent.groups[idx].children[parent.parent.groups[idx].children.length - 1];
            }
        }
        nearestReference(resource, position) {
            const nearest = this.references.map((ref, idx) => {
                return {
                    idx,
                    prefixLen: strings.commonPrefixLength(ref.uri.toString(), resource.toString()),
                    offsetDist: Math.abs(ref.range.startLineNumber - position.lineNumber) * 100 + Math.abs(ref.range.startColumn - position.column)
                };
            }).sort((a, b) => {
                if (a.prefixLen > b.prefixLen) {
                    return -1;
                }
                else if (a.prefixLen < b.prefixLen) {
                    return 1;
                }
                else if (a.offsetDist < b.offsetDist) {
                    return -1;
                }
                else if (a.offsetDist > b.offsetDist) {
                    return 1;
                }
                else {
                    return 0;
                }
            })[0];
            if (nearest) {
                return this.references[nearest.idx];
            }
            return undefined;
        }
        referenceAt(resource, position) {
            for (const ref of this.references) {
                if (ref.uri.toString() === resource.toString()) {
                    if (range_1.Range.containsPosition(ref.range, position)) {
                        return ref;
                    }
                }
            }
            return undefined;
        }
        firstReference() {
            for (const ref of this.references) {
                if (ref.isProviderFirst) {
                    return ref;
                }
            }
            return this.references[0];
        }
        static _compareReferences(a, b) {
            return resources_1.extUri.compare(a.uri, b.uri) || range_1.Range.compareRangesUsingStarts(a.range, b.range);
        }
    }
    exports.ReferencesModel = ReferencesModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmZXJlbmNlc01vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9nb3RvU3ltYm9sL2Jyb3dzZXIvcmVmZXJlbmNlc01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEcsTUFBYSxZQUFZO1FBTXhCLFlBQ1UsZUFBd0IsRUFDeEIsTUFBc0IsRUFDdEIsSUFBa0IsRUFDbkIsY0FBMkM7WUFIMUMsb0JBQWUsR0FBZixlQUFlLENBQVM7WUFDeEIsV0FBTSxHQUFOLE1BQU0sQ0FBZ0I7WUFDdEIsU0FBSSxHQUFKLElBQUksQ0FBYztZQUNuQixtQkFBYyxHQUFkLGNBQWMsQ0FBNkI7WUFSM0MsT0FBRSxHQUFXLDhCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDO1FBUzVDLENBQUM7UUFFTCxJQUFJLEdBQUc7WUFDTixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ3RCLENBQUM7UUFFRCxJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUN6RSxDQUFDO1FBRUQsSUFBSSxLQUFLLENBQUMsS0FBYTtZQUN0QixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNCLENBQUM7UUFFRCxJQUFJLFdBQVc7WUFFZCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRWxFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztn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