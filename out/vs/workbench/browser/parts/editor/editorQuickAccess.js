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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/getIconClasses", "vs/base/common/fuzzyScorer", "vs/base/common/codicons", "vs/base/common/themables", "vs/css!./media/editorquickaccess"], function (require, exports, nls_1, quickInput_1, pickerQuickAccess_1, editorGroupsService_1, editor_1, editorService_1, model_1, language_1, getIconClasses_1, fuzzyScorer_1, codicons_1, themables_1) {
    "use strict";
    var ActiveGroupEditorsByMostRecentlyUsedQuickAccess_1, AllEditorsByAppearanceQuickAccess_1, AllEditorsByMostRecentlyUsedQuickAccess_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AllEditorsByMostRecentlyUsedQuickAccess = exports.AllEditorsByAppearanceQuickAccess = exports.ActiveGroupEditorsByMostRecentlyUsedQuickAccess = exports.BaseEditorQuickAccessProvider = void 0;
    let BaseEditorQuickAccessProvider = class BaseEditorQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(prefix, editorGroupService, editorService, modelService, languageService) {
            super(prefix, {
                canAcceptInBackground: true,
                noResultsPick: {
                    label: (0, nls_1.localize)('noViewResults', "No matching editors"),
                    groupId: -1
                }
            });
            this.editorGroupService = editorGroupService;
            this.editorService = editorService;
            this.modelService = modelService;
            this.languageService = languageService;
            this.pickState = new class {
                constructor() {
                    this.scorerCache = Object.create(null);
                    this.isQuickNavigating = undefined;
                }
                reset(isQuickNavigating) {
                    // Caches
                    if (!isQuickNavigating) {
                        this.scorerCache = Object.create(null);
                    }
                    // Other
                    this.isQuickNavigating = isQuickNavigating;
                }
            };
        }
        provide(picker, token) {
            // Reset the pick state for this run
            this.pickState.reset(!!picker.quickNavigate);
            // Start picker
            return super.provide(picker, token);
        }
        _getPicks(filter) {
            const query = (0, fuzzyScorer_1.prepareQuery)(filter);
            // Filtering
            const filteredEditorEntries = this.doGetEditorPickItems().filter(entry => {
                if (!query.normalized) {
                    return true;
                }
                // Score on label and description
                const itemScore = (0, fuzzyScorer_1.scoreItemFuzzy)(entry, query, true, quickInput_1.quickPickItemScorerAccessor, this.pickState.scorerCache);
                if (!itemScore.score) {
                    return false;
                }
                // Apply highlights
                entry.highlights = { label: itemScore.labelMatch, description: itemScore.descriptionMatch };
                return true;
            });
            // Sorting
            if (query.normalized) {
                const groups = this.editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */).map(group => group.id);
                filteredEditorEntries.sort((entryA, entryB) => {
                    if (entryA.groupId !== entryB.groupId) {
                        return groups.indexOf(entryA.groupId) - groups.indexOf(entryB.groupId); // older groups first
                    }
                    return (0, fuzzyScorer_1.compareItemsByFuzzyScore)(entryA, entryB, query, true, quickInput_1.quickPickItemScorerAccessor, this.pickState.scorerCache);
                });
            }
            // Grouping (for more than one group)
            const filteredEditorEntriesWithSeparators = [];
            if (this.editorGroupService.count > 1) {
                let lastGroupId = undefined;
                for (const entry of filteredEditorEntries) {
                    if (typeof lastGroupId !== 'number' || lastGroupId !== entry.groupId) {
                        const group = this.editorGroupService.getGroup(entry.groupId);
                        if (group) {
                            filteredEditorEntriesWithSeparators.push({ type: 'separator', label: group.label });
                        }
                        lastGroupId = entry.groupId;
                    }
                    filteredEditorEntriesWithSeparators.push(entry);
                }
            }
            else {
                filteredEditorEntriesWithSeparators.push(...filteredEditorEntries);
            }
            return filteredEditorEntriesWithSeparators;
        }
        doGetEditorPickItems() {
            const editors = this.doGetEditors();
            const mapGroupIdToGroupAriaLabel = new Map();
            for (const { groupId } of editors) {
                if (!mapGroupIdToGroupAriaLabel.has(groupId)) {
                    const group = this.editorGroupService.getGroup(groupId);
                    if (group) {
                        mapGroupIdToGroupAriaLabel.set(groupId, group.ariaLabel);
                    }
                }
            }
            return this.doGetEditors().map(({ editor, groupId }) => {
                const resource = editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                const isDirty = editor.isDirty() && !editor.isSaving();
                const description = editor.getDescription();
                const nameAndDescription = description ? `${editor.getName()} ${description}` : editor.getName();
                return {
                    groupId,
                    resource,
                    label: editor.getName(),
                    ariaLabel: (() => {
                        if (mapGroupIdToGroupAriaLabel.size > 1) {
                            return isDirty ?
                                (0, nls_1.localize)('entryAriaLabelWithGroupDirty', "{0}, unsaved changes, {1}", nameAndDescription, mapGroupIdToGroupAriaLabel.get(groupId)) :
                                (0, nls_1.localize)('entryAriaLabelWithGroup', "{0}, {1}", nameAndDescription, mapGroupIdToGroupAriaLabel.get(groupId));
                        }
                        return isDirty ? (0, nls_1.localize)('entryAriaLabelDirty', "{0}, unsaved changes", nameAndDescription) : nameAndDescription;
                    })(),
                    description,
                    iconClasses: (0, getIconClasses_1.getIconClasses)(this.modelService, this.languageService, resource, undefined, editor.getIcon()).concat(editor.getLabelExtraClasses()),
                    italic: !this.editorGroupService.getGroup(groupId)?.isPinned(editor),
                    buttons: (() => {
                        return [
                            {
                                iconClass: isDirty ? ('dirty-editor ' + themables_1.ThemeIcon.asClassName(codicons_1.Codicon.closeDirty)) : themables_1.ThemeIcon.asClassName(codicons_1.Codicon.close),
                                tooltip: (0, nls_1.localize)('closeEditor', "Close Editor"),
                                alwaysVisible: isDirty
                            }
                        ];
                    })(),
                    trigger: async () => {
                        const group = this.editorGroupService.getGroup(groupId);
                        if (group) {
                            await group.closeEditor(editor, { preserveFocus: true });
                            if (!group.contains(editor)) {
                                return pickerQuickAccess_1.TriggerAction.REMOVE_ITEM;
                            }
                        }
                        return pickerQuickAccess_1.TriggerAction.NO_ACTION;
                    },
                    accept: (keyMods, event) => this.editorGroupService.getGroup(groupId)?.openEditor(editor, { preserveFocus: event.inBackground }),
                };
            });
        }
    };
    exports.BaseEditorQuickAccessProvider = BaseEditorQuickAccessProvider;
    exports.BaseEditorQuickAccessProvider = BaseEditorQuickAccessProvider = __decorate([
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, editorService_1.IEditorService),
        __param(3, model_1.IModelService),
        __param(4, language_1.ILanguageService)
    ], BaseEditorQuickAccessProvider);
    //#region Active Editor Group Editors by Most Recently Used
    let ActiveGroupEditorsByMostRecentlyUsedQuickAccess = class ActiveGroupEditorsByMostRecentlyUsedQuickAccess extends BaseEditorQuickAccessProvider {
        static { ActiveGroupEditorsByMostRecentlyUsedQuickAccess_1 = this; }
        static { this.PREFIX = 'edt active '; }
        constructor(editorGroupService, editorService, modelService, languageService) {
            super(ActiveGroupEditorsByMostRecentlyUsedQuickAccess_1.PREFIX, editorGroupService, editorService, modelService, languageService);
        }
        doGetEditors() {
            const group = this.editorGroupService.activeGroup;
            return group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).map(editor => ({ editor, groupId: group.id }));
        }
    };
    exports.ActiveGroupEditorsByMostRecentlyUsedQuickAccess = ActiveGroupEditorsByMostRecentlyUsedQuickAccess;
    exports.ActiveGroupEditorsByMostRecentlyUsedQuickAccess = ActiveGroupEditorsByMostRecentlyUsedQuickAccess = ActiveGroupEditorsByMostRecentlyUsedQuickAccess_1 = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, editorService_1.IEditorService),
        __param(2, model_1.IModelService),
        __param(3, language_1.ILanguageService)
    ], ActiveGroupEditorsByMostRecentlyUsedQuickAccess);
    //#endregion
    //#region All Editors by Appearance
    let AllEditorsByAppearanceQuickAccess = class AllEditorsByAppearanceQuickAccess extends BaseEditorQuickAccessProvider {
        static { AllEditorsByAppearanceQuickAccess_1 = this; }
        static { this.PREFIX = 'edt '; }
        constructor(editorGroupService, editorService, modelService, languageService) {
            super(AllEditorsByAppearanceQuickAccess_1.PREFIX, editorGroupService, editorService, modelService, languageService);
        }
        doGetEditors() {
            const entries = [];
            for (const group of this.editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)) {
                for (const editor of group.getEditors(1 /* EditorsOrder.SEQUENTIAL */)) {
                    entries.push({ editor, groupId: group.id });
                }
            }
            return entries;
        }
    };
    exports.AllEditorsByAppearanceQuickAccess = AllEditorsByAppearanceQuickAccess;
    exports.AllEditorsByAppearanceQuickAccess = AllEditorsByAppearanceQuickAccess = AllEditorsByAppearanceQuickAccess_1 = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, editorService_1.IEditorService),
        __param(2, model_1.IModelService),
        __param(3, language_1.ILanguageService)
    ], AllEditorsByAppearanceQuickAccess);
    //#endregion
    //#region All Editors by Most Recently Used
    let AllEditorsByMostRecentlyUsedQuickAccess = class AllEditorsByMostRecentlyUsedQuickAccess extends BaseEditorQuickAccessProvider {
        static { AllEditorsByMostRecentlyUsedQuickAccess_1 = this; }
        static { this.PREFIX = 'edt mru '; }
        constructor(editorGroupService, editorService, modelService, languageService) {
            super(AllEditorsByMostRecentlyUsedQuickAccess_1.PREFIX, editorGroupService, editorService, modelService, languageService);
        }
        doGetEditors() {
            const entries = [];
            for (const editor of this.editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)) {
                entries.push(editor);
            }
            return entries;
        }
    };
    exports.AllEditorsByMostRecentlyUsedQuickAccess = AllEditorsByMostRecentlyUsedQuickAccess;
    exports.AllEditorsByMostRecentlyUsedQuickAccess = AllEditorsByMostRecentlyUsedQuickAccess = AllEditorsByMostRecentlyUsedQuickAccess_1 = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, editorService_1.IEditorService),
        __param(2, model_1.IModelService),
        __param(3, language_1.ILanguageService)
    ], AllEditorsByMostRecentlyUsedQuickAccess);
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUXVpY2tBY2Nlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9lZGl0b3JRdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0J6RixJQUFlLDZCQUE2QixHQUE1QyxNQUFlLDZCQUE4QixTQUFRLDZDQUErQztRQW1CMUcsWUFDQyxNQUFjLEVBQ1Esa0JBQTJELEVBQ2pFLGFBQWdELEVBQ2pELFlBQTRDLEVBQ3pDLGVBQWtEO1lBRXBFLEtBQUssQ0FBQyxNQUFNLEVBQ1g7Z0JBQ0MscUJBQXFCLEVBQUUsSUFBSTtnQkFDM0IsYUFBYSxFQUFFO29CQUNkLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUscUJBQXFCLENBQUM7b0JBQ3ZELE9BQU8sRUFBRSxDQUFDLENBQUM7aUJBQ1g7YUFDRCxDQUNELENBQUM7WUFidUMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFzQjtZQUM5QyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDaEMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDeEIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBdEJwRCxjQUFTLEdBQUcsSUFBSTtnQkFBQTtvQkFFaEMsZ0JBQVcsR0FBcUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDcEQsc0JBQWlCLEdBQXdCLFNBQVMsQ0FBQztnQkFZcEQsQ0FBQztnQkFWQSxLQUFLLENBQUMsaUJBQTBCO29CQUUvQixTQUFTO29CQUNULElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO3dCQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3hDLENBQUM7b0JB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