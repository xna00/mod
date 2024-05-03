/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/contrib/stickyScroll/browser/stickyScrollActions", "vs/editor/contrib/stickyScroll/browser/stickyScrollController", "vs/platform/actions/common/actions"], function (require, exports, editorExtensions_1, stickyScrollActions_1, stickyScrollController_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, editorExtensions_1.registerEditorContribution)(stickyScrollController_1.StickyScrollController.ID, stickyScrollController_1.StickyScrollController, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    (0, actions_1.registerAction2)(stickyScrollActions_1.ToggleStickyScroll);
    (0, actions_1.registerAction2)(stickyScrollActions_1.FocusStickyScroll);
    (0, actions_1.registerAction2)(stickyScrollActions_1.SelectPreviousStickyScrollLine);
    (0, actions_1.registerAction2)(stickyScrollActions_1.SelectNextStickyScrollLine);
    (0, actions_1.registerAction2)(stickyScrollActions_1.GoToStickyScrollLine);
    (0, actions_1.registerAction2)(stickyScrollActions_1.SelectEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5U2Nyb2xsQ29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zdGlja3lTY3JvbGwvYnJvd3Nlci9zdGlja3lTY3JvbGxDb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsSUFBQSw2Q0FBMEIsRUFBQywrQ0FBc0IsQ0FBQyxFQUFFLEVBQUUsK0NBQXNCLDJEQUFtRCxDQUFDO0lBQ2hJLElBQUEseUJBQWUsRUFBQyx3Q0FBa0IsQ0FBQyxDQUFDO0lBQ3BDLElBQUEseUJBQWUsRUFBQyx1Q0FBaUIsQ0FBQyxDQUFDO0lBQ25DLElBQUEseUJBQWUsRUFBQyxvREFBOEIsQ0FBQyxDQUFDO0lBQ2hELElBQUEseUJBQWUsRUFBQyxnREFBMEIsQ0FBQyxDQUFDO0lBQzVDLElBQUEseUJBQWUsRUFBQywwQ0FBb0IsQ0FBQyxDQUFDO0lBQ3RDLElBQUEseUJBQWUsRUFBQyxrQ0FBWSxDQUFDLENBQUMifQ==