/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/dom", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/platform", "vs/base/test/common/utils", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/workbench/contrib/debug/browser/linkDetector", "vs/workbench/contrib/debug/browser/statusbarColorProvider", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/test/browser/callStack.test", "vs/workbench/contrib/debug/test/browser/mockDebugModel", "vs/workbench/contrib/debug/test/common/mockDebug", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, dom, highlightedLabel_1, platform_1, utils_1, baseDebugView_1, linkDetector_1, statusbarColorProvider_1, debugModel_1, callStack_test_1, mockDebugModel_1, mockDebug_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    suite('Debug - Base Debug View', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let linkDetector;
        /**
         * Instantiate services for use by the functions being tested.
         */
        setup(() => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            linkDetector = instantiationService.createInstance(linkDetector_1.LinkDetector);
        });
        test('render view tree', () => {
            const container = $('.container');
            const treeContainer = (0, baseDebugView_1.renderViewTree)(container);
            assert.strictEqual(treeContainer.className, 'debug-view-content');
            assert.strictEqual(container.childElementCount, 1);
            assert.strictEqual(container.firstChild, treeContainer);
            assert.strictEqual(treeContainer instanceof HTMLDivElement, true);
        });
        test('render expression value', () => {
            let container = $('.container');
            (0, baseDebugView_1.renderExpressionValue)('render \n me', container, { showHover: true });
            assert.strictEqual(container.className, 'value');
            assert.strictEqual(container.title, 'render \n me');
            assert.strictEqual(container.textContent, 'render \n me');
            const expression = new debugModel_1.Expression('console');
            expression.value = 'Object';
            container = $('.container');
            (0, baseDebugView_1.renderExpressionValue)(expression, container, { colorize: true });
            assert.strictEqual(container.className, 'value unavailable error');
            expression.available = true;
            expression.value = '"string value"';
            container = $('.container');
            (0, baseDebugView_1.renderExpressionValue)(expression, container, { colorize: true, linkDetector });
            assert.strictEqual(container.className, 'value string');
            assert.strictEqual(container.textContent, '"string value"');
            expression.type = 'boolean';
            container = $('.container');
            (0, baseDebugView_1.renderExpressionValue)(expression, container, { colorize: true });
            assert.strictEqual(container.className, 'value boolean');
            assert.strictEqual(container.textContent, expression.value);
            expression.value = 'this is a long string';
            container = $('.container');
            (0, baseDebugView_1.renderExpressionValue)(expression, container, { colorize: true, maxValueLength: 4, linkDetector });
            assert.strictEqual(container.textContent, 'this...');
            expression.value = platform_1.isWindows ? 'C:\\foo.js:5' : '/foo.js:5';
            container = $('.container');
            (0, baseDebugView_1.renderExpressionValue)(expression, container, { colorize: true, linkDetector });
            assert.ok(container.querySelector('a'));
            assert.strictEqual(container.querySelector('a').textContent, expression.value);
        });
        test('render variable', () => {
            const session = new mockDebug_1.MockSession();
            const thread = new debugModel_1.Thread(session, 'mockthread', 1);
            const stackFrame = new debugModel_1.StackFrame(thread, 1, null, 'app.js', 'normal', { startLineNumber: 1, startColumn: 1, endLineNumber: undefined, endColumn: undefined }, 0, true);
            const scope = new debugModel_1.Scope(stackFrame, 1, 'local', 1, false, 10, 10);
            let variable = new debugModel_1.Variable(session, 1, scope, 2, 'foo', 'bar.foo', undefined, 0, 0, undefined, {}, 'string');
            let expression = $('.');
            let name = $('.');
            let value = $('.');
            const label = new highlightedLabel_1.HighlightedLabel(name);
            const lazyButton = $('.');
            (0, baseDebugView_1.renderVariable)(variable, { expression, name, value, label, lazyButton }, false, []);
            assert.strictEqual(label.element.textContent, 'foo');
            assert.strictEqual(value.textContent, '');
            assert.strictEqual(value.title, '');
            variable.value = 'hey';
            expression = $('.');
            name = $('.');
            value = $('.');
            (0, baseDebugView_1.renderVariable)(variable, { expression, name, value, label, lazyButton }, false, [], linkDetector);
            assert.strictEqual(value.textContent, 'hey');
            assert.strictEqual(label.element.textContent, 'foo:');
            variable.value = platform_1.isWindows ? 'C:\\foo.js:5' : '/foo.js:5';
            expression = $('.');
            name = $('.');
            value = $('.');
            (0, baseDebugView_1.renderVariable)(variable, { expression, name, value, label, lazyButton }, false, [], linkDetector);
            assert.ok(value.querySelector('a'));
            assert.strictEqual(value.querySelector('a').textContent, variable.value);
            variable = new debugModel_1.Variable(session, 1, scope, 2, 'console', 'console', '5', 0, 0, undefined, { kind: 'virtual' });
            expression = $('.');
            name = $('.');
            value = $('.');
            (0, baseDebugView_1.renderVariable)(variable, { expression, name, value, label, lazyButton }, false, [], linkDetector);
            assert.strictEqual(name.className, 'virtual');
            assert.strictEqual(label.element.textContent, 'console:');
            assert.strictEqual(value.className, 'value number');
            label.dispose();
        });
        test('statusbar in debug mode', () => {
            const model = (0, mockDebugModel_1.createMockDebugModel)(disposables);
            const session = disposables.add((0, callStack_test_1.createTestSession)(model));
            const session2 = disposables.add((0, callStack_test_1.createTestSession)(model, undefined, { suppressDebugStatusbar: true }));
            assert.strictEqual((0, statusbarColorProvider_1.isStatusbarInDebugMode)(0 /* State.Inactive */, []), false);
            assert.strictEqual((0, statusbarColorProvider_1.isStatusbarInDebugMode)(1 /* State.Initializing */, [session]), false);
            assert.strictEqual((0, statusbarColorProvider_1.isStatusbarInDebugMode)(3 /* State.Running */, [session]), true);
            assert.strictEqual((0, statusbarColorProvider_1.isStatusbarInDebugMode)(2 /* State.Stopped */, [session]), true);
            assert.strictEqual((0, statusbarColorProvider_1.isStatusbarInDebugMode)(3 /* State.Running */, [session2]), false);
            assert.strictEqual((0, statusbarColorProvider_1.isStatusbarInDebugMode)(3 /* State.Running */, [session, session2]), true);
            session.configuration.noDebug = true;
            assert.strictEqual((0, statusbarColorProvider_1.isStatusbarInDebugMode)(3 /* State.Running */, [session]), false);
            assert.strictEqual((0, statusbarColorProvider_1.isStatusbarInDebugMode)(3 /* State.Running */, [session, session2]), false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZURlYnVnVmlldy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy90ZXN0L2Jyb3dzZXIvYmFzZURlYnVnVmlldy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBaUJoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWhCLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7UUFDckMsTUFBTSxXQUFXLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQzlELElBQUksWUFBMEIsQ0FBQztRQUUvQjs7V0FFRztRQUNILEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixNQUFNLG9CQUFvQixHQUF1RCxJQUFBLHFEQUE2QixFQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN2SSxZQUFZLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJCQUFZLENBQUMsQ0FBQztRQUNsRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7WUFDN0IsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sYUFBYSxHQUFHLElBQUEsOEJBQWMsRUFBQyxTQUFTLENBQUMsQ0FBQztZQUVoRCxNQUFNLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FB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