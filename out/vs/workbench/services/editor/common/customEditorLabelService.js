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
define(["require", "exports", "vs/base/common/event", "vs/base/common/glob", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace"], function (require, exports, event_1, glob_1, lifecycle_1, path_1, resources_1, configuration_1, extensions_1, instantiation_1, workspace_1) {
    "use strict";
    var CustomEditorLabelService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ICustomEditorLabelService = exports.CustomEditorLabelService = void 0;
    let CustomEditorLabelService = class CustomEditorLabelService extends lifecycle_1.Disposable {
        static { CustomEditorLabelService_1 = this; }
        static { this.SETTING_ID_PATTERNS = 'workbench.editor.customLabels.patterns'; }
        static { this.SETTING_ID_ENABLED = 'workbench.editor.customLabels.enabled'; }
        constructor(configurationService, workspaceContextService) {
            super();
            this.configurationService = configurationService;
            this.workspaceContextService = workspaceContextService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.patterns = [];
            this.enabled = true;
            this._templateRegexValidation = /[a-zA-Z0-9]/;
            this._parsedTemplateExpression = /\$\{(dirname|filename|extname|dirname\((\d+)\))\}/g;
            this.storeEnablementState();
            this.storeCustomPatterns();
            this.registerListernes();
        }
        registerListernes() {
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                // Cache the enabled state
                if (e.affectsConfiguration(CustomEditorLabelService_1.SETTING_ID_ENABLED)) {
                    const oldEnablement = this.enabled;
                    this.storeEnablementState();
                    if (oldEnablement !== this.enabled && this.patterns.length > 0) {
                        this._onDidChange.fire();
                    }
                }
                // Cache the patterns
                else if (e.affectsConfiguration(CustomEditorLabelService_1.SETTING_ID_PATTERNS)) {
                    this.storeCustomPatterns();
                    this._onDidChange.fire();
                }
            }));
        }
        storeEnablementState() {
            this.enabled = this.configurationService.getValue(CustomEditorLabelService_1.SETTING_ID_ENABLED);
        }
        storeCustomPatterns() {
            this.patterns = [];
            const customLabelPatterns = this.configurationService.getValue(CustomEditorLabelService_1.SETTING_ID_PATTERNS);
            for (const pattern in customLabelPatterns) {
                const template = customLabelPatterns[pattern];
                if (!this._templateRegexValidation.test(template)) {
                    continue;
                }
                const isAbsolutePath = (0, path_1.isAbsolute)(pattern);
                const parsedPattern = (0, glob_1.parse)(pattern);
                this.patterns.push({ pattern, template, isAbsolutePath, parsedPattern });
            }
            this.patterns.sort((a, b) => this.patternWeight(b.pattern) - this.patternWeight(a.pattern));
        }
        patternWeight(pattern) {
            let weight = 0;
            for (const fragment of pattern.split('/')) {
                if (fragment === '**') {
                    weight += 1;
                }
                else if (fragment === '*') {
                    weight += 10;
                }
                else if (fragment.includes('*') || fragment.includes('?')) {
                    weight += 50;
                }
                else if (fragment !== '') {
                    weight += 100;
                }
            }
            return weight;
        }
        getName(resource) {
            if (!this.enabled) {
                return undefined;
            }
            return this.applyPatterns(resource);
        }
        applyPatterns(resource) {
            if (this.patterns.length === 0) {
                return undefined;
            }
            const root = this.workspaceContextService.getWorkspaceFolder(resource);
            let relativePath;
            for (const pattern of this.patterns) {
                let relevantPath;
                if (root && !pattern.isAbsolutePath) {
                    relevantPath = relativePath = relativePath ?? (0, resources_1.relativePath)(root.uri, resource) ?? resource.path;
                }
                else {
                    relevantPath = resource.path;
                }
                if (pattern.parsedPattern(relevantPath)) {
                    return this.applyTempate(pattern.template, resource);
                }
            }
            return undefined;
        }
        applyTempate(template, resource) {
            let parsedPath;
            return template.replace(this._parsedTemplateExpression, (match, variable, arg) => {
                parsedPath = parsedPath ?? (0, path_1.parse)(resource.path);
                switch (variable) {
                    case 'filename':
                        return parsedPath.name;
                    case 'extname':
                        return parsedPath.ext.slice(1);
                    default: { // dirname and dirname(arg)
                        const n = variable === 'dirname' ? 0 : parseInt(arg);
                        const nthDir = this.getNthDirname(parsedPath, n);
                        if (nthDir) {
                            return nthDir;
                        }
                    }
                }
                return match;
            });
        }
        getNthDirname(path, n) {
            // grand-parent/parent/filename.ext1.ext2 -> [grand-parent, parent]
            const pathFragments = path.dir.split('/');
            const length = pathFragments.length;
            const nth = length - 1 - n;
            if (nth < 0) {
                return undefined;
            }
            const nthDir = pathFragments[nth];
            if (nthDir === undefined || nthDir === '') {
                return undefined;
            }
            return nthDir;
        }
    };
    exports.CustomEditorLabelService = CustomEditorLabelService;
    exports.CustomEditorLabelService = CustomEditorLabelService = CustomEditorLabelService_1 = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], CustomEditorLabelService);
    exports.ICustomEditorLabelService = (0, instantiation_1.createDecorator)('ICustomEditorLabelService');
    (0, extensions_1.registerSingleton)(exports.ICustomEditorLabelService, CustomEditorLabelService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tRWRpdG9yTGFiZWxTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZWRpdG9yL2NvbW1vbi9jdXN0b21FZGl0b3JMYWJlbFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXlCekYsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTs7aUJBSXZDLHdCQUFtQixHQUFHLHdDQUF3QyxBQUEzQyxDQUE0QztpQkFDL0QsdUJBQWtCLEdBQUcsdUNBQXVDLEFBQTFDLENBQTJDO1FBUTdFLFlBQ3dCLG9CQUE0RCxFQUN6RCx1QkFBa0U7WUFFNUYsS0FBSyxFQUFFLENBQUM7WUFIZ0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUN4Qyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBUjVFLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDM0QsZ0JBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUV2QyxhQUFRLEdBQWdDLEVBQUUsQ0FBQztZQUMzQyxZQUFPLEdBQUcsSUFBSSxDQUFDO1lBcUNmLDZCQUF3QixHQUFXLGFBQWEsQ0FBQztZQW9FeEMsOEJBQXlCLEdBQUcsb0RBQW9ELENBQUM7WUFqR2pHLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBRTNCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLENBQUMsQ0FB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