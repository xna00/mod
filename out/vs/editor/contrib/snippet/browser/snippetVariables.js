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
define(["require", "exports", "vs/base/common/labels", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/uuid", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/snippet/browser/snippetParser", "vs/nls", "vs/platform/workspace/common/workspace"], function (require, exports, labels_1, path, resources_1, strings_1, uuid_1, languageConfigurationRegistry_1, snippetParser_1, nls, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RandomBasedVariableResolver = exports.WorkspaceBasedVariableResolver = exports.TimeBasedVariableResolver = exports.CommentBasedVariableResolver = exports.ClipboardBasedVariableResolver = exports.ModelBasedVariableResolver = exports.SelectionBasedVariableResolver = exports.CompositeSnippetVariableResolver = exports.KnownSnippetVariableNames = void 0;
    exports.KnownSnippetVariableNames = Object.freeze({
        'CURRENT_YEAR': true,
        'CURRENT_YEAR_SHORT': true,
        'CURRENT_MONTH': true,
        'CURRENT_DATE': true,
        'CURRENT_HOUR': true,
        'CURRENT_MINUTE': true,
        'CURRENT_SECOND': true,
        'CURRENT_DAY_NAME': true,
        'CURRENT_DAY_NAME_SHORT': true,
        'CURRENT_MONTH_NAME': true,
        'CURRENT_MONTH_NAME_SHORT': true,
        'CURRENT_SECONDS_UNIX': true,
        'CURRENT_TIMEZONE_OFFSET': true,
        'SELECTION': true,
        'CLIPBOARD': true,
        'TM_SELECTED_TEXT': true,
        'TM_CURRENT_LINE': true,
        'TM_CURRENT_WORD': true,
        'TM_LINE_INDEX': true,
        'TM_LINE_NUMBER': true,
        'TM_FILENAME': true,
        'TM_FILENAME_BASE': true,
        'TM_DIRECTORY': true,
        'TM_FILEPATH': true,
        'CURSOR_INDEX': true, // 0-offset
        'CURSOR_NUMBER': true, // 1-offset
        'RELATIVE_FILEPATH': true,
        'BLOCK_COMMENT_START': true,
        'BLOCK_COMMENT_END': true,
        'LINE_COMMENT': true,
        'WORKSPACE_NAME': true,
        'WORKSPACE_FOLDER': true,
        'RANDOM': true,
        'RANDOM_HEX': true,
        'UUID': true
    });
    class CompositeSnippetVariableResolver {
        constructor(_delegates) {
            this._delegates = _delegates;
            //
        }
        resolve(variable) {
            for (const delegate of this._delegates) {
                const value = delegate.resolve(variable);
                if (value !== undefined) {
                    return value;
                }
            }
            return undefined;
        }
    }
    exports.CompositeSnippetVariableResolver = CompositeSnippetVariableResolver;
    class SelectionBasedVariableResolver {
        constructor(_model, _selection, _selectionIdx, _overtypingCapturer) {
            this._model = _model;
            this._selection = _selection;
            this._selectionIdx = _selectionIdx;
            this._overtypingCapturer = _overtypingCapturer;
            //
        }
        resolve(variable) {
            const { name } = variable;
            if (name === 'SELECTION' || name === 'TM_SELECTED_TEXT') {
                let value = this._model.getValueInRange(this._selection) || undefined;
                let isMultiline = this._selection.startLineNumber !== this._selection.endLineNumber;
                // If there was no selected text, try to get last overtyped text
                if (!value && this._overtypingCapturer) {
                    const info = this._overtypingCapturer.getLastOvertypedInfo(this._selectionIdx);
                    if (info) {
                        value = info.value;
                        isMultiline = info.multiline;
                    }
                }
                if (value && isMultiline && variable.snippet) {
                    // Selection is a multiline string which we indentation we now
                    // need to adjust. We compare the indentation of this variable
                    // with the indentation at the editor position and add potential
                    // extra indentation to the value
                    const line = this._model.getLineContent(this._selection.startLineNumber);
                    const lineLeadingWhitespace = (0, strings_1.getLeadingWhitespace)(line, 0, this._selection.startColumn - 1);
                    let varLeadingWhitespace = lineLeadingWhitespace;
                    variable.snippet.walk(marker => {
                        if (marker === variable) {
                            return false;
                        }
                        if (marker instanceof snippetParser_1.Text) {
                            varLeadingWhitespace = (0, strings_1.getLeadingWhitespace)((0, strings_1.splitLines)(marker.value).pop());
                        }
                        return true;
                    });
                    const whitespaceCommonLength = (0, strings_1.commonPrefixLength)(varLeadingWhitespace, lineLeadingWhitespace);
                    value = value.replace(/(\r\n|\r|\n)(.*)/g, (m, newline, rest) => `${newline}${varLeadingWhitespace.substr(whitespaceCommonLength)}${rest}`);
                }
                return value;
            }
            else if (name === 'TM_CURRENT_LINE') {
                return this._model.getLineContent(this._selection.positionLineNumber);
            }
            else if (name === 'TM_CURRENT_WORD') {
                const info = this._model.getWordAtPosition({
                    lineNumber: this._selection.positionLineNumber,
                    column: this._selection.positionColumn
                });
                return info && info.word || undefined;
            }
            else if (name === 'TM_LINE_INDEX') {
                return String(this._selection.positionLineNumber - 1);
            }
            else if (name === 'TM_LINE_NUMBER') {
                return String(this._selection.positionLineNumber);
            }
            else if (name === 'CURSOR_INDEX') {
                return String(this._selectionIdx);
            }
            else if (name === 'CURSOR_NUMBER') {
                return String(this._selectionIdx + 1);
            }
            return undefined;
        }
    }
    exports.SelectionBasedVariableResolver = SelectionBasedVariableResolver;
    class ModelBasedVariableResolver {
        constructor(_labelService, _model) {
            this._labelService = _labelService;
            this._model = _model;
            //
        }
        resolve(variable) {
            const { name } = variable;
            if (name === 'TM_FILENAME') {
                return path.basename(this._model.uri.fsPath);
            }
            else if (name === 'TM_FILENAME_BASE') {
                const name = path.basename(this._model.uri.fsPath);
                const idx = name.lastIndexOf('.');
                if (idx <= 0) {
                    return name;
                }
                else {
                    return name.slice(0, idx);
                }
            }
            else if (name === 'TM_DIRECTORY') {
                if (path.dirname(this._model.uri.fsPath) === '.') {
                    return '';
                }
                return this._labelService.getUriLabel((0, resources_1.dirname)(this._model.uri));
            }
            else if (name === 'TM_FILEPATH') {
                return this._labelService.getUriLabel(this._model.uri);
            }
            else if (name === 'RELATIVE_FILEPATH') {
                return this._labelService.getUriLabel(this._model.uri, { relative: true, noPrefix: true });
            }
            return undefined;
        }
    }
    exports.ModelBasedVariableResolver = ModelBasedVariableResolver;
    class ClipboardBasedVariableResolver {
        constructor(_readClipboardText, _selectionIdx, _selectionCount, _spread) {
            this._readClipboardText = _readClipboardText;
            this._selectionIdx = _selectionIdx;
            this._selectionCount = _selectionCount;
            this._spread = _spread;
            //
        }
        resolve(variable) {
            if (variable.name !== 'CLIPBOARD') {
                return undefined;
            }
            const clipboardText = this._readClipboardText();
            if (!clipboardText) {
                return undefined;
            }
            // `spread` is assigning each cursor a line of the clipboard
            // text whenever there the line count equals the cursor count
            // and when enabled
            if (this._spread) {
                const lines = clipboardText.split(/\r\n|\n|\r/).filter(s => !(0, strings_1.isFalsyOrWhitespace)(s));
                if (lines.length === this._selectionCount) {
                    return lines[this._selectionIdx];
                }
            }
            return clipboardText;
        }
    }
    exports.ClipboardBasedVariableResolver = ClipboardBasedVariableResolver;
    let CommentBasedVariableResolver = class CommentBasedVariableResolver {
        constructor(_model, _selection, _languageConfigurationService) {
            this._model = _model;
            this._selection = _selection;
            this._languageConfigurationService = _languageConfigurationService;
            //
        }
        resolve(variable) {
            const { name } = variable;
            const langId = this._model.getLanguageIdAtPosition(this._selection.selectionStartLineNumber, this._selection.selectionStartColumn);
            const config = this._languageConfigurationService.getLanguageConfiguration(langId).comments;
            if (!config) {
                return undefined;
            }
            if (name === 'LINE_COMMENT') {
                return config.lineCommentToken || undefined;
            }
            else if (name === 'BLOCK_COMMENT_START') {
                return config.blockCommentStartToken || undefined;
            }
            else if (name === 'BLOCK_COMMENT_END') {
                return config.blockCommentEndToken || undefined;
            }
            return undefined;
        }
    };
    exports.CommentBasedVariableResolver = CommentBasedVariableResolver;
    exports.CommentBasedVariableResolver = CommentBasedVariableResolver = __decorate([
        __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], CommentBasedVariableResolver);
    class TimeBasedVariableResolver {
        constructor() {
            this._date = new Date();
        }
        static { this.dayNames = [nls.localize('Sunday', "Sunday"), nls.localize('Monday', "Monday"), nls.localize('Tuesday', "Tuesday"), nls.localize('Wednesday', "Wednesday"), nls.localize('Thursday', "Thursday"), nls.localize('Friday', "Friday"), nls.localize('Saturday', "Saturday")]; }
        static { this.dayNamesShort = [nls.localize('SundayShort', "Sun"), nls.localize('MondayShort', "Mon"), nls.localize('TuesdayShort', "Tue"), nls.localize('WednesdayShort', "Wed"), nls.localize('ThursdayShort', "Thu"), nls.localize('FridayShort', "Fri"), nls.localize('SaturdayShort', "Sat")]; }
        static { this.monthNames = [nls.localize('January', "January"), nls.localize('February', "February"), nls.localize('March', "March"), nls.localize('April', "April"), nls.localize('May', "May"), nls.localize('June', "June"), nls.localize('July', "July"), nls.localize('August', "August"), nls.localize('September', "September"), nls.localize('October', "October"), nls.localize('November', "November"), nls.localize('December', "December")]; }
        static { this.monthNamesShort = [nls.localize('JanuaryShort', "Jan"), nls.localize('FebruaryShort', "Feb"), nls.localize('MarchShort', "Mar"), nls.localize('AprilShort', "Apr"), nls.localize('MayShort', "May"), nls.localize('JuneShort', "Jun"), nls.localize('JulyShort', "Jul"), nls.localize('AugustShort', "Aug"), nls.localize('SeptemberShort', "Sep"), nls.localize('OctoberShort', "Oct"), nls.localize('NovemberShort', "Nov"), nls.localize('DecemberShort', "Dec")]; }
        resolve(variable) {
            const { name } = variable;
            if (name === 'CURRENT_YEAR') {
                return String(this._date.getFullYear());
            }
            else if (name === 'CURRENT_YEAR_SHORT') {
                return String(this._date.getFullYear()).slice(-2);
            }
            else if (name === 'CURRENT_MONTH') {
                return String(this._date.getMonth().valueOf() + 1).padStart(2, '0');
            }
            else if (name === 'CURRENT_DATE') {
                return String(this._date.getDate().valueOf()).padStart(2, '0');
            }
            else if (name === 'CURRENT_HOUR') {
                return String(this._date.getHours().valueOf()).padStart(2, '0');
            }
            else if (name === 'CURRENT_MINUTE') {
                return String(this._date.getMinutes().valueOf()).padStart(2, '0');
            }
            else if (name === 'CURRENT_SECOND') {
                return String(this._date.getSeconds().valueOf()).padStart(2, '0');
            }
            else if (name === 'CURRENT_DAY_NAME') {
                return TimeBasedVariableResolver.dayNames[this._date.getDay()];
            }
            else if (name === 'CURRENT_DAY_NAME_SHORT') {
                return TimeBasedVariableResolver.dayNamesShort[this._date.getDay()];
            }
            else if (name === 'CURRENT_MONTH_NAME') {
                return TimeBasedVariableResolver.monthNames[this._date.getMonth()];
            }
            else if (name === 'CURRENT_MONTH_NAME_SHORT') {
                return TimeBasedVariableResolver.monthNamesShort[this._date.getMonth()];
            }
            else if (name === 'CURRENT_SECONDS_UNIX') {
                return String(Math.floor(this._date.getTime() / 1000));
            }
            else if (name === 'CURRENT_TIMEZONE_OFFSET') {
                const rawTimeOffset = this._date.getTimezoneOffset();
                const sign = rawTimeOffset > 0 ? '-' : '+';
                const hours = Math.trunc(Math.abs(rawTimeOffset / 60));
                const hoursString = (hours < 10 ? '0' + hours : hours);
                const minutes = Math.abs(rawTimeOffset) - hours * 60;
                const minutesString = (minutes < 10 ? '0' + minutes : minutes);
                return sign + hoursString + ':' + minutesString;
            }
            return undefined;
        }
    }
    exports.TimeBasedVariableResolver = TimeBasedVariableResolver;
    class WorkspaceBasedVariableResolver {
        constructor(_workspaceService) {
            this._workspaceService = _workspaceService;
            //
        }
        resolve(variable) {
            if (!this._workspaceService) {
                return undefined;
            }
            const workspaceIdentifier = (0, workspace_1.toWorkspaceIdentifier)(this._workspaceService.getWorkspace());
            if ((0, workspace_1.isEmptyWorkspaceIdentifier)(workspaceIdentifier)) {
                return undefined;
            }
            if (variable.name === 'WORKSPACE_NAME') {
                return this._resolveWorkspaceName(workspaceIdentifier);
            }
            else if (variable.name === 'WORKSPACE_FOLDER') {
                return this._resoveWorkspacePath(workspaceIdentifier);
            }
            return undefined;
        }
        _resolveWorkspaceName(workspaceIdentifier) {
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceIdentifier)) {
                return path.basename(workspaceIdentifier.uri.path);
            }
            let filename = path.basename(workspaceIdentifier.configPath.path);
            if (filename.endsWith(workspace_1.WORKSPACE_EXTENSION)) {
                filename = filename.substr(0, filename.length - workspace_1.WORKSPACE_EXTENSION.length - 1);
            }
            return filename;
        }
        _resoveWorkspacePath(workspaceIdentifier) {
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceIdentifier)) {
                return (0, labels_1.normalizeDriveLetter)(workspaceIdentifier.uri.fsPath);
            }
            const filename = path.basename(workspaceIdentifier.configPath.path);
            let folderpath = workspaceIdentifier.configPath.fsPath;
            if (folderpath.endsWith(filename)) {
                folderpath = folderpath.substr(0, folderpath.length - filename.length - 1);
            }
            return (folderpath ? (0, labels_1.normalizeDriveLetter)(folderpath) : '/');
        }
    }
    exports.WorkspaceBasedVariableResolver = WorkspaceBasedVariableResolver;
    class RandomBasedVariableResolver {
        resolve(variable) {
            const { name } = variable;
            if (name === 'RANDOM') {
                return Math.random().toString().slice(-6);
            }
            else if (name === 'RANDOM_HEX') {
                return Math.random().toString(16).slice(-6);
            }
            else if (name === 'UUID') {
                return (0, uuid_1.generateUuid)();
            }
            return undefined;
        }
    }
    exports.RandomBasedVariableResolver = RandomBasedVariableResolver;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldFZhcmlhYmxlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc25pcHBldC9icm93c2VyL3NuaXBwZXRWYXJpYWJsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0JuRixRQUFBLHlCQUF5QixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQTBCO1FBQy9FLGNBQWMsRUFBRSxJQUFJO1FBQ3BCLG9CQUFvQixFQUFFLElBQUk7UUFDMUIsZUFBZSxFQUFFLElBQUk7UUFDckIsY0FBYyxFQUFFLElBQUk7UUFDcEIsY0FBYyxFQUFFLElBQUk7UUFDcEIsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixnQkFBZ0IsRUFBRSxJQUFJO1FBQ3RCLGtCQUFrQixFQUFFLElBQUk7UUFDeEIsd0JBQXdCLEVBQUUsSUFBSTtRQUM5QixvQkFBb0IsRUFBRSxJQUFJO1FBQzFCLDBCQUEwQixFQUFFLElBQUk7UUFDaEMsc0JBQXNCLEVBQUUsSUFBSTtRQUM1Qix5QkFBeUIsRUFBRSxJQUFJO1FBQy9CLFdBQVcsRUFBRSxJQUFJO1FBQ2pCLFdBQVcsRUFBRSxJQUFJO1FBQ2pCLGtCQUFrQixFQUFFLElBQUk7UUFDeEIsaUJBQWlCLEVBQUUsSUFBSTtRQUN2QixpQkFBaUIsRUFBRSxJQUFJO1FBQ3ZCLGVBQWUsRUFBRSxJQUFJO1FBQ3JCLGdCQUFnQixFQUFFLElBQUk7UUFDdEIsYUFBYSxFQUFFLElBQUk7UUFDbkIsa0JBQWtCLEVBQUUsSUFBSTtRQUN4QixjQUFjLEVBQUUsSUFBSTtRQUNwQixhQUFhLEVBQUUsSUFBSTtRQUNuQixjQUFjLEVBQUUsSUFBSSxFQUFFLFdBQVc7UUFDakMsZUFBZSxFQUFFLElBQUksRUFBRSxXQUFXO1FBQ2xDLG1CQUFtQixFQUFFLElBQUk7UUFDekIs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RUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQyxBQUFqUSxDQUFrUTtpQkFDMVEsa0JBQWEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUMsQUFBdlEsQ0FBd1E7aUJBQ3JSLGVBQVUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxRQUFR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