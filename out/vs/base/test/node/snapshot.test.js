/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/test/node/testUtils", "vs/base/node/pfs", "vs/base/test/common/snapshot", "vs/base/common/uri", "path", "vs/base/test/common/utils"], function (require, exports, os_1, testUtils_1, pfs_1, snapshot_1, uri_1, path, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tests for snapshot are in Node so that we can use native FS operations to
    // set up and validate things.
    //
    // Uses snapshots for testing snapshots. It's snapception!
    suite('snapshot', () => {
        let testDir;
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(function () {
            testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'snapshot');
            return pfs_1.Promises.mkdir(testDir, { recursive: true });
        });
        teardown(function () {
            return pfs_1.Promises.rm(testDir);
        });
        const makeContext = (test) => {
            return new class extends snapshot_1.SnapshotContext {
                constructor() {
                    super(test);
                    this.snapshotsDir = uri_1.URI.file(testDir);
                }
            };
        };
        const snapshotFileTree = async () => {
            let str = '';
            const printDir = async (dir, indent) => {
                const children = await pfs_1.Promises.readdir(dir);
                for (const child of children) {
                    const p = path.join(dir, child);
                    if ((await pfs_1.Promises.stat(p)).isFile()) {
                        const content = await pfs_1.Promises.readFile(p, 'utf-8');
                        str += `${' '.repeat(indent)}${child}:\n`;
                        for (const line of content.split('\n')) {
                            str += `${' '.repeat(indent + 2)}${line}\n`;
                        }
                    }
                    else {
                        str += `${' '.repeat(indent)}${child}/\n`;
                        await printDir(p, indent + 2);
                    }
                }
            };
            await printDir(testDir, 0);
            await (0, snapshot_1.assertSnapshot)(str);
        };
        test('creates a snapshot', async () => {
            const ctx = makeContext({
                file: 'foo/bar',
                fullTitle: () => 'hello world!'
            });
            await ctx.assert({ cool: true });
            await snapshotFileTree();
        });
        test('validates a snapshot', async () => {
            const ctx1 = makeContext({
                file: 'foo/bar',
                fullTitle: () => 'hello world!'
            });
            await ctx1.assert({ cool: true });
            const ctx2 = makeContext({
                file: 'foo/bar',
                fullTitle: () => 'hello world!'
            });
            // should pass:
            await ctx2.assert({ cool: true });
            const ctx3 = makeContext({
                file: 'foo/bar',
                fullTitle: () => 'hello world!'
            });
            // should fail:
            await (0, utils_1.assertThrowsAsync)(() => ctx3.assert({ cool: false }));
        });
        test('cleans up old snapshots', async () => {
            const ctx1 = makeContext({
                file: 'foo/bar',
                fullTitle: () => 'hello world!'
            });
            await ctx1.assert({ cool: true });
            await ctx1.assert({ nifty: true });
            await ctx1.assert({ customName: 1 }, { name: 'thirdTest', extension: 'txt' });
            await ctx1.assert({ customName: 2 }, { name: 'fourthTest' });
            await snapshotFileTree();
            const ctx2 = makeContext({
                file: 'foo/bar',
                fullTitle: () => 'hello world!'
            });
            await ctx2.assert({ cool: true });
            await ctx2.assert({ customName: 1 }, { name: 'thirdTest' });
            await ctx2.removeOldSnapshots();
            await snapshotFileTree();
        });
        test('formats object nicely', async () => {
            const circular = {};
            circular.a = circular;
            await (0, snapshot_1.assertSnapshot)([
                1,
                true,
                undefined,
                null,
                123n,
                Symbol('heyo'),
                'hello',
                { hello: 'world' },
                circular,
                new Map([['hello', 1], ['goodbye', 2]]),
                new Set([1, 2, 3]),
                function helloWorld() { },
                /hello/g,
                new Array(10).fill('long string'.repeat(10)),
                { [Symbol.for('debug.description')]() { return `Range [1 -> 5]`; } },
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25hcHNob3QudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L25vZGUvc25hcHNob3QudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVVoRyw0RUFBNEU7SUFDNUUsOEJBQThCO0lBQzlCLEVBQUU7SUFDRiwwREFBMEQ7SUFFMUQsS0FBSyxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7UUFDdEIsSUFBSSxPQUFlLENBQUM7UUFFcEIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQztZQUNMLE9BQU8sR0FBRyxJQUFBLDZCQUFpQixFQUFDLElBQUEsV0FBTSxHQUFFLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzlELE9BQU8sY0FBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQztZQUNSLE9BQU8sY0FBUSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBcUMsRUFBRSxFQUFFO1lBQzdELE9BQU8sSUFBSSxLQUFNLFNBQVEsMEJBQWU7Z0JBQ3ZDO29CQUNDLEtBQUssQ0FBQyxJQUFrQixDQUFDLENBQUM7b0JBQzFCLElBQUksQ0FBQyxZQUFZLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDdkMsQ0FBQzthQUNELENBQUM7UUFDSCxDQUFDLENBQUM7UUFFRixNQUFNLGdCQUFnQixHQUFHLEtBQUssSUFBSSxFQUFFO1lBQ25DLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztZQUViLE1BQU0sUUFBUSxH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