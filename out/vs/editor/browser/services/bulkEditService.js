/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri", "vs/base/common/types"], function (require, exports, instantiation_1, uri_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceFileEdit = exports.ResourceTextEdit = exports.ResourceEdit = exports.IBulkEditService = void 0;
    exports.IBulkEditService = (0, instantiation_1.createDecorator)('IWorkspaceEditService');
    class ResourceEdit {
        constructor(metadata) {
            this.metadata = metadata;
        }
        static convert(edit) {
            return edit.edits.map(edit => {
                if (ResourceTextEdit.is(edit)) {
                    return ResourceTextEdit.lift(edit);
                }
                if (ResourceFileEdit.is(edit)) {
                    return ResourceFileEdit.lift(edit);
                }
                throw new Error('Unsupported edit');
            });
        }
    }
    exports.ResourceEdit = ResourceEdit;
    class ResourceTextEdit extends ResourceEdit {
        static is(candidate) {
            if (candidate instanceof ResourceTextEdit) {
                return true;
            }
            return (0, types_1.isObject)(candidate)
                && uri_1.URI.isUri(candidate.resource)
                && (0, types_1.isObject)(candidate.textEdit);
        }
        static lift(edit) {
            if (edit instanceof ResourceTextEdit) {
                return edit;
            }
            else {
                return new ResourceTextEdit(edit.resource, edit.textEdit, edit.versionId, edit.metadata);
            }
        }
        constructor(resource, textEdit, versionId = undefined, metadata) {
            super(metadata);
            this.resource = resource;
            this.textEdit = textEdit;
            this.versionId = versionId;
        }
    }
    exports.ResourceTextEdit = ResourceTextEdit;
    class ResourceFileEdit extends ResourceEdit {
        static is(candidate) {
            if (candidate instanceof ResourceFileEdit) {
                return true;
            }
            else {
                return (0, types_1.isObject)(candidate)
                    && (Boolean(candidate.newResource) || Boolean(candidate.oldResource));
            }
        }
        static lift(edit) {
            if (edit instanceof ResourceFileEdit) {
                return edit;
            }
            else {
                return new ResourceFileEdit(edit.oldResource, edit.newResource, edit.options, edit.metadata);
            }
        }
        constructor(oldResource, newResource, options = {}, metadata) {
            super(metadata);
            this.oldResource = oldResource;
            this.newResource = newResource;
            this.options = options;
        }
    }
    exports.ResourceFileEdit = ResourceFileEdit;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0VkaXRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci9zZXJ2aWNlcy9idWxrRWRpdFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWW5GLFFBQUEsZ0JBQWdCLEdBQUcsSUFBQSwrQkFBZSxFQUFtQix1QkFBdUIsQ0FBQyxDQUFDO0lBRTNGLE1BQWEsWUFBWTtRQUV4QixZQUErQixRQUFnQztZQUFoQyxhQUFRLEdBQVIsUUFBUSxDQUF3QjtRQUFJLENBQUM7UUFFcEUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFtQjtZQUVqQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM1QixJQUFJLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUMvQixPQUFPLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEMsQ0FBQztnQkFFRCxJQUFJLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUMvQixPQUFPLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEMsQ0FBQztnQkFDRCxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDckMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUFqQkQsb0NBaUJDO0lBRUQsTUFBYSxnQkFBaUIsU0FBUSxZQUFZO1FBRWpELE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBYztZQUN2QixJQUFJLFNBQVMsWUFBWSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUMzQyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxPQUFPLElBQUEsZ0JBQVEsRUFBQyxTQUFTLENBQUM7bUJBQ3RCLFNBQUcsQ0FBQyxLQUFLLENBQXNCLFNBQVUsQ0FBQyxRQUFRLENBQUM7bUJBQ25ELElBQUEsZ0JBQVEsRUFBc0IsU0FBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQXdCO1lBQ25DLElBQUksSUFBSSxZQUFZLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDMUYsQ0FBQztRQUNGLENBQUM7UUFFRCxZQUNVLFFBQWEsRUFDYixRQUFrRCxFQUNsRCxZQUFnQyxTQUFTLEVBQ2xELFFBQWdDO1lBRWhDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUxQLGFBQVEsR0FBUixRQUFRLENBQUs7WUFDYixhQUFRLEdBQVIsUUFBUSxDQUEwQztZQUNsRCxjQUFTLEdBQVQsU0FBUyxDQUFnQztRQUluRCxDQUFDO0tBQ0Q7SUEzQkQsNENBMkJDO0lBRUQsTUFBYSxnQkFBaUIsU0FBUSxZQUFZO1FBRWpELE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBYztZQUN2QixJQUFJLFNBQVMsWUFBWSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUMzQyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLElBQUEsZ0JBQVEsRUFBQyxTQUFTLENBQUM7dUJBQ3RCLENBQUMsT0FBTyxDQUFzQixTQUFVLENBQUMsV0FBVyxDQUFDLElBQUksT0FBTyxDQUFzQixTQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUNwSCxDQUFDO1FBQ0YsQ0FBQztRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBd0I7WUFDbkMsSUFBSSxJQUFJLFlBQVksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdEMsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5RixDQUFDO1FBQ0YsQ0FBQztRQUVELFlBQ1UsV0FBNEIsRUFDNUIsV0FBNEIsRUFDNUIsVUFBb0MsRUFBRSxFQUMvQyxRQUFnQztZQUVoQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFMUCxnQkFBVyxHQUFYLFdBQVcsQ0FBaUI7WUFDNUIsZ0JBQVcsR0FBWCxXQUFXLENBQWlCO1lBQzVCLFlBQU8sR0FBUCxPQUFPLENBQStCO1FBSWhELENBQUM7S0FDRDtJQTNCRCw0Q0EyQkMifQ==