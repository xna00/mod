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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/contrib/chatDynamicVariables", "vs/workbench/contrib/chat/common/chatParserTypes"], function (require, exports, arrays_1, errors_1, iterator_1, lifecycle_1, chat_1, chatDynamicVariables_1, chatParserTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatVariablesService = void 0;
    let ChatVariablesService = class ChatVariablesService {
        constructor(chatWidgetService) {
            this.chatWidgetService = chatWidgetService;
            this._resolver = new Map();
        }
        async resolveVariables(prompt, model, progress, token) {
            let resolvedVariables = [];
            const jobs = [];
            prompt.parts
                .forEach((part, i) => {
                if (part instanceof chatParserTypes_1.ChatRequestVariablePart) {
                    const data = this._resolver.get(part.variableName.toLowerCase());
                    if (data) {
                        const references = [];
                        const variableProgressCallback = (item) => {
                            if (item.kind === 'reference') {
                                references.push(item);
                                return;
                            }
                            progress(item);
                        };
                        jobs.push(data.resolver(prompt.text, part.variableArg, model, variableProgressCallback, token).then(values => {
                            resolvedVariables[i] = { name: part.variableName, range: part.range, values: values ?? [], references };
                        }).catch(errors_1.onUnexpectedExternalError));
                    }
                }
                else if (part instanceof chatParserTypes_1.ChatRequestDynamicVariablePart) {
                    resolvedVariables[i] = { name: part.referenceText, range: part.range, values: part.data };
                }
            });
            await Promise.allSettled(jobs);
            resolvedVariables = (0, arrays_1.coalesce)(resolvedVariables);
            // "reverse", high index first so that replacement is simple
            resolvedVariables.sort((a, b) => b.range.start - a.range.start);
            return {
                variables: resolvedVariables,
            };
        }
        async resolveVariable(variableName, promptText, model, progress, token) {
            const data = this._resolver.get(variableName.toLowerCase());
            if (!data) {
                return Promise.resolve([]);
            }
            return (await data.resolver(promptText, undefined, model, progress, token)) ?? [];
        }
        hasVariable(name) {
            return this._resolver.has(name.toLowerCase());
        }
        getVariable(name) {
            return this._resolver.get(name.toLowerCase())?.data;
        }
        getVariables() {
            const all = iterator_1.Iterable.map(this._resolver.values(), data => data.data);
            return iterator_1.Iterable.filter(all, data => !data.hidden);
        }
        getDynamicVariables(sessionId) {
            // This is slightly wrong... the parser pulls dynamic references from the input widget, but there is no guarantee that message came from the input here.
            // Need to ...
            // - Parser takes list of dynamic references (annoying)
            // - Or the parser is known to implicitly act on the input widget, and we need to call it before calling the chat service (maybe incompatible with the future, but easy)
            const widget = this.chatWidgetService.getWidgetBySessionId(sessionId);
            if (!widget || !widget.viewModel || !widget.supportsFileReferences) {
                return [];
            }
            const model = widget.getContrib(chatDynamicVariables_1.ChatDynamicVariableModel.ID);
            if (!model) {
                return [];
            }
            return model.variables;
        }
        registerVariable(data, resolver) {
            const key = data.name.toLowerCase();
            if (this._resolver.has(key)) {
                throw new Error(`A chat variable with the name '${data.name}' already exists.`);
            }
            this._resolver.set(key, { data, resolver });
            return (0, lifecycle_1.toDisposable)(() => {
                this._resolver.delete(key);
            });
        }
    };
    exports.ChatVariablesService = ChatVariablesService;
    exports.ChatVariablesService = ChatVariablesService = __decorate([
        __param(0, chat_1.IChatWidgetService)
    ], ChatVariablesService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFZhcmlhYmxlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NoYXRWYXJpYWJsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFvQjtRQUtoQyxZQUNxQixpQkFBc0Q7WUFBckMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUhuRSxjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQXFCLENBQUM7UUFLakQsQ0FBQztRQUVELEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxNQUEwQixFQUFFLEtBQWlCLEVBQUUsUUFBdUQsRUFBRSxLQUF3QjtZQUN0SixJQUFJLGlCQUFpQixHQUFnQyxFQUFFLENBQUM7WUFDeEQsTUFBTSxJQUFJLEdBQW1CLEVBQUUsQ0FBQztZQUVoQyxNQUFNLENBQUMsS0FBSztpQkFDVixPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3BCLElBQUksSUFBSSxZQUFZLHlDQUF1QixFQUFFLENBQUM7b0JBQzdDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztvQkFDakUsSUFBSSxJQUFJLEVBQUUsQ0FBQzt3QkFDVixNQUFNLFVBQVUsR0FBNEIsRUFBRSxDQUFDO3dCQUMvQyxNQUFNLHdCQUF3QixHQUFHLENBQUMsSUFBbUMsRUFBRSxFQUFFOzRCQUN4RSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssV0FBVyxFQUFFLENBQUM7Z0NBQy9CLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0NBQ3RCLE9BQU87NEJBQ1IsQ0FBQzs0QkFDRCxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ2hCLENBQUMsQ0FBQzt3QkFDRixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUssRUFBRSx3QkFBd0IsRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7NEJBQzVHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sSUFBSSxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUM7d0JBQ3pHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxrQ0FBeUIsQ0FBQyxDQUFDLENBQUM7b0JBQ3RDLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxJQUFJLElBQUksWUFBWSxnREFBOEIsRUFBRSxDQUFDO29CQUMzRCxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUUvQixpQkFBaUIsR0FBRyxJQUFBLGlCQUFRLEVBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUVoRCw0REFBNEQ7WUFDNUQsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVsRSxPQUFPO2dCQUNOLFNBQVMsRUFBRSxpQkFBaUI7YUFDNUIsQ0FBQztRQUNILENBQUM7UUFFRCxLQUFLLENBQUMsZUFBZSxDQUFDLFlBQW9CLEVBQUUsVUFBa0IsRUFBRSxLQUFpQixFQUFFLFFBQXVELEVBQUUsS0FBd0I7WUFDbkssTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDNUQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM1QixDQUFDO1lBRUQsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDbkYsQ0FBQztRQUVELFdBQVcsQ0FBQyxJQUFZO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUVELFdBQVcsQ0FBQyxJQUFZO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDO1FBQ3JELENBQUM7UUFFRCxZQUFZO1lBQ1gsTUFBTSxHQUFHLEdBQUcsbUJBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyRSxPQUFPLG1CQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFRCxtQkFBbUIsQ0FBQyxTQUFpQjtZQUNwQyx3SkFBd0o7WUFDeEosY0FBYztZQUNkLHVEQUF1RDtZQUN2RCx3S0FBd0s7WUFDeEssTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQ3BFLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQTJCLCtDQUF3QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUM7UUFDeEIsQ0FBQztRQUVELGdCQUFnQixDQUFDLElBQXVCLEVBQUUsUUFBK0I7WUFDeEUsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNwQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLE1BQU0sSUFBSSxLQUFLLENBQUMsa0NBQWtDLElBQUksQ0FBQyxJQUFJLG1CQUFtQixDQUFDLENBQUM7WUFDakYsQ0FBQztZQUNELElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0QsQ0FBQTtJQWxHWSxvREFBb0I7bUNBQXBCLG9CQUFvQjtRQU05QixXQUFBLHlCQUFrQixDQUFBO09BTlIsb0JBQW9CLENBa0doQyJ9