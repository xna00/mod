/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/workbench/common/memento", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/customEditor/common/extensionPoint", "vs/workbench/services/editor/common/editorResolverService"], function (require, exports, event_1, lifecycle_1, nls, memento_1, customEditor_1, extensionPoint_1, editorResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContributedCustomEditors = void 0;
    class ContributedCustomEditors extends lifecycle_1.Disposable {
        static { this.CUSTOM_EDITORS_STORAGE_ID = 'customEditors'; }
        static { this.CUSTOM_EDITORS_ENTRY_ID = 'editors'; }
        constructor(storageService) {
            super();
            this._editors = new Map();
            this._onChange = this._register(new event_1.Emitter());
            this.onChange = this._onChange.event;
            this._memento = new memento_1.Memento(ContributedCustomEditors.CUSTOM_EDITORS_STORAGE_ID, storageService);
            const mementoObject = this._memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            for (const info of (mementoObject[ContributedCustomEditors.CUSTOM_EDITORS_ENTRY_ID] || [])) {
                this.add(new customEditor_1.CustomEditorInfo(info));
            }
            extensionPoint_1.customEditorsExtensionPoint.setHandler(extensions => {
                this.update(extensions);
            });
        }
        update(extensions) {
            this._editors.clear();
            for (const extension of extensions) {
                for (const webviewEditorContribution of extension.value) {
                    this.add(new customEditor_1.CustomEditorInfo({
                        id: webviewEditorContribution.viewType,
                        displayName: webviewEditorContribution.displayName,
                        providerDisplayName: extension.description.isBuiltin ? nls.localize('builtinProviderDisplayName', "Built-in") : extension.description.displayName || extension.description.identifier.value,
                        selector: webviewEditorContribution.selector || [],
                        priority: getPriorityFromContribution(webviewEditorContribution, extension.description),
                    }));
                }
            }
            const mementoObject = this._memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            mementoObject[ContributedCustomEditors.CUSTOM_EDITORS_ENTRY_ID] = Array.from(this._editors.values());
            this._memento.saveMemento();
            this._onChange.fire();
        }
        [Symbol.iterator]() {
            return this._editors.values();
        }
        get(viewType) {
            return this._editors.get(viewType);
        }
        getContributedEditors(resource) {
            return Array.from(this._editors.values())
                .filter(customEditor => customEditor.matches(resource));
        }
        add(info) {
            if (this._editors.has(info.id)) {
                console.error(`Custom editor with id '${info.id}' already registered`);
                return;
            }
            this._editors.set(info.id, info);
        }
    }
    exports.ContributedCustomEditors = ContributedCustomEditors;
    function getPriorityFromContribution(contribution, extension) {
        switch (contribution.priority) {
            case editorResolverService_1.RegisteredEditorPriority.default:
            case editorResolverService_1.RegisteredEditorPriority.option:
                return contribution.priority;
            case editorResolverService_1.RegisteredEditorPriority.builtin:
                // Builtin is only valid for builtin extensions
                return extension.isBuiltin ? editorResolverService_1.RegisteredEditorPriority.builtin : editorResolverService_1.RegisteredEditorPriority.default;
            default:
                return editorResolverService_1.RegisteredEditorPriority.default;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0ZWRDdXN0b21FZGl0b3JzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jdXN0b21FZGl0b3IvY29tbW9uL2NvbnRyaWJ1dGVkQ3VzdG9tRWRpdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBYSx3QkFBeUIsU0FBUSxzQkFBVTtpQkFFL0IsOEJBQXlCLEdBQUcsZUFBZSxBQUFsQixDQUFtQjtpQkFDNUMsNEJBQXVCLEdBQUcsU0FBUyxBQUFaLENBQWE7UUFLNUQsWUFBWSxjQUErQjtZQUMxQyxLQUFLLEVBQUUsQ0FBQztZQUpRLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBNEIsQ0FBQztZQWtCL0MsY0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2pELGFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztZQWIvQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksaUJBQU8sQ0FBQyx3QkFBd0IsQ0FBQyx5QkFBeUIsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUVoRyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsNkRBQTZDLENBQUM7WUFDNUYsS0FBSyxNQUFNLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsQ0FBNkIsRUFBRSxDQUFDO2dCQUN4SCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksK0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBRUQsNENBQTJCLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUNuRCxJQUFJLENBQUMsTUFBTSxDQUFD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