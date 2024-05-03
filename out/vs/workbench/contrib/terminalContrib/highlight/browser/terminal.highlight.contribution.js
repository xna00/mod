/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/workbench/contrib/terminal/browser/terminalExtensions"], function (require, exports, dom_1, lifecycle_1, terminalExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TerminalHighlightContribution extends lifecycle_1.Disposable {
        static { this.ID = 'terminal.highlight'; }
        static get(instance) {
            return instance.getContribution(TerminalHighlightContribution.ID);
        }
        constructor(_instance, processManager, widgetManager) {
            super();
            this._instance = _instance;
        }
        xtermOpen(xterm) {
            const screenElement = xterm.raw.element.querySelector('.xterm-screen');
            this._register((0, dom_1.addDisposableListener)(screenElement, 'mousemove', (e) => {
                if (e.target.tagName !== 'CANVAS') {
                    return;
                }
                const rect = xterm.raw.element?.getBoundingClientRect();
                if (!rect) {
                    return;
                }
                const mouseCursorY = Math.floor(e.offsetY / (rect.height / xterm.raw.rows));
                const command = this._instance.capabilities.get(2 /* TerminalCapability.CommandDetection */)?.getCommandForLine(xterm.raw.buffer.active.viewportY + mouseCursorY);
                if (command && 'getOutput' in command) {
                    xterm.markTracker.showCommandGuide(command);
                }
                else {
                    xterm.markTracker.showCommandGuide(undefined);
                }
            }));
            this._register((0, dom_1.addDisposableListener)(screenElement, 'mouseout', () => xterm.markTracker.showCommandGuide(undefined)));
            this._register(xterm.raw.onData(() => xterm.markTracker.showCommandGuide(undefined)));
        }
    }
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalHighlightContribution.ID, TerminalHighlightContribution, false);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuaGlnaGxpZ2h0LmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2hpZ2hsaWdodC9icm93c2VyL3Rlcm1pbmFsLmhpZ2hsaWdodC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsTUFBTSw2QkFBOEIsU0FBUSxzQkFBVTtpQkFDckMsT0FBRSxHQUFHLG9CQUFvQixDQUFDO1FBRTFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBdUQ7WUFDakUsT0FBTyxRQUFRLENBQUMsZUFBZSxDQUFnQyw2QkFBNkIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsRyxDQUFDO1FBRUQsWUFDa0IsU0FBd0QsRUFDekUsY0FBOEQsRUFDOUQsYUFBb0M7WUFFcEMsS0FBSyxFQUFFLENBQUM7WUFKUyxjQUFTLEdBQVQsU0FBUyxDQUErQztRQUsxRSxDQUFDO1FBRUQsU0FBUyxDQUFDLEtBQWlEO1lBQzFELE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBUSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUUsQ0FBQztZQUN6RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsMkJBQXFCLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQWEsRUFBRSxFQUFFO2dCQUNsRixJQUFLLENBQUMsQ0FBQyxNQUFjLENBQUMsT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUM1QyxPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUscUJBQXFCLEVBQUUsQ0FBQztnQkFDeEQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsR0FBRyw2Q0FBcUMsRUFBRSxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQyxDQUFDO2dCQUMxSixJQUFJLE9BQU8sSUFBSSxXQUFXLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ3ZDLEtBQUssQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzdDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxLQUFLLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSwyQkFBcUIsRUFBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RILElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkYsQ0FBQzs7SUFHRixJQUFBLGlEQUE0QixFQUFDLDZCQUE2QixDQUFDLEVBQUUsRUFBRSw2QkFBNkIsRUFBRSxLQUFLLENBQUMsQ0FBQyJ9