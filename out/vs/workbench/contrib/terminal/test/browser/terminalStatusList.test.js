/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/codicons", "vs/base/common/severity", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/theme/common/iconRegistry", "vs/base/common/themables", "vs/workbench/contrib/terminal/browser/terminalStatusList", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, assert_1, codicons_1, severity_1, testConfigurationService_1, iconRegistry_1, themables_1, terminalStatusList_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function statusesEqual(list, expected) {
        (0, assert_1.deepStrictEqual)(list.statuses.map(e => [e.id, e.severity]), expected);
    }
    suite('Workbench - TerminalStatusList', () => {
        let store;
        let list;
        let configService;
        setup(() => {
            store = new lifecycle_1.DisposableStore();
            configService = new testConfigurationService_1.TestConfigurationService();
            list = store.add(new terminalStatusList_1.TerminalStatusList(configService));
        });
        teardown(() => store.dispose());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('primary', () => {
            (0, assert_1.strictEqual)(list.primary?.id, undefined);
            list.add({ id: 'info1', severity: severity_1.default.Info });
            (0, assert_1.strictEqual)(list.primary?.id, 'info1');
            list.add({ id: 'warning1', severity: severity_1.default.Warning });
            (0, assert_1.strictEqual)(list.primary?.id, 'warning1');
            list.add({ id: 'info2', severity: severity_1.default.Info });
            (0, assert_1.strictEqual)(list.primary?.id, 'warning1');
            list.add({ id: 'warning2', severity: severity_1.default.Warning });
            (0, assert_1.strictEqual)(list.primary?.id, 'warning2');
            list.add({ id: 'info3', severity: severity_1.default.Info });
            (0, assert_1.strictEqual)(list.primary?.id, 'warning2');
            list.add({ id: 'error1', severity: severity_1.default.Error });
            (0, assert_1.strictEqual)(list.primary?.id, 'error1');
            list.add({ id: 'warning3', severity: severity_1.default.Warning });
            (0, assert_1.strictEqual)(list.primary?.id, 'error1');
            list.add({ id: 'error2', severity: severity_1.default.Error });
            (0, assert_1.strictEqual)(list.primary?.id, 'error2');
            list.remove('error1');
            (0, assert_1.strictEqual)(list.primary?.id, 'error2');
            list.remove('error2');
            (0, assert_1.strictEqual)(list.primary?.id, 'warning3');
        });
        test('statuses', () => {
            (0, assert_1.strictEqual)(list.statuses.length, 0);
            list.add({ id: 'info', severity: severity_1.default.Info });
            list.add({ id: 'warning', severity: severity_1.default.Warning });
            list.add({ id: 'error', severity: severity_1.default.Error });
            (0, assert_1.strictEqual)(list.statuses.length, 3);
            statusesEqual(list, [
                ['info', severity_1.default.Info],
                ['warning', severity_1.default.Warning],
                ['error', severity_1.default.Error],
            ]);
            list.remove('info');
            list.remove('warning');
            list.remove('error');
            (0, assert_1.strictEqual)(list.statuses.length, 0);
        });
        test('onDidAddStatus', async () => {
            const result = await new Promise(r => {
                store.add(list.onDidAddStatus(r));
                list.add({ id: 'test', severity: severity_1.default.Info });
            });
            (0, assert_1.deepStrictEqual)(result, { id: 'test', severity: severity_1.default.Info });
        });
        test('onDidRemoveStatus', async () => {
            const result = await new Promise(r => {
                store.add(list.onDidRemoveStatus(r));
                list.add({ id: 'test', severity: severity_1.default.Info });
                list.remove('test');
            });
            (0, assert_1.deepStrictEqual)(result, { id: 'test', severity: severity_1.default.Info });
        });
        test('onDidChangePrimaryStatus', async () => {
            const result = await new Promise(r => {
                store.add(list.onDidChangePrimaryStatus(r));
                list.add({ id: 'test', severity: severity_1.default.Info });
            });
            (0, assert_1.deepStrictEqual)(result, { id: 'test', severity: severity_1.default.Info });
        });
        test('primary is not updated to status without an icon', async () => {
            list.add({ id: 'test', severity: severity_1.default.Info, icon: codicons_1.Codicon.check });
            list.add({ id: 'warning', severity: severity_1.default.Warning });
            (0, assert_1.deepStrictEqual)(list.primary, { id: 'test', severity: severity_1.default.Info, icon: codicons_1.Codicon.check });
        });
        test('add', () => {
            statusesEqual(list, []);
            list.add({ id: 'info', severity: severity_1.default.Info });
            statusesEqual(list, [
                ['info', severity_1.default.Info]
            ]);
            list.add({ id: 'warning', severity: severity_1.default.Warning });
            statusesEqual(list, [
                ['info', severity_1.default.Info],
                ['warning', severity_1.default.Warning]
            ]);
            list.add({ id: 'error', severity: severity_1.default.Error });
            statusesEqual(list, [
                ['info', severity_1.default.Info],
                ['warning', severity_1.default.Warning],
                ['error', severity_1.default.Error]
            ]);
        });
        test('add should remove animation', () => {
            statusesEqual(list, []);
            list.add({ id: 'info', severity: severity_1.default.Info, icon: iconRegistry_1.spinningLoading });
            statusesEqual(list, [
                ['info', severity_1.default.Info]
            ]);
            (0, assert_1.strictEqual)(list.statuses[0].icon.id, codicons_1.Codicon.play.id, 'loading~spin should be converted to play');
            list.add({ id: 'warning', severity: severity_1.default.Warning, icon: themables_1.ThemeIcon.modify(codicons_1.Codicon.zap, 'spin') });
            statusesEqual(list, [
                ['info', severity_1.default.Info],
                ['warning', severity_1.default.Warning]
            ]);
            (0, assert_1.strictEqual)(list.statuses[1].icon.id, codicons_1.Codicon.zap.id, 'zap~spin should have animation removed only');
        });
        test('add should fire onDidRemoveStatus if same status id with a different object reference was added', () => {
            const eventCalls = [];
            store.add(list.onDidAddStatus(() => eventCalls.push('add')));
            store.add(list.onDidRemoveStatus(() => eventCalls.push('remove')));
            list.add({ id: 'test', severity: severity_1.default.Info });
            list.add({ id: 'test', severity: severity_1.default.Info });
            (0, assert_1.deepStrictEqual)(eventCalls, [
                'add',
                'remove',
                'add'
            ]);
        });
        test('remove', () => {
            list.add({ id: 'info', severity: severity_1.default.Info });
            list.add({ id: 'warning', severity: severity_1.default.Warning });
            list.add({ id: 'error', severity: severity_1.default.Error });
            statusesEqual(list, [
                ['info', severity_1.default.Info],
                ['warning', severity_1.default.Warning],
                ['error', severity_1.default.Error]
            ]);
            list.remove('warning');
            statusesEqual(list, [
                ['info', severity_1.default.Info],
                ['error', severity_1.default.Error]
            ]);
            list.remove('info');
            statusesEqual(list, [
                ['error', severity_1.default.Error]
            ]);
            list.remove('error');
            statusesEqual(list, []);
        });
        test('toggle', () => {
            const status = { id: 'info', severity: severity_1.default.Info };
            list.toggle(status, true);
            statusesEqual(list, [
                ['info', severity_1.default.Info]
            ]);
            list.toggle(status, false);
            statusesEqual(list, []);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTdGF0dXNMaXN0LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL3Rlc3QvYnJvd3Nlci90ZXJtaW5hbFN0YXR1c0xpc3QudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxTQUFTLGFBQWEsQ0FBQyxJQUF3QixFQUFFLFFBQThCO1FBQzlFLElBQUEsd0JBQWUsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBRUQsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtRQUM1QyxJQUFJLEtBQXNCLENBQUM7UUFDM0IsSUFBSSxJQUF3QixDQUFDO1FBQzdCLElBQUksYUFBdUMsQ0FBQztRQUU1QyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsS0FBSyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzlCLGFBQWEsR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7WUFDL0MsSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBQ3pELENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBRWhDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtZQUNwQixJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGtCQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNuRCxJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLGtCQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN6RCxJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGtCQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNuRCxJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLGtCQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN6RCxJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGtCQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNuRCxJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLGtCQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNyRCxJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLGtCQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN6RCxJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLGtCQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNyRCxJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0QixJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0QixJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtZQUNyQixJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLGtCQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsa0JBQVEsQ0FBQyxP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