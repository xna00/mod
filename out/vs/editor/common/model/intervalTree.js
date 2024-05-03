/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntervalTree = exports.SENTINEL = exports.IntervalNode = exports.NodeColor = exports.ClassName = void 0;
    exports.getNodeColor = getNodeColor;
    exports.setNodeStickiness = setNodeStickiness;
    exports.nodeAcceptEdit = nodeAcceptEdit;
    exports.recomputeMaxEnd = recomputeMaxEnd;
    exports.intervalCompare = intervalCompare;
    //
    // The red-black tree is based on the "Introduction to Algorithms" by Cormen, Leiserson and Rivest.
    //
    var ClassName;
    (function (ClassName) {
        ClassName["EditorHintDecoration"] = "squiggly-hint";
        ClassName["EditorInfoDecoration"] = "squiggly-info";
        ClassName["EditorWarningDecoration"] = "squiggly-warning";
        ClassName["EditorErrorDecoration"] = "squiggly-error";
        ClassName["EditorUnnecessaryDecoration"] = "squiggly-unnecessary";
        ClassName["EditorUnnecessaryInlineDecoration"] = "squiggly-inline-unnecessary";
        ClassName["EditorDeprecatedInlineDecoration"] = "squiggly-inline-deprecated";
    })(ClassName || (exports.ClassName = ClassName = {}));
    var NodeColor;
    (function (NodeColor) {
        NodeColor[NodeColor["Black"] = 0] = "Black";
        NodeColor[NodeColor["Red"] = 1] = "Red";
    })(NodeColor || (exports.NodeColor = NodeColor = {}));
    var Constants;
    (function (Constants) {
        Constants[Constants["ColorMask"] = 1] = "ColorMask";
        Constants[Constants["ColorMaskInverse"] = 254] = "ColorMaskInverse";
        Constants[Constants["ColorOffset"] = 0] = "ColorOffset";
        Constants[Constants["IsVisitedMask"] = 2] = "IsVisitedMask";
        Constants[Constants["IsVisitedMaskInverse"] = 253] = "IsVisitedMaskInverse";
        Constants[Constants["IsVisitedOffset"] = 1] = "IsVisitedOffset";
        Constants[Constants["IsForValidationMask"] = 4] = "IsForValidationMask";
        Constants[Constants["IsForValidationMaskInverse"] = 251] = "IsForValidationMaskInverse";
        Constants[Constants["IsForValidationOffset"] = 2] = "IsForValidationOffset";
        Constants[Constants["StickinessMask"] = 24] = "StickinessMask";
        Constants[Constants["StickinessMaskInverse"] = 231] = "StickinessMaskInverse";
        Constants[Constants["StickinessOffset"] = 3] = "StickinessOffset";
        Constants[Constants["CollapseOnReplaceEditMask"] = 32] = "CollapseOnReplaceEditMask";
        Constants[Constants["CollapseOnReplaceEditMaskInverse"] = 223] = "CollapseOnReplaceEditMaskInverse";
        Constants[Constants["CollapseOnReplaceEditOffset"] = 5] = "CollapseOnReplaceEditOffset";
        Constants[Constants["IsMarginMask"] = 64] = "IsMarginMask";
        Constants[Constants["IsMarginMaskInverse"] = 191] = "IsMarginMaskInverse";
        Constants[Constants["IsMarginOffset"] = 6] = "IsMarginOffset";
        /**
         * Due to how deletion works (in order to avoid always walking the right subtree of the deleted node),
         * the deltas for nodes can grow and shrink dramatically. It has been observed, in practice, that unless
         * the deltas are corrected, integer overflow will occur.
         *
         * The integer overflow occurs when 53 bits are used in the numbers, but we will try to avoid it as
         * a node's delta gets below a negative 30 bits number.
         *
         * MIN SMI (SMall Integer) as defined in v8.
         * one bit is lost for boxing/unboxing flag.
         * one bit is lost for sign flag.
         * See https://thibaultlaurens.github.io/javascript/2013/04/29/how-the-v8-engine-works/#tagged-values
         */
        Constants[Constants["MIN_SAFE_DELTA"] = -1073741824] = "MIN_SAFE_DELTA";
        /**
         * MAX SMI (SMall Integer) as defined in v8.
         * one bit is lost for boxing/unboxing flag.
         * one bit is lost for sign flag.
         * See https://thibaultlaurens.github.io/javascript/2013/04/29/how-the-v8-engine-works/#tagged-values
         */
        Constants[Constants["MAX_SAFE_DELTA"] = 1073741824] = "MAX_SAFE_DELTA";
    })(Constants || (Constants = {}));
    function getNodeColor(node) {
        return ((node.metadata & 1 /* Constants.ColorMask */) >>> 0 /* Constants.ColorOffset */);
    }
    function setNodeColor(node, color) {
        node.metadata = ((node.metadata & 254 /* Constants.ColorMaskInverse */) | (color << 0 /* Constants.ColorOffset */));
    }
    function getNodeIsVisited(node) {
        return ((node.metadata & 2 /* Constants.IsVisitedMask */) >>> 1 /* Constants.IsVisitedOffset */) === 1;
    }
    function setNodeIsVisited(node, value) {
        node.metadata = ((node.metadata & 253 /* Constants.IsVisitedMaskInverse */) | ((value ? 1 : 0) << 1 /* Constants.IsVisitedOffset */));
    }
    function getNodeIsForValidation(node) {
        return ((node.metadata & 4 /* Constants.IsForValidationMask */) >>> 2 /* Constants.IsForValidationOffset */) === 1;
    }
    function setNodeIsForValidation(node, value) {
        node.metadata = ((node.metadata & 251 /* Constants.IsForValidationMaskInverse */) | ((value ? 1 : 0) << 2 /* Constants.IsForValidationOffset */));
    }
    function getNodeIsInGlyphMargin(node) {
        return ((node.metadata & 64 /* Constants.IsMarginMask */) >>> 6 /* Constants.IsMarginOffset */) === 1;
    }
    function setNodeIsInGlyphMargin(node, value) {
        node.metadata = ((node.metadata & 191 /* Constants.IsMarginMaskInverse */) | ((value ? 1 : 0) << 6 /* Constants.IsMarginOffset */));
    }
    function getNodeStickiness(node) {
        return ((node.metadata & 24 /* Constants.StickinessMask */) >>> 3 /* Constants.StickinessOffset */);
    }
    function _setNodeStickiness(node, stickiness) {
        node.metadata = ((node.metadata & 231 /* Constants.StickinessMaskInverse */) | (stickiness << 3 /* Constants.StickinessOffset */));
    }
    function getCollapseOnReplaceEdit(node) {
        return ((node.metadata & 32 /* Constants.CollapseOnReplaceEditMask */) >>> 5 /* Constants.CollapseOnReplaceEditOffset */) === 1;
    }
    function setCollapseOnReplaceEdit(node, value) {
        node.metadata = ((node.metadata & 223 /* Constants.CollapseOnReplaceEditMaskInverse */) | ((value ? 1 : 0) << 5 /* Constants.CollapseOnReplaceEditOffset */));
    }
    function setNodeStickiness(node, stickiness) {
        _setNodeStickiness(node, stickiness);
    }
    class IntervalNode {
        constructor(id, start, end) {
            this.metadata = 0;
            this.parent = this;
            this.left = this;
            this.right = this;
            setNodeColor(this, 1 /* NodeColor.Red */);
            this.start = start;
            this.end = end;
            // FORCE_OVERFLOWING_TEST: this.delta = start;
            this.delta = 0;
            this.maxEnd = end;
            this.id = id;
            this.ownerId = 0;
            this.options = null;
            setNodeIsForValidation(this, false);
            setNodeIsInGlyphMargin(this, false);
            _setNodeStickiness(this, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */);
            setCollapseOnReplaceEdit(this, false);
            this.cachedVersionId = 0;
            this.cachedAbsoluteStart = start;
            this.cachedAbsoluteEnd = end;
            this.range = null;
            setNodeIsVisited(this, false);
        }
        reset(versionId, start, end, range) {
            this.start = start;
            this.end = end;
            this.maxEnd = end;
            this.cachedVersionId = versionId;
            this.cachedAbsoluteStart = start;
            this.cachedAbsoluteEnd = end;
            this.range = range;
        }
        setOptions(options) {
            this.options = options;
            const className = this.options.className;
            setNodeIsForValidation(this, (className === "squiggly-error" /* ClassName.EditorErrorDecoration */
                || className === "squiggly-warning" /* ClassName.EditorWarningDecoration */
                || className === "squiggly-info" /* ClassName.EditorInfoDecoration */));
            setNodeIsInGlyphMargin(this, this.options.glyphMarginClassName !== null);
            _setNodeStickiness(this, this.options.stickiness);
            setCollapseOnReplaceEdit(this, this.options.collapseOnReplaceEdit);
        }
        setCachedOffsets(absoluteStart, absoluteEnd, cachedVersionId) {
            if (this.cachedVersionId !== cachedVersionId) {
                this.range = null;
            }
            this.cachedVersionId = cachedVersionId;
            this.cachedAbsoluteStart = absoluteStart;
            this.cachedAbsoluteEnd = absoluteEnd;
        }
        detach() {
            this.parent = null;
            this.left = null;
            this.right = null;
        }
    }
    exports.IntervalNode = IntervalNode;
    exports.SENTINEL = new IntervalNode(null, 0, 0);
    exports.SENTINEL.parent = exports.SENTINEL;
    exports.SENTINEL.left = exports.SENTINEL;
    exports.SENTINEL.right = exports.SENTINEL;
    setNodeColor(exports.SENTINEL, 0 /* NodeColor.Black */);
    class IntervalTree {
        constructor() {
            this.root = exports.SENTINEL;
            this.requestNormalizeDelta = false;
        }
        intervalSearch(start, end, filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations) {
            if (this.root === exports.SENTINEL) {
                return [];
            }
            return intervalSearch(this, start, end, filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
        }
        search(filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations) {
            if (this.root === exports.SENTINEL) {
                return [];
            }
            return search(this, filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations);
        }
        /**
         * Will not set `cachedAbsoluteStart` nor `cachedAbsoluteEnd` on the returned nodes!
         */
        collectNodesFromOwner(ownerId) {
            return collectNodesFromOwner(this, ownerId);
        }
        /**
         * Will not set `cachedAbsoluteStart` nor `cachedAbsoluteEnd` on the returned nodes!
         */
        collectNodesPostOrder() {
            return collectNodesPostOrder(this);
        }
        insert(node) {
            rbTreeInsert(this, node);
            this._normalizeDeltaIfNecessary();
        }
        delete(node) {
            rbTreeDelete(this, node);
            this._normalizeDeltaIfNecessary();
        }
        resolveNode(node, cachedVersionId) {
            const initialNode = node;
            let delta = 0;
            while (node !== this.root) {
                if (node === node.parent.right) {
                    delta += node.parent.delta;
                }
                node = node.parent;
            }
            const nodeStart = initialNode.start + delta;
            const nodeEnd = initialNode.end + delta;
            initialNode.setCachedOffsets(nodeStart, nodeEnd, cachedVersionId);
        }
        acceptReplace(offset, length, textLength, forceMoveMarkers) {
            // Our strategy is to remove all directly impacted nodes, and then add them back to the tree.
            // (1) collect all nodes that are intersecting this edit as nodes of interest
            const nodesOfInterest = searchForEditing(this, offset, offset + length);
            // (2) remove all nodes that are intersecting this edit
            for (let i = 0, len = nodesOfInterest.length; i < len; i++) {
                const node = nodesOfInterest[i];
                rbTreeDelete(this, node);
            }
            this._normalizeDeltaIfNecessary();
            // (3) edit all tree nodes except the nodes of interest
            noOverlapReplace(this, offset, offset + length, textLength);
            this._normalizeDeltaIfNecessary();
            // (4) edit the nodes of interest and insert them back in the tree
            for (let i = 0, len = nodesOfInterest.length; i < len; i++) {
                const node = nodesOfInterest[i];
                node.start = node.cachedAbsoluteStart;
                node.end = node.cachedAbsoluteEnd;
                nodeAcceptEdit(node, offset, (offset + length), textLength, forceMoveMarkers);
                node.maxEnd = node.end;
                rbTreeInsert(this, node);
            }
            this._normalizeDeltaIfNecessary();
        }
        getAllInOrder() {
            return search(this, 0, false, 0, false);
        }
        _normalizeDeltaIfNecessary() {
            if (!this.requestNormalizeDelta) {
                return;
            }
            this.requestNormalizeDelta = false;
            normalizeDelta(this);
        }
    }
    exports.IntervalTree = IntervalTree;
    //#region Delta Normalization
    function normalizeDelta(T) {
        let node = T.root;
        let delta = 0;
        while (node !== exports.SENTINEL) {
            if (node.left !== exports.SENTINEL && !getNodeIsVisited(node.left)) {
                // go left
                node = node.left;
                continue;
            }
            if (node.right !== exports.SENTINEL && !getNodeIsVisited(node.right)) {
                // go right
                delta += node.delta;
                node = node.right;
                continue;
            }
            // handle current node
            node.start = delta + node.start;
            node.end = delta + node.end;
            node.delta = 0;
            recomputeMaxEnd(node);
            setNodeIsVisited(node, true);
            // going up from this node
            setNodeIsVisited(node.left, false);
            setNodeIsVisited(node.right, false);
            if (node === node.parent.right) {
                delta -= node.parent.delta;
            }
            node = node.parent;
        }
        setNodeIsVisited(T.root, false);
    }
    //#endregion
    //#region Editing
    var MarkerMoveSemantics;
    (function (MarkerMoveSemantics) {
        MarkerMoveSemantics[MarkerMoveSemantics["MarkerDefined"] = 0] = "MarkerDefined";
        MarkerMoveSemantics[MarkerMoveSemantics["ForceMove"] = 1] = "ForceMove";
        MarkerMoveSemantics[MarkerMoveSemantics["ForceStay"] = 2] = "ForceStay";
    })(MarkerMoveSemantics || (MarkerMoveSemantics = {}));
    function adjustMarkerBeforeColumn(markerOffset, markerStickToPreviousCharacter, checkOffset, moveSemantics) {
        if (markerOffset < checkOffset) {
            return true;
        }
        if (markerOffset > checkOffset) {
            return false;
        }
        if (moveSemantics === 1 /* MarkerMoveSemantics.ForceMove */) {
            return false;
        }
        if (moveSemantics === 2 /* MarkerMoveSemantics.ForceStay */) {
            return true;
        }
        return markerStickToPreviousCharacter;
    }
    /**
     * This is a lot more complicated than strictly necessary to maintain the same behaviour
     * as when decorations were implemented using two markers.
     */
    function nodeAcceptEdit(node, start, end, textLength, forceMoveMarkers) {
        const nodeStickiness = getNodeStickiness(node);
        const startStickToPreviousCharacter = (nodeStickiness === 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */
            || nodeStickiness === 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */);
        const endStickToPreviousCharacter = (nodeStickiness === 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */
            || nodeStickiness === 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */);
        const deletingCnt = (end - start);
        const insertingCnt = textLength;
        const commonLength = Math.min(deletingCnt, insertingCnt);
        const nodeStart = node.start;
        let startDone = false;
        const nodeEnd = node.end;
        let endDone = false;
        if (start <= nodeStart && nodeEnd <= end && getCollapseOnReplaceEdit(node)) {
            // This edit encompasses the entire decoration range
            // and the decoration has asked to become collapsed
            node.start = start;
            startDone = true;
            node.end = start;
            endDone = true;
        }
        {
            const moveSemantics = forceMoveMarkers ? 1 /* MarkerMoveSemantics.ForceMove */ : (deletingCnt > 0 ? 2 /* MarkerMoveSemantics.ForceStay */ : 0 /* MarkerMoveSemantics.MarkerDefined */);
            if (!startDone && adjustMarkerBeforeColumn(nodeStart, startStickToPreviousCharacter, start, moveSemantics)) {
                startDone = true;
            }
            if (!endDone && adjustMarkerBeforeColumn(nodeEnd, endStickToPreviousCharacter, start, moveSemantics)) {
                endDone = true;
            }
        }
        if (commonLength > 0 && !forceMoveMarkers) {
            const moveSemantics = (deletingCnt > insertingCnt ? 2 /* MarkerMoveSemantics.ForceStay */ : 0 /* MarkerMoveSemantics.MarkerDefined */);
            if (!startDone && adjustMarkerBeforeColumn(nodeStart, startStickToPreviousCharacter, start + commonLength, moveSemantics)) {
                startDone = true;
            }
            if (!endDone && adjustMarkerBeforeColumn(nodeEnd, endStickToPreviousCharacter, start + commonLength, moveSemantics)) {
                endDone = true;
            }
        }
        {
            const moveSemantics = forceMoveMarkers ? 1 /* MarkerMoveSemantics.ForceMove */ : 0 /* MarkerMoveSemantics.MarkerDefined */;
            if (!startDone && adjustMarkerBeforeColumn(nodeStart, startStickToPreviousCharacter, end, moveSemantics)) {
                node.start = start + insertingCnt;
                startDone = true;
            }
            if (!endDone && adjustMarkerBeforeColumn(nodeEnd, endStickToPreviousCharacter, end, moveSemantics)) {
                node.end = start + insertingCnt;
                endDone = true;
            }
        }
        // Finish
        const deltaColumn = (insertingCnt - deletingCnt);
        if (!startDone) {
            node.start = Math.max(0, nodeStart + deltaColumn);
        }
        if (!endDone) {
            node.end = Math.max(0, nodeEnd + deltaColumn);
        }
        if (node.start > node.end) {
            node.end = node.start;
        }
    }
    function searchForEditing(T, start, end) {
        // https://en.wikipedia.org/wiki/Interval_tree#Augmented_tree
        // Now, it is known that two intervals A and B overlap only when both
        // A.low <= B.high and A.high >= B.low. When searching the trees for
        // nodes overlapping with a given interval, you can immediately skip:
        //  a) all nodes to the right of nodes whose low value is past the end of the given interval.
        //  b) all nodes that have their maximum 'high' value below the start of the given interval.
        let node = T.root;
        let delta = 0;
        let nodeMaxEnd = 0;
        let nodeStart = 0;
        let nodeEnd = 0;
        const result = [];
        let resultLen = 0;
        while (node !== exports.SENTINEL) {
            if (getNodeIsVisited(node)) {
                // going up from this node
                setNodeIsVisited(node.left, false);
                setNodeIsVisited(node.right, false);
                if (node === node.parent.right) {
                    delta -= node.parent.delta;
                }
                node = node.parent;
                continue;
            }
            if (!getNodeIsVisited(node.left)) {
                // first time seeing this node
                nodeMaxEnd = delta + node.maxEnd;
                if (nodeMaxEnd < start) {
                    // cover case b) from above
                    // there is no need to search this node or its children
                    setNodeIsVisited(node, true);
                    continue;
                }
                if (node.left !== exports.SENTINEL) {
                    // go left
                    node = node.left;
                    continue;
                }
            }
            // handle current node
            nodeStart = delta + node.start;
            if (nodeStart > end) {
                // cover case a) from above
                // there is no need to search this node or its right subtree
                setNodeIsVisited(node, true);
                continue;
            }
            nodeEnd = delta + node.end;
            if (nodeEnd >= start) {
                node.setCachedOffsets(nodeStart, nodeEnd, 0);
                result[resultLen++] = node;
            }
            setNodeIsVisited(node, true);
            if (node.right !== exports.SENTINEL && !getNodeIsVisited(node.right)) {
                // go right
                delta += node.delta;
                node = node.right;
                continue;
            }
        }
        setNodeIsVisited(T.root, false);
        return result;
    }
    function noOverlapReplace(T, start, end, textLength) {
        // https://en.wikipedia.org/wiki/Interval_tree#Augmented_tree
        // Now, it is known that two intervals A and B overlap only when both
        // A.low <= B.high and A.high >= B.low. When searching the trees for
        // nodes overlapping with a given interval, you can immediately skip:
        //  a) all nodes to the right of nodes whose low value is past the end of the given interval.
        //  b) all nodes that have their maximum 'high' value below the start of the given interval.
        let node = T.root;
        let delta = 0;
        let nodeMaxEnd = 0;
        let nodeStart = 0;
        const editDelta = (textLength - (end - start));
        while (node !== exports.SENTINEL) {
            if (getNodeIsVisited(node)) {
                // going up from this node
                setNodeIsVisited(node.left, false);
                setNodeIsVisited(node.right, false);
                if (node === node.parent.right) {
                    delta -= node.parent.delta;
                }
                recomputeMaxEnd(node);
                node = node.parent;
                continue;
            }
            if (!getNodeIsVisited(node.left)) {
                // first time seeing this node
                nodeMaxEnd = delta + node.maxEnd;
                if (nodeMaxEnd < start) {
                    // cover case b) from above
                    // there is no need to search this node or its children
                    setNodeIsVisited(node, true);
                    continue;
                }
                if (node.left !== exports.SENTINEL) {
                    // go left
                    node = node.left;
                    continue;
                }
            }
            // handle current node
            nodeStart = delta + node.start;
            if (nodeStart > end) {
                node.start += editDelta;
                node.end += editDelta;
                node.delta += editDelta;
                if (node.delta < -1073741824 /* Constants.MIN_SAFE_DELTA */ || node.delta > 1073741824 /* Constants.MAX_SAFE_DELTA */) {
                    T.requestNormalizeDelta = true;
                }
                // cover case a) from above
                // there is no need to search this node or its right subtree
                setNodeIsVisited(node, true);
                continue;
            }
            setNodeIsVisited(node, true);
            if (node.right !== exports.SENTINEL && !getNodeIsVisited(node.right)) {
                // go right
                delta += node.delta;
                node = node.right;
                continue;
            }
        }
        setNodeIsVisited(T.root, false);
    }
    //#endregion
    //#region Searching
    function collectNodesFromOwner(T, ownerId) {
        let node = T.root;
        const result = [];
        let resultLen = 0;
        while (node !== exports.SENTINEL) {
            if (getNodeIsVisited(node)) {
                // going up from this node
                setNodeIsVisited(node.left, false);
                setNodeIsVisited(node.right, false);
                node = node.parent;
                continue;
            }
            if (node.left !== exports.SENTINEL && !getNodeIsVisited(node.left)) {
                // go left
                node = node.left;
                continue;
            }
            // handle current node
            if (node.ownerId === ownerId) {
                result[resultLen++] = node;
            }
            setNodeIsVisited(node, true);
            if (node.right !== exports.SENTINEL && !getNodeIsVisited(node.right)) {
                // go right
                node = node.right;
                continue;
            }
        }
        setNodeIsVisited(T.root, false);
        return result;
    }
    function collectNodesPostOrder(T) {
        let node = T.root;
        const result = [];
        let resultLen = 0;
        while (node !== exports.SENTINEL) {
            if (getNodeIsVisited(node)) {
                // going up from this node
                setNodeIsVisited(node.left, false);
                setNodeIsVisited(node.right, false);
                node = node.parent;
                continue;
            }
            if (node.left !== exports.SENTINEL && !getNodeIsVisited(node.left)) {
                // go left
                node = node.left;
                continue;
            }
            if (node.right !== exports.SENTINEL && !getNodeIsVisited(node.right)) {
                // go right
                node = node.right;
                continue;
            }
            // handle current node
            result[resultLen++] = node;
            setNodeIsVisited(node, true);
        }
        setNodeIsVisited(T.root, false);
        return result;
    }
    function search(T, filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations) {
        let node = T.root;
        let delta = 0;
        let nodeStart = 0;
        let nodeEnd = 0;
        const result = [];
        let resultLen = 0;
        while (node !== exports.SENTINEL) {
            if (getNodeIsVisited(node)) {
                // going up from this node
                setNodeIsVisited(node.left, false);
                setNodeIsVisited(node.right, false);
                if (node === node.parent.right) {
                    delta -= node.parent.delta;
                }
                node = node.parent;
                continue;
            }
            if (node.left !== exports.SENTINEL && !getNodeIsVisited(node.left)) {
                // go left
                node = node.left;
                continue;
            }
            // handle current node
            nodeStart = delta + node.start;
            nodeEnd = delta + node.end;
            node.setCachedOffsets(nodeStart, nodeEnd, cachedVersionId);
            let include = true;
            if (filterOwnerId && node.ownerId && node.ownerId !== filterOwnerId) {
                include = false;
            }
            if (filterOutValidation && getNodeIsForValidation(node)) {
                include = false;
            }
            if (onlyMarginDecorations && !getNodeIsInGlyphMargin(node)) {
                include = false;
            }
            if (include) {
                result[resultLen++] = node;
            }
            setNodeIsVisited(node, true);
            if (node.right !== exports.SENTINEL && !getNodeIsVisited(node.right)) {
                // go right
                delta += node.delta;
                node = node.right;
                continue;
            }
        }
        setNodeIsVisited(T.root, false);
        return result;
    }
    function intervalSearch(T, intervalStart, intervalEnd, filterOwnerId, filterOutValidation, cachedVersionId, onlyMarginDecorations) {
        // https://en.wikipedia.org/wiki/Interval_tree#Augmented_tree
        // Now, it is known that two intervals A and B overlap only when both
        // A.low <= B.high and A.high >= B.low. When searching the trees for
        // nodes overlapping with a given interval, you can immediately skip:
        //  a) all nodes to the right of nodes whose low value is past the end of the given interval.
        //  b) all nodes that have their maximum 'high' value below the start of the given interval.
        let node = T.root;
        let delta = 0;
        let nodeMaxEnd = 0;
        let nodeStart = 0;
        let nodeEnd = 0;
        const result = [];
        let resultLen = 0;
        while (node !== exports.SENTINEL) {
            if (getNodeIsVisited(node)) {
                // going up from this node
                setNodeIsVisited(node.left, false);
                setNodeIsVisited(node.right, false);
                if (node === node.parent.right) {
                    delta -= node.parent.delta;
                }
                node = node.parent;
                continue;
            }
            if (!getNodeIsVisited(node.left)) {
                // first time seeing this node
                nodeMaxEnd = delta + node.maxEnd;
                if (nodeMaxEnd < intervalStart) {
                    // cover case b) from above
                    // there is no need to search this node or its children
                    setNodeIsVisited(node, true);
                    continue;
                }
                if (node.left !== exports.SENTINEL) {
                    // go left
                    node = node.left;
                    continue;
                }
            }
            // handle current node
            nodeStart = delta + node.start;
            if (nodeStart > intervalEnd) {
                // cover case a) from above
                // there is no need to search this node or its right subtree
                setNodeIsVisited(node, true);
                continue;
            }
            nodeEnd = delta + node.end;
            if (nodeEnd >= intervalStart) {
                // There is overlap
                node.setCachedOffsets(nodeStart, nodeEnd, cachedVersionId);
                let include = true;
                if (filterOwnerId && node.ownerId && node.ownerId !== filterOwnerId) {
                    include = false;
                }
                if (filterOutValidation && getNodeIsForValidation(node)) {
                    include = false;
                }
                if (onlyMarginDecorations && !getNodeIsInGlyphMargin(node)) {
                    include = false;
                }
                if (include) {
                    result[resultLen++] = node;
                }
            }
            setNodeIsVisited(node, true);
            if (node.right !== exports.SENTINEL && !getNodeIsVisited(node.right)) {
                // go right
                delta += node.delta;
                node = node.right;
                continue;
            }
        }
        setNodeIsVisited(T.root, false);
        return result;
    }
    //#endregion
    //#region Insertion
    function rbTreeInsert(T, newNode) {
        if (T.root === exports.SENTINEL) {
            newNode.parent = exports.SENTINEL;
            newNode.left = exports.SENTINEL;
            newNode.right = exports.SENTINEL;
            setNodeColor(newNode, 0 /* NodeColor.Black */);
            T.root = newNode;
            return T.root;
        }
        treeInsert(T, newNode);
        recomputeMaxEndWalkToRoot(newNode.parent);
        // repair tree
        let x = newNode;
        while (x !== T.root && getNodeColor(x.parent) === 1 /* NodeColor.Red */) {
            if (x.parent === x.parent.parent.left) {
                const y = x.parent.parent.right;
                if (getNodeColor(y) === 1 /* NodeColor.Red */) {
                    setNodeColor(x.parent, 0 /* NodeColor.Black */);
                    setNodeColor(y, 0 /* NodeColor.Black */);
                    setNodeColor(x.parent.parent, 1 /* NodeColor.Red */);
                    x = x.parent.parent;
                }
                else {
                    if (x === x.parent.right) {
                        x = x.parent;
                        leftRotate(T, x);
                    }
                    setNodeColor(x.parent, 0 /* NodeColor.Black */);
                    setNodeColor(x.parent.parent, 1 /* NodeColor.Red */);
                    rightRotate(T, x.parent.parent);
                }
            }
            else {
                const y = x.parent.parent.left;
                if (getNodeColor(y) === 1 /* NodeColor.Red */) {
                    setNodeColor(x.parent, 0 /* NodeColor.Black */);
                    setNodeColor(y, 0 /* NodeColor.Black */);
                    setNodeColor(x.parent.parent, 1 /* NodeColor.Red */);
                    x = x.parent.parent;
                }
                else {
                    if (x === x.parent.left) {
                        x = x.parent;
                        rightRotate(T, x);
                    }
                    setNodeColor(x.parent, 0 /* NodeColor.Black */);
                    setNodeColor(x.parent.parent, 1 /* NodeColor.Red */);
                    leftRotate(T, x.parent.parent);
                }
            }
        }
        setNodeColor(T.root, 0 /* NodeColor.Black */);
        return newNode;
    }
    function treeInsert(T, z) {
        let delta = 0;
        let x = T.root;
        const zAbsoluteStart = z.start;
        const zAbsoluteEnd = z.end;
        while (true) {
            const cmp = intervalCompare(zAbsoluteStart, zAbsoluteEnd, x.start + delta, x.end + delta);
            if (cmp < 0) {
                // this node should be inserted to the left
                // => it is not affected by the node's delta
                if (x.left === exports.SENTINEL) {
                    z.start -= delta;
                    z.end -= delta;
                    z.maxEnd -= delta;
                    x.left = z;
                    break;
                }
                else {
                    x = x.left;
                }
            }
            else {
                // this node should be inserted to the right
                // => it is not affected by the node's delta
                if (x.right === exports.SENTINEL) {
                    z.start -= (delta + x.delta);
                    z.end -= (delta + x.delta);
                    z.maxEnd -= (delta + x.delta);
                    x.right = z;
                    break;
                }
                else {
                    delta += x.delta;
                    x = x.right;
                }
            }
        }
        z.parent = x;
        z.left = exports.SENTINEL;
        z.right = exports.SENTINEL;
        setNodeColor(z, 1 /* NodeColor.Red */);
    }
    //#endregion
    //#region Deletion
    function rbTreeDelete(T, z) {
        let x;
        let y;
        // RB-DELETE except we don't swap z and y in case c)
        // i.e. we always delete what's pointed at by z.
        if (z.left === exports.SENTINEL) {
            x = z.right;
            y = z;
            // x's delta is no longer influenced by z's delta
            x.delta += z.delta;
            if (x.delta < -1073741824 /* Constants.MIN_SAFE_DELTA */ || x.delta > 1073741824 /* Constants.MAX_SAFE_DELTA */) {
                T.requestNormalizeDelta = true;
            }
            x.start += z.delta;
            x.end += z.delta;
        }
        else if (z.right === exports.SENTINEL) {
            x = z.left;
            y = z;
        }
        else {
            y = leftest(z.right);
            x = y.right;
            // y's delta is no longer influenced by z's delta,
            // but we don't want to walk the entire right-hand-side subtree of x.
            // we therefore maintain z's delta in y, and adjust only x
            x.start += y.delta;
            x.end += y.delta;
            x.delta += y.delta;
            if (x.delta < -1073741824 /* Constants.MIN_SAFE_DELTA */ || x.delta > 1073741824 /* Constants.MAX_SAFE_DELTA */) {
                T.requestNormalizeDelta = true;
            }
            y.start += z.delta;
            y.end += z.delta;
            y.delta = z.delta;
            if (y.delta < -1073741824 /* Constants.MIN_SAFE_DELTA */ || y.delta > 1073741824 /* Constants.MAX_SAFE_DELTA */) {
                T.requestNormalizeDelta = true;
            }
        }
        if (y === T.root) {
            T.root = x;
            setNodeColor(x, 0 /* NodeColor.Black */);
            z.detach();
            resetSentinel();
            recomputeMaxEnd(x);
            T.root.parent = exports.SENTINEL;
            return;
        }
        const yWasRed = (getNodeColor(y) === 1 /* NodeColor.Red */);
        if (y === y.parent.left) {
            y.parent.left = x;
        }
        else {
            y.parent.right = x;
        }
        if (y === z) {
            x.parent = y.parent;
        }
        else {
            if (y.parent === z) {
                x.parent = y;
            }
            else {
                x.parent = y.parent;
            }
            y.left = z.left;
            y.right = z.right;
            y.parent = z.parent;
            setNodeColor(y, getNodeColor(z));
            if (z === T.root) {
                T.root = y;
            }
            else {
                if (z === z.parent.left) {
                    z.parent.left = y;
                }
                else {
                    z.parent.right = y;
                }
            }
            if (y.left !== exports.SENTINEL) {
                y.left.parent = y;
            }
            if (y.right !== exports.SENTINEL) {
                y.right.parent = y;
            }
        }
        z.detach();
        if (yWasRed) {
            recomputeMaxEndWalkToRoot(x.parent);
            if (y !== z) {
                recomputeMaxEndWalkToRoot(y);
                recomputeMaxEndWalkToRoot(y.parent);
            }
            resetSentinel();
            return;
        }
        recomputeMaxEndWalkToRoot(x);
        recomputeMaxEndWalkToRoot(x.parent);
        if (y !== z) {
            recomputeMaxEndWalkToRoot(y);
            recomputeMaxEndWalkToRoot(y.parent);
        }
        // RB-DELETE-FIXUP
        let w;
        while (x !== T.root && getNodeColor(x) === 0 /* NodeColor.Black */) {
            if (x === x.parent.left) {
                w = x.parent.right;
                if (getNodeColor(w) === 1 /* NodeColor.Red */) {
                    setNodeColor(w, 0 /* NodeColor.Black */);
                    setNodeColor(x.parent, 1 /* NodeColor.Red */);
                    leftRotate(T, x.parent);
                    w = x.parent.right;
                }
                if (getNodeColor(w.left) === 0 /* NodeColor.Black */ && getNodeColor(w.right) === 0 /* NodeColor.Black */) {
                    setNodeColor(w, 1 /* NodeColor.Red */);
                    x = x.parent;
                }
                else {
                    if (getNodeColor(w.right) === 0 /* NodeColor.Black */) {
                        setNodeColor(w.left, 0 /* NodeColor.Black */);
                        setNodeColor(w, 1 /* NodeColor.Red */);
                        rightRotate(T, w);
                        w = x.parent.right;
                    }
                    setNodeColor(w, getNodeColor(x.parent));
                    setNodeColor(x.parent, 0 /* NodeColor.Black */);
                    setNodeColor(w.right, 0 /* NodeColor.Black */);
                    leftRotate(T, x.parent);
                    x = T.root;
                }
            }
            else {
                w = x.parent.left;
                if (getNodeColor(w) === 1 /* NodeColor.Red */) {
                    setNodeColor(w, 0 /* NodeColor.Black */);
                    setNodeColor(x.parent, 1 /* NodeColor.Red */);
                    rightRotate(T, x.parent);
                    w = x.parent.left;
                }
                if (getNodeColor(w.left) === 0 /* NodeColor.Black */ && getNodeColor(w.right) === 0 /* NodeColor.Black */) {
                    setNodeColor(w, 1 /* NodeColor.Red */);
                    x = x.parent;
                }
                else {
                    if (getNodeColor(w.left) === 0 /* NodeColor.Black */) {
                        setNodeColor(w.right, 0 /* NodeColor.Black */);
                        setNodeColor(w, 1 /* NodeColor.Red */);
                        leftRotate(T, w);
                        w = x.parent.left;
                    }
                    setNodeColor(w, getNodeColor(x.parent));
                    setNodeColor(x.parent, 0 /* NodeColor.Black */);
                    setNodeColor(w.left, 0 /* NodeColor.Black */);
                    rightRotate(T, x.parent);
                    x = T.root;
                }
            }
        }
        setNodeColor(x, 0 /* NodeColor.Black */);
        resetSentinel();
    }
    function leftest(node) {
        while (node.left !== exports.SENTINEL) {
            node = node.left;
        }
        return node;
    }
    function resetSentinel() {
        exports.SENTINEL.parent = exports.SENTINEL;
        exports.SENTINEL.delta = 0; // optional
        exports.SENTINEL.start = 0; // optional
        exports.SENTINEL.end = 0; // optional
    }
    //#endregion
    //#region Rotations
    function leftRotate(T, x) {
        const y = x.right; // set y.
        y.delta += x.delta; // y's delta is no longer influenced by x's delta
        if (y.delta < -1073741824 /* Constants.MIN_SAFE_DELTA */ || y.delta > 1073741824 /* Constants.MAX_SAFE_DELTA */) {
            T.requestNormalizeDelta = true;
        }
        y.start += x.delta;
        y.end += x.delta;
        x.right = y.left; // turn y's left subtree into x's right subtree.
        if (y.left !== exports.SENTINEL) {
            y.left.parent = x;
        }
        y.parent = x.parent; // link x's parent to y.
        if (x.parent === exports.SENTINEL) {
            T.root = y;
        }
        else if (x === x.parent.left) {
            x.parent.left = y;
        }
        else {
            x.parent.right = y;
        }
        y.left = x; // put x on y's left.
        x.parent = y;
        recomputeMaxEnd(x);
        recomputeMaxEnd(y);
    }
    function rightRotate(T, y) {
        const x = y.left;
        y.delta -= x.delta;
        if (y.delta < -1073741824 /* Constants.MIN_SAFE_DELTA */ || y.delta > 1073741824 /* Constants.MAX_SAFE_DELTA */) {
            T.requestNormalizeDelta = true;
        }
        y.start -= x.delta;
        y.end -= x.delta;
        y.left = x.right;
        if (x.right !== exports.SENTINEL) {
            x.right.parent = y;
        }
        x.parent = y.parent;
        if (y.parent === exports.SENTINEL) {
            T.root = x;
        }
        else if (y === y.parent.right) {
            y.parent.right = x;
        }
        else {
            y.parent.left = x;
        }
        x.right = y;
        y.parent = x;
        recomputeMaxEnd(y);
        recomputeMaxEnd(x);
    }
    //#endregion
    //#region max end computation
    function computeMaxEnd(node) {
        let maxEnd = node.end;
        if (node.left !== exports.SENTINEL) {
            const leftMaxEnd = node.left.maxEnd;
            if (leftMaxEnd > maxEnd) {
                maxEnd = leftMaxEnd;
            }
        }
        if (node.right !== exports.SENTINEL) {
            const rightMaxEnd = node.right.maxEnd + node.delta;
            if (rightMaxEnd > maxEnd) {
                maxEnd = rightMaxEnd;
            }
        }
        return maxEnd;
    }
    function recomputeMaxEnd(node) {
        node.maxEnd = computeMaxEnd(node);
    }
    function recomputeMaxEndWalkToRoot(node) {
        while (node !== exports.SENTINEL) {
            const maxEnd = computeMaxEnd(node);
            if (node.maxEnd === maxEnd) {
                // no need to go further
                return;
            }
            node.maxEnd = maxEnd;
            node = node.parent;
        }
    }
    //#endregion
    //#region utils
    function intervalCompare(aStart, aEnd, bStart, bEnd) {
        if (aStart === bStart) {
            return aEnd - bEnd;
        }
        return aStart - bStart;
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJ2YWxUcmVlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL2ludGVydmFsVHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5RWhHLG9DQUVDO0lBOENELDhDQUVDO0lBbVJELHdDQTBFQztJQXF2QkQsMENBRUM7SUFvQkQsMENBS0M7SUFsdUNELEVBQUU7SUFDRixtR0FBbUc7SUFDbkcsRUFBRTtJQUVGLElBQWtCLFNBUWpCO0lBUkQsV0FBa0IsU0FBUztRQUMxQixtREFBc0MsQ0FBQTtRQUN0QyxtREFBc0MsQ0FBQTtRQUN0Qyx5REFBNEMsQ0FBQTtRQUM1QyxxREFBd0MsQ0FBQTtRQUN4QyxpRUFBb0QsQ0FBQTtRQUNwRCw4RUFBaUUsQ0FBQTtRQUNqRSw0RUFBK0QsQ0FBQTtJQUNoRSxDQUFDLEVBUmlCLFNBQVMseUJBQVQsU0FBUyxRQVExQjtJQUVELElBQWtCLFNBR2pCO0lBSEQsV0FBa0IsU0FBUztRQUMxQiwyQ0FBUyxDQUFBO1FBQ1QsdUNBQU8sQ0FBQTtJQUNSLENBQUMsRUFIaUIsU0FBUyx5QkFBVCxTQUFTLFFBRzFCO0lBRUQsSUFBVyxTQThDVjtJQTlDRCxXQUFXLFNBQVM7UUFDbkIsbURBQXNCLENBQUE7UUFDdEIsbUVBQTZCLENBQUE7UUFDN0IsdURBQWUsQ0FBQTtRQUVmLDJEQUEwQixDQUFBO1FBQzFCLDJFQUFpQyxDQUFBO1FBQ2pDLCtEQUFtQixDQUFBO1FBRW5CLHVFQUFnQyxDQUFBO1FBQ2hDLHVGQUF1QyxDQUFBO1FBQ3ZDLDJFQUF5QixDQUFBO1FBRXpCLDhEQUEyQixDQUFBO1FBQzNCLDZFQUFrQyxDQUFBO1FBQ2xDLGlFQUFvQixDQUFBO1FBRXBCLG9GQUFzQyxDQUFBO1FBQ3RDLG1HQUE2QyxDQUFBO1FBQzdDLHVGQUErQixD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