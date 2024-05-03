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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/accessibility/common/accessibility", "vs/base/common/iconLabels", "vs/base/common/hash", "vs/base/common/event", "vs/platform/instantiation/common/extensions", "vs/base/common/iterator", "vs/platform/extensions/common/extensions", "vs/workbench/api/common/extHostTypes", "vs/workbench/common/theme"], function (require, exports, lifecycle_1, nls_1, instantiation_1, extensions_1, extensionsRegistry_1, statusbar_1, accessibility_1, iconLabels_1, hash_1, event_1, extensions_2, iterator_1, extensions_3, extHostTypes_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatusBarItemsExtensionPoint = exports.StatusBarUpdateKind = exports.IExtensionStatusBarItemService = void 0;
    // --- service
    exports.IExtensionStatusBarItemService = (0, instantiation_1.createDecorator)('IExtensionStatusBarItemService');
    var StatusBarUpdateKind;
    (function (StatusBarUpdateKind) {
        StatusBarUpdateKind[StatusBarUpdateKind["DidDefine"] = 0] = "DidDefine";
        StatusBarUpdateKind[StatusBarUpdateKind["DidUpdate"] = 1] = "DidUpdate";
    })(StatusBarUpdateKind || (exports.StatusBarUpdateKind = StatusBarUpdateKind = {}));
    let ExtensionStatusBarItemService = class ExtensionStatusBarItemService {
        constructor(_statusbarService) {
            this._statusbarService = _statusbarService;
            this._entries = new Map();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        dispose() {
            this._entries.forEach(entry => entry.accessor.dispose());
            this._entries.clear();
            this._onDidChange.dispose();
        }
        setOrUpdateEntry(entryId, id, extensionId, name, text, tooltip, command, color, backgroundColor, alignLeft, priority, accessibilityInformation) {
            // if there are icons in the text use the tooltip for the aria label
            let ariaLabel;
            let role = undefined;
            if (accessibilityInformation) {
                ariaLabel = accessibilityInformation.label;
                role = accessibilityInformation.role;
            }
            else {
                ariaLabel = (0, iconLabels_1.getCodiconAriaLabel)(text);
                if (tooltip) {
                    const tooltipString = typeof tooltip === 'string' ? tooltip : tooltip.value;
                    ariaLabel += `, ${tooltipString}`;
                }
            }
            let kind = undefined;
            switch (backgroundColor?.id) {
                case theme_1.STATUS_BAR_ERROR_ITEM_BACKGROUND:
                case theme_1.STATUS_BAR_WARNING_ITEM_BACKGROUND:
                    // override well known colors that map to status entry kinds to support associated themable hover colors
                    kind = backgroundColor.id === theme_1.STATUS_BAR_ERROR_ITEM_BACKGROUND ? 'error' : 'warning';
                    color = undefined;
                    backgroundColor = undefined;
            }
            const entry = { name, text, tooltip, command, color, backgroundColor, ariaLabel, role, kind };
            if (typeof priority === 'undefined') {
                priority = 0;
            }
            let alignment = alignLeft ? 0 /* StatusbarAlignment.LEFT */ : 1 /* StatusbarAlignment.RIGHT */;
            // alignment and priority can only be set once (at creation time)
            const existingEntry = this._entries.get(entryId);
            if (existingEntry) {
                alignment = existingEntry.alignment;
                priority = existingEntry.priority;
            }
            // Create new entry if not existing
            if (!existingEntry) {
                let entryPriority;
                if (typeof extensionId === 'string') {
                    // We cannot enforce unique priorities across all extensions, so we
                    // use the extension identifier as a secondary sort key to reduce
                    // the likelyhood of collisions.
                    // See https://github.com/microsoft/vscode/issues/177835
                    // See https://github.com/microsoft/vscode/issues/123827
                    entryPriority = { primary: priority, secondary: (0, hash_1.hash)(extensionId) };
                }
                else {
                    entryPriority = priority;
                }
                const accessor = this._statusbarService.addEntry(entry, id, alignment, entryPriority);
                this._entries.set(entryId, {
                    accessor,
                    entry,
                    alignment,
                    priority,
                    disposable: (0, lifecycle_1.toDisposable)(() => {
                        accessor.dispose();
                        this._entries.delete(entryId);
                        this._onDidChange.fire({ removed: entryId });
                    })
                });
                this._onDidChange.fire({ added: [entryId, { entry, alignment, priority }] });
                return 0 /* StatusBarUpdateKind.DidDefine */;
            }
            else {
                // Otherwise update
                existingEntry.accessor.update(entry);
                existingEntry.entry = entry;
                return 1 /* StatusBarUpdateKind.DidUpdate */;
            }
        }
        unsetEntry(entryId) {
            this._entries.get(entryId)?.disposable.dispose();
            this._entries.delete(entryId);
        }
        getEntries() {
            return this._entries.entries();
        }
    };
    ExtensionStatusBarItemService = __decorate([
        __param(0, statusbar_1.IStatusbarService)
    ], ExtensionStatusBarItemService);
    (0, extensions_2.registerSingleton)(exports.IExtensionStatusBarItemService, ExtensionStatusBarItemService, 1 /* InstantiationType.Delayed */);
    function isUserFriendlyStatusItemEntry(candidate) {
        const obj = candidate;
        return (typeof obj.id === 'string' && obj.id.length > 0)
            && typeof obj.name === 'string'
            && typeof obj.text === 'string'
            && (obj.alignment === 'left' || obj.alignment === 'right')
            && (obj.command === undefined || typeof obj.command === 'string')
            && (obj.tooltip === undefined || typeof obj.tooltip === 'string')
            && (obj.priority === undefined || typeof obj.priority === 'number')
            && (obj.accessibilityInformation === undefined || (0, accessibility_1.isAccessibilityInformation)(obj.accessibilityInformation));
    }
    const statusBarItemSchema = {
        type: 'object',
        required: ['id', 'text', 'alignment', 'name'],
        properties: {
            id: {
                type: 'string',
                markdownDescription: (0, nls_1.localize)('id', 'The identifier of the status bar entry. Must be unique within the extension. The same value must be used when calling the `vscode.window.createStatusBarItem(id, ...)`-API')
            },
            name: {
                type: 'string',
                description: (0, nls_1.localize)('name', 'The name of the entry, like \'Python Language Indicator\', \'Git Status\' etc. Try to keep the length of the name short, yet descriptive enough that users can understand what the status bar item is about.')
            },
            text: {
                type: 'string',
                description: (0, nls_1.localize)('text', 'The text to show for the entry. You can embed icons in the text by leveraging the `$(<name>)`-syntax, like \'Hello $(globe)!\'')
            },
            tooltip: {
                type: 'string',
                description: (0, nls_1.localize)('tooltip', 'The tooltip text for the entry.')
            },
            command: {
                type: 'string',
                description: (0, nls_1.localize)('command', 'The command to execute when the status bar entry is clicked.')
            },
            alignment: {
                type: 'string',
                enum: ['left', 'right'],
                description: (0, nls_1.localize)('alignment', 'The alignment of the status bar entry.')
            },
            priority: {
                type: 'number',
                description: (0, nls_1.localize)('priority', 'The priority of the status bar entry. Higher value means the item should be shown more to the left.')
            },
            accessibilityInformation: {
                type: 'object',
                description: (0, nls_1.localize)('accessibilityInformation', 'Defines the role and aria label to be used when the status bar entry is focused.'),
                properties: {
                    role: {
                        type: 'string',
                        description: (0, nls_1.localize)('accessibilityInformation.role', 'The role of the status bar entry which defines how a screen reader interacts with it. More about aria roles can be found here https://w3c.github.io/aria/#widget_roles')
                    },
                    label: {
                        type: 'string',
                        description: (0, nls_1.localize)('accessibilityInformation.label', 'The aria label of the status bar entry. Defaults to the entry\'s text.')
                    }
                }
            }
        }
    };
    const statusBarItemsSchema = {
        description: (0, nls_1.localize)('vscode.extension.contributes.statusBarItems', "Contributes items to the status bar."),
        oneOf: [
            statusBarItemSchema,
            {
                type: 'array',
                items: statusBarItemSchema
            }
        ]
    };
    const statusBarItemsExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'statusBarItems',
        jsonSchema: statusBarItemsSchema,
    });
    let StatusBarItemsExtensionPoint = class StatusBarItemsExtensionPoint {
        constructor(statusBarItemsService) {
            const contributions = new lifecycle_1.DisposableStore();
            statusBarItemsExtensionPoint.setHandler((extensions) => {
                contributions.clear();
                for (const entry of extensions) {
                    if (!(0, extensions_1.isProposedApiEnabled)(entry.description, 'contribStatusBarItems')) {
                        entry.collector.error(`The ${statusBarItemsExtensionPoint.name} is proposed API`);
                        continue;
                    }
                    const { value, collector } = entry;
                    for (const candidate of iterator_1.Iterable.wrap(value)) {
                        if (!isUserFriendlyStatusItemEntry(candidate)) {
                            collector.error((0, nls_1.localize)('invalid', "Invalid status bar item contribution."));
                            continue;
                        }
                        const fullItemId = (0, extHostTypes_1.asStatusBarItemIdentifier)(entry.description.identifier, candidate.id);
                        const kind = statusBarItemsService.setOrUpdateEntry(fullItemId, fullItemId, extensions_3.ExtensionIdentifier.toKey(entry.description.identifier), candidate.name ?? entry.description.displayName ?? entry.description.name, candidate.text, candidate.tooltip, candidate.command ? { id: candidate.command, title: candidate.name } : undefined, undefined, undefined, candidate.alignment === 'left', candidate.priority, candidate.accessibilityInformation);
                        if (kind === 0 /* StatusBarUpdateKind.DidDefine */) {
                            contributions.add((0, lifecycle_1.toDisposable)(() => statusBarItemsService.unsetEntry(fullItemId)));
                        }
                    }
                }
            });
        }
    };
    exports.StatusBarItemsExtensionPoint = StatusBarItemsExtensionPoint;
    exports.StatusBarItemsExtensionPoint = StatusBarItemsExtensionPoint = __decorate([
        __param(0, exports.IExtensionStatusBarItemService)
    ], StatusBarItemsExtensionPoint);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzQmFyRXh0ZW5zaW9uUG9pbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9zdGF0dXNCYXJFeHRlbnNpb25Qb2ludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF1QmhHLGNBQWM7SUFFRCxRQUFBLDhCQUE4QixHQUFHLElBQUEsK0JBQWUsRUFBaUMsZ0NBQWdDLENBQUMsQ0FBQztJQWFoSSxJQUFrQixtQkFHakI7SUFIRCxXQUFrQixtQkFBbUI7UUFDcEMsdUVBQVMsQ0FBQTtRQUNULHVFQUFTLENBQUE7SUFDVixDQUFDLEVBSGlCLG1CQUFtQixtQ0FBbkIsbUJBQW1CLFFBR3BDO0lBZUQsSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBNkI7UUFTbEMsWUFBK0IsaUJBQXFEO1lBQXBDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFMbkUsYUFBUSxHQUFtSyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBRXJMLGlCQUFZLEdBQUcsSUFBSSxlQUFPLEVBQXNDLENBQUM7WUFDekUsZ0JBQVcsR0FBOEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7UUFFRixDQUFDO1FBRXpGLE9BQU87WUFDTixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN6RCxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDN0IsQ0FBQztRQUVELGdCQUFnQixDQUFDLE9BQWUsRUFDL0IsRUFBVSxFQUFFLFdBQStCLEVBQUUsSUFBWSxFQUFFLElBQVks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