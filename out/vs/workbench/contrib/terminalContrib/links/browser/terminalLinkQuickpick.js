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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/lifecycle", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/base/common/async", "vs/workbench/browser/quickaccess", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkParsing", "vs/platform/label/common/label", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation"], function (require, exports, dom_1, event_1, nls_1, quickInput_1, terminal_1, lifecycle_1, accessibleView_1, async_1, quickaccess_1, terminalLinkParsing_1, label_1, resources_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLinkQuickpick = void 0;
    let TerminalLinkQuickpick = class TerminalLinkQuickpick extends lifecycle_1.DisposableStore {
        constructor(_labelService, _quickInputService, _accessibleViewService, instantiationService) {
            super();
            this._labelService = _labelService;
            this._quickInputService = _quickInputService;
            this._accessibleViewService = _accessibleViewService;
            this._editorSequencer = new async_1.Sequencer();
            this._onDidRequestMoreLinks = this.add(new event_1.Emitter());
            this.onDidRequestMoreLinks = this._onDidRequestMoreLinks.event;
            this._terminalScrollStateSaved = false;
            this._editorViewState = this.add(instantiationService.createInstance(quickaccess_1.PickerEditorState));
        }
        async show(instance, links) {
            this._instance = instance;
            // Allow all links a small amount of time to elapse to finish, if this is not done in this
            // time they will be loaded upon the first filter.
            const result = await Promise.race([links.all, (0, async_1.timeout)(500)]);
            const usingAllLinks = typeof result === 'object';
            const resolvedLinks = usingAllLinks ? result : links.viewport;
            // Get raw link picks
            const wordPicks = resolvedLinks.wordLinks ? await this._generatePicks(resolvedLinks.wordLinks) : undefined;
            const filePicks = resolvedLinks.fileLinks ? await this._generatePicks(resolvedLinks.fileLinks) : undefined;
            const folderPicks = resolvedLinks.folderLinks ? await this._generatePicks(resolvedLinks.folderLinks) : undefined;
            const webPicks = resolvedLinks.webLinks ? await this._generatePicks(resolvedLinks.webLinks) : undefined;
            const picks = [];
            if (webPicks) {
                picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.urlLinks', "Url") });
                picks.push(...webPicks);
            }
            if (filePicks) {
                picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.localFileLinks', "File") });
                picks.push(...filePicks);
            }
            if (folderPicks) {
                picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.localFolderLinks', "Folder") });
                picks.push(...folderPicks);
            }
            if (wordPicks) {
                picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.searchLinks', "Workspace Search") });
                picks.push(...wordPicks);
            }
            // Create and show quick pick
            const pick = this._quickInputService.createQuickPick();
            pick.items = picks;
            pick.placeholder = (0, nls_1.localize)('terminal.integrated.openDetectedLink', "Select the link to open, type to filter all links");
            pick.sortByLabel = false;
            pick.show();
            if (pick.activeItems.length > 0) {
                this._previewItem(pick.activeItems[0]);
            }
            // Show all results only when filtering begins, this is done so the quick pick will show up
            // ASAP with only the viewport entries.
            let accepted = false;
            const disposables = new lifecycle_1.DisposableStore();
            if (!usingAllLinks) {
                disposables.add(event_1.Event.once(pick.onDidChangeValue)(async () => {
                    const allLinks = await links.all;
                    if (accepted) {
                        return;
                    }
                    const wordIgnoreLinks = [...(allLinks.fileLinks ?? []), ...(allLinks.folderLinks ?? []), ...(allLinks.webLinks ?? [])];
                    const wordPicks = allLinks.wordLinks ? await this._generatePicks(allLinks.wordLinks, wordIgnoreLinks) : undefined;
                    const filePicks = allLinks.fileLinks ? await this._generatePicks(allLinks.fileLinks) : undefined;
                    const folderPicks = allLinks.folderLinks ? await this._generatePicks(allLinks.folderLinks) : undefined;
                    const webPicks = allLinks.webLinks ? await this._generatePicks(allLinks.webLinks) : undefined;
                    const picks = [];
                    if (webPicks) {
                        picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.urlLinks', "Url") });
                        picks.push(...webPicks);
                    }
                    if (filePicks) {
                        picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.localFileLinks', "File") });
                        picks.push(...filePicks);
                    }
                    if (folderPicks) {
                        picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.localFolderLinks', "Folder") });
                        picks.push(...folderPicks);
                    }
                    if (wordPicks) {
                        picks.push({ type: 'separator', label: (0, nls_1.localize)('terminal.integrated.searchLinks', "Workspace Search") });
                        picks.push(...wordPicks);
                    }
                    pick.items = picks;
                }));
            }
            disposables.add(pick.onDidChangeActive(async () => {
                const [item] = pick.activeItems;
                this._previewItem(item);
            }));
            return new Promise(r => {
                disposables.add(pick.onDidHide(({ reason }) => {
                    // Restore terminal scroll state
                    if (this._terminalScrollStateSaved) {
                        const markTracker = this._instance?.xterm?.markTracker;
                        if (markTracker) {
                            markTracker.restoreScrollState();
                            markTracker.clear();
                            this._terminalScrollStateSaved = false;
                        }
                    }
                    // Restore view state upon cancellation if we changed it
                    // but only when the picker was closed via explicit user
                    // gesture and not e.g. when focus was lost because that
                    // could mean the user clicked into the editor directly.
                    if (reason === quickInput_1.QuickInputHideReason.Gesture) {
                        this._editorViewState.restore();
                    }
                    disposables.dispose();
                    if (pick.selectedItems.length === 0) {
                        this._accessibleViewService.showLastProvider("terminal" /* AccessibleViewProviderId.Terminal */);
                    }
                    r();
                }));
                disposables.add(event_1.Event.once(pick.onDidAccept)(() => {
                    // Restore terminal scroll state
                    if (this._terminalScrollStateSaved) {
                        const markTracker = this._instance?.xterm?.markTracker;
                        if (markTracker) {
                            markTracker.restoreScrollState();
                            markTracker.clear();
                            this._terminalScrollStateSaved = false;
                        }
                    }
                    accepted = true;
                    const event = new terminal_1.TerminalLinkQuickPickEvent(dom_1.EventType.CLICK);
                    const activeItem = pick.activeItems?.[0];
                    if (activeItem && 'link' in activeItem) {
                        activeItem.link.activate(event, activeItem.label);
                    }
                    disposables.dispose();
                    r();
                }));
            });
        }
        /**
         * @param ignoreLinks Links with labels to not include in the picks.
         */
        async _generatePicks(links, ignoreLinks) {
            if (!links) {
                return;
            }
            const linkTextKeys = new Set();
            const linkUriKeys = new Set();
            const picks = [];
            for (const link of links) {
                let label = link.text;
                if (!linkTextKeys.has(label) && (!ignoreLinks || !ignoreLinks.some(e => e.text === label))) {
                    linkTextKeys.add(label);
                    // Add a consistently formatted resolved URI label to the description if applicable
                    let description;
                    if ('uri' in link && link.uri) {
                        // For local files and folders, mimic the presentation of go to file
                        if (link.type === "LocalFile" /* TerminalBuiltinLinkType.LocalFile */ ||
                            link.type === "LocalFolderInWorkspace" /* TerminalBuiltinLinkType.LocalFolderInWorkspace */ ||
                            link.type === "LocalFolderOutsideWorkspace" /* TerminalBuiltinLinkType.LocalFolderOutsideWorkspace */) {
                            label = (0, resources_1.basenameOrAuthority)(link.uri);
                            description = this._labelService.getUriLabel((0, resources_1.dirname)(link.uri), { relative: true });
                        }
                        // Add line and column numbers to the label if applicable
                        if (link.type === "LocalFile" /* TerminalBuiltinLinkType.LocalFile */) {
                            if (link.parsedLink?.suffix?.row !== undefined) {
                                label += `:${link.parsedLink.suffix.row}`;
                                if (link.parsedLink?.suffix?.rowEnd !== undefined) {
                                    label += `-${link.parsedLink.suffix.rowEnd}`;
                                }
                                if (link.parsedLink?.suffix?.col !== undefined) {
                                    label += `:${link.parsedLink.suffix.col}`;
                                    if (link.parsedLink?.suffix?.colEnd !== undefined) {
                                        label += `-${link.parsedLink.suffix.colEnd}`;
                                    }
                                }
                            }
                        }
                        // Skip the link if it's a duplicate URI + line/col
                        if (linkUriKeys.has(label + '|' + (description ?? ''))) {
                            continue;
                        }
                        linkUriKeys.add(label + '|' + (description ?? ''));
                    }
                    picks.push({ label, link, description });
                }
            }
            return picks.length > 0 ? picks : undefined;
        }
        _previewItem(item) {
            if (!item || !('link' in item) || !item.link) {
                return;
            }
            // Any link can be previewed in the termninal
            const link = item.link;
            this._previewItemInTerminal(link);
            if (!('uri' in link) || !link.uri) {
                return;
            }
            if (link.type !== "LocalFile" /* TerminalBuiltinLinkType.LocalFile */) {
                return;
            }
            this._previewItemInEditor(link);
        }
        _previewItemInEditor(link) {
            const linkSuffix = link.parsedLink ? link.parsedLink.suffix : (0, terminalLinkParsing_1.getLinkSuffix)(link.text);
            const selection = linkSuffix?.row === undefined ? undefined : {
                startLineNumber: linkSuffix.row ?? 1,
                startColumn: linkSuffix.col ?? 1,
                endLineNumber: linkSuffix.rowEnd,
                endColumn: linkSuffix.colEnd
            };
            this._editorViewState.set();
            this._editorSequencer.queue(async () => {
                await this._editorViewState.openTransientEditor({
                    resource: link.uri,
                    options: { preserveFocus: true, revealIfOpened: true, ignoreError: true, selection, }
                });
            });
        }
        _previewItemInTerminal(link) {
            const xterm = this._instance?.xterm;
            if (!xterm) {
                return;
            }
            if (!this._terminalScrollStateSaved) {
                xterm.markTracker.saveScrollState();
                this._terminalScrollStateSaved = true;
            }
            xterm.markTracker.revealRange(link.range);
        }
    };
    exports.TerminalLinkQuickpick = TerminalLinkQuickpick;
    exports.TerminalLinkQuickpick = TerminalLinkQuickpick = __decorate([
        __param(0, label_1.ILabelService),
        __param(1, quickInput_1.IQuickInputService),
        __param(2, accessibleView_1.IAccessibleViewService),
        __param(3, instantiation_1.IInstantiationService)
    ], TerminalLinkQuickpick);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rUXVpY2twaWNrLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvbGlua3MvYnJvd3Nlci90ZXJtaW5hbExpbmtRdWlja3BpY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUJ6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLDJCQUFlO1FBVXpELFlBQ2dCLGFBQTZDLEVBQ3hDLGtCQUF1RCxFQUNuRCxzQkFBK0QsRUFDaEUsb0JBQTJDO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBTHdCLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQ3ZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDbEMsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF3QjtZQVh2RSxxQkFBZ0IsR0FBRyxJQUFJLGlCQUFTLEVBQUUsQ0FBQztZQUtuQywyQkFBc0IsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMvRCwwQkFBcUIsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1lBaVAzRCw4QkFBeUIsR0FBWSxLQUFLLENBQUM7WUF4T2xELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywrQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFDMUYsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBdUQsRUFBRSxLQUFpRTtZQUNwSSxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUUxQiwwRkFBMEY7WUFDMUYsa0RBQWtEO1lBQ2xELE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBQSxlQUFPLEVBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdELE1BQU0sYUFBYSxHQUFHLE9BQU8sTUFBTSxLQUFLLFFBQVEsQ0FBQztZQUNqRCxNQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztZQUU5RCxxQkFBcUI7WUFDckIsTUFBTSxTQUFTLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQzNHLE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUMzRyxNQUFNLFdBQVcsR0FBRyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDakgsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBRXhHLE1BQU0sS0FBSyxHQUF3QixFQUFFLENBQUM7WUFDdEMsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDZCxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsOEJBQThCLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMxRixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7WUFDekIsQ0FBQztZQUNELElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLG9DQUFvQyxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDakcsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDO1lBQzFCLENBQUM7WUFDRCxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUNqQixLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0NBQXNDLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNyRyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUM7WUFDNUIsQ0FBQztZQUNELElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGlDQUFpQyxFQUFFLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMxRyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUM7WUFDMUIsQ0FBQztZQUVELDZCQUE2QjtZQUM3QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxFQUErQyxDQUFDO1lBQ3BHLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBQSxjQUFRLEVBQUMsc0NBQXNDLEVBQUUsbURBQW1ELENBQUMsQ0FBQztZQUN6SCxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztZQUN6QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWixJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxDQUFDO1lBRUQsMkZBQTJGO1lBQzNGLHVDQUF1QztZQUN2QyxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUM7WUFDckIsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDMUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNwQixXQUFXLENBQUMsR0FBRyxDQUFDLGFBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUU7b0JBQzVELE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQztvQkFDakMsSUFBSSxRQUFRLEVBQUUsQ0FBQzt3QkFDZCxPQUFPO29CQUNSLENBQUM7b0JBQ0QsTUFBTSxlQUFlLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUV2SCxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO29CQUNsSCxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7b0JBQ2pHLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztvQkFDdkcsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO29CQUM5RixNQUFNLEtBQUssR0FBd0IsRUFBRSxDQUFDO29CQUN0QyxJQUFJLFFBQVEsRUFBRSxDQUFDO3dCQUNkLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyw4QkFBOEIsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQzFGLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQztvQkFDekIsQ0FBQztvQkFDRCxJQUFJLFNBQVMsRUFBRSxDQUFDO3dCQUNmLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxvQ0FBb0MsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQ2pHLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztvQkFDMUIsQ0FBQztvQkFDRCxJQUFJLFdBQVcsRUFBRSxDQUFDO3dCQUNqQixLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0NBQXNDLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUNyRyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUM7b0JBQzVCLENBQUM7b0JBQ0QsSUFBSSxTQUFTLEVBQUUsQ0FBQzt3QkFDZixLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUNBQWlDLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQzFHLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztvQkFDMUIsQ0FBQztvQkFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztnQkFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFFRCxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDakQsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3RCLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtvQkFFN0MsZ0NBQWdDO29CQUNoQyxJQUFJLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO3dCQUNwQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxXQUFXLENBQUM7d0JBQ3ZELElBQUksV0FBVyxFQUFFLENBQUM7NEJBQ2pCLFdBQVcsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDOzRCQUNqQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7NEJBQ3BCLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxLQUFLLENBQUM7d0JBQ3hDLENBQUM7b0JBQ0YsQ0FBQztvQkFFRCx3REFBd0Q7b0JBQ3hELHdEQUF3RDtvQkFDeEQsd0RBQXdEO29CQUN4RCx3REFBd0Q7b0JBQ3hELElBQUksTUFBTSxLQUFLLGlDQUFvQixDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUM3QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2pDLENBQUM7b0JBQ0QsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUN0QixJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUNyQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsZ0JBQWdCLG9EQUFtQyxDQUFDO29CQUNqRixDQUFDO29CQUNELENBQUMsRUFBRSxDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0osV0FBVyxDQUFDLEdBQUcsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLEVBQUU7b0JBQ2pELGdDQUFnQztvQkFDaEMsSUFBSSxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQzt3QkFDcEMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDO3dCQUN2RCxJQUFJLFdBQVcsRUFBRSxDQUFDOzRCQUNqQixXQUFXLENBQUMsa0JBQWtCLEVBQUUsQ0FBQzs0QkFDakMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDOzRCQUNwQixJQUFJLENBQUMseUJBQXlCLEdBQUcsS0FBSyxDQUFDO3dCQUN4QyxDQUFDO29CQUNGLENBQUM7b0JBRUQsUUFBUSxHQUFHLElBQUksQ0FBQztvQkFDaEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxxQ0FBMEIsQ0FBQyxlQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzlELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDekMsSUFBSSxVQUFVLElBQUksTUFBTSxJQUFJLFVBQVUsRUFBRSxDQUFDO3dCQUN4QyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNuRCxDQUFDO29CQUNELFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDdEIsQ0FBQyxFQUFFLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVEOztXQUVHO1FBQ0ssS0FBSyxDQUFDLGNBQWMsQ0FBQyxLQUErQixFQUFFLFdBQXFCO1lBQ2xGLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sWUFBWSxHQUFnQixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQzVDLE1BQU0sV0FBVyxHQUFnQixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQzNDLE1BQU0sS0FBSyxHQUFpQyxFQUFFLENBQUM7WUFDL0MsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDdEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDNUYsWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFFeEIsbUZBQW1GO29CQUNuRixJQUFJLFdBQStCLENBQUM7b0JBQ3BDLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7d0JBQy9CLG9FQUFvRTt3QkFDcEUsSUFDQyxJQUFJLENBQUMsSUFBSSx3REFBc0M7NEJBQy9DLElBQUksQ0FBQyxJQUFJLGtGQUFtRDs0QkFDNUQsSUFBSSxDQUFDLElBQUksNEZBQXdELEVBQ2hFLENBQUM7NEJBQ0YsS0FBSyxHQUFHLElBQUEsK0JBQW1CLEVBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUN0QyxXQUFXLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsSUFBQSxtQkFBTyxFQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO3dCQUNyRixDQUFDO3dCQUVELHlEQUF5RDt3QkFDekQsSUFBSSxJQUFJLENBQUMsSUFBSSx3REFBc0MsRUFBRSxDQUFDOzRCQUNyRCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQ0FDaEQsS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7Z0NBQzFDLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxLQUFLLFNBQVMsRUFBRSxDQUFDO29DQUNuRCxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQ0FDOUMsQ0FBQztnQ0FDRCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBQztvQ0FDaEQsS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7b0NBQzFDLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxLQUFLLFNBQVMsRUFBRSxDQUFDO3dDQUNuRCxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQ0FDOUMsQ0FBQztnQ0FDRixDQUFDOzRCQUNGLENBQUM7d0JBQ0YsQ0FBQzt3QkFFRCxtREFBbUQ7d0JBQ25ELElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsR0FBRyxHQUFHLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQzs0QkFDeEQsU0FBUzt3QkFDVixDQUFDO3dCQUNELFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNwRCxDQUFDO29CQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7Z0JBQzFDLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDN0MsQ0FBQztRQUVPLFlBQVksQ0FBQyxJQUFpRDtZQUNyRSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzlDLE9BQU87WUFDUixDQUFDO1lBRUQsNkNBQTZDO1lBQzdDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDdkIsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBRWxDLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDbkMsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxJQUFJLHdEQUFzQyxFQUFFLENBQUM7Z0JBQ3JELE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFTyxvQkFBb0IsQ0FBQyxJQUFrQjtZQUM5QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBQSxtQ0FBYSxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2RixNQUFNLFNBQVMsR0FBRyxVQUFVLEVBQUUsR0FBRyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDN0QsZUFBZSxFQUFFLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDcEMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDaEMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxNQUFNO2dCQUNoQyxTQUFTLEVBQUUsVUFBVSxDQUFDLE1BQU07YUFDNUIsQ0FBQztZQUVGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUN0QyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQztvQkFDL0MsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHO29CQUNsQixPQUFPLEVBQUUsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxTQUFTLEdBQUc7aUJBQ3JGLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUdPLHNCQUFzQixDQUFDLElBQVc7WUFDekMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUM7WUFDcEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO2dCQUNyQyxLQUFLLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUNwQyxJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDO1lBQ3ZDLENBQUM7WUFDRCxLQUFLLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0MsQ0FBQztLQUNELENBQUE7SUFyUVksc0RBQXFCO29DQUFyQixxQkFBcUI7UUFXL0IsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLHVDQUFzQixDQUFBO1FBQ3RCLFdBQUEscUNBQXFCLENBQUE7T0FkWCxxQkFBcUIsQ0FxUWpDIn0=