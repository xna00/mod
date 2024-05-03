/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/codeEditor/browser/saveParticipants", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/test/browser/workbenchTestServices", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/lifecycle"], function (require, exports, assert, saveParticipants_1, testConfigurationService_1, workbenchTestServices_1, utils_1, range_1, selection_1, textFileEditorModel_1, textfiles_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Save Participants', function () {
        const disposables = new lifecycle_1.DisposableStore();
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            disposables.add(accessor.textFileService.files);
        });
        teardown(() => {
            disposables.clear();
        });
        test('insert final new line', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/final_new_line.txt'), 'utf8', undefined));
            await model.resolve();
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('files', { 'insertFinalNewline': true });
            const participant = new saveParticipants_1.FinalNewLineParticipant(configService, undefined);
            // No new line for empty lines
            let lineContent = '';
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* SaveReason.EXPLICIT */ });
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), lineContent);
            // No new line if last line already empty
            lineContent = `Hello New Line${model.textEditorModel.getEOL()}`;
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* SaveReason.EXPLICIT */ });
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), lineContent);
            // New empty line added (single line)
            lineContent = 'Hello New Line';
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* SaveReason.EXPLICIT */ });
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), `${lineContent}${model.textEditorModel.getEOL()}`);
            // New empty line added (multi line)
            lineContent = `Hello New Line${model.textEditorModel.getEOL()}Hello New Line${model.textEditorModel.getEOL()}Hello New Line`;
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* SaveReason.EXPLICIT */ });
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), `${lineContent}${model.textEditorModel.getEOL()}`);
        });
        test('trim final new lines', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/trim_final_new_line.txt'), 'utf8', undefined));
            await model.resolve();
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('files', { 'trimFinalNewlines': true });
            const participant = new saveParticipants_1.TrimFinalNewLinesParticipant(configService, undefined);
            const textContent = 'Trim New Line';
            const eol = `${model.textEditorModel.getEOL()}`;
            // No new line removal if last line is not new line
            let lineContent = `${textContent}`;
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* SaveReason.EXPLICIT */ });
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), lineContent);
            // No new line removal if last line is single new line
            lineContent = `${textContent}${eol}`;
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* SaveReason.EXPLICIT */ });
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), lineContent);
            // Remove new line (single line with two new lines)
            lineContent = `${textContent}${eol}${eol}`;
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* SaveReason.EXPLICIT */ });
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), `${textContent}${eol}`);
            // Remove new lines (multiple lines with multiple new lines)
            lineContent = `${textContent}${eol}${textContent}${eol}${eol}${eol}`;
            model.textEditorModel.setValue(lineContent);
            await participant.participate(model, { reason: 1 /* SaveReason.EXPLICIT */ });
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), `${textContent}${eol}${textContent}${eol}`);
        });
        test('trim final new lines bug#39750', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/trim_final_new_line.txt'), 'utf8', undefined));
            await model.resolve();
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('files', { 'trimFinalNewlines': true });
            const participant = new saveParticipants_1.TrimFinalNewLinesParticipant(configService, undefined);
            const textContent = 'Trim New Line';
            // single line
            const lineContent = `${textContent}`;
            model.textEditorModel.setValue(lineContent);
            // apply edits and push to undo stack.
            const textEdits = [{ range: new range_1.Range(1, 14, 1, 14), text: '.', forceMoveMarkers: false }];
            model.textEditorModel.pushEditOperations([new selection_1.Selection(1, 14, 1, 14)], textEdits, () => { return [new selection_1.Selection(1, 15, 1, 15)]; });
            // undo
            await model.textEditorModel.undo();
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), `${textContent}`);
            // trim final new lines should not mess the undo stack
            await participant.participate(model, { reason: 1 /* SaveReason.EXPLICIT */ });
            await model.textEditorModel.redo();
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), `${textContent}.`);
        });
        test('trim final new lines bug#46075', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/trim_final_new_line.txt'), 'utf8', undefined));
            await model.resolve();
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('files', { 'trimFinalNewlines': true });
            const participant = new saveParticipants_1.TrimFinalNewLinesParticipant(configService, undefined);
            const textContent = 'Test';
            const eol = `${model.textEditorModel.getEOL()}`;
            const content = `${textContent}${eol}${eol}`;
            model.textEditorModel.setValue(content);
            // save many times
            for (let i = 0; i < 10; i++) {
                await participant.participate(model, { reason: 1 /* SaveReason.EXPLICIT */ });
            }
            // confirm trimming
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), `${textContent}${eol}`);
            // undo should go back to previous content immediately
            await model.textEditorModel.undo();
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), `${textContent}${eol}${eol}`);
            await model.textEditorModel.redo();
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), `${textContent}${eol}`);
        });
        test('trim whitespace', async function () {
            const model = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, utils_1.toResource.call(this, '/path/trim_final_new_line.txt'), 'utf8', undefined));
            await model.resolve();
            const configService = new testConfigurationService_1.TestConfigurationService();
            configService.setUserConfiguration('files', { 'trimTrailingWhitespace': true });
            const participant = new saveParticipants_1.TrimWhitespaceParticipant(configService, undefined);
            const textContent = 'Test';
            const content = `${textContent} 	`;
            model.textEditorModel.setValue(content);
            // save many times
            for (let i = 0; i < 10; i++) {
                await participant.participate(model, { reason: 1 /* SaveReason.EXPLICIT */ });
            }
            // confirm trimming
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), `${textContent}`);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2F2ZVBhcnRpY2lwYW50LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVFZGl0b3IvdGVzdC9icm93c2VyL3NhdmVQYXJ0aWNpcGFudC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBZ0JoRyxLQUFLLENBQUMsbUJBQW1CLEVBQUU7UUFFMUIsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFDMUMsSUFBSSxvQkFBMkMsQ0FBQztRQUNoRCxJQUFJLFFBQTZCLENBQUM7UUFFbEMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLG9CQUFvQixHQUFHLElBQUEscURBQTZCLEVBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzdFLFFBQVEsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkNBQW1CLENBQUMsQ0FBQztZQUNwRSxXQUFXLENBQUMsR0FBRyxDQUE2QixRQUFRLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzdFLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1QkFBdUIsRUFBRSxLQUFLO1lBQ2xDLE1BQU0sS0FBSyxHQUFpQyxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx5Q0FBbUIsRUFBRSxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFpQyxDQUFDLENBQUM7WUFFNU4sTUFBTSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdEIsTUFBTSxhQUFhLEdBQUcs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