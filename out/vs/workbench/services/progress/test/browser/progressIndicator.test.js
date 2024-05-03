/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/workbench/services/progress/browser/progressIndicator"], function (require, exports, assert, lifecycle_1, utils_1, progressIndicator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestProgressBar {
        constructor() {
            this.fTotal = 0;
            this.fWorked = 0;
            this.fInfinite = false;
            this.fDone = false;
        }
        infinite() {
            this.fDone = null;
            this.fInfinite = true;
            return this;
        }
        total(total) {
            this.fDone = null;
            this.fTotal = total;
            return this;
        }
        hasTotal() {
            return !!this.fTotal;
        }
        worked(worked) {
            this.fDone = null;
            if (this.fWorked) {
                this.fWorked += worked;
            }
            else {
                this.fWorked = worked;
            }
            return this;
        }
        done() {
            this.fDone = true;
            this.fInfinite = null;
            this.fWorked = null;
            this.fTotal = null;
            return this;
        }
        stop() {
            return this.done();
        }
        show() { }
        hide() { }
    }
    suite('Progress Indicator', () => {
        const disposables = new lifecycle_1.DisposableStore();
        teardown(() => {
            disposables.clear();
        });
        test('ScopedProgressIndicator', async () => {
            const testProgressBar = new TestProgressBar();
            const progressScope = disposables.add(new class extends progressIndicator_1.AbstractProgressScope {
                constructor() { super('test.scopeId', true); }
                testOnScopeOpened(scopeId) { super.onScopeOpened(scopeId); }
                testOnScopeClosed(scopeId) { super.onScopeClosed(scopeId); }
            }());
            const testObject = disposables.add(new progressIndicator_1.ScopedProgressIndicator(testProgressBar, progressScope));
            // Active: Show (Infinite)
            let fn = testObject.show(true);
            assert.strictEqual(true, testProgressBar.fInfinite);
            fn.done();
            assert.strictEqual(true, testProgressBar.fDone);
            // Active: Show (Total / Worked)
            fn = testObject.show(100);
            assert.strictEqual(false, !!testProgressBar.fInfinite);
            assert.strictEqual(100, testProgressBar.fTotal);
            fn.worked(20);
            assert.strictEqual(20, testProgressBar.fWorked);
            fn.total(80);
            assert.strictEqual(80, testProgressBar.fTotal);
            fn.done();
            assert.strictEqual(true, testProgressBar.fDone);
            // Inactive: Show (Infinite)
            progressScope.testOnScopeClosed('test.scopeId');
            testObject.show(true);
            assert.strictEqual(false, !!testProgressBar.fInfinite);
            progressScope.testOnScopeOpened('test.scopeId');
            assert.strictEqual(true, testProgressBar.fInfinite);
            // Inactive: Show (Total / Worked)
            progressScope.testOnScopeClosed('test.scopeId');
            fn = testObject.show(100);
            fn.total(80);
            fn.worked(20);
            assert.strictEqual(false, !!testProgressBar.fTotal);
            progressScope.testOnScopeOpened('test.scopeId');
            assert.strictEqual(20, testProgressBar.fWorked);
            assert.strictEqual(80, testProgressBar.fTotal);
            // Acive: Show While
            let p = Promise.resolve(null);
            await testObject.showWhile(p);
            assert.strictEqual(true, testProgressBar.fDone);
            progressScope.testOnScopeClosed('test.scopeId');
            p = Promise.resolve(null);
            await testObject.showWhile(p);
            assert.strictEqual(true, testProgressBar.fDone);
            progressScope.testOnScopeOpened('test.scopeId');
            assert.strictEqual(true, testProgressBar.fDone);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3NJbmRpY2F0b3IudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3Byb2dyZXNzL3Rlc3QvYnJvd3Nlci9wcm9ncmVzc0luZGljYXRvci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLE1BQU0sZUFBZTtRQUFyQjtZQUNDLFdBQU0sR0FBVyxDQUFDLENBQUM7WUFDbkIsWUFBTyxHQUFXLENBQUMsQ0FBQztZQUNwQixjQUFTLEdBQVksS0FBSyxDQUFDO1lBQzNCLFVBQUssR0FBWSxLQUFLLENBQUM7UUFpRHhCLENBQUM7UUEvQ0EsUUFBUTtZQUNQLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBRXRCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFhO1lBQ2xCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBRXBCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELFFBQVE7WUFDUCxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3RCLENBQUM7UUFFRCxNQUFNLENBQUMsTUFBYztZQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUssQ0FBQztZQUVuQixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUM7WUFDeEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3ZCLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNi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