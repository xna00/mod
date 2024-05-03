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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/countBadge/countBadge", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/theme/browser/defaultStyles", "../referencesModel"], function (require, exports, dom, countBadge_1, highlightedLabel_1, iconLabel_1, filters_1, lifecycle_1, resources_1, resolverService_1, nls_1, instantiation_1, keybinding_1, label_1, defaultStyles_1, referencesModel_1) {
    "use strict";
    var FileReferencesRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityProvider = exports.OneReferenceRenderer = exports.FileReferencesRenderer = exports.IdentityProvider = exports.StringRepresentationProvider = exports.Delegate = exports.DataSource = void 0;
    let DataSource = class DataSource {
        constructor(_resolverService) {
            this._resolverService = _resolverService;
        }
        hasChildren(element) {
            if (element instanceof referencesModel_1.ReferencesModel) {
                return true;
            }
            if (element instanceof referencesModel_1.FileReferences) {
                return true;
            }
            return false;
        }
        getChildren(element) {
            if (element instanceof referencesModel_1.ReferencesModel) {
                return element.groups;
            }
            if (element instanceof referencesModel_1.FileReferences) {
                return element.resolve(this._resolverService).then(val => {
                    // if (element.failure) {
                    // 	// refresh the element on failure so that
                    // 	// we can update its rendering
                    // 	return tree.refresh(element).then(() => val.children);
                    // }
                    return val.children;
                });
            }
            throw new Error('bad tree');
        }
    };
    exports.DataSource = DataSource;
    exports.DataSource = DataSource = __decorate([
        __param(0, resolverService_1.ITextModelService)
    ], DataSource);
    //#endregion
    class Delegate {
        getHeight() {
            return 23;
        }
        getTemplateId(element) {
            if (element instanceof referencesModel_1.FileReferences) {
                return FileReferencesRenderer.id;
            }
            else {
                return OneReferenceRenderer.id;
            }
        }
    }
    exports.Delegate = Delegate;
    let StringRepresentationProvider = class StringRepresentationProvider {
        constructor(_keybindingService) {
            this._keybindingService = _keybindingService;
        }
        getKeyboardNavigationLabel(element) {
            if (element instanceof referencesModel_1.OneReference) {
                const parts = element.parent.getPreview(element)?.preview(element.range);
                if (parts) {
                    return parts.value;
                }
            }
            // FileReferences or unresolved OneReference
            return (0, resources_1.basename)(element.uri);
        }
        mightProducePrintableCharacter(event) {
            return this._keybindingService.mightProducePrintableCharacter(event);
        }
    };
    exports.StringRepresentationProvider = StringRepresentationProvider;
    exports.StringRepresentationProvider = StringRepresentationProvider = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], StringRepresentationProvider);
    class IdentityProvider {
        getId(element) {
            return element instanceof referencesModel_1.OneReference ? element.id : element.uri;
        }
    }
    exports.IdentityProvider = IdentityProvider;
    //#region render: File
    let FileReferencesTemplate = class FileReferencesTemplate extends lifecycle_1.Disposable {
        constructor(container, _labelService) {
            super();
            this._labelService = _labelService;
            const parent = document.createElement('div');
            parent.classList.add('reference-file');
            this.file = this._register(new iconLabel_1.IconLabel(parent, { supportHighlights: true }));
            this.badge = new countBadge_1.CountBadge(dom.append(parent, dom.$('.count')), {}, defaultStyles_1.defaultCountBadgeStyles);
            container.appendChild(parent);
        }
        set(element, matches) {
            const parent = (0, resources_1.dirname)(element.uri);
            this.file.setLabel(this._labelService.getUriBasenameLabel(element.uri), this._labelService.getUriLabel(parent, { relative: true }), { title: this._labelService.getUriLabel(element.uri), matches });
            const len = element.children.length;
            this.badge.setCount(len);
            if (len > 1) {
                this.badge.setTitleFormat((0, nls_1.localize)('referencesCount', "{0} references", len));
            }
            else {
                this.badge.setTitleFormat((0, nls_1.localize)('referenceCount', "{0} reference", len));
            }
        }
    };
    FileReferencesTemplate = __decorate([
        __param(1, label_1.ILabelService)
    ], FileReferencesTemplate);
    let FileReferencesRenderer = class FileReferencesRenderer {
        static { FileReferencesRenderer_1 = this; }
        static { this.id = 'FileReferencesRenderer'; }
        constructor(_instantiationService) {
            this._instantiationService = _instantiationService;
            this.templateId = FileReferencesRenderer_1.id;
        }
        renderTemplate(container) {
            return this._instantiationService.createInstance(FileReferencesTemplate, container);
        }
        renderElement(node, index, template) {
            template.set(node.element, (0, filters_1.createMatches)(node.filterData));
        }
        disposeTemplate(templateData) {
            templateData.dispose();
        }
    };
    exports.FileReferencesRenderer = FileReferencesRenderer;
    exports.FileReferencesRenderer = FileReferencesRenderer = FileReferencesRenderer_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], FileReferencesRenderer);
    //#endregion
    //#region render: Reference
    class OneReferenceTemplate extends lifecycle_1.Disposable {
        constructor(container) {
            super();
            this.label = this._register(new highlightedLabel_1.HighlightedLabel(container));
        }
        set(element, score) {
            const preview = element.parent.getPreview(element)?.preview(element.range);
            if (!preview || !preview.value) {
                // this means we FAILED to resolve the document or the value is the empty string
                this.label.set(`${(0, resources_1.basename)(element.uri)}:${element.range.startLineNumber + 1}:${element.range.startColumn + 1}`);
            }
            else {
                // render search match as highlight unless
                // we have score, then render the score
                const { value, highlight } = preview;
                if (score && !filters_1.FuzzyScore.isDefault(score)) {
                    this.label.element.classList.toggle('referenceMatch', false);
                    this.label.set(value, (0, filters_1.createMatches)(score));
                }
                else {
                    this.label.element.classList.toggle('referenceMatch', true);
                    this.label.set(value, [highlight]);
                }
            }
        }
    }
    class OneReferenceRenderer {
        constructor() {
            this.templateId = OneReferenceRenderer.id;
        }
        static { this.id = 'OneReferenceRenderer'; }
        renderTemplate(container) {
            return new OneReferenceTemplate(container);
        }
        renderElement(node, index, templateData) {
            templateData.set(node.element, node.filterData);
        }
        disposeTemplate(templateData) {
            templateData.dispose();
        }
    }
    exports.OneReferenceRenderer = OneReferenceRenderer;
    //#endregion
    class AccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('treeAriaLabel', "References");
        }
        getAriaLabel(element) {
            return element.ariaMessage;
        }
    }
    exports.AccessibilityProvider = AccessibilityProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmZXJlbmNlc1RyZWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2dvdG9TeW1ib2wvYnJvd3Nlci9wZWVrL3JlZmVyZW5jZXNUcmVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF5QnpGLElBQU0sVUFBVSxHQUFoQixNQUFNLFVBQVU7UUFFdEIsWUFBZ0QsZ0JBQW1DO1lBQW5DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7UUFBSSxDQUFDO1FBRXhGLFdBQVcsQ0FBQyxPQUF1RDtZQUNsRSxJQUFJLE9BQU8sWUFBWSxpQ0FBZSxFQUFFLENBQUM7Z0JBQ3hDLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELElBQUksT0FBTyxZQUFZLGdDQUFjLEVBQUUsQ0FBQztnQkFDdkMsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsV0FBVyxDQUFDLE9BQXVEO1lBQ2xFLElBQUksT0FBTyxZQUFZLGlDQUFlLEVBQUUsQ0FBQztnQkFDeEMsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQ3ZCLENBQUM7WUFFRCxJQUFJLE9BQU8sWUFBWSxnQ0FBYyxFQUFFLENBQUM7Z0JBQ3ZDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQ3hELHlCQUF5QjtvQkFDekIsNkNBQTZDO29CQUM3QyxrQ0FBa0M7b0JBQ2xDLDBEQUEwRDtvQkFDMUQsSUFBSTtvQkFDSixPQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUM7Z0JBQ3JCLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsVUFB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