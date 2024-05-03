/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/services/preferences/common/preferencesValidation"], function (require, exports, assert, utils_1, preferencesValidation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Preferences Validation', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        class Tester {
            constructor(settings) {
                this.settings = settings;
                this.validator = (0, preferencesValidation_1.createValidator)(settings);
            }
            accepts(input) {
                assert.strictEqual(this.validator(input), '', `Expected ${JSON.stringify(this.settings)} to accept \`${JSON.stringify(input)}\`. Got ${this.validator(input)}.`);
            }
            rejects(input) {
                assert.notStrictEqual(this.validator(input), '', `Expected ${JSON.stringify(this.settings)} to reject \`${JSON.stringify(input)}\`.`);
                return {
                    withMessage: (message) => {
                        const actual = this.validator(input);
                        assert.ok(actual);
                        assert(actual.indexOf(message) > -1, `Expected error of ${JSON.stringify(this.settings)} on \`${input}\` to contain ${message}. Got ${this.validator(input)}.`);
                    }
                };
            }
            validatesNumeric() {
                this.accepts('3');
                this.accepts('3.');
                this.accepts('.0');
                this.accepts('3.0');
                this.accepts(' 3.0');
                this.accepts(' 3.0  ');
                this.rejects('3f');
                this.accepts(3);
                this.rejects('test');
            }
            validatesNullableNumeric() {
                this.validatesNumeric();
                this.accepts(0);
                this.accepts('');
                this.accepts(null);
                this.accepts(undefined);
            }
            validatesNonNullableNumeric() {
                this.validatesNumeric();
                this.accepts(0);
                this.rejects('');
                this.rejects(null);
                this.rejects(undefined);
            }
            validatesString() {
                this.accepts('3');
                this.accepts('3.');
                this.accepts('.0');
                this.accepts('3.0');
                this.accepts(' 3.0');
                this.accepts(' 3.0  ');
                this.accepts('');
                this.accepts('3f');
                this.accepts('hello');
                this.rejects(6);
            }
        }
        test('exclusive max and max work together properly', () => {
            {
                const justMax = new Tester({ maximum: 5, type: 'number' });
                justMax.validatesNonNullableNumeric();
                justMax.rejects('5.1');
                justMax.accepts('5.0');
            }
            {
                const justEMax = new Tester({ exclusiveMaximum: 5, type: 'number' });
                justEMax.validatesNonNullableNumeric();
                justEMax.rejects('5.1');
                justEMax.rejects('5.0');
                justEMax.accepts('4.999');
            }
            {
                const bothNumeric = new Tester({ exclusiveMaximum: 5, maximum: 4, type: 'number' });
                bothNumeric.validatesNonNullableNumeric();
                bothNumeric.rejects('5.1');
                bothNumeric.rejects('5.0');
                bothNumeric.rejects('4.999');
                bothNumeric.accepts('4');
            }
            {
                const bothNumeric = new Tester({ exclusiveMaximum: 5, maximum: 6, type: 'number' });
                bothNumeric.validatesNonNullableNumeric();
                bothNumeric.rejects('5.1');
                bothNumeric.rejects('5.0');
                bothNumeric.accepts('4.999');
            }
        });
        test('exclusive min and min work together properly', () => {
            {
                const justMin = new Tester({ minimum: -5, type: 'number' });
                justMin.validatesNonNullableNumeric();
                justMin.rejects('-5.1');
                justMin.accepts('-5.0');
            }
            {
                const justEMin = new Tester({ exclusiveMinimum: -5, type: 'number' });
                justEMin.validatesNonNullableNumeric();
                justEMin.rejects('-5.1');
                justEMin.rejects('-5.0');
                justEMin.accepts('-4.999');
            }
            {
                const bothNumeric = new Tester({ exclusiveMinimum: -5, minimum: -4, type: 'number' });
                bothNumeric.validatesNonNullableNumeric();
                bothNumeric.rejects('-5.1');
                bothNumeric.rejects('-5.0');
                bothNumeric.rejects('-4.999');
                bothNumeric.accepts('-4');
            }
            {
                const bothNumeric = new Tester({ exclusiveMinimum: -5, minimum: -6, type: 'number' });
                bothNumeric.validatesNonNullableNumeric();
                bothNumeric.rejects('-5.1');
                bothNumeric.rejects('-5.0');
                bothNumeric.accepts('-4.999');
            }
        });
        test('multiple of works for both integers and fractions', () => {
            {
                const onlyEvens = new Tester({ multipleOf: 2, type: 'number' });
                onlyEvens.accepts('2.0');
                onlyEvens.accepts('2');
                onlyEvens.accepts('-4');
                onlyEvens.accepts('0');
                onlyEvens.accepts('100');
                onlyEvens.rejects('100.1');
                onlyEvens.rejects('');
                onlyEvens.rejects('we');
            }
            {
                const hackyIntegers = new Tester({ multipleOf: 1, type: 'number' });
                hackyIntegers.accepts('2.0');
                hackyIntegers.rejects('.5');
            }
            {
                const halfIntegers = new Tester({ multipleOf: 0.5, type: 'number' });
                halfIntegers.accepts('0.5');
                halfIntegers.accepts('1.5');
                halfIntegers.rejects('1.51');
            }
        });
        test('integer type correctly adds a validation', () => {
            {
                const integers = new Tester({ multipleOf: 1, type: 'integer' });
                integers.accepts('02');
                integers.accepts('2');
                integers.accepts('20');
                integers.rejects('.5');
                integers.rejects('2j');
                integers.rejects('');
            }
        });
        test('null is allowed only when expected', () => {
            {
                const nullableIntegers = new Tester({ type: ['integer', 'null'] });
                nullableIntegers.accepts('2');
                nullableIntegers.rejects('.5');
                nullableIntegers.accepts('2.0');
                nullableIntegers.rejects('2j');
                nullableIntegers.accepts('');
            }
            {
                const nonnullableIntegers = new Tester({ type: ['integer'] });
                nonnullableIntegers.accepts('2');
                nonnullableIntegers.rejects('.5');
                nonnullableIntegers.accepts('2.0');
                nonnullableIntegers.rejects('2j');
                nonnullableIntegers.rejects('');
            }
            {
                const nullableNumbers = new Tester({ type: ['number', 'null'] });
                nullableNumbers.accepts('2');
                nullableNumbers.accepts('.5');
                nullableNumbers.accepts('2.0');
                nullableNumbers.rejects('2j');
                nullableNumbers.accepts('');
            }
            {
                const nonnullableNumbers = new Tester({ type: ['number'] });
                nonnullableNumbers.accepts('2');
                nonnullableNumbers.accepts('.5');
                nonnullableNumbers.accepts('2.0');
                nonnullableNumbers.rejects('2j');
                nonnullableNumbers.rejects('');
            }
        });
        test('string max min length work', () => {
            {
                const min = new Tester({ minLength: 4, type: 'string' });
                min.rejects('123');
                min.accepts('1234');
                min.accepts('12345');
            }
            {
                const max = new Tester({ maxLength: 6, type: 'string' });
                max.accepts('12345');
                max.accepts('123456');
                max.rejects('1234567');
            }
            {
                const minMax = new Tester({ minLength: 4, maxLength: 6, type: 'string' });
                minMax.rejects('123');
                minMax.accepts('1234');
                minMax.accepts('12345');
                minMax.accepts('123456');
                minMax.rejects('1234567');
            }
        });
        test('objects work', () => {
            {
                const obj = new Tester({ type: 'object', properties: { 'a': { type: 'string', maxLength: 2 } }, additionalProperties: false });
                obj.rejects({ 'a': 'string' });
                obj.accepts({ 'a': 'st' });
                obj.rejects({ 'a': null });
                obj.rejects({ 'a': 7 });
                obj.accepts({});
                obj.rejects('test');
                obj.rejects(7);
                obj.rejects([1, 2, 3]);
            }
            {
                const pattern = new Tester({ type: 'object', patternProperties: { '^a[a-z]$': { type: 'string', minLength: 2 } }, additionalProperties: false });
                pattern.accepts({ 'ab': 'string' });
                pattern.accepts({ 'ab': 'string', 'ac': 'hmm' });
                pattern.rejects({ 'ab': 'string', 'ac': 'h' });
                pattern.rejects({ 'ab': 'string', 'ac': 99999 });
                pattern.rejects({ 'abc': 'string' });
                pattern.rejects({ 'a0': 'string' });
                pattern.rejects({ 'ab': 'string', 'bc': 'hmm' });
                pattern.rejects({ 'be': 'string' });
                pattern.rejects({ 'be': 'a' });
                pattern.accepts({});
            }
            {
                const pattern = new Tester({ type: 'object', patternProperties: { '^#': { type: 'string', minLength: 3 } }, additionalProperties: { type: 'string', maxLength: 3 } });
                pattern.accepts({ '#ab': 'string' });
                pattern.accepts({ 'ab': 'str' });
                pattern.rejects({ '#ab': 's' });
                pattern.rejects({ 'ab': 99999 });
                pattern.rejects({ '#ab': 99999 });
                pattern.accepts({});
            }
            {
                const pattern = new Tester({ type: 'object', properties: { 'hello': { type: 'string' } }, additionalProperties: { type: 'boolean' } });
                pattern.accepts({ 'hello': 'world' });
                pattern.accepts({ 'hello': 'world', 'bye': false });
                pattern.rejects({ 'hello': 'world', 'bye': 'false' });
                pattern.rejects({ 'hello': 'world', 'bye': 1 });
                pattern.rejects({ 'hello': 'world', 'bye': 'world' });
                pattern.accepts({ 'hello': 'test' });
                pattern.accepts({});
            }
        });
        test('numerical objects work', () => {
            {
                const obj = new Tester({ type: 'object', properties: { 'b': { type: 'number' } } });
                obj.accepts({ 'b': 2.5 });
                obj.accepts({ 'b': -2.5 });
                obj.accepts({ 'b': 0 });
                obj.accepts({ 'b': '0.12' });
                obj.rejects({ 'b': 'abc' });
                obj.rejects({ 'b': [] });
                obj.rejects({ 'b': false });
                obj.rejects({ 'b': null });
                obj.rejects({ 'b': undefined });
            }
            {
                const obj = new Tester({ type: 'object', properties: { 'b': { type: 'integer', minimum: 2, maximum: 5.5 } } });
                obj.accepts({ 'b': 2 });
                obj.accepts({ 'b': 3 });
                obj.accepts({ 'b': '3.0' });
                obj.accepts({ 'b': 5 });
                obj.rejects({ 'b': 1 });
                obj.rejects({ 'b': 6 });
                obj.rejects({ 'b': 5.5 });
            }
        });
        test('patterns work', () => {
            {
                const urls = new Tester({ pattern: '^(hello)*$', type: 'string' });
                urls.accepts('');
                urls.rejects('hel');
                urls.accepts('hello');
                urls.rejects('hellohel');
                urls.accepts('hellohello');
            }
            {
                const urls = new Tester({ pattern: '^(hello)*$', type: 'string', patternErrorMessage: 'err: must be friendly' });
                urls.accepts('');
                urls.rejects('hel').withMessage('err: must be friendly');
                urls.accepts('hello');
                urls.rejects('hellohel').withMessage('err: must be friendly');
                urls.accepts('hellohello');
            }
            {
                const unicodePattern = new Tester({ type: 'string', pattern: '^[\\p{L}\\d_. -]*$', minLength: 3 });
                unicodePattern.accepts('_autoload');
                unicodePattern.rejects('#hash');
                unicodePattern.rejects('');
            }
        });
        test('custom error messages are shown', () => {
            const withMessage = new Tester({ minLength: 1, maxLength: 0, type: 'string', errorMessage: 'always error!' });
            withMessage.rejects('').withMessage('always error!');
            withMessage.rejects(' ').withMessage('always error!');
            withMessage.rejects('1').withMessage('always error!');
        });
        class ArrayTester {
            constructor(settings) {
                this.settings = settings;
                this.validator = (0, preferencesValidation_1.createValidator)(settings);
            }
            accepts(input) {
                assert.strictEqual(this.validator(input), '', `Expected ${JSON.stringify(this.settings)} to accept \`${JSON.stringify(input)}\`. Got ${this.validator(input)}.`);
            }
            rejects(input) {
                assert.notStrictEqual(this.validator(input), '', `Expected ${JSON.stringify(this.settings)} to reject \`${JSON.stringify(input)}\`.`);
                return {
                    withMessage: (message) => {
                        const actual = this.validator(input);
                        assert.ok(actual);
                        assert(actual.indexOf(message) > -1, `Expected error of ${JSON.stringify(this.settings)} on \`${input}\` to contain ${message}. Got ${this.validator(input)}.`);
                    }
                };
            }
        }
        test('simple array', () => {
            {
                const arr = new ArrayTester({ type: 'array', items: { type: 'string' } });
                arr.accepts([]);
                arr.accepts(['foo']);
                arr.accepts(['foo', 'bar']);
                arr.rejects(76);
                arr.rejects([6, '3', 7]);
            }
        });
        test('min-max items array', () => {
            {
                const arr = new ArrayTester({ type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 2 });
                arr.rejects([]).withMessage('Array must have at least 1 items');
                arr.accepts(['a']);
                arr.accepts(['a', 'a']);
                arr.rejects(['a', 'a', 'a']).withMessage('Array must have at most 2 items');
            }
        });
        test('array of enums', () => {
            {
                const arr = new ArrayTester({ type: 'array', items: { type: 'string', enum: ['a', 'b'] } });
                arr.accepts(['a']);
                arr.accepts(['a', 'b']);
                arr.rejects(['c']).withMessage(`Value 'c' is not one of`);
                arr.rejects(['a', 'c']).withMessage(`Value 'c' is not one of`);
                arr.rejects(['c', 'd']).withMessage(`Value 'c' is not one of`);
                arr.rejects(['c', 'd']).withMessage(`Value 'd' is not one of`);
            }
        });
        test('array of numbers', () => {
            // We accept parseable strings since the view handles strings
            {
                const arr = new ArrayTester({ type: 'array', items: { type: 'number' } });
                arr.accepts([]);
                arr.accepts([2]);
                arr.accepts([2, 3]);
                arr.accepts(['2', '3']);
                arr.accepts([6.6, '3', 7]);
                arr.rejects(76);
                arr.rejects(7.6);
                arr.rejects([6, 'a', 7]);
            }
            {
                const arr = new ArrayTester({ type: 'array', items: { type: 'integer', minimum: -2, maximum: 3 }, maxItems: 4 });
                arr.accepts([]);
                arr.accepts([-2, 3]);
                arr.accepts([2, 3]);
                arr.accepts(['2', '3']);
                arr.accepts(['-2', '0', '3']);
                arr.accepts(['-2', 0.0, '3']);
                arr.rejects(2);
                arr.rejects(76);
                arr.rejects([6, '3', 7]);
                arr.rejects([2, 'a', 3]);
                arr.rejects([-2, 4]);
                arr.rejects([-1.2, 2.1]);
                arr.rejects([-3, 3]);
                arr.rejects([-3, 4]);
                arr.rejects([2, 2, 2, 2, 2]);
            }
        });
        test('min-max and enum', () => {
            const arr = new ArrayTester({ type: 'array', items: { type: 'string', enum: ['a', 'b'] }, minItems: 1, maxItems: 2 });
            arr.rejects(['a', 'b', 'c']).withMessage('Array must have at most 2 items');
            arr.rejects(['a', 'b', 'c']).withMessage(`Value 'c' is not one of`);
        });
        test('pattern', () => {
            const arr = new ArrayTester({ type: 'array', items: { type: 'string', pattern: '^(hello)*$' } });
            arr.accepts(['hello']);
            arr.rejects(['a']).withMessage(`Value 'a' must match regex`);
        });
        test('Unicode pattern', () => {
            const arr = new ArrayTester({ type: 'array', items: { type: 'string', pattern: '^[\\p{L}\\d_. -]*$' } });
            arr.accepts(['hello', 'world']);
            arr.rejects(['hello', '#world']).withMessage(`Value '#world' must match regex`);
        });
        test('pattern with error message', () => {
            const arr = new ArrayTester({ type: 'array', items: { type: 'string', pattern: '^(hello)*$', patternErrorMessage: 'err: must be friendly' } });
            arr.rejects(['a']).withMessage(`err: must be friendly`);
        });
        test('uniqueItems', () => {
            const arr = new ArrayTester({ type: 'array', items: { type: 'string' }, uniqueItems: true });
            arr.rejects(['a', 'a']).withMessage(`Array has duplicate items`);
        });
        test('getInvalidTypeError', () => {
            function testInvalidTypeError(value, type, shouldValidate) {
                const message = `value: ${value}, type: ${JSON.stringify(type)}, expected: ${shouldValidate ? 'valid' : 'invalid'}`;
                if (shouldValidate) {
                    assert.ok(!(0, preferencesValidation_1.getInvalidTypeError)(value, type), message);
                }
                else {
                    assert.ok((0, preferencesValidation_1.getInvalidTypeError)(value, type), message);
                }
            }
            testInvalidTypeError(1, 'number', true);
            testInvalidTypeError(1.5, 'number', true);
            testInvalidTypeError([1], 'number', false);
            testInvalidTypeError('1', 'number', false);
            testInvalidTypeError({ a: 1 }, 'number', false);
            testInvalidTypeError(null, 'number', false);
            testInvalidTypeError('a', 'string', true);
            testInvalidTypeError('1', 'string', true);
            testInvalidTypeError([], 'string', false);
            testInvalidTypeError({}, 'string', false);
            testInvalidTypeError([1], 'array', true);
            testInvalidTypeError([], 'array', true);
            testInvalidTypeError([{}, [[]]], 'array', true);
            testInvalidTypeError({ a: ['a'] }, 'array', false);
            testInvalidTypeError('hello', 'array', false);
            testInvalidTypeError(true, 'boolean', true);
            testInvalidTypeError('hello', 'boolean', false);
            testInvalidTypeError(null, 'boolean', false);
            testInvalidTypeError([true], 'boolean', false);
            testInvalidTypeError(null, 'null', true);
            testInvalidTypeError(false, 'null', false);
            testInvalidTypeError([null], 'null', false);
            testInvalidTypeError('null', 'null', false);
        });
        test('uri checks work', () => {
            const tester = new Tester({ type: 'string', format: 'uri' });
            tester.rejects('example.com');
            tester.rejects('example.com/example');
            tester.rejects('example/example.html');
            tester.rejects('www.example.com');
            tester.rejects('');
            tester.rejects(' ');
            tester.rejects('example');
            tester.accepts('https:');
            tester.accepts('https://');
            tester.accepts('https://example.com');
            tester.accepts('https://www.example.com');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNWYWxpZGF0aW9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9wcmVmZXJlbmNlcy90ZXN0L2NvbW1vbi9wcmVmZXJlbmNlc1ZhbGlkYXRpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1FBQ3BDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxNQUFNLE1BQU07WUFHWCxZQUFvQixRQUFzQztnQkFBdEMsYUFBUSxHQUFSLFFBQVEsQ0FBOEI7Z0JBQ3pELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBQSx1Q0FBZSxFQUFDLFFBQVEsQ0FBRSxDQUFDO1lBQzdDLENBQUM7WUFFTSxPQUFPLENBQUMsS0FBVTtnQkFDeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxZQUFZLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsSyxDQUFDO1lBRU0sT0FBTyxDQUFDLEtBQVU7Z0JBQ3hCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsWUFBWSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN0SSxPQUFPO29CQUNOLFdBQVcsRUFD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