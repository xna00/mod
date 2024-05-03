/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/notification/test/common/testNotificationService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/undoRedo/common/undoRedoService"], function (require, exports, assert, uri_1, mock_1, utils_1, testDialogService_1, testNotificationService_1, undoRedo_1, undoRedoService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('UndoRedoService', () => {
        function createUndoRedoService(dialogService = new testDialogService_1.TestDialogService()) {
            const notificationService = new testNotificationService_1.TestNotificationService();
            return new undoRedoService_1.UndoRedoService(dialogService, notificationService);
        }
        test('simple single resource elements', () => {
            const resource = uri_1.URI.file('test.txt');
            const service = createUndoRedoService();
            assert.strictEqual(service.canUndo(resource), false);
            assert.strictEqual(service.canRedo(resource), false);
            assert.strictEqual(service.hasElements(resource), false);
            assert.ok(service.getLastElement(resource) === null);
            let undoCall1 = 0;
            let redoCall1 = 0;
            const element1 = {
                type: 0 /* UndoRedoElementType.Resource */,
                resource: resource,
                label: 'typing 1',
                code: 'typing',
                undo: () => { undoCall1++; },
                redo: () => { redoCall1++; }
            };
            service.pushElement(element1);
            assert.strictEqual(undoCall1, 0);
            assert.strictEqual(redoCall1, 0);
            assert.strictEqual(service.canUndo(resource), true);
            assert.strictEqual(service.canRedo(resource), false);
            assert.strictEqual(service.hasElements(resource), true);
            assert.ok(service.getLastElement(resource) === element1);
            service.undo(resource);
            assert.strictEqual(undoCall1, 1);
            assert.strictEqual(redoCall1, 0);
            assert.strictEqual(service.canUndo(resource), false);
            assert.strictEqual(service.canRedo(resource), true);
            assert.strictEqual(service.hasElements(resource), true);
            assert.ok(service.getLastElement(resource) === null);
            service.redo(resource);
            assert.strictEqual(undoCall1, 1);
            assert.strictEqual(redoCall1, 1);
            assert.strictEqual(service.canUndo(resource), true);
            assert.strictEqual(service.canRedo(resource), false);
            assert.strictEqual(service.hasElements(resource), true);
            assert.ok(service.getLastElement(resource) === element1);
            let undoCall2 = 0;
            let redoCall2 = 0;
            const element2 = {
                type: 0 /* UndoRedoElementType.Resource */,
                resource: resource,
                label: 'typing 2',
                code: 'typing',
                undo: () => { undoCall2++; },
                redo: () => { redoCall2++; }
            };
            service.pushElement(element2);
            assert.strictEqual(undoCall1, 1);
            assert.strictEqual(redoCall1, 1);
            assert.strictEqual(undoCall2, 0);
            assert.strictEqual(redoCall2, 0);
            assert.strictEqual(service.canUndo(resource), true);
            assert.strictEqual(service.canRedo(resource), false);
            assert.strictEqual(service.hasElements(resource), true);
            assert.ok(service.getLastElement(resource) === element2);
            service.undo(resource);
            assert.strictEqual(undoCall1, 1);
            assert.strictEqual(redoCall1, 1);
            assert.strictEqual(undoCall2, 1);
            assert.strictEqual(redoCall2, 0);
            assert.strictEqual(service.canUndo(resource), true);
            assert.strictEqual(service.canRedo(resource), true);
            assert.strictEqual(service.hasElements(resource), true);
            assert.ok(service.getLastElement(resource) === null);
            let undoCall3 = 0;
            let redoCall3 = 0;
            const element3 = {
                type: 0 /* UndoRedoElementType.Resource */,
                resource: resource,
                label: 'typing 2',
                code: 'typing',
                undo: () => { undoCall3++; },
                redo: () => { redoCall3++; }
            };
            service.pushElement(element3);
            assert.strictEqual(undoCall1, 1);
            assert.strictEqual(redoCall1, 1);
            assert.strictEqual(undoCall2, 1);
            assert.strictEqual(redoCall2, 0);
            assert.strictEqual(undoCall3, 0);
            assert.strictEqual(redoCall3, 0);
            assert.strictEqual(service.canUndo(resource), true);
            assert.strictEqual(service.canRedo(resource), false);
            assert.strictEqual(service.hasElements(resource), true);
            assert.ok(service.getLastElement(resource) === element3);
            service.undo(resource);
            assert.strictEqual(undoCall1, 1);
            assert.strictEqual(redoCall1, 1);
            assert.strictEqual(undoCall2, 1);
            assert.strictEqual(redoCall2, 0);
            assert.strictEqual(undoCall3, 1);
            assert.strictEqual(redoCall3, 0);
            assert.strictEqual(service.canUndo(resource), true);
            assert.strictEqual(service.canRedo(resource), true);
            assert.strictEqual(service.hasElements(resource), true);
            assert.ok(service.getLastElement(resource) === null);
        });
        test('multi resource elements', async () => {
            const resource1 = uri_1.URI.file('test1.txt');
            const resource2 = uri_1.URI.file('test2.txt');
            const service = createUndoRedoService(new class extends (0, mock_1.mock)() {
                async prompt(prompt) {
                    const result = prompt.buttons?.[0].run({ checkboxChecked: false });
                    return { result };
                }
                async confirm() {
                    return {
                        confirmed: true // confirm!
                    };
                }
            });
            let undoCall1 = 0, undoCall11 = 0, undoCall12 = 0;
            let redoCall1 = 0, redoCall11 = 0, redoCall12 = 0;
            const element1 = {
                type: 1 /* UndoRedoElementType.Workspace */,
                resources: [resource1, resource2],
                label: 'typing 1',
                code: 'typing',
                undo: () => { undoCall1++; },
                redo: () => { redoCall1++; },
                split: () => {
                    return [
                        {
                            type: 0 /* UndoRedoElementType.Resource */,
                            resource: resource1,
                            label: 'typing 1.1',
                            code: 'typing',
                            undo: () => { undoCall11++; },
                            redo: () => { redoCall11++; }
                        },
                        {
                            type: 0 /* UndoRedoElementType.Resource */,
                            resource: resource2,
                            label: 'typing 1.2',
                            code: 'typing',
                            undo: () => { undoCall12++; },
                            redo: () => { redoCall12++; }
                        }
                    ];
                }
            };
            service.pushElement(element1);
            assert.strictEqual(service.canUndo(resource1), true);
            assert.strictEqual(service.canRedo(resource1), false);
            assert.strictEqual(service.hasElements(resource1), true);
            assert.ok(service.getLastElement(resource1) === element1);
            assert.strictEqual(service.canUndo(resource2), true);
            assert.strictEqual(service.canRedo(resource2), false);
            assert.strictEqual(service.hasElements(resource2), true);
            assert.ok(service.getLastElement(resource2) === element1);
            await service.undo(resource1);
            assert.strictEqual(undoCall1, 1);
            assert.strictEqual(redoCall1, 0);
            assert.strictEqual(service.canUndo(resource1), false);
            assert.strictEqual(service.canRedo(resource1), true);
            assert.strictEqual(service.hasElements(resource1), true);
            assert.ok(service.getLastElement(resource1) === null);
            assert.strictEqual(service.canUndo(resource2), false);
            assert.strictEqual(service.canRedo(resource2), true);
            assert.strictEqual(service.hasElements(resource2), true);
            assert.ok(service.getLastElement(resource2) === null);
            await service.redo(resource2);
            assert.strictEqual(undoCall1, 1);
            assert.strictEqual(redoCall1, 1);
            assert.strictEqual(undoCall11, 0);
            assert.strictEqual(redoCall11, 0);
            assert.strictEqual(undoCall12, 0);
            assert.strictEqual(redoCall12, 0);
            assert.strictEqual(service.canUndo(resource1), true);
            assert.strictEqual(service.canRedo(resource1), false);
            assert.strictEqual(service.hasElements(resource1), true);
            assert.ok(service.getLastElement(resource1) === element1);
            assert.strictEqual(service.canUndo(resource2), true);
            assert.strictEqual(service.canRedo(resource2), false);
            assert.strictEqual(service.hasElements(resource2), true);
            assert.ok(service.getLastElement(resource2) === element1);
        });
        test('UndoRedoGroup.None uses id 0', () => {
            assert.strictEqual(undoRedo_1.UndoRedoGroup.None.id, 0);
            assert.strictEqual(undoRedo_1.UndoRedoGroup.None.nextOrder(), 0);
            assert.strictEqual(undoRedo_1.UndoRedoGroup.None.nextOrder(), 0);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5kb1JlZG9TZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VuZG9SZWRvL3Rlc3QvY29tbW9uL3VuZG9SZWRvU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFFN0IsU0FBUyxxQkFBcUIsQ0FBQyxnQkFBZ0MsSUFBSSxxQ0FBaUIsRUFBRTtZQUNyRixNQUFNLG1CQUFtQixHQUFHLElBQUksaURBQXVCLEVBQUUsQ0FBQztZQUMxRCxPQUFPLElBQUksaUNBQWUsQ0FBQyxhQUFhLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRUQsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtZQUM1QyxNQUFNLFFBQVEsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sT0FBTyxHQUFHLHFCQUFxQixFQUFFLENBQUM7WUFFeEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO1lBRXJELElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNsQixJQUFJ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