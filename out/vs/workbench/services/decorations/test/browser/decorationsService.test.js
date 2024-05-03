/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/services/decorations/browser/decorationsService", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/resources", "vs/base/test/common/mock", "vs/platform/theme/test/common/testThemeService", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils"], function (require, exports, assert, decorationsService_1, uri_1, event_1, resources, mock_1, testThemeService_1, timeTravelScheduler_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('DecorationsService', function () {
        let service;
        setup(function () {
            service = new decorationsService_1.DecorationsService(new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.extUri = resources.extUri;
                }
            }, new testThemeService_1.TestThemeService());
        });
        teardown(function () {
            service.dispose();
        });
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Async provider, async/evented result', function () {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({}, async function () {
                const uri = uri_1.URI.parse('foo:bar');
                let callCounter = 0;
                const reg = service.registerDecorationsProvider(new class {
                    constructor() {
                        this.label = 'Test';
                        this.onDidChange = event_1.Event.None;
                    }
                    provideDecorations(uri) {
                        callCounter += 1;
                        return new Promise(resolve => {
                            setTimeout(() => resolve({
                                color: 'someBlue',
                                tooltip: 'T',
                                strikethrough: true
                            }));
                        });
                    }
                });
                // trigger -> async
                assert.strictEqual(service.getDecoration(uri, false), undefined);
                assert.strictEqual(callCounter, 1);
                // event when result is computed
                const e = await event_1.Event.toPromise(service.onDidChangeDecorations);
                assert.strictEqual(e.affectsResource(uri), true);
                // sync result
                assert.deepStrictEqual(service.getDecoration(uri, false).tooltip, 'T');
                assert.deepStrictEqual(service.getDecoration(uri, false).strikethrough, true);
                assert.strictEqual(callCounter, 1);
                reg.dispose();
            });
        });
        test('Sync provider, sync result', function () {
            const uri = uri_1.URI.parse('foo:bar');
            let callCounter = 0;
            const reg = service.registerDecorationsProvider(new class {
                constructor() {
                    this.label = 'Test';
                    this.onDidChange = event_1.Event.None;
                }
                provideDecorations(uri) {
                    callCounter += 1;
                    return { color: 'someBlue', tooltip: 'Z' };
                }
            });
            // trigger -> sync
            assert.deepStrictEqual(service.getDecoration(uri, false).tooltip, 'Z');
            assert.deepStrictEqual(service.getDecoration(uri, false).strikethrough, false);
            assert.strictEqual(callCounter, 1);
            reg.dispose();
        });
        test('Clear decorations on provider dispose', async function () {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({}, async function () {
                const uri = uri_1.URI.parse('foo:bar');
                let callCounter = 0;
                const reg = service.registerDecorationsProvider(new class {
                    constructor() {
                        this.label = 'Test';
                        this.onDidChange = event_1.Event.None;
                    }
                    provideDecorations(uri) {
                        callCounter += 1;
                        return { color: 'someBlue', tooltip: 'J' };
                    }
                });
                // trigger -> sync
                assert.deepStrictEqual(service.getDecoration(uri, false).tooltip, 'J');
                assert.strictEqual(callCounter, 1);
                // un-register -> ensure good event
                let didSeeEvent = false;
                const p = new Promise(resolve => {
                    const l = service.onDidChangeDecorations(e => {
                        assert.strictEqual(e.affectsResource(uri), true);
                        assert.deepStrictEqual(service.getDecoration(uri, false), undefined);
                        assert.strictEqual(callCounter, 1);
                        didSeeEvent = true;
                        l.dispose();
                        resolve();
                    });
                });
                reg.dispose(); // will clear all data
                await p;
                assert.strictEqual(didSeeEvent, true);
            });
        });
        test('No default bubbling', function () {
            let reg = service.registerDecorationsProvider({
                label: 'Test',
                onDidChange: event_1.Event.None,
                provideDecorations(uri) {
                    return uri.path.match(/\.txt/)
                        ? { tooltip: '.txt', weight: 17 }
                        : undefined;
                }
            });
            const childUri = uri_1.URI.parse('file:///some/path/some/file.txt');
            let deco = service.getDecoration(childUri, false);
            assert.strictEqual(deco.tooltip, '.txt');
            deco = service.getDecoration(childUri.with({ path: 'some/path/' }), true);
            assert.strictEqual(deco, undefined);
            reg.dispose();
            // bubble
            reg = service.registerDecorationsProvider({
                label: 'Test',
                onDidChange: event_1.Event.None,
                provideDecorations(uri) {
                    return uri.path.match(/\.txt/)
                        ? { tooltip: '.txt.bubble', weight: 71, bubble: true }
                        : undefined;
                }
            });
            deco = service.getDecoration(childUri, false);
            assert.strictEqual(deco.tooltip, '.txt.bubble');
            deco = service.getDecoration(childUri.with({ path: 'some/path/' }), true);
            assert.strictEqual(typeof deco.tooltip, 'string');
            reg.dispose();
        });
        test('Decorations not showing up for second root folder #48502', async function () {
            let cancelCount = 0;
            let callCount = 0;
            const provider = new class {
                constructor() {
                    this._onDidChange = new event_1.Emitter();
                    this.onDidChange = this._onDidChange.event;
                    this.label = 'foo';
                }
                provideDecorations(uri, token) {
                    store.add(token.onCancellationRequested(() => {
                        cancelCount += 1;
                    }));
                    return new Promise(resolve => {
                        callCount += 1;
                        setTimeout(() => {
                            resolve({ letter: 'foo' });
                        }, 10);
                    });
                }
            };
            const reg = service.registerDecorationsProvider(provider);
            const uri = uri_1.URI.parse('foo://bar');
            const d1 = service.getDecoration(uri, false);
            provider._onDidChange.fire([uri]);
            const d2 = service.getDecoration(uri, false);
            assert.strictEqual(cancelCount, 1);
            assert.strictEqual(callCount, 2);
            d1?.dispose();
            d2?.dispose();
            reg.dispose();
        });
        test('Decorations not bubbling... #48745', function () {
            const reg = service.registerDecorationsProvider({
                label: 'Test',
                onDidChange: event_1.Event.None,
                provideDecorations(uri) {
                    if (uri.path.match(/hello$/)) {
                        return { tooltip: 'FOO', weight: 17, bubble: true };
                    }
                    else {
                        return new Promise(_resolve => { });
                    }
                }
            });
            const data1 = service.getDecoration(uri_1.URI.parse('a:b/'), true);
            assert.ok(!data1);
            const data2 = service.getDecoration(uri_1.URI.parse('a:b/c.hello'), false);
            assert.ok(data2.tooltip);
            const data3 = service.getDecoration(uri_1.URI.parse('a:b/'), true);
            assert.ok(data3);
            reg.dispose();
        });
        test('Folder decorations don\'t go away when file with problems is deleted #61919 (part1)', function () {
            const emitter = new event_1.Emitter();
            let gone = false;
            const reg = service.registerDecorationsProvider({
                label: 'Test',
                onDidChange: emitter.event,
                provideDecorations(uri) {
                    if (!gone && uri.path.match(/file.ts$/)) {
                        return { tooltip: 'FOO', weight: 17, bubble: true };
                    }
                    return undefined;
                }
            });
            const uri = uri_1.URI.parse('foo:/folder/file.ts');
            const uri2 = uri_1.URI.parse('foo:/folder/');
            let data = service.getDecoration(uri, true);
            assert.strictEqual(data.tooltip, 'FOO');
            data = service.getDecoration(uri2, true);
            assert.ok(data.tooltip); // emphazied items...
            gone = true;
            emitter.fire([uri]);
            data = service.getDecoration(uri, true);
            assert.strictEqual(data, undefined);
            data = service.getDecoration(uri2, true);
            assert.strictEqual(data, undefined);
            reg.dispose();
        });
        test('Folder decorations don\'t go away when file with problems is deleted #61919 (part2)', function () {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({}, async function () {
                const emitter = new event_1.Emitter();
                let gone = false;
                const reg = service.registerDecorationsProvider({
                    label: 'Test',
                    onDidChange: emitter.event,
                    provideDecorations(uri) {
                        if (!gone && uri.path.match(/file.ts$/)) {
                            return { tooltip: 'FOO', weight: 17, bubble: true };
                        }
                        return undefined;
                    }
                });
                const uri = uri_1.URI.parse('foo:/folder/file.ts');
                const uri2 = uri_1.URI.parse('foo:/folder/');
                let data = service.getDecoration(uri, true);
                assert.strictEqual(data.tooltip, 'FOO');
                data = service.getDecoration(uri2, true);
                assert.ok(data.tooltip); // emphazied items...
                return new Promise((resolve, reject) => {
                    const l = service.onDidChangeDecorations(e => {
                        l.dispose();
                        try {
                            assert.ok(e.affectsResource(uri));
                            assert.ok(e.affectsResource(uri2));
                            resolve();
                            reg.dispose();
                        }
                        catch (err) {
                            reject(err);
                            reg.dispose();
                        }
                    });
                    gone = true;
                    emitter.fire([uri]);
                });
            });
        });
        test('FileDecorationProvider intermittently fails #133210', async function () {
            const invokeOrder = [];
            store.add(service.registerDecorationsProvider(new class {
                constructor() {
                    this.label = 'Provider-1';
                    this.onDidChange = event_1.Event.None;
                }
                provideDecorations() {
                    invokeOrder.push(this.label);
                    return undefined;
                }
            }));
            store.add(service.registerDecorationsProvider(new class {
                constructor() {
                    this.label = 'Provider-2';
                    this.onDidChange = event_1.Event.None;
                }
                provideDecorations() {
                    invokeOrder.push(this.label);
                    return undefined;
                }
            }));
            service.getDecoration(uri_1.URI.parse('test://me/path'), false);
            assert.deepStrictEqual(invokeOrder, ['Provider-2', 'Provider-1']);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGlvbnNTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9kZWNvcmF0aW9ucy90ZXN0L2Jyb3dzZXIvZGVjb3JhdGlvbnNTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFlaEcsS0FBSyxDQUFDLG9CQUFvQixFQUFFO1FBRTNCLElBQUksT0FBMkIsQ0FBQztRQUVoQyxLQUFLLENBQUM7WUFDTCxPQUFPLEdBQUcsSUFBSSx1Q0FBa0IsQ0FDL0IsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQXVCO2dCQUF6Qzs7b0JBQ00sV0FBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7Z0JBQ3BDLENBQUM7YUFBQSxFQUNELElBQUksbUNBQWdCLEVBQUUsQ0FDdEIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDO1lBQ1IsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBR3hELElBQUksQ0FBQyxzQ0FBc0MsRUFBRTtZQUU1QyxPQUFPLElBQUEsd0NBQWtCLEVBQUMsRUFBRSxFQUFFLEtBQUs7Z0JBRWxDLE1BQU0sR0FBRyxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2pDLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztnQkFFcEIsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLDJCQUEyQixDQUFDLElBQUk7b0JBQUE7d0JBQzFDLFVBQUssR0FBVyxNQUFNLENBQUM7d0JBQ3ZCLGdCQUFXLEdBQTBCLGFBQUssQ0FBQyxJQUFJLENBQUM7b0JBVzFELENBQUM7b0JBVkEs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