/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/telemetry/common/telemetry"], function (require, exports, assert, async_1, uri_1, mock_1, utils_1, configuration_1, testConfigurationService_1, contextKeyService_1, contextkey_1, serviceCollection_1, instantiationServiceMock_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ContextKeyService', () => {
        const testDisposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('updateParent', () => {
            const root = testDisposables.add(new contextKeyService_1.ContextKeyService(new testConfigurationService_1.TestConfigurationService()));
            const parent1 = testDisposables.add(root.createScoped(document.createElement('div')));
            const parent2 = testDisposables.add(root.createScoped(document.createElement('div')));
            const child = testDisposables.add(parent1.createScoped(document.createElement('div')));
            parent1.createKey('testA', 1);
            parent1.createKey('testB', 2);
            parent1.createKey('testD', 0);
            parent2.createKey('testA', 3);
            parent2.createKey('testC', 4);
            parent2.createKey('testD', 0);
            let complete;
            let reject;
            const p = new Promise((_complete, _reject) => {
                complete = _complete;
                reject = _reject;
            });
            testDisposables.add(child.onDidChangeContext(e => {
                try {
                    assert.ok(e.affectsSome(new Set(['testA'])), 'testA changed');
                    assert.ok(e.affectsSome(new Set(['testB'])), 'testB changed');
                    assert.ok(e.affectsSome(new Set(['testC'])), 'testC changed');
                    assert.ok(!e.affectsSome(new Set(['testD'])), 'testD did not change');
                    assert.strictEqual(child.getContextKeyValue('testA'), 3);
                    assert.strictEqual(child.getContextKeyValue('testB'), undefined);
                    assert.strictEqual(child.getContextKeyValue('testC'), 4);
                    assert.strictEqual(child.getContextKeyValue('testD'), 0);
                }
                catch (err) {
                    reject(err);
                    return;
                }
                complete();
            }));
            child.updateParent(parent2);
            return p;
        });
        test('updateParent to same service', () => {
            const root = testDisposables.add(new contextKeyService_1.ContextKeyService(new testConfigurationService_1.TestConfigurationService()));
            const parent1 = testDisposables.add(root.createScoped(document.createElement('div')));
            const child = testDisposables.add(parent1.createScoped(document.createElement('div')));
            parent1.createKey('testA', 1);
            parent1.createKey('testB', 2);
            parent1.createKey('testD', 0);
            let eventFired = false;
            testDisposables.add(child.onDidChangeContext(e => {
                eventFired = true;
            }));
            child.updateParent(parent1);
            assert.strictEqual(eventFired, false);
        });
        test('issue #147732: URIs as context values', () => {
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            const contextKeyService = testDisposables.add(new contextKeyService_1.ContextKeyService(configurationService));
            const instantiationService = testDisposables.add(new instantiationServiceMock_1.TestInstantiationService(new serviceCollection_1.ServiceCollection([configuration_1.IConfigurationService, configurationService], [contextkey_1.IContextKeyService, contextKeyService], [telemetry_1.ITelemetryService, new class extends (0, mock_1.mock)() {
                    async publicLog2() {
                        //
                    }
                }])));
            const uri = uri_1.URI.parse('test://abc');
            contextKeyService.createKey('notebookCellResource', undefined).set(uri.toString());
            instantiationService.invokeFunction(contextKeyService_1.setContext, 'jupyter.runByLineCells', JSON.parse(JSON.stringify([uri])));
            const expr = contextkey_1.ContextKeyExpr.in('notebookCellResource', 'jupyter.runByLineCells');
            assert.deepStrictEqual(contextKeyService.contextMatchesRules(expr), true);
        });
        test('suppress update event from parent when one key is overridden by child', () => {
            const root = testDisposables.add(new contextKeyService_1.ContextKeyService(new testConfigurationService_1.TestConfigurationService()));
            const child = testDisposables.add(root.createScoped(document.createElement('div')));
            root.createKey('testA', 1);
            child.createKey('testA', 4);
            let fired = false;
            const event = testDisposables.add(child.onDidChangeContext(e => fired = true));
            root.setContext('testA', 10);
            assert.strictEqual(fired, false, 'Should not fire event when overridden key is updated in parent');
            event.dispose();
        });
        test('suppress update event from parent when all keys are overridden by child', () => {
            const root = testDisposables.add(new contextKeyService_1.ContextKeyService(new testConfigurationService_1.TestConfigurationService()));
            const child = testDisposables.add(root.createScoped(document.createElement('div')));
            root.createKey('testA', 1);
            root.createKey('testB', 2);
            root.createKey('testC', 3);
            child.createKey('testA', 4);
            child.createKey('testB', 5);
            child.createKey('testD', 6);
            let fired = false;
            const event = testDisposables.add(child.onDidChangeContext(e => fired = true));
            root.bufferChangeEvents(() => {
                root.setContext('testA', 10);
                root.setContext('testB', 20);
                root.setContext('testD', 30);
            });
            assert.strictEqual(fired, false, 'Should not fire event when overridden key is updated in parent');
            event.dispose();
        });
        test('pass through update event from parent when one key is not overridden by child', () => {
            const root = testDisposables.add(new contextKeyService_1.ContextKeyService(new testConfigurationService_1.TestConfigurationService()));
            const child = testDisposables.add(root.createScoped(document.createElement('div')));
            root.createKey('testA', 1);
            root.createKey('testB', 2);
            root.createKey('testC', 3);
            child.createKey('testA', 4);
            child.createKey('testB', 5);
            child.createKey('testD', 6);
            const def = new async_1.DeferredPromise();
            testDisposables.add(child.onDidChangeContext(e => {
                try {
                    assert.ok(e.affectsSome(new Set(['testA'])), 'testA changed');
                    assert.ok(e.affectsSome(new Set(['testB'])), 'testB changed');
                    assert.ok(e.affectsSome(new Set(['testC'])), 'testC changed');
                }
                catch (err) {
                    def.error(err);
                    return;
                }
                def.complete(undefined);
            }));
            root.bufferChangeEvents(() => {
                root.setContext('testA', 10);
                root.setContext('testB', 20);
                root.setContext('testC', 30);
            });
            return def.p;
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dGtleS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9jb250ZXh0a2V5L3Rlc3QvYnJvd3Nlci9jb250ZXh0a2V5LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFlaEcsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUMvQixNQUFNLGVBQWUsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFbEUsSUFBSSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7WUFDekIsTUFBTSxJQUFJLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHFDQUFpQixDQUFDLElBQUksbURBQXdCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEYsTUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sT0FBTyxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0RixNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkYsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7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