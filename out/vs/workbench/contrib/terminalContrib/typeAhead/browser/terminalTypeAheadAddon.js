/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/async", "vs/base/common/color", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/platform/configuration/common/configuration", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, async_1, color_1, decorators_1, event_1, lifecycle_1, strings_1, configuration_1, telemetry_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TypeAheadAddon = exports.CharPredictState = exports.PredictionTimeline = exports.PredictionStats = void 0;
    var VT;
    (function (VT) {
        VT["Esc"] = "\u001B";
        VT["Csi"] = "\u001B[";
        VT["ShowCursor"] = "\u001B[?25h";
        VT["HideCursor"] = "\u001B[?25l";
        VT["DeleteChar"] = "\u001B[X";
        VT["DeleteRestOfLine"] = "\u001B[K";
    })(VT || (VT = {}));
    const CSI_STYLE_RE = /^\x1b\[[0-9;]*m/;
    const CSI_MOVE_RE = /^\x1b\[?([0-9]*)(;[35])?O?([DC])/;
    const NOT_WORD_RE = /[^a-z0-9]/i;
    var StatsConstants;
    (function (StatsConstants) {
        StatsConstants[StatsConstants["StatsBufferSize"] = 24] = "StatsBufferSize";
        StatsConstants[StatsConstants["StatsSendTelemetryEvery"] = 300000] = "StatsSendTelemetryEvery";
        StatsConstants[StatsConstants["StatsMinSamplesToTurnOn"] = 5] = "StatsMinSamplesToTurnOn";
        StatsConstants[StatsConstants["StatsMinAccuracyToTurnOn"] = 0.3] = "StatsMinAccuracyToTurnOn";
        StatsConstants[StatsConstants["StatsToggleOffThreshold"] = 0.5] = "StatsToggleOffThreshold";
    })(StatsConstants || (StatsConstants = {}));
    /**
     * Codes that should be omitted from sending to the prediction engine and instead omitted directly:
     * - Hide cursor (DECTCEM): We wrap the local echo sequence in hide and show
     *   CSI ? 2 5 l
     * - Show cursor (DECTCEM): We wrap the local echo sequence in hide and show
     *   CSI ? 2 5 h
     * - Device Status Report (DSR): These sequence fire report events from xterm which could cause
     *   double reporting and potentially a stack overflow (#119472)
     *   CSI Ps n
     *   CSI ? Ps n
     */
    const PREDICTION_OMIT_RE = /^(\x1b\[(\??25[hl]|\??[0-9;]+n))+/;
    const core = (terminal) => terminal._core;
    const flushOutput = (terminal) => {
        // TODO: Flushing output is not possible anymore without async
    };
    var CursorMoveDirection;
    (function (CursorMoveDirection) {
        CursorMoveDirection["Back"] = "D";
        CursorMoveDirection["Forwards"] = "C";
    })(CursorMoveDirection || (CursorMoveDirection = {}));
    class Cursor {
        get x() {
            return this._x;
        }
        get y() {
            return this._y;
        }
        get baseY() {
            return this._baseY;
        }
        get coordinate() {
            return { x: this._x, y: this._y, baseY: this._baseY };
        }
        constructor(rows, cols, _buffer) {
            this.rows = rows;
            this.cols = cols;
            this._buffer = _buffer;
            this._x = 0;
            this._y = 1;
            this._baseY = 1;
            this._x = _buffer.cursorX;
            this._y = _buffer.cursorY;
            this._baseY = _buffer.baseY;
        }
        getLine() {
            return this._buffer.getLine(this._y + this._baseY);
        }
        getCell(loadInto) {
            return this.getLine()?.getCell(this._x, loadInto);
        }
        moveTo(coordinate) {
            this._x = coordinate.x;
            this._y = (coordinate.y + coordinate.baseY) - this._baseY;
            return this.moveInstruction();
        }
        clone() {
            const c = new Cursor(this.rows, this.cols, this._buffer);
            c.moveTo(this);
            return c;
        }
        move(x, y) {
            this._x = x;
            this._y = y;
            return this.moveInstruction();
        }
        shift(x = 0, y = 0) {
            this._x += x;
            this._y += y;
            return this.moveInstruction();
        }
        moveInstruction() {
            if (this._y >= this.rows) {
                this._baseY += this._y - (this.rows - 1);
                this._y = this.rows - 1;
            }
            else if (this._y < 0) {
                this._baseY -= this._y;
                this._y = 0;
            }
            return `${"\u001B[" /* VT.Csi */}${this._y + 1};${this._x + 1}H`;
        }
    }
    const moveToWordBoundary = (b, cursor, direction) => {
        let ateLeadingWhitespace = false;
        if (direction < 0) {
            cursor.shift(-1);
        }
        let cell;
        while (cursor.x >= 0) {
            cell = cursor.getCell(cell);
            if (!cell?.getCode()) {
                return;
            }
            const chars = cell.getChars();
            if (NOT_WORD_RE.test(chars)) {
                if (ateLeadingWhitespace) {
                    break;
                }
            }
            else {
                ateLeadingWhitespace = true;
            }
            cursor.shift(direction);
        }
        if (direction < 0) {
            cursor.shift(1); // we want to place the cursor after the whitespace starting the word
        }
    };
    var MatchResult;
    (function (MatchResult) {
        /** matched successfully */
        MatchResult[MatchResult["Success"] = 0] = "Success";
        /** failed to match */
        MatchResult[MatchResult["Failure"] = 1] = "Failure";
        /** buffer data, it might match in the future one more data comes in */
        MatchResult[MatchResult["Buffer"] = 2] = "Buffer";
    })(MatchResult || (MatchResult = {}));
    class StringReader {
        get remaining() {
            return this._input.length - this.index;
        }
        get eof() {
            return this.index === this._input.length;
        }
        get rest() {
            return this._input.slice(this.index);
        }
        constructor(_input) {
            this._input = _input;
            this.index = 0;
        }
        /**
         * Advances the reader and returns the character if it matches.
         */
        eatChar(char) {
            if (this._input[this.index] !== char) {
                return;
            }
            this.index++;
            return char;
        }
        /**
         * Advances the reader and returns the string if it matches.
         */
        eatStr(substr) {
            if (this._input.slice(this.index, substr.length) !== substr) {
                return;
            }
            this.index += substr.length;
            return substr;
        }
        /**
         * Matches and eats the substring character-by-character. If EOF is reached
         * before the substring is consumed, it will buffer. Index is not moved
         * if it's not a match.
         */
        eatGradually(substr) {
            const prevIndex = this.index;
            for (let i = 0; i < substr.length; i++) {
                if (i > 0 && this.eof) {
                    return 2 /* MatchResult.Buffer */;
                }
                if (!this.eatChar(substr[i])) {
                    this.index = prevIndex;
                    return 1 /* MatchResult.Failure */;
                }
            }
            return 0 /* MatchResult.Success */;
        }
        /**
         * Advances the reader and returns the regex if it matches.
         */
        eatRe(re) {
            const match = re.exec(this._input.slice(this.index));
            if (!match) {
                return;
            }
            this.index += match[0].length;
            return match;
        }
        /**
         * Advances the reader and returns the character if the code matches.
         */
        eatCharCode(min = 0, max = min + 1) {
            const code = this._input.charCodeAt(this.index);
            if (code < min || code >= max) {
                return undefined;
            }
            this.index++;
            return code;
        }
    }
    /**
     * Preidction which never tests true. Will always discard predictions made
     * after it.
     */
    class HardBoundary {
        constructor() {
            this.clearAfterTimeout = false;
        }
        apply() {
            return '';
        }
        rollback() {
            return '';
        }
        rollForwards() {
            return '';
        }
        matches() {
            return 1 /* MatchResult.Failure */;
        }
    }
    /**
     * Wraps another prediction. Does not apply the prediction, but will pass
     * through its `matches` request.
     */
    class TentativeBoundary {
        constructor(inner) {
            this.inner = inner;
        }
        apply(buffer, cursor) {
            this._appliedCursor = cursor.clone();
            this.inner.apply(buffer, this._appliedCursor);
            return '';
        }
        rollback(cursor) {
            this.inner.rollback(cursor.clone());
            return '';
        }
        rollForwards(cursor, withInput) {
            if (this._appliedCursor) {
                cursor.moveTo(this._appliedCursor);
            }
            return withInput;
        }
        matches(input) {
            return this.inner.matches(input);
        }
    }
    const isTenativeCharacterPrediction = (p) => p instanceof TentativeBoundary && p.inner instanceof CharacterPrediction;
    /**
     * Prediction for a single alphanumeric character.
     */
    class CharacterPrediction {
        constructor(_style, _char) {
            this._style = _style;
            this._char = _char;
            this.affectsStyle = true;
        }
        apply(_, cursor) {
            const cell = cursor.getCell();
            this.appliedAt = cell
                ? { pos: cursor.coordinate, oldAttributes: attributesToSeq(cell), oldChar: cell.getChars() }
                : { pos: cursor.coordinate, oldAttributes: '', oldChar: '' };
            cursor.shift(1);
            return this._style.apply + this._char + this._style.undo;
        }
        rollback(cursor) {
            if (!this.appliedAt) {
                return ''; // not applied
            }
            const { oldAttributes, oldChar, pos } = this.appliedAt;
            const r = cursor.moveTo(pos) + (oldChar ? `${oldAttributes}${oldChar}${cursor.moveTo(pos)}` : "\u001B[X" /* VT.DeleteChar */);
            return r;
        }
        rollForwards(cursor, input) {
            if (!this.appliedAt) {
                return ''; // not applied
            }
            return cursor.clone().moveTo(this.appliedAt.pos) + input;
        }
        matches(input, lookBehind) {
            const startIndex = input.index;
            // remove any styling CSI before checking the char
            while (input.eatRe(CSI_STYLE_RE)) { }
            if (input.eof) {
                return 2 /* MatchResult.Buffer */;
            }
            if (input.eatChar(this._char)) {
                return 0 /* MatchResult.Success */;
            }
            if (lookBehind instanceof CharacterPrediction) {
                // see #112842
                const sillyZshOutcome = input.eatGradually(`\b${lookBehind._char}${this._char}`);
                if (sillyZshOutcome !== 1 /* MatchResult.Failure */) {
                    return sillyZshOutcome;
                }
            }
            input.index = startIndex;
            return 1 /* MatchResult.Failure */;
        }
    }
    class BackspacePrediction {
        constructor(_terminal) {
            this._terminal = _terminal;
        }
        apply(_, cursor) {
            // at eol if everything to the right is whitespace (zsh will emit a "clear line" code in this case)
            // todo: can be optimized if `getTrimmedLength` is exposed from xterm
            const isLastChar = !cursor.getLine()?.translateToString(undefined, cursor.x).trim();
            const pos = cursor.coordinate;
            const move = cursor.shift(-1);
            const cell = cursor.getCell();
            this._appliedAt = cell
                ? { isLastChar, pos, oldAttributes: attributesToSeq(cell), oldChar: cell.getChars() }
                : { isLastChar, pos, oldAttributes: '', oldChar: '' };
            return move + "\u001B[X" /* VT.DeleteChar */;
        }
        rollback(cursor) {
            if (!this._appliedAt) {
                return ''; // not applied
            }
            const { oldAttributes, oldChar, pos } = this._appliedAt;
            if (!oldChar) {
                return cursor.moveTo(pos) + "\u001B[X" /* VT.DeleteChar */;
            }
            return oldAttributes + oldChar + cursor.moveTo(pos) + attributesToSeq(core(this._terminal)._inputHandler._curAttrData);
        }
        rollForwards() {
            return '';
        }
        matches(input) {
            if (this._appliedAt?.isLastChar) {
                const r1 = input.eatGradually(`\b${"\u001B[" /* VT.Csi */}K`);
                if (r1 !== 1 /* MatchResult.Failure */) {
                    return r1;
                }
                const r2 = input.eatGradually(`\b \b`);
                if (r2 !== 1 /* MatchResult.Failure */) {
                    return r2;
                }
            }
            return 1 /* MatchResult.Failure */;
        }
    }
    class NewlinePrediction {
        apply(_, cursor) {
            this._prevPosition = cursor.coordinate;
            cursor.move(0, cursor.y + 1);
            return '\r\n';
        }
        rollback(cursor) {
            return this._prevPosition ? cursor.moveTo(this._prevPosition) : '';
        }
        rollForwards() {
            return ''; // does not need to rewrite
        }
        matches(input) {
            return input.eatGradually('\r\n');
        }
    }
    /**
     * Prediction when the cursor reaches the end of the line. Similar to newline
     * prediction, but shells handle it slightly differently.
     */
    class LinewrapPrediction extends NewlinePrediction {
        apply(_, cursor) {
            this._prevPosition = cursor.coordinate;
            cursor.move(0, cursor.y + 1);
            return ' \r';
        }
        matches(input) {
            // bash and zshell add a space which wraps in the terminal, then a CR
            const r = input.eatGradually(' \r');
            if (r !== 1 /* MatchResult.Failure */) {
                // zshell additionally adds a clear line after wrapping to be safe -- eat it
                const r2 = input.eatGradually("\u001B[K" /* VT.DeleteRestOfLine */);
                return r2 === 2 /* MatchResult.Buffer */ ? 2 /* MatchResult.Buffer */ : r;
            }
            return input.eatGradually('\r\n');
        }
    }
    class CursorMovePrediction {
        constructor(_direction, _moveByWords, _amount) {
            this._direction = _direction;
            this._moveByWords = _moveByWords;
            this._amount = _amount;
        }
        apply(buffer, cursor) {
            const prevPosition = cursor.x;
            const currentCell = cursor.getCell();
            const prevAttrs = currentCell ? attributesToSeq(currentCell) : '';
            const { _amount: amount, _direction: direction, _moveByWords: moveByWords } = this;
            const delta = direction === "D" /* CursorMoveDirection.Back */ ? -1 : 1;
            const target = cursor.clone();
            if (moveByWords) {
                for (let i = 0; i < amount; i++) {
                    moveToWordBoundary(buffer, target, delta);
                }
            }
            else {
                target.shift(delta * amount);
            }
            this._applied = {
                amount: Math.abs(cursor.x - target.x),
                prevPosition,
                prevAttrs,
                rollForward: cursor.moveTo(target),
            };
            return this._applied.rollForward;
        }
        rollback(cursor) {
            if (!this._applied) {
                return '';
            }
            return cursor.move(this._applied.prevPosition, cursor.y) + this._applied.prevAttrs;
        }
        rollForwards() {
            return ''; // does not need to rewrite
        }
        matches(input) {
            if (!this._applied) {
                return 1 /* MatchResult.Failure */;
            }
            const direction = this._direction;
            const { amount, rollForward } = this._applied;
            // arg can be omitted to move one character. We don't eatGradually() here
            // or below moves that don't go as far as the cursor would be buffered
            // indefinitely
            if (input.eatStr(`${"\u001B[" /* VT.Csi */}${direction}`.repeat(amount))) {
                return 0 /* MatchResult.Success */;
            }
            // \b is the equivalent to moving one character back
            if (direction === "D" /* CursorMoveDirection.Back */) {
                if (input.eatStr(`\b`.repeat(amount))) {
                    return 0 /* MatchResult.Success */;
                }
            }
            // check if the cursor position is set absolutely
            if (rollForward) {
                const r = input.eatGradually(rollForward);
                if (r !== 1 /* MatchResult.Failure */) {
                    return r;
                }
            }
            // check for a relative move in the direction
            return input.eatGradually(`${"\u001B[" /* VT.Csi */}${amount}${direction}`);
        }
    }
    class PredictionStats extends lifecycle_1.Disposable {
        /**
         * Gets the percent (0-1) of predictions that were accurate.
         */
        get accuracy() {
            let correctCount = 0;
            for (const [, correct] of this._stats) {
                if (correct) {
                    correctCount++;
                }
            }
            return correctCount / (this._stats.length || 1);
        }
        /**
         * Gets the number of recorded stats.
         */
        get sampleSize() {
            return this._stats.length;
        }
        /**
         * Gets latency stats of successful predictions.
         */
        get latency() {
            const latencies = this._stats.filter(([, correct]) => correct).map(([s]) => s).sort();
            return {
                count: latencies.length,
                min: latencies[0],
                median: latencies[Math.floor(latencies.length / 2)],
                max: latencies[latencies.length - 1],
            };
        }
        /**
         * Gets the maximum observed latency.
         */
        get maxLatency() {
            let max = -Infinity;
            for (const [latency, correct] of this._stats) {
                if (correct) {
                    max = Math.max(latency, max);
                }
            }
            return max;
        }
        constructor(timeline) {
            super();
            this._stats = [];
            this._index = 0;
            this._addedAtTime = new WeakMap();
            this._changeEmitter = new event_1.Emitter();
            this.onChange = this._changeEmitter.event;
            this._register(timeline.onPredictionAdded(p => this._addedAtTime.set(p, Date.now())));
            this._register(timeline.onPredictionSucceeded(this._pushStat.bind(this, true)));
            this._register(timeline.onPredictionFailed(this._pushStat.bind(this, false)));
        }
        _pushStat(correct, prediction) {
            const started = this._addedAtTime.get(prediction);
            this._stats[this._index] = [Date.now() - started, correct];
            this._index = (this._index + 1) % 24 /* StatsConstants.StatsBufferSize */;
            this._changeEmitter.fire();
        }
    }
    exports.PredictionStats = PredictionStats;
    class PredictionTimeline {
        get _currentGenerationPredictions() {
            return this._expected.filter(({ gen }) => gen === this._expected[0].gen).map(({ p }) => p);
        }
        get isShowingPredictions() {
            return this._showPredictions;
        }
        get length() {
            return this._expected.length;
        }
        constructor(terminal, _style) {
            this.terminal = terminal;
            this._style = _style;
            /**
             * Expected queue of events. Only predictions for the lowest are
             * written into the terminal.
             */
            this._expected = [];
            /**
             * Current prediction generation.
             */
            this._currentGen = 0;
            /**
             * Whether predictions are echoed to the terminal. If false, predictions
             * will still be computed internally for latency metrics, but input will
             * never be adjusted.
             */
            this._showPredictions = false;
            this._addedEmitter = new event_1.Emitter();
            this.onPredictionAdded = this._addedEmitter.event;
            this._failedEmitter = new event_1.Emitter();
            this.onPredictionFailed = this._failedEmitter.event;
            this._succeededEmitter = new event_1.Emitter();
            this.onPredictionSucceeded = this._succeededEmitter.event;
        }
        setShowPredictions(show) {
            if (show === this._showPredictions) {
                return;
            }
            // console.log('set predictions:', show);
            this._showPredictions = show;
            const buffer = this._getActiveBuffer();
            if (!buffer) {
                return;
            }
            const toApply = this._currentGenerationPredictions;
            if (show) {
                this.clearCursor();
                this._style.expectIncomingStyle(toApply.reduce((count, p) => p.affectsStyle ? count + 1 : count, 0));
                this.terminal.write(toApply.map(p => p.apply(buffer, this.physicalCursor(buffer))).join(''));
            }
            else {
                this.terminal.write(toApply.reverse().map(p => p.rollback(this.physicalCursor(buffer))).join(''));
            }
        }
        /**
         * Undoes any predictions written and resets expectations.
         */
        undoAllPredictions() {
            const buffer = this._getActiveBuffer();
            if (this._showPredictions && buffer) {
                this.terminal.write(this._currentGenerationPredictions.reverse()
                    .map(p => p.rollback(this.physicalCursor(buffer))).join(''));
            }
            this._expected = [];
        }
        /**
         * Should be called when input is incoming to the temrinal.
         */
        beforeServerInput(input) {
            const originalInput = input;
            if (this._inputBuffer) {
                input = this._inputBuffer + input;
                this._inputBuffer = undefined;
            }
            if (!this._expected.length) {
                this._clearPredictionState();
                return input;
            }
            const buffer = this._getActiveBuffer();
            if (!buffer) {
                this._clearPredictionState();
                return input;
            }
            let output = '';
            const reader = new StringReader(input);
            const startingGen = this._expected[0].gen;
            const emitPredictionOmitted = () => {
                const omit = reader.eatRe(PREDICTION_OMIT_RE);
                if (omit) {
                    output += omit[0];
                }
            };
            ReadLoop: while (this._expected.length && reader.remaining > 0) {
                emitPredictionOmitted();
                const { p: prediction, gen } = this._expected[0];
                const cursor = this.physicalCursor(buffer);
                const beforeTestReaderIndex = reader.index;
                switch (prediction.matches(reader, this._lookBehind)) {
                    case 0 /* MatchResult.Success */: {
                        // if the input character matches what the next prediction expected, undo
                        // the prediction and write the real character out.
                        const eaten = input.slice(beforeTestReaderIndex, reader.index);
                        if (gen === startingGen) {
                            output += prediction.rollForwards?.(cursor, eaten);
                        }
                        else {
                            prediction.apply(buffer, this.physicalCursor(buffer)); // move cursor for additional apply
                            output += eaten;
                        }
                        this._succeededEmitter.fire(prediction);
                        this._lookBehind = prediction;
                        this._expected.shift();
                        break;
                    }
                    case 2 /* MatchResult.Buffer */:
                        // on a buffer, store the remaining data and completely read data
                        // to be output as normal.
                        this._inputBuffer = input.slice(beforeTestReaderIndex);
                        reader.index = input.length;
                        break ReadLoop;
                    case 1 /* MatchResult.Failure */: {
                        // on a failure, roll back all remaining items in this generation
                        // and clear predictions, since they are no longer valid
                        const rollback = this._expected.filter(p => p.gen === startingGen).reverse();
                        output += rollback.map(({ p }) => p.rollback(this.physicalCursor(buffer))).join('');
                        if (rollback.some(r => r.p.affectsStyle)) {
                            // reading the current style should generally be safe, since predictions
                            // always restore the style if they modify it.
                            output += attributesToSeq(core(this.terminal)._inputHandler._curAttrData);
                        }
                        this._clearPredictionState();
                        this._failedEmitter.fire(prediction);
                        break ReadLoop;
                    }
                }
            }
            emitPredictionOmitted();
            // Extra data (like the result of running a command) should cause us to
            // reset the cursor
            if (!reader.eof) {
                output += reader.rest;
                this._clearPredictionState();
            }
            // If we passed a generation boundary, apply the current generation's predictions
            if (this._expected.length && startingGen !== this._expected[0].gen) {
                for (const { p, gen } of this._expected) {
                    if (gen !== this._expected[0].gen) {
                        break;
                    }
                    if (p.affectsStyle) {
                        this._style.expectIncomingStyle();
                    }
                    output += p.apply(buffer, this.physicalCursor(buffer));
                }
            }
            if (!this._showPredictions) {
                return originalInput;
            }
            if (output.length === 0 || output === input) {
                return output;
            }
            if (this._physicalCursor) {
                output += this._physicalCursor.moveInstruction();
            }
            // prevent cursor flickering while typing
            output = "\u001B[?25l" /* VT.HideCursor */ + output + "\u001B[?25h" /* VT.ShowCursor */;
            return output;
        }
        /**
         * Clears any expected predictions and stored state. Should be called when
         * the pty gives us something we don't recognize.
         */
        _clearPredictionState() {
            this._expected = [];
            this.clearCursor();
            this._lookBehind = undefined;
        }
        /**
         * Appends a typeahead prediction.
         */
        addPrediction(buffer, prediction) {
            this._expected.push({ gen: this._currentGen, p: prediction });
            this._addedEmitter.fire(prediction);
            if (this._currentGen !== this._expected[0].gen) {
                prediction.apply(buffer, this.tentativeCursor(buffer));
                return false;
            }
            const text = prediction.apply(buffer, this.physicalCursor(buffer));
            this._tenativeCursor = undefined; // next read will get or clone the physical cursor
            if (this._showPredictions && text) {
                if (prediction.affectsStyle) {
                    this._style.expectIncomingStyle();
                }
                // console.log('predict:', JSON.stringify(text));
                this.terminal.write(text);
            }
            return true;
        }
        addBoundary(buffer, prediction) {
            let applied = false;
            if (buffer && prediction) {
                // We apply the prediction so that it's matched against, but wrapped
                // in a tentativeboundary so that it doesn't affect the physical cursor.
                // Then we apply it specifically to the tentative cursor.
                applied = this.addPrediction(buffer, new TentativeBoundary(prediction));
                prediction.apply(buffer, this.tentativeCursor(buffer));
            }
            this._currentGen++;
            return applied;
        }
        /**
         * Peeks the last prediction written.
         */
        peekEnd() {
            return this._expected[this._expected.length - 1]?.p;
        }
        /**
         * Peeks the first pending prediction.
         */
        peekStart() {
            return this._expected[0]?.p;
        }
        /**
         * Current position of the cursor in the terminal.
         */
        physicalCursor(buffer) {
            if (!this._physicalCursor) {
                if (this._showPredictions) {
                    flushOutput(this.terminal);
                }
                this._physicalCursor = new Cursor(this.terminal.rows, this.terminal.cols, buffer);
            }
            return this._physicalCursor;
        }
        /**
         * Cursor position if all predictions and boundaries that have been inserted
         * so far turn out to be successfully predicted.
         */
        tentativeCursor(buffer) {
            if (!this._tenativeCursor) {
                this._tenativeCursor = this.physicalCursor(buffer).clone();
            }
            return this._tenativeCursor;
        }
        clearCursor() {
            this._physicalCursor = undefined;
            this._tenativeCursor = undefined;
        }
        _getActiveBuffer() {
            const buffer = this.terminal.buffer.active;
            return buffer.type === 'normal' ? buffer : undefined;
        }
    }
    exports.PredictionTimeline = PredictionTimeline;
    /**
     * Gets the escape sequence args to restore state/appearance in the cell.
     */
    const attributesToArgs = (cell) => {
        if (cell.isAttributeDefault()) {
            return [0];
        }
        const args = [];
        if (cell.isBold()) {
            args.push(1);
        }
        if (cell.isDim()) {
            args.push(2);
        }
        if (cell.isItalic()) {
            args.push(3);
        }
        if (cell.isUnderline()) {
            args.push(4);
        }
        if (cell.isBlink()) {
            args.push(5);
        }
        if (cell.isInverse()) {
            args.push(7);
        }
        if (cell.isInvisible()) {
            args.push(8);
        }
        if (cell.isFgRGB()) {
            args.push(38, 2, cell.getFgColor() >>> 24, (cell.getFgColor() >>> 16) & 0xFF, cell.getFgColor() & 0xFF);
        }
        if (cell.isFgPalette()) {
            args.push(38, 5, cell.getFgColor());
        }
        if (cell.isFgDefault()) {
            args.push(39);
        }
        if (cell.isBgRGB()) {
            args.push(48, 2, cell.getBgColor() >>> 24, (cell.getBgColor() >>> 16) & 0xFF, cell.getBgColor() & 0xFF);
        }
        if (cell.isBgPalette()) {
            args.push(48, 5, cell.getBgColor());
        }
        if (cell.isBgDefault()) {
            args.push(49);
        }
        return args;
    };
    /**
     * Gets the escape sequence to restore state/appearance in the cell.
     */
    const attributesToSeq = (cell) => `${"\u001B[" /* VT.Csi */}${attributesToArgs(cell).join(';')}m`;
    const arrayHasPrefixAt = (a, ai, b) => {
        if (a.length - ai > b.length) {
            return false;
        }
        for (let bi = 0; bi < b.length; bi++, ai++) {
            if (b[ai] !== a[ai]) {
                return false;
            }
        }
        return true;
    };
    /**
     * @see https://github.com/xtermjs/xterm.js/blob/065eb13a9d3145bea687239680ec9696d9112b8e/src/common/InputHandler.ts#L2127
     */
    const getColorWidth = (params, pos) => {
        const accu = [0, 0, -1, 0, 0, 0];
        let cSpace = 0;
        let advance = 0;
        do {
            const v = params[pos + advance];
            accu[advance + cSpace] = typeof v === 'number' ? v : v[0];
            if (typeof v !== 'number') {
                let i = 0;
                do {
                    if (accu[1] === 5) {
                        cSpace = 1;
                    }
                    accu[advance + i + 1 + cSpace] = v[i];
                } while (++i < v.length && i + advance + 1 + cSpace < accu.length);
                break;
            }
            // exit early if can decide color mode with semicolons
            if ((accu[1] === 5 && advance + cSpace >= 2)
                || (accu[1] === 2 && advance + cSpace >= 5)) {
                break;
            }
            // offset colorSpace slot for semicolon mode
            if (accu[1]) {
                cSpace = 1;
            }
        } while (++advance + pos < params.length && advance + cSpace < accu.length);
        return advance;
    };
    class TypeAheadStyle {
        static _compileArgs(args) {
            return `${"\u001B[" /* VT.Csi */}${args.join(';')}m`;
        }
        constructor(value, _terminal) {
            this._terminal = _terminal;
            /**
             * Number of typeahead style arguments we expect to read. If this is 0 and
             * we see a style coming in, we know that the PTY actually wanted to update.
             */
            this._expectedIncomingStyles = 0;
            this.onUpdate(value);
        }
        /**
         * Signals that a style was written to the terminal and we should watch
         * for it coming in.
         */
        expectIncomingStyle(n = 1) {
            this._expectedIncomingStyles += n * 2;
        }
        /**
         * Starts tracking for CSI changes in the terminal.
         */
        startTracking() {
            this._expectedIncomingStyles = 0;
            this._onDidWriteSGR(attributesToArgs(core(this._terminal)._inputHandler._curAttrData));
            this._csiHandler = this._terminal.parser.registerCsiHandler({ final: 'm' }, args => {
                this._onDidWriteSGR(args);
                return false;
            });
        }
        /**
         * Stops tracking terminal CSI changes.
         */
        debounceStopTracking() {
            this._stopTracking();
        }
        /**
         * @inheritdoc
         */
        dispose() {
            this._stopTracking();
        }
        _stopTracking() {
            this._csiHandler?.dispose();
            this._csiHandler = undefined;
        }
        _onDidWriteSGR(args) {
            const originalUndo = this._undoArgs;
            for (let i = 0; i < args.length;) {
                const px = args[i];
                const p = typeof px === 'number' ? px : px[0];
                if (this._expectedIncomingStyles) {
                    if (arrayHasPrefixAt(args, i, this._undoArgs)) {
                        this._expectedIncomingStyles--;
                        i += this._undoArgs.length;
                        continue;
                    }
                    if (arrayHasPrefixAt(args, i, this._applyArgs)) {
                        this._expectedIncomingStyles--;
                        i += this._applyArgs.length;
                        continue;
                    }
                }
                const width = p === 38 || p === 48 || p === 58 ? getColorWidth(args, i) : 1;
                switch (this._applyArgs[0]) {
                    case 1:
                        if (p === 2) {
                            this._undoArgs = [22, 2];
                        }
                        else if (p === 22 || p === 0) {
                            this._undoArgs = [22];
                        }
                        break;
                    case 2:
                        if (p === 1) {
                            this._undoArgs = [22, 1];
                        }
                        else if (p === 22 || p === 0) {
                            this._undoArgs = [22];
                        }
                        break;
                    case 38:
                        if (p === 0 || p === 39 || p === 100) {
                            this._undoArgs = [39];
                        }
                        else if ((p >= 30 && p <= 38) || (p >= 90 && p <= 97)) {
                            this._undoArgs = args.slice(i, i + width);
                        }
                        break;
                    default:
                        if (p === this._applyArgs[0]) {
                            this._undoArgs = this._applyArgs;
                        }
                        else if (p === 0) {
                            this._undoArgs = this._originalUndoArgs;
                        }
                    // no-op
                }
                i += width;
            }
            if (originalUndo !== this._undoArgs) {
                this.undo = TypeAheadStyle._compileArgs(this._undoArgs);
            }
        }
        /**
         * Updates the current typeahead style.
         */
        onUpdate(style) {
            const { applyArgs, undoArgs } = this._getArgs(style);
            this._applyArgs = applyArgs;
            this._undoArgs = this._originalUndoArgs = undoArgs;
            this.apply = TypeAheadStyle._compileArgs(this._applyArgs);
            this.undo = TypeAheadStyle._compileArgs(this._undoArgs);
        }
        _getArgs(style) {
            switch (style) {
                case 'bold':
                    return { applyArgs: [1], undoArgs: [22] };
                case 'dim':
                    return { applyArgs: [2], undoArgs: [22] };
                case 'italic':
                    return { applyArgs: [3], undoArgs: [23] };
                case 'underlined':
                    return { applyArgs: [4], undoArgs: [24] };
                case 'inverted':
                    return { applyArgs: [7], undoArgs: [27] };
                default: {
                    let color;
                    try {
                        color = color_1.Color.fromHex(style);
                    }
                    catch {
                        color = new color_1.Color(new color_1.RGBA(255, 0, 0, 1));
                    }
                    const { r, g, b } = color.rgba;
                    return { applyArgs: [38, 2, r, g, b], undoArgs: [39] };
                }
            }
        }
    }
    __decorate([
        (0, decorators_1.debounce)(2000)
    ], TypeAheadStyle.prototype, "debounceStopTracking", null);
    const compileExcludeRegexp = (programs = terminal_1.DEFAULT_LOCAL_ECHO_EXCLUDE) => new RegExp(`\\b(${programs.map(strings_1.escapeRegExpCharacters).join('|')})\\b`, 'i');
    var CharPredictState;
    (function (CharPredictState) {
        /** No characters typed on this line yet */
        CharPredictState[CharPredictState["Unknown"] = 0] = "Unknown";
        /** Has a pending character prediction */
        CharPredictState[CharPredictState["HasPendingChar"] = 1] = "HasPendingChar";
        /** Character validated on this line */
        CharPredictState[CharPredictState["Validated"] = 2] = "Validated";
    })(CharPredictState || (exports.CharPredictState = CharPredictState = {}));
    let TypeAheadAddon = class TypeAheadAddon extends lifecycle_1.Disposable {
        constructor(_processManager, _configurationService, _telemetryService) {
            super();
            this._processManager = _processManager;
            this._configurationService = _configurationService;
            this._telemetryService = _telemetryService;
            this._typeaheadThreshold = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).localEchoLatencyThreshold;
            this._excludeProgramRe = compileExcludeRegexp(this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).localEchoExcludePrograms);
            this._terminalTitle = '';
            this._register((0, lifecycle_1.toDisposable)(() => this._clearPredictionDebounce?.dispose()));
        }
        activate(terminal) {
            const style = this._typeaheadStyle = this._register(new TypeAheadStyle(this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).localEchoStyle, terminal));
            const timeline = this._timeline = new PredictionTimeline(terminal, this._typeaheadStyle);
            const stats = this.stats = this._register(new PredictionStats(this._timeline));
            timeline.setShowPredictions(this._typeaheadThreshold === 0);
            this._register(terminal.onData(e => this._onUserData(e)));
            this._register(terminal.onTitleChange(title => {
                this._terminalTitle = title;
                this._reevaluatePredictorState(stats, timeline);
            }));
            this._register(terminal.onResize(() => {
                timeline.setShowPredictions(false);
                timeline.clearCursor();
                this._reevaluatePredictorState(stats, timeline);
            }));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(terminal_1.TERMINAL_CONFIG_SECTION)) {
                    style.onUpdate(this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).localEchoStyle);
                    this._typeaheadThreshold = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).localEchoLatencyThreshold;
                    this._excludeProgramRe = compileExcludeRegexp(this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).localEchoExcludePrograms);
                    this._reevaluatePredictorState(stats, timeline);
                }
            }));
            this._register(this._timeline.onPredictionSucceeded(p => {
                if (this._lastRow?.charState === 1 /* CharPredictState.HasPendingChar */ && isTenativeCharacterPrediction(p) && p.inner.appliedAt) {
                    if (p.inner.appliedAt.pos.y + p.inner.appliedAt.pos.baseY === this._lastRow.y) {
                        this._lastRow.charState = 2 /* CharPredictState.Validated */;
                    }
                }
            }));
            this._register(this._processManager.onBeforeProcessData(e => this._onBeforeProcessData(e)));
            let nextStatsSend;
            this._register(stats.onChange(() => {
                if (!nextStatsSend) {
                    nextStatsSend = setTimeout(() => {
                        this._sendLatencyStats(stats);
                        nextStatsSend = undefined;
                    }, 300000 /* StatsConstants.StatsSendTelemetryEvery */);
                }
                if (timeline.length === 0) {
                    style.debounceStopTracking();
                }
                this._reevaluatePredictorState(stats, timeline);
            }));
        }
        reset() {
            this._lastRow = undefined;
        }
        _deferClearingPredictions() {
            if (!this.stats || !this._timeline) {
                return;
            }
            this._clearPredictionDebounce?.dispose();
            if (this._timeline.length === 0 || this._timeline.peekStart()?.clearAfterTimeout === false) {
                this._clearPredictionDebounce = undefined;
                return;
            }
            this._clearPredictionDebounce = (0, async_1.disposableTimeout)(() => {
                this._timeline?.undoAllPredictions();
                if (this._lastRow?.charState === 1 /* CharPredictState.HasPendingChar */) {
                    this._lastRow.charState = 0 /* CharPredictState.Unknown */;
                }
            }, Math.max(500, this.stats.maxLatency * 3 / 2), this._store);
        }
        /**
         * Note on debounce:
         *
         * We want to toggle the state only when the user has a pause in their
         * typing. Otherwise, we could turn this on when the PTY sent data but the
         * terminal cursor is not updated, causes issues.
         */
        _reevaluatePredictorState(stats, timeline) {
            this._reevaluatePredictorStateNow(stats, timeline);
        }
        _reevaluatePredictorStateNow(stats, timeline) {
            if (this._excludeProgramRe.test(this._terminalTitle)) {
                timeline.setShowPredictions(false);
            }
            else if (this._typeaheadThreshold < 0) {
                timeline.setShowPredictions(false);
            }
            else if (this._typeaheadThreshold === 0) {
                timeline.setShowPredictions(true);
            }
            else if (stats.sampleSize > 5 /* StatsConstants.StatsMinSamplesToTurnOn */ && stats.accuracy > 0.3 /* StatsConstants.StatsMinAccuracyToTurnOn */) {
                const latency = stats.latency.median;
                if (latency >= this._typeaheadThreshold) {
                    timeline.setShowPredictions(true);
                }
                else if (latency < this._typeaheadThreshold / 0.5 /* StatsConstants.StatsToggleOffThreshold */) {
                    timeline.setShowPredictions(false);
                }
            }
        }
        _sendLatencyStats(stats) {
            /* __GDPR__
                "terminalLatencyStats" : {
                    "owner": "Tyriar",
                    "min" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "max" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "median" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "count" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "predictionAccuracy" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
                }
             */
            this._telemetryService.publicLog('terminalLatencyStats', {
                ...stats.latency,
                predictionAccuracy: stats.accuracy,
            });
        }
        _onUserData(data) {
            if (this._timeline?.terminal.buffer.active.type !== 'normal') {
                return;
            }
            // console.log('user data:', JSON.stringify(data));
            const terminal = this._timeline.terminal;
            const buffer = terminal.buffer.active;
            // Detect programs like git log/less that use the normal buffer but don't
            // take input by deafult (fixes #109541)
            if (buffer.cursorX === 1 && buffer.cursorY === terminal.rows - 1) {
                if (buffer.getLine(buffer.cursorY + buffer.baseY)?.getCell(0)?.getChars() === ':') {
                    return;
                }
            }
            // the following code guards the terminal prompt to avoid being able to
            // arrow or backspace-into the prompt. Record the lowest X value at which
            // the user gave input, and mark all additions before that as tentative.
            const actualY = buffer.baseY + buffer.cursorY;
            if (actualY !== this._lastRow?.y) {
                this._lastRow = { y: actualY, startingX: buffer.cursorX, endingX: buffer.cursorX, charState: 0 /* CharPredictState.Unknown */ };
            }
            else {
                this._lastRow.startingX = Math.min(this._lastRow.startingX, buffer.cursorX);
                this._lastRow.endingX = Math.max(this._lastRow.endingX, this._timeline.physicalCursor(buffer).x);
            }
            const addLeftNavigating = (p) => this._timeline.tentativeCursor(buffer).x <= this._lastRow.startingX
                ? this._timeline.addBoundary(buffer, p)
                : this._timeline.addPrediction(buffer, p);
            const addRightNavigating = (p) => this._timeline.tentativeCursor(buffer).x >= this._lastRow.endingX - 1
                ? this._timeline.addBoundary(buffer, p)
                : this._timeline.addPrediction(buffer, p);
            /** @see https://github.com/xtermjs/xterm.js/blob/1913e9512c048e3cf56bb5f5df51bfff6899c184/src/common/input/Keyboard.ts */
            const reader = new StringReader(data);
            while (reader.remaining > 0) {
                if (reader.eatCharCode(127)) { // backspace
                    const previous = this._timeline.peekEnd();
                    if (previous && previous instanceof CharacterPrediction) {
                        this._timeline.addBoundary();
                    }
                    // backspace must be able to read the previously-written character in
                    // the event that it needs to undo it
                    if (this._timeline.isShowingPredictions) {
                        flushOutput(this._timeline.terminal);
                    }
                    if (this._timeline.tentativeCursor(buffer).x <= this._lastRow.startingX) {
                        this._timeline.addBoundary(buffer, new BackspacePrediction(this._timeline.terminal));
                    }
                    else {
                        // Backspace decrements our ability to go right.
                        this._lastRow.endingX--;
                        this._timeline.addPrediction(buffer, new BackspacePrediction(this._timeline.terminal));
                    }
                    continue;
                }
                if (reader.eatCharCode(32, 126)) { // alphanum
                    const char = data[reader.index - 1];
                    const prediction = new CharacterPrediction(this._typeaheadStyle, char);
                    if (this._lastRow.charState === 0 /* CharPredictState.Unknown */) {
                        this._timeline.addBoundary(buffer, prediction);
                        this._lastRow.charState = 1 /* CharPredictState.HasPendingChar */;
                    }
                    else {
                        this._timeline.addPrediction(buffer, prediction);
                    }
                    if (this._timeline.tentativeCursor(buffer).x >= terminal.cols) {
                        this._timeline.addBoundary(buffer, new LinewrapPrediction());
                    }
                    continue;
                }
                const cursorMv = reader.eatRe(CSI_MOVE_RE);
                if (cursorMv) {
                    const direction = cursorMv[3];
                    const p = new CursorMovePrediction(direction, !!cursorMv[2], Number(cursorMv[1]) || 1);
                    if (direction === "D" /* CursorMoveDirection.Back */) {
                        addLeftNavigating(p);
                    }
                    else {
                        addRightNavigating(p);
                    }
                    continue;
                }
                if (reader.eatStr(`${"\u001B" /* VT.Esc */}f`)) {
                    addRightNavigating(new CursorMovePrediction("C" /* CursorMoveDirection.Forwards */, true, 1));
                    continue;
                }
                if (reader.eatStr(`${"\u001B" /* VT.Esc */}b`)) {
                    addLeftNavigating(new CursorMovePrediction("D" /* CursorMoveDirection.Back */, true, 1));
                    continue;
                }
                if (reader.eatChar('\r') && buffer.cursorY < terminal.rows - 1) {
                    this._timeline.addPrediction(buffer, new NewlinePrediction());
                    continue;
                }
                // something else
                this._timeline.addBoundary(buffer, new HardBoundary());
                break;
            }
            if (this._timeline.length === 1) {
                this._deferClearingPredictions();
                this._typeaheadStyle.startTracking();
            }
        }
        _onBeforeProcessData(event) {
            if (!this._timeline) {
                return;
            }
            // console.log('incoming data:', JSON.stringify(event.data));
            event.data = this._timeline.beforeServerInput(event.data);
            // console.log('emitted data:', JSON.stringify(event.data));
            this._deferClearingPredictions();
        }
    };
    exports.TypeAheadAddon = TypeAheadAddon;
    __decorate([
        (0, decorators_1.debounce)(100)
    ], TypeAheadAddon.prototype, "_reevaluatePredictorState", null);
    exports.TypeAheadAddon = TypeAheadAddon = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, telemetry_1.ITelemetryService)
    ], TypeAheadAddon);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxUeXBlQWhlYWRBZGRvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL3R5cGVBaGVhZC9icm93c2VyL3Rlcm1pbmFsVHlwZUFoZWFkQWRkb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY2hHLElBQVcsRUFPVjtJQVBELFdBQVcsRUFBRTtRQUNaLG9CQUFZLENBQUE7UUFDWixxQkFBYSxDQUFBO1FBQ2IsZ0NBQXdCLENBQUE7UUFDeEIsZ0NBQXdCLENBQUE7UUFDeEIsNkJBQXFCLENBQUE7UUFDckIsbUNBQTJCLENBQUE7SUFDNUIsQ0FBQyxFQVBVLEVBQUUsS0FBRixFQUFFLFFBT1o7SUFFRCxNQUFNLFlBQVksR0FBRyxpQkFBaUIsQ0FBQztJQUN2QyxNQUFNLFdBQVcsR0FBRyxrQ0FBa0MsQ0FBQztJQUN2RCxNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUM7SUFFakMsSUFBVyxjQU1WO0lBTkQsV0FBVyxjQUFjO1FBQ3hCLDBFQUFvQixDQUFBO1FBQ3BCLDhGQUF1QyxDQUFBO1FBQ3ZDLHlGQUEyQixDQUFBO1FBQzNCLDZGQUE4QixDQUFBO1FBQzlCLDJGQUE2QixDQUFBO0lBQzlCLENBQUMsRUFOVSxjQUFjLEtBQWQsY0FBYyxRQU14QjtJQUVEOzs7Ozs7Ozs7O09BVUc7SUFDSCxNQUFNLGtCQUFrQixHQUFHLG1DQUFtQyxDQUFDO0lBRS9ELE1BQU0sSUFBSSxHQUFHLENBQUMsUUFBa0IsRUFBYyxFQUFFLENBQUUsUUFBZ0IsQ0FBQyxLQUFLLENBQUM7SUFDekUsTUFBTSxXQUFXLEdBQUcsQ0FBQyxRQUFrQixFQUFFLEVBQUU7UUFDMUMsOERBQThEO0lBQy9ELENBQUMsQ0FBQztJQUVGLElBQVcsbUJBR1Y7SUFI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SUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUFDLENBQUM7UUFDbkMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztZQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFBQyxDQUFDO1FBQ3RDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7WUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQztRQUN6QyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1lBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUFDLENBQUM7UUFDckMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQztZQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFBQyxDQUFDO1FBQ3ZDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7WUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQztRQUV6QyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO1lBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUFDLENBQUM7UUFDaEksSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztZQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUFDLENBQUM7UUFDaEUsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztZQUFDLElB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