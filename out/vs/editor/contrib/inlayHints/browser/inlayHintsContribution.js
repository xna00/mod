/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/inlayHints/browser/inlayHintsController", "vs/editor/contrib/inlayHints/browser/inlayHintsHover"], function (require, exports, editorExtensions_1, hoverTypes_1, inlayHintsController_1, inlayHintsHover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, editorExtensions_1.registerEditorContribution)(inlayHintsController_1.InlayHintsController.ID, inlayHintsController_1.InlayHintsController, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    hoverTypes_1.HoverParticipantRegistry.register(inlayHintsHover_1.InlayHintsHover);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5sYXlIaW50c0NvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5sYXlIaW50cy9icm93c2VyL2lubGF5SGludHNDb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsSUFBQSw2Q0FBMEIsRUFBQywyQ0FBb0IsQ0FBQyxFQUFFLEVBQUUsMkNBQW9CLDJEQUFtRCxDQUFDO0lBQzVILHFDQUF3QixDQUFDLFFBQVEsQ0FBQyxpQ0FBZSxDQUFDLENBQUMifQ==