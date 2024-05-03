/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/process"], function (require, exports, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @deprecated You MUST use `IProductService` if possible.
     */
    let product;
    // Native sandbox environment
    const vscodeGlobal = globalThis.vscode;
    if (typeof vscodeGlobal !== 'undefined' && typeof vscodeGlobal.context !== 'undefined') {
        const configuration = vscodeGlobal.context.configuration();
        if (configuration) {
            product = configuration.product;
        }
        else {
            throw new Error('Sandbox: unable to resolve product configuration from preload script.');
        }
    }
    // _VSCODE environment
    else if (globalThis._VSCODE_PRODUCT_JSON && globalThis._VSCODE_PACKAGE_JSON) {
        // Obtain values from product.json and package.json-data
        product = globalThis._VSCODE_PRODUCT_JSON;
        // Running out of sources
        if (process_1.env['VSCODE_DEV']) {
            Object.assign(product, {
                nameShort: `${product.nameShort} Dev`,
                nameLong: `${product.nameLong} Dev`,
                dataFolderName: `${product.dataFolderName}-dev`,
                serverDataFolderName: product.serverDataFolderName ? `${product.serverDataFolderName}-dev` : undefined
            });
        }
        // Version is added during built time, but we still
        // want to have it running out of sources so we
        // read it from package.json only when we need it.
        if (!product.version) {
            const pkg = globalThis._VSCODE_PACKAGE_JSON;
            Object.assign(product, {
                version: pkg.version
            });
        }
    }
    // Web environment or unknown
    else {
        // Built time configuration (do NOT modify)
        product = { /*BUILD->INSERT_PRODUCT_CONFIGURATION*/};
        // Running out of sources
        if (Object.keys(product).length === 0) {
            Object.assign(product, {
                version: '1.87.0-dev',
                nameShort: 'Code - OSS Dev',
                nameLong: 'Code - OSS Dev',
                applicationName: 'code-oss',
                dataFolderName: '.vscode-oss',
                urlProtocol: 'code-oss',
                reportIssueUrl: 'https://github.com/microsoft/vscode/issues/new',
                licenseName: 'MIT',
                licenseUrl: 'https://github.com/microsoft/vscode/blob/main/LICENSE.txt',
                serverLicenseUrl: 'https://github.com/microsoft/vscode/blob/main/LICENSE.txt'
            });
        }
    }
    /**
     * @deprecated You MUST use `IProductService` if possible.
     */
    exports.default = product;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcHJvZHVjdC9jb21tb24vcHJvZHVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRzs7T0FFRztJQUNILElBQUksT0FBOEIsQ0FBQztJQUVuQyw2QkFBNkI7SUFDN0IsTUFBTSxZQUFZLEdBQUksVUFBa0IsQ0FBQyxNQUFNLENBQUM7SUFDaEQsSUFBSSxPQUFPLFlBQVksS0FBSyxXQUFXLElBQUksT0FBTyxZQUFZLENBQUMsT0FBTyxLQUFLLFdBQVcsRUFBRSxDQUFDO1FBQ3hGLE1BQU0sYUFBYSxHQUFzQyxZQUFZLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzlGLElBQUksYUFBYSxFQUFFLENBQUM7WUFDbkIsT0FBTyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUM7UUFDakMsQ0FBQzthQUFNLENBQUM7WUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLHVFQUF1RSxDQUFDLENBQUM7UUFDMUYsQ0FBQztJQUNGLENBQUM7SUFDRCxzQkFBc0I7U0FDakIsSUFBSSxVQUFVLENBQUMsb0JBQW9CLElBQUksVUFBVSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFDN0Usd0RBQXdEO1FBQ3hELE9BQU8sR0FBRyxVQUFVLENBQUMsb0JBQXdELENBQUM7UUFFOUUseUJBQXlCO1FBQ3pCLElBQUksYUFBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7WUFDdkIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7Z0JBQ3RCLFNBQVMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxTQUFTLE1BQU07Z0JBQ3JDLFFBQVEsRUFBRSxHQUFHLE9BQU8sQ0FBQyxRQUFRLE1BQU07Z0JBQ25DLGNBQWMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxjQUFjLE1BQU07Z0JBQy9DLG9CQUFvQixFQUFFLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsb0JBQW9CLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUzthQUN0RyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsbURBQW1EO1FBQ25ELCtDQUErQztRQUMvQyxrREFBa0Q7UUFDbEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0QixNQUFNLEdBQUcsR0FBRyxVQUFVLENBQUMsb0JBQTJDLENBQUM7WUFFbkUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7Z0JBQ3RCLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTzthQUNwQixDQUFDLENBQUM7UUFDSixDQUFDO0lBQ0YsQ0FBQztJQUVELDZCQUE2QjtTQUN4QixDQUFDO1FBRUwsMkNBQTJDO1FBQzNDLE9BQU8sR0FBRyxFQUFFLHVDQUF1QyxDQUEyQixDQUFDO1FBRS9FLHlCQUF5QjtRQUN6QixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO2dCQUN0QixPQUFPLEVBQUUsWUFBWTtnQkFDckIsU0FBUyxFQUFFLGdCQUFnQjtnQkFDM0IsUUFBUSxFQUFFLGdCQUFnQjtnQkFDMUIsZUFBZSxFQUFFLFVBQVU7Z0JBQzNCLGNBQWMsRUFBRSxhQUFhO2dCQUM3QixXQUFXLEVBQUUsVUFBVTtnQkFDdkIsY0FBYyxFQUFFLGdEQUFnRDtnQkFDaEUsV0FBVyxFQUFFLEtBQUs7Z0JBQ2xCLFVBQVUsRUFBRSwyREFBMkQ7Z0JBQ3ZFLGdCQUFnQixFQUFFLDJEQUEyRDthQUM3RSxDQUFDLENBQUM7UUFDSixDQUFDO0lBQ0YsQ0FBQztJQUVEOztPQUVHO0lBQ0gsa0JBQWUsT0FBTyxDQUFDIn0=