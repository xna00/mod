/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/diff/diff", "vs/base/test/common/utils"], function (require, exports, assert, diff_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createArray(length, value) {
        const r = [];
        for (let i = 0; i < length; i++) {
            r[i] = value;
        }
        return r;
    }
    function maskBasedSubstring(str, mask) {
        let r = '';
        for (let i = 0; i < str.length; i++) {
            if (mask[i]) {
                r += str.charAt(i);
            }
        }
        return r;
    }
    function assertAnswer(originalStr, modifiedStr, changes, answerStr, onlyLength = false) {
        const originalMask = createArray(originalStr.length, true);
        const modifiedMask = createArray(modifiedStr.length, true);
        let i, j, change;
        for (i = 0; i < changes.length; i++) {
            change = changes[i];
            if (change.originalLength) {
                for (j = 0; j < change.originalLength; j++) {
                    originalMask[change.originalStart + j] = false;
                }
            }
            if (change.modifiedLength) {
                for (j = 0; j < change.modifiedLength; j++) {
                    modifiedMask[change.modifiedStart + j] = false;
                }
            }
        }
        const originalAnswer = maskBasedSubstring(originalStr, originalMask);
        const modifiedAnswer = maskBasedSubstring(modifiedStr, modifiedMask);
        if (onlyLength) {
            assert.strictEqual(originalAnswer.length, answerStr.length);
            assert.strictEqual(modifiedAnswer.length, answerStr.length);
        }
        else {
            assert.strictEqual(originalAnswer, answerStr);
            assert.strictEqual(modifiedAnswer, answerStr);
        }
    }
    function lcsInnerTest(originalStr, modifiedStr, answerStr, onlyLength = false) {
        const diff = new diff_1.LcsDiff(new diff_1.StringDiffSequence(originalStr), new diff_1.StringDiffSequence(modifiedStr));
        const changes = diff.ComputeDiff(false).changes;
        assertAnswer(originalStr, modifiedStr, changes, answerStr, onlyLength);
    }
    function stringPower(str, power) {
        let r = str;
        for (let i = 0; i < power; i++) {
            r += r;
        }
        return r;
    }
    function lcsTest(originalStr, modifiedStr, answerStr) {
        lcsInnerTest(originalStr, modifiedStr, answerStr);
        for (let i = 2; i <= 5; i++) {
            lcsInnerTest(stringPower(originalStr, i), stringPower(modifiedStr, i), stringPower(answerStr, i), true);
        }
    }
    suite('Diff', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('LcsDiff - different strings tests', function () {
            this.timeout(10000);
            lcsTest('heLLo world', 'hello orlando', 'heo orld');
            lcsTest('abcde', 'acd', 'acd'); // simple
            lcsTest('abcdbce', 'bcede', 'bcde'); // skip
            lcsTest('abcdefgabcdefg', 'bcehafg', 'bceafg'); // long
            lcsTest('abcde', 'fgh', ''); // no match
            lcsTest('abcfabc', 'fabc', 'fabc');
            lcsTest('0azby0', '9axbzby9', 'azby');
            lcsTest('0abc00000', '9a1b2c399999', 'abc');
            lcsTest('fooBar', 'myfooBar', 'fooBar'); // all insertions
            lcsTest('fooBar', 'fooMyBar', 'fooBar'); // all insertions
            lcsTest('fooBar', 'fooBar', 'fooBar'); // identical sequences
        });
    });
    suite('Diff - Ported from VS', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('using continue processing predicate to quit early', function () {
            const left = 'abcdef';
            const right = 'abxxcyyydzzzzezzzzzzzzzzzzzzzzzzzzf';
            // We use a long non-matching portion at the end of the right-side string, so the backwards tracking logic
            // doesn't get there first.
            let predicateCallCount = 0;
            let diff = new diff_1.LcsDiff(new diff_1.StringDiffSequence(left), new diff_1.StringDiffSequence(right), function (leftIndex, longestMatchSoFar) {
                assert.strictEqual(predicateCallCount, 0);
                predicateCallCount++;
                assert.strictEqual(leftIndex, 1);
                // cancel processing
                return false;
            });
            let changes = diff.ComputeDiff(true).changes;
            assert.strictEqual(predicateCallCount, 1);
            // Doesn't include 'c', 'd', or 'e', since we quit on the first request
            assertAnswer(left, right, changes, 'abf');
            // Cancel after the first match ('c')
            diff = new diff_1.LcsDiff(new diff_1.StringDiffSequence(left), new diff_1.StringDiffSequence(right), function (leftIndex, longestMatchSoFar) {
                assert(longestMatchSoFar <= 1); // We never see a match of length > 1
                // Continue processing as long as there hasn't been a match made.
                return longestMatchSoFar < 1;
            });
            changes = diff.ComputeDiff(true).changes;
            assertAnswer(left, right, changes, 'abcf');
            // Cancel after the second match ('d')
            diff = new diff_1.LcsDiff(new diff_1.StringDiffSequence(left), new diff_1.StringDiffSequence(right), function (leftIndex, longestMatchSoFar) {
                assert(longestMatchSoFar <= 2); // We never see a match of length > 2
                // Continue processing as long as there hasn't been a match made.
                return longestMatchSoFar < 2;
            });
            changes = diff.ComputeDiff(true).changes;
            assertAnswer(left, right, changes, 'abcdf');
            // Cancel *one iteration* after the second match ('d')
            let hitSecondMatch = false;
            diff = new diff_1.LcsDiff(new diff_1.StringDiffSequence(left), new diff_1.StringDiffSequence(right), function (leftIndex, longestMatchSoFar) {
                assert(longestMatchSoFar <= 2); // We never see a match of length > 2
                const hitYet = hitSecondMatch;
                hitSecondMatch = longestMatchSoFar > 1;
                // Continue processing as long as there hasn't been a match made.
                return !hitYet;
            });
            changes = diff.ComputeDiff(true).changes;
            assertAnswer(left, right, changes, 'abcdf');
            // Cancel after the third and final match ('e')
            diff = new diff_1.LcsDiff(new diff_1.StringDiffSequence(left), new diff_1.StringDiffSequence(right), function (leftIndex, longestMatchSoFar) {
                assert(longestMatchSoFar <= 3); // We never see a match of length > 3
                // Continue processing as long as there hasn't been a match made.
                return longestMatchSoFar < 3;
            });
            changes = diff.ComputeDiff(true).changes;
            assertAnswer(left, right, changes, 'abcdef');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3QvY29tbW9uL2RpZmYvZGlmZi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLFNBQVMsV0FBVyxDQUFJLE1BQWMsRUFBRSxLQUFRO1FBQy9DLE1BQU0sQ0FBQyxHQUFRLEVBQUUsQ0FBQztRQUNsQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDakMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUNkLENBQUM7UUFDRCxPQUFPLENBQUMsQ0FBQztJQUNWLENBQUM7SUFFRCxTQUFTLGtCQUFrQixDQUFDLEdBQVcsRUFBRSxJQUFlO1FBQ3ZELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNYLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDckMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDYixDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQixDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztJQUVELFNBQVMsWUFBWSxDQUFDLFdBQW1CLEVBQUUsV0FBbUIsRUFBRSxPQUFzQixFQUFFLFNBQWlCLEVBQUUsYUFBc0IsS0FBSztRQUNySSxNQUFNLFlBQVksR0FBRyxXQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzRCxNQUFNLFlBQVksR0FBRyxXQUFXLENBQUMsV0FBVyxDQUFD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