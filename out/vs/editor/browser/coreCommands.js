/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/browser", "vs/base/common/types", "vs/base/browser/ui/aria/aria", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/cursor/cursorColumnSelection", "vs/editor/common/cursorCommon", "vs/editor/common/cursor/cursorDeleteOperations", "vs/editor/common/cursor/cursorMoveCommands", "vs/editor/common/cursor/cursorTypeOperations", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/browser/dom"], function (require, exports, nls, browser_1, types, aria_1, editorExtensions_1, codeEditorService_1, cursorColumnSelection_1, cursorCommon_1, cursorDeleteOperations_1, cursorMoveCommands_1, cursorTypeOperations_1, position_1, range_1, editorContextKeys_1, contextkey_1, keybindingsRegistry_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CoreEditingCommands = exports.CoreNavigationCommands = exports.NavigationCommandRevealType = exports.RevealLine_ = exports.EditorScroll_ = exports.CoreEditorCommand = void 0;
    const CORE_WEIGHT = 0 /* KeybindingWeight.EditorCore */;
    class CoreEditorCommand extends editorExtensions_1.EditorCommand {
        runEditorCommand(accessor, editor, args) {
            const viewModel = editor._getViewModel();
            if (!viewModel) {
                // the editor has no view => has no cursors
                return;
            }
            this.runCoreEditorCommand(viewModel, args || {});
        }
    }
    exports.CoreEditorCommand = CoreEditorCommand;
    var EditorScroll_;
    (function (EditorScroll_) {
        const isEditorScrollArgs = function (arg) {
            if (!types.isObject(arg)) {
                return false;
            }
            const scrollArg = arg;
            if (!types.isString(scrollArg.to)) {
                return false;
            }
            if (!types.isUndefined(scrollArg.by) && !types.isString(scrollArg.by)) {
                return false;
            }
            if (!types.isUndefined(scrollArg.value) && !types.isNumber(scrollArg.value)) {
                return false;
            }
            if (!types.isUndefined(scrollArg.revealCursor) && !types.isBoolean(scrollArg.revealCursor)) {
                return false;
            }
            return true;
        };
        EditorScroll_.metadata = {
            description: 'Scroll editor in the given direction',
            args: [
                {
                    name: 'Editor scroll argument object',
                    description: `Property-value pairs that can be passed through this argument:
					* 'to': A mandatory direction value.
						\`\`\`
						'up', 'down'
						\`\`\`
					* 'by': Unit to move. Default is computed based on 'to' value.
						\`\`\`
						'line', 'wrappedLine', 'page', 'halfPage', 'editor'
						\`\`\`
					* 'value': Number of units to move. Default is '1'.
					* 'revealCursor': If 'true' reveals the cursor if it is outside view port.
				`,
                    constraint: isEditorScrollArgs,
                    schema: {
                        'type': 'object',
                        'required': ['to'],
                        'properties': {
                            'to': {
                                'type': 'string',
                                'enum': ['up', 'down']
                            },
                            'by': {
                                'type': 'string',
                                'enum': ['line', 'wrappedLine', 'page', 'halfPage', 'editor']
                            },
                            'value': {
                                'type': 'number',
                                'default': 1
                            },
                            'revealCursor': {
                                'type': 'boolean',
                            }
                        }
                    }
                }
            ]
        };
        /**
         * Directions in the view for editor scroll command.
         */
        EditorScroll_.RawDirection = {
            Up: 'up',
            Right: 'right',
            Down: 'down',
            Left: 'left'
        };
        /**
         * Units for editor scroll 'by' argument
         */
        EditorScroll_.RawUnit = {
            Line: 'line',
            WrappedLine: 'wrappedLine',
            Page: 'page',
            HalfPage: 'halfPage',
            Editor: 'editor',
            Column: 'column'
        };
        function parse(args) {
            let direction;
            switch (args.to) {
                case EditorScroll_.RawDirection.Up:
                    direction = 1 /* Direction.Up */;
                    break;
                case EditorScroll_.RawDirection.Right:
                    direction = 2 /* Direction.Right */;
                    break;
                case EditorScroll_.RawDirection.Down:
                    direction = 3 /* Direction.Down */;
                    break;
                case EditorScroll_.RawDirection.Left:
                    direction = 4 /* Direction.Left */;
                    break;
                default:
                    // Illegal arguments
                    return null;
            }
            let unit;
            switch (args.by) {
                case EditorScroll_.RawUnit.Line:
                    unit = 1 /* Unit.Line */;
                    break;
                case EditorScroll_.RawUnit.WrappedLine:
                    unit = 2 /* Unit.WrappedLine */;
                    break;
                case EditorScroll_.RawUnit.Page:
                    unit = 3 /* Unit.Page */;
                    break;
                case EditorScroll_.RawUnit.HalfPage:
                    unit = 4 /* Unit.HalfPage */;
                    break;
                case EditorScroll_.RawUnit.Editor:
                    unit = 5 /* Unit.Editor */;
                    break;
                case EditorScroll_.RawUnit.Column:
                    unit = 6 /* Unit.Column */;
                    break;
                default:
                    unit = 2 /* Unit.WrappedLine */;
            }
            const value = Math.floor(args.value || 1);
            const revealCursor = !!args.revealCursor;
            return {
                direction: direction,
                unit: unit,
                value: value,
                revealCursor: revealCursor,
                select: (!!args.select)
            };
        }
        EditorScroll_.parse = parse;
        let Direction;
        (function (Direction) {
            Direction[Direction["Up"] = 1] = "Up";
            Direction[Direction["Right"] = 2] = "Right";
            Direction[Direction["Down"] = 3] = "Down";
            Direction[Direction["Left"] = 4] = "Left";
        })(Direction = EditorScroll_.Direction || (EditorScroll_.Direction = {}));
        let Unit;
        (function (Unit) {
            Unit[Unit["Line"] = 1] = "Line";
            Unit[Unit["WrappedLine"] = 2] = "WrappedLine";
            Unit[Unit["Page"] = 3] = "Page";
            Unit[Unit["HalfPage"] = 4] = "HalfPage";
            Unit[Unit["Editor"] = 5] = "Editor";
            Unit[Unit["Column"] = 6] = "Column";
        })(Unit = EditorScroll_.Unit || (EditorScroll_.Unit = {}));
    })(EditorScroll_ || (exports.EditorScroll_ = EditorScroll_ = {}));
    var RevealLine_;
    (function (RevealLine_) {
        const isRevealLineArgs = function (arg) {
            if (!types.isObject(arg)) {
                return false;
            }
            const reveaLineArg = arg;
            if (!types.isNumber(reveaLineArg.lineNumber) && !types.isString(reveaLineArg.lineNumber)) {
                return false;
            }
            if (!types.isUndefined(reveaLineArg.at) && !types.isString(reveaLineArg.at)) {
                return false;
            }
            return true;
        };
        RevealLine_.metadata = {
            description: 'Reveal the given line at the given logical position',
            args: [
                {
                    name: 'Reveal line argument object',
                    description: `Property-value pairs that can be passed through this argument:
					* 'lineNumber': A mandatory line number value.
					* 'at': Logical position at which line has to be revealed.
						\`\`\`
						'top', 'center', 'bottom'
						\`\`\`
				`,
                    constraint: isRevealLineArgs,
                    schema: {
                        'type': 'object',
                        'required': ['lineNumber'],
                        'properties': {
                            'lineNumber': {
                                'type': ['number', 'string'],
                            },
                            'at': {
                                'type': 'string',
                                'enum': ['top', 'center', 'bottom']
                            }
                        }
                    }
                }
            ]
        };
        /**
         * Values for reveal line 'at' argument
         */
        RevealLine_.RawAtArgument = {
            Top: 'top',
            Center: 'center',
            Bottom: 'bottom'
        };
    })(RevealLine_ || (exports.RevealLine_ = RevealLine_ = {}));
    class EditorOrNativeTextInputCommand {
        constructor(target) {
            // 1. handle case when focus is in editor.
            target.addImplementation(10000, 'code-editor', (accessor, args) => {
                // Only if editor text focus (i.e. not if editor has widget focus).
                const focusedEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
                if (focusedEditor && focusedEditor.hasTextFocus()) {
                    return this._runEditorCommand(accessor, focusedEditor, args);
                }
                return false;
            });
            // 2. handle case when focus is in some other `input` / `textarea`.
            target.addImplementation(1000, 'generic-dom-input-textarea', (accessor, args) => {
                // Only if focused on an element that allows for entering text
                const activeElement = (0, dom_1.getActiveElement)();
                if (activeElement && ['input', 'textarea'].indexOf(activeElement.tagName.toLowerCase()) >= 0) {
                    this.runDOMCommand(activeElement);
                    return true;
                }
                return false;
            });
            // 3. (default) handle case when focus is somewhere else.
            target.addImplementation(0, 'generic-dom', (accessor, args) => {
                // Redirecting to active editor
                const activeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getActiveCodeEditor();
                if (activeEditor) {
                    activeEditor.focus();
                    return this._runEditorCommand(accessor, activeEditor, args);
                }
                return false;
            });
        }
        _runEditorCommand(accessor, editor, args) {
            const result = this.runEditorCommand(accessor, editor, args);
            if (result) {
                return result;
            }
            return true;
        }
    }
    var NavigationCommandRevealType;
    (function (NavigationCommandRevealType) {
        /**
         * Do regular revealing.
         */
        NavigationCommandRevealType[NavigationCommandRevealType["Regular"] = 0] = "Regular";
        /**
         * Do only minimal revealing.
         */
        NavigationCommandRevealType[NavigationCommandRevealType["Minimal"] = 1] = "Minimal";
        /**
         * Do not reveal the position.
         */
        NavigationCommandRevealType[NavigationCommandRevealType["None"] = 2] = "None";
    })(NavigationCommandRevealType || (exports.NavigationCommandRevealType = NavigationCommandRevealType = {}));
    var CoreNavigationCommands;
    (function (CoreNavigationCommands) {
        class BaseMoveToCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.position) {
                    return;
                }
                viewModel.model.pushStackElement();
                const cursorStateChanged = viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, [
                    cursorMoveCommands_1.CursorMoveCommands.moveTo(viewModel, viewModel.getPrimaryCursorState(), this._inSelectionMode, args.position, args.viewPosition)
                ]);
                if (cursorStateChanged && args.revealType !== 2 /* NavigationCommandRevealType.None */) {
                    viewModel.revealAllCursors(args.source, true, true);
                }
            }
        }
        CoreNavigationCommands.MoveTo = (0, editorExtensions_1.registerEditorCommand)(new BaseMoveToCommand({
            id: '_moveTo',
            inSelectionMode: false,
            precondition: undefined
        }));
        CoreNavigationCommands.MoveToSelect = (0, editorExtensions_1.registerEditorCommand)(new BaseMoveToCommand({
            id: '_moveToSelect',
            inSelectionMode: true,
            precondition: undefined
        }));
        class ColumnSelectCommand extends CoreEditorCommand {
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                const result = this._getColumnSelectResult(viewModel, viewModel.getPrimaryCursorState(), viewModel.getCursorColumnSelectData(), args);
                if (result === null) {
                    // invalid arguments
                    return;
                }
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, result.viewStates.map((viewState) => cursorCommon_1.CursorState.fromViewState(viewState)));
                viewModel.setCursorColumnSelectData({
                    isReal: true,
                    fromViewLineNumber: result.fromLineNumber,
                    fromViewVisualColumn: result.fromVisualColumn,
                    toViewLineNumber: result.toLineNumber,
                    toViewVisualColumn: result.toVisualColumn
                });
                if (result.reversed) {
                    viewModel.revealTopMostCursor(args.source);
                }
                else {
                    viewModel.revealBottomMostCursor(args.source);
                }
            }
        }
        CoreNavigationCommands.ColumnSelect = (0, editorExtensions_1.registerEditorCommand)(new class extends ColumnSelectCommand {
            constructor() {
                super({
                    id: 'columnSelect',
                    precondition: undefined
                });
            }
            _getColumnSelectResult(viewModel, primary, prevColumnSelectData, args) {
                if (typeof args.position === 'undefined' || typeof args.viewPosition === 'undefined' || typeof args.mouseColumn === 'undefined') {
                    return null;
                }
                // validate `args`
                const validatedPosition = viewModel.model.validatePosition(args.position);
                const validatedViewPosition = viewModel.coordinatesConverter.validateViewPosition(new position_1.Position(args.viewPosition.lineNumber, args.viewPosition.column), validatedPosition);
                const fromViewLineNumber = args.doColumnSelect ? prevColumnSelectData.fromViewLineNumber : validatedViewPosition.lineNumber;
                const fromViewVisualColumn = args.doColumnSelect ? prevColumnSelectData.fromViewVisualColumn : args.mouseColumn - 1;
                return cursorColumnSelection_1.ColumnSelection.columnSelect(viewModel.cursorConfig, viewModel, fromViewLineNumber, fromViewVisualColumn, validatedViewPosition.lineNumber, args.mouseColumn - 1);
            }
        });
        CoreNavigationCommands.CursorColumnSelectLeft = (0, editorExtensions_1.registerEditorCommand)(new class extends ColumnSelectCommand {
            constructor() {
                super({
                    id: 'cursorColumnSelectLeft',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */,
                        linux: { primary: 0 }
                    }
                });
            }
            _getColumnSelectResult(viewModel, primary, prevColumnSelectData, args) {
                return cursorColumnSelection_1.ColumnSelection.columnSelectLeft(viewModel.cursorConfig, viewModel, prevColumnSelectData);
            }
        });
        CoreNavigationCommands.CursorColumnSelectRight = (0, editorExtensions_1.registerEditorCommand)(new class extends ColumnSelectCommand {
            constructor() {
                super({
                    id: 'cursorColumnSelectRight',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */,
                        linux: { primary: 0 }
                    }
                });
            }
            _getColumnSelectResult(viewModel, primary, prevColumnSelectData, args) {
                return cursorColumnSelection_1.ColumnSelection.columnSelectRight(viewModel.cursorConfig, viewModel, prevColumnSelectData);
            }
        });
        class ColumnSelectUpCommand extends ColumnSelectCommand {
            constructor(opts) {
                super(opts);
                this._isPaged = opts.isPaged;
            }
            _getColumnSelectResult(viewModel, primary, prevColumnSelectData, args) {
                return cursorColumnSelection_1.ColumnSelection.columnSelectUp(viewModel.cursorConfig, viewModel, prevColumnSelectData, this._isPaged);
            }
        }
        CoreNavigationCommands.CursorColumnSelectUp = (0, editorExtensions_1.registerEditorCommand)(new ColumnSelectUpCommand({
            isPaged: false,
            id: 'cursorColumnSelectUp',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
                linux: { primary: 0 }
            }
        }));
        CoreNavigationCommands.CursorColumnSelectPageUp = (0, editorExtensions_1.registerEditorCommand)(new ColumnSelectUpCommand({
            isPaged: true,
            id: 'cursorColumnSelectPageUp',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */,
                linux: { primary: 0 }
            }
        }));
        class ColumnSelectDownCommand extends ColumnSelectCommand {
            constructor(opts) {
                super(opts);
                this._isPaged = opts.isPaged;
            }
            _getColumnSelectResult(viewModel, primary, prevColumnSelectData, args) {
                return cursorColumnSelection_1.ColumnSelection.columnSelectDown(viewModel.cursorConfig, viewModel, prevColumnSelectData, this._isPaged);
            }
        }
        CoreNavigationCommands.CursorColumnSelectDown = (0, editorExtensions_1.registerEditorCommand)(new ColumnSelectDownCommand({
            isPaged: false,
            id: 'cursorColumnSelectDown',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
                linux: { primary: 0 }
            }
        }));
        CoreNavigationCommands.CursorColumnSelectPageDown = (0, editorExtensions_1.registerEditorCommand)(new ColumnSelectDownCommand({
            isPaged: true,
            id: 'cursorColumnSelectPageDown',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */,
                linux: { primary: 0 }
            }
        }));
        class CursorMoveImpl extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'cursorMove',
                    precondition: undefined,
                    metadata: cursorMoveCommands_1.CursorMove.metadata
                });
            }
            runCoreEditorCommand(viewModel, args) {
                const parsed = cursorMoveCommands_1.CursorMove.parse(args);
                if (!parsed) {
                    // illegal arguments
                    return;
                }
                this._runCursorMove(viewModel, args.source, parsed);
            }
            _runCursorMove(viewModel, source, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(source, 3 /* CursorChangeReason.Explicit */, CursorMoveImpl._move(viewModel, viewModel.getCursorStates(), args));
                viewModel.revealAllCursors(source, true);
            }
            static _move(viewModel, cursors, args) {
                const inSelectionMode = args.select;
                const value = args.value;
                switch (args.direction) {
                    case 0 /* CursorMove_.Direction.Left */:
                    case 1 /* CursorMove_.Direction.Right */:
                    case 2 /* CursorMove_.Direction.Up */:
                    case 3 /* CursorMove_.Direction.Down */:
                    case 4 /* CursorMove_.Direction.PrevBlankLine */:
                    case 5 /* CursorMove_.Direction.NextBlankLine */:
                    case 6 /* CursorMove_.Direction.WrappedLineStart */:
                    case 7 /* CursorMove_.Direction.WrappedLineFirstNonWhitespaceCharacter */:
                    case 8 /* CursorMove_.Direction.WrappedLineColumnCenter */:
                    case 9 /* CursorMove_.Direction.WrappedLineEnd */:
                    case 10 /* CursorMove_.Direction.WrappedLineLastNonWhitespaceCharacter */:
                        return cursorMoveCommands_1.CursorMoveCommands.simpleMove(viewModel, cursors, args.direction, inSelectionMode, value, args.unit);
                    case 11 /* CursorMove_.Direction.ViewPortTop */:
                    case 13 /* CursorMove_.Direction.ViewPortBottom */:
                    case 12 /* CursorMove_.Direction.ViewPortCenter */:
                    case 14 /* CursorMove_.Direction.ViewPortIfOutside */:
                        return cursorMoveCommands_1.CursorMoveCommands.viewportMove(viewModel, cursors, args.direction, inSelectionMode, value);
                    default:
                        return null;
                }
            }
        }
        CoreNavigationCommands.CursorMoveImpl = CursorMoveImpl;
        CoreNavigationCommands.CursorMove = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveImpl());
        let Constants;
        (function (Constants) {
            Constants[Constants["PAGE_SIZE_MARKER"] = -1] = "PAGE_SIZE_MARKER";
        })(Constants || (Constants = {}));
        class CursorMoveBasedCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._staticArgs = opts.args;
            }
            runCoreEditorCommand(viewModel, dynamicArgs) {
                let args = this._staticArgs;
                if (this._staticArgs.value === -1 /* Constants.PAGE_SIZE_MARKER */) {
                    // -1 is a marker for page size
                    args = {
                        direction: this._staticArgs.direction,
                        unit: this._staticArgs.unit,
                        select: this._staticArgs.select,
                        value: dynamicArgs.pageSize || viewModel.cursorConfig.pageSize
                    };
                }
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(dynamicArgs.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.simpleMove(viewModel, viewModel.getCursorStates(), args.direction, args.select, args.value, args.unit));
                viewModel.revealAllCursors(dynamicArgs.source, true);
            }
        }
        CoreNavigationCommands.CursorLeft = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 0 /* CursorMove_.Direction.Left */,
                unit: 0 /* CursorMove_.Unit.None */,
                select: false,
                value: 1
            },
            id: 'cursorLeft',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 15 /* KeyCode.LeftArrow */,
                mac: { primary: 15 /* KeyCode.LeftArrow */, secondary: [256 /* KeyMod.WinCtrl */ | 32 /* KeyCode.KeyB */] }
            }
        }));
        CoreNavigationCommands.CursorLeftSelect = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 0 /* CursorMove_.Direction.Left */,
                unit: 0 /* CursorMove_.Unit.None */,
                select: true,
                value: 1
            },
            id: 'cursorLeftSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */
            }
        }));
        CoreNavigationCommands.CursorRight = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 1 /* CursorMove_.Direction.Right */,
                unit: 0 /* CursorMove_.Unit.None */,
                select: false,
                value: 1
            },
            id: 'cursorRight',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 17 /* KeyCode.RightArrow */,
                mac: { primary: 17 /* KeyCode.RightArrow */, secondary: [256 /* KeyMod.WinCtrl */ | 36 /* KeyCode.KeyF */] }
            }
        }));
        CoreNavigationCommands.CursorRightSelect = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 1 /* CursorMove_.Direction.Right */,
                unit: 0 /* CursorMove_.Unit.None */,
                select: true,
                value: 1
            },
            id: 'cursorRightSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */
            }
        }));
        CoreNavigationCommands.CursorUp = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 2 /* CursorMove_.Direction.Up */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: false,
                value: 1
            },
            id: 'cursorUp',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 16 /* KeyCode.UpArrow */,
                mac: { primary: 16 /* KeyCode.UpArrow */, secondary: [256 /* KeyMod.WinCtrl */ | 46 /* KeyCode.KeyP */] }
            }
        }));
        CoreNavigationCommands.CursorUpSelect = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 2 /* CursorMove_.Direction.Up */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: true,
                value: 1
            },
            id: 'cursorUpSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */,
                secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */],
                mac: { primary: 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */ },
                linux: { primary: 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */ }
            }
        }));
        CoreNavigationCommands.CursorPageUp = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 2 /* CursorMove_.Direction.Up */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: false,
                value: -1 /* Constants.PAGE_SIZE_MARKER */
            },
            id: 'cursorPageUp',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 11 /* KeyCode.PageUp */
            }
        }));
        CoreNavigationCommands.CursorPageUpSelect = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 2 /* CursorMove_.Direction.Up */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: true,
                value: -1 /* Constants.PAGE_SIZE_MARKER */
            },
            id: 'cursorPageUpSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 11 /* KeyCode.PageUp */
            }
        }));
        CoreNavigationCommands.CursorDown = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 3 /* CursorMove_.Direction.Down */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: false,
                value: 1
            },
            id: 'cursorDown',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 18 /* KeyCode.DownArrow */,
                mac: { primary: 18 /* KeyCode.DownArrow */, secondary: [256 /* KeyMod.WinCtrl */ | 44 /* KeyCode.KeyN */] }
            }
        }));
        CoreNavigationCommands.CursorDownSelect = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 3 /* CursorMove_.Direction.Down */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: true,
                value: 1
            },
            id: 'cursorDownSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */,
                secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */],
                mac: { primary: 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */ },
                linux: { primary: 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */ }
            }
        }));
        CoreNavigationCommands.CursorPageDown = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 3 /* CursorMove_.Direction.Down */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: false,
                value: -1 /* Constants.PAGE_SIZE_MARKER */
            },
            id: 'cursorPageDown',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 12 /* KeyCode.PageDown */
            }
        }));
        CoreNavigationCommands.CursorPageDownSelect = (0, editorExtensions_1.registerEditorCommand)(new CursorMoveBasedCommand({
            args: {
                direction: 3 /* CursorMove_.Direction.Down */,
                unit: 2 /* CursorMove_.Unit.WrappedLine */,
                select: true,
                value: -1 /* Constants.PAGE_SIZE_MARKER */
            },
            id: 'cursorPageDownSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 12 /* KeyCode.PageDown */
            }
        }));
        CoreNavigationCommands.CreateCursor = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'createCursor',
                    precondition: undefined
                });
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.position) {
                    return;
                }
                let newState;
                if (args.wholeLine) {
                    newState = cursorMoveCommands_1.CursorMoveCommands.line(viewModel, viewModel.getPrimaryCursorState(), false, args.position, args.viewPosition);
                }
                else {
                    newState = cursorMoveCommands_1.CursorMoveCommands.moveTo(viewModel, viewModel.getPrimaryCursorState(), false, args.position, args.viewPosition);
                }
                const states = viewModel.getCursorStates();
                // Check if we should remove a cursor (sort of like a toggle)
                if (states.length > 1) {
                    const newModelPosition = (newState.modelState ? newState.modelState.position : null);
                    const newViewPosition = (newState.viewState ? newState.viewState.position : null);
                    for (let i = 0, len = states.length; i < len; i++) {
                        const state = states[i];
                        if (newModelPosition && !state.modelState.selection.containsPosition(newModelPosition)) {
                            continue;
                        }
                        if (newViewPosition && !state.viewState.selection.containsPosition(newViewPosition)) {
                            continue;
                        }
                        // => Remove the cursor
                        states.splice(i, 1);
                        viewModel.model.pushStackElement();
                        viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, states);
                        return;
                    }
                }
                // => Add the new cursor
                states.push(newState);
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, states);
            }
        });
        CoreNavigationCommands.LastCursorMoveToSelect = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: '_lastCursorMoveToSelect',
                    precondition: undefined
                });
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.position) {
                    return;
                }
                const lastAddedCursorIndex = viewModel.getLastAddedCursorIndex();
                const states = viewModel.getCursorStates();
                const newStates = states.slice(0);
                newStates[lastAddedCursorIndex] = cursorMoveCommands_1.CursorMoveCommands.moveTo(viewModel, states[lastAddedCursorIndex], true, args.position, args.viewPosition);
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, newStates);
            }
        });
        class HomeCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.moveToBeginningOfLine(viewModel, viewModel.getCursorStates(), this._inSelectionMode));
                viewModel.revealAllCursors(args.source, true);
            }
        }
        CoreNavigationCommands.CursorHome = (0, editorExtensions_1.registerEditorCommand)(new HomeCommand({
            inSelectionMode: false,
            id: 'cursorHome',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 14 /* KeyCode.Home */,
                mac: { primary: 14 /* KeyCode.Home */, secondary: [2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */] }
            }
        }));
        CoreNavigationCommands.CursorHomeSelect = (0, editorExtensions_1.registerEditorCommand)(new HomeCommand({
            inSelectionMode: true,
            id: 'cursorHomeSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 14 /* KeyCode.Home */,
                mac: { primary: 1024 /* KeyMod.Shift */ | 14 /* KeyCode.Home */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */] }
            }
        }));
        class LineStartCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, this._exec(viewModel.getCursorStates()));
                viewModel.revealAllCursors(args.source, true);
            }
            _exec(cursors) {
                const result = [];
                for (let i = 0, len = cursors.length; i < len; i++) {
                    const cursor = cursors[i];
                    const lineNumber = cursor.modelState.position.lineNumber;
                    result[i] = cursorCommon_1.CursorState.fromModelState(cursor.modelState.move(this._inSelectionMode, lineNumber, 1, 0));
                }
                return result;
            }
        }
        CoreNavigationCommands.CursorLineStart = (0, editorExtensions_1.registerEditorCommand)(new LineStartCommand({
            inSelectionMode: false,
            id: 'cursorLineStart',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 0,
                mac: { primary: 256 /* KeyMod.WinCtrl */ | 31 /* KeyCode.KeyA */ }
            }
        }));
        CoreNavigationCommands.CursorLineStartSelect = (0, editorExtensions_1.registerEditorCommand)(new LineStartCommand({
            inSelectionMode: true,
            id: 'cursorLineStartSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 0,
                mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 31 /* KeyCode.KeyA */ }
            }
        }));
        class EndCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.moveToEndOfLine(viewModel, viewModel.getCursorStates(), this._inSelectionMode, args.sticky || false));
                viewModel.revealAllCursors(args.source, true);
            }
        }
        CoreNavigationCommands.CursorEnd = (0, editorExtensions_1.registerEditorCommand)(new EndCommand({
            inSelectionMode: false,
            id: 'cursorEnd',
            precondition: undefined,
            kbOpts: {
                args: { sticky: false },
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 13 /* KeyCode.End */,
                mac: { primary: 13 /* KeyCode.End */, secondary: [2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */] }
            },
            metadata: {
                description: `Go to End`,
                args: [{
                        name: 'args',
                        schema: {
                            type: 'object',
                            properties: {
                                'sticky': {
                                    description: nls.localize('stickydesc', "Stick to the end even when going to longer lines"),
                                    type: 'boolean',
                                    default: false
                                }
                            }
                        }
                    }]
            }
        }));
        CoreNavigationCommands.CursorEndSelect = (0, editorExtensions_1.registerEditorCommand)(new EndCommand({
            inSelectionMode: true,
            id: 'cursorEndSelect',
            precondition: undefined,
            kbOpts: {
                args: { sticky: false },
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 1024 /* KeyMod.Shift */ | 13 /* KeyCode.End */,
                mac: { primary: 1024 /* KeyMod.Shift */ | 13 /* KeyCode.End */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */] }
            },
            metadata: {
                description: `Select to End`,
                args: [{
                        name: 'args',
                        schema: {
                            type: 'object',
                            properties: {
                                'sticky': {
                                    description: nls.localize('stickydesc', "Stick to the end even when going to longer lines"),
                                    type: 'boolean',
                                    default: false
                                }
                            }
                        }
                    }]
            }
        }));
        class LineEndCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, this._exec(viewModel, viewModel.getCursorStates()));
                viewModel.revealAllCursors(args.source, true);
            }
            _exec(viewModel, cursors) {
                const result = [];
                for (let i = 0, len = cursors.length; i < len; i++) {
                    const cursor = cursors[i];
                    const lineNumber = cursor.modelState.position.lineNumber;
                    const maxColumn = viewModel.model.getLineMaxColumn(lineNumber);
                    result[i] = cursorCommon_1.CursorState.fromModelState(cursor.modelState.move(this._inSelectionMode, lineNumber, maxColumn, 0));
                }
                return result;
            }
        }
        CoreNavigationCommands.CursorLineEnd = (0, editorExtensions_1.registerEditorCommand)(new LineEndCommand({
            inSelectionMode: false,
            id: 'cursorLineEnd',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 0,
                mac: { primary: 256 /* KeyMod.WinCtrl */ | 35 /* KeyCode.KeyE */ }
            }
        }));
        CoreNavigationCommands.CursorLineEndSelect = (0, editorExtensions_1.registerEditorCommand)(new LineEndCommand({
            inSelectionMode: true,
            id: 'cursorLineEndSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 0,
                mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 35 /* KeyCode.KeyE */ }
            }
        }));
        class TopCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.moveToBeginningOfBuffer(viewModel, viewModel.getCursorStates(), this._inSelectionMode));
                viewModel.revealAllCursors(args.source, true);
            }
        }
        CoreNavigationCommands.CursorTop = (0, editorExtensions_1.registerEditorCommand)(new TopCommand({
            inSelectionMode: false,
            id: 'cursorTop',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */ }
            }
        }));
        CoreNavigationCommands.CursorTopSelect = (0, editorExtensions_1.registerEditorCommand)(new TopCommand({
            inSelectionMode: true,
            id: 'cursorTopSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 14 /* KeyCode.Home */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */ }
            }
        }));
        class BottomCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.moveToEndOfBuffer(viewModel, viewModel.getCursorStates(), this._inSelectionMode));
                viewModel.revealAllCursors(args.source, true);
            }
        }
        CoreNavigationCommands.CursorBottom = (0, editorExtensions_1.registerEditorCommand)(new BottomCommand({
            inSelectionMode: false,
            id: 'cursorBottom',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 13 /* KeyCode.End */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */ }
            }
        }));
        CoreNavigationCommands.CursorBottomSelect = (0, editorExtensions_1.registerEditorCommand)(new BottomCommand({
            inSelectionMode: true,
            id: 'cursorBottomSelect',
            precondition: undefined,
            kbOpts: {
                weight: CORE_WEIGHT,
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 13 /* KeyCode.End */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */ }
            }
        }));
        class EditorScrollImpl extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'editorScroll',
                    precondition: undefined,
                    metadata: EditorScroll_.metadata
                });
            }
            determineScrollMethod(args) {
                const horizontalUnits = [6 /* EditorScroll_.Unit.Column */];
                const verticalUnits = [
                    1 /* EditorScroll_.Unit.Line */,
                    2 /* EditorScroll_.Unit.WrappedLine */,
                    3 /* EditorScroll_.Unit.Page */,
                    4 /* EditorScroll_.Unit.HalfPage */,
                    5 /* EditorScroll_.Unit.Editor */,
                    6 /* EditorScroll_.Unit.Column */
                ];
                const horizontalDirections = [4 /* EditorScroll_.Direction.Left */, 2 /* EditorScroll_.Direction.Right */];
                const verticalDirections = [1 /* EditorScroll_.Direction.Up */, 3 /* EditorScroll_.Direction.Down */];
                if (horizontalUnits.includes(args.unit) && horizontalDirections.includes(args.direction)) {
                    return this._runHorizontalEditorScroll.bind(this);
                }
                if (verticalUnits.includes(args.unit) && verticalDirections.includes(args.direction)) {
                    return this._runVerticalEditorScroll.bind(this);
                }
                return null;
            }
            runCoreEditorCommand(viewModel, args) {
                const parsed = EditorScroll_.parse(args);
                if (!parsed) {
                    // illegal arguments
                    return;
                }
                const runEditorScroll = this.determineScrollMethod(parsed);
                if (!runEditorScroll) {
                    // Incompatible unit and direction
                    return;
                }
                runEditorScroll(viewModel, args.source, parsed);
            }
            _runVerticalEditorScroll(viewModel, source, args) {
                const desiredScrollTop = this._computeDesiredScrollTop(viewModel, args);
                if (args.revealCursor) {
                    // must ensure cursor is in new visible range
                    const desiredVisibleViewRange = viewModel.getCompletelyVisibleViewRangeAtScrollTop(desiredScrollTop);
                    viewModel.setCursorStates(source, 3 /* CursorChangeReason.Explicit */, [
                        cursorMoveCommands_1.CursorMoveCommands.findPositionInViewportIfOutside(viewModel, viewModel.getPrimaryCursorState(), desiredVisibleViewRange, args.select)
                    ]);
                }
                viewModel.viewLayout.setScrollPosition({ scrollTop: desiredScrollTop }, 0 /* ScrollType.Smooth */);
            }
            _computeDesiredScrollTop(viewModel, args) {
                if (args.unit === 1 /* EditorScroll_.Unit.Line */) {
                    // scrolling by model lines
                    const futureViewport = viewModel.viewLayout.getFutureViewport();
                    const visibleViewRange = viewModel.getCompletelyVisibleViewRangeAtScrollTop(futureViewport.top);
                    const visibleModelRange = viewModel.coordinatesConverter.convertViewRangeToModelRange(visibleViewRange);
                    let desiredTopModelLineNumber;
                    if (args.direction === 1 /* EditorScroll_.Direction.Up */) {
                        // must go x model lines up
                        desiredTopModelLineNumber = Math.max(1, visibleModelRange.startLineNumber - args.value);
                    }
                    else {
                        // must go x model lines down
                        desiredTopModelLineNumber = Math.min(viewModel.model.getLineCount(), visibleModelRange.startLineNumber + args.value);
                    }
                    const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(desiredTopModelLineNumber, 1));
                    return viewModel.viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber);
                }
                if (args.unit === 5 /* EditorScroll_.Unit.Editor */) {
                    let desiredTopModelLineNumber = 0;
                    if (args.direction === 3 /* EditorScroll_.Direction.Down */) {
                        desiredTopModelLineNumber = viewModel.model.getLineCount() - viewModel.cursorConfig.pageSize;
                    }
                    return viewModel.viewLayout.getVerticalOffsetForLineNumber(desiredTopModelLineNumber);
                }
                let noOfLines;
                if (args.unit === 3 /* EditorScroll_.Unit.Page */) {
                    noOfLines = viewModel.cursorConfig.pageSize * args.value;
                }
                else if (args.unit === 4 /* EditorScroll_.Unit.HalfPage */) {
                    noOfLines = Math.round(viewModel.cursorConfig.pageSize / 2) * args.value;
                }
                else {
                    noOfLines = args.value;
                }
                const deltaLines = (args.direction === 1 /* EditorScroll_.Direction.Up */ ? -1 : 1) * noOfLines;
                return viewModel.viewLayout.getCurrentScrollTop() + deltaLines * viewModel.cursorConfig.lineHeight;
            }
            _runHorizontalEditorScroll(viewModel, source, args) {
                const desiredScrollLeft = this._computeDesiredScrollLeft(viewModel, args);
                viewModel.viewLayout.setScrollPosition({ scrollLeft: desiredScrollLeft }, 0 /* ScrollType.Smooth */);
            }
            _computeDesiredScrollLeft(viewModel, args) {
                const deltaColumns = (args.direction === 4 /* EditorScroll_.Direction.Left */ ? -1 : 1) * args.value;
                return viewModel.viewLayout.getCurrentScrollLeft() + deltaColumns * viewModel.cursorConfig.typicalHalfwidthCharacterWidth;
            }
        }
        CoreNavigationCommands.EditorScrollImpl = EditorScrollImpl;
        CoreNavigationCommands.EditorScroll = (0, editorExtensions_1.registerEditorCommand)(new EditorScrollImpl());
        CoreNavigationCommands.ScrollLineUp = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollLineUp',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                        mac: { primary: 256 /* KeyMod.WinCtrl */ | 11 /* KeyCode.PageUp */ }
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Up,
                    by: EditorScroll_.RawUnit.WrappedLine,
                    value: 1,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        CoreNavigationCommands.ScrollPageUp = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollPageUp',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 11 /* KeyCode.PageUp */,
                        win: { primary: 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */ },
                        linux: { primary: 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */ }
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Up,
                    by: EditorScroll_.RawUnit.Page,
                    value: 1,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        CoreNavigationCommands.ScrollEditorTop = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollEditorTop',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Up,
                    by: EditorScroll_.RawUnit.Editor,
                    value: 1,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        CoreNavigationCommands.ScrollLineDown = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollLineDown',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                        mac: { primary: 256 /* KeyMod.WinCtrl */ | 12 /* KeyCode.PageDown */ }
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Down,
                    by: EditorScroll_.RawUnit.WrappedLine,
                    value: 1,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        CoreNavigationCommands.ScrollPageDown = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollPageDown',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 12 /* KeyCode.PageDown */,
                        win: { primary: 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */ },
                        linux: { primary: 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */ }
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Down,
                    by: EditorScroll_.RawUnit.Page,
                    value: 1,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        CoreNavigationCommands.ScrollEditorBottom = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollEditorBottom',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Down,
                    by: EditorScroll_.RawUnit.Editor,
                    value: 1,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        CoreNavigationCommands.ScrollLeft = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollLeft',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Left,
                    by: EditorScroll_.RawUnit.Column,
                    value: 2,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        CoreNavigationCommands.ScrollRight = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'scrollRight',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                CoreNavigationCommands.EditorScroll.runCoreEditorCommand(viewModel, {
                    to: EditorScroll_.RawDirection.Right,
                    by: EditorScroll_.RawUnit.Column,
                    value: 2,
                    revealCursor: false,
                    select: false,
                    source: args.source
                });
            }
        });
        class WordCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.position) {
                    return;
                }
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, [
                    cursorMoveCommands_1.CursorMoveCommands.word(viewModel, viewModel.getPrimaryCursorState(), this._inSelectionMode, args.position)
                ]);
                if (args.revealType !== 2 /* NavigationCommandRevealType.None */) {
                    viewModel.revealAllCursors(args.source, true, true);
                }
            }
        }
        CoreNavigationCommands.WordSelect = (0, editorExtensions_1.registerEditorCommand)(new WordCommand({
            inSelectionMode: false,
            id: '_wordSelect',
            precondition: undefined
        }));
        CoreNavigationCommands.WordSelectDrag = (0, editorExtensions_1.registerEditorCommand)(new WordCommand({
            inSelectionMode: true,
            id: '_wordSelectDrag',
            precondition: undefined
        }));
        CoreNavigationCommands.LastCursorWordSelect = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'lastCursorWordSelect',
                    precondition: undefined
                });
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.position) {
                    return;
                }
                const lastAddedCursorIndex = viewModel.getLastAddedCursorIndex();
                const states = viewModel.getCursorStates();
                const newStates = states.slice(0);
                const lastAddedState = states[lastAddedCursorIndex];
                newStates[lastAddedCursorIndex] = cursorMoveCommands_1.CursorMoveCommands.word(viewModel, lastAddedState, lastAddedState.modelState.hasSelection(), args.position);
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, newStates);
            }
        });
        class LineCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.position) {
                    return;
                }
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, [
                    cursorMoveCommands_1.CursorMoveCommands.line(viewModel, viewModel.getPrimaryCursorState(), this._inSelectionMode, args.position, args.viewPosition)
                ]);
                if (args.revealType !== 2 /* NavigationCommandRevealType.None */) {
                    viewModel.revealAllCursors(args.source, false, true);
                }
            }
        }
        CoreNavigationCommands.LineSelect = (0, editorExtensions_1.registerEditorCommand)(new LineCommand({
            inSelectionMode: false,
            id: '_lineSelect',
            precondition: undefined
        }));
        CoreNavigationCommands.LineSelectDrag = (0, editorExtensions_1.registerEditorCommand)(new LineCommand({
            inSelectionMode: true,
            id: '_lineSelectDrag',
            precondition: undefined
        }));
        class LastCursorLineCommand extends CoreEditorCommand {
            constructor(opts) {
                super(opts);
                this._inSelectionMode = opts.inSelectionMode;
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.position) {
                    return;
                }
                const lastAddedCursorIndex = viewModel.getLastAddedCursorIndex();
                const states = viewModel.getCursorStates();
                const newStates = states.slice(0);
                newStates[lastAddedCursorIndex] = cursorMoveCommands_1.CursorMoveCommands.line(viewModel, states[lastAddedCursorIndex], this._inSelectionMode, args.position, args.viewPosition);
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, newStates);
            }
        }
        CoreNavigationCommands.LastCursorLineSelect = (0, editorExtensions_1.registerEditorCommand)(new LastCursorLineCommand({
            inSelectionMode: false,
            id: 'lastCursorLineSelect',
            precondition: undefined
        }));
        CoreNavigationCommands.LastCursorLineSelectDrag = (0, editorExtensions_1.registerEditorCommand)(new LastCursorLineCommand({
            inSelectionMode: true,
            id: 'lastCursorLineSelectDrag',
            precondition: undefined
        }));
        CoreNavigationCommands.CancelSelection = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'cancelSelection',
                    precondition: editorContextKeys_1.EditorContextKeys.hasNonEmptySelection,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 9 /* KeyCode.Escape */,
                        secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, [
                    cursorMoveCommands_1.CursorMoveCommands.cancelSelection(viewModel, viewModel.getPrimaryCursorState())
                ]);
                viewModel.revealAllCursors(args.source, true);
            }
        });
        CoreNavigationCommands.RemoveSecondaryCursors = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'removeSecondaryCursors',
                    precondition: editorContextKeys_1.EditorContextKeys.hasMultipleSelections,
                    kbOpts: {
                        weight: CORE_WEIGHT + 1,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 9 /* KeyCode.Escape */,
                        secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
                    }
                });
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, [
                    viewModel.getPrimaryCursorState()
                ]);
                viewModel.revealAllCursors(args.source, true);
                (0, aria_1.status)(nls.localize('removedCursor', "Removed secondary cursors"));
            }
        });
        CoreNavigationCommands.RevealLine = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'revealLine',
                    precondition: undefined,
                    metadata: RevealLine_.metadata
                });
            }
            runCoreEditorCommand(viewModel, args) {
                const revealLineArg = args;
                const lineNumberArg = revealLineArg.lineNumber || 0;
                let lineNumber = typeof lineNumberArg === 'number' ? (lineNumberArg + 1) : (parseInt(lineNumberArg) + 1);
                if (lineNumber < 1) {
                    lineNumber = 1;
                }
                const lineCount = viewModel.model.getLineCount();
                if (lineNumber > lineCount) {
                    lineNumber = lineCount;
                }
                const range = new range_1.Range(lineNumber, 1, lineNumber, viewModel.model.getLineMaxColumn(lineNumber));
                let revealAt = 0 /* VerticalRevealType.Simple */;
                if (revealLineArg.at) {
                    switch (revealLineArg.at) {
                        case RevealLine_.RawAtArgument.Top:
                            revealAt = 3 /* VerticalRevealType.Top */;
                            break;
                        case RevealLine_.RawAtArgument.Center:
                            revealAt = 1 /* VerticalRevealType.Center */;
                            break;
                        case RevealLine_.RawAtArgument.Bottom:
                            revealAt = 4 /* VerticalRevealType.Bottom */;
                            break;
                        default:
                            break;
                    }
                }
                const viewRange = viewModel.coordinatesConverter.convertModelRangeToViewRange(range);
                viewModel.revealRange(args.source, false, viewRange, revealAt, 0 /* ScrollType.Smooth */);
            }
        });
        CoreNavigationCommands.SelectAll = new class extends EditorOrNativeTextInputCommand {
            constructor() {
                super(editorExtensions_1.SelectAllCommand);
            }
            runDOMCommand(activeElement) {
                if (browser_1.isFirefox) {
                    activeElement.focus();
                    activeElement.select();
                }
                activeElement.ownerDocument.execCommand('selectAll');
            }
            runEditorCommand(accessor, editor, args) {
                const viewModel = editor._getViewModel();
                if (!viewModel) {
                    // the editor has no view => has no cursors
                    return;
                }
                this.runCoreEditorCommand(viewModel, args);
            }
            runCoreEditorCommand(viewModel, args) {
                viewModel.model.pushStackElement();
                viewModel.setCursorStates('keyboard', 3 /* CursorChangeReason.Explicit */, [
                    cursorMoveCommands_1.CursorMoveCommands.selectAll(viewModel, viewModel.getPrimaryCursorState())
                ]);
            }
        }();
        CoreNavigationCommands.SetSelection = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditorCommand {
            constructor() {
                super({
                    id: 'setSelection',
                    precondition: undefined
                });
            }
            runCoreEditorCommand(viewModel, args) {
                if (!args.selection) {
                    return;
                }
                viewModel.model.pushStackElement();
                viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, [
                    cursorCommon_1.CursorState.fromModelSelection(args.selection)
                ]);
            }
        });
    })(CoreNavigationCommands || (exports.CoreNavigationCommands = CoreNavigationCommands = {}));
    const columnSelectionCondition = contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.textInputFocus, editorContextKeys_1.EditorContextKeys.columnSelection);
    function registerColumnSelection(id, keybinding) {
        keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
            id: id,
            primary: keybinding,
            when: columnSelectionCondition,
            weight: CORE_WEIGHT + 1
        });
    }
    registerColumnSelection(CoreNavigationCommands.CursorColumnSelectLeft.id, 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */);
    registerColumnSelection(CoreNavigationCommands.CursorColumnSelectRight.id, 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */);
    registerColumnSelection(CoreNavigationCommands.CursorColumnSelectUp.id, 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */);
    registerColumnSelection(CoreNavigationCommands.CursorColumnSelectPageUp.id, 1024 /* KeyMod.Shift */ | 11 /* KeyCode.PageUp */);
    registerColumnSelection(CoreNavigationCommands.CursorColumnSelectDown.id, 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */);
    registerColumnSelection(CoreNavigationCommands.CursorColumnSelectPageDown.id, 1024 /* KeyMod.Shift */ | 12 /* KeyCode.PageDown */);
    function registerCommand(command) {
        command.register();
        return command;
    }
    var CoreEditingCommands;
    (function (CoreEditingCommands) {
        class CoreEditingCommand extends editorExtensions_1.EditorCommand {
            runEditorCommand(accessor, editor, args) {
                const viewModel = editor._getViewModel();
                if (!viewModel) {
                    // the editor has no view => has no cursors
                    return;
                }
                this.runCoreEditingCommand(editor, viewModel, args || {});
            }
        }
        CoreEditingCommands.CoreEditingCommand = CoreEditingCommand;
        CoreEditingCommands.LineBreakInsert = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditingCommand {
            constructor() {
                super({
                    id: 'lineBreakInsert',
                    precondition: editorContextKeys_1.EditorContextKeys.writable,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 0,
                        mac: { primary: 256 /* KeyMod.WinCtrl */ | 45 /* KeyCode.KeyO */ }
                    }
                });
            }
            runCoreEditingCommand(editor, viewModel, args) {
                editor.pushUndoStop();
                editor.executeCommands(this.id, cursorTypeOperations_1.TypeOperations.lineBreakInsert(viewModel.cursorConfig, viewModel.model, viewModel.getCursorStates().map(s => s.modelState.selection)));
            }
        });
        CoreEditingCommands.Outdent = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditingCommand {
            constructor() {
                super({
                    id: 'outdent',
                    precondition: editorContextKeys_1.EditorContextKeys.writable,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus, editorContextKeys_1.EditorContextKeys.tabDoesNotMoveFocus),
                        primary: 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */
                    }
                });
            }
            runCoreEditingCommand(editor, viewModel, args) {
                editor.pushUndoStop();
                editor.executeCommands(this.id, cursorTypeOperations_1.TypeOperations.outdent(viewModel.cursorConfig, viewModel.model, viewModel.getCursorStates().map(s => s.modelState.selection)));
                editor.pushUndoStop();
            }
        });
        CoreEditingCommands.Tab = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditingCommand {
            constructor() {
                super({
                    id: 'tab',
                    precondition: editorContextKeys_1.EditorContextKeys.writable,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus, editorContextKeys_1.EditorContextKeys.tabDoesNotMoveFocus),
                        primary: 2 /* KeyCode.Tab */
                    }
                });
            }
            runCoreEditingCommand(editor, viewModel, args) {
                editor.pushUndoStop();
                editor.executeCommands(this.id, cursorTypeOperations_1.TypeOperations.tab(viewModel.cursorConfig, viewModel.model, viewModel.getCursorStates().map(s => s.modelState.selection)));
                editor.pushUndoStop();
            }
        });
        CoreEditingCommands.DeleteLeft = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditingCommand {
            constructor() {
                super({
                    id: 'deleteLeft',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 1 /* KeyCode.Backspace */,
                        secondary: [1024 /* KeyMod.Shift */ | 1 /* KeyCode.Backspace */],
                        mac: { primary: 1 /* KeyCode.Backspace */, secondary: [1024 /* KeyMod.Shift */ | 1 /* KeyCode.Backspace */, 256 /* KeyMod.WinCtrl */ | 38 /* KeyCode.KeyH */, 256 /* KeyMod.WinCtrl */ | 1 /* KeyCode.Backspace */] }
                    }
                });
            }
            runCoreEditingCommand(editor, viewModel, args) {
                const [shouldPushStackElementBefore, commands] = cursorDeleteOperations_1.DeleteOperations.deleteLeft(viewModel.getPrevEditOperationType(), viewModel.cursorConfig, viewModel.model, viewModel.getCursorStates().map(s => s.modelState.selection), viewModel.getCursorAutoClosedCharacters());
                if (shouldPushStackElementBefore) {
                    editor.pushUndoStop();
                }
                editor.executeCommands(this.id, commands);
                viewModel.setPrevEditOperationType(2 /* EditOperationType.DeletingLeft */);
            }
        });
        CoreEditingCommands.DeleteRight = (0, editorExtensions_1.registerEditorCommand)(new class extends CoreEditingCommand {
            constructor() {
                super({
                    id: 'deleteRight',
                    precondition: undefined,
                    kbOpts: {
                        weight: CORE_WEIGHT,
                        kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                        primary: 20 /* KeyCode.Delete */,
                        mac: { primary: 20 /* KeyCode.Delete */, secondary: [256 /* KeyMod.WinCtrl */ | 34 /* KeyCode.KeyD */, 256 /* KeyMod.WinCtrl */ | 20 /* KeyCode.Delete */] }
                    }
                });
            }
            runCoreEditingCommand(editor, viewModel, args) {
                const [shouldPushStackElementBefore, commands] = cursorDeleteOperations_1.DeleteOperations.deleteRight(viewModel.getPrevEditOperationType(), viewModel.cursorConfig, viewModel.model, viewModel.getCursorStates().map(s => s.modelState.selection));
                if (shouldPushStackElementBefore) {
                    editor.pushUndoStop();
                }
                editor.executeCommands(this.id, commands);
                viewModel.setPrevEditOperationType(3 /* EditOperationType.DeletingRight */);
            }
        });
        CoreEditingCommands.Undo = new class extends EditorOrNativeTextInputCommand {
            constructor() {
                super(editorExtensions_1.UndoCommand);
            }
            runDOMCommand(activeElement) {
                activeElement.ownerDocument.execCommand('undo');
            }
            runEditorCommand(accessor, editor, args) {
                if (!editor.hasModel() || editor.getOption(91 /* EditorOption.readOnly */) === true) {
                    return;
                }
                return editor.getModel().undo();
            }
        }();
        CoreEditingCommands.Redo = new class extends EditorOrNativeTextInputCommand {
            constructor() {
                super(editorExtensions_1.RedoCommand);
            }
            runDOMCommand(activeElement) {
                activeElement.ownerDocument.execCommand('redo');
            }
            runEditorCommand(accessor, editor, args) {
                if (!editor.hasModel() || editor.getOption(91 /* EditorOption.readOnly */) === true) {
                    return;
                }
                return editor.getModel().redo();
            }
        }();
    })(CoreEditingCommands || (exports.CoreEditingCommands = CoreEditingCommands = {}));
    /**
     * A command that will invoke a command on the focused editor.
     */
    class EditorHandlerCommand extends editorExtensions_1.Command {
        constructor(id, handlerId, metadata) {
            super({
                id: id,
                precondition: undefined,
                metadata
            });
            this._handlerId = handlerId;
        }
        runCommand(accessor, args) {
            const editor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (!editor) {
                return;
            }
            editor.trigger('keyboard', this._handlerId, args);
        }
    }
    function registerOverwritableCommand(handlerId, metadata) {
        registerCommand(new EditorHandlerCommand('default:' + handlerId, handlerId));
        registerCommand(new EditorHandlerCommand(handlerId, handlerId, metadata));
    }
    registerOverwritableCommand("type" /* Handler.Type */, {
        description: `Type`,
        args: [{
                name: 'args',
                schema: {
                    'type': 'object',
                    'required': ['text'],
                    'properties': {
                        'text': {
                            'type': 'string'
                        }
                    },
                }
            }]
    });
    registerOverwritableCommand("replacePreviousChar" /* Handler.ReplacePreviousChar */);
    registerOverwritableCommand("compositionType" /* Handler.CompositionType */);
    registerOverwritableCommand("compositionStart" /* Handler.CompositionStart */);
    registerOverwritableCommand("compositionEnd" /* Handler.CompositionEnd */);
    registerOverwritableCommand("paste" /* Handler.Paste */);
    registerOverwritableCommand("cut" /* Handler.Cut */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZUNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci9jb3JlQ29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBOEJoRyxNQUFNLFdBQVcsc0NBQThCLENBQUM7SUFFaEQsTUFBc0IsaUJBQXFCLFNBQVEsZ0NBQWE7UUFDeEQsZ0JBQWdCLENBQUMsUUFBaUMsRUFBRSxNQUFtQixFQUFFLElBQXdCO1lBQ3ZHLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN6QyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2hCLDJDQUEyQztnQkFDM0MsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNsRCxDQUFDO0tBR0Q7SUFYRCw4Q0FXQztJQUVELElBQWlCLGFBQWEsQ0F3TDdCO0lBeExELFdBQWlCLGFBQWE7UUFFN0IsTUFBTSxrQkFBa0IsR0FBRyxVQUFVLEdBQVE7WUFDNUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsTUFBTSxTQUFTLEdBQWlCLEdBQUcsQ0FBQztZQUVwQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFD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