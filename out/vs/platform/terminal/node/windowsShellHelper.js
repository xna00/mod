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
define(["require", "exports", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform"], function (require, exports, async_1, decorators_1, event_1, lifecycle_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowsShellHelper = void 0;
    const SHELL_EXECUTABLES = [
        'cmd.exe',
        'powershell.exe',
        'pwsh.exe',
        'bash.exe',
        'wsl.exe',
        'ubuntu.exe',
        'ubuntu1804.exe',
        'kali.exe',
        'debian.exe',
        'opensuse-42.exe',
        'sles-12.exe'
    ];
    let windowsProcessTree;
    class WindowsShellHelper extends lifecycle_1.Disposable {
        get shellType() { return this._shellType; }
        get shellTitle() { return this._shellTitle; }
        get onShellNameChanged() { return this._onShellNameChanged.event; }
        get onShellTypeChanged() { return this._onShellTypeChanged.event; }
        constructor(_rootProcessId) {
            super();
            this._rootProcessId = _rootProcessId;
            this._shellTitle = '';
            this._onShellNameChanged = new event_1.Emitter();
            this._onShellTypeChanged = new event_1.Emitter();
            if (!platform_1.isWindows) {
                throw new Error(`WindowsShellHelper cannot be instantiated on ${platform_1.platform}`);
            }
            this._startMonitoringShell();
        }
        async _startMonitoringShell() {
            if (this._store.isDisposed) {
                return;
            }
            this.checkShell();
        }
        async checkShell() {
            if (platform_1.isWindows) {
                // Wait to give the shell some time to actually launch a process, this
                // could lead to a race condition but it would be recovered from when
                // data stops and should cover the majority of cases
                await (0, async_1.timeout)(300);
                this.getShellName().then(title => {
                    const type = this.getShellType(title);
                    if (type !== this._shellType) {
                        this._onShellTypeChanged.fire(type);
                        this._onShellNameChanged.fire(title);
                        this._shellType = type;
                        this._shellTitle = title;
                    }
                });
            }
        }
        traverseTree(tree) {
            if (!tree) {
                return '';
            }
            if (SHELL_EXECUTABLES.indexOf(tree.name) === -1) {
                return tree.name;
            }
            if (!tree.children || tree.children.length === 0) {
                return tree.name;
            }
            let favouriteChild = 0;
            for (; favouriteChild < tree.children.length; favouriteChild++) {
                const child = tree.children[favouriteChild];
                if (!child.children || child.children.length === 0) {
                    break;
                }
                if (child.children[0].name !== 'conhost.exe') {
                    break;
                }
            }
            if (favouriteChild >= tree.children.length) {
                return tree.name;
            }
            return this.traverseTree(tree.children[favouriteChild]);
        }
        /**
         * Returns the innermost shell executable running in the terminal
         */
        async getShellName() {
            if (this._store.isDisposed) {
                return Promise.resolve('');
            }
            // Prevent multiple requests at once, instead return current request
            if (this._currentRequest) {
                return this._currentRequest;
            }
            if (!windowsProcessTree) {
                windowsProcessTree = await new Promise((resolve_1, reject_1) => { require(['@vscode/windows-process-tree'], resolve_1, reject_1); });
            }
            this._currentRequest = new Promise(resolve => {
                windowsProcessTree.getProcessTree(this._rootProcessId, tree => {
                    const name = this.traverseTree(tree);
                    this._currentRequest = undefined;
                    resolve(name);
                });
            });
            return this._currentRequest;
        }
        getShellType(executable) {
            switch (executable.toLowerCase()) {
                case 'cmd.exe':
                    return "cmd" /* WindowsShellType.CommandPrompt */;
                case 'powershell.exe':
                case 'pwsh.exe':
                    return "pwsh" /* WindowsShellType.PowerShell */;
                case 'bash.exe':
                case 'git-cmd.exe':
                    return "gitbash" /* WindowsShellType.GitBash */;
                case 'wsl.exe':
                case 'ubuntu.exe':
                case 'ubuntu1804.exe':
                case 'kali.exe':
                case 'debian.exe':
                case 'opensuse-42.exe':
                case 'sles-12.exe':
                    return "wsl" /* WindowsShellType.Wsl */;
                default:
                    if (executable.match(/python(\d(\.\d{0,2})?)?\.exe/)) {
                        return "python" /* WindowsShellType.Python */;
                    }
                    return undefined;
            }
        }
    }
    exports.WindowsShellHelper = WindowsShellHelper;
    __decorate([
        (0, decorators_1.debounce)(500)
    ], WindowsShellHelper.prototype, "checkShell", null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93c1NoZWxsSGVscGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9ub2RlL3dpbmRvd3NTaGVsbEhlbHBlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7SUFpQmhHLE1BQU0saUJBQWlCLEdBQUc7UUFDekIsU0FBUztRQUNULGdCQUFnQjtRQUNoQixVQUFVO1FBQ1YsVUFBVTtRQUNWLFNBQVM7UUFDVCxZQUFZO1FBQ1osZ0JBQWdCO1FBQ2hCLFVBQVU7UUFDVixZQUFZO1FBQ1osaUJBQWlCO1FBQ2pCLGFBQWE7S0FDYixDQUFDO0lBRUYsSUFBSSxrQkFBaUQsQ0FBQztJQUV0RCxNQUFhLGtCQUFtQixTQUFRLHNCQUFVO1FBR2pELElBQUksU0FBUyxLQUFvQyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBRTFFLElBQUksVUFBVSxLQUFhLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFFckQsSUFBSSxrQkFBa0IsS0FBb0IsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUVsRixJQUFJLGtCQUFrQixLQUEyQyxPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRXpHLFlBQ1MsY0FBc0I7WUFFOUIsS0FBSyxFQUFFLENBQUM7WUFGQSxtQkFBYyxHQUFkLGNBQWMsQ0FBUTtZQVJ2QixnQkFBVyxHQUFXLEVBQUUsQ0FBQztZQUVoQix3QkFBbUIsR0FBRyxJQUFJLGVBQU8sRUFBVSxDQUFDO1lBRTVDLHdCQUFtQixHQUFHLElBQUksZUFBTyxFQUFpQyxDQUFDO1lBUW5GLElBQUksQ0FBQyxvQkFBUyxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sSUFB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