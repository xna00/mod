/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/files/common/files", "vs/platform/files/common/watcher"], function (require, exports, assert, event_1, lifecycle_1, platform_1, resources_1, uri_1, utils_1, files_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestFileWatcher extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidFilesChange = this._register(new event_1.Emitter());
        }
        get onDidFilesChange() {
            return this._onDidFilesChange.event;
        }
        report(changes) {
            this.onRawFileEvents(changes);
        }
        onRawFileEvents(events) {
            // Coalesce
            const coalescedEvents = (0, watcher_1.coalesceEvents)(events);
            // Emit through event emitter
            if (coalescedEvents.length > 0) {
                this._onDidFilesChange.fire({ raw: (0, watcher_1.reviveFileChanges)(coalescedEvents), event: this.toFileChangesEvent(coalescedEvents) });
            }
        }
        toFileChangesEvent(changes) {
            return new files_1.FileChangesEvent((0, watcher_1.reviveFileChanges)(changes), !platform_1.isLinux);
        }
    }
    var Path;
    (function (Path) {
        Path[Path["UNIX"] = 0] = "UNIX";
        Path[Path["WINDOWS"] = 1] = "WINDOWS";
        Path[Path["UNC"] = 2] = "UNC";
    })(Path || (Path = {}));
    suite('Watcher', () => {
        (platform_1.isWindows ? test.skip : test)('parseWatcherPatterns - posix', () => {
            const path = '/users/data/src';
            let parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['*.js'])[0];
            assert.strictEqual(parsedPattern('/users/data/src/foo.js'), true);
            assert.strictEqual(parsedPattern('/users/data/src/foo.ts'), false);
            assert.strictEqual(parsedPattern('/users/data/src/bar/foo.js'), false);
            parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['/users/data/src/*.js'])[0];
            assert.strictEqual(parsedPattern('/users/data/src/foo.js'), true);
            assert.strictEqual(parsedPattern('/users/data/src/foo.ts'), false);
            assert.strictEqual(parsedPattern('/users/data/src/bar/foo.js'), false);
            parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['/users/data/src/bar/*.js'])[0];
            assert.strictEqual(parsedPattern('/users/data/src/foo.js'), false);
            assert.strictEqual(parsedPattern('/users/data/src/foo.ts'), false);
            assert.strictEqual(parsedPattern('/users/data/src/bar/foo.js'), true);
            parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['**/*.js'])[0];
            assert.strictEqual(parsedPattern('/users/data/src/foo.js'), true);
            assert.strictEqual(parsedPattern('/users/data/src/foo.ts'), false);
            assert.strictEqual(parsedPattern('/users/data/src/bar/foo.js'), true);
        });
        (!platform_1.isWindows ? test.skip : test)('parseWatcherPatterns - windows', () => {
            const path = 'c:\\users\\data\\src';
            let parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['*.js'])[0];
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.js'), true);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.ts'), false);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\bar/foo.js'), false);
            parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['c:\\users\\data\\src\\*.js'])[0];
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.js'), true);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.ts'), false);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\bar\\foo.js'), false);
            parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['c:\\users\\data\\src\\bar/*.js'])[0];
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.js'), false);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.ts'), false);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\bar\\foo.js'), true);
            parsedPattern = (0, watcher_1.parseWatcherPatterns)(path, ['**/*.js'])[0];
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.js'), true);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\foo.ts'), false);
            assert.strictEqual(parsedPattern('c:\\users\\data\\src\\bar\\foo.js'), true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
    suite('Watcher Events Normalizer', () => {
        const disposables = new lifecycle_1.DisposableStore();
        teardown(() => {
            disposables.clear();
        });
        test('simple add/update/delete', done => {
            const watch = disposables.add(new TestFileWatcher());
            const added = uri_1.URI.file('/users/data/src/added.txt');
            const updated = uri_1.URI.file('/users/data/src/updated.txt');
            const deleted = uri_1.URI.file('/users/data/src/deleted.txt');
            const raw = [
                { resource: added, type: 1 /* FileChangeType.ADDED */ },
                { resource: updated, type: 0 /* FileChangeType.UPDATED */ },
                { resource: deleted, type: 2 /* FileChangeType.DELETED */ },
            ];
            disposables.add(watch.onDidFilesChange(({ event, raw }) => {
                assert.ok(event);
                assert.strictEqual(raw.length, 3);
                assert.ok(event.contains(added, 1 /* FileChangeType.ADDED */));
                assert.ok(event.contains(updated, 0 /* FileChangeType.UPDATED */));
                assert.ok(event.contains(deleted, 2 /* FileChangeType.DELETED */));
                done();
            }));
            watch.report(raw);
        });
        (platform_1.isWindows ? [Path.WINDOWS, Path.UNC] : [Path.UNIX]).forEach(path => {
            test(`delete only reported for top level folder (${path})`, done => {
                const watch = disposables.add(new TestFileWatcher());
                const deletedFolderA = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/todelete1' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete1' : '\\\\localhost\\users\\data\\src\\todelete1');
                const deletedFolderB = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/todelete2' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete2' : '\\\\localhost\\users\\data\\src\\todelete2');
                const deletedFolderBF1 = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/todelete2/file.txt' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete2\\file.txt' : '\\\\localhost\\users\\data\\src\\todelete2\\file.txt');
                const deletedFolderBF2 = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/todelete2/more/test.txt' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete2\\more\\test.txt' : '\\\\localhost\\users\\data\\src\\todelete2\\more\\test.txt');
                const deletedFolderBF3 = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/todelete2/super/bar/foo.txt' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\todelete2\\super\\bar\\foo.txt' : '\\\\localhost\\users\\data\\src\\todelete2\\super\\bar\\foo.txt');
                const deletedFileA = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/deleteme.txt' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\deleteme.txt' : '\\\\localhost\\users\\data\\src\\deleteme.txt');
                const addedFile = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/added.txt' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\added.txt' : '\\\\localhost\\users\\data\\src\\added.txt');
                const updatedFile = uri_1.URI.file(path === Path.UNIX ? '/users/data/src/updated.txt' : path === Path.WINDOWS ? 'C:\\users\\data\\src\\updated.txt' : '\\\\localhost\\users\\data\\src\\updated.txt');
                const raw = [
                    { resource: deletedFolderA, type: 2 /* FileChangeType.DELETED */ },
                    { resource: deletedFolderB, type: 2 /* FileChangeType.DELETED */ },
                    { resource: deletedFolderBF1, type: 2 /* FileChangeType.DELETED */ },
                    { resource: deletedFolderBF2, type: 2 /* FileChangeType.DELETED */ },
                    { resource: deletedFolderBF3, type: 2 /* FileChangeType.DELETED */ },
                    { resource: deletedFileA, type: 2 /* FileChangeType.DELETED */ },
                    { resource: addedFile, type: 1 /* FileChangeType.ADDED */ },
                    { resource: updatedFile, type: 0 /* FileChangeType.UPDATED */ }
                ];
                disposables.add(watch.onDidFilesChange(({ event, raw }) => {
                    assert.ok(event);
                    assert.strictEqual(raw.length, 5);
                    assert.ok(event.contains(deletedFolderA, 2 /* FileChangeType.DELETED */));
                    assert.ok(event.contains(deletedFolderB, 2 /* FileChangeType.DELETED */));
                    assert.ok(event.contains(deletedFileA, 2 /* FileChangeType.DELETED */));
                    assert.ok(event.contains(addedFile, 1 /* FileChangeType.ADDED */));
                    assert.ok(event.contains(updatedFile, 0 /* FileChangeType.UPDATED */));
                    done();
                }));
                watch.report(raw);
            });
        });
        test('event coalescer: ignore CREATE followed by DELETE', done => {
            const watch = disposables.add(new TestFileWatcher());
            const created = uri_1.URI.file('/users/data/src/related');
            const deleted = uri_1.URI.file('/users/data/src/related');
            const unrelated = uri_1.URI.file('/users/data/src/unrelated');
            const raw = [
                { resource: created, type: 1 /* FileChangeType.ADDED */ },
                { resource: deleted, type: 2 /* FileChangeType.DELETED */ },
                { resource: unrelated, type: 0 /* FileChangeType.UPDATED */ },
            ];
            disposables.add(watch.onDidFilesChange(({ event, raw }) => {
                assert.ok(event);
                assert.strictEqual(raw.length, 1);
                assert.ok(event.contains(unrelated, 0 /* FileChangeType.UPDATED */));
                done();
            }));
            watch.report(raw);
        });
        test('event coalescer: flatten DELETE followed by CREATE into CHANGE', done => {
            const watch = disposables.add(new TestFileWatcher());
            const deleted = uri_1.URI.file('/users/data/src/related');
            const created = uri_1.URI.file('/users/data/src/related');
            const unrelated = uri_1.URI.file('/users/data/src/unrelated');
            const raw = [
                { resource: deleted, type: 2 /* FileChangeType.DELETED */ },
                { resource: created, type: 1 /* FileChangeType.ADDED */ },
                { resource: unrelated, type: 0 /* FileChangeType.UPDATED */ },
            ];
            disposables.add(watch.onDidFilesChange(({ event, raw }) => {
                assert.ok(event);
                assert.strictEqual(raw.length, 2);
                assert.ok(event.contains(deleted, 0 /* FileChangeType.UPDATED */));
                assert.ok(event.contains(unrelated, 0 /* FileChangeType.UPDATED */));
                done();
            }));
            watch.report(raw);
        });
        test('event coalescer: ignore UPDATE when CREATE received', done => {
            const watch = disposables.add(new TestFileWatcher());
            const created = uri_1.URI.file('/users/data/src/related');
            const updated = uri_1.URI.file('/users/data/src/related');
            const unrelated = uri_1.URI.file('/users/data/src/unrelated');
            const raw = [
                { resource: created, type: 1 /* FileChangeType.ADDED */ },
                { resource: updated, type: 0 /* FileChangeType.UPDATED */ },
                { resource: unrelated, type: 0 /* FileChangeType.UPDATED */ },
            ];
            disposables.add(watch.onDidFilesChange(({ event, raw }) => {
                assert.ok(event);
                assert.strictEqual(raw.length, 2);
                assert.ok(event.contains(created, 1 /* FileChangeType.ADDED */));
                assert.ok(!event.contains(created, 0 /* FileChangeType.UPDATED */));
                assert.ok(event.contains(unrelated, 0 /* FileChangeType.UPDATED */));
                done();
            }));
            watch.report(raw);
        });
        test('event coalescer: apply DELETE', done => {
            const watch = disposables.add(new TestFileWatcher());
            const updated = uri_1.URI.file('/users/data/src/related');
            const updated2 = uri_1.URI.file('/users/data/src/related');
            const deleted = uri_1.URI.file('/users/data/src/related');
            const unrelated = uri_1.URI.file('/users/data/src/unrelated');
            const raw = [
                { resource: updated, type: 0 /* FileChangeType.UPDATED */ },
                { resource: updated2, type: 0 /* FileChangeType.UPDATED */ },
                { resource: unrelated, type: 0 /* FileChangeType.UPDATED */ },
                { resource: updated, type: 2 /* FileChangeType.DELETED */ }
            ];
            disposables.add(watch.onDidFilesChange(({ event, raw }) => {
                assert.ok(event);
                assert.strictEqual(raw.length, 2);
                assert.ok(event.contains(deleted, 2 /* FileChangeType.DELETED */));
                assert.ok(!event.contains(updated, 0 /* FileChangeType.UPDATED */));
                assert.ok(event.contains(unrelated, 0 /* FileChangeType.UPDATED */));
                done();
            }));
            watch.report(raw);
        });
        test('event coalescer: track case renames', done => {
            const watch = disposables.add(new TestFileWatcher());
            const oldPath = uri_1.URI.file('/users/data/src/added');
            const newPath = uri_1.URI.file('/users/data/src/ADDED');
            const raw = [
                { resource: newPath, type: 1 /* FileChangeType.ADDED */ },
                { resource: oldPath, type: 2 /* FileChangeType.DELETED */ }
            ];
            disposables.add(watch.onDidFilesChange(({ event, raw }) => {
                assert.ok(event);
                assert.strictEqual(raw.length, 2);
                for (const r of raw) {
                    if ((0, resources_1.isEqual)(r.resource, oldPath)) {
                        assert.strictEqual(r.type, 2 /* FileChangeType.DELETED */);
                    }
                    else if ((0, resources_1.isEqual)(r.resource, newPath)) {
                        assert.strictEqual(r.type, 1 /* FileChangeType.ADDED */);
                    }
                    else {
                        assert.fail();
                    }
                }
                done();
            }));
            watch.report(raw);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9maWxlcy90ZXN0L2NvbW1vbi93YXRjaGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsTUFBTSxlQUFnQixTQUFRLHNCQUFVO1FBR3ZDO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFFUixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBbUQsQ0FBQyxDQUFDO1FBQ3pHLENBQUM7UUFFRCxJQUFJLGdCQUFnQjtZQUNuQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7UUFDckMsQ0FBQztRQUVELE1BQU0sQ0FBQyxPQUFzQjtZQUM1QixJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFTyxlQUFlLENBQUMsTUFBcUI7WUFFNUMsV0FBVztZQUNYLE1BQU0sZUFBZSxHQUFHLElBQUEsd0JBQWMsRUFBQyxNQUFNLENBQUMsQ0FBQztZQUUvQyw2QkFBNkI7WUFDN0IsSUFBSSxlQUFlLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUEsMkJBQWlCLEVBQUMsZUFBZSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDM0gsQ0FBQztRQUNGLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxPQUFzQjtZQUNoRCxPQUFPLElBQUksd0JBQWdCLENBQUMsSUFBQSwyQkFBaUIsRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGtCQUFPLENBQUMsQ0FB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