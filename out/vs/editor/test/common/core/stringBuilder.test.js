/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/test/common/utils", "vs/editor/common/core/stringBuilder"], function (require, exports, assert, buffer_1, utils_1, stringBuilder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('decodeUTF16LE', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #118041: unicode character undo bug 1', () => {
            const buff = new Uint8Array(2);
            (0, buffer_1.writeUInt16LE)(buff, '﻿'.charCodeAt(0), 0);
            const actual = (0, stringBuilder_1.decodeUTF16LE)(buff, 0, 1);
            assert.deepStrictEqual(actual, '﻿');
        });
        test('issue #118041: unicode character undo bug 2', () => {
            const buff = new Uint8Array(4);
            (0, buffer_1.writeUInt16LE)(buff, 'a﻿'.charCodeAt(0), 0);
            (0, buffer_1.writeUInt16LE)(buff, 'a﻿'.charCodeAt(1), 2);
            const actual = (0, stringBuilder_1.decodeUTF16LE)(buff, 0, 2);
            assert.deepStrictEqual(actual, 'a﻿');
        });
        test('issue #118041: unicode character undo bug 3', () => {
            const buff = new Uint8Array(6);
            (0, buffer_1.writeUInt16LE)(buff, 'a﻿b'.charCodeAt(0), 0);
            (0, buffer_1.writeUInt16LE)(buff, 'a﻿b'.charCodeAt(1), 2);
            (0, buffer_1.writeUInt16LE)(buff, 'a﻿b'.charCodeAt(2), 4);
            const actual = (0, stringBuilder_1.decodeUTF16LE)(buff, 0, 3);
            assert.deepStrictEqual(actual, 'a﻿b');
        });
    });
    suite('StringBuilder', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('basic', () => {
            const sb = new stringBuilder_1.StringBuilder(100);
            sb.appendASCIICharCode(65 /* CharCode.A */);
            sb.appendASCIICharCode(32 /* CharCode.Space */);
            sb.appendString('😊');
            assert.strictEqual(sb.build(), 'A 😊');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5nQnVpbGRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vY29yZS9zdHJpbmdCdWlsZGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsS0FBSyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFFM0IsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyw2Q0FBNkMsRUFBRSxHQUFHLEVBQUU7WUFDeEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0IsSUFBQSxzQkFBYSxFQUFDLElBQUksRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sTUFBTSxHQUFHLElBQUEsNkJBQWEsRUFBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtZQUN4RCxNQUFNLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvQixJQUFBLHNCQUFhLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0MsSUFBQSxzQkFBYSxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sTUFBTSxHQUFHLElBQUEsNkJBQWEsRUFBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtZQUN4RCxNQUFNLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvQixJQUFBLHNCQUFhLEVBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUMsSUFBQSxzQkFBYSxFQUFDLElBQUksRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVDLElBQUEsc0JBQWEsRUFBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLE1BQU0sR0FBRyxJQUFBLDZCQUFhLEVBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6QyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztJQUVKLENBQUMsQ0FBQyxDQUFDO0lBRUgsS0FBSyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFFM0IsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO1lBQ2xCLE1BQU0sRUFBRSxHQUFHLElBQUksNkJBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQyxFQUFFLENBQUMsbUJBQW1CLHFCQUFZLENBQUM7WUFDbkMsRUFBRSxDQUFDLG1CQUFtQix5QkFBZ0IsQ0FBQztZQUN2QyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==