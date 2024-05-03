/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/api/common/extHostDiagnostics", "vs/workbench/api/common/extHostTypes", "vs/platform/markers/common/markers", "vs/base/test/common/mock", "vs/base/common/event", "vs/platform/log/common/log", "vs/workbench/services/extensions/common/extensions", "vs/base/common/resources", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, extHostDiagnostics_1, extHostTypes_1, markers_1, mock_1, event_1, log_1, extensions_1, resources_1, timeTravelScheduler_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostDiagnostics', () => {
        class DiagnosticsShape extends (0, mock_1.mock)() {
            $changeMany(owner, entries) {
                //
            }
            $clear(owner) {
                //
            }
        }
        const fileSystemInfoService = new class extends (0, mock_1.mock)() {
            constructor() {
                super(...arguments);
                this.extUri = resources_1.extUri;
            }
        };
        const versionProvider = (uri) => {
            return undefined;
        };
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('disposeCheck', () => {
            const collection = new extHostDiagnostics_1.DiagnosticCollection('test', 'test', 100, 100, versionProvider, resources_1.extUri, new DiagnosticsShape(), new event_1.Emitter());
            collection.dispose();
            collection.dispose(); // that's OK
            assert.throws(() => collection.name);
            assert.throws(() => collection.clear());
            assert.throws(() => collection.delete(uri_1.URI.parse('aa:bb')));
            assert.throws(() => collection.forEach(() => { }));
            assert.throws(() => collection.get(uri_1.URI.parse('aa:bb')));
            assert.throws(() => collection.has(uri_1.URI.parse('aa:bb')));
            assert.throws(() => collection.set(uri_1.URI.parse('aa:bb'), []));
            assert.throws(() => collection.set(uri_1.URI.parse('aa:bb'), undefined));
        });
        test('diagnostic collection, forEach, clear, has', function () {
            let collection = new extHostDiagnostics_1.DiagnosticCollection('test', 'test', 100, 100, versionProvider, resources_1.extUri, new DiagnosticsShape(), new event_1.Emitter());
            assert.strictEqual(collection.name, 'test');
            collection.dispose();
            assert.throws(() => collection.name);
            let c = 0;
            collection = new extHostDiagnostics_1.DiagnosticCollection('test', 'test', 100, 100, versionProvider, resources_1.extUri, new DiagnosticsShape(), new event_1.Emitter());
            collection.forEach(() => c++);
            assert.strictEqual(c, 0);
            collection.set(uri_1.URI.parse('foo:bar'), [
                new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'message-1'),
                new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'message-2')
            ]);
            collection.forEach(() => c++);
            assert.strictEqual(c, 1);
            c = 0;
            collection.clear();
            collection.forEach(() => c++);
            assert.strictEqual(c, 0);
            collection.set(uri_1.URI.parse('foo:bar1'), [
                new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'message-1'),
                new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'message-2')
            ]);
            collection.set(uri_1.URI.parse('foo:bar2'), [
                new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'message-1'),
                new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'message-2')
            ]);
            collection.forEach(() => c++);
            assert.strictEqual(c, 2);
            assert.ok(collection.has(uri_1.URI.parse('foo:bar1')));
            assert.ok(collection.has(uri_1.URI.parse('foo:bar2')));
            assert.ok(!collection.has(uri_1.URI.parse('foo:bar3')));
            collection.delete(uri_1.URI.parse('foo:bar1'));
            assert.ok(!collection.has(uri_1.URI.parse('foo:bar1')));
            collection.dispose();
        });
        test('diagnostic collection, immutable read', function () {
            const collection = new extHostDiagnostics_1.DiagnosticCollection('test', 'test', 100, 100, versionProvider, resources_1.extUri, new DiagnosticsShape(), new event_1.Emitter());
            collection.set(uri_1.URI.parse('foo:bar'), [
                new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'message-1'),
                new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'message-2')
            ]);
            let array = collection.get(uri_1.URI.parse('foo:bar'));
            assert.throws(() => array.length = 0);
            assert.throws(() => array.pop());
            assert.throws(() => array[0] = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 0, 0), 'evil'));
            collection.forEach((uri, array) => {
                assert.throws(() => array.length = 0);
                assert.throws(() => array.pop());
                assert.throws(() => array[0] = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 0, 0), 'evil'));
            });
            array = collection.get(uri_1.URI.parse('foo:bar'));
            assert.strictEqual(array.length, 2);
            collection.dispose();
        });
        test('diagnostics collection, set with dupliclated tuples', function () {
            const collection = new extHostDiagnostics_1.DiagnosticCollection('test', 'test', 100, 100, versionProvider, resources_1.extUri, new DiagnosticsShape(), new event_1.Emitter());
            const uri = uri_1.URI.parse('sc:hightower');
            collection.set([
                [uri, [new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 0, 1), 'message-1')]],
                [uri_1.URI.parse('some:thing'), [new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'something')]],
                [uri, [new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 0, 1), 'message-2')]],
            ]);
            let array = collection.get(uri);
            assert.strictEqual(array.length, 2);
            let [first, second] = array;
            assert.strictEqual(first.message, 'message-1');
            assert.strictEqual(second.message, 'message-2');
            // clear
            collection.delete(uri);
            assert.ok(!collection.has(uri));
            // bad tuple clears 1/2
            collection.set([
                [uri, [new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 0, 1), 'message-1')]],
                [uri_1.URI.parse('some:thing'), [new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'something')]],
                [uri, undefined]
            ]);
            assert.ok(!collection.has(uri));
            // clear
            collection.delete(uri);
            assert.ok(!collection.has(uri));
            // bad tuple clears 2/2
            collection.set([
                [uri, [new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 0, 1), 'message-1')]],
                [uri_1.URI.parse('some:thing'), [new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'something')]],
                [uri, undefined],
                [uri, [new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 0, 1), 'message-2')]],
                [uri, [new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 0, 1), 'message-3')]],
            ]);
            array = collection.get(uri);
            assert.strictEqual(array.length, 2);
            [first, second] = array;
            assert.strictEqual(first.message, 'message-2');
            assert.strictEqual(second.message, 'message-3');
            collection.dispose();
        });
        test('diagnostics collection, set tuple overrides, #11547', function () {
            let lastEntries;
            const collection = new extHostDiagnostics_1.DiagnosticCollection('test', 'test', 100, 100, versionProvider, resources_1.extUri, new class extends DiagnosticsShape {
                $changeMany(owner, entries) {
                    lastEntries = entries;
                    return super.$changeMany(owner, entries);
                }
            }, new event_1.Emitter());
            const uri = uri_1.URI.parse('sc:hightower');
            collection.set([[uri, [new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'error')]]]);
            assert.strictEqual(collection.get(uri).length, 1);
            assert.strictEqual(collection.get(uri)[0].message, 'error');
            assert.strictEqual(lastEntries.length, 1);
            const [[, data1]] = lastEntries;
            assert.strictEqual(data1.length, 1);
            assert.strictEqual(data1[0].message, 'error');
            lastEntries = undefined;
            collection.set([[uri, [new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'warning')]]]);
            assert.strictEqual(collection.get(uri).length, 1);
            assert.strictEqual(collection.get(uri)[0].message, 'warning');
            assert.strictEqual(lastEntries.length, 1);
            const [[, data2]] = lastEntries;
            assert.strictEqual(data2.length, 1);
            assert.strictEqual(data2[0].message, 'warning');
            lastEntries = undefined;
        });
        test('do send message when not making a change', function () {
            let changeCount = 0;
            let eventCount = 0;
            const emitter = new event_1.Emitter();
            store.add(emitter.event(_ => eventCount += 1));
            const collection = new extHostDiagnostics_1.DiagnosticCollection('test', 'test', 100, 100, versionProvider, resources_1.extUri, new class extends DiagnosticsShape {
                $changeMany() {
                    changeCount += 1;
                }
            }, emitter);
            const uri = uri_1.URI.parse('sc:hightower');
            const diag = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 0, 1), 'ffff');
            collection.set(uri, [diag]);
            assert.strictEqual(changeCount, 1);
            assert.strictEqual(eventCount, 1);
            collection.set(uri, [diag]);
            assert.strictEqual(changeCount, 2);
            assert.strictEqual(eventCount, 2);
        });
        test('diagnostics collection, tuples and undefined (small array), #15585', function () {
            const collection = new extHostDiagnostics_1.DiagnosticCollection('test', 'test', 100, 100, versionProvider, resources_1.extUri, new DiagnosticsShape(), new event_1.Emitter());
            const uri = uri_1.URI.parse('sc:hightower');
            const uri2 = uri_1.URI.parse('sc:nomad');
            const diag = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 0, 1), 'ffff');
            collection.set([
                [uri, [diag, diag, diag]],
                [uri, undefined],
                [uri, [diag]],
                [uri2, [diag, diag]],
                [uri2, undefined],
                [uri2, [diag]],
            ]);
            assert.strictEqual(collection.get(uri).length, 1);
            assert.strictEqual(collection.get(uri2).length, 1);
        });
        test('diagnostics collection, tuples and undefined (large array), #15585', function () {
            const collection = new extHostDiagnostics_1.DiagnosticCollection('test', 'test', 100, 100, versionProvider, resources_1.extUri, new DiagnosticsShape(), new event_1.Emitter());
            const tuples = [];
            for (let i = 0; i < 500; i++) {
                const uri = uri_1.URI.parse('sc:hightower#' + i);
                const diag = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 0, 1), i.toString());
                tuples.push([uri, [diag, diag, diag]]);
                tuples.push([uri, undefined]);
                tuples.push([uri, [diag]]);
            }
            collection.set(tuples);
            for (let i = 0; i < 500; i++) {
                const uri = uri_1.URI.parse('sc:hightower#' + i);
                assert.strictEqual(collection.has(uri), true);
                assert.strictEqual(collection.get(uri).length, 1);
            }
        });
        test('diagnostic capping (max per file)', function () {
            let lastEntries;
            const collection = new extHostDiagnostics_1.DiagnosticCollection('test', 'test', 100, 250, versionProvider, resources_1.extUri, new class extends DiagnosticsShape {
                $changeMany(owner, entries) {
                    lastEntries = entries;
                    return super.$changeMany(owner, entries);
                }
            }, new event_1.Emitter());
            const uri = uri_1.URI.parse('aa:bb');
            const diagnostics = [];
            for (let i = 0; i < 500; i++) {
                diagnostics.push(new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(i, 0, i + 1, 0), `error#${i}`, i < 300
                    ? extHostTypes_1.DiagnosticSeverity.Warning
                    : extHostTypes_1.DiagnosticSeverity.Error));
            }
            collection.set(uri, diagnostics);
            assert.strictEqual(collection.get(uri).length, 500);
            assert.strictEqual(lastEntries.length, 1);
            assert.strictEqual(lastEntries[0][1].length, 251);
            assert.strictEqual(lastEntries[0][1][0].severity, markers_1.MarkerSeverity.Error);
            assert.strictEqual(lastEntries[0][1][200].severity, markers_1.MarkerSeverity.Warning);
            assert.strictEqual(lastEntries[0][1][250].severity, markers_1.MarkerSeverity.Info);
        });
        test('diagnostic capping (max files)', function () {
            let lastEntries;
            const collection = new extHostDiagnostics_1.DiagnosticCollection('test', 'test', 2, 1, versionProvider, resources_1.extUri, new class extends DiagnosticsShape {
                $changeMany(owner, entries) {
                    lastEntries = entries;
                    return super.$changeMany(owner, entries);
                }
            }, new event_1.Emitter());
            const diag = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'Hello');
            collection.set([
                [uri_1.URI.parse('aa:bb1'), [diag]],
                [uri_1.URI.parse('aa:bb2'), [diag]],
                [uri_1.URI.parse('aa:bb3'), [diag]],
                [uri_1.URI.parse('aa:bb4'), [diag]],
            ]);
            assert.strictEqual(lastEntries.length, 3); // goes above the limit and then stops
        });
        test('diagnostic eventing', async function () {
            const emitter = new event_1.Emitter();
            const collection = new extHostDiagnostics_1.DiagnosticCollection('ddd', 'test', 100, 100, versionProvider, resources_1.extUri, new DiagnosticsShape(), emitter);
            const diag1 = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(1, 1, 2, 3), 'diag1');
            const diag2 = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(1, 1, 2, 3), 'diag2');
            const diag3 = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(1, 1, 2, 3), 'diag3');
            let p = event_1.Event.toPromise(emitter.event).then(a => {
                assert.strictEqual(a.length, 1);
                assert.strictEqual(a[0].toString(), 'aa:bb');
                assert.ok(uri_1.URI.isUri(a[0]));
            });
            collection.set(uri_1.URI.parse('aa:bb'), []);
            await p;
            p = event_1.Event.toPromise(emitter.event).then(e => {
                assert.strictEqual(e.length, 2);
                assert.ok(uri_1.URI.isUri(e[0]));
                assert.ok(uri_1.URI.isUri(e[1]));
                assert.strictEqual(e[0].toString(), 'aa:bb');
                assert.strictEqual(e[1].toString(), 'aa:cc');
            });
            collection.set([
                [uri_1.URI.parse('aa:bb'), [diag1]],
                [uri_1.URI.parse('aa:cc'), [diag2, diag3]],
            ]);
            await p;
            p = event_1.Event.toPromise(emitter.event).then(e => {
                assert.strictEqual(e.length, 2);
                assert.ok(uri_1.URI.isUri(e[0]));
                assert.ok(uri_1.URI.isUri(e[1]));
            });
            collection.clear();
            await p;
        });
        test('vscode.languages.onDidChangeDiagnostics Does Not Provide Document URI #49582', async function () {
            const emitter = new event_1.Emitter();
            const collection = new extHostDiagnostics_1.DiagnosticCollection('ddd', 'test', 100, 100, versionProvider, resources_1.extUri, new DiagnosticsShape(), emitter);
            const diag1 = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(1, 1, 2, 3), 'diag1');
            // delete
            collection.set(uri_1.URI.parse('aa:bb'), [diag1]);
            let p = event_1.Event.toPromise(emitter.event).then(e => {
                assert.strictEqual(e[0].toString(), 'aa:bb');
            });
            collection.delete(uri_1.URI.parse('aa:bb'));
            await p;
            // set->undefined (as delete)
            collection.set(uri_1.URI.parse('aa:bb'), [diag1]);
            p = event_1.Event.toPromise(emitter.event).then(e => {
                assert.strictEqual(e[0].toString(), 'aa:bb');
            });
            collection.set(uri_1.URI.parse('aa:bb'), undefined);
            await p;
        });
        test('diagnostics with related information', function (done) {
            const collection = new extHostDiagnostics_1.DiagnosticCollection('ddd', 'test', 100, 100, versionProvider, resources_1.extUri, new class extends DiagnosticsShape {
                $changeMany(owner, entries) {
                    const [[, data]] = entries;
                    assert.strictEqual(entries.length, 1);
                    assert.strictEqual(data.length, 1);
                    const [diag] = data;
                    assert.strictEqual(diag.relatedInformation.length, 2);
                    assert.strictEqual(diag.relatedInformation[0].message, 'more1');
                    assert.strictEqual(diag.relatedInformation[1].message, 'more2');
                    done();
                }
            }, new event_1.Emitter());
            const diag = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'Foo');
            diag.relatedInformation = [
                new extHostTypes_1.DiagnosticRelatedInformation(new extHostTypes_1.Location(uri_1.URI.parse('cc:dd'), new extHostTypes_1.Range(0, 0, 0, 0)), 'more1'),
                new extHostTypes_1.DiagnosticRelatedInformation(new extHostTypes_1.Location(uri_1.URI.parse('cc:ee'), new extHostTypes_1.Range(0, 0, 0, 0)), 'more2')
            ];
            collection.set(uri_1.URI.parse('aa:bb'), [diag]);
        });
        test('vscode.languages.getDiagnostics appears to return old diagnostics in some circumstances #54359', function () {
            const ownerHistory = [];
            const diags = new extHostDiagnostics_1.ExtHostDiagnostics(new class {
                getProxy(id) {
                    return new class DiagnosticsShape {
                        $clear(owner) {
                            ownerHistory.push(owner);
                        }
                    };
                }
                set() {
                    return null;
                }
                dispose() { }
                assertRegistered() {
                }
                drain() {
                    return undefined;
                }
            }, new log_1.NullLogService(), fileSystemInfoService, new class extends (0, mock_1.mock)() {
                getDocument() {
                    return undefined;
                }
            });
            const collection1 = diags.createDiagnosticCollection(extensions_1.nullExtensionDescription.identifier, 'foo');
            const collection2 = diags.createDiagnosticCollection(extensions_1.nullExtensionDescription.identifier, 'foo'); // warns, uses a different owner
            collection1.clear();
            collection2.clear();
            assert.strictEqual(ownerHistory.length, 2);
            assert.strictEqual(ownerHistory[0], 'foo');
            assert.strictEqual(ownerHistory[1], 'foo0');
        });
        test('Error updating diagnostics from extension #60394', function () {
            let callCount = 0;
            const collection = new extHostDiagnostics_1.DiagnosticCollection('ddd', 'test', 100, 100, versionProvider, resources_1.extUri, new class extends DiagnosticsShape {
                $changeMany(owner, entries) {
                    callCount += 1;
                }
            }, new event_1.Emitter());
            const array = [];
            const diag1 = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'Foo');
            const diag2 = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'Bar');
            array.push(diag1, diag2);
            collection.set(uri_1.URI.parse('test:me'), array);
            assert.strictEqual(callCount, 1);
            collection.set(uri_1.URI.parse('test:me'), array);
            assert.strictEqual(callCount, 2); // equal array
            array.push(diag2);
            collection.set(uri_1.URI.parse('test:me'), array);
            assert.strictEqual(callCount, 3); // same but un-equal array
        });
        test('Version id is set whenever possible', function () {
            const all = [];
            const collection = new extHostDiagnostics_1.DiagnosticCollection('ddd', 'test', 100, 100, uri => {
                return 7;
            }, resources_1.extUri, new class extends DiagnosticsShape {
                $changeMany(_owner, entries) {
                    all.push(...entries);
                }
            }, new event_1.Emitter());
            const array = [];
            const diag1 = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'Foo');
            const diag2 = new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 1, 1), 'Bar');
            array.push(diag1, diag2);
            collection.set(uri_1.URI.parse('test:one'), array);
            collection.set(uri_1.URI.parse('test:two'), [diag1]);
            collection.set(uri_1.URI.parse('test:three'), [diag2]);
            const allVersions = all.map(tuple => tuple[1].map(t => t.modelVersionId)).flat();
            assert.deepStrictEqual(allVersions, [7, 7, 7, 7]);
        });
        test('Diagnostics created by tasks aren\'t accessible to extensions #47292', async function () {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({}, async function () {
                const diags = new extHostDiagnostics_1.ExtHostDiagnostics(new class {
                    getProxy(id) {
                        return {};
                    }
                    set() {
                        return null;
                    }
                    dispose() { }
                    assertRegistered() {
                    }
                    drain() {
                        return undefined;
                    }
                }, new log_1.NullLogService(), fileSystemInfoService, new class extends (0, mock_1.mock)() {
                    getDocument() {
                        return undefined;
                    }
                });
                //
                const uri = uri_1.URI.parse('foo:bar');
                const data = [{
                        message: 'message',
                        startLineNumber: 1,
                        startColumn: 1,
                        endLineNumber: 1,
                        endColumn: 1,
                        severity: markers_1.MarkerSeverity.Info
                    }];
                const p1 = event_1.Event.toPromise(diags.onDidChangeDiagnostics);
                diags.$acceptMarkersChange([[uri, data]]);
                await p1;
                assert.strictEqual(diags.getDiagnostics(uri).length, 1);
                const p2 = event_1.Event.toPromise(diags.onDidChangeDiagnostics);
                diags.$acceptMarkersChange([[uri, []]]);
                await p2;
                assert.strictEqual(diags.getDiagnostics(uri).length, 0);
            });
        });
        test('languages.getDiagnostics doesn\'t handle case insensitivity correctly #128198', function () {
            const diags = new extHostDiagnostics_1.ExtHostDiagnostics(new class {
                getProxy(id) {
                    return new DiagnosticsShape();
                }
                set() {
                    return null;
                }
                dispose() { }
                assertRegistered() {
                }
                drain() {
                    return undefined;
                }
            }, new log_1.NullLogService(), new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.extUri = new resources_1.ExtUri(uri => uri.scheme === 'insensitive');
                }
            }, new class extends (0, mock_1.mock)() {
                getDocument() {
                    return undefined;
                }
            });
            const col = diags.createDiagnosticCollection(extensions_1.nullExtensionDescription.identifier);
            const uriSensitive = uri_1.URI.from({ scheme: 'foo', path: '/SOME/path' });
            const uriSensitiveCaseB = uriSensitive.with({ path: uriSensitive.path.toUpperCase() });
            const uriInSensitive = uri_1.URI.from({ scheme: 'insensitive', path: '/SOME/path' });
            const uriInSensitiveUpper = uriInSensitive.with({ path: uriInSensitive.path.toUpperCase() });
            col.set(uriSensitive, [new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 0, 0), 'sensitive')]);
            col.set(uriInSensitive, [new extHostTypes_1.Diagnostic(new extHostTypes_1.Range(0, 0, 0, 0), 'insensitive')]);
            // collection itself honours casing
            assert.strictEqual(col.get(uriSensitive)?.length, 1);
            assert.strictEqual(col.get(uriSensitiveCaseB)?.length, 0);
            assert.strictEqual(col.get(uriInSensitive)?.length, 1);
            assert.strictEqual(col.get(uriInSensitiveUpper)?.length, 1);
            // languages.getDiagnostics honours casing
            assert.strictEqual(diags.getDiagnostics(uriSensitive)?.length, 1);
            assert.strictEqual(diags.getDiagnostics(uriSensitiveCaseB)?.length, 0);
            assert.strictEqual(diags.getDiagnostics(uriInSensitive)?.length, 1);
            assert.strictEqual(diags.getDiagnostics(uriInSensitiveUpper)?.length, 1);
            const fromForEach = [];
            col.forEach(uri => fromForEach.push(uri));
            assert.strictEqual(fromForEach.length, 2);
            assert.strictEqual(fromForEach[0].toString(), uriSensitive.toString());
            assert.strictEqual(fromForEach[1].toString(), uriInSensitive.toString());
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERpYWdub3N0aWNzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvdGVzdC9icm93c2VyL2V4dEhvc3REaWFnbm9zdGljcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBbUJoRyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO1FBRWhDLE1BQU0sZ0JBQWlCLFNBQVEsSUFBQSxXQUFJLEdBQThCO1lBQ3ZELFdBQVcsQ0FBQyxLQUFhLEVBQUUsT0FBeUM7Z0JBQzVFLEVBQUU7WUFDSCxDQUFDO1lBQ1EsTUFBTSxDQUFDLEtBQWE7Z0JBQzVCLEVBQUU7WUFDSCxDQUFDO1NBQ0Q7UUFFRCxNQUFNLHFCQUFxQixHQUFHLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUEwQjtZQUE1Qzs7Z0JBQ2YsV0FBTSxHQUFHLGtCQUFNLENBQUM7WUFDbkMsQ0FBQztTQUFBLENBQUM7UUFFRixNQUFNLGVBQWUsR0FBRyxDQUFDLEdBQVEsRUFBc0IsRUFBRTtZQUN4RCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDLENBQUM7UUFFRixNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsSUFBSSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7WUFFekIsTUFBTSxVQUFVLEdBQUcsSUFBSSx5Q0FBb0IsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsZUFBZSxFQUFFLGtCQUFNLEVBQUUsSUFBSSxnQkFBZ0IsRUFBRSxFQUFFLElBQUksZUFBTyxFQUFFLENBQUMsQ0FBQztZQUV0SSxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckIsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsWUFBWTtZQUNsQyxN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