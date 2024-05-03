/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.terminalStrings = void 0;
    /**
     * An object holding strings shared by multiple parts of the terminal
     */
    exports.terminalStrings = {
        terminal: (0, nls_1.localize)('terminal', "Terminal"),
        new: (0, nls_1.localize)('terminal.new', "New Terminal"),
        doNotShowAgain: (0, nls_1.localize)('doNotShowAgain', 'Do Not Show Again'),
        currentSessionCategory: (0, nls_1.localize)('currentSessionCategory', 'current session'),
        previousSessionCategory: (0, nls_1.localize)('previousSessionCategory', 'previous session'),
        typeTask: (0, nls_1.localize)('task', "Task"),
        typeLocal: (0, nls_1.localize)('local', "Local"),
        actionCategory: (0, nls_1.localize2)('terminalCategory', "Terminal"),
        focus: (0, nls_1.localize2)('workbench.action.terminal.focus', "Focus Terminal"),
        focusAndHideAccessibleBuffer: (0, nls_1.localize2)('workbench.action.terminal.focusAndHideAccessibleBuffer', "Focus Terminal and Hide Accessible Buffer"),
        kill: {
            ...(0, nls_1.localize2)('killTerminal', "Kill Terminal"),
            short: (0, nls_1.localize)('killTerminal.short', "Kill"),
        },
        moveToEditor: (0, nls_1.localize2)('moveToEditor', "Move Terminal into Editor Area"),
        moveIntoNewWindow: (0, nls_1.localize2)('moveIntoNewWindow', "Move Terminal into New Window"),
        moveToTerminalPanel: (0, nls_1.localize2)('workbench.action.terminal.moveToTerminalPanel', "Move Terminal into Panel"),
        changeIcon: (0, nls_1.localize2)('workbench.action.terminal.changeIcon', "Change Icon..."),
        changeColor: (0, nls_1.localize2)('workbench.action.terminal.changeColor', "Change Color..."),
        split: {
            ...(0, nls_1.localize2)('splitTerminal', "Split Terminal"),
            short: (0, nls_1.localize)('splitTerminal.short', "Split"),
        },
        unsplit: (0, nls_1.localize2)('unsplitTerminal', "Unsplit Terminal"),
        rename: (0, nls_1.localize2)('workbench.action.terminal.rename', "Rename..."),
        toggleSizeToContentWidth: (0, nls_1.localize2)('workbench.action.terminal.sizeToContentWidthInstance', "Toggle Size to Content Width"),
        focusHover: (0, nls_1.localize2)('workbench.action.terminal.focusHover', "Focus Hover"),
        sendSequence: (0, nls_1.localize2)('workbench.action.terminal.sendSequence', "Send Custom Sequence To Terminal"),
        newWithCwd: (0, nls_1.localize2)('workbench.action.terminal.newWithCwd', "Create New Terminal Starting in a Custom Working Directory"),
        renameWithArgs: (0, nls_1.localize2)('workbench.action.terminal.renameWithArg', "Rename the Currently Active Terminal"),
        stickyScroll: (0, nls_1.localize2)('stickyScroll', "Sticky Scroll"),
        scrollToPreviousCommand: (0, nls_1.localize2)('workbench.action.terminal.scrollToPreviousCommand', "Scroll To Previous Command"),
        scrollToNextCommand: (0, nls_1.localize2)('workbench.action.terminal.scrollToNextCommand', "Scroll To Next Command")
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxTdHJpbmdzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9jb21tb24vdGVybWluYWxTdHJpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUloRzs7T0FFRztJQUNVLFFBQUEsZUFBZSxHQUFHO1FBQzlCLFFBQVEsRUFBRSxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO1FBQzFDLEdBQUcsRUFBRSxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsY0FBYyxDQUFDO1FBQzdDLGNBQWMsRUFBRSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsQ0FBQztRQUMvRCxzQkFBc0IsRUFBRSxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSxpQkFBaUIsQ0FBQztRQUM3RSx1QkFBdUIsRUFBRSxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSxrQkFBa0IsQ0FBQztRQUNoRixRQUFRLEVBQUUsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztRQUNsQyxTQUFTLEVBQUUsSUFBQSxjQUFRLEVBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQztRQUNyQyxjQUFjLEVBQUUsSUFBQSxlQUFTLEVBQUMsa0JBQWtCLEVBQUUsVUFBVSxDQUFDO1FBQ3pELEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxpQ0FBaUMsRUFBRSxnQkFBZ0IsQ0FBQztRQUNyRSw0QkFBNEIsRUFBRSxJQUFBLGVBQVMsRUFBQyx3REFBd0QsRUFBRSwyQ0FBMkMsQ0FBQztRQUM5SSxJQUFJLEVBQUU7WUFDTCxHQUFHLElBQUEsZUFBUyxFQUFDLGNBQWMsRUFBRSxlQUFlLENBQUM7WUFDN0MsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLE1BQU0sQ0FBQztTQUM3QztRQUNELFlBQVksRUFBRSxJQUFBLGVBQVMsRUFBQyxjQUFjLEVBQUUsZ0NBQWdDLENBQUM7UUFDekUsaUJBQWlCLEVBQUUsSUFBQSxlQUFTLEVBQUMsbUJBQW1CLEVBQUUsK0JBQStCLENBQUM7UUFDbEYsbUJBQW1CLEVBQUUsSUFBQSxlQUFTLEVBQUMsK0NBQStDLEVBQUUsMEJBQTBCLENBQUM7UUFDM0csVUFBVSxFQUFFLElBQUEsZUFBUyxFQUFDLHNDQUFzQyxFQUFFLGdCQUFnQixDQUFDO1FBQy9FLFdBQVcsRUFBRSxJQUFBLGVBQVMsRUFBQyx1Q0FBdUMsRUFBRSxpQkFBaUIsQ0FBQztRQUNsRixLQUFLLEVBQUU7WUFDTixHQUFHLElBQUEsZUFBUyxFQUFDLGVBQWUsRUFBRSxnQkFBZ0IsQ0FBQztZQUMvQyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsT0FBTyxDQUFDO1NBQy9DO1FBQ0QsT0FBTyxFQUFFLElBQUEsZUFBUyxFQUFDLGlCQUFpQixFQUFFLGtCQUFrQixDQUFDO1FBQ3pELE1BQU0sRUFBRSxJQUFBLGVBQVMsRUFBQyxrQ0FBa0MsRUFBRSxXQUFXLENBQUM7UUFDbEUsd0JBQXdCLEVBQUUsSUFBQSxlQUFTLEVBQUMsc0RBQXNELEVBQUUsOEJBQThCLENBQUM7UUFDM0gsVUFBVSxFQUFFLElBQUEsZUFBUyxFQUFDLHNDQUFzQyxFQUFFLGFBQWEsQ0FBQztRQUM1RSxZQUFZLEVBQUUsSUFBQSxlQUFTLEVBQUMsd0NBQXdDLEVBQUUsa0NBQWtDLENBQUM7UUFDckcsVUFBVSxFQUFFLElBQUEsZUFBUyxFQUFDLHNDQUFzQyxFQUFFLDREQUE0RCxDQUFDO1FBQzNILGNBQWMsRUFBRSxJQUFBLGVBQVMsRUFBQyx5Q0FBeUMsRUFBRSxzQ0FBc0MsQ0FBQztRQUM1RyxZQUFZLEVBQUUsSUFBQSxlQUFTLEVBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQztRQUN4RCx1QkFBdUIsRUFBRSxJQUFBLGVBQVMsRUFBQyxtREFBbUQsRUFBRSw0QkFBNEIsQ0FBQztRQUNySCxtQkFBbUIsRUFBRSxJQUFBLGVBQVMsRUFBQywrQ0FBK0MsRUFBRSx3QkFBd0IsQ0FBQztLQUN6RyxDQUFDIn0=