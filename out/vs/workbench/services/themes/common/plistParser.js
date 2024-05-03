/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parse = parse;
    var ChCode;
    (function (ChCode) {
        ChCode[ChCode["BOM"] = 65279] = "BOM";
        ChCode[ChCode["SPACE"] = 32] = "SPACE";
        ChCode[ChCode["TAB"] = 9] = "TAB";
        ChCode[ChCode["CARRIAGE_RETURN"] = 13] = "CARRIAGE_RETURN";
        ChCode[ChCode["LINE_FEED"] = 10] = "LINE_FEED";
        ChCode[ChCode["SLASH"] = 47] = "SLASH";
        ChCode[ChCode["LESS_THAN"] = 60] = "LESS_THAN";
        ChCode[ChCode["QUESTION_MARK"] = 63] = "QUESTION_MARK";
        ChCode[ChCode["EXCLAMATION_MARK"] = 33] = "EXCLAMATION_MARK";
    })(ChCode || (ChCode = {}));
    var State;
    (function (State) {
        State[State["ROOT_STATE"] = 0] = "ROOT_STATE";
        State[State["DICT_STATE"] = 1] = "DICT_STATE";
        State[State["ARR_STATE"] = 2] = "ARR_STATE";
    })(State || (State = {}));
    /**
     * A very fast plist parser
     */
    function parse(content) {
        return _parse(content, null, null);
    }
    function _parse(content, filename, locationKeyName) {
        const len = content.length;
        let pos = 0;
        let line = 1;
        let char = 0;
        // Skip UTF8 BOM
        if (len > 0 && content.charCodeAt(0) === 65279 /* ChCode.BOM */) {
            pos = 1;
        }
        function advancePosBy(by) {
            if (locationKeyName === null) {
                pos = pos + by;
            }
            else {
                while (by > 0) {
                    const chCode = content.charCodeAt(pos);
                    if (chCode === 10 /* ChCode.LINE_FEED */) {
                        pos++;
                        line++;
                        char = 0;
                    }
                    else {
                        pos++;
                        char++;
                    }
                    by--;
                }
            }
        }
        function advancePosTo(to) {
            if (locationKeyName === null) {
                pos = to;
            }
            else {
                advancePosBy(to - pos);
            }
        }
        function skipWhitespace() {
            while (pos < len) {
                const chCode = content.charCodeAt(pos);
                if (chCode !== 32 /* ChCode.SPACE */ && chCode !== 9 /* ChCode.TAB */ && chCode !== 13 /* ChCode.CARRIAGE_RETURN */ && chCode !== 10 /* ChCode.LINE_FEED */) {
                    break;
                }
                advancePosBy(1);
            }
        }
        function advanceIfStartsWith(str) {
            if (content.substr(pos, str.length) === str) {
                advancePosBy(str.length);
                return true;
            }
            return false;
        }
        function advanceUntil(str) {
            const nextOccurence = content.indexOf(str, pos);
            if (nextOccurence !== -1) {
                advancePosTo(nextOccurence + str.length);
            }
            else {
                // EOF
                advancePosTo(len);
            }
        }
        function captureUntil(str) {
            const nextOccurence = content.indexOf(str, pos);
            if (nextOccurence !== -1) {
                const r = content.substring(pos, nextOccurence);
                advancePosTo(nextOccurence + str.length);
                return r;
            }
            else {
                // EOF
                const r = content.substr(pos);
                advancePosTo(len);
                return r;
            }
        }
        let state = 0 /* State.ROOT_STATE */;
        let cur = null;
        const stateStack = [];
        const objStack = [];
        let curKey = null;
        function pushState(newState, newCur) {
            stateStack.push(state);
            objStack.push(cur);
            state = newState;
            cur = newCur;
        }
        function popState() {
            if (stateStack.length === 0) {
                return fail('illegal state stack');
            }
            state = stateStack.pop();
            cur = objStack.pop();
        }
        function fail(msg) {
            throw new Error('Near offset ' + pos + ': ' + msg + ' ~~~' + content.substr(pos, 50) + '~~~');
        }
        const dictState = {
            enterDict: function () {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                const newDict = {};
                if (locationKeyName !== null) {
                    newDict[locationKeyName] = {
                        filename: filename,
                        line: line,
                        char: char
                    };
                }
                cur[curKey] = newDict;
                curKey = null;
                pushState(1 /* State.DICT_STATE */, newDict);
            },
            enterArray: function () {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                const newArr = [];
                cur[curKey] = newArr;
                curKey = null;
                pushState(2 /* State.ARR_STATE */, newArr);
            }
        };
        const arrState = {
            enterDict: function () {
                const newDict = {};
                if (locationKeyName !== null) {
                    newDict[locationKeyName] = {
                        filename: filename,
                        line: line,
                        char: char
                    };
                }
                cur.push(newDict);
                pushState(1 /* State.DICT_STATE */, newDict);
            },
            enterArray: function () {
                const newArr = [];
                cur.push(newArr);
                pushState(2 /* State.ARR_STATE */, newArr);
            }
        };
        function enterDict() {
            if (state === 1 /* State.DICT_STATE */) {
                dictState.enterDict();
            }
            else if (state === 2 /* State.ARR_STATE */) {
                arrState.enterDict();
            }
            else { // ROOT_STATE
                cur = {};
                if (locationKeyName !== null) {
                    cur[locationKeyName] = {
                        filename: filename,
                        line: line,
                        char: char
                    };
                }
                pushState(1 /* State.DICT_STATE */, cur);
            }
        }
        function leaveDict() {
            if (state === 1 /* State.DICT_STATE */) {
                popState();
            }
            else if (state === 2 /* State.ARR_STATE */) {
                return fail('unexpected </dict>');
            }
            else { // ROOT_STATE
                return fail('unexpected </dict>');
            }
        }
        function enterArray() {
            if (state === 1 /* State.DICT_STATE */) {
                dictState.enterArray();
            }
            else if (state === 2 /* State.ARR_STATE */) {
                arrState.enterArray();
            }
            else { // ROOT_STATE
                cur = [];
                pushState(2 /* State.ARR_STATE */, cur);
            }
        }
        function leaveArray() {
            if (state === 1 /* State.DICT_STATE */) {
                return fail('unexpected </array>');
            }
            else if (state === 2 /* State.ARR_STATE */) {
                popState();
            }
            else { // ROOT_STATE
                return fail('unexpected </array>');
            }
        }
        function acceptKey(val) {
            if (state === 1 /* State.DICT_STATE */) {
                if (curKey !== null) {
                    return fail('too many <key>');
                }
                curKey = val;
            }
            else if (state === 2 /* State.ARR_STATE */) {
                return fail('unexpected <key>');
            }
            else { // ROOT_STATE
                return fail('unexpected <key>');
            }
        }
        function acceptString(val) {
            if (state === 1 /* State.DICT_STATE */) {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                cur[curKey] = val;
                curKey = null;
            }
            else if (state === 2 /* State.ARR_STATE */) {
                cur.push(val);
            }
            else { // ROOT_STATE
                cur = val;
            }
        }
        function acceptReal(val) {
            if (isNaN(val)) {
                return fail('cannot parse float');
            }
            if (state === 1 /* State.DICT_STATE */) {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                cur[curKey] = val;
                curKey = null;
            }
            else if (state === 2 /* State.ARR_STATE */) {
                cur.push(val);
            }
            else { // ROOT_STATE
                cur = val;
            }
        }
        function acceptInteger(val) {
            if (isNaN(val)) {
                return fail('cannot parse integer');
            }
            if (state === 1 /* State.DICT_STATE */) {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                cur[curKey] = val;
                curKey = null;
            }
            else if (state === 2 /* State.ARR_STATE */) {
                cur.push(val);
            }
            else { // ROOT_STATE
                cur = val;
            }
        }
        function acceptDate(val) {
            if (state === 1 /* State.DICT_STATE */) {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                cur[curKey] = val;
                curKey = null;
            }
            else if (state === 2 /* State.ARR_STATE */) {
                cur.push(val);
            }
            else { // ROOT_STATE
                cur = val;
            }
        }
        function acceptData(val) {
            if (state === 1 /* State.DICT_STATE */) {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                cur[curKey] = val;
                curKey = null;
            }
            else if (state === 2 /* State.ARR_STATE */) {
                cur.push(val);
            }
            else { // ROOT_STATE
                cur = val;
            }
        }
        function acceptBool(val) {
            if (state === 1 /* State.DICT_STATE */) {
                if (curKey === null) {
                    return fail('missing <key>');
                }
                cur[curKey] = val;
                curKey = null;
            }
            else if (state === 2 /* State.ARR_STATE */) {
                cur.push(val);
            }
            else { // ROOT_STATE
                cur = val;
            }
        }
        function escapeVal(str) {
            return str.replace(/&#([0-9]+);/g, function (_, m0) {
                return String.fromCodePoint(parseInt(m0, 10));
            }).replace(/&#x([0-9a-f]+);/g, function (_, m0) {
                return String.fromCodePoint(parseInt(m0, 16));
            }).replace(/&amp;|&lt;|&gt;|&quot;|&apos;/g, function (_) {
                switch (_) {
                    case '&amp;': return '&';
                    case '&lt;': return '<';
                    case '&gt;': return '>';
                    case '&quot;': return '"';
                    case '&apos;': return '\'';
                }
                return _;
            });
        }
        function parseOpenTag() {
            let r = captureUntil('>');
            let isClosed = false;
            if (r.charCodeAt(r.length - 1) === 47 /* ChCode.SLASH */) {
                isClosed = true;
                r = r.substring(0, r.length - 1);
            }
            return {
                name: r.trim(),
                isClosed: isClosed
            };
        }
        function parseTagValue(tag) {
            if (tag.isClosed) {
                return '';
            }
            const val = captureUntil('</');
            advanceUntil('>');
            return escapeVal(val);
        }
        while (pos < len) {
            skipWhitespace();
            if (pos >= len) {
                break;
            }
            const chCode = content.charCodeAt(pos);
            advancePosBy(1);
            if (chCode !== 60 /* ChCode.LESS_THAN */) {
                return fail('expected <');
            }
            if (pos >= len) {
                return fail('unexpected end of input');
            }
            const peekChCode = content.charCodeAt(pos);
            if (peekChCode === 63 /* ChCode.QUESTION_MARK */) {
                advancePosBy(1);
                advanceUntil('?>');
                continue;
            }
            if (peekChCode === 33 /* ChCode.EXCLAMATION_MARK */) {
                advancePosBy(1);
                if (advanceIfStartsWith('--')) {
                    advanceUntil('-->');
                    continue;
                }
                advanceUntil('>');
                continue;
            }
            if (peekChCode === 47 /* ChCode.SLASH */) {
                advancePosBy(1);
                skipWhitespace();
                if (advanceIfStartsWith('plist')) {
                    advanceUntil('>');
                    continue;
                }
                if (advanceIfStartsWith('dict')) {
                    advanceUntil('>');
                    leaveDict();
                    continue;
                }
                if (advanceIfStartsWith('array')) {
                    advanceUntil('>');
                    leaveArray();
                    continue;
                }
                return fail('unexpected closed tag');
            }
            const tag = parseOpenTag();
            switch (tag.name) {
                case 'dict':
                    enterDict();
                    if (tag.isClosed) {
                        leaveDict();
                    }
                    continue;
                case 'array':
                    enterArray();
                    if (tag.isClosed) {
                        leaveArray();
                    }
                    continue;
                case 'key':
                    acceptKey(parseTagValue(tag));
                    continue;
                case 'string':
                    acceptString(parseTagValue(tag));
                    continue;
                case 'real':
                    acceptReal(parseFloat(parseTagValue(tag)));
                    continue;
                case 'integer':
                    acceptInteger(parseInt(parseTagValue(tag), 10));
                    continue;
                case 'date':
                    acceptDate(new Date(parseTagValue(tag)));
                    continue;
                case 'data':
                    acceptData(parseTagValue(tag));
                    continue;
                case 'true':
                    parseTagValue(tag);
                    acceptBool(true);
                    continue;
                case 'false':
                    parseTagValue(tag);
                    acceptBool(false);
                    continue;
            }
            if (/^plist/.test(tag.name)) {
                continue;
            }
            return fail('unexpected opened tag ' + tag.name);
        }
        return cur;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxpc3RQYXJzZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90aGVtZXMvY29tbW9uL3BsaXN0UGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBeUJoRyxzQkFFQztJQXpCRCxJQUFXLE1BYVY7SUFiRCxXQUFXLE1BQU07UUFDaEIscUNBQVcsQ0FBQTtRQUVYLHNDQUFVLENBQUE7UUFDVixpQ0FBTyxDQUFBO1FBQ1AsMERBQW9CLENBQUE7UUFDcEIsOENBQWMsQ0FBQTtRQUVkLHNDQUFVLENBQUE7UUFFViw4Q0FBYyxDQUFBO1FBQ2Qsc0RBQWtCLENBQUE7UUFDbEIsNERBQXFCLENBQUE7SUFDdEIsQ0FBQyxFQWJVLE1BQU0sS0FBTixNQUFNLFFBYWhCO0lBRUQsSUFBVyxLQUlWO0lBSkQsV0FBVyxLQUFLO1FBQ2YsNkNBQWMsQ0FBQTtRQUNkLDZDQUFjLENBQUE7UUFDZCwyQ0FBYSxDQUFBO0lBQ2QsQ0FBQyxFQUpVLEtBQUssS0FBTCxLQUFLLFFBSWY7SUFDRDs7T0FFRztJQUNILFNBQWdCLEtBQUssQ0FBQyxPQUFlO1FBQ3BDLE9BQU8sTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELFNBQVMsTUFBTSxDQUFDLE9BQWUsRUFBRSxRQUF1QixFQUFFLGVBQThCO1FBQ3ZGLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFFM0IsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ1osSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ2IsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBRWIsZ0JBQWdCO1FBQ2hCLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBVSxD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