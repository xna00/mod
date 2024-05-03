/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/characterClassifier"], function (require, exports, characterClassifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinkComputer = exports.StateMachine = exports.State = void 0;
    exports.computeLinks = computeLinks;
    var State;
    (function (State) {
        State[State["Invalid"] = 0] = "Invalid";
        State[State["Start"] = 1] = "Start";
        State[State["H"] = 2] = "H";
        State[State["HT"] = 3] = "HT";
        State[State["HTT"] = 4] = "HTT";
        State[State["HTTP"] = 5] = "HTTP";
        State[State["F"] = 6] = "F";
        State[State["FI"] = 7] = "FI";
        State[State["FIL"] = 8] = "FIL";
        State[State["BeforeColon"] = 9] = "BeforeColon";
        State[State["AfterColon"] = 10] = "AfterColon";
        State[State["AlmostThere"] = 11] = "AlmostThere";
        State[State["End"] = 12] = "End";
        State[State["Accept"] = 13] = "Accept";
        State[State["LastKnownState"] = 14] = "LastKnownState"; // marker, custom states may follow
    })(State || (exports.State = State = {}));
    class Uint8Matrix {
        constructor(rows, cols, defaultValue) {
            const data = new Uint8Array(rows * cols);
            for (let i = 0, len = rows * cols; i < len; i++) {
                data[i] = defaultValue;
            }
            this._data = data;
            this.rows = rows;
            this.cols = cols;
        }
        get(row, col) {
            return this._data[row * this.cols + col];
        }
        set(row, col, value) {
            this._data[row * this.cols + col] = value;
        }
    }
    class StateMachine {
        constructor(edges) {
            let maxCharCode = 0;
            let maxState = 0 /* State.Invalid */;
            for (let i = 0, len = edges.length; i < len; i++) {
                const [from, chCode, to] = edges[i];
                if (chCode > maxCharCode) {
                    maxCharCode = chCode;
                }
                if (from > maxState) {
                    maxState = from;
                }
                if (to > maxState) {
                    maxState = to;
                }
            }
            maxCharCode++;
            maxState++;
            const states = new Uint8Matrix(maxState, maxCharCode, 0 /* State.Invalid */);
            for (let i = 0, len = edges.length; i < len; i++) {
                const [from, chCode, to] = edges[i];
                states.set(from, chCode, to);
            }
            this._states = states;
            this._maxCharCode = maxCharCode;
        }
        nextState(currentState, chCode) {
            if (chCode < 0 || chCode >= this._maxCharCode) {
                return 0 /* State.Invalid */;
            }
            return this._states.get(currentState, chCode);
        }
    }
    exports.StateMachine = StateMachine;
    // State machine for http:// or https:// or file://
    let _stateMachine = null;
    function getStateMachine() {
        if (_stateMachine === null) {
            _stateMachine = new StateMachine([
                [1 /* State.Start */, 104 /* CharCode.h */, 2 /* State.H */],
                [1 /* State.Start */, 72 /* CharCode.H */, 2 /* State.H */],
                [1 /* State.Start */, 102 /* CharCode.f */, 6 /* State.F */],
                [1 /* State.Start */, 70 /* CharCode.F */, 6 /* State.F */],
                [2 /* State.H */, 116 /* CharCode.t */, 3 /* State.HT */],
                [2 /* State.H */, 84 /* CharCode.T */, 3 /* State.HT */],
                [3 /* State.HT */, 116 /* CharCode.t */, 4 /* State.HTT */],
                [3 /* State.HT */, 84 /* CharCode.T */, 4 /* State.HTT */],
                [4 /* State.HTT */, 112 /* CharCode.p */, 5 /* State.HTTP */],
                [4 /* State.HTT */, 80 /* CharCode.P */, 5 /* State.HTTP */],
                [5 /* State.HTTP */, 115 /* CharCode.s */, 9 /* State.BeforeColon */],
                [5 /* State.HTTP */, 83 /* CharCode.S */, 9 /* State.BeforeColon */],
                [5 /* State.HTTP */, 58 /* CharCode.Colon */, 10 /* State.AfterColon */],
                [6 /* State.F */, 105 /* CharCode.i */, 7 /* State.FI */],
                [6 /* State.F */, 73 /* CharCode.I */, 7 /* State.FI */],
                [7 /* State.FI */, 108 /* CharCode.l */, 8 /* State.FIL */],
                [7 /* State.FI */, 76 /* CharCode.L */, 8 /* State.FIL */],
                [8 /* State.FIL */, 101 /* CharCode.e */, 9 /* State.BeforeColon */],
                [8 /* State.FIL */, 69 /* CharCode.E */, 9 /* State.BeforeColon */],
                [9 /* State.BeforeColon */, 58 /* CharCode.Colon */, 10 /* State.AfterColon */],
                [10 /* State.AfterColon */, 47 /* CharCode.Slash */, 11 /* State.AlmostThere */],
                [11 /* State.AlmostThere */, 47 /* CharCode.Slash */, 12 /* State.End */],
            ]);
        }
        return _stateMachine;
    }
    var CharacterClass;
    (function (CharacterClass) {
        CharacterClass[CharacterClass["None"] = 0] = "None";
        CharacterClass[CharacterClass["ForceTermination"] = 1] = "ForceTermination";
        CharacterClass[CharacterClass["CannotEndIn"] = 2] = "CannotEndIn";
    })(CharacterClass || (CharacterClass = {}));
    let _classifier = null;
    function getClassifier() {
        if (_classifier === null) {
            _classifier = new characterClassifier_1.CharacterClassifier(0 /* CharacterClass.None */);
            // allow-any-unicode-next-line
            const FORCE_TERMINATION_CHARACTERS = ' \t<>\'\"、。｡､，．：；‘〈「『〔（［｛｢｣｝］）〕』」〉’｀～…';
            for (let i = 0; i < FORCE_TERMINATION_CHARACTERS.length; i++) {
                _classifier.set(FORCE_TERMINATION_CHARACTERS.charCodeAt(i), 1 /* CharacterClass.ForceTermination */);
            }
            const CANNOT_END_WITH_CHARACTERS = '.,;:';
            for (let i = 0; i < CANNOT_END_WITH_CHARACTERS.length; i++) {
                _classifier.set(CANNOT_END_WITH_CHARACTERS.charCodeAt(i), 2 /* CharacterClass.CannotEndIn */);
            }
        }
        return _classifier;
    }
    class LinkComputer {
        static _createLink(classifier, line, lineNumber, linkBeginIndex, linkEndIndex) {
            // Do not allow to end link in certain characters...
            let lastIncludedCharIndex = linkEndIndex - 1;
            do {
                const chCode = line.charCodeAt(lastIncludedCharIndex);
                const chClass = classifier.get(chCode);
                if (chClass !== 2 /* CharacterClass.CannotEndIn */) {
                    break;
                }
                lastIncludedCharIndex--;
            } while (lastIncludedCharIndex > linkBeginIndex);
            // Handle links enclosed in parens, square brackets and curlys.
            if (linkBeginIndex > 0) {
                const charCodeBeforeLink = line.charCodeAt(linkBeginIndex - 1);
                const lastCharCodeInLink = line.charCodeAt(lastIncludedCharIndex);
                if ((charCodeBeforeLink === 40 /* CharCode.OpenParen */ && lastCharCodeInLink === 41 /* CharCode.CloseParen */)
                    || (charCodeBeforeLink === 91 /* CharCode.OpenSquareBracket */ && lastCharCodeInLink === 93 /* CharCode.CloseSquareBracket */)
                    || (charCodeBeforeLink === 123 /* CharCode.OpenCurlyBrace */ && lastCharCodeInLink === 125 /* CharCode.CloseCurlyBrace */)) {
                    // Do not end in ) if ( is before the link start
                    // Do not end in ] if [ is before the link start
                    // Do not end in } if { is before the link start
                    lastIncludedCharIndex--;
                }
            }
            return {
                range: {
                    startLineNumber: lineNumber,
                    startColumn: linkBeginIndex + 1,
                    endLineNumber: lineNumber,
                    endColumn: lastIncludedCharIndex + 2
                },
                url: line.substring(linkBeginIndex, lastIncludedCharIndex + 1)
            };
        }
        static computeLinks(model, stateMachine = getStateMachine()) {
            const classifier = getClassifier();
            const result = [];
            for (let i = 1, lineCount = model.getLineCount(); i <= lineCount; i++) {
                const line = model.getLineContent(i);
                const len = line.length;
                let j = 0;
                let linkBeginIndex = 0;
                let linkBeginChCode = 0;
                let state = 1 /* State.Start */;
                let hasOpenParens = false;
                let hasOpenSquareBracket = false;
                let inSquareBrackets = false;
                let hasOpenCurlyBracket = false;
                while (j < len) {
                    let resetStateMachine = false;
                    const chCode = line.charCodeAt(j);
                    if (state === 13 /* State.Accept */) {
                        let chClass;
                        switch (chCode) {
                            case 40 /* CharCode.OpenParen */:
                                hasOpenParens = true;
                                chClass = 0 /* CharacterClass.None */;
                                break;
                            case 41 /* CharCode.CloseParen */:
                                chClass = (hasOpenParens ? 0 /* CharacterClass.None */ : 1 /* CharacterClass.ForceTermination */);
                                break;
                            case 91 /* CharCode.OpenSquareBracket */:
                                inSquareBrackets = true;
                                hasOpenSquareBracket = true;
                                chClass = 0 /* CharacterClass.None */;
                                break;
                            case 93 /* CharCode.CloseSquareBracket */:
                                inSquareBrackets = false;
                                chClass = (hasOpenSquareBracket ? 0 /* CharacterClass.None */ : 1 /* CharacterClass.ForceTermination */);
                                break;
                            case 123 /* CharCode.OpenCurlyBrace */:
                                hasOpenCurlyBracket = true;
                                chClass = 0 /* CharacterClass.None */;
                                break;
                            case 125 /* CharCode.CloseCurlyBrace */:
                                chClass = (hasOpenCurlyBracket ? 0 /* CharacterClass.None */ : 1 /* CharacterClass.ForceTermination */);
                                break;
                            // The following three rules make it that ' or " or ` are allowed inside links
                            // only if the link is wrapped by some other quote character
                            case 39 /* CharCode.SingleQuote */:
                            case 34 /* CharCode.DoubleQuote */:
                            case 96 /* CharCode.BackTick */:
                                if (linkBeginChCode === chCode) {
                                    chClass = 1 /* CharacterClass.ForceTermination */;
                                }
                                else if (linkBeginChCode === 39 /* CharCode.SingleQuote */ || linkBeginChCode === 34 /* CharCode.DoubleQuote */ || linkBeginChCode === 96 /* CharCode.BackTick */) {
                                    chClass = 0 /* CharacterClass.None */;
                                }
                                else {
                                    chClass = 1 /* CharacterClass.ForceTermination */;
                                }
                                break;
                            case 42 /* CharCode.Asterisk */:
                                // `*` terminates a link if the link began with `*`
                                chClass = (linkBeginChCode === 42 /* CharCode.Asterisk */) ? 1 /* CharacterClass.ForceTermination */ : 0 /* CharacterClass.None */;
                                break;
                            case 124 /* CharCode.Pipe */:
                                // `|` terminates a link if the link began with `|`
                                chClass = (linkBeginChCode === 124 /* CharCode.Pipe */) ? 1 /* CharacterClass.ForceTermination */ : 0 /* CharacterClass.None */;
                                break;
                            case 32 /* CharCode.Space */:
                                // ` ` allow space in between [ and ]
                                chClass = (inSquareBrackets ? 0 /* CharacterClass.None */ : 1 /* CharacterClass.ForceTermination */);
                                break;
                            default:
                                chClass = classifier.get(chCode);
                        }
                        // Check if character terminates link
                        if (chClass === 1 /* CharacterClass.ForceTermination */) {
                            result.push(LinkComputer._createLink(classifier, line, i, linkBeginIndex, j));
                            resetStateMachine = true;
                        }
                    }
                    else if (state === 12 /* State.End */) {
                        let chClass;
                        if (chCode === 91 /* CharCode.OpenSquareBracket */) {
                            // Allow for the authority part to contain ipv6 addresses which contain [ and ]
                            hasOpenSquareBracket = true;
                            chClass = 0 /* CharacterClass.None */;
                        }
                        else {
                            chClass = classifier.get(chCode);
                        }
                        // Check if character terminates link
                        if (chClass === 1 /* CharacterClass.ForceTermination */) {
                            resetStateMachine = true;
                        }
                        else {
                            state = 13 /* State.Accept */;
                        }
                    }
                    else {
                        state = stateMachine.nextState(state, chCode);
                        if (state === 0 /* State.Invalid */) {
                            resetStateMachine = true;
                        }
                    }
                    if (resetStateMachine) {
                        state = 1 /* State.Start */;
                        hasOpenParens = false;
                        hasOpenSquareBracket = false;
                        hasOpenCurlyBracket = false;
                        // Record where the link started
                        linkBeginIndex = j + 1;
                        linkBeginChCode = chCode;
                    }
                    j++;
                }
                if (state === 13 /* State.Accept */) {
                    result.push(LinkComputer._createLink(classifier, line, i, linkBeginIndex, len));
                }
            }
            return result;
        }
    }
    exports.LinkComputer = LinkComputer;
    /**
     * Returns an array of all links contains in the provided
     * document. *Note* that this operation is computational
     * expensive and should not run in the UI thread.
     */
    function computeLinks(model) {
        if (!model || typeof model.getLineCount !== 'function' || typeof model.getLineContent !== 'function') {
            // Unknown caller!
            return [];
        }
        return LinkComputer.computeLinks(model);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua0NvbXB1dGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2xhbmd1YWdlcy9saW5rQ29tcHV0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBeVZoRyxvQ0FNQztJQXBWRCxJQUFrQixLQWdCakI7SUFoQkQsV0FBa0IsS0FBSztRQUN0Qix1Q0FBVyxDQUFBO1FBQ1gsbUNBQVMsQ0FBQTtRQUNULDJCQUFLLENBQUE7UUFDTCw2QkFBTSxDQUFBO1FBQ04sK0JBQU8sQ0FBQTtRQUNQLGlDQUFRLENBQUE7UUFDUiwyQkFBSyxDQUFBO1FBQ0wsNkJBQU0sQ0FBQTtRQUNOLCtCQUFPLENBQUE7UUFDUCwrQ0FBZSxDQUFBO1FBQ2YsOENBQWUsQ0FBQTtRQUNmLGdEQUFnQixDQUFBO1FBQ2hCLGdDQUFRLENBQUE7UUFDUixzQ0FBVyxDQUFBO1FBQ1gsc0RBQW1CLENBQUEsQ0FBQyxtQ0FBbUM7SUFDeEQsQ0FBQyxFQWhCaUIsS0FBSyxxQkFBTCxLQUFLLFFBZ0J0QjtJQUlELE1BQU0sV0FBVztRQU1oQixZQUFZLElBQVksRUFBRSxJQUFZLEVBQUUsWUFBb0I7WUFDM0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ3pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQztZQUN4QixDQUFDO1lBRUQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFD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