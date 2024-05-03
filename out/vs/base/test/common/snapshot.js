/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lazy", "vs/base/common/network", "vs/base/common/uri"], function (require, exports, lazy_1, network_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnapshotContext = void 0;
    exports.assertSnapshot = assertSnapshot;
    // setup on import so assertSnapshot has the current context without explicit passing
    let context;
    const sanitizeName = (name) => name.replace(/[^a-z0-9_-]/gi, '_');
    const normalizeCrlf = (str) => str.replace(/\r\n/g, '\n');
    /**
     * This is exported only for tests against the snapshotting itself! Use
     * {@link assertSnapshot} as a consumer!
     */
    class SnapshotContext {
        constructor(test) {
            this.test = test;
            this.nextIndex = 0;
            this.usedNames = new Set();
            if (!test) {
                throw new Error('assertSnapshot can only be used in a test');
            }
            if (!test.file) {
                throw new Error('currentTest.file is not set, please open an issue with the test you\'re trying to run');
            }
            const src = network_1.FileAccess.asFileUri('');
            const parts = test.file.split(/[/\\]/g);
            this.namePrefix = sanitizeName(test.fullTitle()) + '.';
            this.snapshotsDir = uri_1.URI.joinPath(src, ...[...parts.slice(0, -1), '__snapshots__']);
        }
        async assert(value, options) {
            const originalStack = new Error().stack; // save to make the stack nicer on failure
            const nameOrIndex = (options?.name ? sanitizeName(options.name) : this.nextIndex++);
            const fileName = this.namePrefix + nameOrIndex + '.' + (options?.extension || 'snap');
            this.usedNames.add(fileName);
            const fpath = uri_1.URI.joinPath(this.snapshotsDir, fileName).fsPath;
            const actual = formatValue(value);
            let expected;
            try {
                expected = await __readFileInTests(fpath);
            }
            catch {
                console.info(`Creating new snapshot in: ${fpath}`);
                await __mkdirPInTests(this.snapshotsDir.fsPath);
                await __writeFileInTests(fpath, actual);
                return;
            }
            if (normalizeCrlf(expected) !== normalizeCrlf(actual)) {
                await __writeFileInTests(fpath + '.actual', actual);
                const err = new Error(`Snapshot #${nameOrIndex} does not match expected output`);
                err.expected = expected;
                err.actual = actual;
                err.snapshotPath = fpath;
                err.stack = err.stack
                    .split('\n')
                    // remove all frames from the async stack and keep the original caller's frame
                    .slice(0, 1)
                    .concat(originalStack.split('\n').slice(3))
                    .join('\n');
                throw err;
            }
        }
        async removeOldSnapshots() {
            const contents = await __readDirInTests(this.snapshotsDir.fsPath);
            const toDelete = contents.filter(f => f.startsWith(this.namePrefix) && !this.usedNames.has(f));
            if (toDelete.length) {
                console.info(`Deleting ${toDelete.length} old snapshots for ${this.test?.fullTitle()}`);
            }
            await Promise.all(toDelete.map(f => __unlinkInTests(uri_1.URI.joinPath(this.snapshotsDir, f).fsPath)));
        }
    }
    exports.SnapshotContext = SnapshotContext;
    const debugDescriptionSymbol = Symbol.for('debug.description');
    function formatValue(value, level = 0, seen = []) {
        switch (typeof value) {
            case 'bigint':
            case 'boolean':
            case 'number':
            case 'symbol':
            case 'undefined':
                return String(value);
            case 'string':
                return level === 0 ? value : JSON.stringify(value);
            case 'function':
                return `[Function ${value.name}]`;
            case 'object': {
                if (value === null) {
                    return 'null';
                }
                if (value instanceof RegExp) {
                    return String(value);
                }
                if (seen.includes(value)) {
                    return '[Circular]';
                }
                if (debugDescriptionSymbol in value && typeof value[debugDescriptionSymbol] === 'function') {
                    return value[debugDescriptionSymbol]();
                }
                const oi = '  '.repeat(level);
                const ci = '  '.repeat(level + 1);
                if (Array.isArray(value)) {
                    const children = value.map(v => formatValue(v, level + 1, [...seen, value]));
                    const multiline = children.some(c => c.includes('\n')) || children.join(', ').length > 80;
                    return multiline ? `[\n${ci}${children.join(`,\n${ci}`)}\n${oi}]` : `[ ${children.join(', ')} ]`;
                }
                let entries;
                let prefix = '';
                if (value instanceof Map) {
                    prefix = 'Map ';
                    entries = [...value.entries()];
                }
                else if (value instanceof Set) {
                    prefix = 'Set ';
                    entries = [...value.entries()];
                }
                else {
                    entries = Object.entries(value);
                }
                const lines = entries.map(([k, v]) => `${k}: ${formatValue(v, level + 1, [...seen, value])}`);
                return prefix + (lines.length > 1
                    ? `{\n${ci}${lines.join(`,\n${ci}`)}\n${oi}}`
                    : `{ ${lines.join(',\n')} }`);
            }
            default:
                throw new Error(`Unknown type ${value}`);
        }
    }
    setup(function () {
        const currentTest = this.currentTest;
        context = new lazy_1.Lazy(() => new SnapshotContext(currentTest));
    });
    teardown(async function () {
        if (this.currentTest?.state === 'passed') {
            await context?.rawValue?.removeOldSnapshots();
        }
        context = undefined;
    });
    /**
     * Implements a snapshot testing utility. ⚠️ This is async! ⚠️
     *
     * The first time a snapshot test is run, it'll record the value it's called
     * with as the expected value. Subsequent runs will fail if the value differs,
     * but the snapshot can be regenerated by hand or using the Selfhost Test
     * Provider Extension which'll offer to update it.
     *
     * The snapshot will be associated with the currently running test and stored
     * in a `__snapshots__` directory next to the test file, which is expected to
     * be the first `.test.js` file in the callstack.
     */
    function assertSnapshot(value, options) {
        if (!context) {
            throw new Error('assertSnapshot can only be used in a test');
        }
        return context.value.assert(value, options);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25hcHNob3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vc25hcHNob3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK0toRyx3Q0FNQztJQXpLRCxxRkFBcUY7SUFDckYsSUFBSSxPQUEwQyxDQUFDO0lBQy9DLE1BQU0sWUFBWSxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUMxRSxNQUFNLGFBQWEsR0FBRyxDQUFDLEdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFTbEU7OztPQUdHO0lBQ0gsTUFBYSxlQUFlO1FBTTNCLFlBQTZCLElBQTRCO1lBQTVCLFNBQUksR0FBSixJQUFJLENBQXdCO1lBTGpELGNBQVMsR0FBRyxDQUFDLENBQUM7WUFHTCxjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUd0QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsTUFBTSxJQUFJLEtBQUssQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO1lBQzlELENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLHVGQUF1RixDQUFDLENBQUM7WUFDMUcsQ0FBQztZQUVELE1BQU0sR0FBRyxHQUFHLG9CQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXhDLElBQUksQ0FBQyxVQUFVLEdBQUcsWUFBWSxDQUFDLElBQUks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