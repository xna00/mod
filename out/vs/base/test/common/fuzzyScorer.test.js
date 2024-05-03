/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/fuzzyScorer", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/utils"], function (require, exports, assert, fuzzyScorer_1, network_1, path_1, platform_1, uri_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ResourceAccessorClass {
        getItemLabel(resource) {
            return (0, path_1.basename)(resource.fsPath);
        }
        getItemDescription(resource) {
            return (0, path_1.dirname)(resource.fsPath);
        }
        getItemPath(resource) {
            return resource.fsPath;
        }
    }
    const ResourceAccessor = new ResourceAccessorClass();
    class ResourceWithSlashAccessorClass {
        getItemLabel(resource) {
            return (0, path_1.basename)(resource.fsPath);
        }
        getItemDescription(resource) {
            return path_1.posix.normalize((0, path_1.dirname)(resource.path));
        }
        getItemPath(resource) {
            return path_1.posix.normalize(resource.path);
        }
    }
    const ResourceWithSlashAccessor = new ResourceWithSlashAccessorClass();
    class ResourceWithBackslashAccessorClass {
        getItemLabel(resource) {
            return (0, path_1.basename)(resource.fsPath);
        }
        getItemDescription(resource) {
            return path_1.win32.normalize((0, path_1.dirname)(resource.path));
        }
        getItemPath(resource) {
            return path_1.win32.normalize(resource.path);
        }
    }
    const ResourceWithBackslashAccessor = new ResourceWithBackslashAccessorClass();
    class NullAccessorClass {
        getItemLabel(resource) {
            return undefined;
        }
        getItemDescription(resource) {
            return undefined;
        }
        getItemPath(resource) {
            return undefined;
        }
    }
    function _doScore(target, query, allowNonContiguousMatches) {
        const preparedQuery = (0, fuzzyScorer_1.prepareQuery)(query);
        return (0, fuzzyScorer_1.scoreFuzzy)(target, preparedQuery.normalized, preparedQuery.normalizedLowercase, allowNonContiguousMatches ?? !preparedQuery.expectContiguousMatch);
    }
    function _doScore2(target, query, matchOffset = 0) {
        const preparedQuery = (0, fuzzyScorer_1.prepareQuery)(query);
        return (0, fuzzyScorer_1.scoreFuzzy2)(target, preparedQuery, 0, matchOffset);
    }
    function scoreItem(item, query, allowNonContiguousMatches, accessor, cache = Object.create(null)) {
        return (0, fuzzyScorer_1.scoreItemFuzzy)(item, (0, fuzzyScorer_1.prepareQuery)(query), allowNonContiguousMatches, accessor, cache);
    }
    function compareItemsByScore(itemA, itemB, query, allowNonContiguousMatches, accessor) {
        return (0, fuzzyScorer_1.compareItemsByFuzzyScore)(itemA, itemB, (0, fuzzyScorer_1.prepareQuery)(query), allowNonContiguousMatches, accessor, Object.create(null));
    }
    const NullAccessor = new NullAccessorClass();
    suite('Fuzzy Scorer', () => {
        test('score (fuzzy)', function () {
            const target = 'HelLo-World';
            const scores = [];
            scores.push(_doScore(target, 'HelLo-World', true)); // direct case match
            scores.push(_doScore(target, 'hello-world', true)); // direct mix-case match
            scores.push(_doScore(target, 'HW', true)); // direct case prefix (multiple)
            scores.push(_doScore(target, 'hw', true)); // direct mix-case prefix (multiple)
            scores.push(_doScore(target, 'H', true)); // direct case prefix
            scores.push(_doScore(target, 'h', true)); // direct mix-case prefix
            scores.push(_doScore(target, 'W', true)); // direct case word prefix
            scores.push(_doScore(target, 'Ld', true)); // in-string case match (multiple)
            scores.push(_doScore(target, 'ld', true)); // in-string mix-case match (consecutive, avoids scattered hit)
            scores.push(_doScore(target, 'w', true)); // direct mix-case word prefix
            scores.push(_doScore(target, 'L', true)); // in-string case match
            scores.push(_doScore(target, 'l', true)); // in-string mix-case match
            scores.push(_doScore(target, '4', true)); // no match
            // Assert scoring order
            const sortedScores = scores.concat().sort((a, b) => b[0] - a[0]);
            assert.deepStrictEqual(scores, sortedScores);
            // Assert scoring positions
            // let positions = scores[0][1];
            // assert.strictEqual(positions.length, 'HelLo-World'.length);
            // positions = scores[2][1];
            // assert.strictEqual(positions.length, 'HW'.length);
            // assert.strictEqual(positions[0], 0);
            // assert.strictEqual(positions[1], 6);
        });
        test('score (non fuzzy)', function () {
            const target = 'HelLo-World';
            assert.ok(_doScore(target, 'HelLo-World', false)[0] > 0);
            assert.strictEqual(_doScore(target, 'HelLo-World', false)[1].length, 'HelLo-World'.length);
            assert.ok(_doScore(target, 'hello-world', false)[0] > 0);
            assert.strictEqual(_doScore(target, 'HW', false)[0], 0);
            assert.ok(_doScore(target, 'h', false)[0] > 0);
            assert.ok(_doScore(target, 'ello', false)[0] > 0);
            assert.ok(_doScore(target, 'ld', false)[0] > 0);
            assert.strictEqual(_doScore(target, 'eo', false)[0], 0);
        });
        test('scoreItem - matches are proper', function () {
            let res = scoreItem(null, 'something', true, ResourceAccessor);
            assert.ok(!res.score);
            const resource = uri_1.URI.file('/xyz/some/path/someFile123.txt');
            res = scoreItem(resource, 'something', true, NullAccessor);
            assert.ok(!res.score);
            // Path Identity
            const identityRes = scoreItem(resource, ResourceAccessor.getItemPath(resource), true, ResourceAccessor);
            assert.ok(identityRes.score);
            assert.strictEqual(identityRes.descriptionMatch.length, 1);
            assert.strictEqual(identityRes.labelMatch.length, 1);
            assert.strictEqual(identityRes.descriptionMatch[0].start, 0);
            assert.strictEqual(identityRes.descriptionMatch[0].end, ResourceAccessor.getItemDescription(resource).length);
            assert.strictEqual(identityRes.labelMatch[0].start, 0);
            assert.strictEqual(identityRes.labelMatch[0].end, ResourceAccessor.getItemLabel(resource).length);
            // Basename Prefix
            const basenamePrefixRes = scoreItem(resource, 'som', true, ResourceAccessor);
            assert.ok(basenamePrefixRes.score);
            assert.ok(!basenamePrefixRes.descriptionMatch);
            assert.strictEqual(basenamePrefixRes.labelMatch.length, 1);
            assert.strictEqual(basenamePrefixRes.labelMatch[0].start, 0);
            assert.strictEqual(basenamePrefixRes.labelMatch[0].end, 'som'.length);
            // Basename Camelcase
            const basenameCamelcaseRes = scoreItem(resource, 'sF', true, ResourceAccessor);
            assert.ok(basenameCamelcaseRes.score);
            assert.ok(!basenameCamelcaseRes.descriptionMatch);
            assert.strictEqual(basenameCamelcaseRes.labelMatch.length, 2);
            assert.strictEqual(basenameCamelcaseRes.labelMatch[0].start, 0);
            assert.strictEqual(basenameCamelcaseRes.labelMatch[0].end, 1);
            assert.strictEqual(basenameCamelcaseRes.labelMatch[1].start, 4);
            assert.strictEqual(basenameCamelcaseRes.labelMatch[1].end, 5);
            // Basename Match
            const basenameRes = scoreItem(resource, 'of', true, ResourceAccessor);
            assert.ok(basenameRes.score);
            assert.ok(!basenameRes.descriptionMatch);
            assert.strictEqual(basenameRes.labelMatch.length, 2);
            assert.strictEqual(basenameRes.labelMatch[0].start, 1);
            assert.strictEqual(basenameRes.labelMatch[0].end, 2);
            assert.strictEqual(basenameRes.labelMatch[1].start, 4);
            assert.strictEqual(basenameRes.labelMatch[1].end, 5);
            // Path Match
            const pathRes = scoreItem(resource, 'xyz123', true, ResourceAccessor);
            assert.ok(pathRes.score);
            assert.ok(pathRes.descriptionMatch);
            assert.ok(pathRes.labelMatch);
            assert.strictEqual(pathRes.labelMatch.length, 1);
            assert.strictEqual(pathRes.labelMatch[0].start, 8);
            assert.strictEqual(pathRes.labelMatch[0].end, 11);
            assert.strictEqual(pathRes.descriptionMatch.length, 1);
            assert.strictEqual(pathRes.descriptionMatch[0].start, 1);
            assert.strictEqual(pathRes.descriptionMatch[0].end, 4);
            // No Match
            const noRes = scoreItem(resource, '987', true, ResourceAccessor);
            assert.ok(!noRes.score);
            assert.ok(!noRes.labelMatch);
            assert.ok(!noRes.descriptionMatch);
            // No Exact Match
            const noExactRes = scoreItem(resource, '"sF"', true, ResourceAccessor);
            assert.ok(!noExactRes.score);
            assert.ok(!noExactRes.labelMatch);
            assert.ok(!noExactRes.descriptionMatch);
            assert.strictEqual(noRes.score, noExactRes.score);
            // Verify Scores
            assert.ok(identityRes.score > basenamePrefixRes.score);
            assert.ok(basenamePrefixRes.score > basenameRes.score);
            assert.ok(basenameRes.score > pathRes.score);
            assert.ok(pathRes.score > noRes.score);
        });
        test('scoreItem - multiple', function () {
            const resource = uri_1.URI.file('/xyz/some/path/someFile123.txt');
            const res1 = scoreItem(resource, 'xyz some', true, ResourceAccessor);
            assert.ok(res1.score);
            assert.strictEqual(res1.labelMatch?.length, 1);
            assert.strictEqual(res1.labelMatch[0].start, 0);
            assert.strictEqual(res1.labelMatch[0].end, 4);
            assert.strictEqual(res1.descriptionMatch?.length, 1);
            assert.strictEqual(res1.descriptionMatch[0].start, 1);
            assert.strictEqual(res1.descriptionMatch[0].end, 4);
            const res2 = scoreItem(resource, 'some xyz', true, ResourceAccessor);
            assert.ok(res2.score);
            assert.strictEqual(res1.score, res2.score);
            assert.strictEqual(res2.labelMatch?.length, 1);
            assert.strictEqual(res2.labelMatch[0].start, 0);
            assert.strictEqual(res2.labelMatch[0].end, 4);
            assert.strictEqual(res2.descriptionMatch?.length, 1);
            assert.strictEqual(res2.descriptionMatch[0].start, 1);
            assert.strictEqual(res2.descriptionMatch[0].end, 4);
            const res3 = scoreItem(resource, 'some xyz file file123', true, ResourceAccessor);
            assert.ok(res3.score);
            assert.ok(res3.score > res2.score);
            assert.strictEqual(res3.labelMatch?.length, 1);
            assert.strictEqual(res3.labelMatch[0].start, 0);
            assert.strictEqual(res3.labelMatch[0].end, 11);
            assert.strictEqual(res3.descriptionMatch?.length, 1);
            assert.strictEqual(res3.descriptionMatch[0].start, 1);
            assert.strictEqual(res3.descriptionMatch[0].end, 4);
            const res4 = scoreItem(resource, 'path z y', true, ResourceAccessor);
            assert.ok(res4.score);
            assert.ok(res4.score < res2.score);
            assert.strictEqual(res4.labelMatch?.length, 0);
            assert.strictEqual(res4.descriptionMatch?.length, 2);
            assert.strictEqual(res4.descriptionMatch[0].start, 2);
            assert.strictEqual(res4.descriptionMatch[0].end, 4);
            assert.strictEqual(res4.descriptionMatch[1].start, 10);
            assert.strictEqual(res4.descriptionMatch[1].end, 14);
        });
        test('scoreItem - multiple with cache yields different results', function () {
            const resource = uri_1.URI.file('/xyz/some/path/someFile123.txt');
            const cache = {};
            const res1 = scoreItem(resource, 'xyz sm', true, ResourceAccessor, cache);
            assert.ok(res1.score);
            // from the cache's perspective this should be a totally different query
            const res2 = scoreItem(resource, 'xyz "sm"', true, ResourceAccessor, cache);
            assert.ok(!res2.score);
        });
        test('scoreItem - invalid input', function () {
            let res = scoreItem(null, null, true, ResourceAccessor);
            assert.strictEqual(res.score, 0);
            res = scoreItem(null, 'null', true, ResourceAccessor);
            assert.strictEqual(res.score, 0);
        });
        test('scoreItem - optimize for file paths', function () {
            const resource = uri_1.URI.file('/xyz/others/spath/some/xsp/file123.txt');
            // xsp is more relevant to the end of the file path even though it matches
            // fuzzy also in the beginning. we verify the more relevant match at the
            // end gets returned.
            const pathRes = scoreItem(resource, 'xspfile123', true, ResourceAccessor);
            assert.ok(pathRes.score);
            assert.ok(pathRes.descriptionMatch);
            assert.ok(pathRes.labelMatch);
            assert.strictEqual(pathRes.labelMatch.length, 1);
            assert.strictEqual(pathRes.labelMatch[0].start, 0);
            assert.strictEqual(pathRes.labelMatch[0].end, 7);
            assert.strictEqual(pathRes.descriptionMatch.length, 1);
            assert.strictEqual(pathRes.descriptionMatch[0].start, 23);
            assert.strictEqual(pathRes.descriptionMatch[0].end, 26);
        });
        test('scoreItem - avoid match scattering (bug #36119)', function () {
            const resource = uri_1.URI.file('projects/ui/cula/ats/target.mk');
            const pathRes = scoreItem(resource, 'tcltarget.mk', true, ResourceAccessor);
            assert.ok(pathRes.score);
            assert.ok(pathRes.descriptionMatch);
            assert.ok(pathRes.labelMatch);
            assert.strictEqual(pathRes.labelMatch.length, 1);
            assert.strictEqual(pathRes.labelMatch[0].start, 0);
            assert.strictEqual(pathRes.labelMatch[0].end, 9);
        });
        test('scoreItem - prefers more compact matches', function () {
            const resource = uri_1.URI.file('/1a111d1/11a1d1/something.txt');
            // expect "ad" to be matched towards the end of the file because the
            // match is more compact
            const res = scoreItem(resource, 'ad', true, ResourceAccessor);
            assert.ok(res.score);
            assert.ok(res.descriptionMatch);
            assert.ok(!res.labelMatch.length);
            assert.strictEqual(res.descriptionMatch.length, 2);
            assert.strictEqual(res.descriptionMatch[0].start, 11);
            assert.strictEqual(res.descriptionMatch[0].end, 12);
            assert.strictEqual(res.descriptionMatch[1].start, 13);
            assert.strictEqual(res.descriptionMatch[1].end, 14);
        });
        test('scoreItem - proper target offset', function () {
            const resource = uri_1.URI.file('etem');
            const res = scoreItem(resource, 'teem', true, ResourceAccessor);
            assert.ok(!res.score);
        });
        test('scoreItem - proper target offset #2', function () {
            const resource = uri_1.URI.file('ede');
            const res = scoreItem(resource, 'de', true, ResourceAccessor);
            assert.strictEqual(res.labelMatch.length, 1);
            assert.strictEqual(res.labelMatch[0].start, 1);
            assert.strictEqual(res.labelMatch[0].end, 3);
        });
        test('scoreItem - proper target offset #3', function () {
            const resource = uri_1.URI.file('/src/vs/editor/browser/viewParts/lineNumbers/flipped-cursor-2x.svg');
            const res = scoreItem(resource, 'debug', true, ResourceAccessor);
            assert.strictEqual(res.descriptionMatch.length, 3);
            assert.strictEqual(res.descriptionMatch[0].start, 9);
            assert.strictEqual(res.descriptionMatch[0].end, 10);
            assert.strictEqual(res.descriptionMatch[1].start, 36);
            assert.strictEqual(res.descriptionMatch[1].end, 37);
            assert.strictEqual(res.descriptionMatch[2].start, 40);
            assert.strictEqual(res.descriptionMatch[2].end, 41);
            assert.strictEqual(res.labelMatch.length, 2);
            assert.strictEqual(res.labelMatch[0].start, 9);
            assert.strictEqual(res.labelMatch[0].end, 10);
            assert.strictEqual(res.labelMatch[1].start, 20);
            assert.strictEqual(res.labelMatch[1].end, 21);
        });
        test('scoreItem - no match unless query contained in sequence', function () {
            const resource = uri_1.URI.file('abcde');
            const res = scoreItem(resource, 'edcda', true, ResourceAccessor);
            assert.ok(!res.score);
        });
        test('scoreItem - match if using slash or backslash (local, remote resource)', function () {
            const localResource = uri_1.URI.file('abcde/super/duper');
            const remoteResource = uri_1.URI.from({ scheme: network_1.Schemas.vscodeRemote, path: 'abcde/super/duper' });
            for (const resource of [localResource, remoteResource]) {
                let res = scoreItem(resource, 'abcde\\super\\duper', true, ResourceAccessor);
                assert.ok(res.score);
                res = scoreItem(resource, 'abcde\\super\\duper', true, ResourceWithSlashAccessor);
                assert.ok(res.score);
                res = scoreItem(resource, 'abcde\\super\\duper', true, ResourceWithBackslashAccessor);
                assert.ok(res.score);
                res = scoreItem(resource, 'abcde/super/duper', true, ResourceAccessor);
                assert.ok(res.score);
                res = scoreItem(resource, 'abcde/super/duper', true, ResourceWithSlashAccessor);
                assert.ok(res.score);
                res = scoreItem(resource, 'abcde/super/duper', true, ResourceWithBackslashAccessor);
                assert.ok(res.score);
            }
        });
        test('scoreItem - ensure upper case bonus only applies on non-consecutive matches (bug #134723)', function () {
            const resourceWithUpper = uri_1.URI.file('ASDFasdfasdf');
            const resourceAllLower = uri_1.URI.file('asdfasdfasdf');
            assert.ok(scoreItem(resourceAllLower, 'asdf', true, ResourceAccessor).score > scoreItem(resourceWithUpper, 'asdf', true, ResourceAccessor).score);
        });
        test('compareItemsByScore - identity', function () {
            const resourceA = uri_1.URI.file('/some/path/fileA.txt');
            const resourceB = uri_1.URI.file('/some/path/other/fileB.txt');
            const resourceC = uri_1.URI.file('/unrelated/some/path/other/fileC.txt');
            // Full resource A path
            let query = ResourceAccessor.getItemPath(resourceA);
            let res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            assert.strictEqual(res[2], resourceC);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            assert.strictEqual(res[2], resourceC);
            // Full resource B path
            query = ResourceAccessor.getItemPath(resourceB);
            res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            assert.strictEqual(res[2], resourceC);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            assert.strictEqual(res[2], resourceC);
        });
        test('compareFilesByScore - basename prefix', function () {
            const resourceA = uri_1.URI.file('/some/path/fileA.txt');
            const resourceB = uri_1.URI.file('/some/path/other/fileB.txt');
            const resourceC = uri_1.URI.file('/unrelated/some/path/other/fileC.txt');
            // Full resource A basename
            let query = ResourceAccessor.getItemLabel(resourceA);
            let res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            assert.strictEqual(res[2], resourceC);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            assert.strictEqual(res[2], resourceC);
            // Full resource B basename
            query = ResourceAccessor.getItemLabel(resourceB);
            res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            assert.strictEqual(res[2], resourceC);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            assert.strictEqual(res[2], resourceC);
        });
        test('compareFilesByScore - basename camelcase', function () {
            const resourceA = uri_1.URI.file('/some/path/fileA.txt');
            const resourceB = uri_1.URI.file('/some/path/other/fileB.txt');
            const resourceC = uri_1.URI.file('/unrelated/some/path/other/fileC.txt');
            // resource A camelcase
            let query = 'fA';
            let res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            assert.strictEqual(res[2], resourceC);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            assert.strictEqual(res[2], resourceC);
            // resource B camelcase
            query = 'fB';
            res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            assert.strictEqual(res[2], resourceC);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            assert.strictEqual(res[2], resourceC);
        });
        test('compareFilesByScore - basename scores', function () {
            const resourceA = uri_1.URI.file('/some/path/fileA.txt');
            const resourceB = uri_1.URI.file('/some/path/other/fileB.txt');
            const resourceC = uri_1.URI.file('/unrelated/some/path/other/fileC.txt');
            // Resource A part of basename
            let query = 'fileA';
            let res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            assert.strictEqual(res[2], resourceC);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            assert.strictEqual(res[2], resourceC);
            // Resource B part of basename
            query = 'fileB';
            res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            assert.strictEqual(res[2], resourceC);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            assert.strictEqual(res[2], resourceC);
        });
        test('compareFilesByScore - path scores', function () {
            const resourceA = uri_1.URI.file('/some/path/fileA.txt');
            const resourceB = uri_1.URI.file('/some/path/other/fileB.txt');
            const resourceC = uri_1.URI.file('/unrelated/some/path/other/fileC.txt');
            // Resource A part of path
            let query = 'pathfileA';
            let res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            assert.strictEqual(res[2], resourceC);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            assert.strictEqual(res[2], resourceC);
            // Resource B part of path
            query = 'pathfileB';
            res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            assert.strictEqual(res[2], resourceC);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            assert.strictEqual(res[2], resourceC);
        });
        test('compareFilesByScore - prefer shorter basenames', function () {
            const resourceA = uri_1.URI.file('/some/path/fileA.txt');
            const resourceB = uri_1.URI.file('/some/path/other/fileBLonger.txt');
            const resourceC = uri_1.URI.file('/unrelated/the/path/other/fileC.txt');
            // Resource A part of path
            const query = 'somepath';
            let res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            assert.strictEqual(res[2], resourceC);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            assert.strictEqual(res[2], resourceC);
        });
        test('compareFilesByScore - prefer shorter basenames (match on basename)', function () {
            const resourceA = uri_1.URI.file('/some/path/fileA.txt');
            const resourceB = uri_1.URI.file('/some/path/other/fileBLonger.txt');
            const resourceC = uri_1.URI.file('/unrelated/the/path/other/fileC.txt');
            // Resource A part of path
            const query = 'file';
            let res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceC);
            assert.strictEqual(res[2], resourceB);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceC);
            assert.strictEqual(res[2], resourceB);
        });
        test('compareFilesByScore - prefer shorter paths', function () {
            const resourceA = uri_1.URI.file('/some/path/fileA.txt');
            const resourceB = uri_1.URI.file('/some/path/other/fileB.txt');
            const resourceC = uri_1.URI.file('/unrelated/some/path/other/fileC.txt');
            // Resource A part of path
            const query = 'somepath';
            let res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            assert.strictEqual(res[2], resourceC);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            assert.strictEqual(res[2], resourceC);
        });
        test('compareFilesByScore - prefer shorter paths (bug #17443)', function () {
            const resourceA = uri_1.URI.file('config/test/t1.js');
            const resourceB = uri_1.URI.file('config/test.js');
            const resourceC = uri_1.URI.file('config/test/t2.js');
            const query = 'co/te';
            const res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            assert.strictEqual(res[2], resourceC);
        });
        test('compareFilesByScore - prefer matches in label over description if scores are otherwise equal', function () {
            const resourceA = uri_1.URI.file('parts/quick/arrow-left-dark.svg');
            const resourceB = uri_1.URI.file('parts/quickopen/quickopen.ts');
            const query = 'partsquick';
            const res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
        });
        test('compareFilesByScore - prefer camel case matches', function () {
            const resourceA = uri_1.URI.file('config/test/NullPointerException.java');
            const resourceB = uri_1.URI.file('config/test/nopointerexception.java');
            for (const query of ['npe', 'NPE']) {
                let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
                assert.strictEqual(res[0], resourceA);
                assert.strictEqual(res[1], resourceB);
                res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
                assert.strictEqual(res[0], resourceA);
                assert.strictEqual(res[1], resourceB);
            }
        });
        test('compareFilesByScore - prefer more compact camel case matches', function () {
            const resourceA = uri_1.URI.file('config/test/openthisAnythingHandler.js');
            const resourceB = uri_1.URI.file('config/test/openthisisnotsorelevantforthequeryAnyHand.js');
            const query = 'AH';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
        });
        test('compareFilesByScore - prefer more compact matches (label)', function () {
            const resourceA = uri_1.URI.file('config/test/examasdaple.js');
            const resourceB = uri_1.URI.file('config/test/exampleasdaasd.ts');
            const query = 'xp';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
        });
        test('compareFilesByScore - prefer more compact matches (path)', function () {
            const resourceA = uri_1.URI.file('config/test/examasdaple/file.js');
            const resourceB = uri_1.URI.file('config/test/exampleasdaasd/file.ts');
            const query = 'xp';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
        });
        test('compareFilesByScore - prefer more compact matches (label and path)', function () {
            const resourceA = uri_1.URI.file('config/example/thisfile.ts');
            const resourceB = uri_1.URI.file('config/24234243244/example/file.js');
            const query = 'exfile';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
        });
        test('compareFilesByScore - avoid match scattering (bug #34210)', function () {
            const resourceA = uri_1.URI.file('node_modules1/bundle/lib/model/modules/ot1/index.js');
            const resourceB = uri_1.URI.file('node_modules1/bundle/lib/model/modules/un1/index.js');
            const resourceC = uri_1.URI.file('node_modules1/bundle/lib/model/modules/modu1/index.js');
            const resourceD = uri_1.URI.file('node_modules1/bundle/lib/model/modules/oddl1/index.js');
            let query = platform_1.isWindows ? 'modu1\\index.js' : 'modu1/index.js';
            let res = [resourceA, resourceB, resourceC, resourceD].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceC);
            res = [resourceC, resourceB, resourceA, resourceD].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceC);
            query = platform_1.isWindows ? 'un1\\index.js' : 'un1/index.js';
            res = [resourceA, resourceB, resourceC, resourceD].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            res = [resourceC, resourceB, resourceA, resourceD].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
        });
        test('compareFilesByScore - avoid match scattering (bug #21019 1.)', function () {
            const resourceA = uri_1.URI.file('app/containers/Services/NetworkData/ServiceDetails/ServiceLoad/index.js');
            const resourceB = uri_1.URI.file('app/containers/Services/NetworkData/ServiceDetails/ServiceDistribution/index.js');
            const resourceC = uri_1.URI.file('app/containers/Services/NetworkData/ServiceDetailTabs/ServiceTabs/StatVideo/index.js');
            const query = 'StatVideoindex';
            let res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceC);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceC);
        });
        test('compareFilesByScore - avoid match scattering (bug #21019 2.)', function () {
            const resourceA = uri_1.URI.file('src/build-helper/store/redux.ts');
            const resourceB = uri_1.URI.file('src/repository/store/redux.ts');
            const query = 'reproreduxts';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
        });
        test('compareFilesByScore - avoid match scattering (bug #26649)', function () {
            const resourceA = uri_1.URI.file('photobook/src/components/AddPagesButton/index.js');
            const resourceB = uri_1.URI.file('photobook/src/components/ApprovalPageHeader/index.js');
            const resourceC = uri_1.URI.file('photobook/src/canvasComponents/BookPage/index.js');
            const query = 'bookpageIndex';
            let res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceC);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceC);
        });
        test('compareFilesByScore - avoid match scattering (bug #33247)', function () {
            const resourceA = uri_1.URI.file('ui/src/utils/constants.js');
            const resourceB = uri_1.URI.file('ui/src/ui/Icons/index.js');
            const query = platform_1.isWindows ? 'ui\\icons' : 'ui/icons';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
        });
        test('compareFilesByScore - avoid match scattering (bug #33247 comment)', function () {
            const resourceA = uri_1.URI.file('ui/src/components/IDInput/index.js');
            const resourceB = uri_1.URI.file('ui/src/ui/Input/index.js');
            const query = platform_1.isWindows ? 'ui\\input\\index' : 'ui/input/index';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
        });
        test('compareFilesByScore - avoid match scattering (bug #36166)', function () {
            const resourceA = uri_1.URI.file('django/contrib/sites/locale/ga/LC_MESSAGES/django.mo');
            const resourceB = uri_1.URI.file('django/core/signals.py');
            const query = 'djancosig';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
        });
        test('compareFilesByScore - avoid match scattering (bug #32918)', function () {
            const resourceA = uri_1.URI.file('adsys/protected/config.php');
            const resourceB = uri_1.URI.file('adsys/protected/framework/smarty/sysplugins/smarty_internal_config.php');
            const resourceC = uri_1.URI.file('duowanVideo/wap/protected/config.php');
            const query = 'protectedconfig.php';
            let res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceC);
            assert.strictEqual(res[2], resourceB);
            res = [resourceC, resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceC);
            assert.strictEqual(res[2], resourceB);
        });
        test('compareFilesByScore - avoid match scattering (bug #14879)', function () {
            const resourceA = uri_1.URI.file('pkg/search/gradient/testdata/constraint_attrMatchString.yml');
            const resourceB = uri_1.URI.file('cmd/gradient/main.go');
            const query = 'gradientmain';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
        });
        test('compareFilesByScore - avoid match scattering (bug #14727 1)', function () {
            const resourceA = uri_1.URI.file('alpha-beta-cappa.txt');
            const resourceB = uri_1.URI.file('abc.txt');
            const query = 'abc';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
        });
        test('compareFilesByScore - avoid match scattering (bug #14727 2)', function () {
            const resourceA = uri_1.URI.file('xerxes-yak-zubba/index.js');
            const resourceB = uri_1.URI.file('xyz/index.js');
            const query = 'xyz';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
        });
        test('compareFilesByScore - avoid match scattering (bug #18381)', function () {
            const resourceA = uri_1.URI.file('AssymblyInfo.cs');
            const resourceB = uri_1.URI.file('IAsynchronousTask.java');
            const query = 'async';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
        });
        test('compareFilesByScore - avoid match scattering (bug #35572)', function () {
            const resourceA = uri_1.URI.file('static/app/source/angluar/-admin/-organization/-settings/layout/layout.js');
            const resourceB = uri_1.URI.file('static/app/source/angular/-admin/-project/-settings/_settings/settings.js');
            const query = 'partisettings';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
        });
        test('compareFilesByScore - avoid match scattering (bug #36810)', function () {
            const resourceA = uri_1.URI.file('Trilby.TrilbyTV.Web.Portal/Views/Systems/Index.cshtml');
            const resourceB = uri_1.URI.file('Trilby.TrilbyTV.Web.Portal/Areas/Admins/Views/Tips/Index.cshtml');
            const query = 'tipsindex.cshtml';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
        });
        test('compareFilesByScore - prefer shorter hit (bug #20546)', function () {
            const resourceA = uri_1.URI.file('editor/core/components/tests/list-view-spec.js');
            const resourceB = uri_1.URI.file('editor/core/components/list-view.js');
            const query = 'listview';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
        });
        test('compareFilesByScore - avoid match scattering (bug #12095)', function () {
            const resourceA = uri_1.URI.file('src/vs/workbench/contrib/files/common/explorerViewModel.ts');
            const resourceB = uri_1.URI.file('src/vs/workbench/contrib/files/browser/views/explorerView.ts');
            const resourceC = uri_1.URI.file('src/vs/workbench/contrib/files/browser/views/explorerViewer.ts');
            const query = 'filesexplorerview.ts';
            let res = [resourceA, resourceB, resourceC].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            res = [resourceA, resourceC, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
        });
        test('compareFilesByScore - prefer case match (bug #96122)', function () {
            const resourceA = uri_1.URI.file('lists.php');
            const resourceB = uri_1.URI.file('lib/Lists.php');
            const query = 'Lists.php';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
        });
        test('compareFilesByScore - prefer shorter match (bug #103052) - foo bar', function () {
            const resourceA = uri_1.URI.file('app/emails/foo.bar.js');
            const resourceB = uri_1.URI.file('app/emails/other-footer.other-bar.js');
            for (const query of ['foo bar', 'foobar']) {
                let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
                assert.strictEqual(res[0], resourceA);
                assert.strictEqual(res[1], resourceB);
                res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
                assert.strictEqual(res[0], resourceA);
                assert.strictEqual(res[1], resourceB);
            }
        });
        test('compareFilesByScore - prefer shorter match (bug #103052) - payment model', function () {
            const resourceA = uri_1.URI.file('app/components/payment/payment.model.js');
            const resourceB = uri_1.URI.file('app/components/online-payments-history/online-payments-history.model.js');
            for (const query of ['payment model', 'paymentmodel']) {
                let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
                assert.strictEqual(res[0], resourceA);
                assert.strictEqual(res[1], resourceB);
                res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
                assert.strictEqual(res[0], resourceA);
                assert.strictEqual(res[1], resourceB);
            }
        });
        test('compareFilesByScore - prefer shorter match (bug #103052) - color', function () {
            const resourceA = uri_1.URI.file('app/constants/color.js');
            const resourceB = uri_1.URI.file('app/components/model/input/pick-avatar-color.js');
            for (const query of ['color js', 'colorjs']) {
                let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
                assert.strictEqual(res[0], resourceA);
                assert.strictEqual(res[1], resourceB);
                res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
                assert.strictEqual(res[0], resourceA);
                assert.strictEqual(res[1], resourceB);
            }
        });
        test('compareFilesByScore - prefer strict case prefix', function () {
            const resourceA = uri_1.URI.file('app/constants/color.js');
            const resourceB = uri_1.URI.file('app/components/model/input/Color.js');
            let query = 'Color';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceB);
            assert.strictEqual(res[1], resourceA);
            query = 'color';
            res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
        });
        test('compareFilesByScore - prefer prefix (bug #103052)', function () {
            const resourceA = uri_1.URI.file('test/smoke/src/main.ts');
            const resourceB = uri_1.URI.file('src/vs/editor/common/services/semantikTokensProviderStyling.ts');
            const query = 'smoke main.ts';
            let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
            res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
            assert.strictEqual(res[0], resourceA);
            assert.strictEqual(res[1], resourceB);
        });
        test('compareFilesByScore - boost better prefix match if multiple queries are used', function () {
            const resourceA = uri_1.URI.file('src/vs/workbench/services/host/browser/browserHostService.ts');
            const resourceB = uri_1.URI.file('src/vs/workbench/browser/workbench.ts');
            for (const query of ['workbench.ts browser', 'browser workbench.ts', 'browser workbench', 'workbench browser']) {
                let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
                assert.strictEqual(res[0], resourceB);
                assert.strictEqual(res[1], resourceA);
                res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
                assert.strictEqual(res[0], resourceB);
                assert.strictEqual(res[1], resourceA);
            }
        });
        test('compareFilesByScore - boost shorter prefix match if multiple queries are used', function () {
            const resourceA = uri_1.URI.file('src/vs/workbench/node/actions/windowActions.ts');
            const resourceB = uri_1.URI.file('src/vs/workbench/electron-node/window.ts');
            for (const query of ['window node', 'window.ts node']) {
                let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
                assert.strictEqual(res[0], resourceB);
                assert.strictEqual(res[1], resourceA);
                res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
                assert.strictEqual(res[0], resourceB);
                assert.strictEqual(res[1], resourceA);
            }
        });
        test('compareFilesByScore - boost shorter prefix match if multiple queries are used (#99171)', function () {
            const resourceA = uri_1.URI.file('mesh_editor_lifetime_job.h');
            const resourceB = uri_1.URI.file('lifetime_job.h');
            for (const query of ['m life, life m']) {
                let res = [resourceA, resourceB].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
                assert.strictEqual(res[0], resourceB);
                assert.strictEqual(res[1], resourceA);
                res = [resourceB, resourceA].sort((r1, r2) => compareItemsByScore(r1, r2, query, true, ResourceAccessor));
                assert.strictEqual(res[0], resourceB);
                assert.strictEqual(res[1], resourceA);
            }
        });
        test('prepareQuery', () => {
            assert.strictEqual((0, fuzzyScorer_1.prepareQuery)(' f*a ').normalized, 'fa');
            assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('model Tester.ts').original, 'model Tester.ts');
            assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('model Tester.ts').originalLowercase, 'model Tester.ts'.toLowerCase());
            assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('model Tester.ts').normalized, 'modelTester.ts');
            assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('model Tester.ts').expectContiguousMatch, false); // doesn't have quotes in it
            assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('Model Tester.ts').normalizedLowercase, 'modeltester.ts');
            assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('ModelTester.ts').containsPathSeparator, false);
            assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('Model' + path_1.sep + 'Tester.ts').containsPathSeparator, true);
            assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('"hello"').expectContiguousMatch, true);
            assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('"hello"').normalized, 'hello');
            // with spaces
            let query = (0, fuzzyScorer_1.prepareQuery)('He*llo World');
            assert.strictEqual(query.original, 'He*llo World');
            assert.strictEqual(query.normalized, 'HelloWorld');
            assert.strictEqual(query.normalizedLowercase, 'HelloWorld'.toLowerCase());
            assert.strictEqual(query.values?.length, 2);
            assert.strictEqual(query.values?.[0].original, 'He*llo');
            assert.strictEqual(query.values?.[0].normalized, 'Hello');
            assert.strictEqual(query.values?.[0].normalizedLowercase, 'Hello'.toLowerCase());
            assert.strictEqual(query.values?.[1].original, 'World');
            assert.strictEqual(query.values?.[1].normalized, 'World');
            assert.strictEqual(query.values?.[1].normalizedLowercase, 'World'.toLowerCase());
            const restoredQuery = (0, fuzzyScorer_1.pieceToQuery)(query.values);
            assert.strictEqual(restoredQuery.original, query.original);
            assert.strictEqual(restoredQuery.values?.length, query.values?.length);
            assert.strictEqual(restoredQuery.containsPathSeparator, query.containsPathSeparator);
            // with spaces that are empty
            query = (0, fuzzyScorer_1.prepareQuery)(' Hello   World  	');
            assert.strictEqual(query.original, ' Hello   World  	');
            assert.strictEqual(query.originalLowercase, ' Hello   World  	'.toLowerCase());
            assert.strictEqual(query.normalized, 'HelloWorld');
            assert.strictEqual(query.normalizedLowercase, 'HelloWorld'.toLowerCase());
            assert.strictEqual(query.values?.length, 2);
            assert.strictEqual(query.values?.[0].original, 'Hello');
            assert.strictEqual(query.values?.[0].originalLowercase, 'Hello'.toLowerCase());
            assert.strictEqual(query.values?.[0].normalized, 'Hello');
            assert.strictEqual(query.values?.[0].normalizedLowercase, 'Hello'.toLowerCase());
            assert.strictEqual(query.values?.[1].original, 'World');
            assert.strictEqual(query.values?.[1].originalLowercase, 'World'.toLowerCase());
            assert.strictEqual(query.values?.[1].normalized, 'World');
            assert.strictEqual(query.values?.[1].normalizedLowercase, 'World'.toLowerCase());
            // Path related
            if (platform_1.isWindows) {
                assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('C:\\some\\path').pathNormalized, 'C:\\some\\path');
                assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('C:\\some\\path').normalized, 'C:\\some\\path');
                assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('C:\\some\\path').containsPathSeparator, true);
                assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('C:/some/path').pathNormalized, 'C:\\some\\path');
                assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('C:/some/path').normalized, 'C:\\some\\path');
                assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('C:/some/path').containsPathSeparator, true);
            }
            else {
                assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('/some/path').pathNormalized, '/some/path');
                assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('/some/path').normalized, '/some/path');
                assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('/some/path').containsPathSeparator, true);
                assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('\\some\\path').pathNormalized, '/some/path');
                assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('\\some\\path').normalized, '/some/path');
                assert.strictEqual((0, fuzzyScorer_1.prepareQuery)('\\some\\path').containsPathSeparator, true);
            }
        });
        test('fuzzyScore2 (matching)', function () {
            const target = 'HelLo-World';
            for (const offset of [0, 3]) {
                let [score, matches] = _doScore2(offset === 0 ? target : `123${target}`, 'HelLo-World', offset);
                assert.ok(score);
                assert.strictEqual(matches.length, 1);
                assert.strictEqual(matches[0].start, 0 + offset);
                assert.strictEqual(matches[0].end, target.length + offset);
                [score, matches] = _doScore2(offset === 0 ? target : `123${target}`, 'HW', offset);
                assert.ok(score);
                assert.strictEqual(matches.length, 2);
                assert.strictEqual(matches[0].start, 0 + offset);
                assert.strictEqual(matches[0].end, 1 + offset);
                assert.strictEqual(matches[1].start, 6 + offset);
                assert.strictEqual(matches[1].end, 7 + offset);
            }
        });
        test('fuzzyScore2 (multiple queries)', function () {
            const target = 'HelLo-World';
            const [firstSingleScore, firstSingleMatches] = _doScore2(target, 'HelLo');
            const [secondSingleScore, secondSingleMatches] = _doScore2(target, 'World');
            const firstAndSecondSingleMatches = [...firstSingleMatches || [], ...secondSingleMatches || []];
            let [multiScore, multiMatches] = _doScore2(target, 'HelLo World');
            function assertScore() {
                assert.ok(multiScore ?? 0 >= ((firstSingleScore ?? 0) + (secondSingleScore ?? 0)));
                for (let i = 0; multiMatches && i < multiMatches.length; i++) {
                    const multiMatch = multiMatches[i];
                    const firstAndSecondSingleMatch = firstAndSecondSingleMatches[i];
                    if (multiMatch && firstAndSecondSingleMatch) {
                        assert.strictEqual(multiMatch.start, firstAndSecondSingleMatch.start);
                        assert.strictEqual(multiMatch.end, firstAndSecondSingleMatch.end);
                    }
                    else {
                        assert.fail();
                    }
                }
            }
            function assertNoScore() {
                assert.strictEqual(multiScore, undefined);
                assert.strictEqual(multiMatches.length, 0);
            }
            assertScore();
            [multiScore, multiMatches] = _doScore2(target, 'World HelLo');
            assertScore();
            [multiScore, multiMatches] = _doScore2(target, 'World HelLo World');
            assertScore();
            [multiScore, multiMatches] = _doScore2(target, 'World HelLo Nothing');
            assertNoScore();
            [multiScore, multiMatches] = _doScore2(target, 'More Nothing');
            assertNoScore();
        });
        test('fuzzyScore2 (#95716)', function () {
            const target = '# ❌ Wow';
            const score = _doScore2(target, '❌');
            assert.ok(score);
            assert.ok(typeof score[0] === 'number');
            assert.ok(score[1].length > 0);
        });
        test('Using quotes should expect contiguous matches match', function () {
            // missing the "i" in the query
            assert.strictEqual(_doScore('contiguous', '"contguous"')[0], 0);
            const score = _doScore('contiguous', '"contiguous"');
            assert.strictEqual(score[0], 253);
        });
        test('Using quotes should highlight contiguous indexes', function () {
            const score = _doScore('2021-7-26.md', '"26"');
            assert.strictEqual(score[0], 13);
            // The indexes of the 2 and 6 of "26"
            assert.strictEqual(score[1][0], 7);
            assert.strictEqual(score[1][1], 8);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnV6enlTY29yZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi9mdXp6eVNjb3Jlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLE1BQU0scUJBQXFCO1FBRTFCLFlBQVksQ0FBQyxRQUFhO1lBQ3pCLE9BQU8sSUFBQSxlQUFRLEVBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxRQUFhO1lBQy9CLE9BQU8sSUFBQSxjQUFPLEVBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxXQUFXLENBQUMsUUFBYTtZQUN4QixPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFDeEIsQ0FBQztLQUNEO0lBRUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLHFCQUFxQixFQUFFLENBQUM7SUFFckQsTUFBTSw4QkFBOEI7UUFFbkMsWUFBWSxDQUFDLFFBQWE7WUFDekIsT0FBTyxJQUFBLGVBQVEsRUFBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELGtCQUFrQixDQUFDLFFBQWE7WUFDL0IsT0FBTyxZQUFLLENBQUMsU0FBUyxDQUFDLElBQUEsY0FBTyxFQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFRCxXQUFXLENBQUMsUUFBYTtZQUN4QixPQUFPLFlBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7S0FDRDtJQUVELE1BQU0seUJBQXlCLEdBQUcsSUFBSSw4QkFBOEIsRUFBRSxDQUFDO0lBRXZFLE1BQU0sa0NBQWtDO1FBRXZDLFlBQVksQ0FBQyxRQUFhO1lBQ3pCLE9BQU8s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U0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUN6SCxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUV0QyxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFDckgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFdEMsMkJBQTJCO1lBQzNCLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFakQsR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQ3JILE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXRDLEdBQUcsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUNySCxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywwQ0FBMEMsRUFBRTtZQUNoRCxNQUFNLFNBQVMsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDbkQsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sU0FBUyxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsc0NBQXNDLENBQUMsQ0FBQztZQUVuRSx1QkFBdUI7WUFDdkIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBRWpCLElBQUksR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQ3pILE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXRDLEdBQUcsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUNySCxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUV0Qyx1QkFBdUI7WUFDdkIsS0FBSyxHQUFHLElBQUksQ0FBQztZQUViLEdBQUcsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLEVBQUUs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LEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7WUFDMUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbURBQW1ELEVBQUU7WUFDekQsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sU0FBUyxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsZ0VBQWdFLENBQUMsQ0FBQztZQUU3RixNQUFNLEtBQUssR0FBRyxlQUFlLENBQUM7WUFFOUIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUM5RyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUV0QyxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUMxRyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw4RUFBOEUsRUFBRTtZQUNwRixNQUFNLFNBQVMsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLDhEQUE4RCxDQUFDLENBQUM7WUFDM0YsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1lBRXBFLEtBQUssTUFBTSxLQUFLLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxzQkFBc0IsRUFBRSxtQkFBbUIsRUFBRSxtQkFBbUIsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hILElBQUksR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7Z0JBQzlHLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFFdEMsR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7Z0JBQzFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN2QyxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0VBQStFLEVBQUU7WUFDckYsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sU0FBUyxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsMENBQTBDLENBQUMsQ0FBQztZQUV2RSxLQUFLLE1BQU0sS0FBSyxJQUFJLENBQUMsYUFBYSxFQUFFLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztnQkFDdkQsSUFBSSxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztnQkFDOUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUV0QyxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztnQkFDMUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3RkFBd0YsRUFBRTtZQUM5RixNQUFNLFNBQVMsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFDekQsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRTdDLEtBQUssTUFBTSxLQUFLLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7Z0JBQzlHLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFFdEMsR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7Z0JBQzFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN2QyxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtZQUN6QixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsMEJBQVksRUFBQyxPQUFPLENBQUMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDBCQUFZLEVBQUMsaUJBQWlCLENBQUMsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUNoRixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsMEJBQVksRUFBQyxpQkFBaUIsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDdkcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDBCQUFZLEVBQUMsaUJBQWlCLENBQUMsQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUNqRixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsMEJBQVksRUFBQyxpQkFBaUIsQ0FBQyxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsNEJBQTRCO1lBQzlHLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSwwQkFBWSxFQUFDLGlCQUFpQixDQUFDLENBQUMsbUJBQW1CLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUMxRixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsMEJBQVksRUFBQyxnQkFBZ0IsQ0FBQyxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSwwQkFBWSxFQUFDLE9BQU8sR0FBRyxVQUFHLEdBQUcsV0FBVyxDQUFDLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDMUYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDBCQUFZLEVBQUMsU0FBUyxDQUFDLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDBCQUFZLEVBQUMsU0FBUyxDQUFDLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRWhFLGNBQWM7WUFDZCxJQUFJLEtBQUssR0FBRyxJQUFBLDBCQUFZLEVBQUMsY0FBYyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsRUFBRSxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUMxRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUVqRixNQUFNLGFBQWEsR0FBRyxJQUFBLDBCQUFZLEVBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBRXJGLDZCQUE2QjtZQUM3QixLQUFLLEdBQUcsSUFBQSwwQkFBWSxFQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsbUJBQW1CLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUMvRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDMUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDL0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ2pGLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUMvRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFFakYsZUFBZTtZQUNmLElBQUksb0JBQVMsRUFBRSxDQUFDO2dCQUNmLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSwwQkFBWSxFQUFDLGdCQUFnQixDQUFDLENBQUMsY0FBYyxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBQ3BGLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSwwQkFBWSxFQUFDLGdCQUFnQixDQUFDLENBQUMsVUFBVSxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBQ2hGLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSwwQkFBWSxFQUFDLGdCQUFnQixDQUFDLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQy9FLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSwwQkFBWSxFQUFDLGNBQWMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUNsRixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsMEJBQVksRUFBQyxjQUFjLENBQUMsQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztnQkFDOUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDBCQUFZLEVBQUMsY0FBYyxDQUFDLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDOUUsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSwwQkFBWSxFQUFDLFlBQVksQ0FBQyxDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDBCQUFZLEVBQUMsWUFBWSxDQUFDLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUN4RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsMEJBQVksRUFBQyxZQUFZLENBQUMsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDM0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLDBCQUFZLEVBQUMsY0FBYyxDQUFDLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUM5RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsMEJBQVksRUFBQyxjQUFjLENBQUMsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQzFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSwwQkFBWSxFQUFDLGNBQWMsQ0FBQyxDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlFLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3QkFBd0IsRUFBRTtZQUM5QixNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUM7WUFFN0IsS0FBSyxNQUFNLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sTUFBTSxFQUFFLEVBQUUsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUVoRyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNqQixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUM7Z0JBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDO2dCQUUzRCxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFFbkYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDakIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO2dCQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO2dCQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1lBQ2hELENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnQ0FBZ0MsRUFBRTtZQUN0QyxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUM7WUFFN0IsTUFBTSxDQUFDLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxRSxNQUFNLENBQUMsaUJBQWlCLEVBQUUsbUJBQW1CLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzVFLE1BQU0sMkJBQTJCLEdBQUcsQ0FBQyxHQUFHLGtCQUFrQixJQUFJLEVBQUUsRUFBRSxHQUFHLG1CQUFtQixJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRWhHLElBQUksQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztZQUVsRSxTQUFTLFdBQVc7Z0JBQ25CLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25GLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFlBQVksSUFBSSxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUM5RCxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ25DLE1BQU0seUJBQXlCLEdBQUcsMkJBQTJCLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRWpFLElBQUksVUFBVSxJQUFJLHlCQUF5QixFQUFFLENBQUM7d0JBQzdDLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSx5QkFBeUIsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDdEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNuRSxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNmLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxTQUFTLGFBQWE7Z0JBQ3JCLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUMsQ0FBQztZQUVELFdBQVcsRUFBRSxDQUFDO1lBRWQsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztZQUM5RCxXQUFXLEVBQUUsQ0FBQztZQUVkLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUNwRSxXQUFXLEVBQUUsQ0FBQztZQUVkLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUscUJBQXFCLENBQUMsQ0FBQztZQUN0RSxhQUFhLEVBQUUsQ0FBQztZQUVoQixDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQy9ELGFBQWEsRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNCQUFzQixFQUFFO1lBQzVCLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQztZQUV6QixNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDakIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscURBQXFELEVBQUU7WUFDM0QsK0JBQStCO1lBQy9CLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVoRSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3JELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtEQUFrRCxFQUFFO1lBQ3hELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFakMscUNBQXFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=