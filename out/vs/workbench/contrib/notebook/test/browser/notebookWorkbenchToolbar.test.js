/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/browser/viewParts/notebookEditorToolbar", "vs/base/common/actions", "assert", "vs/base/test/common/utils"], function (require, exports, notebookEditorToolbar_1, actions_1, assert, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Calculate the visible actions in the toolbar.
     * @param action The action to measure.
     * @param container The container the action will be placed in.
     * @returns The primary and secondary actions to be rendered
     *
     * NOTE: every action requires space for ACTION_PADDING +8 to the right.
     *
     * ex: action with size 50 requires 58px of space
     */
    suite('Workbench Toolbar calculateActions (strategy always + never)', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const defaultSecondaryActionModels = [
            { action: new actions_1.Action('secondaryAction0', 'Secondary Action 0'), size: 50, visible: true, renderLabel: true },
            { action: new actions_1.Action('secondaryAction1', 'Secondary Action 1'), size: 50, visible: true, renderLabel: true },
            { action: new actions_1.Action('secondaryAction2', 'Secondary Action 2'), size: 50, visible: true, renderLabel: true },
        ];
        const defaultSecondaryActions = defaultSecondaryActionModels.map(action => action.action);
        const separator = { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true };
        setup(function () {
            defaultSecondaryActionModels.forEach(action => disposables.add(action.action));
        });
        test('should return empty primary and secondary actions when given empty initial actions', () => {
            const result = (0, notebookEditorToolbar_1.workbenchCalculateActions)([], [], 100);
            assert.deepEqual(result.primaryActions, []);
            assert.deepEqual(result.secondaryActions, []);
        });
        test('should return all primary actions when they fit within the container width', () => {
            const actions = [
                { action: disposables.add(new actions_1.Action('action0', 'Action 0')), size: 50, visible: true, renderLabel: true },
                { action: disposables.add(new actions_1.Action('action1', 'Action 1')), size: 50, visible: true, renderLabel: true },
                { action: disposables.add(new actions_1.Action('action2', 'Action 2')), size: 50, visible: true, renderLabel: true },
            ];
            const result = (0, notebookEditorToolbar_1.workbenchCalculateActions)(actions, defaultSecondaryActions, 200);
            assert.deepEqual(result.primaryActions, actions);
            assert.deepEqual(result.secondaryActions, defaultSecondaryActions);
        });
        test('should move actions to secondary when they do not fit within the container width', () => {
            const actions = [
                { action: disposables.add(new actions_1.Action('action0', 'Action 0')), size: 50, visible: true, renderLabel: true },
                { action: disposables.add(new actions_1.Action('action1', 'Action 1')), size: 50, visible: true, renderLabel: true },
                { action: disposables.add(new actions_1.Action('action2', 'Action 2')), size: 50, visible: true, renderLabel: true },
            ];
            const result = (0, notebookEditorToolbar_1.workbenchCalculateActions)(actions, defaultSecondaryActions, 100);
            assert.deepEqual(result.primaryActions, [actions[0]]);
            assert.deepEqual(result.secondaryActions, [actions[1], actions[2], separator, ...defaultSecondaryActionModels].map(action => action.action));
        });
        test('should ignore second separator when two separators are in a row', () => {
            const actions = [
                { action: disposables.add(new actions_1.Action('action0', 'Action 0')), size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: disposables.add(new actions_1.Action('action1', 'Action 1')), size: 50, visible: true, renderLabel: true },
            ];
            const result = (0, notebookEditorToolbar_1.workbenchCalculateActions)(actions, defaultSecondaryActions, 125);
            assert.deepEqual(result.primaryActions, [actions[0], actions[1], actions[3]]);
            assert.deepEqual(result.secondaryActions, defaultSecondaryActions);
        });
        test('should ignore separators when they are at the end of the resulting primary actions', () => {
            const actions = [
                { action: disposables.add(new actions_1.Action('action0', 'Action 0')), size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: disposables.add(new actions_1.Action('action1', 'Action 1')), size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
            ];
            const result = (0, notebookEditorToolbar_1.workbenchCalculateActions)(actions, defaultSecondaryActions, 200);
            assert.deepEqual(result.primaryActions, [actions[0], actions[1], actions[2]]);
            assert.deepEqual(result.secondaryActions, defaultSecondaryActions);
        });
        test('should keep actions with size 0 in primary actions', () => {
            const actions = [
                { action: disposables.add(new actions_1.Action('action0', 'Action 0')), size: 50, visible: true, renderLabel: true },
                { action: disposables.add(new actions_1.Action('action1', 'Action 1')), size: 50, visible: true, renderLabel: true },
                { action: disposables.add(new actions_1.Action('action2', 'Action 2')), size: 50, visible: true, renderLabel: true },
                { action: disposables.add(new actions_1.Action('action3', 'Action 3')), size: 0, visible: true, renderLabel: true },
            ];
            const result = (0, notebookEditorToolbar_1.workbenchCalculateActions)(actions, defaultSecondaryActions, 116);
            assert.deepEqual(result.primaryActions, [actions[0], actions[1], actions[3]]);
            assert.deepEqual(result.secondaryActions, [actions[2], separator, ...defaultSecondaryActionModels].map(action => action.action));
        });
        test('should not render separator if preceeded by size 0 action(s).', () => {
            const actions = [
                { action: disposables.add(new actions_1.Action('action0', 'Action 0')), size: 0, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: disposables.add(new actions_1.Action('action1', 'Action 1')), size: 50, visible: true, renderLabel: true },
            ];
            const result = (0, notebookEditorToolbar_1.workbenchCalculateActions)(actions, defaultSecondaryActions, 116);
            assert.deepEqual(result.primaryActions, [actions[0], actions[2]]);
            assert.deepEqual(result.secondaryActions, defaultSecondaryActions);
        });
        test('should not render second separator if space between is hidden (size 0) actions.', () => {
            const actions = [
                { action: disposables.add(new actions_1.Action('action0', 'Action 0')), size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: disposables.add(new actions_1.Action('action1', 'Action 1')), size: 0, visible: true, renderLabel: true },
                { action: disposables.add(new actions_1.Action('action2', 'Action 2')), size: 0, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: disposables.add(new actions_1.Action('action3', 'Action 3')), size: 50, visible: true, renderLabel: true },
            ];
            const result = (0, notebookEditorToolbar_1.workbenchCalculateActions)(actions, defaultSecondaryActions, 300);
            assert.deepEqual(result.primaryActions, [actions[0], actions[1], actions[2], actions[3], actions[5]]);
            assert.deepEqual(result.secondaryActions, defaultSecondaryActions);
        });
    });
    suite('Workbench Toolbar Dynamic calculateActions (strategy dynamic)', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const actionTemplate = [
            new actions_1.Action('action0', 'Action 0'),
            new actions_1.Action('action1', 'Action 1'),
            new actions_1.Action('action2', 'Action 2'),
            new actions_1.Action('action3', 'Action 3')
        ];
        const defaultSecondaryActionModels = [
            { action: new actions_1.Action('secondaryAction0', 'Secondary Action 0'), size: 50, visible: true, renderLabel: true },
            { action: new actions_1.Action('secondaryAction1', 'Secondary Action 1'), size: 50, visible: true, renderLabel: true },
            { action: new actions_1.Action('secondaryAction2', 'Secondary Action 2'), size: 50, visible: true, renderLabel: true },
        ];
        const defaultSecondaryActions = defaultSecondaryActionModels.map(action => action.action);
        setup(function () {
            defaultSecondaryActionModels.forEach(action => disposables.add(action.action));
        });
        test('should return empty primary and secondary actions when given empty initial actions', () => {
            const result = (0, notebookEditorToolbar_1.workbenchDynamicCalculateActions)([], [], 100);
            assert.deepEqual(result.primaryActions, []);
            assert.deepEqual(result.secondaryActions, []);
        });
        test('should return all primary actions as visiblewhen they fit within the container width', () => {
            const constainerSize = 200;
            const input = [
                { action: actionTemplate[0], size: 50, visible: true, renderLabel: true },
                { action: actionTemplate[1], size: 50, visible: true, renderLabel: true },
                { action: actionTemplate[2], size: 50, visible: true, renderLabel: true },
            ];
            const expected = [
                { action: actionTemplate[0], size: 50, visible: true, renderLabel: true },
                { action: actionTemplate[1], size: 50, visible: true, renderLabel: true },
                { action: actionTemplate[2], size: 50, visible: true, renderLabel: true },
            ];
            const result = (0, notebookEditorToolbar_1.workbenchDynamicCalculateActions)(input, defaultSecondaryActions, constainerSize);
            assert.deepEqual(result.primaryActions, expected);
            assert.deepEqual(result.secondaryActions, defaultSecondaryActions);
        });
        test('actions all within a group that cannot all fit, will all be icon only', () => {
            const containerSize = 150;
            const input = [
                { action: actionTemplate[0], size: 50, visible: true, renderLabel: true },
                { action: actionTemplate[1], size: 50, visible: true, renderLabel: true },
                { action: actionTemplate[2], size: 50, visible: true, renderLabel: true },
            ];
            const expected = [
                { action: actionTemplate[0], size: 50, visible: true, renderLabel: false },
                { action: actionTemplate[1], size: 50, visible: true, renderLabel: false },
                { action: actionTemplate[2], size: 50, visible: true, renderLabel: false },
            ];
            const result = (0, notebookEditorToolbar_1.workbenchDynamicCalculateActions)(input, defaultSecondaryActions, containerSize);
            assert.deepEqual(result.primaryActions, expected);
            assert.deepEqual(result.secondaryActions, [...defaultSecondaryActionModels].map(action => action.action));
        });
        test('should ignore second separator when two separators are in a row', () => {
            const containerSize = 200;
            const input = [
                { action: actionTemplate[0], size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: actionTemplate[1], size: 50, visible: true, renderLabel: true },
            ];
            const expected = [
                { action: actionTemplate[0], size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: actionTemplate[1], size: 50, visible: true, renderLabel: true },
            ];
            const result = (0, notebookEditorToolbar_1.workbenchDynamicCalculateActions)(input, defaultSecondaryActions, containerSize);
            assert.deepEqual(result.primaryActions, expected);
            assert.deepEqual(result.secondaryActions, defaultSecondaryActions);
        });
        test('check label visibility in different groupings', () => {
            const containerSize = 150;
            const actions = [
                { action: actionTemplate[0], size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: actionTemplate[1], size: 50, visible: true, renderLabel: true },
                { action: actionTemplate[2], size: 50, visible: true, renderLabel: true },
            ];
            const expectedOutputActions = [
                { action: actionTemplate[0], size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: actionTemplate[1], size: 50, visible: true, renderLabel: false },
                { action: actionTemplate[2], size: 50, visible: true, renderLabel: false },
            ];
            const result = (0, notebookEditorToolbar_1.workbenchDynamicCalculateActions)(actions, defaultSecondaryActions, containerSize);
            assert.deepEqual(result.primaryActions, expectedOutputActions);
            assert.deepEqual(result.secondaryActions, defaultSecondaryActions);
        });
        test('should ignore separators when they are at the end of the resulting primary actions', () => {
            const containerSize = 200;
            const input = [
                { action: actionTemplate[0], size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: actionTemplate[1], size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
            ];
            const expected = [
                { action: actionTemplate[0], size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: actionTemplate[1], size: 50, visible: true, renderLabel: true },
            ];
            const result = (0, notebookEditorToolbar_1.workbenchDynamicCalculateActions)(input, defaultSecondaryActions, containerSize);
            assert.deepEqual(result.primaryActions, expected);
            assert.deepEqual(result.secondaryActions, defaultSecondaryActions);
        });
        test('should keep actions with size 0 in primary actions', () => {
            const containerSize = 170;
            const input = [
                { action: actionTemplate[0], size: 50, visible: true, renderLabel: true },
                { action: actionTemplate[1], size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: actionTemplate[2], size: 50, visible: true, renderLabel: true },
                { action: actionTemplate[3], size: 0, visible: true, renderLabel: true },
            ];
            const expected = [
                { action: actionTemplate[0], size: 50, visible: true, renderLabel: true },
                { action: actionTemplate[1], size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: actionTemplate[2], size: 50, visible: true, renderLabel: false },
                { action: actionTemplate[3], size: 0, visible: true, renderLabel: false },
            ];
            const result = (0, notebookEditorToolbar_1.workbenchDynamicCalculateActions)(input, defaultSecondaryActions, containerSize);
            assert.deepEqual(result.primaryActions, expected);
            assert.deepEqual(result.secondaryActions, defaultSecondaryActions);
        });
        test('should not render separator if preceeded by size 0 action(s), but keep size 0 action in primary.', () => {
            const containerSize = 116;
            const input = [
                { action: actionTemplate[0], size: 0, visible: true, renderLabel: true }, // hidden
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true }, // sep
                { action: actionTemplate[1], size: 50, visible: true, renderLabel: true }, // visible
            ];
            const expected = [
                { action: actionTemplate[0], size: 0, visible: true, renderLabel: true }, // hidden
                { action: actionTemplate[1], size: 50, visible: true, renderLabel: true } // visible
            ];
            const result = (0, notebookEditorToolbar_1.workbenchDynamicCalculateActions)(input, defaultSecondaryActions, containerSize);
            assert.deepEqual(result.primaryActions, expected);
            assert.deepEqual(result.secondaryActions, defaultSecondaryActions);
        });
        test('should not render second separator if space between is hidden (size 0) actions.', () => {
            const containerSize = 300;
            const input = [
                { action: actionTemplate[0], size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: actionTemplate[1], size: 0, visible: true, renderLabel: true },
                { action: actionTemplate[2], size: 0, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: actionTemplate[3], size: 50, visible: true, renderLabel: true },
            ];
            const expected = [
                { action: actionTemplate[0], size: 50, visible: true, renderLabel: true },
                { action: new actions_1.Separator(), size: 1, visible: true, renderLabel: true },
                { action: actionTemplate[1], size: 0, visible: true, renderLabel: true },
                { action: actionTemplate[2], size: 0, visible: true, renderLabel: true },
                // remove separator here
                { action: actionTemplate[3], size: 50, visible: true, renderLabel: true },
            ];
            const result = (0, notebookEditorToolbar_1.workbenchDynamicCalculateActions)(input, defaultSecondaryActions, containerSize);
            assert.deepEqual(result.primaryActions, expected);
            assert.deepEqual(result.secondaryActions, defaultSecondaryActions);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tXb3JrYmVuY2hUb29sYmFyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL3Rlc3QvYnJvd3Nlci9ub3RlYm9va1dvcmtiZW5jaFRvb2xiYXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWNoRzs7Ozs7Ozs7O09BU0c7SUFDSCxLQUFLLENBQUMsOERBQThELEVBQUUsR0FBRyxFQUFFO1FBQzFFLE1BQU0sV0FBVyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUU5RCxNQUFNLDRCQUE0QixHQUFtQjtZQUNwRCxFQUFFLE1BQU0sRUFBRSxJQUFJLGdCQUFNLENBQUMsa0JBQWtCLEVBQUUsb0JBQW9CLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRTtZQUM1RyxFQUFFLE1BQU0sRUFBRSxJQUFJLGdCQUFNLENBQUMsa0JBQWtCLEVBQUUsb0JBQW9CLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRTtZQUM1RyxFQUFFLE1BQU0sRUFBRSxJQUFJLGdCQUFNLENBQUMsa0JBQWtCLEVBQUUsb0JBQW9CLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRTtTQUM1RyxDQUFDO1FBQ0YsTUFBTSx1QkFBdUIsR0FBYyw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckcsTUFBTSxTQUFTLEdBQWlCLEVBQUUsTUFBTSxFQUFFLElBQUks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