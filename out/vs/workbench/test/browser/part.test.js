/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/browser/part", "vs/base/common/types", "vs/platform/theme/test/common/testThemeService", "vs/base/browser/dom", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/base/test/common/utils", "vs/base/common/lifecycle", "vs/base/browser/window"], function (require, exports, assert, part_1, types_1, testThemeService_1, dom_1, workbenchTestServices_1, workbenchTestServices_2, utils_1, lifecycle_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench parts', () => {
        const disposables = new lifecycle_1.DisposableStore();
        class SimplePart extends part_1.Part {
            constructor() {
                super(...arguments);
                this.minimumWidth = 50;
                this.maximumWidth = 50;
                this.minimumHeight = 50;
                this.maximumHeight = 50;
            }
            layout(width, height) {
                throw new Error('Method not implemented.');
            }
            toJSON() {
                throw new Error('Method not implemented.');
            }
        }
        class MyPart extends SimplePart {
            constructor(expectedParent) {
                super('myPart', { hasTitle: true }, new testThemeService_1.TestThemeService(), disposables.add(new workbenchTestServices_2.TestStorageService()), new workbenchTestServices_1.TestLayoutService());
                this.expectedParent = expectedParent;
            }
            createTitleArea(parent) {
                assert.strictEqual(parent, this.expectedParent);
                return super.createTitleArea(parent);
            }
            createContentArea(parent) {
                assert.strictEqual(parent, this.expectedParent);
                return super.createContentArea(parent);
            }
            testGetMemento(scope, target) {
                return super.getMemento(scope, target);
            }
            testSaveState() {
                return super.saveState();
            }
        }
        class MyPart2 extends SimplePart {
            constructor() {
                super('myPart2', { hasTitle: true }, new testThemeService_1.TestThemeService(), disposables.add(new workbenchTestServices_2.TestStorageService()), new workbenchTestServices_1.TestLayoutService());
            }
            createTitleArea(parent) {
                const titleContainer = (0, dom_1.append)(parent, (0, dom_1.$)('div'));
                const titleLabel = (0, dom_1.append)(titleContainer, (0, dom_1.$)('span'));
                titleLabel.id = 'myPart.title';
                titleLabel.innerText = 'Title';
                return titleContainer;
            }
            createContentArea(parent) {
                const contentContainer = (0, dom_1.append)(parent, (0, dom_1.$)('div'));
                const contentSpan = (0, dom_1.append)(contentContainer, (0, dom_1.$)('span'));
                contentSpan.id = 'myPart.content';
                contentSpan.innerText = 'Content';
                return contentContainer;
            }
        }
        class MyPart3 extends SimplePart {
            constructor() {
                super('myPart2', { hasTitle: false }, new testThemeService_1.TestThemeService(), disposables.add(new workbenchTestServices_2.TestStorageService()), new workbenchTestServices_1.TestLayoutService());
            }
            createTitleArea(parent) {
                return null;
            }
            createContentArea(parent) {
                const contentContainer = (0, dom_1.append)(parent, (0, dom_1.$)('div'));
                const contentSpan = (0, dom_1.append)(contentContainer, (0, dom_1.$)('span'));
                contentSpan.id = 'myPart.content';
                contentSpan.innerText = 'Content';
                return contentContainer;
            }
        }
        let fixture;
        const fixtureId = 'workbench-part-fixture';
        setup(() => {
            fixture = document.createElement('div');
            fixture.id = fixtureId;
            window_1.mainWindow.document.body.appendChild(fixture);
        });
        teardown(() => {
            window_1.mainWindow.document.body.removeChild(fixture);
            disposables.clear();
        });
        test('Creation', () => {
            const b = document.createElement('div');
            window_1.mainWindow.document.getElementById(fixtureId).appendChild(b);
            (0, dom_1.hide)(b);
            let part = disposables.add(new MyPart(b));
            part.create(b);
            assert.strictEqual(part.getId(), 'myPart');
            // Memento
            let memento = part.testGetMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert(memento);
            memento.foo = 'bar';
            memento.bar = [1, 2, 3];
            part.testSaveState();
            // Re-Create to assert memento contents
            part = disposables.add(new MyPart(b));
            memento = part.testGetMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert(memento);
            assert.strictEqual(memento.foo, 'bar');
            assert.strictEqual(memento.bar.length, 3);
            // Empty Memento stores empty object
            delete memento.foo;
            delete memento.bar;
            part.testSaveState();
            part = disposables.add(new MyPart(b));
            memento = part.testGetMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            assert(memento);
            assert.strictEqual((0, types_1.isEmptyObject)(memento), true);
        });
        test('Part Layout with Title and Content', function () {
            const b = document.createElement('div');
            window_1.mainWindow.document.getElementById(fixtureId).appendChild(b);
            (0, dom_1.hide)(b);
            const part = disposables.add(new MyPart2());
            part.create(b);
            assert(window_1.mainWindow.document.getElementById('myPart.title'));
            assert(window_1.mainWindow.document.getElementById('myPart.content'));
        });
        test('Part Layout with Content only', function () {
            const b = document.createElement('div');
            window_1.mainWindow.document.getElementById(fixtureId).appendChild(b);
            (0, dom_1.hide)(b);
            const part = disposables.add(new MyPart3());
            part.create(b);
            assert(!window_1.mainWindow.document.getElementById('myPart.title'));
            assert(window_1.mainWindow.document.getElementById('myPart.content'));
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9icm93c2VyL3BhcnQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWNoRyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1FBRTdCLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLE1BQU0sVUFBVyxTQUFRLFdBQUk7WUFBN0I7O2dCQUVDLGlCQUFZLEdBQVcsRUFBRSxDQUFDO2dCQUMxQixpQkFBWSxHQUFXLEVBQUUsQ0FBQztnQkFDMUIsa0JBQWEsR0FBVyxFQUFFLENBQUM7Z0JBQzNCLGtCQUFhLEdBQVcsRUFBRSxDQUFDO1lBUzVCLENBQUM7WUFQUyxNQUFNLENBQUMsS0FBYSxFQUFFLE1BQWM7Z0JBQzVDLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUM1QyxDQUFDO1lBRUQsTUFBTTtnQkFDTCxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7WUFDNUMsQ0FBQztTQUNEO1FBRUQsTUFBTSxNQUFPLFNBQVEsVUFBVTtZQUU5QixZQUFvQixjQUEyQjtnQkFDOUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLG1DQUFnQixFQUFFLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDBDQUFrQixFQUFFLENBQUMsRUFBRSxJQUFJLHlDQUFpQixFQUFFLENBQUMsQ0FBQztnQkFEN0csbUJBQWMsR0FBZCxjQUFjLENBQWE7WUFFL0MsQ0FBQztZQUVrQixlQUFlLENBQUMsTUFBbUI7Z0JBQ3JELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxjQUFjLENB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