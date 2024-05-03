define(["require", "exports", "assert", "vs/platform/extensions/common/extensionValidator"], function (require, exports, assert, extensionValidator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Extension Version Validator', () => {
        const productVersion = '2021-05-11T21:54:30.577Z';
        test('isValidVersionStr', () => {
            assert.strictEqual((0, extensionValidator_1.isValidVersionStr)('0.10.0-dev'), true);
            assert.strictEqual((0, extensionValidator_1.isValidVersionStr)('0.10.0'), true);
            assert.strictEqual((0, extensionValidator_1.isValidVersionStr)('0.10.1'), true);
            assert.strictEqual((0, extensionValidator_1.isValidVersionStr)('0.10.100'), true);
            assert.strictEqual((0, extensionValidator_1.isValidVersionStr)('0.11.0'), true);
            assert.strictEqual((0, extensionValidator_1.isValidVersionStr)('x.x.x'), true);
            assert.strictEqual((0, extensionValidator_1.isValidVersionStr)('0.x.x'), true);
            assert.strictEqual((0, extensionValidator_1.isValidVersionStr)('0.10.0'), true);
            assert.strictEqual((0, extensionValidator_1.isValidVersionStr)('0.10.x'), true);
            assert.strictEqual((0, extensionValidator_1.isValidVersionStr)('^0.10.0'), true);
            assert.strictEqual((0, extensionValidator_1.isValidVersionStr)('*'), true);
            assert.strictEqual((0, extensionValidator_1.isValidVersionStr)('0.x.x.x'), false);
            assert.strictEqual((0, extensionValidator_1.isValidVersionStr)('0.10'), false);
            assert.strictEqual((0, extensionValidator_1.isValidVersionStr)('0.10.'), false);
        });
        test('parseVersion', () => {
            function assertParseVersion(version, hasCaret, hasGreaterEquals, majorBase, majorMustEqual, minorBase, minorMustEqual, patchBase, patchMustEqual, preRelease) {
                const actual = (0, extensionValidator_1.parseVersion)(version);
                const expected = { hasCaret, hasGreaterEquals, majorBase, majorMustEqual, minorBase, minorMustEqual, patchBase, patchMustEqual, preRelease };
                assert.deepStrictEqual(actual, expected, 'parseVersion for ' + version);
            }
            assertParseVersion('0.10.0-dev', false, false, 0, true, 10, true, 0, true, '-dev');
            assertParseVersion('0.10.0', false, false, 0, true, 10, true, 0, true, null);
            assertParseVersion('0.10.1', false, false, 0, true, 10, true, 1, true, null);
            assertParseVersion('0.10.100', false, false, 0, true, 10, true, 100, true, null);
            assertParseVersion('0.11.0', false, false, 0, true, 11, true, 0, true, null);
            assertParseVersion('x.x.x', false, false, 0, false, 0, false, 0, false, null);
            assertParseVersion('0.x.x', false, false, 0, true, 0, false, 0, false, null);
            assertParseVersion('0.10.x', false, false, 0, true, 10, true, 0, false, null);
            assertParseVersion('^0.10.0', true, false, 0, true, 10, true, 0, true, null);
            assertParseVersion('^0.10.2', true, false, 0, true, 10, true, 2, true, null);
            assertParseVersion('^1.10.2', true, false, 1, true, 10, true, 2, true, null);
            assertParseVersion('*', false, false, 0, false, 0, false, 0, false, null);
            assertParseVersion('>=0.0.1', false, true, 0, true, 0, true, 1, true, null);
            assertParseVersion('>=2.4.3', false, true, 2, true, 4, true, 3, true, null);
        });
        test('normalizeVersion', () => {
            function assertNormalizeVersion(version, majorBase, majorMustEqual, minorBase, minorMustEqual, patchBase, patchMustEqual, isMinimum, notBefore = 0) {
                const actual = (0, extensionValidator_1.normalizeVersion)((0, extensionValidator_1.parseVersion)(version));
                const expected = { majorBase, majorMustEqual, minorBase, minorMustEqual, patchBase, patchMustEqual, isMinimum, notBefore };
                assert.deepStrictEqual(actual, expected, 'parseVersion for ' + version);
            }
            assertNormalizeVersion('0.10.0-dev', 0, true, 10, true, 0, true, false, 0);
            assertNormalizeVersion('0.10.0-222222222', 0, true, 10, true, 0, true, false, 0);
            assertNormalizeVersion('0.10.0-20210511', 0, true, 10, true, 0, true, false, new Date('2021-05-11T00:00:00Z').getTime());
            assertNormalizeVersion('0.10.0', 0, true, 10, true, 0, true, false);
            assertNormalizeVersion('0.10.1', 0, true, 10, true, 1, true, false);
            assertNormalizeVersion('0.10.100', 0, true, 10, true, 100, true, false);
            assertNormalizeVersion('0.11.0', 0, true, 11, true, 0, true, false);
            assertNormalizeVersion('x.x.x', 0, false, 0, false, 0, false, false);
            assertNormalizeVersion('0.x.x', 0, true, 0, false, 0, false, false);
            assertNormalizeVersion('0.10.x', 0, true, 10, true, 0, false, false);
            assertNormalizeVersion('^0.10.0', 0, true, 10, true, 0, false, false);
            assertNormalizeVersion('^0.10.2', 0, true, 10, true, 2, false, false);
            assertNormalizeVersion('^1.10.2', 1, true, 10, false, 2, false, false);
            assertNormalizeVersion('*', 0, false, 0, false, 0, false, false);
            assertNormalizeVersion('>=0.0.1', 0, true, 0, true, 1, true, true);
            assertNormalizeVersion('>=2.4.3', 2, true, 4, true, 3, true, true);
            assertNormalizeVersion('>=2.4.3', 2, true, 4, true, 3, true, true);
        });
        test('isValidVersion', () => {
            function testIsValidVersion(version, desiredVersion, expectedResult) {
                const actual = (0, extensionValidator_1.isValidVersion)(version, productVersion, desiredVersion);
                assert.strictEqual(actual, expectedResult, 'extension - vscode: ' + version + ', desiredVersion: ' + desiredVersion + ' should be ' + expectedResult);
            }
            testIsValidVersion('0.10.0-dev', 'x.x.x', true);
            testIsValidVersion('0.10.0-dev', '0.x.x', true);
            testIsValidVersion('0.10.0-dev', '0.10.0', true);
            testIsValidVersion('0.10.0-dev', '0.10.2', false);
            testIsValidVersion('0.10.0-dev', '^0.10.2', false);
            testIsValidVersion('0.10.0-dev', '0.10.x', true);
            testIsValidVersion('0.10.0-dev', '^0.10.0', true);
            testIsValidVersion('0.10.0-dev', '*', true);
            testIsValidVersion('0.10.0-dev', '>=0.0.1', true);
            testIsValidVersion('0.10.0-dev', '>=0.0.10', true);
            testIsValidVersion('0.10.0-dev', '>=0.10.0', true);
            testIsValidVersion('0.10.0-dev', '>=0.10.1', false);
            testIsValidVersion('0.10.0-dev', '>=1.0.0', false);
            testIsValidVersion('0.10.0', 'x.x.x', true);
            testIsValidVersion('0.10.0', '0.x.x', true);
            testIsValidVersion('0.10.0', '0.10.0', true);
            testIsValidVersion('0.10.0', '0.10.2', false);
            testIsValidVersion('0.10.0', '^0.10.2', false);
            testIsValidVersion('0.10.0', '0.10.x', true);
            testIsValidVersion('0.10.0', '^0.10.0', true);
            testIsValidVersion('0.10.0', '*', true);
            testIsValidVersion('0.10.1', 'x.x.x', true);
            testIsValidVersion('0.10.1', '0.x.x', true);
            testIsValidVersion('0.10.1', '0.10.0', false);
            testIsValidVersion('0.10.1', '0.10.2', false);
            testIsValidVersion('0.10.1', '^0.10.2', false);
            testIsValidVersion('0.10.1', '0.10.x', true);
            testIsValidVersion('0.10.1', '^0.10.0', true);
            testIsValidVersion('0.10.1', '*', true);
            testIsValidVersion('0.10.100', 'x.x.x', true);
            testIsValidVersion('0.10.100', '0.x.x', true);
            testIsValidVersion('0.10.100', '0.10.0', false);
            testIsValidVersion('0.10.100', '0.10.2', false);
            testIsValidVersion('0.10.100', '^0.10.2', true);
            testIsValidVersion('0.10.100', '0.10.x', true);
            testIsValidVersion('0.10.100', '^0.10.0', true);
            testIsValidVersion('0.10.100', '*', true);
            testIsValidVersion('0.11.0', 'x.x.x', true);
            testIsValidVersion('0.11.0', '0.x.x', true);
            testIsValidVersion('0.11.0', '0.10.0', false);
            testIsValidVersion('0.11.0', '0.10.2', false);
            testIsValidVersion('0.11.0', '^0.10.2', false);
            testIsValidVersion('0.11.0', '0.10.x', false);
            testIsValidVersion('0.11.0', '^0.10.0', false);
            testIsValidVersion('0.11.0', '*', true);
            // Anything < 1.0.0 is compatible
            testIsValidVersion('1.0.0', 'x.x.x', true);
            testIsValidVersion('1.0.0', '0.x.x', true);
            testIsValidVersion('1.0.0', '0.10.0', false);
            testIsValidVersion('1.0.0', '0.10.2', false);
            testIsValidVersion('1.0.0', '^0.10.2', true);
            testIsValidVersion('1.0.0', '0.10.x', true);
            testIsValidVersion('1.0.0', '^0.10.0', true);
            testIsValidVersion('1.0.0', '1.0.0', true);
            testIsValidVersion('1.0.0', '^1.0.0', true);
            testIsValidVersion('1.0.0', '^2.0.0', false);
            testIsValidVersion('1.0.0', '*', true);
            testIsValidVersion('1.0.0', '>=0.0.1', true);
            testIsValidVersion('1.0.0', '>=0.0.10', true);
            testIsValidVersion('1.0.0', '>=0.10.0', true);
            testIsValidVersion('1.0.0', '>=0.10.1', true);
            testIsValidVersion('1.0.0', '>=1.0.0', true);
            testIsValidVersion('1.0.0', '>=1.1.0', false);
            testIsValidVersion('1.0.0', '>=1.0.1', false);
            testIsValidVersion('1.0.0', '>=2.0.0', false);
            testIsValidVersion('1.0.100', 'x.x.x', true);
            testIsValidVersion('1.0.100', '0.x.x', true);
            testIsValidVersion('1.0.100', '0.10.0', false);
            testIsValidVersion('1.0.100', '0.10.2', false);
            testIsValidVersion('1.0.100', '^0.10.2', true);
            testIsValidVersion('1.0.100', '0.10.x', true);
            testIsValidVersion('1.0.100', '^0.10.0', true);
            testIsValidVersion('1.0.100', '1.0.0', false);
            testIsValidVersion('1.0.100', '^1.0.0', true);
            testIsValidVersion('1.0.100', '^1.0.1', true);
            testIsValidVersion('1.0.100', '^2.0.0', false);
            testIsValidVersion('1.0.100', '*', true);
            testIsValidVersion('1.100.0', 'x.x.x', true);
            testIsValidVersion('1.100.0', '0.x.x', true);
            testIsValidVersion('1.100.0', '0.10.0', false);
            testIsValidVersion('1.100.0', '0.10.2', false);
            testIsValidVersion('1.100.0', '^0.10.2', true);
            testIsValidVersion('1.100.0', '0.10.x', true);
            testIsValidVersion('1.100.0', '^0.10.0', true);
            testIsValidVersion('1.100.0', '1.0.0', false);
            testIsValidVersion('1.100.0', '^1.0.0', true);
            testIsValidVersion('1.100.0', '^1.1.0', true);
            testIsValidVersion('1.100.0', '^1.100.0', true);
            testIsValidVersion('1.100.0', '^2.0.0', false);
            testIsValidVersion('1.100.0', '*', true);
            testIsValidVersion('1.100.0', '>=1.99.0', true);
            testIsValidVersion('1.100.0', '>=1.100.0', true);
            testIsValidVersion('1.100.0', '>=1.101.0', false);
            testIsValidVersion('2.0.0', 'x.x.x', true);
            testIsValidVersion('2.0.0', '0.x.x', false);
            testIsValidVersion('2.0.0', '0.10.0', false);
            testIsValidVersion('2.0.0', '0.10.2', false);
            testIsValidVersion('2.0.0', '^0.10.2', false);
            testIsValidVersion('2.0.0', '0.10.x', false);
            testIsValidVersion('2.0.0', '^0.10.0', false);
            testIsValidVersion('2.0.0', '1.0.0', false);
            testIsValidVersion('2.0.0', '^1.0.0', false);
            testIsValidVersion('2.0.0', '^1.1.0', false);
            testIsValidVersion('2.0.0', '^1.100.0', false);
            testIsValidVersion('2.0.0', '^2.0.0', true);
            testIsValidVersion('2.0.0', '*', true);
        });
        test('isValidExtensionVersion', () => {
            function testExtensionVersion(version, desiredVersion, isBuiltin, hasMain, expectedResult) {
                const manifest = {
                    name: 'test',
                    publisher: 'test',
                    version: '0.0.0',
                    engines: {
                        vscode: desiredVersion
                    },
                    main: hasMain ? 'something' : undefined
                };
                const reasons = [];
                const actual = (0, extensionValidator_1.isValidExtensionVersion)(version, productVersion, manifest, isBuiltin, reasons);
                assert.strictEqual(actual, expectedResult, 'version: ' + version + ', desiredVersion: ' + desiredVersion + ', desc: ' + JSON.stringify(manifest) + ', reasons: ' + JSON.stringify(reasons));
            }
            function testIsInvalidExtensionVersion(version, desiredVersion, isBuiltin, hasMain) {
                testExtensionVersion(version, desiredVersion, isBuiltin, hasMain, false);
            }
            function testIsValidExtensionVersion(version, desiredVersion, isBuiltin, hasMain) {
                testExtensionVersion(version, desiredVersion, isBuiltin, hasMain, true);
            }
            function testIsValidVersion(version, desiredVersion, expectedResult) {
                testExtensionVersion(version, desiredVersion, false, true, expectedResult);
            }
            // builtin are allowed to use * or x.x.x
            testIsValidExtensionVersion('0.10.0-dev', '*', true, true);
            testIsValidExtensionVersion('0.10.0-dev', 'x.x.x', true, true);
            testIsValidExtensionVersion('0.10.0-dev', '0.x.x', true, true);
            testIsValidExtensionVersion('0.10.0-dev', '0.10.x', true, true);
            testIsValidExtensionVersion('1.10.0-dev', '1.x.x', true, true);
            testIsValidExtensionVersion('1.10.0-dev', '1.10.x', true, true);
            testIsValidExtensionVersion('0.10.0-dev', '*', true, false);
            testIsValidExtensionVersion('0.10.0-dev', 'x.x.x', true, false);
            testIsValidExtensionVersion('0.10.0-dev', '0.x.x', true, false);
            testIsValidExtensionVersion('0.10.0-dev', '0.10.x', true, false);
            testIsValidExtensionVersion('1.10.0-dev', '1.x.x', true, false);
            testIsValidExtensionVersion('1.10.0-dev', '1.10.x', true, false);
            // normal extensions are allowed to use * or x.x.x only if they have no main
            testIsInvalidExtensionVersion('0.10.0-dev', '*', false, true);
            testIsInvalidExtensionVersion('0.10.0-dev', 'x.x.x', false, true);
            testIsInvalidExtensionVersion('0.10.0-dev', '0.x.x', false, true);
            testIsValidExtensionVersion('0.10.0-dev', '0.10.x', false, true);
            testIsValidExtensionVersion('1.10.0-dev', '1.x.x', false, true);
            testIsValidExtensionVersion('1.10.0-dev', '1.10.x', false, true);
            testIsValidExtensionVersion('0.10.0-dev', '*', false, false);
            testIsValidExtensionVersion('0.10.0-dev', 'x.x.x', false, false);
            testIsValidExtensionVersion('0.10.0-dev', '0.x.x', false, false);
            testIsValidExtensionVersion('0.10.0-dev', '0.10.x', false, false);
            testIsValidExtensionVersion('1.10.0-dev', '1.x.x', false, false);
            testIsValidExtensionVersion('1.10.0-dev', '1.10.x', false, false);
            // extensions without "main" get no version check
            testIsValidExtensionVersion('0.10.0-dev', '>=0.9.1-pre.1', false, false);
            testIsValidExtensionVersion('0.10.0-dev', '*', false, false);
            testIsValidExtensionVersion('0.10.0-dev', 'x.x.x', false, false);
            testIsValidExtensionVersion('0.10.0-dev', '0.x.x', false, false);
            testIsValidExtensionVersion('0.10.0-dev', '0.10.x', false, false);
            testIsValidExtensionVersion('1.10.0-dev', '1.x.x', false, false);
            testIsValidExtensionVersion('1.10.0-dev', '1.10.x', false, false);
            testIsValidExtensionVersion('0.10.0-dev', '*', false, false);
            testIsValidExtensionVersion('0.10.0-dev', 'x.x.x', false, false);
            testIsValidExtensionVersion('0.10.0-dev', '0.x.x', false, false);
            testIsValidExtensionVersion('0.10.0-dev', '0.10.x', false, false);
            testIsValidExtensionVersion('1.10.0-dev', '1.x.x', false, false);
            testIsValidExtensionVersion('1.10.0-dev', '1.10.x', false, false);
            // normal extensions with code
            testIsValidVersion('0.10.0-dev', 'x.x.x', false); // fails due to lack of specificity
            testIsValidVersion('0.10.0-dev', '0.x.x', false); // fails due to lack of specificity
            testIsValidVersion('0.10.0-dev', '0.10.0', true);
            testIsValidVersion('0.10.0-dev', '0.10.2', false);
            testIsValidVersion('0.10.0-dev', '^0.10.2', false);
            testIsValidVersion('0.10.0-dev', '0.10.x', true);
            testIsValidVersion('0.10.0-dev', '^0.10.0', true);
            testIsValidVersion('0.10.0-dev', '*', false); // fails due to lack of specificity
            testIsValidVersion('0.10.0', 'x.x.x', false); // fails due to lack of specificity
            testIsValidVersion('0.10.0', '0.x.x', false); // fails due to lack of specificity
            testIsValidVersion('0.10.0', '0.10.0', true);
            testIsValidVersion('0.10.0', '0.10.2', false);
            testIsValidVersion('0.10.0', '^0.10.2', false);
            testIsValidVersion('0.10.0', '0.10.x', true);
            testIsValidVersion('0.10.0', '^0.10.0', true);
            testIsValidVersion('0.10.0', '*', false); // fails due to lack of specificity
            testIsValidVersion('0.10.1', 'x.x.x', false); // fails due to lack of specificity
            testIsValidVersion('0.10.1', '0.x.x', false); // fails due to lack of specificity
            testIsValidVersion('0.10.1', '0.10.0', false);
            testIsValidVersion('0.10.1', '0.10.2', false);
            testIsValidVersion('0.10.1', '^0.10.2', false);
            testIsValidVersion('0.10.1', '0.10.x', true);
            testIsValidVersion('0.10.1', '^0.10.0', true);
            testIsValidVersion('0.10.1', '*', false); // fails due to lack of specificity
            testIsValidVersion('0.10.100', 'x.x.x', false); // fails due to lack of specificity
            testIsValidVersion('0.10.100', '0.x.x', false); // fails due to lack of specificity
            testIsValidVersion('0.10.100', '0.10.0', false);
            testIsValidVersion('0.10.100', '0.10.2', false);
            testIsValidVersion('0.10.100', '^0.10.2', true);
            testIsValidVersion('0.10.100', '0.10.x', true);
            testIsValidVersion('0.10.100', '^0.10.0', true);
            testIsValidVersion('0.10.100', '*', false); // fails due to lack of specificity
            testIsValidVersion('0.11.0', 'x.x.x', false); // fails due to lack of specificity
            testIsValidVersion('0.11.0', '0.x.x', false); // fails due to lack of specificity
            testIsValidVersion('0.11.0', '0.10.0', false);
            testIsValidVersion('0.11.0', '0.10.2', false);
            testIsValidVersion('0.11.0', '^0.10.2', false);
            testIsValidVersion('0.11.0', '0.10.x', false);
            testIsValidVersion('0.11.0', '^0.10.0', false);
            testIsValidVersion('0.11.0', '*', false); // fails due to lack of specificity
            testIsValidVersion('1.0.0', 'x.x.x', false); // fails due to lack of specificity
            testIsValidVersion('1.0.0', '0.x.x', false); // fails due to lack of specificity
            testIsValidVersion('1.0.0', '0.10.0', false);
            testIsValidVersion('1.0.0', '0.10.2', false);
            testIsValidVersion('1.0.0', '^0.10.2', true);
            testIsValidVersion('1.0.0', '0.10.x', true);
            testIsValidVersion('1.0.0', '^0.10.0', true);
            testIsValidVersion('1.0.0', '*', false); // fails due to lack of specificity
            testIsValidVersion('1.10.0', 'x.x.x', false); // fails due to lack of specificity
            testIsValidVersion('1.10.0', '1.x.x', true);
            testIsValidVersion('1.10.0', '1.10.0', true);
            testIsValidVersion('1.10.0', '1.10.2', false);
            testIsValidVersion('1.10.0', '^1.10.2', false);
            testIsValidVersion('1.10.0', '1.10.x', true);
            testIsValidVersion('1.10.0', '^1.10.0', true);
            testIsValidVersion('1.10.0', '*', false); // fails due to lack of specificity
            // Anything < 1.0.0 is compatible
            testIsValidVersion('1.0.0', 'x.x.x', false); // fails due to lack of specificity
            testIsValidVersion('1.0.0', '0.x.x', false); // fails due to lack of specificity
            testIsValidVersion('1.0.0', '0.10.0', false);
            testIsValidVersion('1.0.0', '0.10.2', false);
            testIsValidVersion('1.0.0', '^0.10.2', true);
            testIsValidVersion('1.0.0', '0.10.x', true);
            testIsValidVersion('1.0.0', '^0.10.0', true);
            testIsValidVersion('1.0.0', '1.0.0', true);
            testIsValidVersion('1.0.0', '^1.0.0', true);
            testIsValidVersion('1.0.0', '^2.0.0', false);
            testIsValidVersion('1.0.0', '*', false); // fails due to lack of specificity
            testIsValidVersion('1.0.100', 'x.x.x', false); // fails due to lack of specificity
            testIsValidVersion('1.0.100', '0.x.x', false); // fails due to lack of specificity
            testIsValidVersion('1.0.100', '0.10.0', false);
            testIsValidVersion('1.0.100', '0.10.2', false);
            testIsValidVersion('1.0.100', '^0.10.2', true);
            testIsValidVersion('1.0.100', '0.10.x', true);
            testIsValidVersion('1.0.100', '^0.10.0', true);
            testIsValidVersion('1.0.100', '1.0.0', false);
            testIsValidVersion('1.0.100', '^1.0.0', true);
            testIsValidVersion('1.0.100', '^1.0.1', true);
            testIsValidVersion('1.0.100', '^2.0.0', false);
            testIsValidVersion('1.0.100', '*', false); // fails due to lack of specificity
            testIsValidVersion('1.100.0', 'x.x.x', false); // fails due to lack of specificity
            testIsValidVersion('1.100.0', '0.x.x', false); // fails due to lack of specificity
            testIsValidVersion('1.100.0', '0.10.0', false);
            testIsValidVersion('1.100.0', '0.10.2', false);
            testIsValidVersion('1.100.0', '^0.10.2', true);
            testIsValidVersion('1.100.0', '0.10.x', true);
            testIsValidVersion('1.100.0', '^0.10.0', true);
            testIsValidVersion('1.100.0', '1.0.0', false);
            testIsValidVersion('1.100.0', '^1.0.0', true);
            testIsValidVersion('1.100.0', '^1.1.0', true);
            testIsValidVersion('1.100.0', '^1.100.0', true);
            testIsValidVersion('1.100.0', '^2.0.0', false);
            testIsValidVersion('1.100.0', '*', false); // fails due to lack of specificity
            testIsValidVersion('2.0.0', 'x.x.x', false); // fails due to lack of specificity
            testIsValidVersion('2.0.0', '0.x.x', false); // fails due to lack of specificity
            testIsValidVersion('2.0.0', '0.10.0', false);
            testIsValidVersion('2.0.0', '0.10.2', false);
            testIsValidVersion('2.0.0', '^0.10.2', false);
            testIsValidVersion('2.0.0', '0.10.x', false);
            testIsValidVersion('2.0.0', '^0.10.0', false);
            testIsValidVersion('2.0.0', '1.0.0', false);
            testIsValidVersion('2.0.0', '^1.0.0', false);
            testIsValidVersion('2.0.0', '^1.1.0', false);
            testIsValidVersion('2.0.0', '^1.100.0', false);
            testIsValidVersion('2.0.0', '^2.0.0', true);
            testIsValidVersion('2.0.0', '*', false); // fails due to lack of specificity
            // date tags
            testIsValidVersion('1.10.0', '^1.10.0-20210511', true); // current date
            testIsValidVersion('1.10.0', '^1.10.0-20210510', true); // before date
            testIsValidVersion('1.10.0', '^1.10.0-20210512', false); // future date
            testIsValidVersion('1.10.1', '^1.10.0-20200101', true); // before date, but ahead version
            testIsValidVersion('1.11.0', '^1.10.0-20200101', true);
        });
        test('isValidExtensionVersion checks browser only extensions', () => {
            const manifest = {
                name: 'test',
                publisher: 'test',
                version: '0.0.0',
                engines: {
                    vscode: '^1.45.0'
                },
                browser: 'something'
            };
            assert.strictEqual((0, extensionValidator_1.isValidExtensionVersion)('1.44.0', undefined, manifest, false, []), false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uVmFsaWRhdG9yLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbnMvdGVzdC9jb21tb24vZXh0ZW5zaW9uVmFsaWRhdG9yLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBUUEsS0FBSyxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtRQUN6QyxNQUFNLGNBQWMsR0FBRywwQkFBMEIsQ0FBQztRQUVsRCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1lBQzlCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxzQ0FBaUIsRUFBQyxZQUFZLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsc0NBQWlCLEVBQUMsUUFBUSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHNDQUFpQixFQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxzQ0FBaUIsRUFBQyxVQUFVLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsc0NBQWlCLEVBQUMsUUFBUSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHNDQUFpQixFQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3JELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxzQ0FBaUIsRUFBQyxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsc0NBQWlCLEVBQUMsUUFBUSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHNDQUFpQixFQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxzQ0FBaUIsRUFBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsc0NBQWlCLEVBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHNDQUFpQixFQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxzQ0FBaUIsRUFBQyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsc0NBQWlCLEVBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtZQUN6QixTQUFTLGtCQUFrQixDQUFDLE9BQWUsRUFBRSxRQUFpQixFQUFFLGdCQUF5QixFQUFFLFNBQWlCLEVBQUUsY0FBdUIsRUFBRSxTQUFpQixFQUFFLGNBQXVCLEVBQUUsU0FBaUIsRUFBRSxjQUF1QixFQUFFLFVBQXlCO2dCQUN2UCxNQUFNLE1BQU0sR0FBRyxJQUFBLGlDQUFZLEVBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3JDLE1BQU0sUUFBUSxHQUFtQixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUUsQ0FBQztnQkFFN0osTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyxDQUFDO1lBQ3pFLENBQUM7WUFFRCxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNuRixrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3RSxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3RSxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRixrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUU3RSxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM5RSxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3RSxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM5RSxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3RSxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3RSxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3RSxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUUxRSxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1RSxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM3RSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7WUFDN0IsU0FBUyxzQkFBc0IsQ0FB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LEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRWpFLDRFQUE0RTtZQUM1RSw2QkFBNkIsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM5RCw2QkFBNkIsQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRSw2QkFBNkIsQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRSwyQkFBMkIsQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRSwyQkFBMkIsQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoRSwyQkFBMkIsQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRSwyQkFBMkIsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3RCwyQkFBMkIsQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRSwyQkFBMkIsQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRSwyQkFBMkIsQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsRSwyQkFBMkIsQ0FBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRSwyQkFBMkIsQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVsRSxpREFBaUQ7WUFDakQsMkJBQTJCLENBQUMsWUFBWSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekUsMkJBQTJCLENBQUMsWUFBWSxF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