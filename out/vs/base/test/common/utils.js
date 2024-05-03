/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri"], function (require, exports, lifecycle_1, path_1, platform_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toResource = toResource;
    exports.suiteRepeat = suiteRepeat;
    exports.testRepeat = testRepeat;
    exports.assertThrowsAsync = assertThrowsAsync;
    exports.ensureNoDisposablesAreLeakedInTestSuite = ensureNoDisposablesAreLeakedInTestSuite;
    exports.throwIfDisposablesAreLeaked = throwIfDisposablesAreLeaked;
    exports.throwIfDisposablesAreLeakedAsync = throwIfDisposablesAreLeakedAsync;
    function toResource(path) {
        if (platform_1.isWindows) {
            return uri_1.URI.file((0, path_1.join)('C:\\', btoa(this.test.fullTitle()), path));
        }
        return uri_1.URI.file((0, path_1.join)('/', btoa(this.test.fullTitle()), path));
    }
    function suiteRepeat(n, description, callback) {
        for (let i = 0; i < n; i++) {
            suite(`${description} (iteration ${i})`, callback);
        }
    }
    function testRepeat(n, description, callback) {
        for (let i = 0; i < n; i++) {
            test(`${description} (iteration ${i})`, callback);
        }
    }
    async function assertThrowsAsync(block, message = 'Missing expected exception') {
        try {
            await block();
        }
        catch {
            return;
        }
        const err = message instanceof Error ? message : new Error(message);
        throw err;
    }
    /**
     * Use this function to ensure that all disposables are cleaned up at the end of each test in the current suite.
     *
     * Use `markAsSingleton` if disposable singletons are created lazily that are allowed to outlive the test.
     * Make sure that the singleton properly registers all child disposables so that they are excluded too.
     *
     * @returns A {@link DisposableStore} that can optionally be used to track disposables in the test.
     * This will be automatically disposed on test teardown.
    */
    function ensureNoDisposablesAreLeakedInTestSuite() {
        let tracker;
        let store;
        setup(() => {
            store = new lifecycle_1.DisposableStore();
            tracker = new lifecycle_1.DisposableTracker();
            (0, lifecycle_1.setDisposableTracker)(tracker);
        });
        teardown(function () {
            store.dispose();
            (0, lifecycle_1.setDisposableTracker)(null);
            if (this.currentTest?.state !== 'failed') {
                const result = tracker.computeLeakingDisposables();
                if (result) {
                    console.error(result.details);
                    throw new Error(`There are ${result.leaks.length} undisposed disposables!${result.details}`);
                }
            }
        });
        // Wrap store as the suite function is called before it's initialized
        const testContext = {
            add(o) {
                return store.add(o);
            }
        };
        return testContext;
    }
    function throwIfDisposablesAreLeaked(body, logToConsole = true) {
        const tracker = new lifecycle_1.DisposableTracker();
        (0, lifecycle_1.setDisposableTracker)(tracker);
        body();
        (0, lifecycle_1.setDisposableTracker)(null);
        computeLeakingDisposables(tracker, logToConsole);
    }
    async function throwIfDisposablesAreLeakedAsync(body) {
        const tracker = new lifecycle_1.DisposableTracker();
        (0, lifecycle_1.setDisposableTracker)(tracker);
        await body();
        (0, lifecycle_1.setDisposableTracker)(null);
        computeLeakingDisposables(tracker);
    }
    function computeLeakingDisposables(tracker, logToConsole = true) {
        const result = tracker.computeLeakingDisposables();
        if (result) {
            if (logToConsole) {
                console.error(result.details);
            }
            throw new Error(`There are ${result.leaks.length} undisposed disposables!${result.details}`);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsZ0NBTUM7SUFFRCxrQ0FJQztJQUVELGdDQUlDO0lBRUQsOENBU0M7SUFXRCwwRkE0QkM7SUFFRCxrRUFNQztJQUVELDRFQU1DO0lBcEZELFNBQWdCLFVBQVUsQ0FBWSxJQUFZO1FBQ2pELElBQUksb0JBQVMsRUFBRSxDQUFDO1lBQ2YsT0FBTyxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUEsV0FBSSxFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVELE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFBLFdBQUksRUFBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRCxTQUFnQixXQUFXLENBQUMsQ0FBUyxFQUFFLFdBQW1CLEVBQUUsUUFBNkI7UUFDeEYsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzVCLEtBQUssQ0FBQyxHQUFHLFdBQVcsZUFBZSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwRCxDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQWdCLFVBQVUsQ0FBQyxDQUFTLEVBQUUsV0FBbUIsRUFBRSxRQUE0QjtRQUN0RixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFF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