/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/model/textModel", "vs/platform/label/common/label", "vs/platform/workspace/common/workspace", "./snippetParser", "./snippetVariables", "vs/css!./snippetSession"], function (require, exports, arrays_1, lifecycle_1, strings_1, editOperation_1, range_1, selection_1, languageConfigurationRegistry_1, textModel_1, label_1, workspace_1, snippetParser_1, snippetVariables_1) {
    "use strict";
    var SnippetSession_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetSession = exports.OneSnippet = void 0;
    class OneSnippet {
        static { this._decor = {
            active: textModel_1.ModelDecorationOptions.register({ description: 'snippet-placeholder-1', stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, className: 'snippet-placeholder' }),
            inactive: textModel_1.ModelDecorationOptions.register({ description: 'snippet-placeholder-2', stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, className: 'snippet-placeholder' }),
            activeFinal: textModel_1.ModelDecorationOptions.register({ description: 'snippet-placeholder-3', stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, className: 'finish-snippet-placeholder' }),
            inactiveFinal: textModel_1.ModelDecorationOptions.register({ description: 'snippet-placeholder-4', stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, className: 'finish-snippet-placeholder' }),
        }; }
        constructor(_editor, _snippet, _snippetLineLeadingWhitespace) {
            this._editor = _editor;
            this._snippet = _snippet;
            this._snippetLineLeadingWhitespace = _snippetLineLeadingWhitespace;
            this._offset = -1;
            this._nestingLevel = 1;
            this._placeholderGroups = (0, arrays_1.groupBy)(_snippet.placeholders, snippetParser_1.Placeholder.compareByIndex);
            this._placeholderGroupsIdx = -1;
        }
        initialize(textChange) {
            this._offset = textChange.newPosition;
        }
        dispose() {
            if (this._placeholderDecorations) {
                this._editor.removeDecorations([...this._placeholderDecorations.values()]);
            }
            this._placeholderGroups.length = 0;
        }
        _initDecorations() {
            if (this._offset === -1) {
                throw new Error(`Snippet not initialized!`);
            }
            if (this._placeholderDecorations) {
                // already initialized
                return;
            }
            this._placeholderDecorations = new Map();
            const model = this._editor.getModel();
            this._editor.changeDecorations(accessor => {
                // create a decoration for each placeholder
                for (const placeholder of this._snippet.placeholders) {
                    const placeholderOffset = this._snippet.offset(placeholder);
                    const placeholderLen = this._snippet.fullLen(placeholder);
                    const range = range_1.Range.fromPositions(model.getPositionAt(this._offset + placeholderOffset), model.getPositionAt(this._offset + placeholderOffset + placeholderLen));
                    const options = placeholder.isFinalTabstop ? OneSnippet._decor.inactiveFinal : OneSnippet._decor.inactive;
                    const handle = accessor.addDecoration(range, options);
                    this._placeholderDecorations.set(placeholder, handle);
                }
            });
        }
        move(fwd) {
            if (!this._editor.hasModel()) {
                return [];
            }
            this._initDecorations();
            // Transform placeholder text if necessary
            if (this._placeholderGroupsIdx >= 0) {
                const operations = [];
                for (const placeholder of this._placeholderGroups[this._placeholderGroupsIdx]) {
                    // Check if the placeholder has a transformation
                    if (placeholder.transform) {
                        const id = this._placeholderDecorations.get(placeholder);
                        const range = this._editor.getModel().getDecorationRange(id);
                        const currentValue = this._editor.getModel().getValueInRange(range);
                        const transformedValueLines = placeholder.transform.resolve(currentValue).split(/\r\n|\r|\n/);
                        // fix indentation for transformed lines
                        for (let i = 1; i < transformedValueLines.length; i++) {
                            transformedValueLines[i] = this._editor.getModel().normalizeIndentation(this._snippetLineLeadingWhitespace + transformedValueLines[i]);
                        }
                        operations.push(editOperation_1.EditOperation.replace(range, transformedValueLines.join(this._editor.getModel().getEOL())));
                    }
                }
                if (operations.length > 0) {
                    this._editor.executeEdits('snippet.placeholderTransform', operations);
                }
            }
            let couldSkipThisPlaceholder = false;
            if (fwd === true && this._placeholderGroupsIdx < this._placeholderGroups.length - 1) {
                this._placeholderGroupsIdx += 1;
                couldSkipThisPlaceholder = true;
            }
            else if (fwd === false && this._placeholderGroupsIdx > 0) {
                this._placeholderGroupsIdx -= 1;
                couldSkipThisPlaceholder = true;
            }
            else {
                // the selection of the current placeholder might
                // not acurate any more -> simply restore it
            }
            const newSelections = this._editor.getModel().changeDecorations(accessor => {
                const activePlaceholders = new Set();
                // change stickiness to always grow when typing at its edges
                // because these decorations represent the currently active
                // tabstop.
                // Special case #1: reaching the final tabstop
                // Special case #2: placeholders enclosing active placeholders
                const selections = [];
                for (const placeholder of this._placeholderGroups[this._placeholderGroupsIdx]) {
                    const id = this._placeholderDecorations.get(placeholder);
                    const range = this._editor.getModel().getDecorationRange(id);
                    selections.push(new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn));
                    // consider to skip this placeholder index when the decoration
                    // range is empty but when the placeholder wasn't. that's a strong
                    // hint that the placeholder has been deleted. (all placeholder must match this)
                    couldSkipThisPlaceholder = couldSkipThisPlaceholder && this._hasPlaceholderBeenCollapsed(placeholder);
                    accessor.changeDecorationOptions(id, placeholder.isFinalTabstop ? OneSnippet._decor.activeFinal : OneSnippet._decor.active);
                    activePlaceholders.add(placeholder);
                    for (const enclosingPlaceholder of this._snippet.enclosingPlaceholders(placeholder)) {
                        const id = this._placeholderDecorations.get(enclosingPlaceholder);
                        accessor.changeDecorationOptions(id, enclosingPlaceholder.isFinalTabstop ? OneSnippet._decor.activeFinal : OneSnippet._decor.active);
                        activePlaceholders.add(enclosingPlaceholder);
                    }
                }
                // change stickness to never grow when typing at its edges
                // so that in-active tabstops never grow
                for (const [placeholder, id] of this._placeholderDecorations) {
                    if (!activePlaceholders.has(placeholder)) {
                        accessor.changeDecorationOptions(id, placeholder.isFinalTabstop ? OneSnippet._decor.inactiveFinal : OneSnippet._decor.inactive);
                    }
                }
                return selections;
            });
            return !couldSkipThisPlaceholder ? newSelections ?? [] : this.move(fwd);
        }
        _hasPlaceholderBeenCollapsed(placeholder) {
            // A placeholder is empty when it wasn't empty when authored but
            // when its tracking decoration is empty. This also applies to all
            // potential parent placeholders
            let marker = placeholder;
            while (marker) {
                if (marker instanceof snippetParser_1.Placeholder) {
                    const id = this._placeholderDecorations.get(marker);
                    const range = this._editor.getModel().getDecorationRange(id);
                    if (range.isEmpty() && marker.toString().length > 0) {
                        return true;
                    }
                }
                marker = marker.parent;
            }
            return false;
        }
        get isAtFirstPlaceholder() {
            return this._placeholderGroupsIdx <= 0 || this._placeholderGroups.length === 0;
        }
        get isAtLastPlaceholder() {
            return this._placeholderGroupsIdx === this._placeholderGroups.length - 1;
        }
        get hasPlaceholder() {
            return this._snippet.placeholders.length > 0;
        }
        /**
         * A snippet is trivial when it has no placeholder or only a final placeholder at
         * its very end
         */
        get isTrivialSnippet() {
            if (this._snippet.placeholders.length === 0) {
                return true;
            }
            if (this._snippet.placeholders.length === 1) {
                const [placeholder] = this._snippet.placeholders;
                if (placeholder.isFinalTabstop) {
                    if (this._snippet.rightMostDescendant === placeholder) {
                        return true;
                    }
                }
            }
            return false;
        }
        computePossibleSelections() {
            const result = new Map();
            for (const placeholdersWithEqualIndex of this._placeholderGroups) {
                let ranges;
                for (const placeholder of placeholdersWithEqualIndex) {
                    if (placeholder.isFinalTabstop) {
                        // ignore those
                        break;
                    }
                    if (!ranges) {
                        ranges = [];
                        result.set(placeholder.index, ranges);
                    }
                    const id = this._placeholderDecorations.get(placeholder);
                    const range = this._editor.getModel().getDecorationRange(id);
                    if (!range) {
                        // one of the placeholder lost its decoration and
                        // therefore we bail out and pretend the placeholder
                        // (with its mirrors) doesn't exist anymore.
                        result.delete(placeholder.index);
                        break;
                    }
                    ranges.push(range);
                }
            }
            return result;
        }
        get activeChoice() {
            if (!this._placeholderDecorations) {
                return undefined;
            }
            const placeholder = this._placeholderGroups[this._placeholderGroupsIdx][0];
            if (!placeholder?.choice) {
                return undefined;
            }
            const id = this._placeholderDecorations.get(placeholder);
            if (!id) {
                return undefined;
            }
            const range = this._editor.getModel().getDecorationRange(id);
            if (!range) {
                return undefined;
            }
            return { range, choice: placeholder.choice };
        }
        get hasChoice() {
            let result = false;
            this._snippet.walk(marker => {
                result = marker instanceof snippetParser_1.Choice;
                return !result;
            });
            return result;
        }
        merge(others) {
            const model = this._editor.getModel();
            this._nestingLevel *= 10;
            this._editor.changeDecorations(accessor => {
                // For each active placeholder take one snippet and merge it
                // in that the placeholder (can be many for `$1foo$1foo`). Because
                // everything is sorted by editor selection we can simply remove
                // elements from the beginning of the array
                for (const placeholder of this._placeholderGroups[this._placeholderGroupsIdx]) {
                    const nested = others.shift();
                    console.assert(nested._offset !== -1);
                    console.assert(!nested._placeholderDecorations);
                    // Massage placeholder-indicies of the nested snippet to be
                    // sorted right after the insertion point. This ensures we move
                    // through the placeholders in the correct order
                    const indexLastPlaceholder = nested._snippet.placeholderInfo.last.index;
                    for (const nestedPlaceholder of nested._snippet.placeholderInfo.all) {
                        if (nestedPlaceholder.isFinalTabstop) {
                            nestedPlaceholder.index = placeholder.index + ((indexLastPlaceholder + 1) / this._nestingLevel);
                        }
                        else {
                            nestedPlaceholder.index = placeholder.index + (nestedPlaceholder.index / this._nestingLevel);
                        }
                    }
                    this._snippet.replace(placeholder, nested._snippet.children);
                    // Remove the placeholder at which position are inserting
                    // the snippet and also remove its decoration.
                    const id = this._placeholderDecorations.get(placeholder);
                    accessor.removeDecoration(id);
                    this._placeholderDecorations.delete(placeholder);
                    // For each *new* placeholder we create decoration to monitor
                    // how and if it grows/shrinks.
                    for (const placeholder of nested._snippet.placeholders) {
                        const placeholderOffset = nested._snippet.offset(placeholder);
                        const placeholderLen = nested._snippet.fullLen(placeholder);
                        const range = range_1.Range.fromPositions(model.getPositionAt(nested._offset + placeholderOffset), model.getPositionAt(nested._offset + placeholderOffset + placeholderLen));
                        const handle = accessor.addDecoration(range, OneSnippet._decor.inactive);
                        this._placeholderDecorations.set(placeholder, handle);
                    }
                }
                // Last, re-create the placeholder groups by sorting placeholders by their index.
                this._placeholderGroups = (0, arrays_1.groupBy)(this._snippet.placeholders, snippetParser_1.Placeholder.compareByIndex);
            });
        }
        getEnclosingRange() {
            let result;
            const model = this._editor.getModel();
            for (const decorationId of this._placeholderDecorations.values()) {
                const placeholderRange = model.getDecorationRange(decorationId) ?? undefined;
                if (!result) {
                    result = placeholderRange;
                }
                else {
                    result = result.plusRange(placeholderRange);
                }
            }
            return result;
        }
    }
    exports.OneSnippet = OneSnippet;
    const _defaultOptions = {
        overwriteBefore: 0,
        overwriteAfter: 0,
        adjustWhitespace: true,
        clipboardText: undefined,
        overtypingCapturer: undefined
    };
    let SnippetSession = SnippetSession_1 = class SnippetSession {
        static adjustWhitespace(model, position, adjustIndentation, snippet, filter) {
            const line = model.getLineContent(position.lineNumber);
            const lineLeadingWhitespace = (0, strings_1.getLeadingWhitespace)(line, 0, position.column - 1);
            // the snippet as inserted
            let snippetTextString;
            snippet.walk(marker => {
                // all text elements that are not inside choice
                if (!(marker instanceof snippetParser_1.Text) || marker.parent instanceof snippetParser_1.Choice) {
                    return true;
                }
                // check with filter (iff provided)
                if (filter && !filter.has(marker)) {
                    return true;
                }
                const lines = marker.value.split(/\r\n|\r|\n/);
                if (adjustIndentation) {
                    // adjust indentation of snippet test
                    // -the snippet-start doesn't get extra-indented (lineLeadingWhitespace), only normalized
                    // -all N+1 lines get extra-indented and normalized
                    // -the text start get extra-indented and normalized when following a linebreak
                    const offset = snippet.offset(marker);
                    if (offset === 0) {
                        // snippet start
                        lines[0] = model.normalizeIndentation(lines[0]);
                    }
                    else {
                        // check if text start is after a linebreak
                        snippetTextString = snippetTextString ?? snippet.toString();
                        const prevChar = snippetTextString.charCodeAt(offset - 1);
                        if (prevChar === 10 /* CharCode.LineFeed */ || prevChar === 13 /* CharCode.CarriageReturn */) {
                            lines[0] = model.normalizeIndentation(lineLeadingWhitespace + lines[0]);
                        }
                    }
                    for (let i = 1; i < lines.length; i++) {
                        lines[i] = model.normalizeIndentation(lineLeadingWhitespace + lines[i]);
                    }
                }
                const newValue = lines.join(model.getEOL());
                if (newValue !== marker.value) {
                    marker.parent.replace(marker, [new snippetParser_1.Text(newValue)]);
                    snippetTextString = undefined;
                }
                return true;
            });
            return lineLeadingWhitespace;
        }
        static adjustSelection(model, selection, overwriteBefore, overwriteAfter) {
            if (overwriteBefore !== 0 || overwriteAfter !== 0) {
                // overwrite[Before|After] is compute using the position, not the whole
                // selection. therefore we adjust the selection around that position
                const { positionLineNumber, positionColumn } = selection;
                const positionColumnBefore = positionColumn - overwriteBefore;
                const positionColumnAfter = positionColumn + overwriteAfter;
                const range = model.validateRange({
                    startLineNumber: positionLineNumber,
                    startColumn: positionColumnBefore,
                    endLineNumber: positionLineNumber,
                    endColumn: positionColumnAfter
                });
                selection = selection_1.Selection.createWithDirection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn, selection.getDirection());
            }
            return selection;
        }
        static createEditsAndSnippetsFromSelections(editor, template, overwriteBefore, overwriteAfter, enforceFinalTabstop, adjustWhitespace, clipboardText, overtypingCapturer, languageConfigurationService) {
            const edits = [];
            const snippets = [];
            if (!editor.hasModel()) {
                return { edits, snippets };
            }
            const model = editor.getModel();
            const workspaceService = editor.invokeWithinContext(accessor => accessor.get(workspace_1.IWorkspaceContextService));
            const modelBasedVariableResolver = editor.invokeWithinContext(accessor => new snippetVariables_1.ModelBasedVariableResolver(accessor.get(label_1.ILabelService), model));
            const readClipboardText = () => clipboardText;
            // know what text the overwrite[Before|After] extensions
            // of the primary curser have selected because only when
            // secondary selections extend to the same text we can grow them
            const firstBeforeText = model.getValueInRange(SnippetSession_1.adjustSelection(model, editor.getSelection(), overwriteBefore, 0));
            const firstAfterText = model.getValueInRange(SnippetSession_1.adjustSelection(model, editor.getSelection(), 0, overwriteAfter));
            // remember the first non-whitespace column to decide if
            // `keepWhitespace` should be overruled for secondary selections
            const firstLineFirstNonWhitespace = model.getLineFirstNonWhitespaceColumn(editor.getSelection().positionLineNumber);
            // sort selections by their start position but remeber
            // the original index. that allows you to create correct
            // offset-based selection logic without changing the
            // primary selection
            const indexedSelections = editor.getSelections()
                .map((selection, idx) => ({ selection, idx }))
                .sort((a, b) => range_1.Range.compareRangesUsingStarts(a.selection, b.selection));
            for (const { selection, idx } of indexedSelections) {
                // extend selection with the `overwriteBefore` and `overwriteAfter` and then
                // compare if this matches the extensions of the primary selection
                let extensionBefore = SnippetSession_1.adjustSelection(model, selection, overwriteBefore, 0);
                let extensionAfter = SnippetSession_1.adjustSelection(model, selection, 0, overwriteAfter);
                if (firstBeforeText !== model.getValueInRange(extensionBefore)) {
                    extensionBefore = selection;
                }
                if (firstAfterText !== model.getValueInRange(extensionAfter)) {
                    extensionAfter = selection;
                }
                // merge the before and after selection into one
                const snippetSelection = selection
                    .setStartPosition(extensionBefore.startLineNumber, extensionBefore.startColumn)
                    .setEndPosition(extensionAfter.endLineNumber, extensionAfter.endColumn);
                const snippet = new snippetParser_1.SnippetParser().parse(template, true, enforceFinalTabstop);
                // adjust the template string to match the indentation and
                // whitespace rules of this insert location (can be different for each cursor)
                // happens when being asked for (default) or when this is a secondary
                // cursor and the leading whitespace is different
                const start = snippetSelection.getStartPosition();
                const snippetLineLeadingWhitespace = SnippetSession_1.adjustWhitespace(model, start, adjustWhitespace || (idx > 0 && firstLineFirstNonWhitespace !== model.getLineFirstNonWhitespaceColumn(selection.positionLineNumber)), snippet);
                snippet.resolveVariables(new snippetVariables_1.CompositeSnippetVariableResolver([
                    modelBasedVariableResolver,
                    new snippetVariables_1.ClipboardBasedVariableResolver(readClipboardText, idx, indexedSelections.length, editor.getOption(79 /* EditorOption.multiCursorPaste */) === 'spread'),
                    new snippetVariables_1.SelectionBasedVariableResolver(model, selection, idx, overtypingCapturer),
                    new snippetVariables_1.CommentBasedVariableResolver(model, selection, languageConfigurationService),
                    new snippetVariables_1.TimeBasedVariableResolver,
                    new snippetVariables_1.WorkspaceBasedVariableResolver(workspaceService),
                    new snippetVariables_1.RandomBasedVariableResolver,
                ]));
                // store snippets with the index of their originating selection.
                // that ensures the primiary cursor stays primary despite not being
                // the one with lowest start position
                edits[idx] = editOperation_1.EditOperation.replace(snippetSelection, snippet.toString());
                edits[idx].identifier = { major: idx, minor: 0 }; // mark the edit so only our undo edits will be used to generate end cursors
                edits[idx]._isTracked = true;
                snippets[idx] = new OneSnippet(editor, snippet, snippetLineLeadingWhitespace);
            }
            return { edits, snippets };
        }
        static createEditsAndSnippetsFromEdits(editor, snippetEdits, enforceFinalTabstop, adjustWhitespace, clipboardText, overtypingCapturer, languageConfigurationService) {
            if (!editor.hasModel() || snippetEdits.length === 0) {
                return { edits: [], snippets: [] };
            }
            const edits = [];
            const model = editor.getModel();
            const parser = new snippetParser_1.SnippetParser();
            const snippet = new snippetParser_1.TextmateSnippet();
            // snippet variables resolver
            const resolver = new snippetVariables_1.CompositeSnippetVariableResolver([
                editor.invokeWithinContext(accessor => new snippetVariables_1.ModelBasedVariableResolver(accessor.get(label_1.ILabelService), model)),
                new snippetVariables_1.ClipboardBasedVariableResolver(() => clipboardText, 0, editor.getSelections().length, editor.getOption(79 /* EditorOption.multiCursorPaste */) === 'spread'),
                new snippetVariables_1.SelectionBasedVariableResolver(model, editor.getSelection(), 0, overtypingCapturer),
                new snippetVariables_1.CommentBasedVariableResolver(model, editor.getSelection(), languageConfigurationService),
                new snippetVariables_1.TimeBasedVariableResolver,
                new snippetVariables_1.WorkspaceBasedVariableResolver(editor.invokeWithinContext(accessor => accessor.get(workspace_1.IWorkspaceContextService))),
                new snippetVariables_1.RandomBasedVariableResolver,
            ]);
            //
            snippetEdits = snippetEdits.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
            let offset = 0;
            for (let i = 0; i < snippetEdits.length; i++) {
                const { range, template } = snippetEdits[i];
                // gaps between snippet edits are appended as text nodes. this
                // ensures placeholder-offsets are later correct
                if (i > 0) {
                    const lastRange = snippetEdits[i - 1].range;
                    const textRange = range_1.Range.fromPositions(lastRange.getEndPosition(), range.getStartPosition());
                    const textNode = new snippetParser_1.Text(model.getValueInRange(textRange));
                    snippet.appendChild(textNode);
                    offset += textNode.value.length;
                }
                const newNodes = parser.parseFragment(template, snippet);
                SnippetSession_1.adjustWhitespace(model, range.getStartPosition(), true, snippet, new Set(newNodes));
                snippet.resolveVariables(resolver);
                const snippetText = snippet.toString();
                const snippetFragmentText = snippetText.slice(offset);
                offset = snippetText.length;
                // make edit
                const edit = editOperation_1.EditOperation.replace(range, snippetFragmentText);
                edit.identifier = { major: i, minor: 0 }; // mark the edit so only our undo edits will be used to generate end cursors
                edit._isTracked = true;
                edits.push(edit);
            }
            //
            parser.ensureFinalTabstop(snippet, enforceFinalTabstop, true);
            return {
                edits,
                snippets: [new OneSnippet(editor, snippet, '')]
            };
        }
        constructor(_editor, _template, _options = _defaultOptions, _languageConfigurationService) {
            this._editor = _editor;
            this._template = _template;
            this._options = _options;
            this._languageConfigurationService = _languageConfigurationService;
            this._templateMerges = [];
            this._snippets = [];
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._snippets);
        }
        _logInfo() {
            return `template="${this._template}", merged_templates="${this._templateMerges.join(' -> ')}"`;
        }
        insert() {
            if (!this._editor.hasModel()) {
                return;
            }
            // make insert edit and start with first selections
            const { edits, snippets } = typeof this._template === 'string'
                ? SnippetSession_1.createEditsAndSnippetsFromSelections(this._editor, this._template, this._options.overwriteBefore, this._options.overwriteAfter, false, this._options.adjustWhitespace, this._options.clipboardText, this._options.overtypingCapturer, this._languageConfigurationService)
                : SnippetSession_1.createEditsAndSnippetsFromEdits(this._editor, this._template, false, this._options.adjustWhitespace, this._options.clipboardText, this._options.overtypingCapturer, this._languageConfigurationService);
            this._snippets = snippets;
            this._editor.executeEdits('snippet', edits, _undoEdits => {
                // Sometimes, the text buffer will remove automatic whitespace when doing any edits,
                // so we need to look only at the undo edits relevant for us.
                // Our edits have an identifier set so that's how we can distinguish them
                const undoEdits = _undoEdits.filter(edit => !!edit.identifier);
                for (let idx = 0; idx < snippets.length; idx++) {
                    snippets[idx].initialize(undoEdits[idx].textChange);
                }
                if (this._snippets[0].hasPlaceholder) {
                    return this._move(true);
                }
                else {
                    return undoEdits
                        .map(edit => selection_1.Selection.fromPositions(edit.range.getEndPosition()));
                }
            });
            this._editor.revealRange(this._editor.getSelections()[0]);
        }
        merge(template, options = _defaultOptions) {
            if (!this._editor.hasModel()) {
                return;
            }
            this._templateMerges.push([this._snippets[0]._nestingLevel, this._snippets[0]._placeholderGroupsIdx, template]);
            const { edits, snippets } = SnippetSession_1.createEditsAndSnippetsFromSelections(this._editor, template, options.overwriteBefore, options.overwriteAfter, true, options.adjustWhitespace, options.clipboardText, options.overtypingCapturer, this._languageConfigurationService);
            this._editor.executeEdits('snippet', edits, _undoEdits => {
                // Sometimes, the text buffer will remove automatic whitespace when doing any edits,
                // so we need to look only at the undo edits relevant for us.
                // Our edits have an identifier set so that's how we can distinguish them
                const undoEdits = _undoEdits.filter(edit => !!edit.identifier);
                for (let idx = 0; idx < snippets.length; idx++) {
                    snippets[idx].initialize(undoEdits[idx].textChange);
                }
                // Trivial snippets have no placeholder or are just the final placeholder. That means they
                // are just text insertions and we don't need to merge the nested snippet into the existing
                // snippet
                const isTrivialSnippet = snippets[0].isTrivialSnippet;
                if (!isTrivialSnippet) {
                    for (const snippet of this._snippets) {
                        snippet.merge(snippets);
                    }
                    console.assert(snippets.length === 0);
                }
                if (this._snippets[0].hasPlaceholder && !isTrivialSnippet) {
                    return this._move(undefined);
                }
                else {
                    return undoEdits.map(edit => selection_1.Selection.fromPositions(edit.range.getEndPosition()));
                }
            });
        }
        next() {
            const newSelections = this._move(true);
            this._editor.setSelections(newSelections);
            this._editor.revealPositionInCenterIfOutsideViewport(newSelections[0].getPosition());
        }
        prev() {
            const newSelections = this._move(false);
            this._editor.setSelections(newSelections);
            this._editor.revealPositionInCenterIfOutsideViewport(newSelections[0].getPosition());
        }
        _move(fwd) {
            const selections = [];
            for (const snippet of this._snippets) {
                const oneSelection = snippet.move(fwd);
                selections.push(...oneSelection);
            }
            return selections;
        }
        get isAtFirstPlaceholder() {
            return this._snippets[0].isAtFirstPlaceholder;
        }
        get isAtLastPlaceholder() {
            return this._snippets[0].isAtLastPlaceholder;
        }
        get hasPlaceholder() {
            return this._snippets[0].hasPlaceholder;
        }
        get hasChoice() {
            return this._snippets[0].hasChoice;
        }
        get activeChoice() {
            return this._snippets[0].activeChoice;
        }
        isSelectionWithinPlaceholders() {
            if (!this.hasPlaceholder) {
                return false;
            }
            const selections = this._editor.getSelections();
            if (selections.length < this._snippets.length) {
                // this means we started snippet mode with N
                // selections and have M (N > M) selections.
                // So one snippet is without selection -> cancel
                return false;
            }
            const allPossibleSelections = new Map();
            for (const snippet of this._snippets) {
                const possibleSelections = snippet.computePossibleSelections();
                // for the first snippet find the placeholder (and its ranges)
                // that contain at least one selection. for all remaining snippets
                // the same placeholder (and their ranges) must be used.
                if (allPossibleSelections.size === 0) {
                    for (const [index, ranges] of possibleSelections) {
                        ranges.sort(range_1.Range.compareRangesUsingStarts);
                        for (const selection of selections) {
                            if (ranges[0].containsRange(selection)) {
                                allPossibleSelections.set(index, []);
                                break;
                            }
                        }
                    }
                }
                if (allPossibleSelections.size === 0) {
                    // return false if we couldn't associate a selection to
                    // this (the first) snippet
                    return false;
                }
                // add selections from 'this' snippet so that we know all
                // selections for this placeholder
                allPossibleSelections.forEach((array, index) => {
                    array.push(...possibleSelections.get(index));
                });
            }
            // sort selections (and later placeholder-ranges). then walk both
            // arrays and make sure the placeholder-ranges contain the corresponding
            // selection
            selections.sort(range_1.Range.compareRangesUsingStarts);
            for (const [index, ranges] of allPossibleSelections) {
                if (ranges.length !== selections.length) {
                    allPossibleSelections.delete(index);
                    continue;
                }
                ranges.sort(range_1.Range.compareRangesUsingStarts);
                for (let i = 0; i < ranges.length; i++) {
                    if (!ranges[i].containsRange(selections[i])) {
                        allPossibleSelections.delete(index);
                        continue;
                    }
                }
            }
            // from all possible selections we have deleted those
            // that don't match with the current selection. if we don't
            // have any left, we don't have a selection anymore
            return allPossibleSelections.size > 0;
        }
        getEnclosingRange() {
            let result;
            for (const snippet of this._snippets) {
                const snippetRange = snippet.getEnclosingRange();
                if (!result) {
                    result = snippetRange;
                }
                else {
                    result = result.plusRange(snippetRange);
                }
            }
            return result;
        }
    };
    exports.SnippetSession = SnippetSession;
    exports.SnippetSession = SnippetSession = SnippetSession_1 = __decorate([
        __param(3, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], SnippetSession);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldFNlc3Npb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3NuaXBwZXQvYnJvd3Nlci9zbmlwcGV0U2Vzc2lvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBdUJoRyxNQUFhLFVBQVU7aUJBUUUsV0FBTSxHQUFHO1lBQ2hDLE1BQU0sRUFBRSxrQ0FBc0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUUsVUFBVSw2REFBcUQsRUFBRSxTQUFTLEVBQUUscUJBQXFCLEVBQUUsQ0FBQztZQUNwTCxRQUFRLEVBQUUsa0NBQXNCLENBQUMsUUFBUSxDQUFDLEVBQUUsV0FBVyxFQUFFLHVCQUF1QixFQUFFLFVBQVUsNERBQW9ELEVBQUUsU0FBUyxFQUFFLHFCQUFxQixFQUFFLENBQUM7WUFDckwsV0FBVyxFQUFFLGtDQUFzQixDQUFDLFFBQVEsQ0FBQyxFQUFFLFdBQVcsRUFBRSx1QkFBdUIsRUFBRSxVQUFVLDREQUFvRCxFQUFFLFNBQVMsRUFBRSw0QkFBNEIsRUFBRSxDQUFDO1lBQy9MLGFBQWEsRUFBRSxrQ0FBc0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUUsVUFBVSw0REFBb0QsRUFBRSxTQUFTLEVBQUUsNEJBQTRCLEVBQUUsQ0FBQztTQUNqTSxBQUw2QixDQUs1QjtRQUVGLFlBQ2tCLE9BQTBCLEVBQzFCLFFBQXlCLEVBQ3pCLDZCQUFxQztZQUZyQyxZQUFPLEdBQVAsT0FBTyxDQUFtQjtZQUMxQixhQUFRLEdBQVIsUUFBUSxDQUFpQjtZQUN6QixrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQVE7WUFkL0MsWUFBTyxHQUFXLENBQUMsQ0FBQyxDQUFDO1lBRTdCLGtCQUFhLEdBQVcsQ0FBQyxDQUFD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