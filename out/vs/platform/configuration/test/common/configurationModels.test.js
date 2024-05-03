define(["require", "exports", "assert", "vs/base/common/path", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspace", "vs/platform/workspace/test/common/testWorkspace"], function (require, exports, assert, path_1, uri_1, utils_1, configurationModels_1, configurationRegistry_1, platform_1, workspace_1, testWorkspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ConfigurationModelParser', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suiteSetup(() => {
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
                'id': 'ConfigurationModelParserTest',
                'type': 'object',
                'properties': {
                    'ConfigurationModelParserTest.windowSetting': {
                        'type': 'string',
                        'default': 'isSet',
                    }
                }
            });
        });
        test('parse configuration model with single override identifier', () => {
            const testObject = new configurationModels_1.ConfigurationModelParser('');
            testObject.parse(JSON.stringify({ '[x]': { 'a': 1 } }));
            assert.deepStrictEqual(JSON.stringify(testObject.configurationModel.overrides), JSON.stringify([{ identifiers: ['x'], keys: ['a'], contents: { 'a': 1 } }]));
        });
        test('parse configuration model with multiple override identifiers', () => {
            const testObject = new configurationModels_1.ConfigurationModelParser('');
            testObject.parse(JSON.stringify({ '[x][y]': { 'a': 1 } }));
            assert.deepStrictEqual(JSON.stringify(testObject.configurationModel.overrides), JSON.stringify([{ identifiers: ['x', 'y'], keys: ['a'], contents: { 'a': 1 } }]));
        });
        test('parse configuration model with multiple duplicate override identifiers', () => {
            const testObject = new configurationModels_1.ConfigurationModelParser('');
            testObject.parse(JSON.stringify({ '[x][y][x][z]': { 'a': 1 } }));
            assert.deepStrictEqual(JSON.stringify(testObject.configurationModel.overrides), JSON.stringify([{ identifiers: ['x', 'y', 'z'], keys: ['a'], contents: { 'a': 1 } }]));
        });
        test('parse configuration model with exclude option', () => {
            const testObject = new configurationModels_1.ConfigurationModelParser('');
            testObject.parse(JSON.stringify({ 'a': 1, 'b': 2 }), { exclude: ['a'] });
            assert.strictEqual(testObject.configurationModel.getValue('a'), undefined);
            assert.strictEqual(testObject.configurationModel.getValue('b'), 2);
        });
        test('parse configuration model with exclude option even included', () => {
            const testObject = new configurationModels_1.ConfigurationModelParser('');
            testObject.parse(JSON.stringify({ 'a': 1, 'b': 2 }), { exclude: ['a'], include: ['a'] });
            assert.strictEqual(testObject.configurationModel.getValue('a'), undefined);
            assert.strictEqual(testObject.configurationModel.getValue('b'), 2);
        });
        test('parse configuration model with scopes filter', () => {
            const testObject = new configurationModels_1.ConfigurationModelParser('');
            testObject.parse(JSON.stringify({ 'ConfigurationModelParserTest.windowSetting': '1' }), { scopes: [1 /* ConfigurationScope.APPLICATION */] });
            assert.strictEqual(testObject.configurationModel.getValue('ConfigurationModelParserTest.windowSetting'), undefined);
        });
        test('parse configuration model with include option', () => {
            const testObject = new configurationModels_1.ConfigurationModelParser('');
            testObject.parse(JSON.stringify({ 'ConfigurationModelParserTest.windowSetting': '1' }), { include: ['ConfigurationModelParserTest.windowSetting'], scopes: [1 /* ConfigurationScope.APPLICATION */] });
            assert.strictEqual(testObject.configurationModel.getValue('ConfigurationModelParserTest.windowSetting'), '1');
        });
    });
    suite('ConfigurationModel', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('setValue for a key that has no sections and not defined', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 } }, ['a.b']);
            testObject.setValue('f', 1);
            assert.deepStrictEqual(testObject.contents, { 'a': { 'b': 1 }, 'f': 1 });
            assert.deepStrictEqual(testObject.keys, ['a.b', 'f']);
        });
        test('setValue for a key that has no sections and defined', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 }, 'f': 1 }, ['a.b', 'f']);
            testObject.setValue('f', 3);
            assert.deepStrictEqual(testObject.contents, { 'a': { 'b': 1 }, 'f': 3 });
            assert.deepStrictEqual(testObject.keys, ['a.b', 'f']);
        });
        test('setValue for a key that has sections and not defined', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 }, 'f': 1 }, ['a.b', 'f']);
            testObject.setValue('b.c', 1);
            const expected = {};
            expected['a'] = { 'b': 1 };
            expected['f'] = 1;
            expected['b'] = Object.create(null);
            expected['b']['c'] = 1;
            assert.deepStrictEqual(testObject.contents, expected);
            assert.deepStrictEqual(testObject.keys, ['a.b', 'f', 'b.c']);
        });
        test('setValue for a key that has sections and defined', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 }, 'b': { 'c': 1 }, 'f': 1 }, ['a.b', 'b.c', 'f']);
            testObject.setValue('b.c', 3);
            assert.deepStrictEqual(testObject.contents, { 'a': { 'b': 1 }, 'b': { 'c': 3 }, 'f': 1 });
            assert.deepStrictEqual(testObject.keys, ['a.b', 'b.c', 'f']);
        });
        test('setValue for a key that has sections and sub section not defined', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 }, 'f': 1 }, ['a.b', 'f']);
            testObject.setValue('a.c', 1);
            assert.deepStrictEqual(testObject.contents, { 'a': { 'b': 1, 'c': 1 }, 'f': 1 });
            assert.deepStrictEqual(testObject.keys, ['a.b', 'f', 'a.c']);
        });
        test('setValue for a key that has sections and sub section defined', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1, 'c': 1 }, 'f': 1 }, ['a.b', 'a.c', 'f']);
            testObject.setValue('a.c', 3);
            assert.deepStrictEqual(testObject.contents, { 'a': { 'b': 1, 'c': 3 }, 'f': 1 });
            assert.deepStrictEqual(testObject.keys, ['a.b', 'a.c', 'f']);
        });
        test('setValue for a key that has sections and last section is added', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': {} }, 'f': 1 }, ['a.b', 'f']);
            testObject.setValue('a.b.c', 1);
            assert.deepStrictEqual(testObject.contents, { 'a': { 'b': { 'c': 1 } }, 'f': 1 });
            assert.deepStrictEqual(testObject.keys, ['a.b', 'f', 'a.b.c']);
        });
        test('removeValue: remove a non existing key', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 2 } }, ['a.b']);
            testObject.removeValue('a.b.c');
            assert.deepStrictEqual(testObject.contents, { 'a': { 'b': 2 } });
            assert.deepStrictEqual(testObject.keys, ['a.b']);
        });
        test('removeValue: remove a single segmented key', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': 1 }, ['a']);
            testObject.removeValue('a');
            assert.deepStrictEqual(testObject.contents, {});
            assert.deepStrictEqual(testObject.keys, []);
        });
        test('removeValue: remove a multi segmented key', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 } }, ['a.b']);
            testObject.removeValue('a.b');
            assert.deepStrictEqual(testObject.contents, {});
            assert.deepStrictEqual(testObject.keys, []);
        });
        test('get overriding configuration model for an existing identifier', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 }, 'f': 1 }, [], [{ identifiers: ['c'], contents: { 'a': { 'd': 1 } }, keys: ['a'] }]);
            assert.deepStrictEqual(testObject.override('c').contents, { 'a': { 'b': 1, 'd': 1 }, 'f': 1 });
        });
        test('get overriding configuration model for an identifier that does not exist', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 }, 'f': 1 }, [], [{ identifiers: ['c'], contents: { 'a': { 'd': 1 } }, keys: ['a'] }]);
            assert.deepStrictEqual(testObject.override('xyz').contents, { 'a': { 'b': 1 }, 'f': 1 });
        });
        test('get overriding configuration when one of the keys does not exist in base', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 }, 'f': 1 }, [], [{ identifiers: ['c'], contents: { 'a': { 'd': 1 }, 'g': 1 }, keys: ['a', 'g'] }]);
            assert.deepStrictEqual(testObject.override('c').contents, { 'a': { 'b': 1, 'd': 1 }, 'f': 1, 'g': 1 });
        });
        test('get overriding configuration when one of the key in base is not of object type', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 }, 'f': 1 }, [], [{ identifiers: ['c'], contents: { 'a': { 'd': 1 }, 'f': { 'g': 1 } }, keys: ['a', 'f'] }]);
            assert.deepStrictEqual(testObject.override('c').contents, { 'a': { 'b': 1, 'd': 1 }, 'f': { 'g': 1 } });
        });
        test('get overriding configuration when one of the key in overriding contents is not of object type', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 }, 'f': { 'g': 1 } }, [], [{ identifiers: ['c'], contents: { 'a': { 'd': 1 }, 'f': 1 }, keys: ['a', 'f'] }]);
            assert.deepStrictEqual(testObject.override('c').contents, { 'a': { 'b': 1, 'd': 1 }, 'f': 1 });
        });
        test('get overriding configuration if the value of overriding identifier is not object', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 }, 'f': { 'g': 1 } }, [], [{ identifiers: ['c'], contents: 'abc', keys: [] }]);
            assert.deepStrictEqual(testObject.override('c').contents, { 'a': { 'b': 1 }, 'f': { 'g': 1 } });
        });
        test('get overriding configuration if the value of overriding identifier is an empty object', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 }, 'f': { 'g': 1 } }, [], [{ identifiers: ['c'], contents: {}, keys: [] }]);
            assert.deepStrictEqual(testObject.override('c').contents, { 'a': { 'b': 1 }, 'f': { 'g': 1 } });
        });
        test('simple merge', () => {
            const base = new configurationModels_1.ConfigurationModel({ 'a': 1, 'b': 2 }, ['a', 'b']);
            const add = new configurationModels_1.ConfigurationModel({ 'a': 3, 'c': 4 }, ['a', 'c']);
            const result = base.merge(add);
            assert.deepStrictEqual(result.contents, { 'a': 3, 'b': 2, 'c': 4 });
            assert.deepStrictEqual(result.keys, ['a', 'b', 'c']);
        });
        test('recursive merge', () => {
            const base = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 } }, ['a.b']);
            const add = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 2 } }, ['a.b']);
            const result = base.merge(add);
            assert.deepStrictEqual(result.contents, { 'a': { 'b': 2 } });
            assert.deepStrictEqual(result.getValue('a'), { 'b': 2 });
            assert.deepStrictEqual(result.keys, ['a.b']);
        });
        test('simple merge overrides', () => {
            const base = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 } }, ['a.b'], [{ identifiers: ['c'], contents: { 'a': 2 }, keys: ['a'] }]);
            const add = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 2 } }, ['a.b'], [{ identifiers: ['c'], contents: { 'b': 2 }, keys: ['b'] }]);
            const result = base.merge(add);
            assert.deepStrictEqual(result.contents, { 'a': { 'b': 2 } });
            assert.deepStrictEqual(result.overrides, [{ identifiers: ['c'], contents: { 'a': 2, 'b': 2 }, keys: ['a', 'b'] }]);
            assert.deepStrictEqual(result.override('c').contents, { 'a': 2, 'b': 2 });
            assert.deepStrictEqual(result.keys, ['a.b']);
        });
        test('recursive merge overrides', () => {
            const base = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 }, 'f': 1 }, ['a.b', 'f'], [{ identifiers: ['c'], contents: { 'a': { 'd': 1 } }, keys: ['a'] }]);
            const add = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 2 } }, ['a.b'], [{ identifiers: ['c'], contents: { 'a': { 'e': 2 } }, keys: ['a'] }]);
            const result = base.merge(add);
            assert.deepStrictEqual(result.contents, { 'a': { 'b': 2 }, 'f': 1 });
            assert.deepStrictEqual(result.overrides, [{ identifiers: ['c'], contents: { 'a': { 'd': 1, 'e': 2 } }, keys: ['a'] }]);
            assert.deepStrictEqual(result.override('c').contents, { 'a': { 'b': 2, 'd': 1, 'e': 2 }, 'f': 1 });
            assert.deepStrictEqual(result.keys, ['a.b', 'f']);
        });
        test('Test contents while getting an existing property', () => {
            let testObject = new configurationModels_1.ConfigurationModel({ 'a': 1 });
            assert.deepStrictEqual(testObject.getValue('a'), 1);
            testObject = new configurationModels_1.ConfigurationModel({ 'a': { 'b': 1 } });
            assert.deepStrictEqual(testObject.getValue('a'), { 'b': 1 });
        });
        test('Test contents are undefined for non existing properties', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ awesome: true });
            assert.deepStrictEqual(testObject.getValue('unknownproperty'), undefined);
        });
        test('Test override gives all content merged with overrides', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': 1, 'c': 1 }, [], [{ identifiers: ['b'], contents: { 'a': 2 }, keys: ['a'] }]);
            assert.deepStrictEqual(testObject.override('b').contents, { 'a': 2, 'c': 1 });
        });
        test('Test override when an override has multiple identifiers', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': 1, 'c': 1 }, ['a', 'c'], [{ identifiers: ['x', 'y'], contents: { 'a': 2 }, keys: ['a'] }]);
            let actual = testObject.override('x');
            assert.deepStrictEqual(actual.contents, { 'a': 2, 'c': 1 });
            assert.deepStrictEqual(actual.keys, ['a', 'c']);
            assert.deepStrictEqual(testObject.getKeysForOverrideIdentifier('x'), ['a']);
            actual = testObject.override('y');
            assert.deepStrictEqual(actual.contents, { 'a': 2, 'c': 1 });
            assert.deepStrictEqual(actual.keys, ['a', 'c']);
            assert.deepStrictEqual(testObject.getKeysForOverrideIdentifier('y'), ['a']);
        });
        test('Test override when an identifier is defined in multiple overrides', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': 1, 'c': 1 }, ['a', 'c'], [{ identifiers: ['x'], contents: { 'a': 3, 'b': 1 }, keys: ['a', 'b'] }, { identifiers: ['x', 'y'], contents: { 'a': 2 }, keys: ['a'] }]);
            const actual = testObject.override('x');
            assert.deepStrictEqual(actual.contents, { 'a': 3, 'c': 1, 'b': 1 });
            assert.deepStrictEqual(actual.keys, ['a', 'c']);
            assert.deepStrictEqual(testObject.getKeysForOverrideIdentifier('x'), ['a', 'b']);
        });
        test('Test merge when configuration models have multiple identifiers', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': 1, 'c': 1 }, ['a', 'c'], [{ identifiers: ['y'], contents: { 'c': 1 }, keys: ['c'] }, { identifiers: ['x', 'y'], contents: { 'a': 2 }, keys: ['a'] }]);
            const target = new configurationModels_1.ConfigurationModel({ 'a': 2, 'b': 1 }, ['a', 'b'], [{ identifiers: ['x'], contents: { 'a': 3, 'b': 2 }, keys: ['a', 'b'] }, { identifiers: ['x', 'y'], contents: { 'b': 3 }, keys: ['b'] }]);
            const actual = testObject.merge(target);
            assert.deepStrictEqual(actual.contents, { 'a': 2, 'c': 1, 'b': 1 });
            assert.deepStrictEqual(actual.keys, ['a', 'c', 'b']);
            assert.deepStrictEqual(actual.overrides, [
                { identifiers: ['y'], contents: { 'c': 1 }, keys: ['c'] },
                { identifiers: ['x', 'y'], contents: { 'a': 2, 'b': 3 }, keys: ['a', 'b'] },
                { identifiers: ['x'], contents: { 'a': 3, 'b': 2 }, keys: ['a', 'b'] },
            ]);
        });
        test('inspect when raw is same', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': 1, 'c': 1 }, ['a', 'c'], [{ identifiers: ['x', 'y'], contents: { 'a': 2, 'b': 1 }, keys: ['a'] }]);
            assert.deepStrictEqual(testObject.inspect('a'), { value: 1, override: undefined, merged: 1, overrides: [{ identifiers: ['x', 'y'], value: 2 }] });
            assert.deepStrictEqual(testObject.inspect('a', 'x'), { value: 1, override: 2, merged: 2, overrides: [{ identifiers: ['x', 'y'], value: 2 }] });
            assert.deepStrictEqual(testObject.inspect('b', 'x'), { value: undefined, override: 1, merged: 1, overrides: [{ identifiers: ['x', 'y'], value: 1 }] });
            assert.deepStrictEqual(testObject.inspect('d'), { value: undefined, override: undefined, merged: undefined, overrides: undefined });
        });
        test('inspect when raw is not same', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': 1, 'c': 1 }, ['a', 'c'], [{ identifiers: ['x', 'y'], contents: { 'a': 2, }, keys: ['a'] }], [{
                    'a': 1,
                    'b': 2,
                    'c': 1,
                    'd': 3,
                    '[x][y]': {
                        'a': 2,
                        'b': 1
                    }
                }]);
            assert.deepStrictEqual(testObject.inspect('a'), { value: 1, override: undefined, merged: 1, overrides: [{ identifiers: ['x', 'y'], value: 2 }] });
            assert.deepStrictEqual(testObject.inspect('a', 'x'), { value: 1, override: 2, merged: 2, overrides: [{ identifiers: ['x', 'y'], value: 2 }] });
            assert.deepStrictEqual(testObject.inspect('b', 'x'), { value: 2, override: 1, merged: 1, overrides: [{ identifiers: ['x', 'y'], value: 1 }] });
            assert.deepStrictEqual(testObject.inspect('d'), { value: 3, override: undefined, merged: 3, overrides: undefined });
            assert.deepStrictEqual(testObject.inspect('e'), { value: undefined, override: undefined, merged: undefined, overrides: undefined });
        });
        test('inspect in merged configuration when raw is same', () => {
            const target1 = new configurationModels_1.ConfigurationModel({ 'a': 1 }, ['a'], [{ identifiers: ['x', 'y'], contents: { 'a': 2, }, keys: ['a'] }]);
            const target2 = new configurationModels_1.ConfigurationModel({ 'b': 3 }, ['b'], []);
            const testObject = target1.merge(target2);
            assert.deepStrictEqual(testObject.inspect('a'), { value: 1, override: undefined, merged: 1, overrides: [{ identifiers: ['x', 'y'], value: 2 }] });
            assert.deepStrictEqual(testObject.inspect('a', 'x'), { value: 1, override: 2, merged: 2, overrides: [{ identifiers: ['x', 'y'], value: 2 }] });
            assert.deepStrictEqual(testObject.inspect('b'), { value: 3, override: undefined, merged: 3, overrides: undefined });
            assert.deepStrictEqual(testObject.inspect('b', 'y'), { value: 3, override: undefined, merged: 3, overrides: undefined });
            assert.deepStrictEqual(testObject.inspect('c'), { value: undefined, override: undefined, merged: undefined, overrides: undefined });
        });
        test('inspect in merged configuration when raw is not same for one model', () => {
            const target1 = new configurationModels_1.ConfigurationModel({ 'a': 1 }, ['a'], [{ identifiers: ['x', 'y'], contents: { 'a': 2, }, keys: ['a'] }], [{
                    'a': 1,
                    'b': 2,
                    'c': 3,
                    '[x][y]': {
                        'a': 2,
                        'b': 4,
                    }
                }]);
            const target2 = new configurationModels_1.ConfigurationModel({ 'b': 3 }, ['b'], []);
            const testObject = target1.merge(target2);
            assert.deepStrictEqual(testObject.inspect('a'), { value: 1, override: undefined, merged: 1, overrides: [{ identifiers: ['x', 'y'], value: 2 }] });
            assert.deepStrictEqual(testObject.inspect('a', 'x'), { value: 1, override: 2, merged: 2, overrides: [{ identifiers: ['x', 'y'], value: 2 }] });
            assert.deepStrictEqual(testObject.inspect('b'), { value: 3, override: undefined, merged: 3, overrides: [{ identifiers: ['x', 'y'], value: 4 }] });
            assert.deepStrictEqual(testObject.inspect('b', 'y'), { value: 3, override: 4, merged: 4, overrides: [{ identifiers: ['x', 'y'], value: 4 }] });
            assert.deepStrictEqual(testObject.inspect('c'), { value: 3, override: undefined, merged: 3, overrides: undefined });
        });
        test('inspect: return all overrides', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': 1, 'c': 1 }, ['a', 'c'], [
                { identifiers: ['x', 'y'], contents: { 'a': 2, 'b': 1 }, keys: ['a', 'b'] },
                { identifiers: ['x'], contents: { 'a': 3 }, keys: ['a'] },
                { identifiers: ['y'], contents: { 'b': 3 }, keys: ['b'] }
            ]);
            assert.deepStrictEqual(testObject.inspect('a').overrides, [
                { identifiers: ['x', 'y'], value: 2 },
                { identifiers: ['x'], value: 3 }
            ]);
        });
        test('inspect when no overrides', () => {
            const testObject = new configurationModels_1.ConfigurationModel({ 'a': 1, 'c': 1 }, ['a', 'c']);
            assert.strictEqual(testObject.inspect('a').overrides, undefined);
        });
    });
    suite('CustomConfigurationModel', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('simple merge using models', () => {
            const base = new configurationModels_1.ConfigurationModelParser('base');
            base.parse(JSON.stringify({ 'a': 1, 'b': 2 }));
            const add = new configurationModels_1.ConfigurationModelParser('add');
            add.parse(JSON.stringify({ 'a': 3, 'c': 4 }));
            const result = base.configurationModel.merge(add.configurationModel);
            assert.deepStrictEqual(result.contents, { 'a': 3, 'b': 2, 'c': 4 });
        });
        test('simple merge with an undefined contents', () => {
            let base = new configurationModels_1.ConfigurationModelParser('base');
            base.parse(JSON.stringify({ 'a': 1, 'b': 2 }));
            let add = new configurationModels_1.ConfigurationModelParser('add');
            let result = base.configurationModel.merge(add.configurationModel);
            assert.deepStrictEqual(result.contents, { 'a': 1, 'b': 2 });
            base = new configurationModels_1.ConfigurationModelParser('base');
            add = new configurationModels_1.ConfigurationModelParser('add');
            add.parse(JSON.stringify({ 'a': 1, 'b': 2 }));
            result = base.configurationModel.merge(add.configurationModel);
            assert.deepStrictEqual(result.contents, { 'a': 1, 'b': 2 });
            base = new configurationModels_1.ConfigurationModelParser('base');
            add = new configurationModels_1.ConfigurationModelParser('add');
            result = base.configurationModel.merge(add.configurationModel);
            assert.deepStrictEqual(result.contents, {});
        });
        test('Recursive merge using config models', () => {
            const base = new configurationModels_1.ConfigurationModelParser('base');
            base.parse(JSON.stringify({ 'a': { 'b': 1 } }));
            const add = new configurationModels_1.ConfigurationModelParser('add');
            add.parse(JSON.stringify({ 'a': { 'b': 2 } }));
            const result = base.configurationModel.merge(add.configurationModel);
            assert.deepStrictEqual(result.contents, { 'a': { 'b': 2 } });
        });
        test('Test contents while getting an existing property', () => {
            const testObject = new configurationModels_1.ConfigurationModelParser('test');
            testObject.parse(JSON.stringify({ 'a': 1 }));
            assert.deepStrictEqual(testObject.configurationModel.getValue('a'), 1);
            testObject.parse(JSON.stringify({ 'a': { 'b': 1 } }));
            assert.deepStrictEqual(testObject.configurationModel.getValue('a'), { 'b': 1 });
        });
        test('Test contents are undefined for non existing properties', () => {
            const testObject = new configurationModels_1.ConfigurationModelParser('test');
            testObject.parse(JSON.stringify({
                awesome: true
            }));
            assert.deepStrictEqual(testObject.configurationModel.getValue('unknownproperty'), undefined);
        });
        test('Test contents are undefined for undefined config', () => {
            const testObject = new configurationModels_1.ConfigurationModelParser('test');
            assert.deepStrictEqual(testObject.configurationModel.getValue('unknownproperty'), undefined);
        });
        test('Test configWithOverrides gives all content merged with overrides', () => {
            const testObject = new configurationModels_1.ConfigurationModelParser('test');
            testObject.parse(JSON.stringify({ 'a': 1, 'c': 1, '[b]': { 'a': 2 } }));
            assert.deepStrictEqual(testObject.configurationModel.override('b').contents, { 'a': 2, 'c': 1, '[b]': { 'a': 2 } });
        });
        test('Test configWithOverrides gives empty contents', () => {
            const testObject = new configurationModels_1.ConfigurationModelParser('test');
            assert.deepStrictEqual(testObject.configurationModel.override('b').contents, {});
        });
        test('Test update with empty data', () => {
            const testObject = new configurationModels_1.ConfigurationModelParser('test');
            testObject.parse('');
            assert.deepStrictEqual(testObject.configurationModel.contents, Object.create(null));
            assert.deepStrictEqual(testObject.configurationModel.keys, []);
            testObject.parse(null);
            assert.deepStrictEqual(testObject.configurationModel.contents, Object.create(null));
            assert.deepStrictEqual(testObject.configurationModel.keys, []);
            testObject.parse(undefined);
            assert.deepStrictEqual(testObject.configurationModel.contents, Object.create(null));
            assert.deepStrictEqual(testObject.configurationModel.keys, []);
        });
        test('Test empty property is not ignored', () => {
            const testObject = new configurationModels_1.ConfigurationModelParser('test');
            testObject.parse(JSON.stringify({ '': 1 }));
            // deepStrictEqual seems to ignore empty properties, fall back
            // to comparing the output of JSON.stringify
            assert.strictEqual(JSON.stringify(testObject.configurationModel.contents), JSON.stringify({ '': 1 }));
            assert.deepStrictEqual(testObject.configurationModel.keys, ['']);
        });
    });
    suite('Configuration', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Test inspect for overrideIdentifiers', () => {
            const defaultConfigurationModel = parseConfigurationModel({ '[l1]': { 'a': 1 }, '[l2]': { 'b': 1 } });
            const userConfigurationModel = parseConfigurationModel({ '[l3]': { 'a': 2 } });
            const workspaceConfigurationModel = parseConfigurationModel({ '[l1]': { 'a': 3 }, '[l4]': { 'a': 3 } });
            const testObject = new configurationModels_1.Configuration(defaultConfigurationModel, new configurationModels_1.ConfigurationModel(), userConfigurationModel, workspaceConfigurationModel);
            const { overrideIdentifiers } = testObject.inspect('a', {}, undefined);
            assert.deepStrictEqual(overrideIdentifiers, ['l1', 'l3', 'l4']);
        });
        test('Test update value', () => {
            const parser = new configurationModels_1.ConfigurationModelParser('test');
            parser.parse(JSON.stringify({ 'a': 1 }));
            const testObject = new configurationModels_1.Configuration(parser.configurationModel, new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            testObject.updateValue('a', 2);
            assert.strictEqual(testObject.getValue('a', {}, undefined), 2);
        });
        test('Test update value after inspect', () => {
            const parser = new configurationModels_1.ConfigurationModelParser('test');
            parser.parse(JSON.stringify({ 'a': 1 }));
            const testObject = new configurationModels_1.Configuration(parser.configurationModel, new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            testObject.inspect('a', {}, undefined);
            testObject.updateValue('a', 2);
            assert.strictEqual(testObject.getValue('a', {}, undefined), 2);
        });
        test('Test compare and update default configuration', () => {
            const testObject = new configurationModels_1.Configuration(new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            testObject.updateDefaultConfiguration(toConfigurationModel({
                'editor.lineNumbers': 'on',
            }));
            const actual = testObject.compareAndUpdateDefaultConfiguration(toConfigurationModel({
                'editor.lineNumbers': 'off',
                '[markdown]': {
                    'editor.wordWrap': 'off'
                }
            }), ['editor.lineNumbers', '[markdown]']);
            assert.deepStrictEqual(actual, { keys: ['editor.lineNumbers', '[markdown]'], overrides: [['markdown', ['editor.wordWrap']]] });
        });
        test('Test compare and update application configuration', () => {
            const testObject = new configurationModels_1.Configuration(new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            testObject.updateApplicationConfiguration(toConfigurationModel({
                'update.mode': 'on',
            }));
            const actual = testObject.compareAndUpdateApplicationConfiguration(toConfigurationModel({
                'update.mode': 'none',
                '[typescript]': {
                    'editor.wordWrap': 'off'
                }
            }));
            assert.deepStrictEqual(actual, { keys: ['[typescript]', 'update.mode',], overrides: [['typescript', ['editor.wordWrap']]] });
        });
        test('Test compare and update user configuration', () => {
            const testObject = new configurationModels_1.Configuration(new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            testObject.updateLocalUserConfiguration(toConfigurationModel({
                'editor.lineNumbers': 'off',
                'editor.fontSize': 12,
                '[typescript]': {
                    'editor.wordWrap': 'off'
                }
            }));
            const actual = testObject.compareAndUpdateLocalUserConfiguration(toConfigurationModel({
                'editor.lineNumbers': 'on',
                'window.zoomLevel': 1,
                '[typescript]': {
                    'editor.wordWrap': 'on',
                    'editor.insertSpaces': false
                }
            }));
            assert.deepStrictEqual(actual, { keys: ['window.zoomLevel', 'editor.lineNumbers', '[typescript]', 'editor.fontSize'], overrides: [['typescript', ['editor.insertSpaces', 'editor.wordWrap']]] });
        });
        test('Test compare and update workspace configuration', () => {
            const testObject = new configurationModels_1.Configuration(new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            testObject.updateWorkspaceConfiguration(toConfigurationModel({
                'editor.lineNumbers': 'off',
                'editor.fontSize': 12,
                '[typescript]': {
                    'editor.wordWrap': 'off'
                }
            }));
            const actual = testObject.compareAndUpdateWorkspaceConfiguration(toConfigurationModel({
                'editor.lineNumbers': 'on',
                'window.zoomLevel': 1,
                '[typescript]': {
                    'editor.wordWrap': 'on',
                    'editor.insertSpaces': false
                }
            }));
            assert.deepStrictEqual(actual, { keys: ['window.zoomLevel', 'editor.lineNumbers', '[typescript]', 'editor.fontSize'], overrides: [['typescript', ['editor.insertSpaces', 'editor.wordWrap']]] });
        });
        test('Test compare and update workspace folder configuration', () => {
            const testObject = new configurationModels_1.Configuration(new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            testObject.updateFolderConfiguration(uri_1.URI.file('file1'), toConfigurationModel({
                'editor.lineNumbers': 'off',
                'editor.fontSize': 12,
                '[typescript]': {
                    'editor.wordWrap': 'off'
                }
            }));
            const actual = testObject.compareAndUpdateFolderConfiguration(uri_1.URI.file('file1'), toConfigurationModel({
                'editor.lineNumbers': 'on',
                'window.zoomLevel': 1,
                '[typescript]': {
                    'editor.wordWrap': 'on',
                    'editor.insertSpaces': false
                }
            }));
            assert.deepStrictEqual(actual, { keys: ['window.zoomLevel', 'editor.lineNumbers', '[typescript]', 'editor.fontSize'], overrides: [['typescript', ['editor.insertSpaces', 'editor.wordWrap']]] });
        });
        test('Test compare and delete workspace folder configuration', () => {
            const testObject = new configurationModels_1.Configuration(new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            testObject.updateFolderConfiguration(uri_1.URI.file('file1'), toConfigurationModel({
                'editor.lineNumbers': 'off',
                'editor.fontSize': 12,
                '[typescript]': {
                    'editor.wordWrap': 'off'
                }
            }));
            const actual = testObject.compareAndDeleteFolderConfiguration(uri_1.URI.file('file1'));
            assert.deepStrictEqual(actual, { keys: ['editor.lineNumbers', 'editor.fontSize', '[typescript]'], overrides: [['typescript', ['editor.wordWrap']]] });
        });
        function parseConfigurationModel(content) {
            const parser = new configurationModels_1.ConfigurationModelParser('test');
            parser.parse(JSON.stringify(content));
            return parser.configurationModel;
        }
    });
    suite('ConfigurationChangeEvent', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('changeEvent affecting keys with new configuration', () => {
            const configuration = new configurationModels_1.Configuration(new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            const change = configuration.compareAndUpdateLocalUserConfiguration(toConfigurationModel({
                'window.zoomLevel': 1,
                'workbench.editor.enablePreview': false,
                'files.autoSave': 'off',
            }));
            const testObject = new configurationModels_1.ConfigurationChangeEvent(change, undefined, configuration);
            assert.deepStrictEqual([...testObject.affectedKeys], ['window.zoomLevel', 'workbench.editor.enablePreview', 'files.autoSave']);
            assert.ok(testObject.affectsConfiguration('window.zoomLevel'));
            assert.ok(testObject.affectsConfiguration('window'));
            assert.ok(testObject.affectsConfiguration('workbench.editor.enablePreview'));
            assert.ok(testObject.affectsConfiguration('workbench.editor'));
            assert.ok(testObject.affectsConfiguration('workbench'));
            assert.ok(testObject.affectsConfiguration('files'));
            assert.ok(testObject.affectsConfiguration('files.autoSave'));
            assert.ok(!testObject.affectsConfiguration('files.exclude'));
            assert.ok(!testObject.affectsConfiguration('[markdown]'));
            assert.ok(!testObject.affectsConfiguration('editor'));
        });
        test('changeEvent affecting keys when configuration changed', () => {
            const configuration = new configurationModels_1.Configuration(new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            configuration.updateLocalUserConfiguration(toConfigurationModel({
                'window.zoomLevel': 2,
                'workbench.editor.enablePreview': true,
                'files.autoSave': 'off',
            }));
            const data = configuration.toData();
            const change = configuration.compareAndUpdateLocalUserConfiguration(toConfigurationModel({
                'window.zoomLevel': 1,
                'workbench.editor.enablePreview': false,
                'files.autoSave': 'off',
            }));
            const testObject = new configurationModels_1.ConfigurationChangeEvent(change, { data }, configuration);
            assert.deepStrictEqual([...testObject.affectedKeys], ['window.zoomLevel', 'workbench.editor.enablePreview']);
            assert.ok(testObject.affectsConfiguration('window.zoomLevel'));
            assert.ok(testObject.affectsConfiguration('window'));
            assert.ok(testObject.affectsConfiguration('workbench.editor.enablePreview'));
            assert.ok(testObject.affectsConfiguration('workbench.editor'));
            assert.ok(testObject.affectsConfiguration('workbench'));
            assert.ok(!testObject.affectsConfiguration('files'));
            assert.ok(!testObject.affectsConfiguration('[markdown]'));
            assert.ok(!testObject.affectsConfiguration('editor'));
        });
        test('changeEvent affecting overrides with new configuration', () => {
            const configuration = new configurationModels_1.Configuration(new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            const change = configuration.compareAndUpdateLocalUserConfiguration(toConfigurationModel({
                'files.autoSave': 'off',
                '[markdown]': {
                    'editor.wordWrap': 'off'
                },
                '[typescript][jsonc]': {
                    'editor.lineNumbers': 'off'
                }
            }));
            const testObject = new configurationModels_1.ConfigurationChangeEvent(change, undefined, configuration);
            assert.deepStrictEqual([...testObject.affectedKeys], ['files.autoSave', '[markdown]', '[typescript][jsonc]', 'editor.wordWrap', 'editor.lineNumbers']);
            assert.ok(testObject.affectsConfiguration('files'));
            assert.ok(testObject.affectsConfiguration('files.autoSave'));
            assert.ok(!testObject.affectsConfiguration('files.exclude'));
            assert.ok(testObject.affectsConfiguration('[markdown]'));
            assert.ok(!testObject.affectsConfiguration('[markdown].editor'));
            assert.ok(!testObject.affectsConfiguration('[markdown].workbench'));
            assert.ok(testObject.affectsConfiguration('editor'));
            assert.ok(testObject.affectsConfiguration('editor.wordWrap'));
            assert.ok(testObject.affectsConfiguration('editor.lineNumbers'));
            assert.ok(testObject.affectsConfiguration('editor', { overrideIdentifier: 'markdown' }));
            assert.ok(testObject.affectsConfiguration('editor', { overrideIdentifier: 'jsonc' }));
            assert.ok(testObject.affectsConfiguration('editor', { overrideIdentifier: 'typescript' }));
            assert.ok(testObject.affectsConfiguration('editor.wordWrap', { overrideIdentifier: 'markdown' }));
            assert.ok(!testObject.affectsConfiguration('editor.wordWrap', { overrideIdentifier: 'jsonc' }));
            assert.ok(!testObject.affectsConfiguration('editor.wordWrap', { overrideIdentifier: 'typescript' }));
            assert.ok(!testObject.affectsConfiguration('editor.lineNumbers', { overrideIdentifier: 'markdown' }));
            assert.ok(testObject.affectsConfiguration('editor.lineNumbers', { overrideIdentifier: 'typescript' }));
            assert.ok(testObject.affectsConfiguration('editor.lineNumbers', { overrideIdentifier: 'jsonc' }));
            assert.ok(!testObject.affectsConfiguration('editor', { overrideIdentifier: 'json' }));
            assert.ok(!testObject.affectsConfiguration('editor.fontSize', { overrideIdentifier: 'markdown' }));
            assert.ok(!testObject.affectsConfiguration('editor.fontSize'));
            assert.ok(!testObject.affectsConfiguration('window'));
        });
        test('changeEvent affecting overrides when configuration changed', () => {
            const configuration = new configurationModels_1.Configuration(new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            configuration.updateLocalUserConfiguration(toConfigurationModel({
                'workbench.editor.enablePreview': true,
                '[markdown]': {
                    'editor.fontSize': 12,
                    'editor.wordWrap': 'off'
                },
                '[css][scss]': {
                    'editor.lineNumbers': 'off',
                    'css.lint.emptyRules': 'error'
                },
                'files.autoSave': 'off',
            }));
            const data = configuration.toData();
            const change = configuration.compareAndUpdateLocalUserConfiguration(toConfigurationModel({
                'files.autoSave': 'off',
                '[markdown]': {
                    'editor.fontSize': 13,
                    'editor.wordWrap': 'off'
                },
                '[css][scss]': {
                    'editor.lineNumbers': 'relative',
                    'css.lint.emptyRules': 'error'
                },
                'window.zoomLevel': 1,
            }));
            const testObject = new configurationModels_1.ConfigurationChangeEvent(change, { data }, configuration);
            assert.deepStrictEqual([...testObject.affectedKeys], ['window.zoomLevel', '[markdown]', '[css][scss]', 'workbench.editor.enablePreview', 'editor.fontSize', 'editor.lineNumbers']);
            assert.ok(!testObject.affectsConfiguration('files'));
            assert.ok(testObject.affectsConfiguration('[markdown]'));
            assert.ok(!testObject.affectsConfiguration('[markdown].editor'));
            assert.ok(!testObject.affectsConfiguration('[markdown].editor.fontSize'));
            assert.ok(!testObject.affectsConfiguration('[markdown].editor.wordWrap'));
            assert.ok(!testObject.affectsConfiguration('[markdown].workbench'));
            assert.ok(testObject.affectsConfiguration('[css][scss]'));
            assert.ok(testObject.affectsConfiguration('editor'));
            assert.ok(testObject.affectsConfiguration('editor', { overrideIdentifier: 'markdown' }));
            assert.ok(testObject.affectsConfiguration('editor', { overrideIdentifier: 'css' }));
            assert.ok(testObject.affectsConfiguration('editor', { overrideIdentifier: 'scss' }));
            assert.ok(testObject.affectsConfiguration('editor.fontSize', { overrideIdentifier: 'markdown' }));
            assert.ok(!testObject.affectsConfiguration('editor.fontSize', { overrideIdentifier: 'css' }));
            assert.ok(!testObject.affectsConfiguration('editor.fontSize', { overrideIdentifier: 'scss' }));
            assert.ok(testObject.affectsConfiguration('editor.lineNumbers', { overrideIdentifier: 'scss' }));
            assert.ok(testObject.affectsConfiguration('editor.lineNumbers', { overrideIdentifier: 'css' }));
            assert.ok(!testObject.affectsConfiguration('editor.lineNumbers', { overrideIdentifier: 'markdown' }));
            assert.ok(!testObject.affectsConfiguration('editor.wordWrap'));
            assert.ok(!testObject.affectsConfiguration('editor.wordWrap', { overrideIdentifier: 'markdown' }));
            assert.ok(!testObject.affectsConfiguration('editor', { overrideIdentifier: 'json' }));
            assert.ok(!testObject.affectsConfiguration('editor.fontSize', { overrideIdentifier: 'json' }));
            assert.ok(testObject.affectsConfiguration('window'));
            assert.ok(testObject.affectsConfiguration('window.zoomLevel'));
            assert.ok(testObject.affectsConfiguration('window', { overrideIdentifier: 'markdown' }));
            assert.ok(testObject.affectsConfiguration('window.zoomLevel', { overrideIdentifier: 'markdown' }));
            assert.ok(testObject.affectsConfiguration('workbench'));
            assert.ok(testObject.affectsConfiguration('workbench.editor'));
            assert.ok(testObject.affectsConfiguration('workbench.editor.enablePreview'));
            assert.ok(testObject.affectsConfiguration('workbench', { overrideIdentifier: 'markdown' }));
            assert.ok(testObject.affectsConfiguration('workbench.editor', { overrideIdentifier: 'markdown' }));
        });
        test('changeEvent affecting workspace folders', () => {
            const configuration = new configurationModels_1.Configuration(new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            configuration.updateWorkspaceConfiguration(toConfigurationModel({ 'window.title': 'custom' }));
            configuration.updateFolderConfiguration(uri_1.URI.file('folder1'), toConfigurationModel({ 'window.zoomLevel': 2, 'window.restoreFullscreen': true }));
            configuration.updateFolderConfiguration(uri_1.URI.file('folder2'), toConfigurationModel({ 'workbench.editor.enablePreview': true, 'window.restoreWindows': true }));
            const data = configuration.toData();
            const workspace = new testWorkspace_1.Workspace('a', [new workspace_1.WorkspaceFolder({ index: 0, name: 'a', uri: uri_1.URI.file('folder1') }), new workspace_1.WorkspaceFolder({ index: 1, name: 'b', uri: uri_1.URI.file('folder2') }), new workspace_1.WorkspaceFolder({ index: 2, name: 'c', uri: uri_1.URI.file('folder3') })]);
            const change = (0, configurationModels_1.mergeChanges)(configuration.compareAndUpdateWorkspaceConfiguration(toConfigurationModel({ 'window.title': 'native' })), configuration.compareAndUpdateFolderConfiguration(uri_1.URI.file('folder1'), toConfigurationModel({ 'window.zoomLevel': 1, 'window.restoreFullscreen': false })), configuration.compareAndUpdateFolderConfiguration(uri_1.URI.file('folder2'), toConfigurationModel({ 'workbench.editor.enablePreview': false, 'window.restoreWindows': false })));
            const testObject = new configurationModels_1.ConfigurationChangeEvent(change, { data, workspace }, configuration, workspace);
            assert.deepStrictEqual([...testObject.affectedKeys], ['window.title', 'window.zoomLevel', 'window.restoreFullscreen', 'workbench.editor.enablePreview', 'window.restoreWindows']);
            assert.ok(testObject.affectsConfiguration('window.zoomLevel'));
            assert.ok(testObject.affectsConfiguration('window.zoomLevel', { resource: uri_1.URI.file('folder1') }));
            assert.ok(testObject.affectsConfiguration('window.zoomLevel', { resource: uri_1.URI.file((0, path_1.join)('folder1', 'file1')) }));
            assert.ok(!testObject.affectsConfiguration('window.zoomLevel', { resource: uri_1.URI.file('file1') }));
            assert.ok(!testObject.affectsConfiguration('window.zoomLevel', { resource: uri_1.URI.file('file2') }));
            assert.ok(!testObject.affectsConfiguration('window.zoomLevel', { resource: uri_1.URI.file((0, path_1.join)('folder2', 'file2')) }));
            assert.ok(!testObject.affectsConfiguration('window.zoomLevel', { resource: uri_1.URI.file((0, path_1.join)('folder3', 'file3')) }));
            assert.ok(testObject.affectsConfiguration('window.restoreFullscreen'));
            assert.ok(testObject.affectsConfiguration('window.restoreFullscreen', { resource: uri_1.URI.file((0, path_1.join)('folder1', 'file1')) }));
            assert.ok(testObject.affectsConfiguration('window.restoreFullscreen', { resource: uri_1.URI.file('folder1') }));
            assert.ok(!testObject.affectsConfiguration('window.restoreFullscreen', { resource: uri_1.URI.file('file1') }));
            assert.ok(!testObject.affectsConfiguration('window.restoreFullscreen', { resource: uri_1.URI.file('file2') }));
            assert.ok(!testObject.affectsConfiguration('window.restoreFullscreen', { resource: uri_1.URI.file((0, path_1.join)('folder2', 'file2')) }));
            assert.ok(!testObject.affectsConfiguration('window.restoreFullscreen', { resource: uri_1.URI.file((0, path_1.join)('folder3', 'file3')) }));
            assert.ok(testObject.affectsConfiguration('window.restoreWindows'));
            assert.ok(testObject.affectsConfiguration('window.restoreWindows', { resource: uri_1.URI.file('folder2') }));
            assert.ok(testObject.affectsConfiguration('window.restoreWindows', { resource: uri_1.URI.file((0, path_1.join)('folder2', 'file2')) }));
            assert.ok(!testObject.affectsConfiguration('window.restoreWindows', { resource: uri_1.URI.file('file2') }));
            assert.ok(!testObject.affectsConfiguration('window.restoreWindows', { resource: uri_1.URI.file((0, path_1.join)('folder1', 'file1')) }));
            assert.ok(!testObject.affectsConfiguration('window.restoreWindows', { resource: uri_1.URI.file((0, path_1.join)('folder3', 'file3')) }));
            assert.ok(testObject.affectsConfiguration('window.title'));
            assert.ok(testObject.affectsConfiguration('window.title', { resource: uri_1.URI.file('folder1') }));
            assert.ok(testObject.affectsConfiguration('window.title', { resource: uri_1.URI.file((0, path_1.join)('folder1', 'file1')) }));
            assert.ok(testObject.affectsConfiguration('window.title', { resource: uri_1.URI.file('folder2') }));
            assert.ok(testObject.affectsConfiguration('window.title', { resource: uri_1.URI.file((0, path_1.join)('folder2', 'file2')) }));
            assert.ok(testObject.affectsConfiguration('window.title', { resource: uri_1.URI.file('folder3') }));
            assert.ok(testObject.affectsConfiguration('window.title', { resource: uri_1.URI.file((0, path_1.join)('folder3', 'file3')) }));
            assert.ok(testObject.affectsConfiguration('window.title', { resource: uri_1.URI.file('file1') }));
            assert.ok(testObject.affectsConfiguration('window.title', { resource: uri_1.URI.file('file2') }));
            assert.ok(testObject.affectsConfiguration('window.title', { resource: uri_1.URI.file('file3') }));
            assert.ok(testObject.affectsConfiguration('window'));
            assert.ok(testObject.affectsConfiguration('window', { resource: uri_1.URI.file('folder1') }));
            assert.ok(testObject.affectsConfiguration('window', { resource: uri_1.URI.file((0, path_1.join)('folder1', 'file1')) }));
            assert.ok(testObject.affectsConfiguration('window', { resource: uri_1.URI.file('folder2') }));
            assert.ok(testObject.affectsConfiguration('window', { resource: uri_1.URI.file((0, path_1.join)('folder2', 'file2')) }));
            assert.ok(testObject.affectsConfiguration('window', { resource: uri_1.URI.file('folder3') }));
            assert.ok(testObject.affectsConfiguration('window', { resource: uri_1.URI.file((0, path_1.join)('folder3', 'file3')) }));
            assert.ok(testObject.affectsConfiguration('window', { resource: uri_1.URI.file('file1') }));
            assert.ok(testObject.affectsConfiguration('window', { resource: uri_1.URI.file('file2') }));
            assert.ok(testObject.affectsConfiguration('window', { resource: uri_1.URI.file('file3') }));
            assert.ok(testObject.affectsConfiguration('workbench.editor.enablePreview'));
            assert.ok(testObject.affectsConfiguration('workbench.editor.enablePreview', { resource: uri_1.URI.file('folder2') }));
            assert.ok(testObject.affectsConfiguration('workbench.editor.enablePreview', { resource: uri_1.URI.file((0, path_1.join)('folder2', 'file2')) }));
            assert.ok(!testObject.affectsConfiguration('workbench.editor.enablePreview', { resource: uri_1.URI.file('folder1') }));
            assert.ok(!testObject.affectsConfiguration('workbench.editor.enablePreview', { resource: uri_1.URI.file((0, path_1.join)('folder1', 'file1')) }));
            assert.ok(!testObject.affectsConfiguration('workbench.editor.enablePreview', { resource: uri_1.URI.file('folder3') }));
            assert.ok(testObject.affectsConfiguration('workbench.editor'));
            assert.ok(testObject.affectsConfiguration('workbench.editor', { resource: uri_1.URI.file('folder2') }));
            assert.ok(testObject.affectsConfiguration('workbench.editor', { resource: uri_1.URI.file((0, path_1.join)('folder2', 'file2')) }));
            assert.ok(!testObject.affectsConfiguration('workbench.editor', { resource: uri_1.URI.file('folder1') }));
            assert.ok(!testObject.affectsConfiguration('workbench.editor', { resource: uri_1.URI.file((0, path_1.join)('folder1', 'file1')) }));
            assert.ok(!testObject.affectsConfiguration('workbench.editor', { resource: uri_1.URI.file('folder3') }));
            assert.ok(testObject.affectsConfiguration('workbench'));
            assert.ok(testObject.affectsConfiguration('workbench', { resource: uri_1.URI.file('folder2') }));
            assert.ok(testObject.affectsConfiguration('workbench', { resource: uri_1.URI.file((0, path_1.join)('folder2', 'file2')) }));
            assert.ok(!testObject.affectsConfiguration('workbench', { resource: uri_1.URI.file('folder1') }));
            assert.ok(!testObject.affectsConfiguration('workbench', { resource: uri_1.URI.file('folder3') }));
            assert.ok(!testObject.affectsConfiguration('files'));
            assert.ok(!testObject.affectsConfiguration('files', { resource: uri_1.URI.file('folder1') }));
            assert.ok(!testObject.affectsConfiguration('files', { resource: uri_1.URI.file((0, path_1.join)('folder1', 'file1')) }));
            assert.ok(!testObject.affectsConfiguration('files', { resource: uri_1.URI.file('folder2') }));
            assert.ok(!testObject.affectsConfiguration('files', { resource: uri_1.URI.file((0, path_1.join)('folder2', 'file2')) }));
            assert.ok(!testObject.affectsConfiguration('files', { resource: uri_1.URI.file('folder3') }));
            assert.ok(!testObject.affectsConfiguration('files', { resource: uri_1.URI.file((0, path_1.join)('folder3', 'file3')) }));
        });
        test('changeEvent - all', () => {
            const configuration = new configurationModels_1.Configuration(new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            configuration.updateFolderConfiguration(uri_1.URI.file('file1'), toConfigurationModel({ 'window.zoomLevel': 2, 'window.restoreFullscreen': true }));
            const data = configuration.toData();
            const change = (0, configurationModels_1.mergeChanges)(configuration.compareAndUpdateDefaultConfiguration(toConfigurationModel({
                'editor.lineNumbers': 'off',
                '[markdown]': {
                    'editor.wordWrap': 'off'
                }
            }), ['editor.lineNumbers', '[markdown]']), configuration.compareAndUpdateLocalUserConfiguration(toConfigurationModel({
                '[json]': {
                    'editor.lineNumbers': 'relative'
                }
            })), configuration.compareAndUpdateWorkspaceConfiguration(toConfigurationModel({ 'window.title': 'custom' })), configuration.compareAndDeleteFolderConfiguration(uri_1.URI.file('file1')), configuration.compareAndUpdateFolderConfiguration(uri_1.URI.file('file2'), toConfigurationModel({ 'workbench.editor.enablePreview': true, 'window.restoreWindows': true })));
            const workspace = new testWorkspace_1.Workspace('a', [new workspace_1.WorkspaceFolder({ index: 0, name: 'a', uri: uri_1.URI.file('file1') }), new workspace_1.WorkspaceFolder({ index: 1, name: 'b', uri: uri_1.URI.file('file2') }), new workspace_1.WorkspaceFolder({ index: 2, name: 'c', uri: uri_1.URI.file('folder3') })]);
            const testObject = new configurationModels_1.ConfigurationChangeEvent(change, { data, workspace }, configuration, workspace);
            assert.deepStrictEqual([...testObject.affectedKeys], ['editor.lineNumbers', '[markdown]', '[json]', 'window.title', 'window.zoomLevel', 'window.restoreFullscreen', 'workbench.editor.enablePreview', 'window.restoreWindows', 'editor.wordWrap']);
            assert.ok(testObject.affectsConfiguration('window.title'));
            assert.ok(testObject.affectsConfiguration('window.title', { resource: uri_1.URI.file('file1') }));
            assert.ok(testObject.affectsConfiguration('window.title', { resource: uri_1.URI.file('file2') }));
            assert.ok(testObject.affectsConfiguration('window'));
            assert.ok(testObject.affectsConfiguration('window', { resource: uri_1.URI.file('file1') }));
            assert.ok(testObject.affectsConfiguration('window', { resource: uri_1.URI.file('file2') }));
            assert.ok(testObject.affectsConfiguration('window.zoomLevel'));
            assert.ok(testObject.affectsConfiguration('window.zoomLevel', { resource: uri_1.URI.file('file1') }));
            assert.ok(!testObject.affectsConfiguration('window.zoomLevel', { resource: uri_1.URI.file('file2') }));
            assert.ok(testObject.affectsConfiguration('window.restoreFullscreen'));
            assert.ok(testObject.affectsConfiguration('window.restoreFullscreen', { resource: uri_1.URI.file('file1') }));
            assert.ok(!testObject.affectsConfiguration('window.restoreFullscreen', { resource: uri_1.URI.file('file2') }));
            assert.ok(testObject.affectsConfiguration('window.restoreWindows'));
            assert.ok(testObject.affectsConfiguration('window.restoreWindows', { resource: uri_1.URI.file('file2') }));
            assert.ok(!testObject.affectsConfiguration('window.restoreWindows', { resource: uri_1.URI.file('file1') }));
            assert.ok(testObject.affectsConfiguration('workbench.editor.enablePreview'));
            assert.ok(testObject.affectsConfiguration('workbench.editor.enablePreview', { resource: uri_1.URI.file('file2') }));
            assert.ok(!testObject.affectsConfiguration('workbench.editor.enablePreview', { resource: uri_1.URI.file('file1') }));
            assert.ok(testObject.affectsConfiguration('workbench.editor'));
            assert.ok(testObject.affectsConfiguration('workbench.editor', { resource: uri_1.URI.file('file2') }));
            assert.ok(!testObject.affectsConfiguration('workbench.editor', { resource: uri_1.URI.file('file1') }));
            assert.ok(testObject.affectsConfiguration('workbench'));
            assert.ok(testObject.affectsConfiguration('workbench', { resource: uri_1.URI.file('file2') }));
            assert.ok(!testObject.affectsConfiguration('workbench', { resource: uri_1.URI.file('file1') }));
            assert.ok(!testObject.affectsConfiguration('files'));
            assert.ok(!testObject.affectsConfiguration('files', { resource: uri_1.URI.file('file1') }));
            assert.ok(!testObject.affectsConfiguration('files', { resource: uri_1.URI.file('file2') }));
            assert.ok(testObject.affectsConfiguration('editor'));
            assert.ok(testObject.affectsConfiguration('editor', { resource: uri_1.URI.file('file1') }));
            assert.ok(testObject.affectsConfiguration('editor', { resource: uri_1.URI.file('file2') }));
            assert.ok(testObject.affectsConfiguration('editor', { resource: uri_1.URI.file('file1'), overrideIdentifier: 'json' }));
            assert.ok(testObject.affectsConfiguration('editor', { resource: uri_1.URI.file('file1'), overrideIdentifier: 'markdown' }));
            assert.ok(testObject.affectsConfiguration('editor', { resource: uri_1.URI.file('file1'), overrideIdentifier: 'typescript' }));
            assert.ok(testObject.affectsConfiguration('editor', { resource: uri_1.URI.file('file2'), overrideIdentifier: 'json' }));
            assert.ok(testObject.affectsConfiguration('editor', { resource: uri_1.URI.file('file2'), overrideIdentifier: 'markdown' }));
            assert.ok(testObject.affectsConfiguration('editor', { resource: uri_1.URI.file('file2'), overrideIdentifier: 'typescript' }));
            assert.ok(testObject.affectsConfiguration('editor.lineNumbers'));
            assert.ok(testObject.affectsConfiguration('editor.lineNumbers', { resource: uri_1.URI.file('file1') }));
            assert.ok(testObject.affectsConfiguration('editor.lineNumbers', { resource: uri_1.URI.file('file2') }));
            assert.ok(testObject.affectsConfiguration('editor.lineNumbers', { resource: uri_1.URI.file('file1'), overrideIdentifier: 'json' }));
            assert.ok(testObject.affectsConfiguration('editor.lineNumbers', { resource: uri_1.URI.file('file1'), overrideIdentifier: 'markdown' }));
            assert.ok(testObject.affectsConfiguration('editor.lineNumbers', { resource: uri_1.URI.file('file1'), overrideIdentifier: 'typescript' }));
            assert.ok(testObject.affectsConfiguration('editor.lineNumbers', { resource: uri_1.URI.file('file2'), overrideIdentifier: 'json' }));
            assert.ok(testObject.affectsConfiguration('editor.lineNumbers', { resource: uri_1.URI.file('file2'), overrideIdentifier: 'markdown' }));
            assert.ok(testObject.affectsConfiguration('editor.lineNumbers', { resource: uri_1.URI.file('file2'), overrideIdentifier: 'typescript' }));
            assert.ok(testObject.affectsConfiguration('editor.wordWrap'));
            assert.ok(!testObject.affectsConfiguration('editor.wordWrap', { resource: uri_1.URI.file('file1') }));
            assert.ok(!testObject.affectsConfiguration('editor.wordWrap', { resource: uri_1.URI.file('file2') }));
            assert.ok(!testObject.affectsConfiguration('editor.wordWrap', { resource: uri_1.URI.file('file1'), overrideIdentifier: 'json' }));
            assert.ok(testObject.affectsConfiguration('editor.wordWrap', { resource: uri_1.URI.file('file1'), overrideIdentifier: 'markdown' }));
            assert.ok(!testObject.affectsConfiguration('editor.wordWrap', { resource: uri_1.URI.file('file1'), overrideIdentifier: 'typescript' }));
            assert.ok(!testObject.affectsConfiguration('editor.wordWrap', { resource: uri_1.URI.file('file2'), overrideIdentifier: 'json' }));
            assert.ok(testObject.affectsConfiguration('editor.wordWrap', { resource: uri_1.URI.file('file2'), overrideIdentifier: 'markdown' }));
            assert.ok(!testObject.affectsConfiguration('editor.wordWrap', { resource: uri_1.URI.file('file2'), overrideIdentifier: 'typescript' }));
            assert.ok(!testObject.affectsConfiguration('editor.fontSize'));
            assert.ok(!testObject.affectsConfiguration('editor.fontSize', { resource: uri_1.URI.file('file1') }));
            assert.ok(!testObject.affectsConfiguration('editor.fontSize', { resource: uri_1.URI.file('file2') }));
        });
        test('changeEvent affecting tasks and launches', () => {
            const configuration = new configurationModels_1.Configuration(new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            const change = configuration.compareAndUpdateLocalUserConfiguration(toConfigurationModel({
                'launch': {
                    'configuraiton': {}
                },
                'launch.version': 1,
                'tasks': {
                    'version': 2
                }
            }));
            const testObject = new configurationModels_1.ConfigurationChangeEvent(change, undefined, configuration);
            assert.deepStrictEqual([...testObject.affectedKeys], ['launch', 'launch.version', 'tasks']);
            assert.ok(testObject.affectsConfiguration('launch'));
            assert.ok(testObject.affectsConfiguration('launch.version'));
            assert.ok(testObject.affectsConfiguration('tasks'));
        });
        test('affectsConfiguration returns false for empty string', () => {
            const configuration = new configurationModels_1.Configuration(new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            const change = configuration.compareAndUpdateLocalUserConfiguration(toConfigurationModel({ 'window.zoomLevel': 1 }));
            const testObject = new configurationModels_1.ConfigurationChangeEvent(change, undefined, configuration);
            assert.strictEqual(false, testObject.affectsConfiguration(''));
        });
    });
    function toConfigurationModel(obj) {
        const parser = new configurationModels_1.ConfigurationModelParser('test');
        parser.parse(JSON.stringify(obj));
        return parser.configurationModel;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbk1vZGVscy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9jb25maWd1cmF0aW9uL3Rlc3QvY29tbW9uL2NvbmZpZ3VyYXRpb25Nb2RlbHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFjQSxLQUFLLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1FBRXRDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxVQUFVLENBQUMsR0FBRyxFQUFFO1lBQ2YsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUFVLENBQUMsYUFBYSxDQUFDLENBQUMscUJBQXFCLENBQUM7Z0JBQ25GLElBQUksRUFBRSw4QkFBOEI7Z0JBQ3BDLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixZQUFZLEVBQUU7b0JBQ2IsNENBQTRDLEVBQUU7d0JBQzdDLE1BQU0sRUFBRSxRQUFRO3dCQUNoQixTQUFTLEVBQUUsT0FBTztxQkFDbEI7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywyREFBMkQsRUFBRSxHQUFHLEVBQUU7WUFDdEUsTUFBTSxVQUFVLEdBQUcsSUFBSSw4Q0FBd0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVwRCxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFeEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJ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QUFHLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25ILE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFFLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDOUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1lBQ3RDLE1BQU0sSUFBSSxHQUFHLElBQUksd0NBQWtCLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNySixNQUFNLEdBQUcsR0FBRyxJQUFJLHdDQUFrQixDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFD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QUM7UUFDL0UsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMseURBQXlELEVBQUUsR0FBRyxFQUFFO1lBQ3BFLE1BQU0sVUFBVSxHQUFHLElBQUksd0NBQWtCLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU1SSxJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsNEJBQTRCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRTVFLE1BQU0sR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsNEJBQTRCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzdFLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1FQUFtRSxFQUFFLEdBQUcsRUFBRTtZQUM5RSxNQUFNLFVBQVUsR0FBRyxJQUFJLHdDQUFrQixDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVwTixNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNwRSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVoRCxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ2xGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdFQUFnRSxFQUFFLEdBQUcsRUFBRTtZQUMzRSxNQUFNLFVBQVUsR0FBRyxJQUFJLHdDQUFrQixDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2TSxNQUFNLE1BQU0sR0FBRyxJQUFJLHdDQUFrQixDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVoTixNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXhDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNwRSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDckQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO2dCQUN4QyxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDekQsRUFBRSxXQUFXLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFO2dCQUMzRSxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTthQUN0RSxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7WUFDckMsTUFBTSxVQUFVLEdBQUcsSUFBSSx3Q0FBa0IsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFcEosTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xKLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDL0ksTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN2SixNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FB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Q0FBa0IsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzlELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFMUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xKLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDL0ksTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDcEgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQ3pILE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ3JJLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9FQUFvRSxFQUFFLEdBQUcsRUFBRTtZQUMvRSxNQUFNLE9BQU8sR0FBRyxJQUFJLHdDQUFrQixDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQzdILEdBQUcsRUFBRSxDQUFDO29CQUNOLEdBQUcsRUFBRSxDQUFDO29CQUNOLEdBQUcsRUFBRSxDQUFDO29CQUNOLFFBQVEsRUFBRTt3QkFDVCxHQUFHLEVBQUUsQ0FBQzt3QkFDTixHQUFHLEVBQUUsQ0FBQztxQkFDTjtpQkFDRCxDQUFDLENBQUMsQ0FBQztZQUNKLE1BQU0sT0FBTyxHQUFHLElBQUksd0NBQWtCLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM5RCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsSixNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQy9JLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsSixNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQy9JLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUs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O1lBRXZILE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0csTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0csTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0csTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFNUYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNyRCxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4RixNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2RyxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4RixNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2RyxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4RixNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2RyxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RixNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RixNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV0RixNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7WUFDN0UsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsZ0NBQWdDLEVBQUUsRUFBRSxRQUFRLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxTQUFT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QUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlILE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xJLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BJLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlILE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xJLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXBJLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUM5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