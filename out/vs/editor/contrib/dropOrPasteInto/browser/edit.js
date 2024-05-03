/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/services/bulkEditService", "vs/editor/contrib/snippet/browser/snippetParser"], function (require, exports, bulkEditService_1, snippetParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createCombinedWorkspaceEdit = createCombinedWorkspaceEdit;
    exports.sortEditsByYieldTo = sortEditsByYieldTo;
    /**
     * Given a {@link DropOrPasteEdit} and set of ranges, creates a {@link WorkspaceEdit} that applies the insert text from
     * the {@link DropOrPasteEdit} at each range plus any additional edits.
     */
    function createCombinedWorkspaceEdit(uri, ranges, edit) {
        // If the edit insert text is empty, skip applying at each range
        if (typeof edit.insertText === 'string' ? edit.insertText === '' : edit.insertText.snippet === '') {
            return {
                edits: edit.additionalEdit?.edits ?? []
            };
        }
        return {
            edits: [
                ...ranges.map(range => new bulkEditService_1.ResourceTextEdit(uri, { range, text: typeof edit.insertText === 'string' ? snippetParser_1.SnippetParser.escape(edit.insertText) + '$0' : edit.insertText.snippet, insertAsSnippet: true })),
                ...(edit.additionalEdit?.edits ?? [])
            ]
        };
    }
    function sortEditsByYieldTo(edits) {
        function yieldsTo(yTo, other) {
            if ('mimeType' in yTo) {
                return yTo.mimeType === other.handledMimeType;
            }
            return !!other.kind && yTo.kind.contains(other.kind);
        }
        // Build list of nodes each node yields to
        const yieldsToMap = new Map();
        for (const edit of edits) {
            for (const yTo of edit.yieldTo ?? []) {
                for (const other of edits) {
                    if (other === edit) {
                        continue;
                    }
                    if (yieldsTo(yTo, other)) {
                        let arr = yieldsToMap.get(edit);
                        if (!arr) {
                            arr = [];
                            yieldsToMap.set(edit, arr);
                        }
                        arr.push(other);
                    }
                }
            }
        }
        if (!yieldsToMap.size) {
            return Array.from(edits);
        }
        // Topological sort
        const visited = new Set();
        const tempStack = [];
        function visit(nodes) {
            if (!nodes.length) {
                return [];
            }
            const node = nodes[0];
            if (tempStack.includes(node)) {
                console.warn('Yield to cycle detected', node);
                return nodes;
            }
            if (visited.has(node)) {
                return visit(nodes.slice(1));
            }
            let pre = [];
            const yTo = yieldsToMap.get(node);
            if (yTo) {
                tempStack.push(node);
                pre = visit(yTo);
                tempStack.pop();
            }
            visited.add(node);
            return [...pre, node, ...visit(nodes.slice(1))];
        }
        return visit(Array.from(edits));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZHJvcE9yUGFzdGVJbnRvL2Jyb3dzZXIvZWRpdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxrRUFpQkM7SUFFRCxnREFzRUM7SUE3RkQ7OztPQUdHO0lBQ0gsU0FBZ0IsMkJBQTJCLENBQUMsR0FBUSxFQUFFLE1BQXdCLEVBQUUsSUFBNEM7UUFDM0gsZ0VBQWdFO1FBQ2hFLElBQUksT0FBTyxJQUFJLENBQUMsVUFBVSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQ25HLE9BQU87Z0JBQ04sS0FBSyxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsS0FBSyxJQUFJLEVBQUU7YUFDdkMsQ0FBQztRQUNILENBQUM7UUFFRCxPQUFPO1lBQ04sS0FBSyxFQUFFO2dCQUNOLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUNyQixJQUFJLGtDQUFnQixDQUFDLEdBQUcsRUFDdkIsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sSUFBSSxDQUFDLFVBQVUsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLDZCQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsQ0FDcEosQ0FBQztnQkFDSCxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDO2FBQ3JDO1NBQ0Qs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