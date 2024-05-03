/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHost.protocol", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/base/common/severity", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/services/extensions/common/extensions"], function (require, exports, extHost_protocol_1, typeConvert, extHostTypes_1, severity_1, async_1, lifecycle_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLanguages = void 0;
    class ExtHostLanguages {
        constructor(mainContext, _documents, _commands, _uriTransformer) {
            this._documents = _documents;
            this._commands = _commands;
            this._uriTransformer = _uriTransformer;
            this._languageIds = [];
            this._handlePool = 0;
            this._ids = new Set();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadLanguages);
        }
        $acceptLanguageIds(ids) {
            this._languageIds = ids;
        }
        async getLanguages() {
            return this._languageIds.slice(0);
        }
        async changeLanguage(uri, languageId) {
            await this._proxy.$changeLanguage(uri, languageId);
            const data = this._documents.getDocumentData(uri);
            if (!data) {
                throw new Error(`document '${uri.toString()}' NOT found`);
            }
            return data.document;
        }
        async tokenAtPosition(document, position) {
            const versionNow = document.version;
            const pos = typeConvert.Position.from(position);
            const info = await this._proxy.$tokensAtPosition(document.uri, pos);
            const defaultRange = {
                type: extHostTypes_1.StandardTokenType.Other,
                range: document.getWordRangeAtPosition(position) ?? new extHostTypes_1.Range(position.line, position.character, position.line, position.character)
            };
            if (!info) {
                // no result
                return defaultRange;
            }
            const result = {
                range: typeConvert.Range.to(info.range),
                type: typeConvert.TokenType.to(info.type)
            };
            if (!result.range.contains(position)) {
                // bogous result
                return defaultRange;
            }
            if (versionNow !== document.version) {
                // concurrent change
                return defaultRange;
            }
            return result;
        }
        createLanguageStatusItem(extension, id, selector) {
            const handle = this._handlePool++;
            const proxy = this._proxy;
            const ids = this._ids;
            // enforce extension unique identifier
            const fullyQualifiedId = `${extension.identifier.value}/${id}`;
            if (ids.has(fullyQualifiedId)) {
                throw new Error(`LanguageStatusItem with id '${id}' ALREADY exists`);
            }
            ids.add(fullyQualifiedId);
            const data = {
                selector,
                id,
                name: extension.displayName ?? extension.name,
                severity: extHostTypes_1.LanguageStatusSeverity.Information,
                command: undefined,
                text: '',
                detail: '',
                busy: false
            };
            let soonHandle;
            const commandDisposables = new lifecycle_1.DisposableStore();
            const updateAsync = () => {
                soonHandle?.dispose();
                if (!ids.has(fullyQualifiedId)) {
                    console.warn(`LanguageStatusItem (${id}) from ${extension.identifier.value} has been disposed and CANNOT be updated anymore`);
                    return; // disposed in the meantime
                }
                soonHandle = (0, async_1.disposableTimeout)(() => {
                    commandDisposables.clear();
                    this._proxy.$setLanguageStatus(handle, {
                        id: fullyQualifiedId,
                        name: data.name ?? extension.displayName ?? extension.name,
                        source: extension.displayName ?? extension.name,
                        selector: typeConvert.DocumentSelector.from(data.selector, this._uriTransformer),
                        label: data.text,
                        detail: data.detail ?? '',
                        severity: data.severity === extHostTypes_1.LanguageStatusSeverity.Error ? severity_1.default.Error : data.severity === extHostTypes_1.LanguageStatusSeverity.Warning ? severity_1.default.Warning : severity_1.default.Info,
                        command: data.command && this._commands.toInternal(data.command, commandDisposables),
                        accessibilityInfo: data.accessibilityInformation,
                        busy: data.busy
                    });
                }, 0);
            };
            const result = {
                dispose() {
                    commandDisposables.dispose();
                    soonHandle?.dispose();
                    proxy.$removeLanguageStatus(handle);
                    ids.delete(fullyQualifiedId);
                },
                get id() {
                    return data.id;
                },
                get name() {
                    return data.name;
                },
                set name(value) {
                    data.name = value;
                    updateAsync();
                },
                get selector() {
                    return data.selector;
                },
                set selector(value) {
                    data.selector = value;
                    updateAsync();
                },
                get text() {
                    return data.text;
                },
                set text(value) {
                    data.text = value;
                    updateAsync();
                },
                set text2(value) {
                    (0, extensions_1.checkProposedApiEnabled)(extension, 'languageStatusText');
                    data.text = value;
                    updateAsync();
                },
                get text2() {
                    (0, extensions_1.checkProposedApiEnabled)(extension, 'languageStatusText');
                    return data.text;
                },
                get detail() {
                    return data.detail;
                },
                set detail(value) {
                    data.detail = value;
                    updateAsync();
                },
                get severity() {
                    return data.severity;
                },
                set severity(value) {
                    data.severity = value;
                    updateAsync();
                },
                get accessibilityInformation() {
                    return data.accessibilityInformation;
                },
                set accessibilityInformation(value) {
                    data.accessibilityInformation = value;
                    updateAsync();
                },
                get command() {
                    return data.command;
                },
                set command(value) {
                    data.command = value;
                    updateAsync();
                },
                get busy() {
                    return data.busy;
                },
                set busy(value) {
                    data.busy = value;
                    updateAsync();
                }
            };
            updateAsync();
            return result;
        }
    }
    exports.ExtHostLanguages = ExtHostLanguages;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdExhbmd1YWdlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdExhbmd1YWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBYSxnQkFBZ0I7UUFNNUIsWUFDQyxXQUF5QixFQUNSLFVBQTRCLEVBQzVCLFNBQTRCLEVBQzVCLGVBQTRDO1lBRjVDLGVBQVUsR0FBVixVQUFVLENBQWtCO1lBQzVCLGNBQVMsR0FBVCxTQUFTLENBQW1CO1lBQzVCLG9CQUFlLEdBQWYsZUFBZSxDQUE2QjtZQU50RCxpQkFBWSxHQUFhLEVBQUUsQ0FBQztZQXVENUIsZ0JBQVcsR0FBVyxDQUFDLENBQUM7WUFDeEIsU0FBSSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7WUFoRGhDLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVELGtCQUFrQixDQUFDLEdBQWE7WUFDL0IsSUFBSSxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUM7UUFDekIsQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsR0FBZSxFQUFFLFVBQWtCO1lBQ3ZELE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FB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