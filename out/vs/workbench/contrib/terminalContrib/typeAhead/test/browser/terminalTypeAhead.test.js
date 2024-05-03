/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/base/common/event", "vs/workbench/contrib/terminalContrib/typeAhead/browser/terminalTypeAheadAddon", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/configuration/test/common/testConfigurationService", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, assert, sinon_1, event_1, terminalTypeAheadAddon_1, terminal_1, testConfigurationService_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CSI = `\x1b[`;
    var CursorMoveDirection;
    (function (CursorMoveDirection) {
        CursorMoveDirection["Back"] = "D";
        CursorMoveDirection["Forwards"] = "C";
    })(CursorMoveDirection || (CursorMoveDirection = {}));
    suite('Workbench - Terminal Typeahead', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('PredictionStats', () => {
            let stats;
            let add;
            let succeed;
            let fail;
            setup(() => {
                add = ds.add(new event_1.Emitter());
                succeed = ds.add(new event_1.Emitter());
                fail = ds.add(new event_1.Emitter());
                stats = ds.add(new terminalTypeAheadAddon_1.PredictionStats({
                    onPredictionAdded: add.event,
                    onPredictionSucceeded: succeed.event,
                    onPredictionFailed: fail.event,
                }));
            });
            test('creates sane data', () => {
                const stubs = createPredictionStubs(5);
                const clock = (0, sinon_1.useFakeTimers)();
                try {
                    for (const s of stubs) {
                        add.fire(s);
                    }
                    for (let i = 0; i < stubs.length; i++) {
                        clock.tick(100);
                        (i % 2 ? fail : succeed).fire(stubs[i]);
                    }
                    assert.strictEqual(stats.accuracy, 3 / 5);
                    assert.strictEqual(stats.sampleSize, 5);
                    assert.deepStrictEqual(stats.latency, {
                        count: 3,
                        min: 100,
                        max: 500,
                        median: 300
                    });
                }
                finally {
                    clock.restore();
                }
            });
            test('circular buffer', () => {
                const bufferSize = 24;
                const stubs = createPredictionStubs(bufferSize * 2);
                for (const s of stubs.slice(0, bufferSize)) {
                    add.fire(s);
                    succeed.fire(s);
                }
                assert.strictEqual(stats.accuracy, 1);
                for (const s of stubs.slice(bufferSize, bufferSize * 3 / 2)) {
                    add.fire(s);
                    fail.fire(s);
                }
                assert.strictEqual(stats.accuracy, 0.5);
                for (const s of stubs.slice(bufferSize * 3 / 2)) {
                    add.fire(s);
                    fail.fire(s);
                }
                assert.strictEqual(stats.accuracy, 0);
            });
        });
        suite('timeline', () => {
            let onBeforeProcessData;
            let publicLog;
            let config;
            let addon;
            const predictedHelloo = [
                `${CSI}?25l`, // hide cursor
                `${CSI}2;7H`, // move cursor
                'o', // new character
                `${CSI}2;8H`, // place cursor back at end of line
                `${CSI}?25h`, // show cursor
            ].join('');
            const expectProcessed = (input, output) => {
                const evt = { data: input };
                onBeforeProcessData.fire(evt);
                assert.strictEqual(JSON.stringify(evt.data), JSON.stringify(output));
            };
            setup(() => {
                onBeforeProcessData = ds.add(new event_1.Emitter());
                config = upcastPartial({
                    localEchoStyle: 'italic',
                    localEchoLatencyThreshold: 0,
                    localEchoExcludePrograms: terminal_1.DEFAULT_LOCAL_ECHO_EXCLUDE,
                });
                publicLog = (0, sinon_1.stub)();
                addon = new TestTypeAheadAddon(upcastPartial({ onBeforeProcessData: onBeforeProcessData.event }), new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: { ...config } } }), upcastPartial({ publicLog }));
                addon.unlockMakingPredictions();
            });
            teardown(() => {
                addon.dispose();
            });
            test('predicts a single character', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('o');
                t.expectWritten(`${CSI}3mo${CSI}23m`);
            });
            test('validates character prediction', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('o');
                expectProcessed('o', predictedHelloo);
                assert.strictEqual(addon.stats?.accuracy, 1);
            });
            test('validates zsh prediction (#112842)', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('o');
                expectProcessed('o', predictedHelloo);
                t.onData('x');
                expectProcessed('\box', [
                    `${CSI}?25l`, // hide cursor
                    `${CSI}2;8H`, // move cursor
                    '\box', // new data
                    `${CSI}2;9H`, // place cursor back at end of line
                    `${CSI}?25h`, // show cursor
                ].join(''));
                assert.strictEqual(addon.stats?.accuracy, 1);
            });
            test('does not validate zsh prediction on differing lookbehindn (#112842)', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('o');
                expectProcessed('o', predictedHelloo);
                t.onData('x');
                expectProcessed('\bqx', [
                    `${CSI}?25l`, // hide cursor
                    `${CSI}2;8H`, // move cursor cursor
                    `${CSI}X`, // delete character
                    `${CSI}0m`, // reset style
                    '\bqx', // new data
                    `${CSI}?25h`, // show cursor
                ].join(''));
                assert.strictEqual(addon.stats?.accuracy, 0.5);
            });
            test('rolls back character prediction', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('o');
                expectProcessed('q', [
                    `${CSI}?25l`, // hide cursor
                    `${CSI}2;7H`, // move cursor cursor
                    `${CSI}X`, // delete character
                    `${CSI}0m`, // reset style
                    'q', // new character
                    `${CSI}?25h`, // show cursor
                ].join(''));
                assert.strictEqual(addon.stats?.accuracy, 0);
            });
            test('handles left arrow when we hit the boundary', () => {
                const t = ds.add(createMockTerminal({ lines: ['|'] }));
                addon.activate(t.terminal);
                addon.unlockNavigating();
                const cursorXBefore = addon.physicalCursor(t.terminal.buffer.active)?.x;
                t.onData(`${CSI}${"D" /* CursorMoveDirection.Back */}`);
                t.expectWritten('');
                // Trigger rollback because we don't expect this data
                onBeforeProcessData.fire({ data: 'xy' });
                assert.strictEqual(addon.physicalCursor(t.terminal.buffer.active)?.x, 
                // The cursor should not have changed because we've hit the
                // boundary (start of prompt)
                cursorXBefore);
            });
            test('handles right arrow when we hit the boundary', () => {
                const t = ds.add(createMockTerminal({ lines: ['|'] }));
                addon.activate(t.terminal);
                addon.unlockNavigating();
                const cursorXBefore = addon.physicalCursor(t.terminal.buffer.active)?.x;
                t.onData(`${CSI}${"C" /* CursorMoveDirection.Forwards */}`);
                t.expectWritten('');
                // Trigger rollback because we don't expect this data
                onBeforeProcessData.fire({ data: 'xy' });
                assert.strictEqual(addon.physicalCursor(t.terminal.buffer.active)?.x, 
                // The cursor should not have changed because we've hit the
                // boundary (end of prompt)
                cursorXBefore);
            });
            test('internal cursor state is reset when all predictions are undone', () => {
                const t = ds.add(createMockTerminal({ lines: ['|'] }));
                addon.activate(t.terminal);
                addon.unlockNavigating();
                const cursorXBefore = addon.physicalCursor(t.terminal.buffer.active)?.x;
                t.onData(`${CSI}${"D" /* CursorMoveDirection.Back */}`);
                t.expectWritten('');
                addon.undoAllPredictions();
                assert.strictEqual(addon.physicalCursor(t.terminal.buffer.active)?.x, 
                // The cursor should not have changed because we've hit the
                // boundary (start of prompt)
                cursorXBefore);
            });
            test('restores cursor graphics mode', () => {
                const t = ds.add(createMockTerminal({
                    lines: ['hello|'],
                    cursorAttrs: { isAttributeDefault: false, isBold: true, isFgPalette: true, getFgColor: 1 },
                }));
                addon.activate(t.terminal);
                t.onData('o');
                expectProcessed('q', [
                    `${CSI}?25l`, // hide cursor
                    `${CSI}2;7H`, // move cursor cursor
                    `${CSI}X`, // delete character
                    `${CSI}1;38;5;1m`, // reset style
                    'q', // new character
                    `${CSI}?25h`, // show cursor
                ].join(''));
                assert.strictEqual(addon.stats?.accuracy, 0);
            });
            test('validates against and applies graphics mode on predicted', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('o');
                expectProcessed(`${CSI}4mo`, [
                    `${CSI}?25l`, // hide cursor
                    `${CSI}2;7H`, // move cursor
                    `${CSI}4m`, // new PTY's style
                    'o', // new character
                    `${CSI}2;8H`, // place cursor back at end of line
                    `${CSI}?25h`, // show cursor
                ].join(''));
                assert.strictEqual(addon.stats?.accuracy, 1);
            });
            test('ignores cursor hides or shows', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('o');
                expectProcessed(`${CSI}?25lo${CSI}?25h`, [
                    `${CSI}?25l`, // hide cursor from PTY
                    `${CSI}?25l`, // hide cursor
                    `${CSI}2;7H`, // move cursor
                    'o', // new character
                    `${CSI}?25h`, // show cursor from PTY
                    `${CSI}2;8H`, // place cursor back at end of line
                    `${CSI}?25h`, // show cursor
                ].join(''));
                assert.strictEqual(addon.stats?.accuracy, 1);
            });
            test('matches backspace at EOL (bash style)', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('\x7F');
                expectProcessed(`\b${CSI}K`, `\b${CSI}K`);
                assert.strictEqual(addon.stats?.accuracy, 1);
            });
            test('matches backspace at EOL (zsh style)', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('\x7F');
                expectProcessed('\b \b', '\b \b');
                assert.strictEqual(addon.stats?.accuracy, 1);
            });
            test('gradually matches backspace', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                t.onData('\x7F');
                expectProcessed('\b', '');
                expectProcessed(' \b', '\b \b');
                assert.strictEqual(addon.stats?.accuracy, 1);
            });
            test('restores old character after invalid backspace', () => {
                const t = ds.add(createMockTerminal({ lines: ['hel|lo'] }));
                addon.activate(t.terminal);
                addon.unlockNavigating();
                t.onData('\x7F');
                t.expectWritten(`${CSI}2;4H${CSI}X`);
                expectProcessed('x', `${CSI}?25l${CSI}0ml${CSI}2;5H${CSI}0mx${CSI}?25h`);
                assert.strictEqual(addon.stats?.accuracy, 0);
            });
            test('waits for validation before deleting to left of cursor', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                // initially should not backspace (until the server confirms it)
                t.onData('\x7F');
                t.expectWritten('');
                expectProcessed('\b \b', '\b \b');
                t.cursor.x--;
                // enter input on the column...
                t.onData('o');
                onBeforeProcessData.fire({ data: 'o' });
                t.cursor.x++;
                t.clearWritten();
                // now that the column is 'unlocked', we should be able to predict backspace on it
                t.onData('\x7F');
                t.expectWritten(`${CSI}2;6H${CSI}X`);
            });
            test('waits for first valid prediction on a line', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.lockMakingPredictions();
                addon.activate(t.terminal);
                t.onData('o');
                t.expectWritten('');
                expectProcessed('o', 'o');
                t.onData('o');
                t.expectWritten(`${CSI}3mo${CSI}23m`);
            });
            test('disables on title change', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.activate(t.terminal);
                addon.reevaluateNow();
                assert.strictEqual(addon.isShowing, true, 'expected to show initially');
                t.onTitleChange.fire('foo - VIM.exe');
                addon.reevaluateNow();
                assert.strictEqual(addon.isShowing, false, 'expected to hide when vim is open');
                t.onTitleChange.fire('foo - git.exe');
                addon.reevaluateNow();
                assert.strictEqual(addon.isShowing, true, 'expected to show again after vim closed');
            });
            test('adds line wrap prediction even if behind a boundary', () => {
                const t = ds.add(createMockTerminal({ lines: ['hello|'] }));
                addon.lockMakingPredictions();
                addon.activate(t.terminal);
                t.onData('hi'.repeat(50));
                t.expectWritten('');
                expectProcessed('hi', [
                    `${CSI}?25l`, // hide cursor
                    'hi', // this greeting characters
                    ...new Array(36).fill(`${CSI}3mh${CSI}23m${CSI}3mi${CSI}23m`), // rest of the greetings that fit on this line
                    `${CSI}2;81H`, // move to end of line
                    `${CSI}?25h`
                ].join(''));
            });
        });
    });
    class TestTypeAheadAddon extends terminalTypeAheadAddon_1.TypeAheadAddon {
        unlockMakingPredictions() {
            this._lastRow = { y: 1, startingX: 100, endingX: 100, charState: 2 /* CharPredictState.Validated */ };
        }
        lockMakingPredictions() {
            this._lastRow = undefined;
        }
        unlockNavigating() {
            this._lastRow = { y: 1, startingX: 1, endingX: 1, charState: 2 /* CharPredictState.Validated */ };
        }
        reevaluateNow() {
            this._reevaluatePredictorStateNow(this.stats, this._timeline);
        }
        get isShowing() {
            return !!this._timeline?.isShowingPredictions;
        }
        undoAllPredictions() {
            this._timeline?.undoAllPredictions();
        }
        physicalCursor(buffer) {
            return this._timeline?.physicalCursor(buffer);
        }
        tentativeCursor(buffer) {
            return this._timeline?.tentativeCursor(buffer);
        }
    }
    function upcastPartial(v) {
        return v;
    }
    function createPredictionStubs(n) {
        return new Array(n).fill(0).map(stubPrediction);
    }
    function stubPrediction() {
        return {
            apply: () => '',
            rollback: () => '',
            matches: () => 0,
            rollForwards: () => '',
        };
    }
    function createMockTerminal({ lines, cursorAttrs }) {
        const ds = new lifecycle_1.DisposableStore();
        const written = [];
        const cursor = { y: 1, x: 1 };
        const onTitleChange = ds.add(new event_1.Emitter());
        const onData = ds.add(new event_1.Emitter());
        const csiEmitter = ds.add(new event_1.Emitter());
        for (let y = 0; y < lines.length; y++) {
            const line = lines[y];
            if (line.includes('|')) {
                cursor.y = y + 1;
                cursor.x = line.indexOf('|') + 1;
                lines[y] = line.replace('|', ''); // CodeQL [SM02383] replacing the first occurrence is intended
                break;
            }
        }
        return {
            written,
            cursor,
            expectWritten: (s) => {
                assert.strictEqual(JSON.stringify(written.join('')), JSON.stringify(s));
                written.splice(0, written.length);
            },
            clearWritten: () => written.splice(0, written.length),
            onData: (s) => onData.fire(s),
            csiEmitter,
            onTitleChange,
            dispose: () => ds.dispose(),
            terminal: {
                cols: 80,
                rows: 5,
                onResize: new event_1.Emitter().event,
                onData: onData.event,
                onTitleChange: onTitleChange.event,
                parser: {
                    registerCsiHandler(_, callback) {
                        ds.add(csiEmitter.event(callback));
                    },
                },
                write(line) {
                    written.push(line);
                },
                _core: {
                    _inputHandler: {
                        _curAttrData: mockCell('', cursorAttrs)
                    },
                    writeSync() {
                    }
                },
                buffer: {
                    active: {
                        type: 'normal',
                        baseY: 0,
                        get cursorY() { return cursor.y; },
                        get cursorX() { return cursor.x; },
                        getLine(y) {
                            const s = lines[y - 1] || '';
                            return {
                                length: s.length,
                                getCell: (x) => mockCell(s[x - 1] || ''),
                                translateToString: (trim, start = 0, end = s.length) => {
                                    const out = s.slice(start, end);
                                    return trim ? out.trimRight() : out;
                                },
                            };
                        },
                    }
                }
            }
        };
    }
    function mockCell(char, attrs = {}) {
        return new Proxy({}, {
            get(_, prop) {
                if (typeof prop === 'string' && attrs.hasOwnProperty(prop)) {
                    return () => attrs[prop];
                }
                switch (prop) {
                    case 'getWidth':
                        return () => 1;
                    case 'getChars':
                        return () => char;
                    case 'getCode':
                        return () => char.charCodeAt(0) || 0;
                    case 'isAttributeDefault':
                        return () => true;
                    default:
                        return String(prop).startsWith('is') ? (() => false) : (() => 0);
                }
            },
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxUeXBlQWhlYWQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL3R5cGVBaGVhZC90ZXN0L2Jyb3dzZXIvdGVybWluYWxUeXBlQWhlYWQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUM7SUFFcEIsSUFBVyxtQkFHVjtJQUhELFdBQVcsbUJBQW1CO1FBQzdCLGlDQUFVLENBQUE7UUFDVixxQ0FBYyxDQUFBO0lBQ2YsQ0FBQyxFQUhVLG1CQUFtQixLQUFuQixtQkFBbUIsUUFHN0I7SUFFRCxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1FBQzVDLE1BQU0sRUFBRSxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUVyRCxLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1lBQzdCLElBQUksS0FBc0IsQ0FBQztZQUMzQixJQUFJLEdBQXlCLENBQUM7WUFDOUIsSUFBSSxPQUE2QixDQUFDO1lBQ2xDLElBQUksSUFBMEIsQ0FBQztZQUUvQixLQUFLLENBQUMsR0FBRyxFQUFFO2dCQUNWLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFlLENBQUMsQ0FBQztnQkFDekMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQWUsQ0FBQyxDQUFDO2dCQUM3QyxJQUFJLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBZSxDQUFDLENBQUM7Z0JBRTFDLEtBQUssR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksd0NBQWUsQ0FBQztvQkFDbEMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLEtB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