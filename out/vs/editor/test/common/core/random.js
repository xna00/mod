/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/core/offsetRange", "vs/editor/common/core/positionToOffset", "vs/editor/common/core/range", "vs/editor/common/core/textEdit"], function (require, exports, arrays_1, offsetRange_1, positionToOffset_1, range_1, textEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Random = void 0;
    class Random {
        static { this.basicAlphabet = '      abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; }
        static { this.basicAlphabetMultiline = '      \n\n\nabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; }
        static create(seed) {
            return new MersenneTwister(seed);
        }
        nextString(length, alphabet = Random.basicAlphabet) {
            let randomText = '';
            for (let i = 0; i < length; i++) {
                const characterIndex = this.nextIntRange(0, alphabet.length);
                randomText += alphabet.charAt(characterIndex);
            }
            return randomText;
        }
        nextMultiLineString(lineCount, lineLengthRange, alphabet = Random.basicAlphabet) {
            const lines = [];
            for (let i = 0; i < lineCount; i++) {
                const lineLength = this.nextIntRange(lineLengthRange.start, lineLengthRange.endExclusive);
                lines.push(this.nextString(lineLength, alphabet));
            }
            return lines.join('\n');
        }
        nextConsecutivePositions(source, count) {
            const t = new positionToOffset_1.PositionOffsetTransformer(source.getValue());
            const offsets = offsetRange_1.OffsetRange.ofLength(count).map(() => this.nextIntRange(0, t.text.length));
            offsets.sort(arrays_1.numberComparator);
            return offsets.map(offset => t.getPosition(offset));
        }
        nextRange(source) {
            const [start, end] = this.nextConsecutivePositions(source, 2);
            return range_1.Range.fromPositions(start, end);
        }
        nextTextEdit(target, singleTextEditCount) {
            const singleTextEdits = [];
            const positions = this.nextConsecutivePositions(target, singleTextEditCount * 2);
            for (let i = 0; i < singleTextEditCount; i++) {
                const start = positions[i * 2];
                const end = positions[i * 2 + 1];
                const newText = this.nextString(end.column - start.column, Random.basicAlphabetMultiline);
                singleTextEdits.push(new textEdit_1.SingleTextEdit(range_1.Range.fromPositions(start, end), newText));
            }
            return new textEdit_1.TextEdit(singleTextEdits).normalize();
        }
    }
    exports.Random = Random;
    class MersenneTwister extends Random {
        constructor(seed) {
            super();
            this.mt = new Array(624);
            this.index = 0;
            this.mt[0] = seed >>> 0;
            for (let i = 1; i < 624; i++) {
                const s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
                this.mt[i] = (((((s & 0xffff0000) >>> 16) * 0x6c078965) << 16) + (s & 0x0000ffff) * 0x6c078965 + i) >>> 0;
            }
        }
        _nextInt() {
            if (this.index === 0) {
                this.generateNumbers();
            }
            let y = this.mt[this.index];
            y = y ^ (y >>> 11);
            y = y ^ ((y << 7) & 0x9d2c5680);
            y = y ^ ((y << 15) & 0xefc60000);
            y = y ^ (y >>> 18);
            this.index = (this.index + 1) % 624;
            return y >>> 0;
        }
        nextIntRange(start, endExclusive) {
            const range = endExclusive - start;
            return Math.floor(this._nextInt() / (0x100000000 / range)) + start;
        }
        generateNumbers() {
            for (let i = 0; i < 624; i++) {
                const y = (this.mt[i] & 0x80000000) + (this.mt[(i + 1) % 624] & 0x7fffffff);
                this.mt[i] = this.mt[(i + 397) % 624] ^ (y >>> 1);
                if ((y % 2) !== 0) {
                    this.mt[i] = this.mt[i] ^ 0x9908b0df;
                }
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZG9tLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vY29yZS9yYW5kb20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQXNCLE1BQU07aUJBQ2Isa0JBQWEsR0FBVyxzRUFBc0UsQ0FBQztpQkFDL0YsMkJBQXNCLEdBQVcsNEVBQTRFLENBQUM7UUFFckgsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFZO1lBQ2hDLE9BQU8sSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUlNLFVBQVUsQ0FBQyxNQUFjLEVBQUUsUUFBUSxHQUFHLE1BQU0sQ0FBQyxhQUFhO1lBQ2hFLElBQUksVUFBVSxHQUFXLEVBQUUsQ0FBQztZQUM1QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDN0QsVUFBVSxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDL0MsQ0FBQztZQUNELE9BQU8sVUFBVSxDQUFDO1FBQ25CLENBQUM7UUFFTSxtQkFBbUIsQ0FBQyxTQUFpQixFQUFFLGVBQTRCLEVBQUUsUUFBUSxHQUFHLE1BQU0sQ0FBQyxhQUFhO1lBQzFHLE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQztZQUMzQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsZUFB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