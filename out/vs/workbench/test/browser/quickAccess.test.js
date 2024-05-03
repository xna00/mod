/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/platform/registry/common/platform", "vs/platform/quickinput/common/quickAccess", "vs/platform/quickinput/common/quickInput", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/base/common/uri", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/browser/editorService", "vs/workbench/browser/quickaccess", "vs/editor/common/core/range"], function (require, exports, assert, platform_1, quickAccess_1, quickInput_1, workbenchTestServices_1, lifecycle_1, async_1, pickerQuickAccess_1, uri_1, editorGroupsService_1, editorService_1, editorService_2, quickaccess_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('QuickAccess', () => {
        let disposables;
        let instantiationService;
        let accessor;
        let providerDefaultCalled = false;
        let providerDefaultCanceled = false;
        let providerDefaultDisposed = false;
        let provider1Called = false;
        let provider1Canceled = false;
        let provider1Disposed = false;
        let provider2Called = false;
        let provider2Canceled = false;
        let provider2Disposed = false;
        let provider3Called = false;
        let provider3Canceled = false;
        let provider3Disposed = false;
        let TestProviderDefault = class TestProviderDefault {
            constructor(quickInputService, disposables) {
                this.quickInputService = quickInputService;
            }
            provide(picker, token) {
                assert.ok(picker);
                providerDefaultCalled = true;
                token.onCancellationRequested(() => providerDefaultCanceled = true);
                // bring up provider #3
                setTimeout(() => this.quickInputService.quickAccess.show(providerDescriptor3.prefix));
                return (0, lifecycle_1.toDisposable)(() => providerDefaultDisposed = true);
            }
        };
        TestProviderDefault = __decorate([
            __param(0, quickInput_1.IQuickInputService)
        ], TestProviderDefault);
        class TestProvider1 {
            provide(picker, token) {
                assert.ok(picker);
                provider1Called = true;
                token.onCancellationRequested(() => provider1Canceled = true);
                return (0, lifecycle_1.toDisposable)(() => provider1Disposed = true);
            }
        }
        class TestProvider2 {
            provide(picker, token) {
                assert.ok(picker);
                provider2Called = true;
                token.onCancellationRequested(() => provider2Canceled = true);
                return (0, lifecycle_1.toDisposable)(() => provider2Disposed = true);
            }
        }
        class TestProvider3 {
            provide(picker, token) {
                assert.ok(picker);
                provider3Called = true;
                token.onCancellationRequested(() => provider3Canceled = true);
                // hide without picking
                setTimeout(() => picker.hide());
                return (0, lifecycle_1.toDisposable)(() => provider3Disposed = true);
            }
        }
        const providerDescriptorDefault = { ctor: TestProviderDefault, prefix: '', helpEntries: [] };
        const providerDescriptor1 = { ctor: TestProvider1, prefix: 'test', helpEntries: [] };
        const providerDescriptor2 = { ctor: TestProvider2, prefix: 'test something', helpEntries: [] };
        const providerDescriptor3 = { ctor: TestProvider3, prefix: 'changed', helpEntries: [] };
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
        });
        teardown(() => {
            disposables.dispose();
        });
        test('registry', () => {
            const registry = (platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess));
            const restore = registry.clear();
            assert.ok(!registry.getQuickAccessProvider('test'));
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(registry.registerQuickAccessProvider(providerDescriptorDefault));
            assert(registry.getQuickAccessProvider('') === providerDescriptorDefault);
            assert(registry.getQuickAccessProvider('test') === providerDescriptorDefault);
            const disposable = disposables.add(registry.registerQuickAccessProvider(providerDescriptor1));
            assert(registry.getQuickAccessProvider('test') === providerDescriptor1);
            const providers = registry.getQuickAccessProviders();
            assert(providers.some(provider => provider.prefix === 'test'));
            disposable.dispose();
            assert(registry.getQuickAccessProvider('test') === providerDescriptorDefault);
            disposables.dispose();
            assert.ok(!registry.getQuickAccessProvider('test'));
            restore();
        });
        test('provider', async () => {
            const registry = (platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess));
            const restore = registry.clear();
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(registry.registerQuickAccessProvider(providerDescriptorDefault));
            disposables.add(registry.registerQuickAccessProvider(providerDescriptor1));
            disposables.add(registry.registerQuickAccessProvider(providerDescriptor2));
            disposables.add(registry.registerQuickAccessProvider(providerDescriptor3));
            accessor.quickInputService.quickAccess.show('test');
            assert.strictEqual(providerDefaultCalled, false);
            assert.strictEqual(provider1Called, true);
            assert.strictEqual(provider2Called, false);
            assert.strictEqual(provider3Called, false);
            assert.strictEqual(providerDefaultCanceled, false);
            assert.strictEqual(provider1Canceled, false);
            assert.strictEqual(provider2Canceled, false);
            assert.strictEqual(provider3Canceled, false);
            assert.strictEqual(providerDefaultDisposed, false);
            assert.strictEqual(provider1Disposed, false);
            assert.strictEqual(provider2Disposed, false);
            assert.strictEqual(provider3Disposed, false);
            provider1Called = false;
            accessor.quickInputService.quickAccess.show('test something');
            assert.strictEqual(providerDefaultCalled, false);
            assert.strictEqual(provider1Called, false);
            assert.strictEqual(provider2Called, true);
            assert.strictEqual(provider3Called, false);
            assert.strictEqual(providerDefaultCanceled, false);
            assert.strictEqual(provider1Canceled, true);
            assert.strictEqual(provider2Canceled, false);
            assert.strictEqual(provider3Canceled, false);
            assert.strictEqual(providerDefaultDisposed, false);
            assert.strictEqual(provider1Disposed, true);
            assert.strictEqual(provider2Disposed, false);
            assert.strictEqual(provider3Disposed, false);
            provider2Called = false;
            provider1Canceled = false;
            provider1Disposed = false;
            accessor.quickInputService.quickAccess.show('usedefault');
            assert.strictEqual(providerDefaultCalled, true);
            assert.strictEqual(provider1Called, false);
            assert.strictEqual(provider2Called, false);
            assert.strictEqual(provider3Called, false);
            assert.strictEqual(providerDefaultCanceled, false);
            assert.strictEqual(provider1Canceled, false);
            assert.strictEqual(provider2Canceled, true);
            assert.strictEqual(provider3Canceled, false);
            assert.strictEqual(providerDefaultDisposed, false);
            assert.strictEqual(provider1Disposed, false);
            assert.strictEqual(provider2Disposed, true);
            assert.strictEqual(provider3Disposed, false);
            await (0, async_1.timeout)(1);
            assert.strictEqual(providerDefaultCanceled, true);
            assert.strictEqual(providerDefaultDisposed, true);
            assert.strictEqual(provider3Called, true);
            await (0, async_1.timeout)(1);
            assert.strictEqual(provider3Canceled, true);
            assert.strictEqual(provider3Disposed, true);
            disposables.dispose();
            restore();
        });
        let fastProviderCalled = false;
        let slowProviderCalled = false;
        let fastAndSlowProviderCalled = false;
        let slowProviderCanceled = false;
        let fastAndSlowProviderCanceled = false;
        class FastTestQuickPickProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
            constructor() {
                super('fast');
            }
            _getPicks(filter, disposables, token) {
                fastProviderCalled = true;
                return [{ label: 'Fast Pick' }];
            }
        }
        class SlowTestQuickPickProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
            constructor() {
                super('slow');
            }
            async _getPicks(filter, disposables, token) {
                slowProviderCalled = true;
                await (0, async_1.timeout)(1);
                if (token.isCancellationRequested) {
                    slowProviderCanceled = true;
                }
                return [{ label: 'Slow Pick' }];
            }
        }
        class FastAndSlowTestQuickPickProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
            constructor() {
                super('bothFastAndSlow');
            }
            _getPicks(filter, disposables, token) {
                fastAndSlowProviderCalled = true;
                return {
                    picks: [{ label: 'Fast Pick' }],
                    additionalPicks: (async () => {
                        await (0, async_1.timeout)(1);
                        if (token.isCancellationRequested) {
                            fastAndSlowProviderCanceled = true;
                        }
                        return [{ label: 'Slow Pick' }];
                    })()
                };
            }
        }
        const fastProviderDescriptor = { ctor: FastTestQuickPickProvider, prefix: 'fast', helpEntries: [] };
        const slowProviderDescriptor = { ctor: SlowTestQuickPickProvider, prefix: 'slow', helpEntries: [] };
        const fastAndSlowProviderDescriptor = { ctor: FastAndSlowTestQuickPickProvider, prefix: 'bothFastAndSlow', helpEntries: [] };
        test('quick pick access - show()', async () => {
            const registry = (platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess));
            const restore = registry.clear();
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(registry.registerQuickAccessProvider(fastProviderDescriptor));
            disposables.add(registry.registerQuickAccessProvider(slowProviderDescriptor));
            disposables.add(registry.registerQuickAccessProvider(fastAndSlowProviderDescriptor));
            accessor.quickInputService.quickAccess.show('fast');
            assert.strictEqual(fastProviderCalled, true);
            assert.strictEqual(slowProviderCalled, false);
            assert.strictEqual(fastAndSlowProviderCalled, false);
            fastProviderCalled = false;
            accessor.quickInputService.quickAccess.show('slow');
            await (0, async_1.timeout)(2);
            assert.strictEqual(fastProviderCalled, false);
            assert.strictEqual(slowProviderCalled, true);
            assert.strictEqual(slowProviderCanceled, false);
            assert.strictEqual(fastAndSlowProviderCalled, false);
            slowProviderCalled = false;
            accessor.quickInputService.quickAccess.show('bothFastAndSlow');
            await (0, async_1.timeout)(2);
            assert.strictEqual(fastProviderCalled, false);
            assert.strictEqual(slowProviderCalled, false);
            assert.strictEqual(fastAndSlowProviderCalled, true);
            assert.strictEqual(fastAndSlowProviderCanceled, false);
            fastAndSlowProviderCalled = false;
            accessor.quickInputService.quickAccess.show('slow');
            accessor.quickInputService.quickAccess.show('bothFastAndSlow');
            accessor.quickInputService.quickAccess.show('fast');
            assert.strictEqual(fastProviderCalled, true);
            assert.strictEqual(slowProviderCalled, true);
            assert.strictEqual(fastAndSlowProviderCalled, true);
            await (0, async_1.timeout)(2);
            assert.strictEqual(slowProviderCanceled, true);
            assert.strictEqual(fastAndSlowProviderCanceled, true);
            disposables.dispose();
            restore();
        });
        test('quick pick access - pick()', async () => {
            const registry = (platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess));
            const restore = registry.clear();
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(registry.registerQuickAccessProvider(fastProviderDescriptor));
            const result = accessor.quickInputService.quickAccess.pick('fast');
            assert.strictEqual(fastProviderCalled, true);
            assert.ok(result instanceof Promise);
            disposables.dispose();
            restore();
        });
        test('PickerEditorState can properly restore editors', async () => {
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = disposables.add(instantiationService.createInstance(editorService_2.EditorService, undefined));
            instantiationService.stub(editorService_1.IEditorService, editorService);
            const editorViewState = disposables.add(instantiationService.createInstance(quickaccess_1.PickerEditorState));
            disposables.add(part);
            disposables.add(editorService);
            const input1 = {
                resource: uri_1.URI.parse('foo://bar1'),
                options: {
                    pinned: true, preserveFocus: true, selection: new range_1.Range(1, 0, 1, 3)
                }
            };
            const input2 = {
                resource: uri_1.URI.parse('foo://bar2'),
                options: {
                    pinned: true, selection: new range_1.Range(1, 0, 1, 3)
                }
            };
            const input3 = {
                resource: uri_1.URI.parse('foo://bar3')
            };
            const input4 = {
                resource: uri_1.URI.parse('foo://bar4')
            };
            const editor = await editorService.openEditor(input1);
            assert.strictEqual(editor, editorService.activeEditorPane);
            editorViewState.set();
            await editorService.openEditor(input2);
            await editorViewState.openTransientEditor(input3);
            await editorViewState.openTransientEditor(input4);
            await editorViewState.restore();
            assert.strictEqual(part.activeGroup.activeEditor?.resource, input1.resource);
            assert.deepStrictEqual(part.activeGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).map(e => e.resource), [input1.resource, input2.resource]);
            if (part.activeGroup.activeEditorPane?.getSelection) {
                assert.deepStrictEqual(part.activeGroup.activeEditorPane?.getSelection(), input1.options.selection);
            }
            await part.activeGroup.closeAllEditors();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tBY2Nlc3MudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3Rlc3QvYnJvd3Nlci9xdWlja0FjY2Vzcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBb0JoRyxLQUFLLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRTtRQUV6QixJQUFJLFdBQTRCLENBQUM7UUFDakMsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLFFBQTZCLENBQUM7UUFFbEMsSUFBSSxxQkFBcUIsR0FBRyxLQUFLLENBQUM7UUFDbEMsSUFBSSx1QkFBdUIsR0FBRyxLQUFLLENBQUM7UUFDcEMsSUFBSSx1QkFBdUIsR0FBRyxLQUFLLENBQUM7UUFFcEMsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO1FBQzVCLElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1FBQzlCLElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1FBRTlCLElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQztRQUM1QixJQUFJLGlCQUFpQixHQUFHLEtBQUssQ0FBQztRQUM5QixJQUFJLGlCQUFpQixHQUFHLEtBQUssQ0FBQztRQUU5QixJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUM7UUFDNUIsSUFBSSxpQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFDOUIsSUFBSSxpQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFFOUIsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBbUI7WUFFeEIsWUFBaUQsaUJBQXFDLEVBQUUsV0FBNEI7Z0JBQW5FLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFBa0MsQ0FBQztZQUV6SCxPQUFPLENBQUMsTUFBa0MsRUFBRSxLQUF3QjtnQkFDbkUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FB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