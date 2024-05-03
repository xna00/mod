/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/wordCharacterClassifier", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder", "vs/editor/common/model/pieceTreeTextBuffer/rbTreeBase", "vs/editor/test/common/testTextModel", "vs/base/common/strings", "vs/base/test/common/utils"], function (require, exports, assert, wordCharacterClassifier_1, position_1, range_1, model_1, pieceTreeTextBufferBuilder_1, rbTreeBase_1, testTextModel_1, strings_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ\r\n';
    function randomChar() {
        return alphabet[randomInt(alphabet.length)];
    }
    function randomInt(bound) {
        return Math.floor(Math.random() * bound);
    }
    function randomStr(len) {
        if (len === null) {
            len = 10;
        }
        return (function () {
            let j, ref;
            const results = [];
            for (j = 1, ref = len; 1 <= ref ? j < ref : j > ref; 1 <= ref ? j++ : j--) {
                results.push(randomChar());
            }
            return results;
        })().join('');
    }
    function trimLineFeed(text) {
        if (text.length === 0) {
            return text;
        }
        if (text.length === 1) {
            if (text.charCodeAt(text.length - 1) === 10 ||
                text.charCodeAt(text.length - 1) === 13) {
                return '';
            }
            return text;
        }
        if (text.charCodeAt(text.length - 1) === 10) {
            if (text.charCodeAt(text.length - 2) === 13) {
                return text.slice(0, -2);
            }
            return text.slice(0, -1);
        }
        if (text.charCodeAt(text.length - 1) === 13) {
            return text.slice(0, -1);
        }
        return text;
    }
    //#region Assertion
    function testLinesContent(str, pieceTable) {
        const lines = (0, strings_1.splitLines)(str);
        assert.strictEqual(pieceTable.getLineCount(), lines.length);
        assert.strictEqual(pieceTable.getLinesRawContent(), str);
        for (let i = 0; i < lines.length; i++) {
            assert.strictEqual(pieceTable.getLineContent(i + 1), lines[i]);
            assert.strictEqual(trimLineFeed(pieceTable.getValueInRange(new range_1.Range(i + 1, 1, i + 1, lines[i].length + (i === lines.length - 1 ? 1 : 2)))), lines[i]);
        }
    }
    function testLineStarts(str, pieceTable) {
        const lineStarts = [0];
        // Reset regex to search from the beginning
        const _regex = new RegExp(/\r\n|\r|\n/g);
        _regex.lastIndex = 0;
        let prevMatchStartIndex = -1;
        let prevMatchLength = 0;
        let m;
        do {
            if (prevMatchStartIndex + prevMatchLength === str.length) {
                // Reached the end of the line
                break;
            }
            m = _regex.exec(str);
            if (!m) {
                break;
            }
            const matchStartIndex = m.index;
            const matchLength = m[0].length;
            if (matchStartIndex === prevMatchStartIndex &&
                matchLength === prevMatchLength) {
                // Exit early if the regex matches the same range twice
                break;
            }
            prevMatchStartIndex = matchStartIndex;
            prevMatchLength = matchLength;
            lineStarts.push(matchStartIndex + matchLength);
        } while (m);
        for (let i = 0; i < lineStarts.length; i++) {
            assert.deepStrictEqual(pieceTable.getPositionAt(lineStarts[i]), new position_1.Position(i + 1, 1));
            assert.strictEqual(pieceTable.getOffsetAt(i + 1, 1), lineStarts[i]);
        }
        for (let i = 1; i < lineStarts.length; i++) {
            const pos = pieceTable.getPositionAt(lineStarts[i] - 1);
            assert.strictEqual(pieceTable.getOffsetAt(pos.lineNumber, pos.column), lineStarts[i] - 1);
        }
    }
    function createTextBuffer(val, normalizeEOL = true) {
        const bufferBuilder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
        for (const chunk of val) {
            bufferBuilder.acceptChunk(chunk);
        }
        const factory = bufferBuilder.finish(normalizeEOL);
        return factory.create(1 /* DefaultEndOfLine.LF */).textBuffer;
    }
    function assertTreeInvariants(T) {
        assert(rbTreeBase_1.SENTINEL.color === 0 /* NodeColor.Black */);
        assert(rbTreeBase_1.SENTINEL.parent === rbTreeBase_1.SENTINEL);
        assert(rbTreeBase_1.SENTINEL.left === rbTreeBase_1.SENTINEL);
        assert(rbTreeBase_1.SENTINEL.right === rbTreeBase_1.SENTINEL);
        assert(rbTreeBase_1.SENTINEL.size_left === 0);
        assert(rbTreeBase_1.SENTINEL.lf_left === 0);
        assertValidTree(T);
    }
    function depth(n) {
        if (n === rbTreeBase_1.SENTINEL) {
            // The leafs are black
            return 1;
        }
        assert(depth(n.left) === depth(n.right));
        return (n.color === 0 /* NodeColor.Black */ ? 1 : 0) + depth(n.left);
    }
    function assertValidNode(n) {
        if (n === rbTreeBase_1.SENTINEL) {
            return { size: 0, lf_cnt: 0 };
        }
        const l = n.left;
        const r = n.right;
        if (n.color === 1 /* NodeColor.Red */) {
            assert(l.color === 0 /* NodeColor.Black */);
            assert(r.color === 0 /* NodeColor.Black */);
        }
        const actualLeft = assertValidNode(l);
        assert(actualLeft.lf_cnt === n.lf_left);
        assert(actualLeft.size === n.size_left);
        const actualRight = assertValidNode(r);
        return { size: n.size_left + n.piece.length + actualRight.size, lf_cnt: n.lf_left + n.piece.lineFeedCnt + actualRight.lf_cnt };
    }
    function assertValidTree(T) {
        if (T.root === rbTreeBase_1.SENTINEL) {
            return;
        }
        assert(T.root.color === 0 /* NodeColor.Black */);
        assert(depth(T.root.left) === depth(T.root.right));
        assertValidNode(T.root);
    }
    //#endregion
    suite('inserts and deletes', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('basic insert/delete', () => {
            const pieceTree = createTextBuffer([
                'This is a document with some text.'
            ]);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(34, 'This is some more text to insert at offset 34.');
            assert.strictEqual(pieceTable.getLinesRawContent(), 'This is a document with some text.This is some more text to insert at offset 34.');
            pieceTable.delete(42, 5);
            assert.strictEqual(pieceTable.getLinesRawContent(), 'This is a document with some text.This is more text to insert at offset 34.');
            assertTreeInvariants(pieceTable);
        });
        test('more inserts', () => {
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pt = pieceTree.getPieceTree();
            pt.insert(0, 'AAA');
            assert.strictEqual(pt.getLinesRawContent(), 'AAA');
            pt.insert(0, 'BBB');
            assert.strictEqual(pt.getLinesRawContent(), 'BBBAAA');
            pt.insert(6, 'CCC');
            assert.strictEqual(pt.getLinesRawContent(), 'BBBAAACCC');
            pt.insert(5, 'DDD');
            assert.strictEqual(pt.getLinesRawContent(), 'BBBAADDDACCC');
            assertTreeInvariants(pt);
        });
        test('more deletes', () => {
            const pieceTree = createTextBuffer(['012345678']);
            ds.add(pieceTree);
            const pt = pieceTree.getPieceTree();
            pt.delete(8, 1);
            assert.strictEqual(pt.getLinesRawContent(), '01234567');
            pt.delete(0, 1);
            assert.strictEqual(pt.getLinesRawContent(), '1234567');
            pt.delete(5, 1);
            assert.strictEqual(pt.getLinesRawContent(), '123457');
            pt.delete(5, 1);
            assert.strictEqual(pt.getLinesRawContent(), '12345');
            pt.delete(0, 5);
            assert.strictEqual(pt.getLinesRawContent(), '');
            assertTreeInvariants(pt);
        });
        test('random test 1', () => {
            let str = '';
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'ceLPHmFzvCtFeHkCBej ');
            str = str.substring(0, 0) + 'ceLPHmFzvCtFeHkCBej ' + str.substring(0);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            pieceTable.insert(8, 'gDCEfNYiBUNkSwtvB K ');
            str = str.substring(0, 8) + 'gDCEfNYiBUNkSwtvB K ' + str.substring(8);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            pieceTable.insert(38, 'cyNcHxjNPPoehBJldLS ');
            str = str.substring(0, 38) + 'cyNcHxjNPPoehBJldLS ' + str.substring(38);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            pieceTable.insert(59, 'ejMx\nOTgWlbpeDExjOk ');
            str = str.substring(0, 59) + 'ejMx\nOTgWlbpeDExjOk ' + str.substring(59);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            assertTreeInvariants(pieceTable);
        });
        test('random test 2', () => {
            let str = '';
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'VgPG ');
            str = str.substring(0, 0) + 'VgPG ' + str.substring(0);
            pieceTable.insert(2, 'DdWF ');
            str = str.substring(0, 2) + 'DdWF ' + str.substring(2);
            pieceTable.insert(0, 'hUJc ');
            str = str.substring(0, 0) + 'hUJc ' + str.substring(0);
            pieceTable.insert(8, 'lQEq ');
            str = str.substring(0, 8) + 'lQEq ' + str.substring(8);
            pieceTable.insert(10, 'Gbtp ');
            str = str.substring(0, 10) + 'Gbtp ' + str.substring(10);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            assertTreeInvariants(pieceTable);
        });
        test('random test 3', () => {
            let str = '';
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'gYSz');
            str = str.substring(0, 0) + 'gYSz' + str.substring(0);
            pieceTable.insert(1, 'mDQe');
            str = str.substring(0, 1) + 'mDQe' + str.substring(1);
            pieceTable.insert(1, 'DTMQ');
            str = str.substring(0, 1) + 'DTMQ' + str.substring(1);
            pieceTable.insert(2, 'GGZB');
            str = str.substring(0, 2) + 'GGZB' + str.substring(2);
            pieceTable.insert(12, 'wXpq');
            str = str.substring(0, 12) + 'wXpq' + str.substring(12);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
        });
        test('random delete 1', () => {
            let str = '';
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'vfb');
            str = str.substring(0, 0) + 'vfb' + str.substring(0);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            pieceTable.insert(0, 'zRq');
            str = str.substring(0, 0) + 'zRq' + str.substring(0);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            pieceTable.delete(5, 1);
            str = str.substring(0, 5) + str.substring(5 + 1);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            pieceTable.insert(1, 'UNw');
            str = str.substring(0, 1) + 'UNw' + str.substring(1);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            pieceTable.delete(4, 3);
            str = str.substring(0, 4) + str.substring(4 + 3);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            pieceTable.delete(1, 4);
            str = str.substring(0, 1) + str.substring(1 + 4);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            pieceTable.delete(0, 1);
            str = str.substring(0, 0) + str.substring(0 + 1);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            assertTreeInvariants(pieceTable);
        });
        test('random delete 2', () => {
            let str = '';
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'IDT');
            str = str.substring(0, 0) + 'IDT' + str.substring(0);
            pieceTable.insert(3, 'wwA');
            str = str.substring(0, 3) + 'wwA' + str.substring(3);
            pieceTable.insert(3, 'Gnr');
            str = str.substring(0, 3) + 'Gnr' + str.substring(3);
            pieceTable.delete(6, 3);
            str = str.substring(0, 6) + str.substring(6 + 3);
            pieceTable.insert(4, 'eHp');
            str = str.substring(0, 4) + 'eHp' + str.substring(4);
            pieceTable.insert(1, 'UAi');
            str = str.substring(0, 1) + 'UAi' + str.substring(1);
            pieceTable.insert(2, 'FrR');
            str = str.substring(0, 2) + 'FrR' + str.substring(2);
            pieceTable.delete(6, 7);
            str = str.substring(0, 6) + str.substring(6 + 7);
            pieceTable.delete(3, 5);
            str = str.substring(0, 3) + str.substring(3 + 5);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            assertTreeInvariants(pieceTable);
        });
        test('random delete 3', () => {
            let str = '';
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'PqM');
            str = str.substring(0, 0) + 'PqM' + str.substring(0);
            pieceTable.delete(1, 2);
            str = str.substring(0, 1) + str.substring(1 + 2);
            pieceTable.insert(1, 'zLc');
            str = str.substring(0, 1) + 'zLc' + str.substring(1);
            pieceTable.insert(0, 'MEX');
            str = str.substring(0, 0) + 'MEX' + str.substring(0);
            pieceTable.insert(0, 'jZh');
            str = str.substring(0, 0) + 'jZh' + str.substring(0);
            pieceTable.insert(8, 'GwQ');
            str = str.substring(0, 8) + 'GwQ' + str.substring(8);
            pieceTable.delete(5, 6);
            str = str.substring(0, 5) + str.substring(5 + 6);
            pieceTable.insert(4, 'ktw');
            str = str.substring(0, 4) + 'ktw' + str.substring(4);
            pieceTable.insert(5, 'GVu');
            str = str.substring(0, 5) + 'GVu' + str.substring(5);
            pieceTable.insert(9, 'jdm');
            str = str.substring(0, 9) + 'jdm' + str.substring(9);
            pieceTable.insert(15, 'na\n');
            str = str.substring(0, 15) + 'na\n' + str.substring(15);
            pieceTable.delete(5, 8);
            str = str.substring(0, 5) + str.substring(5 + 8);
            pieceTable.delete(3, 4);
            str = str.substring(0, 3) + str.substring(3 + 4);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            assertTreeInvariants(pieceTable);
        });
        test('random insert/delete \\r bug 1', () => {
            let str = 'a';
            const pieceTree = createTextBuffer(['a']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.delete(0, 1);
            str = str.substring(0, 0) + str.substring(0 + 1);
            pieceTable.insert(0, '\r\r\n\n');
            str = str.substring(0, 0) + '\r\r\n\n' + str.substring(0);
            pieceTable.delete(3, 1);
            str = str.substring(0, 3) + str.substring(3 + 1);
            pieceTable.insert(2, '\n\n\ra');
            str = str.substring(0, 2) + '\n\n\ra' + str.substring(2);
            pieceTable.delete(4, 3);
            str = str.substring(0, 4) + str.substring(4 + 3);
            pieceTable.insert(2, '\na\r\r');
            str = str.substring(0, 2) + '\na\r\r' + str.substring(2);
            pieceTable.insert(6, '\ra\n\n');
            str = str.substring(0, 6) + '\ra\n\n' + str.substring(6);
            pieceTable.insert(0, 'aa\n\n');
            str = str.substring(0, 0) + 'aa\n\n' + str.substring(0);
            pieceTable.insert(5, '\n\na\r');
            str = str.substring(0, 5) + '\n\na\r' + str.substring(5);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            assertTreeInvariants(pieceTable);
        });
        test('random insert/delete \\r bug 2', () => {
            let str = 'a';
            const pieceTree = createTextBuffer(['a']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(1, '\naa\r');
            str = str.substring(0, 1) + '\naa\r' + str.substring(1);
            pieceTable.delete(0, 4);
            str = str.substring(0, 0) + str.substring(0 + 4);
            pieceTable.insert(1, '\r\r\na');
            str = str.substring(0, 1) + '\r\r\na' + str.substring(1);
            pieceTable.insert(2, '\n\r\ra');
            str = str.substring(0, 2) + '\n\r\ra' + str.substring(2);
            pieceTable.delete(4, 1);
            str = str.substring(0, 4) + str.substring(4 + 1);
            pieceTable.insert(8, '\r\n\r\r');
            str = str.substring(0, 8) + '\r\n\r\r' + str.substring(8);
            pieceTable.insert(7, '\n\n\na');
            str = str.substring(0, 7) + '\n\n\na' + str.substring(7);
            pieceTable.insert(13, 'a\n\na');
            str = str.substring(0, 13) + 'a\n\na' + str.substring(13);
            pieceTable.delete(17, 3);
            str = str.substring(0, 17) + str.substring(17 + 3);
            pieceTable.insert(2, 'a\ra\n');
            str = str.substring(0, 2) + 'a\ra\n' + str.substring(2);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            assertTreeInvariants(pieceTable);
        });
        test('random insert/delete \\r bug 3', () => {
            let str = 'a';
            const pieceTree = createTextBuffer(['a']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, '\r\na\r');
            str = str.substring(0, 0) + '\r\na\r' + str.substring(0);
            pieceTable.delete(2, 3);
            str = str.substring(0, 2) + str.substring(2 + 3);
            pieceTable.insert(2, 'a\r\n\r');
            str = str.substring(0, 2) + 'a\r\n\r' + str.substring(2);
            pieceTable.delete(4, 2);
            str = str.substring(0, 4) + str.substring(4 + 2);
            pieceTable.insert(4, 'a\n\r\n');
            str = str.substring(0, 4) + 'a\n\r\n' + str.substring(4);
            pieceTable.insert(1, 'aa\n\r');
            str = str.substring(0, 1) + 'aa\n\r' + str.substring(1);
            pieceTable.insert(7, '\na\r\n');
            str = str.substring(0, 7) + '\na\r\n' + str.substring(7);
            pieceTable.insert(5, '\n\na\r');
            str = str.substring(0, 5) + '\n\na\r' + str.substring(5);
            pieceTable.insert(10, '\r\r\n\r');
            str = str.substring(0, 10) + '\r\r\n\r' + str.substring(10);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            pieceTable.delete(21, 3);
            str = str.substring(0, 21) + str.substring(21 + 3);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            assertTreeInvariants(pieceTable);
        });
        test('random insert/delete \\r bug 4s', () => {
            let str = 'a';
            const pieceTree = createTextBuffer(['a']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.delete(0, 1);
            str = str.substring(0, 0) + str.substring(0 + 1);
            pieceTable.insert(0, '\naaa');
            str = str.substring(0, 0) + '\naaa' + str.substring(0);
            pieceTable.insert(2, '\n\naa');
            str = str.substring(0, 2) + '\n\naa' + str.substring(2);
            pieceTable.delete(1, 4);
            str = str.substring(0, 1) + str.substring(1 + 4);
            pieceTable.delete(3, 1);
            str = str.substring(0, 3) + str.substring(3 + 1);
            pieceTable.delete(1, 2);
            str = str.substring(0, 1) + str.substring(1 + 2);
            pieceTable.delete(0, 1);
            str = str.substring(0, 0) + str.substring(0 + 1);
            pieceTable.insert(0, 'a\n\n\r');
            str = str.substring(0, 0) + 'a\n\n\r' + str.substring(0);
            pieceTable.insert(2, 'aa\r\n');
            str = str.substring(0, 2) + 'aa\r\n' + str.substring(2);
            pieceTable.insert(3, 'a\naa');
            str = str.substring(0, 3) + 'a\naa' + str.substring(3);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            assertTreeInvariants(pieceTable);
        });
        test('random insert/delete \\r bug 5', () => {
            let str = '';
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, '\n\n\n\r');
            str = str.substring(0, 0) + '\n\n\n\r' + str.substring(0);
            pieceTable.insert(1, '\n\n\n\r');
            str = str.substring(0, 1) + '\n\n\n\r' + str.substring(1);
            pieceTable.insert(2, '\n\r\r\r');
            str = str.substring(0, 2) + '\n\r\r\r' + str.substring(2);
            pieceTable.insert(8, '\n\r\n\r');
            str = str.substring(0, 8) + '\n\r\n\r' + str.substring(8);
            pieceTable.delete(5, 2);
            str = str.substring(0, 5) + str.substring(5 + 2);
            pieceTable.insert(4, '\n\r\r\r');
            str = str.substring(0, 4) + '\n\r\r\r' + str.substring(4);
            pieceTable.insert(8, '\n\n\n\r');
            str = str.substring(0, 8) + '\n\n\n\r' + str.substring(8);
            pieceTable.delete(0, 7);
            str = str.substring(0, 0) + str.substring(0 + 7);
            pieceTable.insert(1, '\r\n\r\r');
            str = str.substring(0, 1) + '\r\n\r\r' + str.substring(1);
            pieceTable.insert(15, '\n\r\r\r');
            str = str.substring(0, 15) + '\n\r\r\r' + str.substring(15);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            assertTreeInvariants(pieceTable);
        });
    });
    suite('prefix sum for line feed', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('basic', () => {
            const pieceTree = createTextBuffer(['1\n2\n3\n4']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            assert.strictEqual(pieceTable.getLineCount(), 4);
            assert.deepStrictEqual(pieceTable.getPositionAt(0), new position_1.Position(1, 1));
            assert.deepStrictEqual(pieceTable.getPositionAt(1), new position_1.Position(1, 2));
            assert.deepStrictEqual(pieceTable.getPositionAt(2), new position_1.Position(2, 1));
            assert.deepStrictEqual(pieceTable.getPositionAt(3), new position_1.Position(2, 2));
            assert.deepStrictEqual(pieceTable.getPositionAt(4), new position_1.Position(3, 1));
            assert.deepStrictEqual(pieceTable.getPositionAt(5), new position_1.Position(3, 2));
            assert.deepStrictEqual(pieceTable.getPositionAt(6), new position_1.Position(4, 1));
            assert.strictEqual(pieceTable.getOffsetAt(1, 1), 0);
            assert.strictEqual(pieceTable.getOffsetAt(1, 2), 1);
            assert.strictEqual(pieceTable.getOffsetAt(2, 1), 2);
            assert.strictEqual(pieceTable.getOffsetAt(2, 2), 3);
            assert.strictEqual(pieceTable.getOffsetAt(3, 1), 4);
            assert.strictEqual(pieceTable.getOffsetAt(3, 2), 5);
            assert.strictEqual(pieceTable.getOffsetAt(4, 1), 6);
            assertTreeInvariants(pieceTable);
        });
        test('append', () => {
            const pieceTree = createTextBuffer(['a\nb\nc\nde']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(8, 'fh\ni\njk');
            assert.strictEqual(pieceTable.getLineCount(), 6);
            assert.deepStrictEqual(pieceTable.getPositionAt(9), new position_1.Position(4, 4));
            assert.strictEqual(pieceTable.getOffsetAt(1, 1), 0);
            assertTreeInvariants(pieceTable);
        });
        test('insert', () => {
            const pieceTree = createTextBuffer(['a\nb\nc\nde']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(7, 'fh\ni\njk');
            assert.strictEqual(pieceTable.getLineCount(), 6);
            assert.deepStrictEqual(pieceTable.getPositionAt(6), new position_1.Position(4, 1));
            assert.deepStrictEqual(pieceTable.getPositionAt(7), new position_1.Position(4, 2));
            assert.deepStrictEqual(pieceTable.getPositionAt(8), new position_1.Position(4, 3));
            assert.deepStrictEqual(pieceTable.getPositionAt(9), new position_1.Position(4, 4));
            assert.deepStrictEqual(pieceTable.getPositionAt(12), new position_1.Position(6, 1));
            assert.deepStrictEqual(pieceTable.getPositionAt(13), new position_1.Position(6, 2));
            assert.deepStrictEqual(pieceTable.getPositionAt(14), new position_1.Position(6, 3));
            assert.strictEqual(pieceTable.getOffsetAt(4, 1), 6);
            assert.strictEqual(pieceTable.getOffsetAt(4, 2), 7);
            assert.strictEqual(pieceTable.getOffsetAt(4, 3), 8);
            assert.strictEqual(pieceTable.getOffsetAt(4, 4), 9);
            assert.strictEqual(pieceTable.getOffsetAt(6, 1), 12);
            assert.strictEqual(pieceTable.getOffsetAt(6, 2), 13);
            assert.strictEqual(pieceTable.getOffsetAt(6, 3), 14);
            assertTreeInvariants(pieceTable);
        });
        test('delete', () => {
            const pieceTree = createTextBuffer(['a\nb\nc\ndefh\ni\njk']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.delete(7, 2);
            assert.strictEqual(pieceTable.getLinesRawContent(), 'a\nb\nc\ndh\ni\njk');
            assert.strictEqual(pieceTable.getLineCount(), 6);
            assert.deepStrictEqual(pieceTable.getPositionAt(6), new position_1.Position(4, 1));
            assert.deepStrictEqual(pieceTable.getPositionAt(7), new position_1.Position(4, 2));
            assert.deepStrictEqual(pieceTable.getPositionAt(8), new position_1.Position(4, 3));
            assert.deepStrictEqual(pieceTable.getPositionAt(9), new position_1.Position(5, 1));
            assert.deepStrictEqual(pieceTable.getPositionAt(11), new position_1.Position(6, 1));
            assert.deepStrictEqual(pieceTable.getPositionAt(12), new position_1.Position(6, 2));
            assert.deepStrictEqual(pieceTable.getPositionAt(13), new position_1.Position(6, 3));
            assert.strictEqual(pieceTable.getOffsetAt(4, 1), 6);
            assert.strictEqual(pieceTable.getOffsetAt(4, 2), 7);
            assert.strictEqual(pieceTable.getOffsetAt(4, 3), 8);
            assert.strictEqual(pieceTable.getOffsetAt(5, 1), 9);
            assert.strictEqual(pieceTable.getOffsetAt(6, 1), 11);
            assert.strictEqual(pieceTable.getOffsetAt(6, 2), 12);
            assert.strictEqual(pieceTable.getOffsetAt(6, 3), 13);
            assertTreeInvariants(pieceTable);
        });
        test('add+delete 1', () => {
            const pieceTree = createTextBuffer(['a\nb\nc\nde']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(8, 'fh\ni\njk');
            pieceTable.delete(7, 2);
            assert.strictEqual(pieceTable.getLinesRawContent(), 'a\nb\nc\ndh\ni\njk');
            assert.strictEqual(pieceTable.getLineCount(), 6);
            assert.deepStrictEqual(pieceTable.getPositionAt(6), new position_1.Position(4, 1));
            assert.deepStrictEqual(pieceTable.getPositionAt(7), new position_1.Position(4, 2));
            assert.deepStrictEqual(pieceTable.getPositionAt(8), new position_1.Position(4, 3));
            assert.deepStrictEqual(pieceTable.getPositionAt(9), new position_1.Position(5, 1));
            assert.deepStrictEqual(pieceTable.getPositionAt(11), new position_1.Position(6, 1));
            assert.deepStrictEqual(pieceTable.getPositionAt(12), new position_1.Position(6, 2));
            assert.deepStrictEqual(pieceTable.getPositionAt(13), new position_1.Position(6, 3));
            assert.strictEqual(pieceTable.getOffsetAt(4, 1), 6);
            assert.strictEqual(pieceTable.getOffsetAt(4, 2), 7);
            assert.strictEqual(pieceTable.getOffsetAt(4, 3), 8);
            assert.strictEqual(pieceTable.getOffsetAt(5, 1), 9);
            assert.strictEqual(pieceTable.getOffsetAt(6, 1), 11);
            assert.strictEqual(pieceTable.getOffsetAt(6, 2), 12);
            assert.strictEqual(pieceTable.getOffsetAt(6, 3), 13);
            assertTreeInvariants(pieceTable);
        });
        test('insert random bug 1: prefixSumComputer.removeValues(start, cnt) cnt is 1 based.', () => {
            let str = '';
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, ' ZX \n Z\nZ\n YZ\nY\nZXX ');
            str =
                str.substring(0, 0) +
                    ' ZX \n Z\nZ\n YZ\nY\nZXX ' +
                    str.substring(0);
            pieceTable.insert(14, 'X ZZ\nYZZYZXXY Y XY\n ');
            str =
                str.substring(0, 14) + 'X ZZ\nYZZYZXXY Y XY\n ' + str.substring(14);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            testLineStarts(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('insert random bug 2: prefixSumComputer initialize does not do deep copy of UInt32Array.', () => {
            let str = '';
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'ZYZ\nYY XY\nX \nZ Y \nZ ');
            str =
                str.substring(0, 0) + 'ZYZ\nYY XY\nX \nZ Y \nZ ' + str.substring(0);
            pieceTable.insert(3, 'XXY \n\nY Y YYY  ZYXY ');
            str = str.substring(0, 3) + 'XXY \n\nY Y YYY  ZYXY ' + str.substring(3);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            testLineStarts(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('delete random bug 1: I forgot to update the lineFeedCnt when deletion is on one single piece.', () => {
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'ba\na\nca\nba\ncbab\ncaa ');
            pieceTable.insert(13, 'cca\naabb\ncac\nccc\nab ');
            pieceTable.delete(5, 8);
            pieceTable.delete(30, 2);
            pieceTable.insert(24, 'cbbacccbac\nbaaab\n\nc ');
            pieceTable.delete(29, 3);
            pieceTable.delete(23, 9);
            pieceTable.delete(21, 5);
            pieceTable.delete(30, 3);
            pieceTable.insert(3, 'cb\nac\nc\n\nacc\nbb\nb\nc ');
            pieceTable.delete(19, 5);
            pieceTable.insert(18, '\nbb\n\nacbc\ncbb\nc\nbb\n ');
            pieceTable.insert(65, 'cbccbac\nbc\n\nccabba\n ');
            pieceTable.insert(77, 'a\ncacb\n\nac\n\n\n\n\nabab ');
            pieceTable.delete(30, 9);
            pieceTable.insert(45, 'b\n\nc\nba\n\nbbbba\n\naa\n ');
            pieceTable.insert(82, 'ab\nbb\ncabacab\ncbc\na ');
            pieceTable.delete(123, 9);
            pieceTable.delete(71, 2);
            pieceTable.insert(33, 'acaa\nacb\n\naa\n\nc\n\n\n\n ');
            const str = pieceTable.getLinesRawContent();
            testLineStarts(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('delete random bug rb tree 1', () => {
            let str = '';
            const pieceTree = createTextBuffer([str]);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'YXXZ\n\nYY\n');
            str = str.substring(0, 0) + 'YXXZ\n\nYY\n' + str.substring(0);
            pieceTable.delete(0, 5);
            str = str.substring(0, 0) + str.substring(0 + 5);
            pieceTable.insert(0, 'ZXYY\nX\nZ\n');
            str = str.substring(0, 0) + 'ZXYY\nX\nZ\n' + str.substring(0);
            pieceTable.insert(10, '\nXY\nYXYXY');
            str = str.substring(0, 10) + '\nXY\nYXYXY' + str.substring(10);
            testLineStarts(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('delete random bug rb tree 2', () => {
            let str = '';
            const pieceTree = createTextBuffer([str]);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'YXXZ\n\nYY\n');
            str = str.substring(0, 0) + 'YXXZ\n\nYY\n' + str.substring(0);
            pieceTable.insert(0, 'ZXYY\nX\nZ\n');
            str = str.substring(0, 0) + 'ZXYY\nX\nZ\n' + str.substring(0);
            pieceTable.insert(10, '\nXY\nYXYXY');
            str = str.substring(0, 10) + '\nXY\nYXYXY' + str.substring(10);
            pieceTable.insert(8, 'YZXY\nZ\nYX');
            str = str.substring(0, 8) + 'YZXY\nZ\nYX' + str.substring(8);
            pieceTable.insert(12, 'XX\nXXYXYZ');
            str = str.substring(0, 12) + 'XX\nXXYXYZ' + str.substring(12);
            pieceTable.delete(0, 4);
            str = str.substring(0, 0) + str.substring(0 + 4);
            testLineStarts(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('delete random bug rb tree 3', () => {
            let str = '';
            const pieceTree = createTextBuffer([str]);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'YXXZ\n\nYY\n');
            str = str.substring(0, 0) + 'YXXZ\n\nYY\n' + str.substring(0);
            pieceTable.delete(7, 2);
            str = str.substring(0, 7) + str.substring(7 + 2);
            pieceTable.delete(6, 1);
            str = str.substring(0, 6) + str.substring(6 + 1);
            pieceTable.delete(0, 5);
            str = str.substring(0, 0) + str.substring(0 + 5);
            pieceTable.insert(0, 'ZXYY\nX\nZ\n');
            str = str.substring(0, 0) + 'ZXYY\nX\nZ\n' + str.substring(0);
            pieceTable.insert(10, '\nXY\nYXYXY');
            str = str.substring(0, 10) + '\nXY\nYXYXY' + str.substring(10);
            pieceTable.insert(8, 'YZXY\nZ\nYX');
            str = str.substring(0, 8) + 'YZXY\nZ\nYX' + str.substring(8);
            pieceTable.insert(12, 'XX\nXXYXYZ');
            str = str.substring(0, 12) + 'XX\nXXYXYZ' + str.substring(12);
            pieceTable.delete(0, 4);
            str = str.substring(0, 0) + str.substring(0 + 4);
            pieceTable.delete(30, 3);
            str = str.substring(0, 30) + str.substring(30 + 3);
            testLineStarts(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
    });
    suite('offset 2 position', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('random tests bug 1', () => {
            let str = '';
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'huuyYzUfKOENwGgZLqn ');
            str = str.substring(0, 0) + 'huuyYzUfKOENwGgZLqn ' + str.substring(0);
            pieceTable.delete(18, 2);
            str = str.substring(0, 18) + str.substring(18 + 2);
            pieceTable.delete(3, 1);
            str = str.substring(0, 3) + str.substring(3 + 1);
            pieceTable.delete(12, 4);
            str = str.substring(0, 12) + str.substring(12 + 4);
            pieceTable.insert(3, 'hMbnVEdTSdhLlPevXKF ');
            str = str.substring(0, 3) + 'hMbnVEdTSdhLlPevXKF ' + str.substring(3);
            pieceTable.delete(22, 8);
            str = str.substring(0, 22) + str.substring(22 + 8);
            pieceTable.insert(4, 'S umSnYrqOmOAV\nEbZJ ');
            str = str.substring(0, 4) + 'S umSnYrqOmOAV\nEbZJ ' + str.substring(4);
            testLineStarts(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
    });
    suite('get text in range', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('getContentInRange', () => {
            const pieceTree = createTextBuffer(['a\nb\nc\nde']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(8, 'fh\ni\njk');
            pieceTable.delete(7, 2);
            // 'a\nb\nc\ndh\ni\njk'
            assert.strictEqual(pieceTable.getValueInRange(new range_1.Range(1, 1, 1, 3)), 'a\n');
            assert.strictEqual(pieceTable.getValueInRange(new range_1.Range(2, 1, 2, 3)), 'b\n');
            assert.strictEqual(pieceTable.getValueInRange(new range_1.Range(3, 1, 3, 3)), 'c\n');
            assert.strictEqual(pieceTable.getValueInRange(new range_1.Range(4, 1, 4, 4)), 'dh\n');
            assert.strictEqual(pieceTable.getValueInRange(new range_1.Range(5, 1, 5, 3)), 'i\n');
            assert.strictEqual(pieceTable.getValueInRange(new range_1.Range(6, 1, 6, 3)), 'jk');
            assertTreeInvariants(pieceTable);
        });
        test('random test value in range', () => {
            let str = '';
            const pieceTree = createTextBuffer([str]);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'ZXXY');
            str = str.substring(0, 0) + 'ZXXY' + str.substring(0);
            pieceTable.insert(1, 'XZZY');
            str = str.substring(0, 1) + 'XZZY' + str.substring(1);
            pieceTable.insert(5, '\nX\n\n');
            str = str.substring(0, 5) + '\nX\n\n' + str.substring(5);
            pieceTable.insert(3, '\nXX\n');
            str = str.substring(0, 3) + '\nXX\n' + str.substring(3);
            pieceTable.insert(12, 'YYYX');
            str = str.substring(0, 12) + 'YYYX' + str.substring(12);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random test value in range exception', () => {
            let str = '';
            const pieceTree = createTextBuffer([str]);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'XZ\nZ');
            str = str.substring(0, 0) + 'XZ\nZ' + str.substring(0);
            pieceTable.delete(0, 3);
            str = str.substring(0, 0) + str.substring(0 + 3);
            pieceTable.delete(0, 1);
            str = str.substring(0, 0) + str.substring(0 + 1);
            pieceTable.insert(0, 'ZYX\n');
            str = str.substring(0, 0) + 'ZYX\n' + str.substring(0);
            pieceTable.delete(0, 4);
            str = str.substring(0, 0) + str.substring(0 + 4);
            pieceTable.getValueInRange(new range_1.Range(1, 1, 1, 1));
            assertTreeInvariants(pieceTable);
        });
        test('random tests bug 1', () => {
            let str = '';
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'huuyYzUfKOENwGgZLqn ');
            str = str.substring(0, 0) + 'huuyYzUfKOENwGgZLqn ' + str.substring(0);
            pieceTable.delete(18, 2);
            str = str.substring(0, 18) + str.substring(18 + 2);
            pieceTable.delete(3, 1);
            str = str.substring(0, 3) + str.substring(3 + 1);
            pieceTable.delete(12, 4);
            str = str.substring(0, 12) + str.substring(12 + 4);
            pieceTable.insert(3, 'hMbnVEdTSdhLlPevXKF ');
            str = str.substring(0, 3) + 'hMbnVEdTSdhLlPevXKF ' + str.substring(3);
            pieceTable.delete(22, 8);
            str = str.substring(0, 22) + str.substring(22 + 8);
            pieceTable.insert(4, 'S umSnYrqOmOAV\nEbZJ ');
            str = str.substring(0, 4) + 'S umSnYrqOmOAV\nEbZJ ' + str.substring(4);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random tests bug 2', () => {
            let str = '';
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'xfouRDZwdAHjVXJAMV\n ');
            str = str.substring(0, 0) + 'xfouRDZwdAHjVXJAMV\n ' + str.substring(0);
            pieceTable.insert(16, 'dBGndxpFZBEAIKykYYx ');
            str = str.substring(0, 16) + 'dBGndxpFZBEAIKykYYx ' + str.substring(16);
            pieceTable.delete(7, 6);
            str = str.substring(0, 7) + str.substring(7 + 6);
            pieceTable.delete(9, 7);
            str = str.substring(0, 9) + str.substring(9 + 7);
            pieceTable.delete(17, 6);
            str = str.substring(0, 17) + str.substring(17 + 6);
            pieceTable.delete(0, 4);
            str = str.substring(0, 0) + str.substring(0 + 4);
            pieceTable.insert(9, 'qvEFXCNvVkWgvykahYt ');
            str = str.substring(0, 9) + 'qvEFXCNvVkWgvykahYt ' + str.substring(9);
            pieceTable.delete(4, 6);
            str = str.substring(0, 4) + str.substring(4 + 6);
            pieceTable.insert(11, 'OcSChUYT\nzPEBOpsGmR ');
            str =
                str.substring(0, 11) + 'OcSChUYT\nzPEBOpsGmR ' + str.substring(11);
            pieceTable.insert(15, 'KJCozaXTvkE\nxnqAeTz ');
            str =
                str.substring(0, 15) + 'KJCozaXTvkE\nxnqAeTz ' + str.substring(15);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('get line content', () => {
            const pieceTree = createTextBuffer(['1']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            assert.strictEqual(pieceTable.getLineRawContent(1), '1');
            pieceTable.insert(1, '2');
            assert.strictEqual(pieceTable.getLineRawContent(1), '12');
            assertTreeInvariants(pieceTable);
        });
        test('get line content basic', () => {
            const pieceTree = createTextBuffer(['1\n2\n3\n4']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            assert.strictEqual(pieceTable.getLineRawContent(1), '1\n');
            assert.strictEqual(pieceTable.getLineRawContent(2), '2\n');
            assert.strictEqual(pieceTable.getLineRawContent(3), '3\n');
            assert.strictEqual(pieceTable.getLineRawContent(4), '4');
            assertTreeInvariants(pieceTable);
        });
        test('get line content after inserts/deletes', () => {
            const pieceTree = createTextBuffer(['a\nb\nc\nde']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(8, 'fh\ni\njk');
            pieceTable.delete(7, 2);
            // 'a\nb\nc\ndh\ni\njk'
            assert.strictEqual(pieceTable.getLineRawContent(1), 'a\n');
            assert.strictEqual(pieceTable.getLineRawContent(2), 'b\n');
            assert.strictEqual(pieceTable.getLineRawContent(3), 'c\n');
            assert.strictEqual(pieceTable.getLineRawContent(4), 'dh\n');
            assert.strictEqual(pieceTable.getLineRawContent(5), 'i\n');
            assert.strictEqual(pieceTable.getLineRawContent(6), 'jk');
            assertTreeInvariants(pieceTable);
        });
        test('random 1', () => {
            let str = '';
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'J eNnDzQpnlWyjmUu\ny ');
            str = str.substring(0, 0) + 'J eNnDzQpnlWyjmUu\ny ' + str.substring(0);
            pieceTable.insert(0, 'QPEeRAQmRwlJqtZSWhQ ');
            str = str.substring(0, 0) + 'QPEeRAQmRwlJqtZSWhQ ' + str.substring(0);
            pieceTable.delete(5, 1);
            str = str.substring(0, 5) + str.substring(5 + 1);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random 2', () => {
            let str = '';
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'DZoQ tglPCRHMltejRI ');
            str = str.substring(0, 0) + 'DZoQ tglPCRHMltejRI ' + str.substring(0);
            pieceTable.insert(10, 'JRXiyYqJ qqdcmbfkKX ');
            str = str.substring(0, 10) + 'JRXiyYqJ qqdcmbfkKX ' + str.substring(10);
            pieceTable.delete(16, 3);
            str = str.substring(0, 16) + str.substring(16 + 3);
            pieceTable.delete(25, 1);
            str = str.substring(0, 25) + str.substring(25 + 1);
            pieceTable.insert(18, 'vH\nNlvfqQJPm\nSFkhMc ');
            str =
                str.substring(0, 18) + 'vH\nNlvfqQJPm\nSFkhMc ' + str.substring(18);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
    });
    suite('CRLF', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('delete CR in CRLF 1', () => {
            const pieceTree = createTextBuffer([''], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'a\r\nb');
            pieceTable.delete(0, 2);
            assert.strictEqual(pieceTable.getLineCount(), 2);
            assertTreeInvariants(pieceTable);
        });
        test('delete CR in CRLF 2', () => {
            const pieceTree = createTextBuffer([''], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'a\r\nb');
            pieceTable.delete(2, 2);
            assert.strictEqual(pieceTable.getLineCount(), 2);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 1', () => {
            let str = '';
            const pieceTree = createTextBuffer([''], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, '\n\n\r\r');
            str = str.substring(0, 0) + '\n\n\r\r' + str.substring(0);
            pieceTable.insert(1, '\r\n\r\n');
            str = str.substring(0, 1) + '\r\n\r\n' + str.substring(1);
            pieceTable.delete(5, 3);
            str = str.substring(0, 5) + str.substring(5 + 3);
            pieceTable.delete(2, 3);
            str = str.substring(0, 2) + str.substring(2 + 3);
            const lines = (0, strings_1.splitLines)(str);
            assert.strictEqual(pieceTable.getLineCount(), lines.length);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 2', () => {
            let str = '';
            const pieceTree = createTextBuffer([''], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, '\n\r\n\r');
            str = str.substring(0, 0) + '\n\r\n\r' + str.substring(0);
            pieceTable.insert(2, '\n\r\r\r');
            str = str.substring(0, 2) + '\n\r\r\r' + str.substring(2);
            pieceTable.delete(4, 1);
            str = str.substring(0, 4) + str.substring(4 + 1);
            const lines = (0, strings_1.splitLines)(str);
            assert.strictEqual(pieceTable.getLineCount(), lines.length);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 3', () => {
            let str = '';
            const pieceTree = createTextBuffer([''], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, '\n\n\n\r');
            str = str.substring(0, 0) + '\n\n\n\r' + str.substring(0);
            pieceTable.delete(2, 2);
            str = str.substring(0, 2) + str.substring(2 + 2);
            pieceTable.delete(0, 2);
            str = str.substring(0, 0) + str.substring(0 + 2);
            pieceTable.insert(0, '\r\r\r\r');
            str = str.substring(0, 0) + '\r\r\r\r' + str.substring(0);
            pieceTable.insert(2, '\r\n\r\r');
            str = str.substring(0, 2) + '\r\n\r\r' + str.substring(2);
            pieceTable.insert(3, '\r\r\r\n');
            str = str.substring(0, 3) + '\r\r\r\n' + str.substring(3);
            const lines = (0, strings_1.splitLines)(str);
            assert.strictEqual(pieceTable.getLineCount(), lines.length);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 4', () => {
            let str = '';
            const pieceTree = createTextBuffer([''], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, '\n\n\n\n');
            str = str.substring(0, 0) + '\n\n\n\n' + str.substring(0);
            pieceTable.delete(3, 1);
            str = str.substring(0, 3) + str.substring(3 + 1);
            pieceTable.insert(1, '\r\r\r\r');
            str = str.substring(0, 1) + '\r\r\r\r' + str.substring(1);
            pieceTable.insert(6, '\r\n\n\r');
            str = str.substring(0, 6) + '\r\n\n\r' + str.substring(6);
            pieceTable.delete(5, 3);
            str = str.substring(0, 5) + str.substring(5 + 3);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 5', () => {
            let str = '';
            const pieceTree = createTextBuffer([''], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, '\n\n\n\n');
            str = str.substring(0, 0) + '\n\n\n\n' + str.substring(0);
            pieceTable.delete(3, 1);
            str = str.substring(0, 3) + str.substring(3 + 1);
            pieceTable.insert(0, '\n\r\r\n');
            str = str.substring(0, 0) + '\n\r\r\n' + str.substring(0);
            pieceTable.insert(4, '\n\r\r\n');
            str = str.substring(0, 4) + '\n\r\r\n' + str.substring(4);
            pieceTable.delete(4, 3);
            str = str.substring(0, 4) + str.substring(4 + 3);
            pieceTable.insert(5, '\r\r\n\r');
            str = str.substring(0, 5) + '\r\r\n\r' + str.substring(5);
            pieceTable.insert(12, '\n\n\n\r');
            str = str.substring(0, 12) + '\n\n\n\r' + str.substring(12);
            pieceTable.insert(5, '\r\r\r\n');
            str = str.substring(0, 5) + '\r\r\r\n' + str.substring(5);
            pieceTable.insert(20, '\n\n\r\n');
            str = str.substring(0, 20) + '\n\n\r\n' + str.substring(20);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 6', () => {
            let str = '';
            const pieceTree = createTextBuffer([''], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, '\n\r\r\n');
            str = str.substring(0, 0) + '\n\r\r\n' + str.substring(0);
            pieceTable.insert(4, '\r\n\n\r');
            str = str.substring(0, 4) + '\r\n\n\r' + str.substring(4);
            pieceTable.insert(3, '\r\n\n\n');
            str = str.substring(0, 3) + '\r\n\n\n' + str.substring(3);
            pieceTable.delete(4, 8);
            str = str.substring(0, 4) + str.substring(4 + 8);
            pieceTable.insert(4, '\r\n\n\r');
            str = str.substring(0, 4) + '\r\n\n\r' + str.substring(4);
            pieceTable.insert(0, '\r\n\n\r');
            str = str.substring(0, 0) + '\r\n\n\r' + str.substring(0);
            pieceTable.delete(4, 0);
            str = str.substring(0, 4) + str.substring(4 + 0);
            pieceTable.delete(8, 4);
            str = str.substring(0, 8) + str.substring(8 + 4);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 8', () => {
            let str = '';
            const pieceTree = createTextBuffer([''], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, '\r\n\n\r');
            str = str.substring(0, 0) + '\r\n\n\r' + str.substring(0);
            pieceTable.delete(1, 0);
            str = str.substring(0, 1) + str.substring(1 + 0);
            pieceTable.insert(3, '\n\n\n\r');
            str = str.substring(0, 3) + '\n\n\n\r' + str.substring(3);
            pieceTable.insert(7, '\n\n\r\n');
            str = str.substring(0, 7) + '\n\n\r\n' + str.substring(7);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 7', () => {
            let str = '';
            const pieceTree = createTextBuffer([''], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, '\r\r\n\n');
            str = str.substring(0, 0) + '\r\r\n\n' + str.substring(0);
            pieceTable.insert(4, '\r\n\n\r');
            str = str.substring(0, 4) + '\r\n\n\r' + str.substring(4);
            pieceTable.insert(7, '\n\r\r\r');
            str = str.substring(0, 7) + '\n\r\r\r' + str.substring(7);
            pieceTable.insert(11, '\n\n\r\n');
            str = str.substring(0, 11) + '\n\n\r\n' + str.substring(11);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 10', () => {
            let str = '';
            const pieceTree = createTextBuffer([''], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'qneW');
            str = str.substring(0, 0) + 'qneW' + str.substring(0);
            pieceTable.insert(0, 'YhIl');
            str = str.substring(0, 0) + 'YhIl' + str.substring(0);
            pieceTable.insert(0, 'qdsm');
            str = str.substring(0, 0) + 'qdsm' + str.substring(0);
            pieceTable.delete(7, 0);
            str = str.substring(0, 7) + str.substring(7 + 0);
            pieceTable.insert(12, 'iiPv');
            str = str.substring(0, 12) + 'iiPv' + str.substring(12);
            pieceTable.insert(9, 'V\rSA');
            str = str.substring(0, 9) + 'V\rSA' + str.substring(9);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 9', () => {
            let str = '';
            const pieceTree = createTextBuffer([''], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, '\n\n\n\n');
            str = str.substring(0, 0) + '\n\n\n\n' + str.substring(0);
            pieceTable.insert(3, '\n\r\n\r');
            str = str.substring(0, 3) + '\n\r\n\r' + str.substring(3);
            pieceTable.insert(2, '\n\r\n\n');
            str = str.substring(0, 2) + '\n\r\n\n' + str.substring(2);
            pieceTable.insert(0, '\n\n\r\r');
            str = str.substring(0, 0) + '\n\n\r\r' + str.substring(0);
            pieceTable.insert(3, '\r\r\r\r');
            str = str.substring(0, 3) + '\r\r\r\r' + str.substring(3);
            pieceTable.insert(3, '\n\n\r\r');
            str = str.substring(0, 3) + '\n\n\r\r' + str.substring(3);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
    });
    suite('centralized lineStarts with CRLF', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('delete CR in CRLF 1', () => {
            const pieceTree = createTextBuffer(['a\r\nb'], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.delete(2, 2);
            assert.strictEqual(pieceTable.getLineCount(), 2);
            assertTreeInvariants(pieceTable);
        });
        test('delete CR in CRLF 2', () => {
            const pieceTree = createTextBuffer(['a\r\nb']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.delete(0, 2);
            assert.strictEqual(pieceTable.getLineCount(), 2);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 1', () => {
            let str = '\n\n\r\r';
            const pieceTree = createTextBuffer(['\n\n\r\r'], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(1, '\r\n\r\n');
            str = str.substring(0, 1) + '\r\n\r\n' + str.substring(1);
            pieceTable.delete(5, 3);
            str = str.substring(0, 5) + str.substring(5 + 3);
            pieceTable.delete(2, 3);
            str = str.substring(0, 2) + str.substring(2 + 3);
            const lines = (0, strings_1.splitLines)(str);
            assert.strictEqual(pieceTable.getLineCount(), lines.length);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 2', () => {
            let str = '\n\r\n\r';
            const pieceTree = createTextBuffer(['\n\r\n\r'], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(2, '\n\r\r\r');
            str = str.substring(0, 2) + '\n\r\r\r' + str.substring(2);
            pieceTable.delete(4, 1);
            str = str.substring(0, 4) + str.substring(4 + 1);
            const lines = (0, strings_1.splitLines)(str);
            assert.strictEqual(pieceTable.getLineCount(), lines.length);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 3', () => {
            let str = '\n\n\n\r';
            const pieceTree = createTextBuffer(['\n\n\n\r'], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.delete(2, 2);
            str = str.substring(0, 2) + str.substring(2 + 2);
            pieceTable.delete(0, 2);
            str = str.substring(0, 0) + str.substring(0 + 2);
            pieceTable.insert(0, '\r\r\r\r');
            str = str.substring(0, 0) + '\r\r\r\r' + str.substring(0);
            pieceTable.insert(2, '\r\n\r\r');
            str = str.substring(0, 2) + '\r\n\r\r' + str.substring(2);
            pieceTable.insert(3, '\r\r\r\n');
            str = str.substring(0, 3) + '\r\r\r\n' + str.substring(3);
            const lines = (0, strings_1.splitLines)(str);
            assert.strictEqual(pieceTable.getLineCount(), lines.length);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 4', () => {
            let str = '\n\n\n\n';
            const pieceTree = createTextBuffer(['\n\n\n\n'], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.delete(3, 1);
            str = str.substring(0, 3) + str.substring(3 + 1);
            pieceTable.insert(1, '\r\r\r\r');
            str = str.substring(0, 1) + '\r\r\r\r' + str.substring(1);
            pieceTable.insert(6, '\r\n\n\r');
            str = str.substring(0, 6) + '\r\n\n\r' + str.substring(6);
            pieceTable.delete(5, 3);
            str = str.substring(0, 5) + str.substring(5 + 3);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 5', () => {
            let str = '\n\n\n\n';
            const pieceTree = createTextBuffer(['\n\n\n\n'], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.delete(3, 1);
            str = str.substring(0, 3) + str.substring(3 + 1);
            pieceTable.insert(0, '\n\r\r\n');
            str = str.substring(0, 0) + '\n\r\r\n' + str.substring(0);
            pieceTable.insert(4, '\n\r\r\n');
            str = str.substring(0, 4) + '\n\r\r\n' + str.substring(4);
            pieceTable.delete(4, 3);
            str = str.substring(0, 4) + str.substring(4 + 3);
            pieceTable.insert(5, '\r\r\n\r');
            str = str.substring(0, 5) + '\r\r\n\r' + str.substring(5);
            pieceTable.insert(12, '\n\n\n\r');
            str = str.substring(0, 12) + '\n\n\n\r' + str.substring(12);
            pieceTable.insert(5, '\r\r\r\n');
            str = str.substring(0, 5) + '\r\r\r\n' + str.substring(5);
            pieceTable.insert(20, '\n\n\r\n');
            str = str.substring(0, 20) + '\n\n\r\n' + str.substring(20);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 6', () => {
            let str = '\n\r\r\n';
            const pieceTree = createTextBuffer(['\n\r\r\n'], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(4, '\r\n\n\r');
            str = str.substring(0, 4) + '\r\n\n\r' + str.substring(4);
            pieceTable.insert(3, '\r\n\n\n');
            str = str.substring(0, 3) + '\r\n\n\n' + str.substring(3);
            pieceTable.delete(4, 8);
            str = str.substring(0, 4) + str.substring(4 + 8);
            pieceTable.insert(4, '\r\n\n\r');
            str = str.substring(0, 4) + '\r\n\n\r' + str.substring(4);
            pieceTable.insert(0, '\r\n\n\r');
            str = str.substring(0, 0) + '\r\n\n\r' + str.substring(0);
            pieceTable.delete(4, 0);
            str = str.substring(0, 4) + str.substring(4 + 0);
            pieceTable.delete(8, 4);
            str = str.substring(0, 8) + str.substring(8 + 4);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 7', () => {
            let str = '\r\n\n\r';
            const pieceTree = createTextBuffer(['\r\n\n\r'], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.delete(1, 0);
            str = str.substring(0, 1) + str.substring(1 + 0);
            pieceTable.insert(3, '\n\n\n\r');
            str = str.substring(0, 3) + '\n\n\n\r' + str.substring(3);
            pieceTable.insert(7, '\n\n\r\n');
            str = str.substring(0, 7) + '\n\n\r\n' + str.substring(7);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 8', () => {
            let str = '\r\r\n\n';
            const pieceTree = createTextBuffer(['\r\r\n\n'], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(4, '\r\n\n\r');
            str = str.substring(0, 4) + '\r\n\n\r' + str.substring(4);
            pieceTable.insert(7, '\n\r\r\r');
            str = str.substring(0, 7) + '\n\r\r\r' + str.substring(7);
            pieceTable.insert(11, '\n\n\r\n');
            str = str.substring(0, 11) + '\n\n\r\n' + str.substring(11);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 9', () => {
            let str = 'qneW';
            const pieceTree = createTextBuffer(['qneW'], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(0, 'YhIl');
            str = str.substring(0, 0) + 'YhIl' + str.substring(0);
            pieceTable.insert(0, 'qdsm');
            str = str.substring(0, 0) + 'qdsm' + str.substring(0);
            pieceTable.delete(7, 0);
            str = str.substring(0, 7) + str.substring(7 + 0);
            pieceTable.insert(12, 'iiPv');
            str = str.substring(0, 12) + 'iiPv' + str.substring(12);
            pieceTable.insert(9, 'V\rSA');
            str = str.substring(0, 9) + 'V\rSA' + str.substring(9);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random bug 10', () => {
            let str = '\n\n\n\n';
            const pieceTree = createTextBuffer(['\n\n\n\n'], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.insert(3, '\n\r\n\r');
            str = str.substring(0, 3) + '\n\r\n\r' + str.substring(3);
            pieceTable.insert(2, '\n\r\n\n');
            str = str.substring(0, 2) + '\n\r\n\n' + str.substring(2);
            pieceTable.insert(0, '\n\n\r\r');
            str = str.substring(0, 0) + '\n\n\r\r' + str.substring(0);
            pieceTable.insert(3, '\r\r\r\r');
            str = str.substring(0, 3) + '\r\r\r\r' + str.substring(3);
            pieceTable.insert(3, '\n\n\r\r');
            str = str.substring(0, 3) + '\n\n\r\r' + str.substring(3);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random chunk bug 1', () => {
            const pieceTree = createTextBuffer(['\n\r\r\n\n\n\r\n\r'], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            let str = '\n\r\r\n\n\n\r\n\r';
            pieceTable.delete(0, 2);
            str = str.substring(0, 0) + str.substring(0 + 2);
            pieceTable.insert(1, '\r\r\n\n');
            str = str.substring(0, 1) + '\r\r\n\n' + str.substring(1);
            pieceTable.insert(7, '\r\r\r\r');
            str = str.substring(0, 7) + '\r\r\r\r' + str.substring(7);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            testLineStarts(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random chunk bug 2', () => {
            const pieceTree = createTextBuffer([
                '\n\r\n\n\n\r\n\r\n\r\r\n\n\n\r\r\n\r\n'
            ], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            let str = '\n\r\n\n\n\r\n\r\n\r\r\n\n\n\r\r\n\r\n';
            pieceTable.insert(16, '\r\n\r\r');
            str = str.substring(0, 16) + '\r\n\r\r' + str.substring(16);
            pieceTable.insert(13, '\n\n\r\r');
            str = str.substring(0, 13) + '\n\n\r\r' + str.substring(13);
            pieceTable.insert(19, '\n\n\r\n');
            str = str.substring(0, 19) + '\n\n\r\n' + str.substring(19);
            pieceTable.delete(5, 0);
            str = str.substring(0, 5) + str.substring(5 + 0);
            pieceTable.delete(11, 2);
            str = str.substring(0, 11) + str.substring(11 + 2);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            testLineStarts(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random chunk bug 3', () => {
            const pieceTree = createTextBuffer(['\r\n\n\n\n\n\n\r\n'], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            let str = '\r\n\n\n\n\n\n\r\n';
            pieceTable.insert(4, '\n\n\r\n\r\r\n\n\r');
            str = str.substring(0, 4) + '\n\n\r\n\r\r\n\n\r' + str.substring(4);
            pieceTable.delete(4, 4);
            str = str.substring(0, 4) + str.substring(4 + 4);
            pieceTable.insert(11, '\r\n\r\n\n\r\r\n\n');
            str = str.substring(0, 11) + '\r\n\r\n\n\r\r\n\n' + str.substring(11);
            pieceTable.delete(1, 2);
            str = str.substring(0, 1) + str.substring(1 + 2);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            testLineStarts(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random chunk bug 4', () => {
            const pieceTree = createTextBuffer(['\n\r\n\r'], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            let str = '\n\r\n\r';
            pieceTable.insert(4, '\n\n\r\n');
            str = str.substring(0, 4) + '\n\n\r\n' + str.substring(4);
            pieceTable.insert(3, '\r\n\n\n');
            str = str.substring(0, 3) + '\r\n\n\n' + str.substring(3);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            testLineStarts(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
    });
    suite('random is unsupervised', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('splitting large change buffer', function () {
            const pieceTree = createTextBuffer([''], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            let str = '';
            pieceTable.insert(0, 'WUZ\nXVZY\n');
            str = str.substring(0, 0) + 'WUZ\nXVZY\n' + str.substring(0);
            pieceTable.insert(8, '\r\r\nZXUWVW');
            str = str.substring(0, 8) + '\r\r\nZXUWVW' + str.substring(8);
            pieceTable.delete(10, 7);
            str = str.substring(0, 10) + str.substring(10 + 7);
            pieceTable.delete(10, 1);
            str = str.substring(0, 10) + str.substring(10 + 1);
            pieceTable.insert(4, 'VX\r\r\nWZVZ');
            str = str.substring(0, 4) + 'VX\r\r\nWZVZ' + str.substring(4);
            pieceTable.delete(11, 3);
            str = str.substring(0, 11) + str.substring(11 + 3);
            pieceTable.delete(12, 4);
            str = str.substring(0, 12) + str.substring(12 + 4);
            pieceTable.delete(8, 0);
            str = str.substring(0, 8) + str.substring(8 + 0);
            pieceTable.delete(10, 2);
            str = str.substring(0, 10) + str.substring(10 + 2);
            pieceTable.insert(0, 'VZXXZYZX\r');
            str = str.substring(0, 0) + 'VZXXZYZX\r' + str.substring(0);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            testLineStarts(str, pieceTable);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random insert delete', function () {
            this.timeout(500000);
            let str = '';
            const pieceTree = createTextBuffer([str], false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            // let output = '';
            for (let i = 0; i < 1000; i++) {
                if (Math.random() < 0.6) {
                    // insert
                    const text = randomStr(100);
                    const pos = randomInt(str.length + 1);
                    pieceTable.insert(pos, text);
                    str = str.substring(0, pos) + text + str.substring(pos);
                    // output += `pieceTable.insert(${pos}, '${text.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}');\n`;
                    // output += `str = str.substring(0, ${pos}) + '${text.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}' + str.substring(${pos});\n`;
                }
                else {
                    // delete
                    const pos = randomInt(str.length);
                    const length = Math.min(str.length - pos, Math.floor(Math.random() * 10));
                    pieceTable.delete(pos, length);
                    str = str.substring(0, pos) + str.substring(pos + length);
                    // output += `pieceTable.delete(${pos}, ${length});\n`;
                    // output += `str = str.substring(0, ${pos}) + str.substring(${pos} + ${length});\n`
                }
            }
            // console.log(output);
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            testLineStarts(str, pieceTable);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random chunks', function () {
            this.timeout(500000);
            const chunks = [];
            for (let i = 0; i < 5; i++) {
                chunks.push(randomStr(1000));
            }
            const pieceTree = createTextBuffer(chunks, false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            let str = chunks.join('');
            for (let i = 0; i < 1000; i++) {
                if (Math.random() < 0.6) {
                    // insert
                    const text = randomStr(100);
                    const pos = randomInt(str.length + 1);
                    pieceTable.insert(pos, text);
                    str = str.substring(0, pos) + text + str.substring(pos);
                }
                else {
                    // delete
                    const pos = randomInt(str.length);
                    const length = Math.min(str.length - pos, Math.floor(Math.random() * 10));
                    pieceTable.delete(pos, length);
                    str = str.substring(0, pos) + str.substring(pos + length);
                }
            }
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            testLineStarts(str, pieceTable);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('random chunks 2', function () {
            this.timeout(500000);
            const chunks = [];
            chunks.push(randomStr(1000));
            const pieceTree = createTextBuffer(chunks, false);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            let str = chunks.join('');
            for (let i = 0; i < 50; i++) {
                if (Math.random() < 0.6) {
                    // insert
                    const text = randomStr(30);
                    const pos = randomInt(str.length + 1);
                    pieceTable.insert(pos, text);
                    str = str.substring(0, pos) + text + str.substring(pos);
                }
                else {
                    // delete
                    const pos = randomInt(str.length);
                    const length = Math.min(str.length - pos, Math.floor(Math.random() * 10));
                    pieceTable.delete(pos, length);
                    str = str.substring(0, pos) + str.substring(pos + length);
                }
                testLinesContent(str, pieceTable);
            }
            assert.strictEqual(pieceTable.getLinesRawContent(), str);
            testLineStarts(str, pieceTable);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
    });
    suite('buffer api', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('equal', () => {
            const a = createTextBuffer(['abc']);
            const b = createTextBuffer(['ab', 'c']);
            const c = createTextBuffer(['abd']);
            const d = createTextBuffer(['abcd']);
            ds.add(a);
            ds.add(b);
            ds.add(c);
            ds.add(d);
            assert(a.getPieceTree().equal(b.getPieceTree()));
            assert(!a.getPieceTree().equal(c.getPieceTree()));
            assert(!a.getPieceTree().equal(d.getPieceTree()));
        });
        test('equal with more chunks', () => {
            const a = createTextBuffer(['ab', 'cd', 'e']);
            const b = createTextBuffer(['ab', 'c', 'de']);
            ds.add(a);
            ds.add(b);
            assert(a.getPieceTree().equal(b.getPieceTree()));
        });
        test('equal 2, empty buffer', () => {
            const a = createTextBuffer(['']);
            const b = createTextBuffer(['']);
            ds.add(a);
            ds.add(b);
            assert(a.getPieceTree().equal(b.getPieceTree()));
        });
        test('equal 3, empty buffer', () => {
            const a = createTextBuffer(['a']);
            const b = createTextBuffer(['']);
            ds.add(a);
            ds.add(b);
            assert(!a.getPieceTree().equal(b.getPieceTree()));
        });
        test('getLineCharCode - issue #45735', () => {
            const pieceTree = createTextBuffer(['LINE1\nline2']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            assert.strictEqual(pieceTable.getLineCharCode(1, 0), 'L'.charCodeAt(0), 'L');
            assert.strictEqual(pieceTable.getLineCharCode(1, 1), 'I'.charCodeAt(0), 'I');
            assert.strictEqual(pieceTable.getLineCharCode(1, 2), 'N'.charCodeAt(0), 'N');
            assert.strictEqual(pieceTable.getLineCharCode(1, 3), 'E'.charCodeAt(0), 'E');
            assert.strictEqual(pieceTable.getLineCharCode(1, 4), '1'.charCodeAt(0), '1');
            assert.strictEqual(pieceTable.getLineCharCode(1, 5), '\n'.charCodeAt(0), '\\n');
            assert.strictEqual(pieceTable.getLineCharCode(2, 0), 'l'.charCodeAt(0), 'l');
            assert.strictEqual(pieceTable.getLineCharCode(2, 1), 'i'.charCodeAt(0), 'i');
            assert.strictEqual(pieceTable.getLineCharCode(2, 2), 'n'.charCodeAt(0), 'n');
            assert.strictEqual(pieceTable.getLineCharCode(2, 3), 'e'.charCodeAt(0), 'e');
            assert.strictEqual(pieceTable.getLineCharCode(2, 4), '2'.charCodeAt(0), '2');
        });
        test('getLineCharCode - issue #47733', () => {
            const pieceTree = createTextBuffer(['', 'LINE1\n', 'line2']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            assert.strictEqual(pieceTable.getLineCharCode(1, 0), 'L'.charCodeAt(0), 'L');
            assert.strictEqual(pieceTable.getLineCharCode(1, 1), 'I'.charCodeAt(0), 'I');
            assert.strictEqual(pieceTable.getLineCharCode(1, 2), 'N'.charCodeAt(0), 'N');
            assert.strictEqual(pieceTable.getLineCharCode(1, 3), 'E'.charCodeAt(0), 'E');
            assert.strictEqual(pieceTable.getLineCharCode(1, 4), '1'.charCodeAt(0), '1');
            assert.strictEqual(pieceTable.getLineCharCode(1, 5), '\n'.charCodeAt(0), '\\n');
            assert.strictEqual(pieceTable.getLineCharCode(2, 0), 'l'.charCodeAt(0), 'l');
            assert.strictEqual(pieceTable.getLineCharCode(2, 1), 'i'.charCodeAt(0), 'i');
            assert.strictEqual(pieceTable.getLineCharCode(2, 2), 'n'.charCodeAt(0), 'n');
            assert.strictEqual(pieceTable.getLineCharCode(2, 3), 'e'.charCodeAt(0), 'e');
            assert.strictEqual(pieceTable.getLineCharCode(2, 4), '2'.charCodeAt(0), '2');
        });
    });
    suite('search offset cache', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('render white space exception', () => {
            const pieceTree = createTextBuffer(['class Name{\n\t\n\t\t\tget() {\n\n\t\t\t}\n\t\t}']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            let str = 'class Name{\n\t\n\t\t\tget() {\n\n\t\t\t}\n\t\t}';
            pieceTable.insert(12, 's');
            str = str.substring(0, 12) + 's' + str.substring(12);
            pieceTable.insert(13, 'e');
            str = str.substring(0, 13) + 'e' + str.substring(13);
            pieceTable.insert(14, 't');
            str = str.substring(0, 14) + 't' + str.substring(14);
            pieceTable.insert(15, '()');
            str = str.substring(0, 15) + '()' + str.substring(15);
            pieceTable.delete(16, 1);
            str = str.substring(0, 16) + str.substring(16 + 1);
            pieceTable.insert(17, '()');
            str = str.substring(0, 17) + '()' + str.substring(17);
            pieceTable.delete(18, 1);
            str = str.substring(0, 18) + str.substring(18 + 1);
            pieceTable.insert(18, '}');
            str = str.substring(0, 18) + '}' + str.substring(18);
            pieceTable.insert(12, '\n');
            str = str.substring(0, 12) + '\n' + str.substring(12);
            pieceTable.delete(12, 1);
            str = str.substring(0, 12) + str.substring(12 + 1);
            pieceTable.delete(18, 1);
            str = str.substring(0, 18) + str.substring(18 + 1);
            pieceTable.insert(18, '}');
            str = str.substring(0, 18) + '}' + str.substring(18);
            pieceTable.delete(17, 2);
            str = str.substring(0, 17) + str.substring(17 + 2);
            pieceTable.delete(16, 1);
            str = str.substring(0, 16) + str.substring(16 + 1);
            pieceTable.insert(16, ')');
            str = str.substring(0, 16) + ')' + str.substring(16);
            pieceTable.delete(15, 2);
            str = str.substring(0, 15) + str.substring(15 + 2);
            const content = pieceTable.getLinesRawContent();
            assert(content === str);
        });
        test('Line breaks replacement is not necessary when EOL is normalized', () => {
            const pieceTree = createTextBuffer(['abc']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            let str = 'abc';
            pieceTable.insert(3, 'def\nabc');
            str = str + 'def\nabc';
            testLineStarts(str, pieceTable);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('Line breaks replacement is not necessary when EOL is normalized 2', () => {
            const pieceTree = createTextBuffer(['abc\n']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            let str = 'abc\n';
            pieceTable.insert(4, 'def\nabc');
            str = str + 'def\nabc';
            testLineStarts(str, pieceTable);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('Line breaks replacement is not necessary when EOL is normalized 3', () => {
            const pieceTree = createTextBuffer(['abc\n']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            let str = 'abc\n';
            pieceTable.insert(2, 'def\nabc');
            str = str.substring(0, 2) + 'def\nabc' + str.substring(2);
            testLineStarts(str, pieceTable);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
        test('Line breaks replacement is not necessary when EOL is normalized 4', () => {
            const pieceTree = createTextBuffer(['abc\n']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            let str = 'abc\n';
            pieceTable.insert(3, 'def\nabc');
            str = str.substring(0, 3) + 'def\nabc' + str.substring(3);
            testLineStarts(str, pieceTable);
            testLinesContent(str, pieceTable);
            assertTreeInvariants(pieceTable);
        });
    });
    function getValueInSnapshot(snapshot) {
        let ret = '';
        let tmp = snapshot.read();
        while (tmp !== null) {
            ret += tmp;
            tmp = snapshot.read();
        }
        return ret;
    }
    suite('snapshot', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('bug #45564, piece tree pieces should be immutable', () => {
            const model = (0, testTextModel_1.createTextModel)('\n');
            model.applyEdits([
                {
                    range: new range_1.Range(2, 1, 2, 1),
                    text: '!'
                }
            ]);
            const snapshot = model.createSnapshot();
            const snapshot1 = model.createSnapshot();
            assert.strictEqual(model.getLinesContent().join('\n'), getValueInSnapshot(snapshot));
            model.applyEdits([
                {
                    range: new range_1.Range(2, 1, 2, 2),
                    text: ''
                }
            ]);
            model.applyEdits([
                {
                    range: new range_1.Range(2, 1, 2, 1),
                    text: '!'
                }
            ]);
            assert.strictEqual(model.getLinesContent().join('\n'), getValueInSnapshot(snapshot1));
            model.dispose();
        });
        test('immutable snapshot 1', () => {
            const model = (0, testTextModel_1.createTextModel)('abc\ndef');
            const snapshot = model.createSnapshot();
            model.applyEdits([
                {
                    range: new range_1.Range(2, 1, 2, 4),
                    text: ''
                }
            ]);
            model.applyEdits([
                {
                    range: new range_1.Range(1, 1, 2, 1),
                    text: 'abc\ndef'
                }
            ]);
            assert.strictEqual(model.getLinesContent().join('\n'), getValueInSnapshot(snapshot));
            model.dispose();
        });
        test('immutable snapshot 2', () => {
            const model = (0, testTextModel_1.createTextModel)('abc\ndef');
            const snapshot = model.createSnapshot();
            model.applyEdits([
                {
                    range: new range_1.Range(2, 1, 2, 1),
                    text: '!'
                }
            ]);
            model.applyEdits([
                {
                    range: new range_1.Range(2, 1, 2, 2),
                    text: ''
                }
            ]);
            assert.strictEqual(model.getLinesContent().join('\n'), getValueInSnapshot(snapshot));
            model.dispose();
        });
        test('immutable snapshot 3', () => {
            const model = (0, testTextModel_1.createTextModel)('abc\ndef');
            model.applyEdits([
                {
                    range: new range_1.Range(2, 4, 2, 4),
                    text: '!'
                }
            ]);
            const snapshot = model.createSnapshot();
            model.applyEdits([
                {
                    range: new range_1.Range(2, 5, 2, 5),
                    text: '!'
                }
            ]);
            assert.notStrictEqual(model.getLinesContent().join('\n'), getValueInSnapshot(snapshot));
            model.dispose();
        });
    });
    suite('chunk based search', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('#45892. For some cases, the buffer is empty but we still try to search', () => {
            const pieceTree = createTextBuffer(['']);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.delete(0, 1);
            const ret = pieceTree.findMatchesLineByLine(new range_1.Range(1, 1, 1, 1), new model_1.SearchData(/abc/, new wordCharacterClassifier_1.WordCharacterClassifier(',./', []), 'abc'), true, 1000);
            assert.strictEqual(ret.length, 0);
        });
        test('#45770. FindInNode should not cross node boundary.', () => {
            const pieceTree = createTextBuffer([
                [
                    'balabalababalabalababalabalaba',
                    'balabalababalabalababalabalaba',
                    '',
                    '* [ ] task1',
                    '* [x] task2 balabalaba',
                    '* [ ] task 3'
                ].join('\n')
            ]);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.delete(0, 62);
            pieceTable.delete(16, 1);
            pieceTable.insert(16, ' ');
            const ret = pieceTable.findMatchesLineByLine(new range_1.Range(1, 1, 4, 13), new model_1.SearchData(/\[/gi, new wordCharacterClassifier_1.WordCharacterClassifier(',./', []), '['), true, 1000);
            assert.strictEqual(ret.length, 3);
            assert.deepStrictEqual(ret[0].range, new range_1.Range(2, 3, 2, 4));
            assert.deepStrictEqual(ret[1].range, new range_1.Range(3, 3, 3, 4));
            assert.deepStrictEqual(ret[2].range, new range_1.Range(4, 3, 4, 4));
        });
        test('search searching from the middle', () => {
            const pieceTree = createTextBuffer([
                [
                    'def',
                    'dbcabc'
                ].join('\n')
            ]);
            ds.add(pieceTree);
            const pieceTable = pieceTree.getPieceTree();
            pieceTable.delete(4, 1);
            let ret = pieceTable.findMatchesLineByLine(new range_1.Range(2, 3, 2, 6), new model_1.SearchData(/a/gi, null, 'a'), true, 1000);
            assert.strictEqual(ret.length, 1);
            assert.deepStrictEqual(ret[0].range, new range_1.Range(2, 3, 2, 4));
            pieceTable.delete(4, 1);
            ret = pieceTable.findMatchesLineByLine(new range_1.Range(2, 2, 2, 5), new model_1.SearchData(/a/gi, null, 'a'), true, 1000);
            assert.strictEqual(ret.length, 1);
            assert.deepStrictEqual(ret[0].range, new range_1.Range(2, 2, 2, 3));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGllY2VUcmVlVGV4dEJ1ZmZlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZWwvcGllY2VUcmVlVGV4dEJ1ZmZlci9waWVjZVRyZWVUZXh0QnVmZmVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFlaEcsTUFBTSxRQUFRLEdBQUcsMERBQTBELENBQUM7SUFFNUUsU0FBUyxVQUFVO1FBQ2xCLE9BQU8sUUFBUSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRUQsU0FBUyxTQUFTLENBQUMsS0FBYTtRQUMvQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRCxTQUFTLFNBQVMsQ0FBQyxHQUFXO1FBQzdCLElBQUksR0FBRyxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ2xCLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDVixDQUFDO1FBQ0QsT0FBTyxDQUFDO1lBQ1AsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDO1lBQ1gsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ25CLEtBQ0MsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUNoQixDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUM1QixDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQ25CLENBQUM7Z0JBQ0YsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FB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QUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzdCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM3QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDN0IsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzdCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RCxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM5QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMxRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7WUFDNUIsSUFBSSxHQUFHLEdBQUcs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QUFpQixFQUFFLEdBQUcsRUFBRTtZQUM1QixJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7WUFDYixNQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsQixNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFNUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqRCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN6RCxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7WUFDNUIsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ2IsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLEVBQUUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbEIsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQzVDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDakQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqRCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRCxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM5QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDeEQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3pELG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2xDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtZQUMzQyxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDZCxNQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDMUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsQixNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDNUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2pDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDakQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDaEMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLFNBQVMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqRCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNoQyxHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsU0FBUyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDaEMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLFNBQVMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQy9CLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxRQUFRLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4RCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNoQyxHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsU0FBUyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFekQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN6RCxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNsQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxHQUFHLEVBQUU7WUFDM0MsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDO1lBQ2QsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbEIsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQzVDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQy9CLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxRQUFRLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4RCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDakQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDaEMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLFNBQVMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2hDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxTQUFTLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDakQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDakMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLFVBQVUsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2hDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxTQUFTLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RCxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxR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QUFTLENBQUMsQ0FBQztZQUNsQixNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDNUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDbEMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEIsdUJBQXVCO1lBRXZCLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdFLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdFLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdFLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzlFLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdFLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFD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Q0FBQyxDQUFDO1lBQzFELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2pDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDakQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDakMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLFVBQVUsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFELFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2xDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM1RCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNqQyxHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsVUFBVSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDbEMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FB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LENBQUM7WUFDeEQsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsQixNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFNUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2pDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNqQyxHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsVUFBVSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2pDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRCxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNsQyxHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsVUFBVSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDNUQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDakMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLFVBQVUsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFELFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2xDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUU1RCxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDbEMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtZQUN6QixJQUFJLEdBQUcsR0FBRyxVQUFVLENBQUM7WUFDckIsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN4RCxFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUU1QyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNqQyxHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsVUFBVSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDakMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLFVBQVUsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqRCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNqQyxHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsVUFBVSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDakMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLFVBQVUsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFELFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqRCxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFD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LFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsYUFBYSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0QsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDckMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLGNBQWMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlELFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNuRCxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDbkQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDckMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLGNBQWMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlELFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNuRCxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFB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R0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDN0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDN0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDN0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDOUUsQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1lBQzNDLE1BQU0sU0FBUyxHQUFHLGdCQUFnQixDQUFDLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzdELEVBQUUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbEIsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDN0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDN0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDN0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzdFLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM3RSxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDOUUsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7UUFDakMsTUFBTSxFQUFFLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXJELElBQUksQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLEVBQUU7WUFDekMsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxrREFBa0QsQ0FBQyxDQUFDLENBQUM7WUFDekYsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsQixNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDNUMsSUFBSSxHQUFHLEdBQUcsa0RBQWtELENBQUM7WUFFN0QsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDM0IsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRXJELFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVyRCxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMzQixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFckQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLElBQUksR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRXRELFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVuRCxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFdEQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRW5ELFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVyRCxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1QixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFdEQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRW5ELFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVuRCxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMzQixHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFckQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRW5ELFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVuRCxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FB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