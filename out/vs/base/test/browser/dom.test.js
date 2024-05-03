/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/async", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils"], function (require, exports, assert, dom_1, window_1, async_1, timeTravelScheduler_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('dom', () => {
        test('hasClass', () => {
            const element = document.createElement('div');
            element.className = 'foobar boo far';
            assert(element.classList.contains('foobar'));
            assert(element.classList.contains('boo'));
            assert(element.classList.contains('far'));
            assert(!element.classList.contains('bar'));
            assert(!element.classList.contains('foo'));
            assert(!element.classList.contains(''));
        });
        test('removeClass', () => {
            let element = document.createElement('div');
            element.className = 'foobar boo far';
            element.classList.remove('boo');
            assert(element.classList.contains('far'));
            assert(!element.classList.contains('boo'));
            assert(element.classList.contains('foobar'));
            assert.strictEqual(element.className, 'foobar far');
            element = document.createElement('div');
            element.className = 'foobar boo far';
            element.classList.remove('far');
            assert(!element.classList.contains('far'));
            assert(element.classList.contains('boo'));
            assert(element.classList.contains('foobar'));
            assert.strictEqual(element.className, 'foobar boo');
            element.classList.remove('boo');
            assert(!element.classList.contains('far'));
            assert(!element.classList.contains('boo'));
            assert(element.classList.contains('foobar'));
            assert.strictEqual(element.className, 'foobar');
            element.classList.remove('foobar');
            assert(!element.classList.contains('far'));
            assert(!element.classList.contains('boo'));
            assert(!element.classList.contains('foobar'));
            assert.strictEqual(element.className, '');
        });
        test('removeClass should consider hyphens', function () {
            const element = document.createElement('div');
            element.classList.add('foo-bar');
            element.classList.add('bar');
            assert(element.classList.contains('foo-bar'));
            assert(element.classList.contains('bar'));
            element.classList.remove('bar');
            assert(element.classList.contains('foo-bar'));
            assert(!element.classList.contains('bar'));
            element.classList.remove('foo-bar');
            assert(!element.classList.contains('foo-bar'));
            assert(!element.classList.contains('bar'));
        });
        test('multibyteAwareBtoa', () => {
            assert.ok((0, dom_1.multibyteAwareBtoa)('hello world').length > 0);
            assert.ok((0, dom_1.multibyteAwareBtoa)('平仮名').length > 0);
            assert.ok((0, dom_1.multibyteAwareBtoa)(new Array(100000).fill('vs').join('')).length > 0); // https://github.com/microsoft/vscode/issues/112013
        });
        suite('$', () => {
            test('should build simple nodes', () => {
                const div = (0, dom_1.$)('div');
                assert(div);
                assert(div instanceof HTMLElement);
                assert.strictEqual(div.tagName, 'DIV');
                assert(!div.firstChild);
            });
            test('should build nodes with id', () => {
                const div = (0, dom_1.$)('div#foo');
                assert(div);
                assert(div instanceof HTMLElement);
                assert.strictEqual(div.tagName, 'DIV');
                assert.strictEqual(div.id, 'foo');
            });
            test('should build nodes with class-name', () => {
                const div = (0, dom_1.$)('div.foo');
                assert(div);
                assert(div instanceof HTMLElement);
                assert.strictEqual(div.tagName, 'DIV');
                assert.strictEqual(div.className, 'foo');
            });
            test('should build nodes with attributes', () => {
                let div = (0, dom_1.$)('div', { class: 'test' });
                assert.strictEqual(div.className, 'test');
                div = (0, dom_1.$)('div', undefined);
                assert.strictEqual(div.className, '');
            });
            test('should build nodes with children', () => {
                let div = (0, dom_1.$)('div', undefined, (0, dom_1.$)('span', { id: 'demospan' }));
                const firstChild = div.firstChild;
                assert.strictEqual(firstChild.tagName, 'SPAN');
                assert.strictEqual(firstChild.id, 'demospan');
                div = (0, dom_1.$)('div', undefined, 'hello');
                assert.strictEqual(div.firstChild && div.firstChild.textContent, 'hello');
            });
            test('should build nodes with text children', () => {
                const div = (0, dom_1.$)('div', undefined, 'foobar');
                const firstChild = div.firstChild;
                assert.strictEqual(firstChild.tagName, undefined);
                assert.strictEqual(firstChild.textContent, 'foobar');
            });
        });
        suite('h', () => {
            test('should build simple nodes', () => {
                const div = (0, dom_1.h)('div');
                assert(div.root instanceof HTMLElement);
                assert.strictEqual(div.root.tagName, 'DIV');
                const span = (0, dom_1.h)('span');
                assert(span.root instanceof HTMLElement);
                assert.strictEqual(span.root.tagName, 'SPAN');
                const img = (0, dom_1.h)('img');
                assert(img.root instanceof HTMLElement);
                assert.strictEqual(img.root.tagName, 'IMG');
            });
            test('should handle ids and classes', () => {
                const divId = (0, dom_1.h)('div#myid');
                assert.strictEqual(divId.root.tagName, 'DIV');
                assert.strictEqual(divId.root.id, 'myid');
                const divClass = (0, dom_1.h)('div.a');
                assert.strictEqual(divClass.root.tagName, 'DIV');
                assert.strictEqual(divClass.root.classList.length, 1);
                assert(divClass.root.classList.contains('a'));
                const divClasses = (0, dom_1.h)('div.a.b.c');
                assert.strictEqual(divClasses.root.tagName, 'DIV');
                assert.strictEqual(divClasses.root.classList.length, 3);
                assert(divClasses.root.classList.contains('a'));
                assert(divClasses.root.classList.contains('b'));
                assert(divClasses.root.classList.contains('c'));
                const divAll = (0, dom_1.h)('div#myid.a.b.c');
                assert.strictEqual(divAll.root.tagName, 'DIV');
                assert.strictEqual(divAll.root.id, 'myid');
                assert.strictEqual(divAll.root.classList.length, 3);
                assert(divAll.root.classList.contains('a'));
                assert(divAll.root.classList.contains('b'));
                assert(divAll.root.classList.contains('c'));
                const spanId = (0, dom_1.h)('span#myid');
                assert.strictEqual(spanId.root.tagName, 'SPAN');
                assert.strictEqual(spanId.root.id, 'myid');
                const spanClass = (0, dom_1.h)('span.a');
                assert.strictEqual(spanClass.root.tagName, 'SPAN');
                assert.strictEqual(spanClass.root.classList.length, 1);
                assert(spanClass.root.classList.contains('a'));
                const spanClasses = (0, dom_1.h)('span.a.b.c');
                assert.strictEqual(spanClasses.root.tagName, 'SPAN');
                assert.strictEqual(spanClasses.root.classList.length, 3);
                assert(spanClasses.root.classList.contains('a'));
                assert(spanClasses.root.classList.contains('b'));
                assert(spanClasses.root.classList.contains('c'));
                const spanAll = (0, dom_1.h)('span#myid.a.b.c');
                assert.strictEqual(spanAll.root.tagName, 'SPAN');
                assert.strictEqual(spanAll.root.id, 'myid');
                assert.strictEqual(spanAll.root.classList.length, 3);
                assert(spanAll.root.classList.contains('a'));
                assert(spanAll.root.classList.contains('b'));
                assert(spanAll.root.classList.contains('c'));
            });
            test('should implicitly handle ids and classes', () => {
                const divId = (0, dom_1.h)('#myid');
                assert.strictEqual(divId.root.tagName, 'DIV');
                assert.strictEqual(divId.root.id, 'myid');
                const divClass = (0, dom_1.h)('.a');
                assert.strictEqual(divClass.root.tagName, 'DIV');
                assert.strictEqual(divClass.root.classList.length, 1);
                assert(divClass.root.classList.contains('a'));
                const divClasses = (0, dom_1.h)('.a.b.c');
                assert.strictEqual(divClasses.root.tagName, 'DIV');
                assert.strictEqual(divClasses.root.classList.length, 3);
                assert(divClasses.root.classList.contains('a'));
                assert(divClasses.root.classList.contains('b'));
                assert(divClasses.root.classList.contains('c'));
                const divAll = (0, dom_1.h)('#myid.a.b.c');
                assert.strictEqual(divAll.root.tagName, 'DIV');
                assert.strictEqual(divAll.root.id, 'myid');
                assert.strictEqual(divAll.root.classList.length, 3);
                assert(divAll.root.classList.contains('a'));
                assert(divAll.root.classList.contains('b'));
                assert(divAll.root.classList.contains('c'));
            });
            test('should handle @ identifiers', () => {
                const implicit = (0, dom_1.h)('@el');
                assert.strictEqual(implicit.root, implicit.el);
                assert.strictEqual(implicit.el.tagName, 'DIV');
                const explicit = (0, dom_1.h)('div@el');
                assert.strictEqual(explicit.root, explicit.el);
                assert.strictEqual(explicit.el.tagName, 'DIV');
                const implicitId = (0, dom_1.h)('#myid@el');
                assert.strictEqual(implicitId.root, implicitId.el);
                assert.strictEqual(implicitId.el.tagName, 'DIV');
                assert.strictEqual(implicitId.root.id, 'myid');
                const explicitId = (0, dom_1.h)('div#myid@el');
                assert.strictEqual(explicitId.root, explicitId.el);
                assert.strictEqual(explicitId.el.tagName, 'DIV');
                assert.strictEqual(explicitId.root.id, 'myid');
                const implicitClass = (0, dom_1.h)('.a@el');
                assert.strictEqual(implicitClass.root, implicitClass.el);
                assert.strictEqual(implicitClass.el.tagName, 'DIV');
                assert.strictEqual(implicitClass.root.classList.length, 1);
                assert(implicitClass.root.classList.contains('a'));
                const explicitClass = (0, dom_1.h)('div.a@el');
                assert.strictEqual(explicitClass.root, explicitClass.el);
                assert.strictEqual(explicitClass.el.tagName, 'DIV');
                assert.strictEqual(explicitClass.root.classList.length, 1);
                assert(explicitClass.root.classList.contains('a'));
            });
        });
        test('should recurse', () => {
            const result = (0, dom_1.h)('div.code-view', [
                (0, dom_1.h)('div.title@title'),
                (0, dom_1.h)('div.container', [
                    (0, dom_1.h)('div.gutter@gutterDiv'),
                    (0, dom_1.h)('span@editor'),
                ]),
            ]);
            assert.strictEqual(result.root.tagName, 'DIV');
            assert.strictEqual(result.root.className, 'code-view');
            assert.strictEqual(result.root.childElementCount, 2);
            assert.strictEqual(result.root.firstElementChild, result.title);
            assert.strictEqual(result.title.tagName, 'DIV');
            assert.strictEqual(result.title.className, 'title');
            assert.strictEqual(result.title.childElementCount, 0);
            assert.strictEqual(result.gutterDiv.tagName, 'DIV');
            assert.strictEqual(result.gutterDiv.className, 'gutter');
            assert.strictEqual(result.gutterDiv.childElementCount, 0);
            assert.strictEqual(result.editor.tagName, 'SPAN');
            assert.strictEqual(result.editor.className, '');
            assert.strictEqual(result.editor.childElementCount, 0);
        });
        test('cssValueWithDefault', () => {
            assert.strictEqual((0, dom_1.asCssValueWithDefault)('red', 'blue'), 'red');
            assert.strictEqual((0, dom_1.asCssValueWithDefault)(undefined, 'blue'), 'blue');
            assert.strictEqual((0, dom_1.asCssValueWithDefault)('var(--my-var)', 'blue'), 'var(--my-var, blue)');
            assert.strictEqual((0, dom_1.asCssValueWithDefault)('var(--my-var, red)', 'blue'), 'var(--my-var, red)');
            assert.strictEqual((0, dom_1.asCssValueWithDefault)('var(--my-var, var(--my-var2))', 'blue'), 'var(--my-var, var(--my-var2, blue))');
        });
        test('copyAttributes', () => {
            const elementSource = document.createElement('div');
            elementSource.setAttribute('foo', 'bar');
            elementSource.setAttribute('bar', 'foo');
            const elementTarget = document.createElement('div');
            (0, dom_1.copyAttributes)(elementSource, elementTarget);
            assert.strictEqual(elementTarget.getAttribute('foo'), 'bar');
            assert.strictEqual(elementTarget.getAttribute('bar'), 'foo');
        });
        test('trackAttributes (unfiltered)', async () => {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const elementSource = document.createElement('div');
                const elementTarget = document.createElement('div');
                const disposable = (0, dom_1.trackAttributes)(elementSource, elementTarget);
                elementSource.setAttribute('foo', 'bar');
                elementSource.setAttribute('bar', 'foo');
                await (0, async_1.timeout)(1);
                assert.strictEqual(elementTarget.getAttribute('foo'), 'bar');
                assert.strictEqual(elementTarget.getAttribute('bar'), 'foo');
                disposable.dispose();
            });
        });
        test('trackAttributes (filtered)', async () => {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const elementSource = document.createElement('div');
                const elementTarget = document.createElement('div');
                const disposable = (0, dom_1.trackAttributes)(elementSource, elementTarget, ['foo']);
                elementSource.setAttribute('foo', 'bar');
                elementSource.setAttribute('bar', 'foo');
                await (0, async_1.timeout)(1);
                assert.strictEqual(elementTarget.getAttribute('foo'), 'bar');
                assert.strictEqual(elementTarget.getAttribute('bar'), null);
                disposable.dispose();
            });
        });
        test('window utilities', () => {
            const windows = Array.from((0, dom_1.getWindows)());
            assert.strictEqual(windows.length, 1);
            assert.strictEqual((0, dom_1.getWindowsCount)(), 1);
            const windowId = (0, dom_1.getWindowId)(window_1.mainWindow);
            assert.ok(typeof windowId === 'number');
            assert.strictEqual((0, dom_1.getWindowById)(windowId)?.window, window_1.mainWindow);
            assert.strictEqual((0, dom_1.getWindowById)(undefined, true).window, window_1.mainWindow);
            assert.strictEqual((0, dom_1.hasWindow)(windowId), true);
            assert.strictEqual((0, window_1.isAuxiliaryWindow)(window_1.mainWindow), false);
            (0, window_1.ensureCodeWindow)(window_1.mainWindow, 1);
            assert.ok(typeof window_1.mainWindow.vscodeWindowId === 'number');
            const div = document.createElement('div');
            assert.strictEqual((0, dom_1.getWindow)(div), window_1.mainWindow);
            assert.strictEqual((0, dom_1.getDocument)(div), window_1.mainWindow.document);
            const event = document.createEvent('MouseEvent');
            assert.strictEqual((0, dom_1.getWindow)(event), window_1.mainWindow);
            assert.strictEqual((0, dom_1.getDocument)(event), window_1.mainWindow.document);
        });
        suite('disposableWindowInterval', () => {
            test('basics', async () => {
                let count = 0;
                const promise = new async_1.DeferredPromise();
                const interval = (0, dom_1.disposableWindowInterval)(window_1.mainWindow, () => {
                    count++;
                    if (count === 3) {
                        promise.complete(undefined);
                        return true;
                    }
                    else {
                        return false;
                    }
                }, 0, 10);
                await promise.p;
                assert.strictEqual(count, 3);
                interval.dispose();
            });
            test('iterations', async () => {
                let count = 0;
                const interval = (0, dom_1.disposableWindowInterval)(window_1.mainWindow, () => {
                    count++;
                    return false;
                }, 0, 0);
                await (0, async_1.timeout)(5);
                assert.strictEqual(count, 0);
                interval.dispose();
            });
            test('dispose', async () => {
                let count = 0;
                const interval = (0, dom_1.disposableWindowInterval)(window_1.mainWindow, () => {
                    count++;
                    return false;
                }, 0, 10);
                interval.dispose();
                await (0, async_1.timeout)(5);
                assert.strictEqual(count, 0);
            });
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9icm93c2VyL2RvbS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO1FBQ2pCLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO1lBRXJCLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQztZQUVyQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1lBRXhCLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQztZQUVyQyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUVwRCxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4QyxPQUFPLENBQUMsU0FBUyxHQUFHLGdCQUFnQixDQUFDO1lBRXJDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBRXBELE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFaEQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFDQUFxQyxFQUFFO1lBQzNDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFOUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDakMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFN0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFMUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxT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