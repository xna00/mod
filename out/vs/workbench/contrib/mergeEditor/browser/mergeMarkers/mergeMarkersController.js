/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/workbench/contrib/mergeEditor/browser/model/lineRange", "vs/nls"], function (require, exports, dom_1, lifecycle_1, observable_1, lineRange_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeMarkersController = exports.conflictMarkers = void 0;
    exports.conflictMarkers = {
        start: '<<<<<<<',
        end: '>>>>>>>',
    };
    class MergeMarkersController extends lifecycle_1.Disposable {
        constructor(editor, mergeEditorViewModel) {
            super();
            this.editor = editor;
            this.mergeEditorViewModel = mergeEditorViewModel;
            this.viewZoneIds = [];
            this.disposableStore = new lifecycle_1.DisposableStore();
            this._register(editor.onDidChangeModelContent(e => {
                this.updateDecorations();
            }));
            this._register(editor.onDidChangeModel(e => {
                this.updateDecorations();
            }));
            this.updateDecorations();
        }
        updateDecorations() {
            const model = this.editor.getModel();
            const blocks = model ? getBlocks(model, { blockToRemoveStartLinePrefix: exports.conflictMarkers.start, blockToRemoveEndLinePrefix: exports.conflictMarkers.end }) : { blocks: [] };
            this.editor.setHiddenAreas(blocks.blocks.map(b => b.lineRange.deltaEnd(-1).toRange()), this);
            this.editor.changeViewZones(c => {
                this.disposableStore.clear();
                for (const id of this.viewZoneIds) {
                    c.removeZone(id);
                }
                this.viewZoneIds.length = 0;
                for (const b of blocks.blocks) {
                    const startLine = model.getLineContent(b.lineRange.startLineNumber).substring(0, 20);
                    const endLine = model.getLineContent(b.lineRange.endLineNumberExclusive - 1).substring(0, 20);
                    const conflictingLinesCount = b.lineRange.lineCount - 2;
                    const domNode = (0, dom_1.h)('div', [
                        (0, dom_1.h)('div.conflict-zone-root', [
                            (0, dom_1.h)('pre', [startLine]),
                            (0, dom_1.h)('span.dots', ['...']),
                            (0, dom_1.h)('pre', [endLine]),
                            (0, dom_1.h)('span.text', [
                                conflictingLinesCount === 1
                                    ? nls.localize('conflictingLine', "1 Conflicting Line")
                                    : nls.localize('conflictingLines', "{0} Conflicting Lines", conflictingLinesCount)
                            ]),
                        ]),
                    ]).root;
                    this.viewZoneIds.push(c.addZone({
                        afterLineNumber: b.lineRange.endLineNumberExclusive - 1,
                        domNode,
                        heightInLines: 1.5,
                    }));
                    const updateWidth = () => {
                        const layoutInfo = this.editor.getLayoutInfo();
                        domNode.style.width = `${layoutInfo.contentWidth - layoutInfo.verticalScrollbarWidth}px`;
                    };
                    this.disposableStore.add(this.editor.onDidLayoutChange(() => {
                        updateWidth();
                    }));
                    updateWidth();
                    this.disposableStore.add((0, observable_1.autorun)(reader => {
                        /** @description update classname */
                        const vm = this.mergeEditorViewModel.read(reader);
                        if (!vm) {
                            return;
                        }
                        const activeRange = vm.activeModifiedBaseRange.read(reader);
                        const classNames = [];
                        classNames.push('conflict-zone');
                        if (activeRange) {
                            const activeRangeInResult = vm.model.getLineRangeInResult(activeRange.baseRange, reader);
                            if (activeRangeInResult.intersects(b.lineRange)) {
                                classNames.push('focused');
                            }
                        }
                        domNode.className = classNames.join(' ');
                    }));
                }
            });
        }
    }
    exports.MergeMarkersController = MergeMarkersController;
    function getBlocks(document, configuration) {
        const blocks = [];
        const transformedContent = [];
        let inBlock = false;
        let startLineNumber = -1;
        let curLine = 0;
        for (const line of document.getLinesContent()) {
            curLine++;
            if (!inBlock) {
                if (line.startsWith(configuration.blockToRemoveStartLinePrefix)) {
                    inBlock = true;
                    startLineNumber = curLine;
                }
                else {
                    transformedContent.push(line);
                }
            }
            else {
                if (line.startsWith(configuration.blockToRemoveEndLinePrefix)) {
                    inBlock = false;
                    blocks.push(new Block(new lineRange_1.LineRange(startLineNumber, curLine - startLineNumber + 1)));
                    transformedContent.push('');
                }
            }
        }
        return {
            blocks,
            transformedContent: transformedContent.join('\n')
        };
    }
    class Block {
        constructor(lineRange) {
            this.lineRange = lineRange;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VNYXJrZXJzQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWVyZ2VFZGl0b3IvYnJvd3Nlci9tZXJnZU1hcmtlcnMvbWVyZ2VNYXJrZXJzQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXbkYsUUFBQSxlQUFlLEdBQUc7UUFDOUIsS0FBSyxFQUFFLFNBQVM7UUFDaEIsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDO0lBRUYsTUFBYSxzQkFBdUIsU0FBUSxzQkFBVTtRQUlyRCxZQUNpQixNQUFtQixFQUNuQixvQkFBbUU7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFIUSxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBQ25CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBK0M7WUFMbkUsZ0JBQVcsR0FBYSxFQUFFLENBQUM7WUFDM0Isb0JBQWUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQVF4RCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDakQsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDMUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMxQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUMxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3JDLE1BQU0sTUFB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