/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/diff/diff", "vs/base/common/uri", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model/mirrorTextModel", "vs/editor/common/core/wordHelper", "vs/editor/common/languages/linkComputer", "vs/editor/common/languages/supports/inplaceReplaceSupport", "vs/editor/common/services/editorBaseApi", "vs/base/common/stopwatch", "vs/editor/common/services/unicodeTextModelHighlighter", "vs/editor/common/diff/legacyLinesDiffComputer", "vs/editor/common/diff/linesDiffComputers", "vs/base/common/objects", "vs/base/common/errors", "vs/editor/common/languages/defaultDocumentColorsComputer", "vs/editor/common/services/findSectionHeaders"], function (require, exports, diff_1, uri_1, position_1, range_1, mirrorTextModel_1, wordHelper_1, linkComputer_1, inplaceReplaceSupport_1, editorBaseApi_1, stopwatch_1, unicodeTextModelHighlighter_1, legacyLinesDiffComputer_1, linesDiffComputers_1, objects_1, errors_1, defaultDocumentColorsComputer_1, findSectionHeaders_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorSimpleWorker = void 0;
    exports.create = create;
    /**
     * @internal
     */
    class MirrorModel extends mirrorTextModel_1.MirrorTextModel {
        get uri() {
            return this._uri;
        }
        get eol() {
            return this._eol;
        }
        getValue() {
            return this.getText();
        }
        findMatches(regex) {
            const matches = [];
            for (let i = 0; i < this._lines.length; i++) {
                const line = this._lines[i];
                const offsetToAdd = this.offsetAt(new position_1.Position(i + 1, 1));
                const iteratorOverMatches = line.matchAll(regex);
                for (const match of iteratorOverMatches) {
                    if (match.index || match.index === 0) {
                        match.index = match.index + offsetToAdd;
                    }
                    matches.push(match);
                }
            }
            return matches;
        }
        getLinesContent() {
            return this._lines.slice(0);
        }
        getLineCount() {
            return this._lines.length;
        }
        getLineContent(lineNumber) {
            return this._lines[lineNumber - 1];
        }
        getWordAtPosition(position, wordDefinition) {
            const wordAtText = (0, wordHelper_1.getWordAtText)(position.column, (0, wordHelper_1.ensureValidWordDefinition)(wordDefinition), this._lines[position.lineNumber - 1], 0);
            if (wordAtText) {
                return new range_1.Range(position.lineNumber, wordAtText.startColumn, position.lineNumber, wordAtText.endColumn);
            }
            return null;
        }
        getWordUntilPosition(position, wordDefinition) {
            const wordAtPosition = this.getWordAtPosition(position, wordDefinition);
            if (!wordAtPosition) {
                return {
                    word: '',
                    startColumn: position.column,
                    endColumn: position.column
                };
            }
            return {
                word: this._lines[position.lineNumber - 1].substring(wordAtPosition.startColumn - 1, position.column - 1),
                startColumn: wordAtPosition.startColumn,
                endColumn: position.column
            };
        }
        words(wordDefinition) {
            const lines = this._lines;
            const wordenize = this._wordenize.bind(this);
            let lineNumber = 0;
            let lineText = '';
            let wordRangesIdx = 0;
            let wordRanges = [];
            return {
                *[Symbol.iterator]() {
                    while (true) {
                        if (wordRangesIdx < wordRanges.length) {
                            const value = lineText.substring(wordRanges[wordRangesIdx].start, wordRanges[wordRangesIdx].end);
                            wordRangesIdx += 1;
                            yield value;
                        }
                        else {
                            if (lineNumber < lines.length) {
                                lineText = lines[lineNumber];
                                wordRanges = wordenize(lineText, wordDefinition);
                                wordRangesIdx = 0;
                                lineNumber += 1;
                            }
                            else {
                                break;
                            }
                        }
                    }
                }
            };
        }
        getLineWords(lineNumber, wordDefinition) {
            const content = this._lines[lineNumber - 1];
            const ranges = this._wordenize(content, wordDefinition);
            const words = [];
            for (const range of ranges) {
                words.push({
                    word: content.substring(range.start, range.end),
                    startColumn: range.start + 1,
                    endColumn: range.end + 1
                });
            }
            return words;
        }
        _wordenize(content, wordDefinition) {
            const result = [];
            let match;
            wordDefinition.lastIndex = 0; // reset lastIndex just to be sure
            while (match = wordDefinition.exec(content)) {
                if (match[0].length === 0) {
                    // it did match the empty string
                    break;
                }
                result.push({ start: match.index, end: match.index + match[0].length });
            }
            return result;
        }
        getValueInRange(range) {
            range = this._validateRange(range);
            if (range.startLineNumber === range.endLineNumber) {
                return this._lines[range.startLineNumber - 1].substring(range.startColumn - 1, range.endColumn - 1);
            }
            const lineEnding = this._eol;
            const startLineIndex = range.startLineNumber - 1;
            const endLineIndex = range.endLineNumber - 1;
            const resultLines = [];
            resultLines.push(this._lines[startLineIndex].substring(range.startColumn - 1));
            for (let i = startLineIndex + 1; i < endLineIndex; i++) {
                resultLines.push(this._lines[i]);
            }
            resultLines.push(this._lines[endLineIndex].substring(0, range.endColumn - 1));
            return resultLines.join(lineEnding);
        }
        offsetAt(position) {
            position = this._validatePosition(position);
            this._ensureLineStarts();
            return this._lineStarts.getPrefixSum(position.lineNumber - 2) + (position.column - 1);
        }
        positionAt(offset) {
            offset = Math.floor(offset);
            offset = Math.max(0, offset);
            this._ensureLineStarts();
            const out = this._lineStarts.getIndexOf(offset);
            const lineLength = this._lines[out.index].length;
            // Ensure we return a valid position
            return {
                lineNumber: 1 + out.index,
                column: 1 + Math.min(out.remainder, lineLength)
            };
        }
        _validateRange(range) {
            const start = this._validatePosition({ lineNumber: range.startLineNumber, column: range.startColumn });
            const end = this._validatePosition({ lineNumber: range.endLineNumber, column: range.endColumn });
            if (start.lineNumber !== range.startLineNumber
                || start.column !== range.startColumn
                || end.lineNumber !== range.endLineNumber
                || end.column !== range.endColumn) {
                return {
                    startLineNumber: start.lineNumber,
                    startColumn: start.column,
                    endLineNumber: end.lineNumber,
                    endColumn: end.column
                };
            }
            return range;
        }
        _validatePosition(position) {
            if (!position_1.Position.isIPosition(position)) {
                throw new Error('bad position');
            }
            let { lineNumber, column } = position;
            let hasChanged = false;
            if (lineNumber < 1) {
                lineNumber = 1;
                column = 1;
                hasChanged = true;
            }
            else if (lineNumber > this._lines.length) {
                lineNumber = this._lines.length;
                column = this._lines[lineNumber - 1].length + 1;
                hasChanged = true;
            }
            else {
                const maxCharacter = this._lines[lineNumber - 1].length + 1;
                if (column < 1) {
                    column = 1;
                    hasChanged = true;
                }
                else if (column > maxCharacter) {
                    column = maxCharacter;
                    hasChanged = true;
                }
            }
            if (!hasChanged) {
                return position;
            }
            else {
                return { lineNumber, column };
            }
        }
    }
    /**
     * @internal
     */
    class EditorSimpleWorker {
        constructor(host, foreignModuleFactory) {
            this._host = host;
            this._models = Object.create(null);
            this._foreignModuleFactory = foreignModuleFactory;
            this._foreignModule = null;
        }
        dispose() {
            this._models = Object.create(null);
        }
        _getModel(uri) {
            return this._models[uri];
        }
        _getModels() {
            const all = [];
            Object.keys(this._models).forEach((key) => all.push(this._models[key]));
            return all;
        }
        acceptNewModel(data) {
            this._models[data.url] = new MirrorModel(uri_1.URI.parse(data.url), data.lines, data.EOL, data.versionId);
        }
        acceptModelChanged(strURL, e) {
            if (!this._models[strURL]) {
                return;
            }
            const model = this._models[strURL];
            model.onEvents(e);
        }
        acceptRemovedModel(strURL) {
            if (!this._models[strURL]) {
                return;
            }
            delete this._models[strURL];
        }
        async computeUnicodeHighlights(url, options, range) {
            const model = this._getModel(url);
            if (!model) {
                return { ranges: [], hasMore: false, ambiguousCharacterCount: 0, invisibleCharacterCount: 0, nonBasicAsciiCharacterCount: 0 };
            }
            return unicodeTextModelHighlighter_1.UnicodeTextModelHighlighter.computeUnicodeHighlights(model, options, range);
        }
        async findSectionHeaders(url, options) {
            const model = this._getModel(url);
            if (!model) {
                return [];
            }
            return (0, findSectionHeaders_1.findSectionHeaders)(model, options);
        }
        // ---- BEGIN diff --------------------------------------------------------------------------
        async computeDiff(originalUrl, modifiedUrl, options, algorithm) {
            const original = this._getModel(originalUrl);
            const modified = this._getModel(modifiedUrl);
            if (!original || !modified) {
                return null;
            }
            const result = EditorSimpleWorker.computeDiff(original, modified, options, algorithm);
            return result;
        }
        static computeDiff(originalTextModel, modifiedTextModel, options, algorithm) {
            const diffAlgorithm = algorithm === 'advanced' ? linesDiffComputers_1.linesDiffComputers.getDefault() : linesDiffComputers_1.linesDiffComputers.getLegacy();
            const originalLines = originalTextModel.getLinesContent();
            const modifiedLines = modifiedTextModel.getLinesContent();
            const result = diffAlgorithm.computeDiff(originalLines, modifiedLines, options);
            const identical = (result.changes.length > 0 ? false : this._modelsAreIdentical(originalTextModel, modifiedTextModel));
            function getLineChanges(changes) {
                return changes.map(m => ([m.original.startLineNumber, m.original.endLineNumberExclusive, m.modified.startLineNumber, m.modified.endLineNumberExclusive, m.innerChanges?.map(m => [
                        m.originalRange.startLineNumber,
                        m.originalRange.startColumn,
                        m.originalRange.endLineNumber,
                        m.originalRange.endColumn,
                        m.modifiedRange.startLineNumber,
                        m.modifiedRange.startColumn,
                        m.modifiedRange.endLineNumber,
                        m.modifiedRange.endColumn,
                    ])]));
            }
            return {
                identical,
                quitEarly: result.hitTimeout,
                changes: getLineChanges(result.changes),
                moves: result.moves.map(m => ([
                    m.lineRangeMapping.original.startLineNumber,
                    m.lineRangeMapping.original.endLineNumberExclusive,
                    m.lineRangeMapping.modified.startLineNumber,
                    m.lineRangeMapping.modified.endLineNumberExclusive,
                    getLineChanges(m.changes)
                ])),
            };
        }
        static _modelsAreIdentical(original, modified) {
            const originalLineCount = original.getLineCount();
            const modifiedLineCount = modified.getLineCount();
            if (originalLineCount !== modifiedLineCount) {
                return false;
            }
            for (let line = 1; line <= originalLineCount; line++) {
                const originalLine = original.getLineContent(line);
                const modifiedLine = modified.getLineContent(line);
                if (originalLine !== modifiedLine) {
                    return false;
                }
            }
            return true;
        }
        async computeDirtyDiff(originalUrl, modifiedUrl, ignoreTrimWhitespace) {
            const original = this._getModel(originalUrl);
            const modified = this._getModel(modifiedUrl);
            if (!original || !modified) {
                return null;
            }
            const originalLines = original.getLinesContent();
            const modifiedLines = modified.getLinesContent();
            const diffComputer = new legacyLinesDiffComputer_1.DiffComputer(originalLines, modifiedLines, {
                shouldComputeCharChanges: false,
                shouldPostProcessCharChanges: false,
                shouldIgnoreTrimWhitespace: ignoreTrimWhitespace,
                shouldMakePrettyDiff: true,
                maxComputationTime: 1000
            });
            return diffComputer.computeDiff().changes;
        }
        // ---- END diff --------------------------------------------------------------------------
        // ---- BEGIN minimal edits ---------------------------------------------------------------
        static { this._diffLimit = 100000; }
        async computeMoreMinimalEdits(modelUrl, edits, pretty) {
            const model = this._getModel(modelUrl);
            if (!model) {
                return edits;
            }
            const result = [];
            let lastEol = undefined;
            edits = edits.slice(0).sort((a, b) => {
                if (a.range && b.range) {
                    return range_1.Range.compareRangesUsingStarts(a.range, b.range);
                }
                // eol only changes should go to the end
                const aRng = a.range ? 0 : 1;
                const bRng = b.range ? 0 : 1;
                return aRng - bRng;
            });
            // merge adjacent edits
            let writeIndex = 0;
            for (let readIndex = 1; readIndex < edits.length; readIndex++) {
                if (range_1.Range.getEndPosition(edits[writeIndex].range).equals(range_1.Range.getStartPosition(edits[readIndex].range))) {
                    edits[writeIndex].range = range_1.Range.fromPositions(range_1.Range.getStartPosition(edits[writeIndex].range), range_1.Range.getEndPosition(edits[readIndex].range));
                    edits[writeIndex].text += edits[readIndex].text;
                }
                else {
                    writeIndex++;
                    edits[writeIndex] = edits[readIndex];
                }
            }
            edits.length = writeIndex + 1;
            for (let { range, text, eol } of edits) {
                if (typeof eol === 'number') {
                    lastEol = eol;
                }
                if (range_1.Range.isEmpty(range) && !text) {
                    // empty change
                    continue;
                }
                const original = model.getValueInRange(range);
                text = text.replace(/\r\n|\n|\r/g, model.eol);
                if (original === text) {
                    // noop
                    continue;
                }
                // make sure diff won't take too long
                if (Math.max(text.length, original.length) > EditorSimpleWorker._diffLimit) {
                    result.push({ range, text });
                    continue;
                }
                // compute diff between original and edit.text
                const changes = (0, diff_1.stringDiff)(original, text, pretty);
                const editOffset = model.offsetAt(range_1.Range.lift(range).getStartPosition());
                for (const change of changes) {
                    const start = model.positionAt(editOffset + change.originalStart);
                    const end = model.positionAt(editOffset + change.originalStart + change.originalLength);
                    const newEdit = {
                        text: text.substr(change.modifiedStart, change.modifiedLength),
                        range: { startLineNumber: start.lineNumber, startColumn: start.column, endLineNumber: end.lineNumber, endColumn: end.column }
                    };
                    if (model.getValueInRange(newEdit.range) !== newEdit.text) {
                        result.push(newEdit);
                    }
                }
            }
            if (typeof lastEol === 'number') {
                result.push({ eol: lastEol, text: '', range: { startLineNumber: 0, startColumn: 0, endLineNumber: 0, endColumn: 0 } });
            }
            return result;
        }
        computeHumanReadableDiff(modelUrl, edits, options) {
            const model = this._getModel(modelUrl);
            if (!model) {
                return edits;
            }
            const result = [];
            let lastEol = undefined;
            edits = edits.slice(0).sort((a, b) => {
                if (a.range && b.range) {
                    return range_1.Range.compareRangesUsingStarts(a.range, b.range);
                }
                // eol only changes should go to the end
                const aRng = a.range ? 0 : 1;
                const bRng = b.range ? 0 : 1;
                return aRng - bRng;
            });
            for (let { range, text, eol } of edits) {
                if (typeof eol === 'number') {
                    lastEol = eol;
                }
                if (range_1.Range.isEmpty(range) && !text) {
                    // empty change
                    continue;
                }
                const original = model.getValueInRange(range);
                text = text.replace(/\r\n|\n|\r/g, model.eol);
                if (original === text) {
                    // noop
                    continue;
                }
                // make sure diff won't take too long
                if (Math.max(text.length, original.length) > EditorSimpleWorker._diffLimit) {
                    result.push({ range, text });
                    continue;
                }
                // compute diff between original and edit.text
                const originalLines = original.split(/\r\n|\n|\r/);
                const modifiedLines = text.split(/\r\n|\n|\r/);
                const diff = linesDiffComputers_1.linesDiffComputers.getDefault().computeDiff(originalLines, modifiedLines, options);
                const start = range_1.Range.lift(range).getStartPosition();
                function addPositions(pos1, pos2) {
                    return new position_1.Position(pos1.lineNumber + pos2.lineNumber - 1, pos2.lineNumber === 1 ? pos1.column + pos2.column - 1 : pos2.column);
                }
                function getText(lines, range) {
                    const result = [];
                    for (let i = range.startLineNumber; i <= range.endLineNumber; i++) {
                        const line = lines[i - 1];
                        if (i === range.startLineNumber && i === range.endLineNumber) {
                            result.push(line.substring(range.startColumn - 1, range.endColumn - 1));
                        }
                        else if (i === range.startLineNumber) {
                            result.push(line.substring(range.startColumn - 1));
                        }
                        else if (i === range.endLineNumber) {
                            result.push(line.substring(0, range.endColumn - 1));
                        }
                        else {
                            result.push(line);
                        }
                    }
                    return result;
                }
                for (const c of diff.changes) {
                    if (c.innerChanges) {
                        for (const x of c.innerChanges) {
                            result.push({
                                range: range_1.Range.fromPositions(addPositions(start, x.originalRange.getStartPosition()), addPositions(start, x.originalRange.getEndPosition())),
                                text: getText(modifiedLines, x.modifiedRange).join(model.eol)
                            });
                        }
                    }
                    else {
                        throw new errors_1.BugIndicatingError('The experimental diff algorithm always produces inner changes');
                    }
                }
            }
            if (typeof lastEol === 'number') {
                result.push({ eol: lastEol, text: '', range: { startLineNumber: 0, startColumn: 0, endLineNumber: 0, endColumn: 0 } });
            }
            return result;
        }
        // ---- END minimal edits ---------------------------------------------------------------
        async computeLinks(modelUrl) {
            const model = this._getModel(modelUrl);
            if (!model) {
                return null;
            }
            return (0, linkComputer_1.computeLinks)(model);
        }
        // --- BEGIN default document colors -----------------------------------------------------------
        async computeDefaultDocumentColors(modelUrl) {
            const model = this._getModel(modelUrl);
            if (!model) {
                return null;
            }
            return (0, defaultDocumentColorsComputer_1.computeDefaultDocumentColors)(model);
        }
        // ---- BEGIN suggest --------------------------------------------------------------------------
        static { this._suggestionsLimit = 10000; }
        async textualSuggest(modelUrls, leadingWord, wordDef, wordDefFlags) {
            const sw = new stopwatch_1.StopWatch();
            const wordDefRegExp = new RegExp(wordDef, wordDefFlags);
            const seen = new Set();
            outer: for (const url of modelUrls) {
                const model = this._getModel(url);
                if (!model) {
                    continue;
                }
                for (const word of model.words(wordDefRegExp)) {
                    if (word === leadingWord || !isNaN(Number(word))) {
                        continue;
                    }
                    seen.add(word);
                    if (seen.size > EditorSimpleWorker._suggestionsLimit) {
                        break outer;
                    }
                }
            }
            return { words: Array.from(seen), duration: sw.elapsed() };
        }
        // ---- END suggest --------------------------------------------------------------------------
        //#region -- word ranges --
        async computeWordRanges(modelUrl, range, wordDef, wordDefFlags) {
            const model = this._getModel(modelUrl);
            if (!model) {
                return Object.create(null);
            }
            const wordDefRegExp = new RegExp(wordDef, wordDefFlags);
            const result = Object.create(null);
            for (let line = range.startLineNumber; line < range.endLineNumber; line++) {
                const words = model.getLineWords(line, wordDefRegExp);
                for (const word of words) {
                    if (!isNaN(Number(word.word))) {
                        continue;
                    }
                    let array = result[word.word];
                    if (!array) {
                        array = [];
                        result[word.word] = array;
                    }
                    array.push({
                        startLineNumber: line,
                        startColumn: word.startColumn,
                        endLineNumber: line,
                        endColumn: word.endColumn
                    });
                }
            }
            return result;
        }
        //#endregion
        async navigateValueSet(modelUrl, range, up, wordDef, wordDefFlags) {
            const model = this._getModel(modelUrl);
            if (!model) {
                return null;
            }
            const wordDefRegExp = new RegExp(wordDef, wordDefFlags);
            if (range.startColumn === range.endColumn) {
                range = {
                    startLineNumber: range.startLineNumber,
                    startColumn: range.startColumn,
                    endLineNumber: range.endLineNumber,
                    endColumn: range.endColumn + 1
                };
            }
            const selectionText = model.getValueInRange(range);
            const wordRange = model.getWordAtPosition({ lineNumber: range.startLineNumber, column: range.startColumn }, wordDefRegExp);
            if (!wordRange) {
                return null;
            }
            const word = model.getValueInRange(wordRange);
            const result = inplaceReplaceSupport_1.BasicInplaceReplace.INSTANCE.navigateValueSet(range, selectionText, wordRange, word, up);
            return result;
        }
        // ---- BEGIN foreign module support --------------------------------------------------------------------------
        loadForeignModule(moduleId, createData, foreignHostMethods) {
            const proxyMethodRequest = (method, args) => {
                return this._host.fhr(method, args);
            };
            const foreignHost = (0, objects_1.createProxyObject)(foreignHostMethods, proxyMethodRequest);
            const ctx = {
                host: foreignHost,
                getMirrorModels: () => {
                    return this._getModels();
                }
            };
            if (this._foreignModuleFactory) {
                this._foreignModule = this._foreignModuleFactory(ctx, createData);
                // static foreing module
                return Promise.resolve((0, objects_1.getAllMethodNames)(this._foreignModule));
            }
            // ESM-comment-begin
            return new Promise((resolve, reject) => {
                require([moduleId], (foreignModule) => {
                    this._foreignModule = foreignModule.create(ctx, createData);
                    resolve((0, objects_1.getAllMethodNames)(this._foreignModule));
                }, reject);
            });
            // ESM-comment-end
            // ESM-uncomment-begin
            // return Promise.reject(new Error(`Unexpected usage`));
            // ESM-uncomment-end
        }
        // foreign method request
        fmr(method, args) {
            if (!this._foreignModule || typeof this._foreignModule[method] !== 'function') {
                return Promise.reject(new Error('Missing requestHandler or method: ' + method));
            }
            try {
                return Promise.resolve(this._foreignModule[method].apply(this._foreignModule, args));
            }
            catch (e) {
                return Promise.reject(e);
            }
        }
    }
    exports.EditorSimpleWorker = EditorSimpleWorker;
    /**
     * Called on the worker side
     * @internal
     */
    function create(host) {
        return new EditorSimpleWorker(host, null);
    }
    if (typeof importScripts === 'function') {
        // Running in a web worker
        globalThis.monaco = (0, editorBaseApi_1.createMonacoBaseAPI)();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU2ltcGxlV29ya2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL2VkaXRvclNpbXBsZVdvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxMUJoRyx3QkFFQztJQTF2QkQ7O09BRUc7SUFDSCxNQUFNLFdBQVksU0FBUSxpQ0FBZTtRQUV4QyxJQUFXLEdBQUc7WUFDYixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDbEIsQ0FBQztRQUVELElBQVcsR0FBRztZQUNiLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsQixDQUFDO1FBRU0sUUFBUTtZQUNkLE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLENBQUM7UUFFTSxXQUFXLENBQUMsS0FBYTtZQUMvQixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDbkIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNqRCxLQUFLLE1BQU0sS0FBSyxJQUFJLG1CQUFtQixFQUFFLENBQUM7b0JBQ3pDLElBQUksS0FBSyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsS0FBSyxLQUFLLENB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