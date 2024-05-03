/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/arrays", "vs/base/common/extpath", "vs/base/common/stopwatch", "vs/base/common/ternarySearchTree", "vs/base/common/uri", "vs/base/test/common/utils"], function (require, exports, assert, arrays_1, extpath_1, stopwatch_1, ternarySearchTree_1, uri_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Ternary Search Tree', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('PathIterator', () => {
            const iter = new ternarySearchTree_1.PathIterator();
            iter.reset('file:///usr/bin/file.txt');
            assert.strictEqual(iter.value(), 'file:');
            assert.strictEqual(iter.hasNext(), true);
            assert.strictEqual(iter.cmp('file:'), 0);
            assert.ok(iter.cmp('a') < 0);
            assert.ok(iter.cmp('aile:') < 0);
            assert.ok(iter.cmp('z') > 0);
            assert.ok(iter.cmp('zile:') > 0);
            iter.next();
            assert.strictEqual(iter.value(), 'usr');
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            assert.strictEqual(iter.value(), 'bin');
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            assert.strictEqual(iter.value(), 'file.txt');
            assert.strictEqual(iter.hasNext(), false);
            iter.next();
            assert.strictEqual(iter.value(), '');
            assert.strictEqual(iter.hasNext(), false);
            iter.next();
            assert.strictEqual(iter.value(), '');
            assert.strictEqual(iter.hasNext(), false);
            //
            iter.reset('/foo/bar/');
            assert.strictEqual(iter.value(), 'foo');
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            assert.strictEqual(iter.value(), 'bar');
            assert.strictEqual(iter.hasNext(), false);
        });
        test('URIIterator', function () {
            const iter = new ternarySearchTree_1.UriIterator(() => false, () => false);
            iter.reset(uri_1.URI.parse('file:///usr/bin/file.txt'));
            assert.strictEqual(iter.value(), 'file');
            // assert.strictEqual(iter.cmp('FILE'), 0);
            assert.strictEqual(iter.cmp('file'), 0);
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            assert.strictEqual(iter.value(), 'usr');
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            assert.strictEqual(iter.value(), 'bin');
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            assert.strictEqual(iter.value(), 'file.txt');
            assert.strictEqual(iter.hasNext(), false);
            iter.reset(uri_1.URI.parse('file://share/usr/bin/file.txt?foo'));
            // scheme
            assert.strictEqual(iter.value(), 'file');
            // assert.strictEqual(iter.cmp('FILE'), 0);
            assert.strictEqual(iter.cmp('file'), 0);
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            // authority
            assert.strictEqual(iter.value(), 'share');
            assert.strictEqual(iter.cmp('SHARe'), 0);
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            // path
            assert.strictEqual(iter.value(), 'usr');
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            // path
            assert.strictEqual(iter.value(), 'bin');
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            // path
            assert.strictEqual(iter.value(), 'file.txt');
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            // query
            assert.strictEqual(iter.value(), 'foo');
            assert.strictEqual(iter.cmp('z') > 0, true);
            assert.strictEqual(iter.cmp('a') < 0, true);
            assert.strictEqual(iter.hasNext(), false);
        });
        test('URIIterator - ignore query/fragment', function () {
            const iter = new ternarySearchTree_1.UriIterator(() => false, () => true);
            iter.reset(uri_1.URI.parse('file:///usr/bin/file.txt'));
            assert.strictEqual(iter.value(), 'file');
            // assert.strictEqual(iter.cmp('FILE'), 0);
            assert.strictEqual(iter.cmp('file'), 0);
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            assert.strictEqual(iter.value(), 'usr');
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            assert.strictEqual(iter.value(), 'bin');
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            assert.strictEqual(iter.value(), 'file.txt');
            assert.strictEqual(iter.hasNext(), false);
            iter.reset(uri_1.URI.parse('file://share/usr/bin/file.txt?foo'));
            // scheme
            assert.strictEqual(iter.value(), 'file');
            // assert.strictEqual(iter.cmp('FILE'), 0);
            assert.strictEqual(iter.cmp('file'), 0);
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            // authority
            assert.strictEqual(iter.value(), 'share');
            assert.strictEqual(iter.cmp('SHARe'), 0);
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            // path
            assert.strictEqual(iter.value(), 'usr');
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            // path
            assert.strictEqual(iter.value(), 'bin');
            assert.strictEqual(iter.hasNext(), true);
            iter.next();
            // path
            assert.strictEqual(iter.value(), 'file.txt');
            assert.strictEqual(iter.hasNext(), false);
        });
        function assertTstDfs(trie, ...elements) {
            assert.ok(trie._isBalanced(), 'TST is not balanced');
            let i = 0;
            for (const [key, value] of trie) {
                const expected = elements[i++];
                assert.ok(expected);
                assert.strictEqual(key, expected[0]);
                assert.strictEqual(value, expected[1]);
            }
            assert.strictEqual(i, elements.length);
            const map = new Map();
            for (const [key, value] of elements) {
                map.set(key, value);
            }
            map.forEach((value, key) => {
                assert.strictEqual(trie.get(key), value);
            });
            // forEach
            let forEachCount = 0;
            trie.forEach((element, key) => {
                assert.strictEqual(element, map.get(key));
                forEachCount++;
            });
            assert.strictEqual(map.size, forEachCount);
            // iterator
            let iterCount = 0;
            for (const [key, value] of trie) {
                assert.strictEqual(value, map.get(key));
                iterCount++;
            }
            assert.strictEqual(map.size, iterCount);
        }
        test('TernarySearchTree - set', function () {
            let trie = ternarySearchTree_1.TernarySearchTree.forStrings();
            trie.set('foobar', 1);
            trie.set('foobaz', 2);
            assertTstDfs(trie, ['foobar', 1], ['foobaz', 2]); // longer
            trie = ternarySearchTree_1.TernarySearchTree.forStrings();
            trie.set('foobar', 1);
            trie.set('fooba', 2);
            assertTstDfs(trie, ['fooba', 2], ['foobar', 1]); // shorter
            trie = ternarySearchTree_1.TernarySearchTree.forStrings();
            trie.set('foo', 1);
            trie.set('foo', 2);
            assertTstDfs(trie, ['foo', 2]);
            trie = ternarySearchTree_1.TernarySearchTree.forStrings();
            trie.set('foo', 1);
            trie.set('foobar', 2);
            trie.set('bar', 3);
            trie.set('foob', 4);
            trie.set('bazz', 5);
            assertTstDfs(trie, ['bar', 3], ['bazz', 5], ['foo', 1], ['foob', 4], ['foobar', 2]);
        });
        test('TernarySearchTree - findLongestMatch', function () {
            const trie = ternarySearchTree_1.TernarySearchTree.forStrings();
            trie.set('foo', 1);
            trie.set('foobar', 2);
            trie.set('foobaz', 3);
            assertTstDfs(trie, ['foo', 1], ['foobar', 2], ['foobaz', 3]);
            assert.strictEqual(trie.findSubstr('f'), undefined);
            assert.strictEqual(trie.findSubstr('z'), undefined);
            assert.strictEqual(trie.findSubstr('foo'), 1);
            assert.strictEqual(trie.findSubstr('fooö'), 1);
            assert.strictEqual(trie.findSubstr('fooba'), 1);
            assert.strictEqual(trie.findSubstr('foobarr'), 2);
            assert.strictEqual(trie.findSubstr('foobazrr'), 3);
        });
        test('TernarySearchTree - basics', function () {
            const trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.StringIterator());
            trie.set('foo', 1);
            trie.set('bar', 2);
            trie.set('foobar', 3);
            assertTstDfs(trie, ['bar', 2], ['foo', 1], ['foobar', 3]);
            assert.strictEqual(trie.get('foo'), 1);
            assert.strictEqual(trie.get('bar'), 2);
            assert.strictEqual(trie.get('foobar'), 3);
            assert.strictEqual(trie.get('foobaz'), undefined);
            assert.strictEqual(trie.get('foobarr'), undefined);
            assert.strictEqual(trie.findSubstr('fo'), undefined);
            assert.strictEqual(trie.findSubstr('foo'), 1);
            assert.strictEqual(trie.findSubstr('foooo'), 1);
            trie.delete('foobar');
            trie.delete('bar');
            assert.strictEqual(trie.get('foobar'), undefined);
            assert.strictEqual(trie.get('bar'), undefined);
            trie.set('foobar', 17);
            trie.set('barr', 18);
            assert.strictEqual(trie.get('foobar'), 17);
            assert.strictEqual(trie.get('barr'), 18);
            assert.strictEqual(trie.get('bar'), undefined);
        });
        test('TernarySearchTree - delete & cleanup', function () {
            // normal delete
            let trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.StringIterator());
            trie.set('foo', 1);
            trie.set('foobar', 2);
            trie.set('bar', 3);
            assertTstDfs(trie, ['bar', 3], ['foo', 1], ['foobar', 2]);
            trie.delete('foo');
            assertTstDfs(trie, ['bar', 3], ['foobar', 2]);
            trie.delete('foobar');
            assertTstDfs(trie, ['bar', 3]);
            // superstr-delete
            trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.StringIterator());
            trie.set('foo', 1);
            trie.set('foobar', 2);
            trie.set('bar', 3);
            trie.set('foobarbaz', 4);
            trie.deleteSuperstr('foo');
            assertTstDfs(trie, ['bar', 3], ['foo', 1]);
            trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.StringIterator());
            trie.set('foo', 1);
            trie.set('foobar', 2);
            trie.set('bar', 3);
            trie.set('foobarbaz', 4);
            trie.deleteSuperstr('fo');
            assertTstDfs(trie, ['bar', 3]);
            // trie = new TernarySearchTree<string, number>(new StringIterator());
            // trie.set('foo', 1);
            // trie.set('foobar', 2);
            // trie.set('bar', 3);
            // trie.deleteSuperStr('f');
            // assertTernarySearchTree(trie, ['bar', 3]);
        });
        test('TernarySearchTree (PathSegments) - basics', function () {
            const trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.PathIterator());
            trie.set('/user/foo/bar', 1);
            trie.set('/user/foo', 2);
            trie.set('/user/foo/flip/flop', 3);
            assert.strictEqual(trie.get('/user/foo/bar'), 1);
            assert.strictEqual(trie.get('/user/foo'), 2);
            assert.strictEqual(trie.get('/user//foo'), 2);
            assert.strictEqual(trie.get('/user\\foo'), 2);
            assert.strictEqual(trie.get('/user/foo/flip/flop'), 3);
            assert.strictEqual(trie.findSubstr('/user/bar'), undefined);
            assert.strictEqual(trie.findSubstr('/user/foo'), 2);
            assert.strictEqual(trie.findSubstr('\\user\\foo'), 2);
            assert.strictEqual(trie.findSubstr('/user//foo'), 2);
            assert.strictEqual(trie.findSubstr('/user/foo/ba'), 2);
            assert.strictEqual(trie.findSubstr('/user/foo/far/boo'), 2);
            assert.strictEqual(trie.findSubstr('/user/foo/bar'), 1);
            assert.strictEqual(trie.findSubstr('/user/foo/bar/far/boo'), 1);
        });
        test('TernarySearchTree - (AVL) set', function () {
            {
                // rotate left
                const trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.PathIterator());
                trie.set('/fileA', 1);
                trie.set('/fileB', 2);
                trie.set('/fileC', 3);
                assertTstDfs(trie, ['/fileA', 1], ['/fileB', 2], ['/fileC', 3]);
            }
            {
                // rotate left (inside middle)
                const trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.PathIterator());
                trie.set('/foo/fileA', 1);
                trie.set('/foo/fileB', 2);
                trie.set('/foo/fileC', 3);
                assertTstDfs(trie, ['/foo/fileA', 1], ['/foo/fileB', 2], ['/foo/fileC', 3]);
            }
            {
                // rotate right
                const trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.PathIterator());
                trie.set('/fileC', 3);
                trie.set('/fileB', 2);
                trie.set('/fileA', 1);
                assertTstDfs(trie, ['/fileA', 1], ['/fileB', 2], ['/fileC', 3]);
            }
            {
                // rotate right (inside middle)
                const trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.PathIterator());
                trie.set('/mid/fileC', 3);
                trie.set('/mid/fileB', 2);
                trie.set('/mid/fileA', 1);
                assertTstDfs(trie, ['/mid/fileA', 1], ['/mid/fileB', 2], ['/mid/fileC', 3]);
            }
            {
                // rotate right, left
                const trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.PathIterator());
                trie.set('/fileD', 7);
                trie.set('/fileB', 2);
                trie.set('/fileG', 42);
                trie.set('/fileF', 24);
                trie.set('/fileZ', 73);
                trie.set('/fileE', 15);
                assertTstDfs(trie, ['/fileB', 2], ['/fileD', 7], ['/fileE', 15], ['/fileF', 24], ['/fileG', 42], ['/fileZ', 73]);
            }
            {
                // rotate left, right
                const trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.PathIterator());
                trie.set('/fileJ', 42);
                trie.set('/fileZ', 73);
                trie.set('/fileE', 15);
                trie.set('/fileB', 2);
                trie.set('/fileF', 7);
                trie.set('/fileG', 1);
                assertTstDfs(trie, ['/fileB', 2], ['/fileE', 15], ['/fileF', 7], ['/fileG', 1], ['/fileJ', 42], ['/fileZ', 73]);
            }
        });
        test('TernarySearchTree - (BST) delete', function () {
            const trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.StringIterator());
            // delete root
            trie.set('d', 1);
            assertTstDfs(trie, ['d', 1]);
            trie.delete('d');
            assertTstDfs(trie);
            // delete node with two element
            trie.clear();
            trie.set('d', 1);
            trie.set('b', 1);
            trie.set('f', 1);
            assertTstDfs(trie, ['b', 1], ['d', 1], ['f', 1]);
            trie.delete('d');
            assertTstDfs(trie, ['b', 1], ['f', 1]);
            // single child node
            trie.clear();
            trie.set('d', 1);
            trie.set('b', 1);
            trie.set('f', 1);
            trie.set('e', 1);
            assertTstDfs(trie, ['b', 1], ['d', 1], ['e', 1], ['f', 1]);
            trie.delete('f');
            assertTstDfs(trie, ['b', 1], ['d', 1], ['e', 1]);
        });
        test('TernarySearchTree - (AVL) delete', function () {
            const trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.StringIterator());
            trie.clear();
            trie.set('d', 1);
            trie.set('b', 1);
            trie.set('f', 1);
            trie.set('e', 1);
            trie.set('z', 1);
            assertTstDfs(trie, ['b', 1], ['d', 1], ['e', 1], ['f', 1], ['z', 1]);
            // right, right
            trie.delete('b');
            assertTstDfs(trie, ['d', 1], ['e', 1], ['f', 1], ['z', 1]);
            trie.clear();
            trie.set('d', 1);
            trie.set('c', 1);
            trie.set('f', 1);
            trie.set('a', 1);
            trie.set('b', 1);
            assertTstDfs(trie, ['a', 1], ['b', 1], ['c', 1], ['d', 1], ['f', 1]);
            // left, left
            trie.delete('f');
            assertTstDfs(trie, ['a', 1], ['b', 1], ['c', 1], ['d', 1]);
            // mid
            trie.clear();
            trie.set('a', 1);
            trie.set('ad', 1);
            trie.set('ab', 1);
            trie.set('af', 1);
            trie.set('ae', 1);
            trie.set('az', 1);
            assertTstDfs(trie, ['a', 1], ['ab', 1], ['ad', 1], ['ae', 1], ['af', 1], ['az', 1]);
            trie.delete('ab');
            assertTstDfs(trie, ['a', 1], ['ad', 1], ['ae', 1], ['af', 1], ['az', 1]);
            trie.delete('a');
            assertTstDfs(trie, ['ad', 1], ['ae', 1], ['af', 1], ['az', 1]);
        });
        test('TernarySearchTree: Cannot read property \'1\' of undefined #138284', function () {
            const keys = [
                uri_1.URI.parse('fake-fs:/C'),
                uri_1.URI.parse('fake-fs:/A'),
                uri_1.URI.parse('fake-fs:/D'),
                uri_1.URI.parse('fake-fs:/B'),
            ];
            const tst = ternarySearchTree_1.TernarySearchTree.forUris();
            for (const item of keys) {
                tst.set(item, true);
            }
            assert.ok(tst._isBalanced());
            tst.delete(keys[0]);
            assert.ok(tst._isBalanced());
        });
        test('TernarySearchTree: Cannot read property \'1\' of undefined #138284 (simple)', function () {
            const keys = ['C', 'A', 'D', 'B',];
            const tst = ternarySearchTree_1.TernarySearchTree.forStrings();
            for (const item of keys) {
                tst.set(item, true);
            }
            assertTstDfs(tst, ['A', true], ['B', true], ['C', true], ['D', true]);
            tst.delete(keys[0]);
            assertTstDfs(tst, ['A', true], ['B', true], ['D', true]);
            {
                const tst = ternarySearchTree_1.TernarySearchTree.forStrings();
                tst.set('C', true);
                tst.set('A', true);
                tst.set('B', true);
                assertTstDfs(tst, ['A', true], ['B', true], ['C', true]);
            }
        });
        test('TernarySearchTree: Cannot read property \'1\' of undefined #138284 (random)', function () {
            for (let round = 10; round >= 0; round--) {
                const keys = [];
                for (let i = 0; i < 100; i++) {
                    keys.push(uri_1.URI.from({ scheme: 'fake-fs', path: (0, extpath_1.randomPath)(undefined, undefined, 10) }));
                }
                const tst = ternarySearchTree_1.TernarySearchTree.forUris();
                for (const item of keys) {
                    tst.set(item, true);
                    assert.ok(tst._isBalanced(), `SET${item}|${keys.map(String).join()}`);
                }
                for (const item of keys) {
                    tst.delete(item);
                    assert.ok(tst._isBalanced(), `DEL${item}|${keys.map(String).join()}`);
                }
            }
        });
        test('TernarySearchTree: Cannot read properties of undefined (reading \'length\'): #161618 (simple)', function () {
            const raw = 'config.debug.toolBarLocation,floating,config.editor.renderControlCharacters,true,config.editor.renderWhitespace,selection,config.files.autoSave,off,config.git.enabled,true,config.notebook.globalToolbar,true,config.terminal.integrated.tabs.enabled,true,config.terminal.integrated.tabs.showActions,singleTerminalOrNarrow,config.terminal.integrated.tabs.showActiveTerminal,singleTerminalOrNarrow,config.workbench.activityBar.visible,true,config.workbench.experimental.settingsProfiles.enabled,true,config.workbench.layoutControl.type,both,config.workbench.sideBar.location,left,config.workbench.statusBar.visible,true';
            const array = raw.split(',');
            const tuples = [];
            for (let i = 0; i < array.length; i += 2) {
                tuples.push([array[i], array[i + 1]]);
            }
            const map = ternarySearchTree_1.TernarySearchTree.forConfigKeys();
            map.fill(tuples);
            assert.strictEqual([...map].join(), raw);
            assert.ok(map.has('config.editor.renderWhitespace'));
            const len = [...map].length;
            map.delete('config.editor.renderWhitespace');
            assert.ok(map._isBalanced());
            assert.strictEqual([...map].length, len - 1);
        });
        test('TernarySearchTree: Cannot read properties of undefined (reading \'length\'): #161618 (random)', function () {
            const raw = 'config.debug.toolBarLocation,floating,config.editor.renderControlCharacters,true,config.editor.renderWhitespace,selection,config.files.autoSave,off,config.git.enabled,true,config.notebook.globalToolbar,true,config.terminal.integrated.tabs.enabled,true,config.terminal.integrated.tabs.showActions,singleTerminalOrNarrow,config.terminal.integrated.tabs.showActiveTerminal,singleTerminalOrNarrow,config.workbench.activityBar.visible,true,config.workbench.experimental.settingsProfiles.enabled,true,config.workbench.layoutControl.type,both,config.workbench.sideBar.location,left,config.workbench.statusBar.visible,true';
            const array = raw.split(',');
            const tuples = [];
            for (let i = 0; i < array.length; i += 2) {
                tuples.push([array[i], array[i + 1]]);
            }
            for (let round = 100; round >= 0; round--) {
                (0, arrays_1.shuffle)(tuples);
                const map = ternarySearchTree_1.TernarySearchTree.forConfigKeys();
                map.fill(tuples);
                assert.strictEqual([...map].join(), raw);
                assert.ok(map.has('config.editor.renderWhitespace'));
                const len = [...map].length;
                map.delete('config.editor.renderWhitespace');
                assert.ok(map._isBalanced());
                assert.strictEqual([...map].length, len - 1);
            }
        });
        test('TernarySearchTree (PathSegments) - lookup', function () {
            const map = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.PathIterator());
            map.set('/user/foo/bar', 1);
            map.set('/user/foo', 2);
            map.set('/user/foo/flip/flop', 3);
            assert.strictEqual(map.get('/foo'), undefined);
            assert.strictEqual(map.get('/user'), undefined);
            assert.strictEqual(map.get('/user/foo'), 2);
            assert.strictEqual(map.get('/user/foo/bar'), 1);
            assert.strictEqual(map.get('/user/foo/bar/boo'), undefined);
        });
        test('TernarySearchTree (PathSegments) - superstr', function () {
            const map = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.PathIterator());
            map.set('/user/foo/bar', 1);
            map.set('/user/foo', 2);
            map.set('/user/foo/flip/flop', 3);
            map.set('/usr/foo', 4);
            let item;
            let iter = map.findSuperstr('/user');
            item = iter.next();
            assert.strictEqual(item.value[1], 2);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value[1], 1);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value[1], 3);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value, undefined);
            assert.strictEqual(item.done, true);
            iter = map.findSuperstr('/usr');
            item = iter.next();
            assert.strictEqual(item.value[1], 4);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value, undefined);
            assert.strictEqual(item.done, true);
            assert.strictEqual(map.findSuperstr('/not'), undefined);
            assert.strictEqual(map.findSuperstr('/us'), undefined);
            assert.strictEqual(map.findSuperstr('/usrr'), undefined);
            assert.strictEqual(map.findSuperstr('/userr'), undefined);
        });
        test('TernarySearchTree (PathSegments) - delete_superstr', function () {
            const map = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.PathIterator());
            map.set('/user/foo/bar', 1);
            map.set('/user/foo', 2);
            map.set('/user/foo/flip/flop', 3);
            map.set('/usr/foo', 4);
            assertTstDfs(map, ['/user/foo', 2], ['/user/foo/bar', 1], ['/user/foo/flip/flop', 3], ['/usr/foo', 4]);
            // not a segment
            map.deleteSuperstr('/user/fo');
            assertTstDfs(map, ['/user/foo', 2], ['/user/foo/bar', 1], ['/user/foo/flip/flop', 3], ['/usr/foo', 4]);
            // delete a segment
            map.set('/user/foo/bar', 1);
            map.set('/user/foo', 2);
            map.set('/user/foo/flip/flop', 3);
            map.set('/usr/foo', 4);
            map.deleteSuperstr('/user/foo');
            assertTstDfs(map, ['/user/foo', 2], ['/usr/foo', 4]);
        });
        test('TernarySearchTree (URI) - basics', function () {
            const trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.UriIterator(() => false, () => false));
            trie.set(uri_1.URI.file('/user/foo/bar'), 1);
            trie.set(uri_1.URI.file('/user/foo'), 2);
            trie.set(uri_1.URI.file('/user/foo/flip/flop'), 3);
            assert.strictEqual(trie.get(uri_1.URI.file('/user/foo/bar')), 1);
            assert.strictEqual(trie.get(uri_1.URI.file('/user/foo')), 2);
            assert.strictEqual(trie.get(uri_1.URI.file('/user/foo/flip/flop')), 3);
            assert.strictEqual(trie.findSubstr(uri_1.URI.file('/user/bar')), undefined);
            assert.strictEqual(trie.findSubstr(uri_1.URI.file('/user/foo')), 2);
            assert.strictEqual(trie.findSubstr(uri_1.URI.file('/user/foo/ba')), 2);
            assert.strictEqual(trie.findSubstr(uri_1.URI.file('/user/foo/far/boo')), 2);
            assert.strictEqual(trie.findSubstr(uri_1.URI.file('/user/foo/bar')), 1);
            assert.strictEqual(trie.findSubstr(uri_1.URI.file('/user/foo/bar/far/boo')), 1);
        });
        test('TernarySearchTree (URI) - query parameters', function () {
            const trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.UriIterator(() => false, () => true));
            const root = uri_1.URI.parse('memfs:/?param=1');
            trie.set(root, 1);
            assert.strictEqual(trie.get(uri_1.URI.parse('memfs:/?param=1')), 1);
            assert.strictEqual(trie.findSubstr(uri_1.URI.parse('memfs:/?param=1')), 1);
            assert.strictEqual(trie.findSubstr(uri_1.URI.parse('memfs:/aaa?param=1')), 1);
        });
        test('TernarySearchTree (URI) - lookup', function () {
            const map = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.UriIterator(() => false, () => false));
            map.set(uri_1.URI.parse('http://foo.bar/user/foo/bar'), 1);
            map.set(uri_1.URI.parse('http://foo.bar/user/foo?query'), 2);
            map.set(uri_1.URI.parse('http://foo.bar/user/foo?QUERY'), 3);
            map.set(uri_1.URI.parse('http://foo.bar/user/foo/flip/flop'), 3);
            assert.strictEqual(map.get(uri_1.URI.parse('http://foo.bar/foo')), undefined);
            assert.strictEqual(map.get(uri_1.URI.parse('http://foo.bar/user')), undefined);
            assert.strictEqual(map.get(uri_1.URI.parse('http://foo.bar/user/foo/bar')), 1);
            assert.strictEqual(map.get(uri_1.URI.parse('http://foo.bar/user/foo?query')), 2);
            assert.strictEqual(map.get(uri_1.URI.parse('http://foo.bar/user/foo?Query')), undefined);
            assert.strictEqual(map.get(uri_1.URI.parse('http://foo.bar/user/foo?QUERY')), 3);
            assert.strictEqual(map.get(uri_1.URI.parse('http://foo.bar/user/foo/bar/boo')), undefined);
        });
        test('TernarySearchTree (URI) - lookup, casing', function () {
            const map = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.UriIterator(uri => /^https?$/.test(uri.scheme), () => false));
            map.set(uri_1.URI.parse('http://foo.bar/user/foo/bar'), 1);
            assert.strictEqual(map.get(uri_1.URI.parse('http://foo.bar/USER/foo/bar')), 1);
            map.set(uri_1.URI.parse('foo://foo.bar/user/foo/bar'), 1);
            assert.strictEqual(map.get(uri_1.URI.parse('foo://foo.bar/USER/foo/bar')), undefined);
        });
        test('TernarySearchTree (URI) - superstr', function () {
            const map = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.UriIterator(() => false, () => false));
            map.set(uri_1.URI.file('/user/foo/bar'), 1);
            map.set(uri_1.URI.file('/user/foo'), 2);
            map.set(uri_1.URI.file('/user/foo/flip/flop'), 3);
            map.set(uri_1.URI.file('/usr/foo'), 4);
            let item;
            let iter = map.findSuperstr(uri_1.URI.file('/user'));
            item = iter.next();
            assert.strictEqual(item.value[1], 2);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value[1], 1);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value[1], 3);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value, undefined);
            assert.strictEqual(item.done, true);
            iter = map.findSuperstr(uri_1.URI.file('/usr'));
            item = iter.next();
            assert.strictEqual(item.value[1], 4);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value, undefined);
            assert.strictEqual(item.done, true);
            iter = map.findSuperstr(uri_1.URI.file('/'));
            item = iter.next();
            assert.strictEqual(item.value[1], 2);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value[1], 1);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value[1], 3);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value[1], 4);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value, undefined);
            assert.strictEqual(item.done, true);
            assert.strictEqual(map.findSuperstr(uri_1.URI.file('/not')), undefined);
            assert.strictEqual(map.findSuperstr(uri_1.URI.file('/us')), undefined);
            assert.strictEqual(map.findSuperstr(uri_1.URI.file('/usrr')), undefined);
            assert.strictEqual(map.findSuperstr(uri_1.URI.file('/userr')), undefined);
        });
        test('TernarySearchTree (ConfigKeySegments) - basics', function () {
            const trie = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.ConfigKeysIterator());
            trie.set('config.foo.bar', 1);
            trie.set('config.foo', 2);
            trie.set('config.foo.flip.flop', 3);
            assert.strictEqual(trie.get('config.foo.bar'), 1);
            assert.strictEqual(trie.get('config.foo'), 2);
            assert.strictEqual(trie.get('config.foo.flip.flop'), 3);
            assert.strictEqual(trie.findSubstr('config.bar'), undefined);
            assert.strictEqual(trie.findSubstr('config.foo'), 2);
            assert.strictEqual(trie.findSubstr('config.foo.ba'), 2);
            assert.strictEqual(trie.findSubstr('config.foo.far.boo'), 2);
            assert.strictEqual(trie.findSubstr('config.foo.bar'), 1);
            assert.strictEqual(trie.findSubstr('config.foo.bar.far.boo'), 1);
        });
        test('TernarySearchTree (ConfigKeySegments) - lookup', function () {
            const map = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.ConfigKeysIterator());
            map.set('config.foo.bar', 1);
            map.set('config.foo', 2);
            map.set('config.foo.flip.flop', 3);
            assert.strictEqual(map.get('foo'), undefined);
            assert.strictEqual(map.get('config'), undefined);
            assert.strictEqual(map.get('config.foo'), 2);
            assert.strictEqual(map.get('config.foo.bar'), 1);
            assert.strictEqual(map.get('config.foo.bar.boo'), undefined);
        });
        test('TernarySearchTree (ConfigKeySegments) - superstr', function () {
            const map = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.ConfigKeysIterator());
            map.set('config.foo.bar', 1);
            map.set('config.foo', 2);
            map.set('config.foo.flip.flop', 3);
            map.set('boo', 4);
            let item;
            const iter = map.findSuperstr('config');
            item = iter.next();
            assert.strictEqual(item.value[1], 2);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value[1], 1);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value[1], 3);
            assert.strictEqual(item.done, false);
            item = iter.next();
            assert.strictEqual(item.value, undefined);
            assert.strictEqual(item.done, true);
            assert.strictEqual(map.findSuperstr('foo'), undefined);
            assert.strictEqual(map.findSuperstr('config.foo.no'), undefined);
            assert.strictEqual(map.findSuperstr('config.foop'), undefined);
        });
        test('TernarySearchTree (ConfigKeySegments) - delete_superstr', function () {
            const map = new ternarySearchTree_1.TernarySearchTree(new ternarySearchTree_1.ConfigKeysIterator());
            map.set('config.foo.bar', 1);
            map.set('config.foo', 2);
            map.set('config.foo.flip.flop', 3);
            map.set('boo', 4);
            assertTstDfs(map, ['boo', 4], ['config.foo', 2], ['config.foo.bar', 1], ['config.foo.flip.flop', 3]);
            // not a segment
            map.deleteSuperstr('config.fo');
            assertTstDfs(map, ['boo', 4], ['config.foo', 2], ['config.foo.bar', 1], ['config.foo.flip.flop', 3]);
            // delete a segment
            map.set('config.foo.bar', 1);
            map.set('config.foo', 2);
            map.set('config.foo.flip.flop', 3);
            map.set('config.boo', 4);
            map.deleteSuperstr('config.foo');
            assertTstDfs(map, ['boo', 4], ['config.foo', 2]);
        });
        test('TST, fill', function () {
            const tst = ternarySearchTree_1.TernarySearchTree.forStrings();
            const keys = ['foo', 'bar', 'bang', 'bazz'];
            Object.freeze(keys);
            tst.fill(true, keys);
            for (const key of keys) {
                assert.ok(tst.get(key), key);
            }
        });
    });
    suite.skip('TST, perf', function () {
        function createRandomUris(n) {
            const uris = [];
            function randomWord() {
                let result = '';
                const length = 4 + Math.floor(Math.random() * 4);
                for (let i = 0; i < length; i++) {
                    result += (Math.random() * 26 + 65).toString(36);
                }
                return result;
            }
            // generate 10000 random words
            const words = [];
            for (let i = 0; i < 10000; i++) {
                words.push(randomWord());
            }
            for (let i = 0; i < n; i++) {
                let len = 4 + Math.floor(Math.random() * 4);
                const segments = [];
                for (; len >= 0; len--) {
                    segments.push(words[Math.floor(Math.random() * words.length)]);
                }
                uris.push(uri_1.URI.from({ scheme: 'file', path: segments.join('/') }));
            }
            return uris;
        }
        let tree;
        let sampleUris = [];
        let candidates = [];
        suiteSetup(() => {
            const len = 50_000;
            sampleUris = createRandomUris(len);
            candidates = [...sampleUris.slice(0, len / 2), ...createRandomUris(len / 2)];
            (0, arrays_1.shuffle)(candidates);
        });
        setup(() => {
            tree = ternarySearchTree_1.TernarySearchTree.forUris();
            for (const uri of sampleUris) {
                tree.set(uri, true);
            }
        });
        const _profile = false;
        function perfTest(name, callback) {
            test(name, function () {
                if (_profile) {
                    console.profile(name);
                }
                const sw = new stopwatch_1.StopWatch();
                callback();
                console.log(name, sw.elapsed());
                if (_profile) {
                    console.profileEnd();
                }
            });
        }
        perfTest('TST, clear', function () {
            tree.clear();
        });
        perfTest('TST, insert', function () {
            const insertTree = ternarySearchTree_1.TernarySearchTree.forUris();
            for (const uri of sampleUris) {
                insertTree.set(uri, true);
            }
        });
        perfTest('TST, lookup', function () {
            let match = 0;
            for (const candidate of candidates) {
                if (tree.has(candidate)) {
                    match += 1;
                }
            }
            assert.strictEqual(match, sampleUris.length / 2);
        });
        perfTest('TST, substr', function () {
            let match = 0;
            for (const candidate of candidates) {
                if (tree.findSubstr(candidate)) {
                    match += 1;
                }
            }
            assert.strictEqual(match, sampleUris.length / 2);
        });
        perfTest('TST, superstr', function () {
            for (const candidate of candidates) {
                tree.findSuperstr(candidate);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybmFyeVNlYXJjaHRyZWUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi90ZXJuYXJ5U2VhcmNodHJlZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7UUFFakMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1lBQ3pCLE1BQU0sSUFBSSxHQUFHLElBQUksZ0NBQVksRUFBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztZQUV2QyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6QyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRWpDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNaLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXpDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNaLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXpDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNaLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNaLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNaLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTFDLEVBQUU7WUFDRixJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxXQUFX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QUFZLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQixZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0NBQWtDLEVBQUU7WUFFeEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxxQ0FBaUIsQ0FBaUIsSUFBSSxrQ0FBYyxFQUFFLENBQUMsQ0FBQztZQUV6RSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDYixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqQixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqQixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqQixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqQixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqQixZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFckUsZUFBZTtZQUNmLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakIsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTNELElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNiLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVyRSxhQUFhO1lBQ2IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQixZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFM0QsTUFBTTtZQUNOLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNiLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVwRixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xCLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV6RSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJ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Q0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyQyxJQUFJLEdBQUcsSUFBSyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3BCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckMsSUFBSSxHQUFHLElBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNwQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLElBQUksR0FBRyxJQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDcEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVwQyxJQUFJLEdBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNoQyxJQUFJLEdBQUcsSUFBSyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3BCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFckMsSUFBSSxHQUFHLElBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNwQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXBDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQztRQUdILElBQUksQ0FBQyxvREFBb0QsRUFBRTtZQUUxRCxNQUFNLEdBQUcsR0FBRyxJQUFJLHFDQUFpQixDQUFpQixJQUFJLGdDQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLEdBQUcsQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVCLEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLEdBQUcsQ0FBQyxHQUFHLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFdkIsWUFBWSxDQUFDLEdBQUcsRUFDZixDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFDaEIsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLEVBQ3BCLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxDQUFDLEVBQzFCLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUNmLENBQUM7WUFFRixnQkFBZ0I7WUFDaEIsR0FBRyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMvQixZQUFZLENBQUMsR0FBRyxFQUNmLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUNoQixDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsRUFDcEIsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUMsRUFDMUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQ2YsQ0FBQztZQUVGLG1CQUFtQjtZQUNuQixHQUFHLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QixHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFxQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLEdBQUcsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDaEMsWUFBWSxDQUFDLEdBQUcsRUFDZixDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFDaEIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQ2YsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtDQUFrQyxFQUFFO1lBQ3hDLE1BQU0sSUFBSSxHQUFHLElBQUkscUNBQWlCLENBQWMsSUFBSSwrQkFBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRTNGLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVqRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBRyxDQUFDLElBQUks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QUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXBDLElBQUksR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUUsQ0FBQztZQUMzQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFckMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXBDLElBQUksR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUUsQ0FBQztZQUN4QyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lB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