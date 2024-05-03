define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/test/common/utils"], function (require, exports, assert, cancellation_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CancellationToken', function () {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('None', () => {
            assert.strictEqual(cancellation_1.CancellationToken.None.isCancellationRequested, false);
            assert.strictEqual(typeof cancellation_1.CancellationToken.None.onCancellationRequested, 'function');
        });
        test('cancel before token', function () {
            const source = new cancellation_1.CancellationTokenSource();
            assert.strictEqual(source.token.isCancellationRequested, false);
            source.cancel();
            assert.strictEqual(source.token.isCancellationRequested, true);
            return new Promise(resolve => {
                source.token.onCancellationRequested(() => resolve());
            });
        });
        test('cancel happens only once', function () {
            const source = new cancellation_1.CancellationTokenSource();
            assert.strictEqual(source.token.isCancellationRequested, false);
            let cancelCount = 0;
            function onCancel() {
                cancelCount += 1;
            }
            store.add(source.token.onCancellationRequested(onCancel));
            source.cancel();
            source.cancel();
            assert.strictEqual(cancelCount, 1);
        });
        test('cancel calls all listeners', function () {
            let count = 0;
            const source = new cancellation_1.CancellationTokenSource();
            store.add(source.token.onCancellationRequested(() => count++));
            store.add(source.token.onCancellationRequested(() => count++));
            store.add(source.token.onCancellationRequested(() => count++));
            source.cancel();
            assert.strictEqual(count, 3);
        });
        test('token stays the same', function () {
            let source = new cancellation_1.CancellationTokenSource();
            let token = source.token;
            assert.ok(token === source.token); // doesn't change on get
            source.cancel();
            assert.ok(token === source.token); // doesn't change after cancel
            source.cancel();
            assert.ok(token === source.token); // doesn't change after 2nd cancel
            source = new cancellation_1.CancellationTokenSource();
            source.cancel();
            token = source.token;
            assert.ok(token === source.token); // doesn't change on get
        });
        test('dispose calls no listeners', function () {
            let count = 0;
            const source = new cancellation_1.CancellationTokenSource();
            store.add(source.token.onCancellationRequested(() => count++));
            source.dispose();
            source.cancel();
            assert.strictEqual(count, 0);
        });
        test('dispose calls no listeners (unless told to cancel)', function () {
            let count = 0;
            const source = new cancellation_1.CancellationTokenSource();
            store.add(source.token.onCancellationRequested(() => count++));
            source.dispose(true);
            // source.cancel();
            assert.strictEqual(count, 1);
        });
        test('dispose does not cancel', function () {
            const source = new cancellation_1.CancellationTokenSource();
            source.dispose();
            assert.strictEqual(source.token.isCancellationRequested, false);
        });
        test('parent cancels child', function () {
            const parent = new cancellation_1.CancellationTokenSource();
            const child = new cancellation_1.CancellationTokenSource(parent.token);
            let count = 0;
            store.add(child.token.onCancellationRequested(() => count++));
            parent.cancel();
            assert.strictEqual(count, 1);
            assert.strictEqual(child.token.isCancellationRequested, true);
            assert.strictEqual(parent.token.isCancellationRequested, true);
            child.dispose();
            parent.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FuY2VsbGF0aW9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vY2FuY2VsbGF0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBUUEsS0FBSyxDQUFDLG1CQUFtQixFQUFFO1FBRTFCLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtZQUNqQixNQUFNLENBQUMsV0FBVyxDQUFDLGdDQUFpQixDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxRSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sZ0NBQWlCLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHFCQUFxQixFQUFFO1lBRTNCLE1BQU0sTUFBTSxHQUFHLElBQUksc0NBQXVCLEVBQUUsQ0FBQztZQUM3QyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDaEUsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBRWhCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUUvRCxPQUFPLElBQUksT0FBTyxDQUFPLE9BQU8sQ0FBQyxFQUFFO2dCQUNsQyxNQUFNLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDdkQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywwQkFB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