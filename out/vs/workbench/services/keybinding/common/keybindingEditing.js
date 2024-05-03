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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/json", "vs/base/common/objects", "vs/base/common/jsonEdit", "vs/base/common/lifecycle", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/services/resolverService", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/extensions", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, nls_1, async_1, json, objects, jsonEdit_1, lifecycle_1, editOperation_1, range_1, selection_1, resolverService_1, contextkey_1, files_1, instantiation_1, textfiles_1, extensions_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingsEditingService = exports.IKeybindingEditingService = void 0;
    exports.IKeybindingEditingService = (0, instantiation_1.createDecorator)('keybindingEditingService');
    let KeybindingsEditingService = class KeybindingsEditingService extends lifecycle_1.Disposable {
        constructor(textModelResolverService, textFileService, fileService, userDataProfileService) {
            super();
            this.textModelResolverService = textModelResolverService;
            this.textFileService = textFileService;
            this.fileService = fileService;
            this.userDataProfileService = userDataProfileService;
            this.queue = new async_1.Queue();
        }
        addKeybinding(keybindingItem, key, when) {
            return this.queue.queue(() => this.doEditKeybinding(keybindingItem, key, when, true)); // queue up writes to prevent race conditions
        }
        editKeybinding(keybindingItem, key, when) {
            return this.queue.queue(() => this.doEditKeybinding(keybindingItem, key, when, false)); // queue up writes to prevent race conditions
        }
        resetKeybinding(keybindingItem) {
            return this.queue.queue(() => this.doResetKeybinding(keybindingItem)); // queue up writes to prevent race conditions
        }
        removeKeybinding(keybindingItem) {
            return this.queue.queue(() => this.doRemoveKeybinding(keybindingItem)); // queue up writes to prevent race conditions
        }
        async doEditKeybinding(keybindingItem, key, when, add) {
            const reference = await this.resolveAndValidate();
            const model = reference.object.textEditorModel;
            if (add) {
                this.updateKeybinding(keybindingItem, key, when, model, -1);
            }
            else {
                const userKeybindingEntries = json.parse(model.getValue());
                const userKeybindingEntryIndex = this.findUserKeybindingEntryIndex(keybindingItem, userKeybindingEntries);
                this.updateKeybinding(keybindingItem, key, when, model, userKeybindingEntryIndex);
                if (keybindingItem.isDefault && keybindingItem.resolvedKeybinding) {
                    this.removeDefaultKeybinding(keybindingItem, model);
                }
            }
            try {
                await this.save();
            }
            finally {
                reference.dispose();
            }
        }
        async doRemoveKeybinding(keybindingItem) {
            const reference = await this.resolveAndValidate();
            const model = reference.object.textEditorModel;
            if (keybindingItem.isDefault) {
                this.removeDefaultKeybinding(keybindingItem, model);
            }
            else {
                this.removeUserKeybinding(keybindingItem, model);
            }
            try {
                return await this.save();
            }
            finally {
                reference.dispose();
            }
        }
        async doResetKeybinding(keybindingItem) {
            const reference = await this.resolveAndValidate();
            const model = reference.object.textEditorModel;
            if (!keybindingItem.isDefault) {
                this.removeUserKeybinding(keybindingItem, model);
                this.removeUnassignedDefaultKeybinding(keybindingItem, model);
            }
            try {
                return await this.save();
            }
            finally {
                reference.dispose();
            }
        }
        save() {
            return this.textFileService.save(this.userDataProfileService.currentProfile.keybindingsResource);
        }
        updateKeybinding(keybindingItem, newKey, when, model, userKeybindingEntryIndex) {
            const { tabSize, insertSpaces } = model.getOptions();
            const eol = model.getEOL();
            if (userKeybindingEntryIndex !== -1) {
                // Update the keybinding with new key
                this.applyEditsToBuffer((0, jsonEdit_1.setProperty)(model.getValue(), [userKeybindingEntryIndex, 'key'], newKey, { tabSize, insertSpaces, eol })[0], model);
                const edits = (0, jsonEdit_1.setProperty)(model.getValue(), [userKeybindingEntryIndex, 'when'], when, { tabSize, insertSpaces, eol });
                if (edits.length > 0) {
                    this.applyEditsToBuffer(edits[0], model);
                }
            }
            else {
                // Add the new keybinding with new key
                this.applyEditsToBuffer((0, jsonEdit_1.setProperty)(model.getValue(), [-1], this.asObject(newKey, keybindingItem.command, when, false), { tabSize, insertSpaces, eol })[0], model);
            }
        }
        removeUserKeybinding(keybindingItem, model) {
            const { tabSize, insertSpaces } = model.getOptions();
            const eol = model.getEOL();
            const userKeybindingEntries = json.parse(model.getValue());
            const userKeybindingEntryIndex = this.findUserKeybindingEntryIndex(keybindingItem, userKeybindingEntries);
            if (userKeybindingEntryIndex !== -1) {
                this.applyEditsToBuffer((0, jsonEdit_1.setProperty)(model.getValue(), [userKeybindingEntryIndex], undefined, { tabSize, insertSpaces, eol })[0], model);
            }
        }
        removeDefaultKeybinding(keybindingItem, model) {
            const { tabSize, insertSpaces } = model.getOptions();
            const eol = model.getEOL();
            const key = keybindingItem.resolvedKeybinding ? keybindingItem.resolvedKeybinding.getUserSettingsLabel() : null;
            if (key) {
                const entry = this.asObject(key, keybindingItem.command, keybindingItem.when ? keybindingItem.when.serialize() : undefined, true);
                const userKeybindingEntries = json.parse(model.getValue());
                if (userKeybindingEntries.every(e => !this.areSame(e, entry))) {
                    this.applyEditsToBuffer((0, jsonEdit_1.setProperty)(model.getValue(), [-1], entry, { tabSize, insertSpaces, eol })[0], model);
                }
            }
        }
        removeUnassignedDefaultKeybinding(keybindingItem, model) {
            const { tabSize, insertSpaces } = model.getOptions();
            const eol = model.getEOL();
            const userKeybindingEntries = json.parse(model.getValue());
            const indices = this.findUnassignedDefaultKeybindingEntryIndex(keybindingItem, userKeybindingEntries).reverse();
            for (const index of indices) {
                this.applyEditsToBuffer((0, jsonEdit_1.setProperty)(model.getValue(), [index], undefined, { tabSize, insertSpaces, eol })[0], model);
            }
        }
        findUserKeybindingEntryIndex(keybindingItem, userKeybindingEntries) {
            for (let index = 0; index < userKeybindingEntries.length; index++) {
                const keybinding = userKeybindingEntries[index];
                if (keybinding.command === keybindingItem.command) {
                    if (!keybinding.when && !keybindingItem.when) {
                        return index;
                    }
                    if (keybinding.when && keybindingItem.when) {
                        const contextKeyExpr = contextkey_1.ContextKeyExpr.deserialize(keybinding.when);
                        if (contextKeyExpr && contextKeyExpr.serialize() === keybindingItem.when.serialize()) {
                            return index;
                        }
                    }
                }
            }
            return -1;
        }
        findUnassignedDefaultKeybindingEntryIndex(keybindingItem, userKeybindingEntries) {
            const indices = [];
            for (let index = 0; index < userKeybindingEntries.length; index++) {
                if (userKeybindingEntries[index].command === `-${keybindingItem.command}`) {
                    indices.push(index);
                }
            }
            return indices;
        }
        asObject(key, command, when, negate) {
            const object = { key };
            if (command) {
                object['command'] = negate ? `-${command}` : command;
            }
            if (when) {
                object['when'] = when;
            }
            return object;
        }
        areSame(a, b) {
            if (a.command !== b.command) {
                return false;
            }
            if (a.key !== b.key) {
                return false;
            }
            const whenA = contextkey_1.ContextKeyExpr.deserialize(a.when);
            const whenB = contextkey_1.ContextKeyExpr.deserialize(b.when);
            if ((whenA && !whenB) || (!whenA && whenB)) {
                return false;
            }
            if (whenA && whenB && !whenA.equals(whenB)) {
                return false;
            }
            if (!objects.equals(a.args, b.args)) {
                return false;
            }
            return true;
        }
        applyEditsToBuffer(edit, model) {
            const startPosition = model.getPositionAt(edit.offset);
            const endPosition = model.getPositionAt(edit.offset + edit.length);
            const range = new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
            const currentText = model.getValueInRange(range);
            const editOperation = currentText ? editOperation_1.EditOperation.replace(range, edit.content) : editOperation_1.EditOperation.insert(startPosition, edit.content);
            model.pushEditOperations([new selection_1.Selection(startPosition.lineNumber, startPosition.column, startPosition.lineNumber, startPosition.column)], [editOperation], () => []);
        }
        async resolveModelReference() {
            const exists = await this.fileService.exists(this.userDataProfileService.currentProfile.keybindingsResource);
            if (!exists) {
                await this.textFileService.write(this.userDataProfileService.currentProfile.keybindingsResource, this.getEmptyContent(), { encoding: 'utf8' });
            }
            return this.textModelResolverService.createModelReference(this.userDataProfileService.currentProfile.keybindingsResource);
        }
        async resolveAndValidate() {
            // Target cannot be dirty if not writing into buffer
            if (this.textFileService.isDirty(this.userDataProfileService.currentProfile.keybindingsResource)) {
                throw new Error((0, nls_1.localize)('errorKeybindingsFileDirty', "Unable to write because the keybindings configuration file has unsaved changes. Please save it first and then try again."));
            }
            const reference = await this.resolveModelReference();
            const model = reference.object.textEditorModel;
            const EOL = model.getEOL();
            if (model.getValue()) {
                const parsed = this.parse(model);
                if (parsed.parseErrors.length) {
                    reference.dispose();
                    throw new Error((0, nls_1.localize)('parseErrors', "Unable to write to the keybindings configuration file. Please open it to correct errors/warnings in the file and try again."));
                }
                if (parsed.result) {
                    if (!Array.isArray(parsed.result)) {
                        reference.dispose();
                        throw new Error((0, nls_1.localize)('errorInvalidConfiguration', "Unable to write to the keybindings configuration file. It has an object which is not of type Array. Please open the file to clean up and try again."));
                    }
                }
                else {
                    const content = EOL + '[]';
                    this.applyEditsToBuffer({ content, length: content.length, offset: model.getValue().length }, model);
                }
            }
            else {
                const content = this.getEmptyContent();
                this.applyEditsToBuffer({ content, length: content.length, offset: 0 }, model);
            }
            return reference;
        }
        parse(model) {
            const parseErrors = [];
            const result = json.parse(model.getValue(), parseErrors, { allowTrailingComma: true, allowEmptyContent: true });
            return { result, parseErrors };
        }
        getEmptyContent() {
            return '// ' + (0, nls_1.localize)('emptyKeybindingsHeader', "Place your key bindings in this file to override the defaults") + '\n[\n]';
        }
    };
    exports.KeybindingsEditingService = KeybindingsEditingService;
    exports.KeybindingsEditingService = KeybindingsEditingService = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, files_1.IFileService),
        __param(3, userDataProfile_1.IUserDataProfileService)
    ], KeybindingsEditingService);
    (0, extensions_1.registerSingleton)(exports.IKeybindingEditingService, KeybindingsEditingService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ0VkaXRpbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9rZXliaW5kaW5nL2NvbW1vbi9rZXliaW5kaW5nRWRpdGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF1Qm5GLFFBQUEseUJBQXlCLEdBQUcsSUFBQSwrQkFBZSxFQUE0QiwwQkFBMEIsQ0FBQyxDQUFDO0lBZXpHLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsc0JBQVU7UUFLeEQsWUFDcUMsd0JBQTJDLEVBQzVDLGVBQWlDLEVBQ3JDLFdBQXlCLEVBQ2Qsc0JBQStDO1lBRXpGLEtBQUssRUFBRSxDQUFDO1lBTDRCLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBbUI7WUFDNUMsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ3JDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2QsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUd6RixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksYUFBSyxFQUFRLENBQUM7UUFDaEMsQ0FBQztRQUVELGFBQWEsQ0FBQyxjQUFzQyxFQUFFLEdBQVcsRUFBRSxJQUF3QjtZQUMxRixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsNkNBQTZDO1FBQ3JJLENBQUM7UUFFRCxjQUFjLENBQUMsY0FBc0MsRUFBRSxHQUFXLEVBQUUsSUFBd0I7WUFDM0YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JB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