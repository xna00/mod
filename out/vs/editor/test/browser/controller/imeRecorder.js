/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/controller/textAreaInput", "vs/base/common/lifecycle", "vs/base/browser/browser", "vs/base/common/platform", "vs/base/browser/window"], function (require, exports, textAreaInput_1, lifecycle_1, browser, platform, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (() => {
        const startButton = window_1.mainWindow.document.getElementById('startRecording');
        const endButton = window_1.mainWindow.document.getElementById('endRecording');
        let inputarea;
        const disposables = new lifecycle_1.DisposableStore();
        let originTimeStamp = 0;
        let recorded = {
            env: null,
            initial: null,
            events: [],
            final: null
        };
        const readTextareaState = () => {
            return {
                selectionDirection: inputarea.selectionDirection,
                selectionEnd: inputarea.selectionEnd,
                selectionStart: inputarea.selectionStart,
                value: inputarea.value,
            };
        };
        startButton.onclick = () => {
            disposables.clear();
            startTest();
            originTimeStamp = 0;
            recorded = {
                env: {
                    OS: platform.OS,
                    browser: {
                        isAndroid: browser.isAndroid,
                        isFirefox: browser.isFirefox,
                        isChrome: browser.isChrome,
                        isSafari: browser.isSafari
                    }
                },
                initial: readTextareaState(),
                events: [],
                final: null
            };
        };
        endButton.onclick = () => {
            recorded.final = readTextareaState();
            console.log(printRecordedData());
        };
        function printRecordedData() {
            const lines = [];
            lines.push(`const recorded: IRecorded = {`);
            lines.push(`\tenv: ${JSON.stringify(recorded.env)}, `);
            lines.push(`\tinitial: ${printState(recorded.initial)}, `);
            lines.push(`\tevents: [\n\t\t${recorded.events.map(ev => printEvent(ev)).join(',\n\t\t')}\n\t],`);
            lines.push(`\tfinal: ${printState(recorded.final)},`);
            lines.push(`}`);
            return lines.join('\n');
            function printString(str) {
                return str.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
            }
            function printState(state) {
                return `{ value: '${printString(state.value)}', selectionStart: ${state.selectionStart}, selectionEnd: ${state.selectionEnd}, selectionDirection: '${state.selectionDirection}' }`;
            }
            function printEvent(ev) {
                if (ev.type === 'keydown' || ev.type === 'keypress' || ev.type === 'keyup') {
                    return `{ timeStamp: ${ev.timeStamp.toFixed(2)}, state: ${printState(ev.state)}, type: '${ev.type}', altKey: ${ev.altKey}, charCode: ${ev.charCode}, code: '${ev.code}', ctrlKey: ${ev.ctrlKey}, isComposing: ${ev.isComposing}, key: '${ev.key}', keyCode: ${ev.keyCode}, location: ${ev.location}, metaKey: ${ev.metaKey}, repeat: ${ev.repeat}, shiftKey: ${ev.shiftKey} }`;
                }
                if (ev.type === 'compositionstart' || ev.type === 'compositionupdate' || ev.type === 'compositionend') {
                    return `{ timeStamp: ${ev.timeStamp.toFixed(2)}, state: ${printState(ev.state)}, type: '${ev.type}', data: '${printString(ev.data)}' }`;
                }
                if (ev.type === 'beforeinput' || ev.type === 'input') {
                    return `{ timeStamp: ${ev.timeStamp.toFixed(2)}, state: ${printState(ev.state)}, type: '${ev.type}', data: ${ev.data === null ? 'null' : `'${printString(ev.data)}'`}, inputType: '${ev.inputType}', isComposing: ${ev.isComposing} }`;
                }
                return JSON.stringify(ev);
            }
        }
        function startTest() {
            inputarea = document.createElement('textarea');
            window_1.mainWindow.document.body.appendChild(inputarea);
            inputarea.focus();
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                inputarea.remove();
            }));
            const wrapper = disposables.add(new textAreaInput_1.TextAreaWrapper(inputarea));
            wrapper.setValue('', `aaaa`);
            wrapper.setSelectionRange('', 2, 2);
            const recordEvent = (e) => {
                recorded.events.push(e);
            };
            const recordKeyboardEvent = (e) => {
                if (e.type !== 'keydown' && e.type !== 'keypress' && e.type !== 'keyup') {
                    throw new Error(`Not supported!`);
                }
                if (originTimeStamp === 0) {
                    originTimeStamp = e.timeStamp;
                }
                const ev = {
                    timeStamp: e.timeStamp - originTimeStamp,
                    state: readTextareaState(),
                    type: e.type,
                    altKey: e.altKey,
                    charCode: e.charCode,
                    code: e.code,
                    ctrlKey: e.ctrlKey,
                    isComposing: e.isComposing,
                    key: e.key,
                    keyCode: e.keyCode,
                    location: e.location,
                    metaKey: e.metaKey,
                    repeat: e.repeat,
                    shiftKey: e.shiftKey
                };
                recordEvent(ev);
            };
            const recordCompositionEvent = (e) => {
                if (e.type !== 'compositionstart' && e.type !== 'compositionupdate' && e.type !== 'compositionend') {
                    throw new Error(`Not supported!`);
                }
                if (originTimeStamp === 0) {
                    originTimeStamp = e.timeStamp;
                }
                const ev = {
                    timeStamp: e.timeStamp - originTimeStamp,
                    state: readTextareaState(),
                    type: e.type,
                    data: e.data,
                };
                recordEvent(ev);
            };
            const recordInputEvent = (e) => {
                if (e.type !== 'beforeinput' && e.type !== 'input') {
                    throw new Error(`Not supported!`);
                }
                if (originTimeStamp === 0) {
                    originTimeStamp = e.timeStamp;
                }
                const ev = {
                    timeStamp: e.timeStamp - originTimeStamp,
                    state: readTextareaState(),
                    type: e.type,
                    data: e.data,
                    inputType: e.inputType,
                    isComposing: e.isComposing,
                };
                recordEvent(ev);
            };
            wrapper.onKeyDown(recordKeyboardEvent);
            wrapper.onKeyPress(recordKeyboardEvent);
            wrapper.onKeyUp(recordKeyboardEvent);
            wrapper.onCompositionStart(recordCompositionEvent);
            wrapper.onCompositionUpdate(recordCompositionEvent);
            wrapper.onCompositionEnd(recordCompositionEvent);
            wrapper.onBeforeInput(recordInputEvent);
            wrapper.onInput(recordInputEvent);
        }
    })();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1lUmVjb3JkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2Jyb3dzZXIvY29udHJvbGxlci9pbWVSZWNvcmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxDQUFDLEdBQUcsRUFBRTtRQUVMLE1BQU0sV0FBVyxHQUFzQixtQkFBVSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUUsQ0FBQztRQUM3RixNQUFNLFNBQVMsR0FBc0IsbUJBQVUsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBRSxDQUFDO1FBRXpGLElBQUksU0FBOEIsQ0FBQztRQUNuQyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUMxQyxJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUM7UUFDeEIsSUFBSSxRQUFRLEdBQWM7WUFDekIsR0FBRyxFQUFFLElBQUs7WUFDVixPQUFPLEVBQUUsSUFBSztZQUNkLE1BQU0sRUFBRSxFQUFFO1lBQ1YsS0FBSyxFQUFFLElBQUs7U0FDWixDQUFDO1FBRUYsTUFBTSxpQkFBaUIsR0FBRyxHQUEyQixFQUFFO1lBQ3RELE9BQU87Z0JBQ04sa0JBQWtCLEVBQUUsU0FBUyxDQUFDLGtCQUFrQjtnQkFDaEQsWUFBWSxFQUFFLFNBQVMsQ0FBQyxZQUFZO2dCQUNwQyxjQUFjLEVBQUUsU0FBUyxDQUFDLGNBQWM7Z0JBQ3hDLEtBQUssRUFBRSxTQUFTLENBQUMsS0FBSzthQUN0QixDQUFDO1FBQ0gsQ0FBQyxDQUFDO1FBRUYsV0FBVyxDQUFDLE9BQU8sR0FBRyxHQUFHLEVBQUU7WUFDMUIsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3BCLFNBQVMsRUFBRSxDQUFDO1lBQ1osZUFBZSxHQUFHLENBQUMsQ0FBQztZQUNwQixRQUFR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