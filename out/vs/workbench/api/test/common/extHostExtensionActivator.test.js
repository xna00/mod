/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/api/common/extHostExtensionActivator", "vs/workbench/services/extensions/common/extensionDescriptionRegistry"], function (require, exports, assert, async_1, uri_1, extensions_1, log_1, extHostExtensionActivator_1, extensionDescriptionRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionsActivator', () => {
        const idA = new extensions_1.ExtensionIdentifier(`a`);
        const idB = new extensions_1.ExtensionIdentifier(`b`);
        const idC = new extensions_1.ExtensionIdentifier(`c`);
        test('calls activate only once with sequential activations', async () => {
            const host = new SimpleExtensionsActivatorHost();
            const activator = createActivator(host, [
                desc(idA)
            ]);
            await activator.activateByEvent('*', false);
            assert.deepStrictEqual(host.activateCalls, [idA]);
            await activator.activateByEvent('*', false);
            assert.deepStrictEqual(host.activateCalls, [idA]);
        });
        test('calls activate only once with parallel activations', async () => {
            const extActivation = new ExtensionActivationPromiseSource();
            const host = new PromiseExtensionsActivatorHost([
                [idA, extActivation]
            ]);
            const activator = createActivator(host, [
                desc(idA, [], ['evt1', 'evt2'])
            ]);
            const activate1 = activator.activateByEvent('evt1', false);
            const activate2 = activator.activateByEvent('evt2', false);
            extActivation.resolve();
            await activate1;
            await activate2;
            assert.deepStrictEqual(host.activateCalls, [idA]);
        });
        test('activates dependencies first', async () => {
            const extActivationA = new ExtensionActivationPromiseSource();
            const extActivationB = new ExtensionActivationPromiseSource();
            const host = new PromiseExtensionsActivatorHost([
                [idA, extActivationA],
                [idB, extActivationB]
            ]);
            const activator = createActivator(host, [
                desc(idA, [idB], ['evt1']),
                desc(idB, [], ['evt1']),
            ]);
            const activate = activator.activateByEvent('evt1', false);
            await (0, async_1.timeout)(0);
            assert.deepStrictEqual(host.activateCalls, [idB]);
            extActivationB.resolve();
            await (0, async_1.timeout)(0);
            assert.deepStrictEqual(host.activateCalls, [idB, idA]);
            extActivationA.resolve();
            await (0, async_1.timeout)(0);
            await activate;
            assert.deepStrictEqual(host.activateCalls, [idB, idA]);
        });
        test('Supports having resolved extensions', async () => {
            const host = new SimpleExtensionsActivatorHost();
            const bExt = desc(idB);
            delete bExt.main;
            delete bExt.browser;
            const activator = createActivator(host, [
                desc(idA, [idB])
            ], [bExt]);
            await activator.activateByEvent('*', false);
            assert.deepStrictEqual(host.activateCalls, [idA]);
        });
        test('Supports having external extensions', async () => {
            const extActivationA = new ExtensionActivationPromiseSource();
            const extActivationB = new ExtensionActivationPromiseSource();
            const host = new PromiseExtensionsActivatorHost([
                [idA, extActivationA],
                [idB, extActivationB]
            ]);
            const bExt = desc(idB);
            bExt.api = 'none';
            const activator = createActivator(host, [
                desc(idA, [idB])
            ], [bExt]);
            const activate = activator.activateByEvent('*', false);
            await (0, async_1.timeout)(0);
            assert.deepStrictEqual(host.activateCalls, [idB]);
            extActivationB.resolve();
            await (0, async_1.timeout)(0);
            assert.deepStrictEqual(host.activateCalls, [idB, idA]);
            extActivationA.resolve();
            await activate;
            assert.deepStrictEqual(host.activateCalls, [idB, idA]);
        });
        test('Error: activateById with missing extension', async () => {
            const host = new SimpleExtensionsActivatorHost();
            const activator = createActivator(host, [
                desc(idA),
                desc(idB),
            ]);
            let error = undefined;
            try {
                await activator.activateById(idC, { startup: false, extensionId: idC, activationEvent: 'none' });
            }
            catch (err) {
                error = err;
            }
            assert.strictEqual(typeof error === 'undefined', false);
        });
        test('Error: dependency missing', async () => {
            const host = new SimpleExtensionsActivatorHost();
            const activator = createActivator(host, [
                desc(idA, [idB]),
            ]);
            await activator.activateByEvent('*', false);
            assert.deepStrictEqual(host.errors.length, 1);
            assert.deepStrictEqual(host.errors[0][0], idA);
        });
        test('Error: dependency activation failed', async () => {
            const extActivationA = new ExtensionActivationPromiseSource();
            const extActivationB = new ExtensionActivationPromiseSource();
            const host = new PromiseExtensionsActivatorHost([
                [idA, extActivationA],
                [idB, extActivationB]
            ]);
            const activator = createActivator(host, [
                desc(idA, [idB]),
                desc(idB)
            ]);
            const activate = activator.activateByEvent('*', false);
            extActivationB.reject(new Error(`b fails!`));
            await activate;
            assert.deepStrictEqual(host.errors.length, 2);
            assert.deepStrictEqual(host.errors[0][0], idB);
            assert.deepStrictEqual(host.errors[1][0], idA);
        });
        test('issue #144518: Problem with git extension and vscode-icons', async () => {
            const extActivationA = new ExtensionActivationPromiseSource();
            const extActivationB = new ExtensionActivationPromiseSource();
            const extActivationC = new ExtensionActivationPromiseSource();
            const host = new PromiseExtensionsActivatorHost([
                [idA, extActivationA],
                [idB, extActivationB],
                [idC, extActivationC]
            ]);
            const activator = createActivator(host, [
                desc(idA, [idB]),
                desc(idB),
                desc(idC),
            ]);
            activator.activateByEvent('*', false);
            assert.deepStrictEqual(host.activateCalls, [idB, idC]);
            extActivationB.resolve();
            await (0, async_1.timeout)(0);
            assert.deepStrictEqual(host.activateCalls, [idB, idC, idA]);
            extActivationA.resolve();
        });
        class SimpleExtensionsActivatorHost {
            constructor() {
                this.activateCalls = [];
                this.errors = [];
            }
            onExtensionActivationError(extensionId, error, missingExtensionDependency) {
                this.errors.push([extensionId, error, missingExtensionDependency]);
            }
            actualActivateExtension(extensionId, reason) {
                this.activateCalls.push(extensionId);
                return Promise.resolve(new extHostExtensionActivator_1.EmptyExtension(extHostExtensionActivator_1.ExtensionActivationTimes.NONE));
            }
        }
        class PromiseExtensionsActivatorHost extends SimpleExtensionsActivatorHost {
            constructor(_promises) {
                super();
                this._promises = _promises;
            }
            actualActivateExtension(extensionId, reason) {
                this.activateCalls.push(extensionId);
                for (const [id, promiseSource] of this._promises) {
                    if (id.value === extensionId.value) {
                        return promiseSource.promise;
                    }
                }
                throw new Error(`Unexpected!`);
            }
        }
        class ExtensionActivationPromiseSource {
            constructor() {
                ({ promise: this.promise, resolve: this._resolve, reject: this._reject } = (0, async_1.promiseWithResolvers)());
            }
            resolve() {
                this._resolve(new extHostExtensionActivator_1.EmptyExtension(extHostExtensionActivator_1.ExtensionActivationTimes.NONE));
            }
            reject(err) {
                this._reject(err);
            }
        }
        const basicActivationEventsReader = {
            readActivationEvents: (extensionDescription) => {
                return extensionDescription.activationEvents ?? [];
            }
        };
        function createActivator(host, extensionDescriptions, otherHostExtensionDescriptions = []) {
            const registry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry(basicActivationEventsReader, extensionDescriptions);
            const globalRegistry = new extensionDescriptionRegistry_1.ExtensionDescriptionRegistry(basicActivationEventsReader, extensionDescriptions.concat(otherHostExtensionDescriptions));
            return new extHostExtensionActivator_1.ExtensionsActivator(registry, globalRegistry, host, new log_1.NullLogService());
        }
        function desc(id, deps = [], activationEvents = ['*']) {
            return {
                name: id.value,
                publisher: 'test',
                version: '0.0.0',
                engines: { vscode: '^1.0.0' },
                identifier: id,
                extensionLocation: uri_1.URI.parse(`nothing://nowhere`),
                isBuiltin: false,
                isUnderDevelopment: false,
                isUserBuiltin: false,
                activationEvents,
                main: 'index.js',
                targetPlatform: "undefined" /* TargetPlatform.UNDEFINED */,
                extensionDependencies: deps.map(d => d.value)
            };
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEV4dGVuc2lvbkFjdGl2YXRvci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvY29tbW9uL2V4dEhvc3RFeHRlbnNpb25BY3RpdmF0b3IudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyxLQUFLLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1FBRWpDLE1BQU0sR0FBRyxHQUFHLElBQUksZ0NBQW1CLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDekMsTUFBTSxHQUFHLEdBQUcsSUFBSSxnQ0FBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QyxNQUFNLEdBQUcsR0FBRyxJQUFJLGdDQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXpDLElBQUksQ0FBQyxzREFBc0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN2RSxNQUFNLElBQUksR0FBRyxJQUFJLDZCQUE2QixFQUFFLENBQUM7WUFDakQsTUFBTSxTQUFTLEdBQUcsZUFBZSxDQUFDLElBQUksRUFBRTtnQkFDdkMsSUFBSSxDQUFDLEdBQUcsQ0FBQzthQUNULENBQUMsQ0FBQztZQUVILE1BQU0sU0FBUyxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVsRCxNQUFNLFNBQVMsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMs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