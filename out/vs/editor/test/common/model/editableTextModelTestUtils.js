/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/position", "vs/editor/common/model/mirrorTextModel", "vs/editor/test/common/testTextModel"], function (require, exports, assert, position_1, mirrorTextModel_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testApplyEditsWithSyncedModels = testApplyEditsWithSyncedModels;
    exports.assertSyncedModels = assertSyncedModels;
    function testApplyEditsWithSyncedModels(original, edits, expected, inputEditsAreInvalid = false) {
        const originalStr = original.join('\n');
        const expectedStr = expected.join('\n');
        assertSyncedModels(originalStr, (model, assertMirrorModels) => {
            // Apply edits & collect inverse edits
            const inverseEdits = model.applyEdits(edits, true);
            // Assert edits produced expected result
            assert.deepStrictEqual(model.getValue(1 /* EndOfLinePreference.LF */), expectedStr);
            assertMirrorModels();
            // Apply the inverse edits
            const inverseInverseEdits = model.applyEdits(inverseEdits, true);
            // Assert the inverse edits brought back model to original state
            assert.deepStrictEqual(model.getValue(1 /* EndOfLinePreference.LF */), originalStr);
            if (!inputEditsAreInvalid) {
                const simplifyEdit = (edit) => {
                    return {
                        range: edit.range,
                        text: edit.text,
                        forceMoveMarkers: edit.forceMoveMarkers || false
                    };
                };
                // Assert the inverse of the inverse edits are the original edits
                assert.deepStrictEqual(inverseInverseEdits.map(simplifyEdit), edits.map(simplifyEdit));
            }
            assertMirrorModels();
        });
    }
    var AssertDocumentLineMappingDirection;
    (function (AssertDocumentLineMappingDirection) {
        AssertDocumentLineMappingDirection[AssertDocumentLineMappingDirection["OffsetToPosition"] = 0] = "OffsetToPosition";
        AssertDocumentLineMappingDirection[AssertDocumentLineMappingDirection["PositionToOffset"] = 1] = "PositionToOffset";
    })(AssertDocumentLineMappingDirection || (AssertDocumentLineMappingDirection = {}));
    function assertOneDirectionLineMapping(model, direction, msg) {
        const allText = model.getValue();
        let line = 1, column = 1, previousIsCarriageReturn = false;
        for (let offset = 0; offset <= allText.length; offset++) {
            // The position coordinate system cannot express the position between \r and \n
            const position = new position_1.Position(line, column + (previousIsCarriageReturn ? -1 : 0));
            if (direction === 0 /* AssertDocumentLineMappingDirection.OffsetToPosition */) {
                const actualPosition = model.getPositionAt(offset);
                assert.strictEqual(actualPosition.toString(), position.toString(), msg + ' - getPositionAt mismatch for offset ' + offset);
            }
            else {
                // The position coordinate system cannot express the position between \r and \n
                const expectedOffset = offset + (previousIsCarriageReturn ? -1 : 0);
                const actualOffset = model.getOffsetAt(position);
                assert.strictEqual(actualOffset, expectedOffset, msg + ' - getOffsetAt mismatch for position ' + position.toString());
            }
            if (allText.charAt(offset) === '\n') {
                line++;
                column = 1;
            }
            else {
                column++;
            }
            previousIsCarriageReturn = (allText.charAt(offset) === '\r');
        }
    }
    function assertLineMapping(model, msg) {
        assertOneDirectionLineMapping(model, 1 /* AssertDocumentLineMappingDirection.PositionToOffset */, msg);
        assertOneDirectionLineMapping(model, 0 /* AssertDocumentLineMappingDirection.OffsetToPosition */, msg);
    }
    function assertSyncedModels(text, callback, setup = null) {
        const model = (0, testTextModel_1.createTextModel)(text);
        model.setEOL(0 /* EndOfLineSequence.LF */);
        assertLineMapping(model, 'model');
        if (setup) {
            setup(model);
            assertLineMapping(model, 'model');
        }
        const mirrorModel2 = new mirrorTextModel_1.MirrorTextModel(null, model.getLinesContent(), model.getEOL(), model.getVersionId());
        let mirrorModel2PrevVersionId = model.getVersionId();
        const disposable = model.onDidChangeContent((e) => {
            const versionId = e.versionId;
            if (versionId < mirrorModel2PrevVersionId) {
                console.warn('Model version id did not advance between edits (2)');
            }
            mirrorModel2PrevVersionId = versionId;
            mirrorModel2.onEvents(e);
        });
        const assertMirrorModels = () => {
            assertLineMapping(model, 'model');
            assert.strictEqual(mirrorModel2.getText(), model.getValue(), 'mirror model 2 text OK');
            assert.strictEqual(mirrorModel2.version, model.getVersionId(), 'mirror model 2 version OK');
        };
        callback(model, assertMirrorModels);
        disposable.dispose();
        model.dispose();
        mirrorModel2.dispose();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdGFibGVUZXh0TW9kZWxUZXN0VXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9tb2RlbC9lZGl0YWJsZVRleHRNb2RlbFRlc3RVdGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyx3RUFpQ0M7SUEwQ0QsZ0RBaUNDO0lBNUdELFNBQWdCLDhCQUE4QixDQUFDLFFBQWtCLEVBQUUsS0FBNkIsRUFBRSxRQUFrQixFQUFFLHVCQUFnQyxLQUFLO1FBQzFKLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEMsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV4QyxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsRUFBRTtZQUM3RCxzQ0FBc0M7WUFDdEMsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFbkQsd0NBQXdDO1lBQ3hDLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLFFBQVEsZ0NBQXdCLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFNUUsa0JBQWtCLEVBQUUsQ0FBQztZQUVyQiwwQkFBMEI7WUFDMUIsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVqRSxnRUFBZ0U7WUFDaEUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsUUFBUSxnQ0FBd0IsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUU1RSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSxZQUFZLEdB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