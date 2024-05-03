/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "./foldingRanges", "vs/base/common/hash"], function (require, exports, event_1, foldingRanges_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FoldingModel = void 0;
    exports.toggleCollapseState = toggleCollapseState;
    exports.setCollapseStateLevelsDown = setCollapseStateLevelsDown;
    exports.setCollapseStateLevelsUp = setCollapseStateLevelsUp;
    exports.setCollapseStateUp = setCollapseStateUp;
    exports.setCollapseStateAtLevel = setCollapseStateAtLevel;
    exports.setCollapseStateForRest = setCollapseStateForRest;
    exports.setCollapseStateForMatchingLines = setCollapseStateForMatchingLines;
    exports.setCollapseStateForType = setCollapseStateForType;
    exports.getParentFoldLine = getParentFoldLine;
    exports.getPreviousFoldLine = getPreviousFoldLine;
    exports.getNextFoldLine = getNextFoldLine;
    class FoldingModel {
        get regions() { return this._regions; }
        get textModel() { return this._textModel; }
        get decorationProvider() { return this._decorationProvider; }
        constructor(textModel, decorationProvider) {
            this._updateEventEmitter = new event_1.Emitter();
            this.onDidChange = this._updateEventEmitter.event;
            this._textModel = textModel;
            this._decorationProvider = decorationProvider;
            this._regions = new foldingRanges_1.FoldingRegions(new Uint32Array(0), new Uint32Array(0));
            this._editorDecorationIds = [];
        }
        toggleCollapseState(toggledRegions) {
            if (!toggledRegions.length) {
                return;
            }
            toggledRegions = toggledRegions.sort((r1, r2) => r1.regionIndex - r2.regionIndex);
            const processed = {};
            this._decorationProvider.changeDecorations(accessor => {
                let k = 0; // index from [0 ... this.regions.length]
                let dirtyRegionEndLine = -1; // end of the range where decorations need to be updated
                let lastHiddenLine = -1; // the end of the last hidden lines
                const updateDecorationsUntil = (index) => {
                    while (k < index) {
                        const endLineNumber = this._regions.getEndLineNumber(k);
                        const isCollapsed = this._regions.isCollapsed(k);
                        if (endLineNumber <= dirtyRegionEndLine) {
                            const isManual = this.regions.getSource(k) !== 0 /* FoldSource.provider */;
                            accessor.changeDecorationOptions(this._editorDecorationIds[k], this._decorationProvider.getDecorationOption(isCollapsed, endLineNumber <= lastHiddenLine, isManual));
                        }
                        if (isCollapsed && endLineNumber > lastHiddenLine) {
                            lastHiddenLine = endLineNumber;
                        }
                        k++;
                    }
                };
                for (const region of toggledRegions) {
                    const index = region.regionIndex;
                    const editorDecorationId = this._editorDecorationIds[index];
                    if (editorDecorationId && !processed[editorDecorationId]) {
                        processed[editorDecorationId] = true;
                        updateDecorationsUntil(index); // update all decorations up to current index using the old dirtyRegionEndLine
                        const newCollapseState = !this._regions.isCollapsed(index);
                        this._regions.setCollapsed(index, newCollapseState);
                        dirtyRegionEndLine = Math.max(dirtyRegionEndLine, this._regions.getEndLineNumber(index));
                    }
                }
                updateDecorationsUntil(this._regions.length);
            });
            this._updateEventEmitter.fire({ model: this, collapseStateChanged: toggledRegions });
        }
        removeManualRanges(ranges) {
            const newFoldingRanges = new Array();
            const intersects = (foldRange) => {
                for (const range of ranges) {
                    if (!(range.startLineNumber > foldRange.endLineNumber || foldRange.startLineNumber > range.endLineNumber)) {
                        return true;
                    }
                }
                return false;
            };
            for (let i = 0; i < this._regions.length; i++) {
                const foldRange = this._regions.toFoldRange(i);
                if (foldRange.source === 0 /* FoldSource.provider */ || !intersects(foldRange)) {
                    newFoldingRanges.push(foldRange);
                }
            }
            this.updatePost(foldingRanges_1.FoldingRegions.fromFoldRanges(newFoldingRanges));
        }
        update(newRegions, blockedLineNumers = []) {
            const foldedOrManualRanges = this._currentFoldedOrManualRanges(blockedLineNumers);
            const newRanges = foldingRanges_1.FoldingRegions.sanitizeAndMerge(newRegions, foldedOrManualRanges, this._textModel.getLineCount());
            this.updatePost(foldingRanges_1.FoldingRegions.fromFoldRanges(newRanges));
        }
        updatePost(newRegions) {
            const newEditorDecorations = [];
            let lastHiddenLine = -1;
            for (let index = 0, limit = newRegions.length; index < limit; index++) {
                const startLineNumber = newRegions.getStartLineNumber(index);
                const endLineNumber = newRegions.getEndLineNumber(index);
                const isCollapsed = newRegions.isCollapsed(index);
                const isManual = newRegions.getSource(index) !== 0 /* FoldSource.provider */;
                const decorationRange = {
                    startLineNumber: startLineNumber,
                    startColumn: this._textModel.getLineMaxColumn(startLineNumber),
                    endLineNumber: endLineNumber,
                    endColumn: this._textModel.getLineMaxColumn(endLineNumber) + 1
                };
                newEditorDecorations.push({ range: decorationRange, options: this._decorationProvider.getDecorationOption(isCollapsed, endLineNumber <= lastHiddenLine, isManual) });
                if (isCollapsed && endLineNumber > lastHiddenLine) {
                    lastHiddenLine = endLineNumber;
                }
            }
            this._decorationProvider.changeDecorations(accessor => this._editorDecorationIds = accessor.deltaDecorations(this._editorDecorationIds, newEditorDecorations));
            this._regions = newRegions;
            this._updateEventEmitter.fire({ model: this });
        }
        _currentFoldedOrManualRanges(blockedLineNumers = []) {
            const isBlocked = (startLineNumber, endLineNumber) => {
                for (const blockedLineNumber of blockedLineNumers) {
                    if (startLineNumber < blockedLineNumber && blockedLineNumber <= endLineNumber) { // first line is visible
                        return true;
                    }
                }
                return false;
            };
            const foldedRanges = [];
            for (let i = 0, limit = this._regions.length; i < limit; i++) {
                let isCollapsed = this.regions.isCollapsed(i);
                const source = this.regions.getSource(i);
                if (isCollapsed || source !== 0 /* FoldSource.provider */) {
                    const foldRange = this._regions.toFoldRange(i);
                    const decRange = this._textModel.getDecorationRange(this._editorDecorationIds[i]);
                    if (decRange) {
                        if (isCollapsed && isBlocked(decRange.startLineNumber, decRange.endLineNumber)) {
                            isCollapsed = false; // uncollapse is the range is blocked
                        }
                        foldedRanges.push({
                            startLineNumber: decRange.startLineNumber,
                            endLineNumber: decRange.endLineNumber,
                            type: foldRange.type,
                            isCollapsed,
                            source
                        });
                    }
                }
            }
            return foldedRanges;
        }
        /**
         * Collapse state memento, for persistence only
         */
        getMemento() {
            const foldedOrManualRanges = this._currentFoldedOrManualRanges();
            const result = [];
            const maxLineNumber = this._textModel.getLineCount();
            for (let i = 0, limit = foldedOrManualRanges.length; i < limit; i++) {
                const range = foldedOrManualRanges[i];
                if (range.startLineNumber >= range.endLineNumber || range.startLineNumber < 1 || range.endLineNumber > maxLineNumber) {
                    continue;
                }
                const checksum = this._getLinesChecksum(range.startLineNumber + 1, range.endLineNumber);
                result.push({
                    startLineNumber: range.startLineNumber,
                    endLineNumber: range.endLineNumber,
                    isCollapsed: range.isCollapsed,
                    source: range.source,
                    checksum: checksum
                });
            }
            return (result.length > 0) ? result : undefined;
        }
        /**
         * Apply persisted state, for persistence only
         */
        applyMemento(state) {
            if (!Array.isArray(state)) {
                return;
            }
            const rangesToRestore = [];
            const maxLineNumber = this._textModel.getLineCount();
            for (const range of state) {
                if (range.startLineNumber >= range.endLineNumber || range.startLineNumber < 1 || range.endLineNumber > maxLineNumber) {
                    continue;
                }
                const checksum = this._getLinesChecksum(range.startLineNumber + 1, range.endLineNumber);
                if (!range.checksum || checksum === range.checksum) {
                    rangesToRestore.push({
                        startLineNumber: range.startLineNumber,
                        endLineNumber: range.endLineNumber,
                        type: undefined,
                        isCollapsed: range.isCollapsed ?? true,
                        source: range.source ?? 0 /* FoldSource.provider */
                    });
                }
            }
            const newRanges = foldingRanges_1.FoldingRegions.sanitizeAndMerge(this._regions, rangesToRestore, maxLineNumber);
            this.updatePost(foldingRanges_1.FoldingRegions.fromFoldRanges(newRanges));
        }
        _getLinesChecksum(lineNumber1, lineNumber2) {
            const h = (0, hash_1.hash)(this._textModel.getLineContent(lineNumber1)
                + this._textModel.getLineContent(lineNumber2));
            return h % 1000000; // 6 digits is plenty
        }
        dispose() {
            this._decorationProvider.removeDecorations(this._editorDecorationIds);
        }
        getAllRegionsAtLine(lineNumber, filter) {
            const result = [];
            if (this._regions) {
                let index = this._regions.findRange(lineNumber);
                let level = 1;
                while (index >= 0) {
                    const current = this._regions.toRegion(index);
                    if (!filter || filter(current, level)) {
                        result.push(current);
                    }
                    level++;
                    index = current.parentIndex;
                }
            }
            return result;
        }
        getRegionAtLine(lineNumber) {
            if (this._regions) {
                const index = this._regions.findRange(lineNumber);
                if (index >= 0) {
                    return this._regions.toRegion(index);
                }
            }
            return null;
        }
        getRegionsInside(region, filter) {
            const result = [];
            const index = region ? region.regionIndex + 1 : 0;
            const endLineNumber = region ? region.endLineNumber : Number.MAX_VALUE;
            if (filter && filter.length === 2) {
                const levelStack = [];
                for (let i = index, len = this._regions.length; i < len; i++) {
                    const current = this._regions.toRegion(i);
                    if (this._regions.getStartLineNumber(i) < endLineNumber) {
                        while (levelStack.length > 0 && !current.containedBy(levelStack[levelStack.length - 1])) {
                            levelStack.pop();
                        }
                        levelStack.push(current);
                        if (filter(current, levelStack.length)) {
                            result.push(current);
                        }
                    }
                    else {
                        break;
                    }
                }
            }
            else {
                for (let i = index, len = this._regions.length; i < len; i++) {
                    const current = this._regions.toRegion(i);
                    if (this._regions.getStartLineNumber(i) < endLineNumber) {
                        if (!filter || filter(current)) {
                            result.push(current);
                        }
                    }
                    else {
                        break;
                    }
                }
            }
            return result;
        }
    }
    exports.FoldingModel = FoldingModel;
    /**
     * Collapse or expand the regions at the given locations
     * @param levels The number of levels. Use 1 to only impact the regions at the location, use Number.MAX_VALUE for all levels.
     * @param lineNumbers the location of the regions to collapse or expand, or if not set, all regions in the model.
     */
    function toggleCollapseState(foldingModel, levels, lineNumbers) {
        const toToggle = [];
        for (const lineNumber of lineNumbers) {
            const region = foldingModel.getRegionAtLine(lineNumber);
            if (region) {
                const doCollapse = !region.isCollapsed;
                toToggle.push(region);
                if (levels > 1) {
                    const regionsInside = foldingModel.getRegionsInside(region, (r, level) => r.isCollapsed !== doCollapse && level < levels);
                    toToggle.push(...regionsInside);
                }
            }
        }
        foldingModel.toggleCollapseState(toToggle);
    }
    /**
     * Collapse or expand the regions at the given locations including all children.
     * @param doCollapse Whether to collapse or expand
     * @param levels The number of levels. Use 1 to only impact the regions at the location, use Number.MAX_VALUE for all levels.
     * @param lineNumbers the location of the regions to collapse or expand, or if not set, all regions in the model.
     */
    function setCollapseStateLevelsDown(foldingModel, doCollapse, levels = Number.MAX_VALUE, lineNumbers) {
        const toToggle = [];
        if (lineNumbers && lineNumbers.length > 0) {
            for (const lineNumber of lineNumbers) {
                const region = foldingModel.getRegionAtLine(lineNumber);
                if (region) {
                    if (region.isCollapsed !== doCollapse) {
                        toToggle.push(region);
                    }
                    if (levels > 1) {
                        const regionsInside = foldingModel.getRegionsInside(region, (r, level) => r.isCollapsed !== doCollapse && level < levels);
                        toToggle.push(...regionsInside);
                    }
                }
            }
        }
        else {
            const regionsInside = foldingModel.getRegionsInside(null, (r, level) => r.isCollapsed !== doCollapse && level < levels);
            toToggle.push(...regionsInside);
        }
        foldingModel.toggleCollapseState(toToggle);
    }
    /**
     * Collapse or expand the regions at the given locations including all parents.
     * @param doCollapse Whether to collapse or expand
     * @param levels The number of levels. Use 1 to only impact the regions at the location, use Number.MAX_VALUE for all levels.
     * @param lineNumbers the location of the regions to collapse or expand.
     */
    function setCollapseStateLevelsUp(foldingModel, doCollapse, levels, lineNumbers) {
        const toToggle = [];
        for (const lineNumber of lineNumbers) {
            const regions = foldingModel.getAllRegionsAtLine(lineNumber, (region, level) => region.isCollapsed !== doCollapse && level <= levels);
            toToggle.push(...regions);
        }
        foldingModel.toggleCollapseState(toToggle);
    }
    /**
     * Collapse or expand a region at the given locations. If the inner most region is already collapsed/expanded, uses the first parent instead.
     * @param doCollapse Whether to collapse or expand
     * @param lineNumbers the location of the regions to collapse or expand.
     */
    function setCollapseStateUp(foldingModel, doCollapse, lineNumbers) {
        const toToggle = [];
        for (const lineNumber of lineNumbers) {
            const regions = foldingModel.getAllRegionsAtLine(lineNumber, (region) => region.isCollapsed !== doCollapse);
            if (regions.length > 0) {
                toToggle.push(regions[0]);
            }
        }
        foldingModel.toggleCollapseState(toToggle);
    }
    /**
     * Folds or unfolds all regions that have a given level, except if they contain one of the blocked lines.
     * @param foldLevel level. Level == 1 is the top level
     * @param doCollapse Whether to collapse or expand
    */
    function setCollapseStateAtLevel(foldingModel, foldLevel, doCollapse, blockedLineNumbers) {
        const filter = (region, level) => level === foldLevel && region.isCollapsed !== doCollapse && !blockedLineNumbers.some(line => region.containsLine(line));
        const toToggle = foldingModel.getRegionsInside(null, filter);
        foldingModel.toggleCollapseState(toToggle);
    }
    /**
     * Folds or unfolds all regions, except if they contain or are contained by a region of one of the blocked lines.
     * @param doCollapse Whether to collapse or expand
     * @param blockedLineNumbers the location of regions to not collapse or expand
     */
    function setCollapseStateForRest(foldingModel, doCollapse, blockedLineNumbers) {
        const filteredRegions = [];
        for (const lineNumber of blockedLineNumbers) {
            const regions = foldingModel.getAllRegionsAtLine(lineNumber, undefined);
            if (regions.length > 0) {
                filteredRegions.push(regions[0]);
            }
        }
        const filter = (region) => filteredRegions.every((filteredRegion) => !filteredRegion.containedBy(region) && !region.containedBy(filteredRegion)) && region.isCollapsed !== doCollapse;
        const toToggle = foldingModel.getRegionsInside(null, filter);
        foldingModel.toggleCollapseState(toToggle);
    }
    /**
     * Folds all regions for which the lines start with a given regex
     * @param foldingModel the folding model
     */
    function setCollapseStateForMatchingLines(foldingModel, regExp, doCollapse) {
        const editorModel = foldingModel.textModel;
        const regions = foldingModel.regions;
        const toToggle = [];
        for (let i = regions.length - 1; i >= 0; i--) {
            if (doCollapse !== regions.isCollapsed(i)) {
                const startLineNumber = regions.getStartLineNumber(i);
                if (regExp.test(editorModel.getLineContent(startLineNumber))) {
                    toToggle.push(regions.toRegion(i));
                }
            }
        }
        foldingModel.toggleCollapseState(toToggle);
    }
    /**
     * Folds all regions of the given type
     * @param foldingModel the folding model
     */
    function setCollapseStateForType(foldingModel, type, doCollapse) {
        const regions = foldingModel.regions;
        const toToggle = [];
        for (let i = regions.length - 1; i >= 0; i--) {
            if (doCollapse !== regions.isCollapsed(i) && type === regions.getType(i)) {
                toToggle.push(regions.toRegion(i));
            }
        }
        foldingModel.toggleCollapseState(toToggle);
    }
    /**
     * Get line to go to for parent fold of current line
     * @param lineNumber the current line number
     * @param foldingModel the folding model
     *
     * @return Parent fold start line
     */
    function getParentFoldLine(lineNumber, foldingModel) {
        let startLineNumber = null;
        const foldingRegion = foldingModel.getRegionAtLine(lineNumber);
        if (foldingRegion !== null) {
            startLineNumber = foldingRegion.startLineNumber;
            // If current line is not the start of the current fold, go to top line of current fold. If not, go to parent fold
            if (lineNumber === startLineNumber) {
                const parentFoldingIdx = foldingRegion.parentIndex;
                if (parentFoldingIdx !== -1) {
                    startLineNumber = foldingModel.regions.getStartLineNumber(parentFoldingIdx);
                }
                else {
                    startLineNumber = null;
                }
            }
        }
        return startLineNumber;
    }
    /**
     * Get line to go to for previous fold at the same level of current line
     * @param lineNumber the current line number
     * @param foldingModel the folding model
     *
     * @return Previous fold start line
     */
    function getPreviousFoldLine(lineNumber, foldingModel) {
        let foldingRegion = foldingModel.getRegionAtLine(lineNumber);
        // If on the folding range start line, go to previous sibling.
        if (foldingRegion !== null && foldingRegion.startLineNumber === lineNumber) {
            // If current line is not the start of the current fold, go to top line of current fold. If not, go to previous fold.
            if (lineNumber !== foldingRegion.startLineNumber) {
                return foldingRegion.startLineNumber;
            }
            else {
                // Find min line number to stay within parent.
                const expectedParentIndex = foldingRegion.parentIndex;
                let minLineNumber = 0;
                if (expectedParentIndex !== -1) {
                    minLineNumber = foldingModel.regions.getStartLineNumber(foldingRegion.parentIndex);
                }
                // Find fold at same level.
                while (foldingRegion !== null) {
                    if (foldingRegion.regionIndex > 0) {
                        foldingRegion = foldingModel.regions.toRegion(foldingRegion.regionIndex - 1);
                        // Keep at same level.
                        if (foldingRegion.startLineNumber <= minLineNumber) {
                            return null;
                        }
                        else if (foldingRegion.parentIndex === expectedParentIndex) {
                            return foldingRegion.startLineNumber;
                        }
                    }
                    else {
                        return null;
                    }
                }
            }
        }
        else {
            // Go to last fold that's before the current line.
            if (foldingModel.regions.length > 0) {
                foldingRegion = foldingModel.regions.toRegion(foldingModel.regions.length - 1);
                while (foldingRegion !== null) {
                    // Found fold before current line.
                    if (foldingRegion.startLineNumber < lineNumber) {
                        return foldingRegion.startLineNumber;
                    }
                    if (foldingRegion.regionIndex > 0) {
                        foldingRegion = foldingModel.regions.toRegion(foldingRegion.regionIndex - 1);
                    }
                    else {
                        foldingRegion = null;
                    }
                }
            }
        }
        return null;
    }
    /**
     * Get line to go to next fold at the same level of current line
     * @param lineNumber the current line number
     * @param foldingModel the folding model
     *
     * @return Next fold start line
     */
    function getNextFoldLine(lineNumber, foldingModel) {
        let foldingRegion = foldingModel.getRegionAtLine(lineNumber);
        // If on the folding range start line, go to next sibling.
        if (foldingRegion !== null && foldingRegion.startLineNumber === lineNumber) {
            // Find max line number to stay within parent.
            const expectedParentIndex = foldingRegion.parentIndex;
            let maxLineNumber = 0;
            if (expectedParentIndex !== -1) {
                maxLineNumber = foldingModel.regions.getEndLineNumber(foldingRegion.parentIndex);
            }
            else if (foldingModel.regions.length === 0) {
                return null;
            }
            else {
                maxLineNumber = foldingModel.regions.getEndLineNumber(foldingModel.regions.length - 1);
            }
            // Find fold at same level.
            while (foldingRegion !== null) {
                if (foldingRegion.regionIndex < foldingModel.regions.length) {
                    foldingRegion = foldingModel.regions.toRegion(foldingRegion.regionIndex + 1);
                    // Keep at same level.
                    if (foldingRegion.startLineNumber >= maxLineNumber) {
                        return null;
                    }
                    else if (foldingRegion.parentIndex === expectedParentIndex) {
                        return foldingRegion.startLineNumber;
                    }
                }
                else {
                    return null;
                }
            }
        }
        else {
            // Go to first fold that's after the current line.
            if (foldingModel.regions.length > 0) {
                foldingRegion = foldingModel.regions.toRegion(0);
                while (foldingRegion !== null) {
                    // Found fold after current line.
                    if (foldingRegion.startLineNumber > lineNumber) {
                        return foldingRegion.startLineNumber;
                    }
                    if (foldingRegion.regionIndex < foldingModel.regions.length) {
                        foldingRegion = foldingModel.regions.toRegion(foldingRegion.regionIndex + 1);
                    }
                    else {
                        foldingRegion = null;
                    }
                }
            }
        }
        return null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGluZ01vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9mb2xkaW5nL2Jyb3dzZXIvZm9sZGluZ01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXlUaEcsa0RBY0M7SUFTRCxnRUFvQkM7SUFRRCw0REFPQztJQU9ELGdEQVNDO0lBT0QsMERBSUM7SUFPRCwwREFXQztJQU1ELDRFQWFDO0lBTUQsMERBU0M7SUFTRCw4Q0FnQkM7SUFTRCxrREFpREM7SUFTRCwwQ0FnREM7SUFwakJELE1BQWEsWUFBWTtRQVV4QixJQUFXLE9BQU8sS0FBcUIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUM5RCxJQUFXLFNBQVMsS0FBSyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ2xELElBQVcsa0JBQWtCLEtBQUssT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1FBRXBFLFlBQVksU0FBcUIsRUFBRSxrQkFBdUM7WUFQekQsd0JBQW1CLEdBQUcsSUFBSSxlQUFPLEVBQTJCLENBQUM7WUFDOUQsZ0JBQVcsR0FBbUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQztZQU81RixJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMsbUJBQW1CLEdBQUcsa0JBQWtCLENBQUM7WUFDOUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLDhCQUFjLENBQUMsSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRSxJQUFJLENBQUMsb0JBQW9CLEdBQUcsRUFBRSxDQUFDO1FBQ2hDLENBQUM7UUFFTSxtQkFBbUIsQ0FBQyxj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