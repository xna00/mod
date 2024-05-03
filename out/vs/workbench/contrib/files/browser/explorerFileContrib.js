/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.explorerFileContribRegistry = exports.ExplorerExtensions = void 0;
    var ExplorerExtensions;
    (function (ExplorerExtensions) {
        ExplorerExtensions["FileContributionRegistry"] = "workbench.registry.explorer.fileContributions";
    })(ExplorerExtensions || (exports.ExplorerExtensions = ExplorerExtensions = {}));
    class ExplorerFileContributionRegistry {
        constructor() {
            this.descriptors = [];
        }
        /** @inheritdoc */
        register(descriptor) {
            this.descriptors.push(descriptor);
        }
        /**
         * Creates a new instance of all registered contributions.
         */
        create(insta, container, store) {
            return this.descriptors.map(d => {
                const i = d.create(insta, container);
                store.add(i);
                return i;
            });
        }
    }
    exports.explorerFileContribRegistry = new ExplorerFileContributionRegistry();
    platform_1.Registry.add("workbench.registry.explorer.fileContributions" /* ExplorerExtensions.FileContributionRegistry */, exports.explorerFileContribRegistry);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJGaWxlQ29udHJpYi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvYnJvd3Nlci9leHBsb3JlckZpbGVDb250cmliLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxJQUFrQixrQkFFakI7SUFGRCxXQUFrQixrQkFBa0I7UUFDbkMsZ0dBQTBFLENBQUE7SUFDM0UsQ0FBQyxFQUZpQixrQkFBa0Isa0NBQWxCLGtCQUFrQixRQUVuQztJQXlCRCxNQUFNLGdDQUFnQztRQUF0QztZQUNrQixnQkFBVyxHQUEwQyxFQUFFLENBQUM7UUFpQjFFLENBQUM7UUFmQSxrQkFBa0I7UUFDWCxRQUFRLENBQUMsVUFBK0M7WUFDOUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVEOztXQUVHO1FBQ0ksTUFBTSxDQUFDLEtBQTRCLEVBQUUsU0FBc0IsRUFBRSxLQUFzQjtZQUN6RixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMvQixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDckMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDYixPQUFPLENBQUMsQ0FBQztZQUNWLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBRVksUUFBQSwyQkFBMkIsR0FBRyxJQUFJLGdDQUFnQyxFQUFFLENBQUM7SUFDbEYsbUJBQVEsQ0FBQyxHQUFHLG9HQUE4QyxtQ0FBMkIsQ0FBQyxDQUFDIn0=