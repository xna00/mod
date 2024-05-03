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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/keybinding/common/keybinding", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/base/browser/dom", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry"], function (require, exports, nls_1, lifecycle_1, platform_1, keybinding_1, workspace_1, configuration_1, dom_1, keybindingLabel_1, commands_1, contextkey_1, defaultStyles_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorGroupWatermark = void 0;
    (0, colorRegistry_1.registerColor)('editorWatermark.foreground', { dark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.6), light: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.68), hcDark: colorRegistry_1.editorForeground, hcLight: colorRegistry_1.editorForeground }, (0, nls_1.localize)('editorLineHighlight', 'Foreground color for the labels in the editor watermark.'));
    const showCommands = { text: (0, nls_1.localize)('watermark.showCommands', "Show All Commands"), id: 'workbench.action.showCommands' };
    const quickAccess = { text: (0, nls_1.localize)('watermark.quickAccess', "Go to File"), id: 'workbench.action.quickOpen' };
    const openFileNonMacOnly = { text: (0, nls_1.localize)('watermark.openFile', "Open File"), id: 'workbench.action.files.openFile', mac: false };
    const openFolderNonMacOnly = { text: (0, nls_1.localize)('watermark.openFolder', "Open Folder"), id: 'workbench.action.files.openFolder', mac: false };
    const openFileOrFolderMacOnly = { text: (0, nls_1.localize)('watermark.openFileFolder', "Open File or Folder"), id: 'workbench.action.files.openFileFolder', mac: true };
    const openRecent = { text: (0, nls_1.localize)('watermark.openRecent', "Open Recent"), id: 'workbench.action.openRecent' };
    const newUntitledFileMacOnly = { text: (0, nls_1.localize)('watermark.newUntitledFile', "New Untitled Text File"), id: 'workbench.action.files.newUntitledFile', mac: true };
    const findInFiles = { text: (0, nls_1.localize)('watermark.findInFiles', "Find in Files"), id: 'workbench.action.findInFiles' };
    const toggleTerminal = { text: (0, nls_1.localize)({ key: 'watermark.toggleTerminal', comment: ['toggle is a verb here'] }, "Toggle Terminal"), id: 'workbench.action.terminal.toggleTerminal', when: contextkey_1.ContextKeyExpr.equals('terminalProcessSupported', true) };
    const startDebugging = { text: (0, nls_1.localize)('watermark.startDebugging', "Start Debugging"), id: 'workbench.action.debug.start', when: contextkey_1.ContextKeyExpr.equals('terminalProcessSupported', true) };
    const toggleFullscreen = { text: (0, nls_1.localize)({ key: 'watermark.toggleFullscreen', comment: ['toggle is a verb here'] }, "Toggle Full Screen"), id: 'workbench.action.toggleFullScreen' };
    const showSettings = { text: (0, nls_1.localize)('watermark.showSettings', "Show Settings"), id: 'workbench.action.openSettings' };
    const noFolderEntries = [
        showCommands,
        openFileNonMacOnly,
        openFolderNonMacOnly,
        openFileOrFolderMacOnly,
        openRecent,
        newUntitledFileMacOnly
    ];
    const folderEntries = [
        showCommands,
        quickAccess,
        findInFiles,
        startDebugging,
        toggleTerminal,
        toggleFullscreen,
        showSettings
    ];
    let EditorGroupWatermark = class EditorGroupWatermark extends lifecycle_1.Disposable {
        constructor(container, keybindingService, contextService, contextKeyService, configurationService) {
            super();
            this.keybindingService = keybindingService;
            this.contextService = contextService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.transientDisposables = this._register(new lifecycle_1.DisposableStore());
            this.enabled = false;
            const elements = (0, dom_1.h)('.editor-group-watermark', [
                (0, dom_1.h)('.letterpress'),
                (0, dom_1.h)('.shortcuts@shortcuts'),
            ]);
            (0, dom_1.append)(container, elements.root);
            this.shortcuts = elements.shortcuts;
            this.registerListeners();
            this.workbenchState = contextService.getWorkbenchState();
            this.render();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.tips.enabled')) {
                    this.render();
                }
            }));
            this._register(this.contextService.onDidChangeWorkbenchState(workbenchState => {
                if (this.workbenchState === workbenchState) {
                    return;
                }
                this.workbenchState = workbenchState;
                this.render();
            }));
            const allEntriesWhenClauses = [...noFolderEntries, ...folderEntries].filter(entry => entry.when !== undefined).map(entry => entry.when);
            const allKeys = new Set();
            allEntriesWhenClauses.forEach(when => when.keys().forEach(key => allKeys.add(key)));
            this._register(this.contextKeyService.onDidChangeContext(e => {
                if (e.affectsSome(allKeys)) {
                    this.render();
                }
            }));
        }
        render() {
            const enabled = this.configurationService.getValue('workbench.tips.enabled');
            if (enabled === this.enabled) {
                return;
            }
            this.enabled = enabled;
            this.clear();
            if (!enabled) {
                return;
            }
            const box = (0, dom_1.append)(this.shortcuts, (0, dom_1.$)('.watermark-box'));
            const folder = this.workbenchState !== 1 /* WorkbenchState.EMPTY */;
            const selected = (folder ? folderEntries : noFolderEntries)
                .filter(entry => !('when' in entry) || this.contextKeyService.contextMatchesRules(entry.when))
                .filter(entry => !('mac' in entry) || entry.mac === (platform_1.isMacintosh && !platform_1.isWeb))
                .filter(entry => !!commands_1.CommandsRegistry.getCommand(entry.id))
                .filter(entry => !!this.keybindingService.lookupKeybinding(entry.id));
            const update = () => {
                (0, dom_1.clearNode)(box);
                for (const entry of selected) {
                    const keys = this.keybindingService.lookupKeybinding(entry.id);
                    if (!keys) {
                        continue;
                    }
                    const dl = (0, dom_1.append)(box, (0, dom_1.$)('dl'));
                    const dt = (0, dom_1.append)(dl, (0, dom_1.$)('dt'));
                    dt.textContent = entry.text;
                    const dd = (0, dom_1.append)(dl, (0, dom_1.$)('dd'));
                    this.keybindingLabel?.dispose();
                    this.keybindingLabel = new keybindingLabel_1.KeybindingLabel(dd, platform_1.OS, { renderUnboundKeybindings: true, ...defaultStyles_1.defaultKeybindingLabelStyles });
                    this.keybindingLabel.set(keys);
                }
            };
            update();
            this.transientDisposables.add(this.keybindingService.onDidUpdateKeybindings(update));
        }
        clear() {
            (0, dom_1.clearNode)(this.shortcuts);
            this.transientDisposables.clear();
        }
        dispose() {
            super.dispose();
            this.clear();
            this.keybindingLabel?.dispose();
        }
    };
    exports.EditorGroupWatermark = EditorGroupWatermark;
    exports.EditorGroupWatermark = EditorGroupWatermark = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, configuration_1.IConfigurationService)
    ], EditorGroupWatermark);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3JvdXBXYXRlcm1hcmsuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9lZGl0b3JHcm91cFdhdGVybWFyay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFlaEcsSUFBQSw2QkFBYSxFQUFDLDRCQUE0QixFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUEsMkJBQVcsRUFBQyxnQ0FBZ0IsRUFBRSxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBQSwyQkFBVyxFQUFDLGdDQUFnQixFQUFFLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxnQ0FBZ0IsRUFBRSxPQUFPLEVBQUUsZ0NBQWdCLEVBQUUsRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSwwREFBMEQsQ0FBQyxDQUFDLENBQUM7SUFTeFIsTUFBTSxZQUFZLEdBQW1CLEVBQUUsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxFQUFFLCtCQUErQixFQUFFLENBQUM7SUFDNUksTUFBTSxXQUFXLEdBQW1CLEVBQUUsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLFlBQVksQ0FBQyxFQUFFLEVBQUUsRUFBRSw0QkFBNEIsRUFBRSxDQUFDO0lBQ2hJLE1BQU0sa0JBQWtCLEdBQW1CLEVBQUUsSUFBSSxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLFdBQVcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxpQ0FBaUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFDcEosTUFBTSxvQkFBb0IsR0FBbUIsRUFBRSxJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsYUFBYSxDQUFD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