/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assertHeap = assertHeap;
    let currentTest;
    const snapshotsToAssert = [];
    setup(function () {
        currentTest = this.currentTest;
    });
    suiteTeardown(async () => {
        await Promise.all(snapshotsToAssert.map(async (snap) => {
            const counts = await snap.counts;
            const asserts = Object.entries(snap.opts.classes);
            if (asserts.length !== counts.length) {
                throw new Error(`expected class counts to equal assertions length for ${snap.test}`);
            }
            for (const [i, [name, doAssert]] of asserts.entries()) {
                try {
                    doAssert(counts[i]);
                }
                catch (e) {
                    throw new Error(`Unexpected number of ${name} instances (${counts[i]}) after "${snap.test}":\n\n${e.message}\n\nSnapshot saved at: ${snap.file}`);
                }
            }
        }));
        snapshotsToAssert.length = 0;
    });
    const snapshotMinTime = 20_000;
    /**
     * Takes a heap snapshot, and asserts the state of classes in memory. This
     * works in Node and the Electron sandbox, but is a no-op in the browser.
     * Snapshots are process asynchronously and will report failures at the end of
     * the suite.
     *
     * This method should be used sparingly (e.g. once at the end of a suite to
     * ensure nothing leaked before), as gathering a heap snapshot is fairly
     * slow, at least until V8 11.5.130 (https://v8.dev/blog/speeding-up-v8-heap-snapshots).
     *
     * Takes options containing a mapping of class names, and assertion functions
     * to run on the number of retained instances of that class. For example:
     *
     * ```ts
     * assertSnapshot({
     *	classes: {
     *		ShouldNeverLeak: count => assert.strictEqual(count, 0),
     *		SomeSingleton: count => assert(count <= 1),
     *	}
     *});
     * ```
     */
    async function assertHeap(opts) {
        if (!currentTest) {
            throw new Error('assertSnapshot can only be used when a test is running');
        }
        // snapshotting can take a moment, ensure the test timeout is decently long
        // so it doesn't immediately fail.
        if (currentTest.timeout() < snapshotMinTime) {
            currentTest.timeout(snapshotMinTime);
        }
        if (typeof __analyzeSnapshotInTests === 'undefined') {
            return; // running in browser, no-op
        }
        const { done, file } = await __analyzeSnapshotInTests(currentTest.fullTitle(), Object.keys(opts.classes));
        snapshotsToAssert.push({ counts: done, file, test: currentTest.fullTitle(), opts });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0SGVhcC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9hc3NlcnRIZWFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBOERoRyxnQ0FpQkM7SUExRUQsSUFBSSxXQUFtQyxDQUFDO0lBRXhDLE1BQU0saUJBQWlCLEdBQWdHLEVBQUUsQ0FBQztJQUUxSCxLQUFLLENBQUM7UUFDTCxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUNoQyxDQUFDLENBQUMsQ0FBQztJQUVILGFBQWEsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUN4QixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQyxJQUFJLEVBQUMsRUFBRTtZQUNwRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUM7WUFFakMsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xELElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3RDLE1BQU0sSUFBSSxLQUFLLENBQUMsd0RBQXdELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3RGLENBQUM7WUFFRCxLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztnQkFDdkQsSUFBSSxDQUFDO29CQUNKLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckIsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLElBQUksZUFBZSxNQUFNLENBQUMsQ0FBQyxDQUFDLFlBQVksSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsT0FBTywwQkFBMEIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ25KLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVKLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDOUIsQ0FBQyxDQUFDLENBQUM7SUFNSCxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUM7SUFFL0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQXFCRztJQUNJLEtBQUssVUFBVSxVQUFVLENBQUMsSUFBNEI7UUFDNUQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsd0RBQXdELENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBRUQsMkVBQTJFO1FBQzNFLGtDQUFrQztRQUNsQyxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxlQUFlLEVBQUUsQ0FBQztZQUM3QyxXQUFXLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFRCxJQUFJLE9BQU8sd0JBQXdCLEtBQUssV0FBVyxFQUFFLENBQUM7WUFDckQsT0FBTyxDQUFDLDRCQUE0QjtRQUNyQyxDQUFDO1FBRUQsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLHdCQUF3QixDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNyRixDQUFDIn0=