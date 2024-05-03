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
define(["require", "exports", "vs/base/common/hierarchicalKind", "vs/base/common/lifecycle", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/codeAction/common/types", "vs/platform/contextkey/common/contextkey"], function (require, exports, hierarchicalKind_1, lifecycle_1, languageFeatures_1, types_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionDocumentationContribution = void 0;
    let CodeActionDocumentationContribution = class CodeActionDocumentationContribution extends lifecycle_1.Disposable {
        constructor(extensionPoint, contextKeyService, languageFeaturesService) {
            super();
            this.contextKeyService = contextKeyService;
            this.contributions = [];
            this.emptyCodeActionsList = {
                actions: [],
                dispose: () => { }
            };
            this._register(languageFeaturesService.codeActionProvider.register('*', this));
            extensionPoint.setHandler(points => {
                this.contributions = [];
                for (const documentation of points) {
                    if (!documentation.value.refactoring) {
                        continue;
                    }
                    for (const contribution of documentation.value.refactoring) {
                        const precondition = contextkey_1.ContextKeyExpr.deserialize(contribution.when);
                        if (!precondition) {
                            continue;
                        }
                        this.contributions.push({
                            title: contribution.title,
                            when: precondition,
                            command: contribution.command
                        });
                    }
                }
            });
        }
        async provideCodeActions(_model, _range, context, _token) {
            return this.emptyCodeActionsList;
        }
        _getAdditionalMenuItems(context, actions) {
            if (context.only !== types_1.CodeActionKind.Refactor.value) {
                if (!actions.some(action => action.kind && types_1.CodeActionKind.Refactor.contains(new hierarchicalKind_1.HierarchicalKind(action.kind)))) {
                    return [];
                }
            }
            return this.contributions
                .filter(contribution => this.contextKeyService.contextMatchesRules(contribution.when))
                .map(contribution => {
                return {
                    id: contribution.command,
                    title: contribution.title
                };
            });
        }
    };
    exports.CodeActionDocumentationContribution = CodeActionDocumentationContribution;
    exports.CodeActionDocumentationContribution = CodeActionDocumentationContribution = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, languageFeatures_1.ILanguageFeaturesService)
    ], CodeActionDocumentationContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRhdGlvbkNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUFjdGlvbnMvYnJvd3Nlci9kb2N1bWVudGF0aW9uQ29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlCekYsSUFBTSxtQ0FBbUMsR0FBekMsTUFBTSxtQ0FBb0MsU0FBUSxzQkFBVTtRQWFsRSxZQUNDLGNBQTRELEVBQ3hDLGlCQUFzRCxFQUNoRCx1QkFBaUQ7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFINkIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQWJuRSxrQkFBYSxHQUlmLEVBQUUsQ0FBQztZQUVRLHlCQUFvQixHQUFHO2dCQUN2QyxPQUFPLEVBQUUsRUFBRTtnQkFDWCxPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQzthQUNsQixDQUFDO1lBU0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFL0UsY0FBYyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDbEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7Z0JBQ3hCLEtBQUssTUFBTSxhQUFhLElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ3BDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUN0QyxTQUFTO29CQUNWLENBQUM7b0JBRUQsS0FBSyxNQUFNLFlBQVksSUFBSSxhQUFhLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUM1RCxNQUFNLFlBQVksR0FBRywyQkFBYyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ25FLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQzs0QkFDbkIsU0FBUzt3QkFDVixDQUFDO3dCQUVELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDOzRCQUN2QixLQUFLLEVBQUUsWUFBWSxDQUFDLEtBQUs7NEJBQ3pCLElBQUksRUFBRSxZQUFZOzRCQUNsQixPQUFPLEVBQUUsWUFBWSxDQUFDLE9BQU87eUJBQzdCLENBQUMsQ0FBQztvQkFFSixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsa0JBQWtCLENBQUMsTUFBa0IsRUFBRSxNQUF5QixFQUFFLE9BQW9DLEVBQUUsTUFBeUI7WUFDdEksT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUM7UUFDbEMsQ0FBQztRQUVNLHVCQUF1QixDQUFDLE9BQW9DLEVBQUUsT0FBd0M7WUFDNUcsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLHNCQUFjLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNwRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksc0JBQWMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksbUNBQWdCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNqSCxPQUFPLEVBQUUsQ0FBQztnQkFDWCxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLGFBQWE7aUJBQ3ZCLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ3JGLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRTtnQkFDbkIsT0FBTztvQkFDTixFQUFFLEVBQUUsWUFBWSxDQUFDLE9BQU87b0JBQ3hCLEtBQUssRUFBRSxZQUFZLENBQUMsS0FBSztpQkFDekIsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNELENBQUE7SUFsRVksa0ZBQW1DO2tEQUFuQyxtQ0FBbUM7UUFlN0MsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLDJDQUF3QixDQUFBO09BaEJkLG1DQUFtQyxDQWtFL0MifQ==