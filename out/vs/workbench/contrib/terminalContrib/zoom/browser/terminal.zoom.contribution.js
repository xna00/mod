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
define(["require", "exports", "vs/base/common/event", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/nls", "vs/base/common/types", "vs/workbench/contrib/terminal/common/terminalConfiguration"], function (require, exports, event_1, scrollableElement_1, lifecycle_1, platform_1, terminalExtensions_1, configuration_1, terminalActions_1, nls_1, types_1, terminalConfiguration_1) {
    "use strict";
    var TerminalMouseWheelZoomContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalMouseWheelZoomContribution = class TerminalMouseWheelZoomContribution extends lifecycle_1.Disposable {
        static { TerminalMouseWheelZoomContribution_1 = this; }
        static { this.ID = 'terminal.mouseWheelZoom'; }
        static get(instance) {
            return instance.getContribution(TerminalMouseWheelZoomContribution_1.ID);
        }
        constructor(instance, processManager, widgetManager, _configurationService) {
            super();
            this._configurationService = _configurationService;
            this._listener = this._register(new lifecycle_1.MutableDisposable());
        }
        xtermOpen(xterm) {
            this._register(event_1.Event.runAndSubscribe(this._configurationService.onDidChangeConfiguration, e => {
                if (!e || e.affectsConfiguration("terminal.integrated.mouseWheelZoom" /* TerminalSettingId.MouseWheelZoom */)) {
                    if (!!this._configurationService.getValue("terminal.integrated.mouseWheelZoom" /* TerminalSettingId.MouseWheelZoom */)) {
                        this._setupMouseWheelZoomListener(xterm.raw);
                    }
                    else {
                        this._listener.clear();
                    }
                }
            }));
        }
        _getConfigFontSize() {
            return this._configurationService.getValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */);
        }
        _setupMouseWheelZoomListener(raw) {
            // This is essentially a copy of what we do in the editor, just we modify font size directly
            // as there is no separate zoom level concept in the terminal
            const classifier = scrollableElement_1.MouseWheelClassifier.INSTANCE;
            let prevMouseWheelTime = 0;
            let gestureStartFontSize = this._getConfigFontSize();
            let gestureHasZoomModifiers = false;
            let gestureAccumulatedDelta = 0;
            raw.attachCustomWheelEventHandler((e) => {
                const browserEvent = e;
                if (classifier.isPhysicalMouseWheel()) {
                    if (this._hasMouseWheelZoomModifiers(browserEvent)) {
                        const delta = browserEvent.deltaY > 0 ? -1 : 1;
                        this._configurationService.updateValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */, this._getConfigFontSize() + delta);
                        // EditorZoom.setZoomLevel(zoomLevel + delta);
                        browserEvent.preventDefault();
                        browserEvent.stopPropagation();
                        return false;
                    }
                }
                else {
                    // we consider mousewheel events that occur within 50ms of each other to be part of the same gesture
                    // we don't want to consider mouse wheel events where ctrl/cmd is pressed during the inertia phase
                    // we also want to accumulate deltaY values from the same gesture and use that to set the zoom level
                    if (Date.now() - prevMouseWheelTime > 50) {
                        // reset if more than 50ms have passed
                        gestureStartFontSize = this._getConfigFontSize();
                        gestureHasZoomModifiers = this._hasMouseWheelZoomModifiers(browserEvent);
                        gestureAccumulatedDelta = 0;
                    }
                    prevMouseWheelTime = Date.now();
                    gestureAccumulatedDelta += browserEvent.deltaY;
                    if (gestureHasZoomModifiers) {
                        const deltaAbs = Math.ceil(Math.abs(gestureAccumulatedDelta / 5));
                        const deltaDirection = gestureAccumulatedDelta > 0 ? -1 : 1;
                        const delta = deltaAbs * deltaDirection;
                        this._configurationService.updateValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */, gestureStartFontSize + delta);
                        gestureAccumulatedDelta += browserEvent.deltaY;
                        browserEvent.preventDefault();
                        browserEvent.stopPropagation();
                        return false;
                    }
                }
                return true;
            });
            this._listener.value = (0, lifecycle_1.toDisposable)(() => raw.attachCustomWheelEventHandler(() => true));
        }
        _hasMouseWheelZoomModifiers(browserEvent) {
            return (platform_1.isMacintosh
                // on macOS we support cmd + two fingers scroll (`metaKey` set)
                // and also the two fingers pinch gesture (`ctrKey` set)
                ? ((browserEvent.metaKey || browserEvent.ctrlKey) && !browserEvent.shiftKey && !browserEvent.altKey)
                : (browserEvent.ctrlKey && !browserEvent.metaKey && !browserEvent.shiftKey && !browserEvent.altKey));
        }
    };
    TerminalMouseWheelZoomContribution = TerminalMouseWheelZoomContribution_1 = __decorate([
        __param(3, configuration_1.IConfigurationService)
    ], TerminalMouseWheelZoomContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalMouseWheelZoomContribution.ID, TerminalMouseWheelZoomContribution, true);
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.fontZoomIn" /* TerminalCommandId.FontZoomIn */,
        title: (0, nls_1.localize2)('fontZoomIn', 'Increase Font Size'),
        run: async (c, accessor) => {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const value = configurationService.getValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */);
            if ((0, types_1.isNumber)(value)) {
                await configurationService.updateValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */, value + 1);
            }
        }
    });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.fontZoomOut" /* TerminalCommandId.FontZoomOut */,
        title: (0, nls_1.localize2)('fontZoomOut', 'Decrease Font Size'),
        run: async (c, accessor) => {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const value = configurationService.getValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */);
            if ((0, types_1.isNumber)(value)) {
                await configurationService.updateValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */, value - 1);
            }
        }
    });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.fontZoomReset" /* TerminalCommandId.FontZoomReset */,
        title: (0, nls_1.localize2)('fontZoomReset', 'Reset Font Size'),
        run: async (c, accessor) => {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            await configurationService.updateValue("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */, terminalConfiguration_1.defaultTerminalFontSize);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuem9vbS5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi96b29tL2Jyb3dzZXIvdGVybWluYWwuem9vbS5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJoRyxJQUFNLGtDQUFrQyxHQUF4QyxNQUFNLGtDQUFtQyxTQUFRLHNCQUFVOztpQkFDMUMsT0FBRSxHQUFHLHlCQUF5QixBQUE1QixDQUE2QjtRQVEvQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQXVEO1lBQ2pFLE9BQU8sUUFBUSxDQUFDLGVBQWUsQ0FBcUMsb0NBQWtDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDNUcsQ0FBQztRQUlELFlBQ0MsUUFBdUQsRUFDdkQsY0FBOEQsRUFDOUQsYUFBb0MsRUFDYixxQkFBNkQ7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFGZ0MsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQU43RSxjQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztRQVM1RCxDQUFDO1FBRUQsU0FBUyxDQUFDLEtBQWlEO1lBQzFELElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQzdGLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLG9CQUFvQiw2RUFBa0MsRUFBRSxDQUFDO29CQUNwRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSw2RUFBa0MsRUFBRSxDQUFDO3dCQUM3RSxJQUFJLENBQUMsNEJBQTRC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