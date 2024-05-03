/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/contrib/editorState/browser/editorState"], function (require, exports, assert, uri_1, utils_1, position_1, selection_1, editorState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor Core - Editor State', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const allFlags = (1 /* CodeEditorStateFlag.Value */
            | 2 /* CodeEditorStateFlag.Selection */
            | 4 /* CodeEditorStateFlag.Position */
            | 8 /* CodeEditorStateFlag.Scroll */);
        test('empty editor state should be valid', () => {
            const result = validate({}, {});
            assert.strictEqual(result, true);
        });
        test('different model URIs should be invalid', () => {
            const result = validate({ model: { uri: uri_1.URI.parse('http://test1') } }, { model: { uri: uri_1.URI.parse('http://test2') } });
            assert.strictEqual(result, false);
        });
        test('different model versions should be invalid', () => {
            const result = validate({ model: { version: 1 } }, { model: { version: 2 } });
            assert.strictEqual(result, false);
        });
        test('different positions should be invalid', () => {
            const result = validate({ position: new position_1.Position(1, 2) }, { position: new position_1.Position(2, 3) });
            assert.strictEqual(result, false);
        });
        test('different selections should be invalid', () => {
            const result = validate({ selection: new selection_1.Selection(1, 2, 3, 4) }, { selection: new selection_1.Selection(5, 2, 3, 4) });
            assert.strictEqual(result, false);
        });
        test('different scroll positions should be invalid', () => {
            const result = validate({ scroll: { left: 1, top: 2 } }, { scroll: { left: 3, top: 2 } });
            assert.strictEqual(result, false);
        });
        function validate(source, target) {
            const sourceEditor = createEditor(source), targetEditor = createEditor(target);
            const result = new editorState_1.EditorState(sourceEditor, allFlags).validate(targetEditor);
            return result;
        }
        function createEditor({ model, position, selection, scroll } = {}) {
            const mappedModel = model ? { uri: model.uri ? model.uri : uri_1.URI.parse('http://dummy.org'), getVersionId: () => model.version } : null;
            return {
                getModel: () => mappedModel,
                getPosition: () => position,
                getSelection: () => selection,
                getScrollLeft: () => scroll && scroll.left,
                getScrollTop: () => scroll && scroll.top
            };
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU3RhdGUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZWRpdG9yU3RhdGUvdGVzdC9icm93c2VyL2VkaXRvclN0YXRlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUU7UUFFeEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLE1BQU0sUUFBUSxHQUFHLENBQ2hCO21EQUMrQjtrREFDRDtnREFDRixDQUM1QixDQUFDO1FBRUYsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtZQUMvQyxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdDQUF3QyxFQUFFLEdBQUcsRUFBRTtZQUNuRCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQ3RCLEVBQUUsS0FBSyxFQUFFLEVBQUUsR0FBRyxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxFQUM3QyxFQUFFLEtBQUssRUFBRSxFQUFFLEdBQUcsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsQ0FDN0MsQ0FBQztZQUVGLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDRDQUE0QyxFQUFFLEdBQUcsRUFBRTtZQUN2RCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQ3RCLEVBQUUsS0FBSyxFQUFF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