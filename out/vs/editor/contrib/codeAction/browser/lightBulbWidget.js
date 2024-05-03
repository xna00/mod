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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/touch", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/editor/common/model/utils", "vs/editor/contrib/codeAction/browser/codeAction", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybinding", "vs/css!./lightBulbWidget"], function (require, exports, dom, touch_1, codicons_1, event_1, lifecycle_1, themables_1, utils_1, codeAction_1, nls, commands_1, keybinding_1) {
    "use strict";
    var LightBulbWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LightBulbWidget = void 0;
    var LightBulbState;
    (function (LightBulbState) {
        let Type;
        (function (Type) {
            Type[Type["Hidden"] = 0] = "Hidden";
            Type[Type["Showing"] = 1] = "Showing";
        })(Type = LightBulbState.Type || (LightBulbState.Type = {}));
        LightBulbState.Hidden = { type: 0 /* Type.Hidden */ };
        class Showing {
            constructor(actions, trigger, editorPosition, widgetPosition) {
                this.actions = actions;
                this.trigger = trigger;
                this.editorPosition = editorPosition;
                this.widgetPosition = widgetPosition;
                this.type = 1 /* Type.Showing */;
            }
        }
        LightBulbState.Showing = Showing;
    })(LightBulbState || (LightBulbState = {}));
    let LightBulbWidget = class LightBulbWidget extends lifecycle_1.Disposable {
        static { LightBulbWidget_1 = this; }
        static { this.ID = 'editor.contrib.lightbulbWidget'; }
        static { this._posPref = [0 /* ContentWidgetPositionPreference.EXACT */]; }
        constructor(_editor, _keybindingService, commandService) {
            super();
            this._editor = _editor;
            this._keybindingService = _keybindingService;
            this._onClick = this._register(new event_1.Emitter());
            this.onClick = this._onClick.event;
            this._state = LightBulbState.Hidden;
            this._iconClasses = [];
            this._domNode = dom.$('div.lightBulbWidget');
            this._register(touch_1.Gesture.ignoreTarget(this._domNode));
            this._editor.addContentWidget(this);
            this._register(this._editor.onDidChangeModelContent(_ => {
                // cancel when the line in question has been removed
                const editorModel = this._editor.getModel();
                if (this.state.type !== 1 /* LightBulbState.Type.Showing */ || !editorModel || this.state.editorPosition.lineNumber >= editorModel.getLineCount()) {
                    this.hide();
                }
            }));
            this._register(dom.addStandardDisposableGenericMouseDownListener(this._domNode, e => {
                if (this.state.type !== 1 /* LightBulbState.Type.Showing */) {
                    return;
                }
                // Make sure that focus / cursor location is not lost when clicking widget icon
                this._editor.focus();
                e.preventDefault();
                // a bit of extra work to make sure the menu
                // doesn't cover the line-text
                const { top, height } = dom.getDomNodePagePosition(this._domNode);
                const lineHeight = this._editor.getOption(67 /* EditorOption.lineHeight */);
                let pad = Math.floor(lineHeight / 3);
                if (this.state.widgetPosition.position !== null && this.state.widgetPosition.position.lineNumber < this.state.editorPosition.lineNumber) {
                    pad += lineHeight;
                }
                this._onClick.fire({
                    x: e.posx,
                    y: top + height + pad,
                    actions: this.state.actions,
                    trigger: this.state.trigger,
                });
            }));
            this._register(dom.addDisposableListener(this._domNode, 'mouseenter', (e) => {
                if ((e.buttons & 1) !== 1) {
                    return;
                }
                // mouse enters lightbulb while the primary/left button
                // is being pressed -> hide the lightbulb
                this.hide();
            }));
            this._register(event_1.Event.runAndSubscribe(this._keybindingService.onDidUpdateKeybindings, () => {
                this._preferredKbLabel = this._keybindingService.lookupKeybinding(codeAction_1.autoFixCommandId)?.getLabel() ?? undefined;
                this._quickFixKbLabel = this._keybindingService.lookupKeybinding(codeAction_1.quickFixCommandId)?.getLabel() ?? undefined;
                this._updateLightBulbTitleAndIcon();
            }));
        }
        dispose() {
            super.dispose();
            this._editor.removeContentWidget(this);
        }
        getId() {
            return 'LightBulbWidget';
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return this._state.type === 1 /* LightBulbState.Type.Showing */ ? this._state.widgetPosition : null;
        }
        update(actions, trigger, atPosition) {
            if (actions.validActions.length <= 0) {
                return this.hide();
            }
            const options = this._editor.getOptions();
            if (!options.get(65 /* EditorOption.lightbulb */).enabled) {
                return this.hide();
            }
            const model = this._editor.getModel();
            if (!model) {
                return this.hide();
            }
            const { lineNumber, column } = model.validatePosition(atPosition);
            const tabSize = model.getOptions().tabSize;
            const fontInfo = this._editor.getOptions().get(50 /* EditorOption.fontInfo */);
            const lineContent = model.getLineContent(lineNumber);
            const indent = (0, utils_1.computeIndentLevel)(lineContent, tabSize);
            const lineHasSpace = fontInfo.spaceWidth * indent > 22;
            const isFolded = (lineNumber) => {
                return lineNumber > 2 && this._editor.getTopForLineNumber(lineNumber) === this._editor.getTopForLineNumber(lineNumber - 1);
            };
            let effectiveLineNumber = lineNumber;
            let effectiveColumnNumber = 1;
            if (!lineHasSpace) {
                if (lineNumber > 1 && !isFolded(lineNumber - 1)) {
                    effectiveLineNumber -= 1;
                }
                else if ((lineNumber < model.getLineCount()) && !isFolded(lineNumber + 1)) {
                    effectiveLineNumber += 1;
                }
                else if (column * fontInfo.spaceWidth < 22) {
                    // cannot show lightbulb above/below and showing
                    // it inline would overlay the cursor...
                    return this.hide();
                }
                effectiveColumnNumber = /^\S\s*$/.test(model.getLineContent(effectiveLineNumber)) ? 2 : 1;
            }
            this.state = new LightBulbState.Showing(actions, trigger, atPosition, {
                position: { lineNumber: effectiveLineNumber, column: effectiveColumnNumber },
                preference: LightBulbWidget_1._posPref
            });
            this._editor.layoutContentWidget(this);
        }
        hide() {
            if (this.state === LightBulbState.Hidden) {
                return;
            }
            this.state = LightBulbState.Hidden;
            this._editor.layoutContentWidget(this);
        }
        get state() { return this._state; }
        set state(value) {
            this._state = value;
            this._updateLightBulbTitleAndIcon();
        }
        _updateLightBulbTitleAndIcon() {
            this._domNode.classList.remove(...this._iconClasses);
            this._iconClasses = [];
            if (this.state.type !== 1 /* LightBulbState.Type.Showing */) {
                return;
            }
            let icon;
            let autoRun = false;
            if (this.state.actions.allAIFixes) {
                icon = codicons_1.Codicon.sparkleFilled;
                if (this.state.actions.validActions.length === 1) {
                    autoRun = true;
                }
            }
            else if (this.state.actions.hasAutoFix) {
                if (this.state.actions.hasAIFix) {
                    icon = codicons_1.Codicon.lightbulbSparkleAutofix;
                }
                else {
                    icon = codicons_1.Codicon.lightbulbAutofix;
                }
            }
            else if (this.state.actions.hasAIFix) {
                icon = codicons_1.Codicon.lightbulbSparkle;
            }
            else {
                icon = codicons_1.Codicon.lightBulb;
            }
            this._updateLightbulbTitle(this.state.actions.hasAutoFix, autoRun);
            this._iconClasses = themables_1.ThemeIcon.asClassNameArray(icon);
            this._domNode.classList.add(...this._iconClasses);
        }
        _updateLightbulbTitle(autoFix, autoRun) {
            if (this.state.type !== 1 /* LightBulbState.Type.Showing */) {
                return;
            }
            if (autoRun) {
                this.title = nls.localize('codeActionAutoRun', "Run: {0}", this.state.actions.validActions[0].action.title);
            }
            else if (autoFix && this._preferredKbLabel) {
                this.title = nls.localize('preferredcodeActionWithKb', "Show Code Actions. Preferred Quick Fix Available ({0})", this._preferredKbLabel);
            }
            else if (!autoFix && this._quickFixKbLabel) {
                this.title = nls.localize('codeActionWithKb', "Show Code Actions ({0})", this._quickFixKbLabel);
            }
            else if (!autoFix) {
                this.title = nls.localize('codeAction', "Show Code Actions");
            }
        }
        set title(value) {
            this._domNode.title = value;
        }
    };
    exports.LightBulbWidget = LightBulbWidget;
    exports.LightBulbWidget = LightBulbWidget = LightBulbWidget_1 = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, commands_1.ICommandService)
    ], LightBulbWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlnaHRCdWxiV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jb2RlQWN0aW9uL2Jyb3dzZXIvbGlnaHRCdWxiV2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFtQmhHLElBQVUsY0FBYyxDQXFCdkI7SUFyQkQsV0FBVSxjQUFjO1FBRXZCLElBQWtCLElBR2pCO1FBSEQsV0FBa0IsSUFBSTtZQUNyQixtQ0FBTSxDQUFBO1lBQ04scUNBQU8sQ0FBQTtRQUNSLENBQUMsRUFIaUIsSUFBSSxHQUFKLG1CQUFJLEtBQUosbUJBQUksUUFHckI7UUFFWSxxQkFBTSxHQUFHLEVBQUUsSUFBSSxxQkFBYSxFQUFXLENBQUM7UUFFckQsTUFBYSxPQUFPO1lBR25CLFlBQ2lCLE9BQXNCLEVBQ3RCLE9BQTBCLEVBQzFCLGNBQXlCLEVBQ3pCLGNBQXNDO2dCQUh0QyxZQUFPLEdBQVAsT0FBTyxDQUFlO2dCQUN0QixZQUFPLEdBQVAsT0FBTyxDQUFtQjtnQkFDMUIsbUJBQWMsR0FBZCxjQUFjLENBQVc7Z0JBQ3pCLG1CQUFjLEdBQWQsY0FBYyxDQUF3QjtnQkFOOUMsU0FBSSx3QkFBZ0I7WUFPekIsQ0FBQztTQUNMO1FBVFksc0JBQU8sVUFTbkIsQ0FBQTtJQUdGLENBQUMsRUFyQlMsY0FBYyxLQUFkLGNBQWMsUUFxQnZCO0lBRU0sSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxzQkFBVTs7aUJBRXZCLE9BQUUsR0FBRyxnQ0FBZ0MsQUFBbkMsQ0FBb0M7aUJBRXJDLGFBQVEsR0FBRywrQ0FBdUMsQUFBMUMsQ0FBMkM7UUFhM0UsWUFDa0IsT0FBb0IsRUFDakIsa0JBQXVELEVBQzFELGNBQStCO1lBRWhELEtBQUssRUFBRSxDQUFDO1lBSlMsWUFBTyxH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