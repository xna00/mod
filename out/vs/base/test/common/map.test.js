/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/map", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/common/utils"], function (require, exports, assert, map_1, resources_1, uri_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Map', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('LinkedMap - Simple', () => {
            const map = new map_1.LinkedMap();
            map.set('ak', 'av');
            map.set('bk', 'bv');
            assert.deepStrictEqual([...map.keys()], ['ak', 'bk']);
            assert.deepStrictEqual([...map.values()], ['av', 'bv']);
            assert.strictEqual(map.first, 'av');
            assert.strictEqual(map.last, 'bv');
        });
        test('LinkedMap - Touch Old one', () => {
            const map = new map_1.LinkedMap();
            map.set('ak', 'av');
            map.set('ak', 'av', 1 /* Touch.AsOld */);
            assert.deepStrictEqual([...map.keys()], ['ak']);
            assert.deepStrictEqual([...map.values()], ['av']);
        });
        test('LinkedMap - Touch New one', () => {
            const map = new map_1.LinkedMap();
            map.set('ak', 'av');
            map.set('ak', 'av', 2 /* Touch.AsNew */);
            assert.deepStrictEqual([...map.keys()], ['ak']);
            assert.deepStrictEqual([...map.values()], ['av']);
        });
        test('LinkedMap - Touch Old two', () => {
            const map = new map_1.LinkedMap();
            map.set('ak', 'av');
            map.set('bk', 'bv');
            map.set('bk', 'bv', 1 /* Touch.AsOld */);
            assert.deepStrictEqual([...map.keys()], ['bk', 'ak']);
            assert.deepStrictEqual([...map.values()], ['bv', 'av']);
        });
        test('LinkedMap - Touch New two', () => {
            const map = new map_1.LinkedMap();
            map.set('ak', 'av');
            map.set('bk', 'bv');
            map.set('ak', 'av', 2 /* Touch.AsNew */);
            assert.deepStrictEqual([...map.keys()], ['bk', 'ak']);
            assert.deepStrictEqual([...map.values()], ['bv', 'av']);
        });
        test('LinkedMap - Touch Old from middle', () => {
            const map = new map_1.LinkedMap();
            map.set('ak', 'av');
            map.set('bk', 'bv');
            map.set('ck', 'cv');
            map.set('bk', 'bv', 1 /* Touch.AsOld */);
            assert.deepStrictEqual([...map.keys()], ['bk', 'ak', 'ck']);
            assert.deepStrictEqual([...map.values()], ['bv', 'av', 'cv']);
        });
        test('LinkedMap - Touch New from middle', () => {
            const map = new map_1.LinkedMap();
            map.set('ak', 'av');
            map.set('bk', 'bv');
            map.set('ck', 'cv');
            map.set('bk', 'bv', 2 /* Touch.AsNew */);
            assert.deepStrictEqual([...map.keys()], ['ak', 'ck', 'bk']);
            assert.deepStrictEqual([...map.values()], ['av', 'cv', 'bv']);
        });
        test('LinkedMap - basics', function () {
            const map = new map_1.LinkedMap();
            assert.strictEqual(map.size, 0);
            map.set('1', 1);
            map.set('2', '2');
            map.set('3', true);
            const obj = Object.create(null);
            map.set('4', obj);
            const date = Date.now();
            map.set('5', date);
            assert.strictEqual(map.size, 5);
            assert.strictEqual(map.get('1'), 1);
            assert.strictEqual(map.get('2'), '2');
            assert.strictEqual(map.get('3'), true);
            assert.strictEqual(map.get('4'), obj);
            assert.strictEqual(map.get('5'), date);
            assert.ok(!map.get('6'));
            map.delete('6');
            assert.strictEqual(map.size, 5);
            assert.strictEqual(map.delete('1'), true);
            assert.strictEqual(map.delete('2'), true);
            assert.strictEqual(map.delete('3'), true);
            assert.strictEqual(map.delete('4'), true);
            assert.strictEqual(map.delete('5'), true);
            assert.strictEqual(map.size, 0);
            assert.ok(!map.get('5'));
            assert.ok(!map.get('4'));
            assert.ok(!map.get('3'));
            assert.ok(!map.get('2'));
            assert.ok(!map.get('1'));
            map.set('1', 1);
            map.set('2', '2');
            map.set('3', true);
            assert.ok(map.has('1'));
            assert.strictEqual(map.get('1'), 1);
            assert.strictEqual(map.get('2'), '2');
            assert.strictEqual(map.get('3'), true);
            map.clear();
            assert.strictEqual(map.size, 0);
            assert.ok(!map.get('1'));
            assert.ok(!map.get('2'));
            assert.ok(!map.get('3'));
            assert.ok(!map.has('1'));
        });
        test('LinkedMap - Iterators', () => {
            const map = new map_1.LinkedMap();
            map.set(1, 1);
            map.set(2, 2);
            map.set(3, 3);
            for (const elem of map.keys()) {
                assert.ok(elem);
            }
            for (const elem of map.values()) {
                assert.ok(elem);
            }
            for (const elem of map.entries()) {
                assert.ok(elem);
            }
            {
                const keys = map.keys();
                const values = map.values();
                const entries = map.entries();
                map.get(1);
                keys.next();
                values.next();
                entries.next();
            }
            {
                const keys = map.keys();
                const values = map.values();
                const entries = map.entries();
                map.get(1, 2 /* Touch.AsNew */);
                let exceptions = 0;
                try {
                    keys.next();
                }
                catch (err) {
                    exceptions++;
                }
                try {
                    values.next();
                }
                catch (err) {
                    exceptions++;
                }
                try {
                    entries.next();
                }
                catch (err) {
                    exceptions++;
                }
                assert.strictEqual(exceptions, 3);
            }
        });
        test('LinkedMap - LRU Cache simple', () => {
            const cache = new map_1.LRUCache(5);
            [1, 2, 3, 4, 5].forEach(value => cache.set(value, value));
            assert.strictEqual(cache.size, 5);
            cache.set(6, 6);
            assert.strictEqual(cache.size, 5);
            assert.deepStrictEqual([...cache.keys()], [2, 3, 4, 5, 6]);
            cache.set(7, 7);
            assert.strictEqual(cache.size, 5);
            assert.deepStrictEqual([...cache.keys()], [3, 4, 5, 6, 7]);
            const values = [];
            [3, 4, 5, 6, 7].forEach(key => values.push(cache.get(key)));
            assert.deepStrictEqual(values, [3, 4, 5, 6, 7]);
        });
        test('LinkedMap - LRU Cache get', () => {
            const cache = new map_1.LRUCache(5);
            [1, 2, 3, 4, 5].forEach(value => cache.set(value, value));
            assert.strictEqual(cache.size, 5);
            assert.deepStrictEqual([...cache.keys()], [1, 2, 3, 4, 5]);
            cache.get(3);
            assert.deepStrictEqual([...cache.keys()], [1, 2, 4, 5, 3]);
            cache.peek(4);
            assert.deepStrictEqual([...cache.keys()], [1, 2, 4, 5, 3]);
            const values = [];
            [1, 2, 3, 4, 5].forEach(key => values.push(cache.get(key)));
            assert.deepStrictEqual(values, [1, 2, 3, 4, 5]);
        });
        test('LinkedMap - LRU Cache limit', () => {
            const cache = new map_1.LRUCache(10);
            for (let i = 1; i <= 10; i++) {
                cache.set(i, i);
            }
            assert.strictEqual(cache.size, 10);
            cache.limit = 5;
            assert.strictEqual(cache.size, 5);
            assert.deepStrictEqual([...cache.keys()], [6, 7, 8, 9, 10]);
            cache.limit = 20;
            assert.strictEqual(cache.size, 5);
            for (let i = 11; i <= 20; i++) {
                cache.set(i, i);
            }
            assert.deepStrictEqual(cache.size, 15);
            const values = [];
            for (let i = 6; i <= 20; i++) {
                values.push(cache.get(i));
                assert.strictEqual(cache.get(i), i);
            }
            assert.deepStrictEqual([...cache.values()], values);
        });
        test('LinkedMap - LRU Cache limit with ratio', () => {
            const cache = new map_1.LRUCache(10, 0.5);
            for (let i = 1; i <= 10; i++) {
                cache.set(i, i);
            }
            assert.strictEqual(cache.size, 10);
            cache.set(11, 11);
            assert.strictEqual(cache.size, 5);
            assert.deepStrictEqual([...cache.keys()], [7, 8, 9, 10, 11]);
            const values = [];
            [...cache.keys()].forEach(key => values.push(cache.get(key)));
            assert.deepStrictEqual(values, [7, 8, 9, 10, 11]);
            assert.deepStrictEqual([...cache.values()], values);
        });
        test('LinkedMap - toJSON / fromJSON', () => {
            let map = new map_1.LinkedMap();
            map.set('ak', 'av');
            map.set('bk', 'bv');
            map.set('ck', 'cv');
            const json = map.toJSON();
            map = new map_1.LinkedMap();
            map.fromJSON(json);
            let i = 0;
            map.forEach((value, key) => {
                if (i === 0) {
                    assert.strictEqual(key, 'ak');
                    assert.strictEqual(value, 'av');
                }
                else if (i === 1) {
                    assert.strictEqual(key, 'bk');
                    assert.strictEqual(value, 'bv');
                }
                else if (i === 2) {
                    assert.strictEqual(key, 'ck');
                    assert.strictEqual(value, 'cv');
                }
                i++;
            });
        });
        test('LinkedMap - delete Head and Tail', function () {
            const map = new map_1.LinkedMap();
            assert.strictEqual(map.size, 0);
            map.set('1', 1);
            assert.strictEqual(map.size, 1);
            map.delete('1');
            assert.strictEqual(map.get('1'), undefined);
            assert.strictEqual(map.size, 0);
            assert.strictEqual([...map.keys()].length, 0);
        });
        test('LinkedMap - delete Head', function () {
            const map = new map_1.LinkedMap();
            assert.strictEqual(map.size, 0);
            map.set('1', 1);
            map.set('2', 2);
            assert.strictEqual(map.size, 2);
            map.delete('1');
            assert.strictEqual(map.get('2'), 2);
            assert.strictEqual(map.size, 1);
            assert.strictEqual([...map.keys()].length, 1);
            assert.strictEqual([...map.keys()][0], '2');
        });
        test('LinkedMap - delete Tail', function () {
            const map = new map_1.LinkedMap();
            assert.strictEqual(map.size, 0);
            map.set('1', 1);
            map.set('2', 2);
            assert.strictEqual(map.size, 2);
            map.delete('2');
            assert.strictEqual(map.get('1'), 1);
            assert.strictEqual(map.size, 1);
            assert.strictEqual([...map.keys()].length, 1);
            assert.strictEqual([...map.keys()][0], '1');
        });
        test('ResourceMap - basics', function () {
            const map = new map_1.ResourceMap();
            const resource1 = uri_1.URI.parse('some://1');
            const resource2 = uri_1.URI.parse('some://2');
            const resource3 = uri_1.URI.parse('some://3');
            const resource4 = uri_1.URI.parse('some://4');
            const resource5 = uri_1.URI.parse('some://5');
            const resource6 = uri_1.URI.parse('some://6');
            assert.strictEqual(map.size, 0);
            const res = map.set(resource1, 1);
            assert.ok(res === map);
            map.set(resource2, '2');
            map.set(resource3, true);
            const values = [...map.values()];
            assert.strictEqual(values[0], 1);
            assert.strictEqual(values[1], '2');
            assert.strictEqual(values[2], true);
            let counter = 0;
            map.forEach((value, key, mapObj) => {
                assert.strictEqual(value, values[counter++]);
                assert.ok(uri_1.URI.isUri(key));
                assert.ok(map === mapObj);
            });
            const obj = Object.create(null);
            map.set(resource4, obj);
            const date = Date.now();
            map.set(resource5, date);
            assert.strictEqual(map.size, 5);
            assert.strictEqual(map.get(resource1), 1);
            assert.strictEqual(map.get(resource2), '2');
            assert.strictEqual(map.get(resource3), true);
            assert.strictEqual(map.get(resource4), obj);
            assert.strictEqual(map.get(resource5), date);
            assert.ok(!map.get(resource6));
            map.delete(resource6);
            assert.strictEqual(map.size, 5);
            assert.ok(map.delete(resource1));
            assert.ok(map.delete(resource2));
            assert.ok(map.delete(resource3));
            assert.ok(map.delete(resource4));
            assert.ok(map.delete(resource5));
            assert.strictEqual(map.size, 0);
            assert.ok(!map.get(resource5));
            assert.ok(!map.get(resource4));
            assert.ok(!map.get(resource3));
            assert.ok(!map.get(resource2));
            assert.ok(!map.get(resource1));
            map.set(resource1, 1);
            map.set(resource2, '2');
            map.set(resource3, true);
            assert.ok(map.has(resource1));
            assert.strictEqual(map.get(resource1), 1);
            assert.strictEqual(map.get(resource2), '2');
            assert.strictEqual(map.get(resource3), true);
            map.clear();
            assert.strictEqual(map.size, 0);
            assert.ok(!map.get(resource1));
            assert.ok(!map.get(resource2));
            assert.ok(!map.get(resource3));
            assert.ok(!map.has(resource1));
            map.set(resource1, false);
            map.set(resource2, 0);
            assert.ok(map.has(resource1));
            assert.ok(map.has(resource2));
        });
        test('ResourceMap - files (do NOT ignorecase)', function () {
            const map = new map_1.ResourceMap();
            const fileA = uri_1.URI.parse('file://some/filea');
            const fileB = uri_1.URI.parse('some://some/other/fileb');
            const fileAUpper = uri_1.URI.parse('file://SOME/FILEA');
            map.set(fileA, 'true');
            assert.strictEqual(map.get(fileA), 'true');
            assert.ok(!map.get(fileAUpper));
            assert.ok(!map.get(fileB));
            map.set(fileAUpper, 'false');
            assert.strictEqual(map.get(fileAUpper), 'false');
            assert.strictEqual(map.get(fileA), 'true');
            const windowsFile = uri_1.URI.file('c:\\test with %25\\c#code');
            const uncFile = uri_1.URI.file('\\\\shäres\\path\\c#\\plugin.json');
            map.set(windowsFile, 'true');
            map.set(uncFile, 'true');
            assert.strictEqual(map.get(windowsFile), 'true');
            assert.strictEqual(map.get(uncFile), 'true');
        });
        test('ResourceMap - files (ignorecase)', function () {
            const map = new map_1.ResourceMap(uri => resources_1.extUriIgnorePathCase.getComparisonKey(uri));
            const fileA = uri_1.URI.parse('file://some/filea');
            const fileB = uri_1.URI.parse('some://some/other/fileb');
            const fileAUpper = uri_1.URI.parse('file://SOME/FILEA');
            map.set(fileA, 'true');
            assert.strictEqual(map.get(fileA), 'true');
            assert.strictEqual(map.get(fileAUpper), 'true');
            assert.ok(!map.get(fileB));
            map.set(fileAUpper, 'false');
            assert.strictEqual(map.get(fileAUpper), 'false');
            assert.strictEqual(map.get(fileA), 'false');
            const windowsFile = uri_1.URI.file('c:\\test with %25\\c#code');
            const uncFile = uri_1.URI.file('\\\\shäres\\path\\c#\\plugin.json');
            map.set(windowsFile, 'true');
            map.set(uncFile, 'true');
            assert.strictEqual(map.get(windowsFile), 'true');
            assert.strictEqual(map.get(uncFile), 'true');
        });
        test('ResourceMap - files (ignorecase, BUT preservecase)', function () {
            const map = new map_1.ResourceMap(uri => resources_1.extUriIgnorePathCase.getComparisonKey(uri));
            const fileA = uri_1.URI.parse('file://some/filea');
            const fileAUpper = uri_1.URI.parse('file://SOME/FILEA');
            map.set(fileA, 1);
            assert.strictEqual(map.get(fileA), 1);
            assert.strictEqual(map.get(fileAUpper), 1);
            assert.deepStrictEqual(Array.from(map.keys()).map(String), [fileA].map(String));
            assert.deepStrictEqual(Array.from(map), [[fileA, 1]]);
            map.set(fileAUpper, 1);
            assert.strictEqual(map.get(fileA), 1);
            assert.strictEqual(map.get(fileAUpper), 1);
            assert.deepStrictEqual(Array.from(map.keys()).map(String), [fileAUpper].map(String));
            assert.deepStrictEqual(Array.from(map), [[fileAUpper, 1]]);
        });
        test('mapsStrictEqualIgnoreOrder', () => {
            const map1 = new Map();
            const map2 = new Map();
            assert.strictEqual((0, map_1.mapsStrictEqualIgnoreOrder)(map1, map2), true);
            map1.set('foo', 'bar');
            assert.strictEqual((0, map_1.mapsStrictEqualIgnoreOrder)(map1, map2), false);
            map2.set('foo', 'bar');
            assert.strictEqual((0, map_1.mapsStrictEqualIgnoreOrder)(map1, map2), true);
            map2.set('bar', 'foo');
            assert.strictEqual((0, map_1.mapsStrictEqualIgnoreOrder)(map1, map2), false);
            map1.set('bar', 'foo');
            assert.strictEqual((0, map_1.mapsStrictEqualIgnoreOrder)(map1, map2), true);
        });
    });
    suite('BidirectionalMap', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('should set and get values correctly', () => {
            const map = new map_1.BidirectionalMap();
            map.set('one', 1);
            map.set('two', 2);
            map.set('three', 3);
            assert.strictEqual(map.get('one'), 1);
            assert.strictEqual(map.get('two'), 2);
            assert.strictEqual(map.get('three'), 3);
        });
        test('should get keys by value correctly', () => {
            const map = new map_1.BidirectionalMap();
            map.set('one', 1);
            map.set('two', 2);
            map.set('three', 3);
            assert.strictEqual(map.getKey(1), 'one');
            assert.strictEqual(map.getKey(2), 'two');
            assert.strictEqual(map.getKey(3), 'three');
        });
        test('should delete values correctly', () => {
            const map = new map_1.BidirectionalMap();
            map.set('one', 1);
            map.set('two', 2);
            map.set('three', 3);
            assert.strictEqual(map.delete('one'), true);
            assert.strictEqual(map.get('one'), undefined);
            assert.strictEqual(map.getKey(1), undefined);
            assert.strictEqual(map.delete('two'), true);
            assert.strictEqual(map.get('two'), undefined);
            assert.strictEqual(map.getKey(2), undefined);
            assert.strictEqual(map.delete('three'), true);
            assert.strictEqual(map.get('three'), undefined);
            assert.strictEqual(map.getKey(3), undefined);
        });
        test('should handle non-existent keys correctly', () => {
            const map = new map_1.BidirectionalMap();
            map.set('one', 1);
            map.set('two', 2);
            map.set('three', 3);
            assert.strictEqual(map.get('four'), undefined);
            assert.strictEqual(map.getKey(4), undefined);
            assert.strictEqual(map.delete('four'), false);
        });
        test('should handle forEach correctly', () => {
            const map = new map_1.BidirectionalMap();
            map.set('one', 1);
            map.set('two', 2);
            map.set('three', 3);
            const keys = [];
            const values = [];
            map.forEach((value, key) => {
                keys.push(key);
                values.push(value);
            });
            assert.deepStrictEqual(keys, ['one', 'two', 'three']);
            assert.deepStrictEqual(values, [1, 2, 3]);
        });
        test('should handle clear correctly', () => {
            const map = new map_1.BidirectionalMap();
            map.set('one', 1);
            map.set('two', 2);
            map.set('three', 3);
            map.clear();
            assert.strictEqual(map.get('one'), undefined);
            assert.strictEqual(map.get('two'), undefined);
            assert.strictEqual(map.get('three'), undefined);
            assert.strictEqual(map.getKey(1), undefined);
            assert.strictEqual(map.getKey(2), undefined);
            assert.strictEqual(map.getKey(3), undefined);
        });
    });
    suite('SetMap', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('add and get', () => {
            const setMap = new map_1.SetMap();
            setMap.add('a', 1);
            setMap.add('a', 2);
            setMap.add('b', 3);
            assert.deepStrictEqual([...setMap.get('a')], [1, 2]);
            assert.deepStrictEqual([...setMap.get('b')], [3]);
        });
        test('delete', () => {
            const setMap = new map_1.SetMap();
            setMap.add('a', 1);
            setMap.add('a', 2);
            setMap.add('b', 3);
            setMap.delete('a', 1);
            assert.deepStrictEqual([...setMap.get('a')], [2]);
            setMap.delete('a', 2);
            assert.deepStrictEqual([...setMap.get('a')], []);
        });
        test('forEach', () => {
            const setMap = new map_1.SetMap();
            setMap.add('a', 1);
            setMap.add('a', 2);
            setMap.add('b', 3);
            let sum = 0;
            setMap.forEach('a', value => sum += value);
            assert.strictEqual(sum, 3);
        });
        test('get empty set', () => {
            const setMap = new map_1.SetMap();
            assert.deepStrictEqual([...setMap.get('a')], []);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vbWFwLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUU7UUFFakIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7WUFDL0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxlQUFTLEVBQWtCLENBQUM7WUFDNUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1lBQ3RDLE1BQU0sR0FBRyxHQUFHLElBQUksZUFBUyxFQUFrQixDQUFDO1lBQzVDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3BCLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksc0JBQWMsQ0FBQztZQUNqQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtZQUN0QyxNQUFNLEdBQUcsR0FBRyxJQUFJLGVBQVMsRUFBa0IsQ0FBQztZQUM1QyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNwQixHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLHNCQUFjLENBQUM7WUFDakMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7WUFDdEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxlQUFTLEVBQWtCLENBQUM7WUFDNUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxzQkFBYyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN6RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7WUFDdEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxlQUFTLEVBQWtCLENBQUM7WUFDNUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxzQkFBYyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN6RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7WUFDOUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxlQUFTLEVBQWtCLENBQUM7WUFDNUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFD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Q0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRCxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2IsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRCxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7WUFDNUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFB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QUFrQixDQUFDO1lBQzVDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtZQUNuQixNQUFNLE1BQU0sR0FBRyxJQUFJLFlBQU0sRUFBa0IsQ0FBQztZQUM1QyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuQixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuQixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuQixNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0QixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO1lBQ3BCLE1BQU0sTUFBTSxHQUFHLElBQUksWUFBTSxFQUFrQixDQUFDO1lBQzVDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25CLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNaLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7WUFDMUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxZQUFNLEVBQWtCLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO0lBRUosQ0FBQyxDQUFDLENBQUMifQ==