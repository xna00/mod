/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/codiconsUtil", "vs/base/common/themables", "vs/base/common/event", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform"], function (require, exports, async_1, codicons_1, codiconsUtil_1, themables_1, event_1, types_1, uri_1, nls_1, jsonContributionRegistry_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.spinningLoading = exports.syncing = exports.gotoNextLocation = exports.gotoPreviousLocation = exports.widgetClose = exports.iconsSchemaId = exports.IconFontDefinition = exports.IconContribution = exports.Extensions = void 0;
    exports.registerIcon = registerIcon;
    exports.getIconRegistry = getIconRegistry;
    //  ------ API types
    // icon registry
    exports.Extensions = {
        IconContribution: 'base.contributions.icons'
    };
    var IconContribution;
    (function (IconContribution) {
        function getDefinition(contribution, registry) {
            let definition = contribution.defaults;
            while (themables_1.ThemeIcon.isThemeIcon(definition)) {
                const c = iconRegistry.getIcon(definition.id);
                if (!c) {
                    return undefined;
                }
                definition = c.defaults;
            }
            return definition;
        }
        IconContribution.getDefinition = getDefinition;
    })(IconContribution || (exports.IconContribution = IconContribution = {}));
    var IconFontDefinition;
    (function (IconFontDefinition) {
        function toJSONObject(iconFont) {
            return {
                weight: iconFont.weight,
                style: iconFont.style,
                src: iconFont.src.map(s => ({ format: s.format, location: s.location.toString() }))
            };
        }
        IconFontDefinition.toJSONObject = toJSONObject;
        function fromJSONObject(json) {
            const stringOrUndef = (s) => (0, types_1.isString)(s) ? s : undefined;
            if (json && Array.isArray(json.src) && json.src.every((s) => (0, types_1.isString)(s.format) && (0, types_1.isString)(s.location))) {
                return {
                    weight: stringOrUndef(json.weight),
                    style: stringOrUndef(json.style),
                    src: json.src.map((s) => ({ format: s.format, location: uri_1.URI.parse(s.location) }))
                };
            }
            return undefined;
        }
        IconFontDefinition.fromJSONObject = fromJSONObject;
    })(IconFontDefinition || (exports.IconFontDefinition = IconFontDefinition = {}));
    class IconRegistry {
        constructor() {
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.iconSchema = {
                definitions: {
                    icons: {
                        type: 'object',
                        properties: {
                            fontId: { type: 'string', description: (0, nls_1.localize)('iconDefinition.fontId', 'The id of the font to use. If not set, the font that is defined first is used.') },
                            fontCharacter: { type: 'string', description: (0, nls_1.localize)('iconDefinition.fontCharacter', 'The font character associated with the icon definition.') }
                        },
                        additionalProperties: false,
                        defaultSnippets: [{ body: { fontCharacter: '\\\\e030' } }]
                    }
                },
                type: 'object',
                properties: {}
            };
            this.iconReferenceSchema = { type: 'string', pattern: `^${themables_1.ThemeIcon.iconNameExpression}$`, enum: [], enumDescriptions: [] };
            this.iconsById = {};
            this.iconFontsById = {};
        }
        registerIcon(id, defaults, description, deprecationMessage) {
            const existing = this.iconsById[id];
            if (existing) {
                if (description && !existing.description) {
                    existing.description = description;
                    this.iconSchema.properties[id].markdownDescription = `${description} $(${id})`;
                    const enumIndex = this.iconReferenceSchema.enum.indexOf(id);
                    if (enumIndex !== -1) {
                        this.iconReferenceSchema.enumDescriptions[enumIndex] = description;
                    }
                    this._onDidChange.fire();
                }
                return existing;
            }
            const iconContribution = { id, description, defaults, deprecationMessage };
            this.iconsById[id] = iconContribution;
            const propertySchema = { $ref: '#/definitions/icons' };
            if (deprecationMessage) {
                propertySchema.deprecationMessage = deprecationMessage;
            }
            if (description) {
                propertySchema.markdownDescription = `${description}: $(${id})`;
            }
            this.iconSchema.properties[id] = propertySchema;
            this.iconReferenceSchema.enum.push(id);
            this.iconReferenceSchema.enumDescriptions.push(description || '');
            this._onDidChange.fire();
            return { id };
        }
        deregisterIcon(id) {
            delete this.iconsById[id];
            delete this.iconSchema.properties[id];
            const index = this.iconReferenceSchema.enum.indexOf(id);
            if (index !== -1) {
                this.iconReferenceSchema.enum.splice(index, 1);
                this.iconReferenceSchema.enumDescriptions.splice(index, 1);
            }
            this._onDidChange.fire();
        }
        getIcons() {
            return Object.keys(this.iconsById).map(id => this.iconsById[id]);
        }
        getIcon(id) {
            return this.iconsById[id];
        }
        getIconSchema() {
            return this.iconSchema;
        }
        getIconReferenceSchema() {
            return this.iconReferenceSchema;
        }
        registerIconFont(id, definition) {
            const existing = this.iconFontsById[id];
            if (existing) {
                return existing;
            }
            this.iconFontsById[id] = definition;
            this._onDidChange.fire();
            return definition;
        }
        deregisterIconFont(id) {
            delete this.iconFontsById[id];
        }
        getIconFont(id) {
            return this.iconFontsById[id];
        }
        toString() {
            const sorter = (i1, i2) => {
                return i1.id.localeCompare(i2.id);
            };
            const classNames = (i) => {
                while (themables_1.ThemeIcon.isThemeIcon(i.defaults)) {
                    i = this.iconsById[i.defaults.id];
                }
                return `codicon codicon-${i ? i.id : ''}`;
            };
            const reference = [];
            reference.push(`| preview     | identifier                        | default codicon ID                | description`);
            reference.push(`| ----------- | --------------------------------- | --------------------------------- | --------------------------------- |`);
            const contributions = Object.keys(this.iconsById).map(key => this.iconsById[key]);
            for (const i of contributions.filter(i => !!i.description).sort(sorter)) {
                reference.push(`|<i class="${classNames(i)}"></i>|${i.id}|${themables_1.ThemeIcon.isThemeIcon(i.defaults) ? i.defaults.id : i.id}|${i.description || ''}|`);
            }
            reference.push(`| preview     | identifier                        `);
            reference.push(`| ----------- | --------------------------------- |`);
            for (const i of contributions.filter(i => !themables_1.ThemeIcon.isThemeIcon(i.defaults)).sort(sorter)) {
                reference.push(`|<i class="${classNames(i)}"></i>|${i.id}|`);
            }
            return reference.join('\n');
        }
    }
    const iconRegistry = new IconRegistry();
    platform.Registry.add(exports.Extensions.IconContribution, iconRegistry);
    function registerIcon(id, defaults, description, deprecationMessage) {
        return iconRegistry.registerIcon(id, defaults, description, deprecationMessage);
    }
    function getIconRegistry() {
        return iconRegistry;
    }
    function initialize() {
        const codiconFontCharacters = (0, codiconsUtil_1.getCodiconFontCharacters)();
        for (const icon in codiconFontCharacters) {
            const fontCharacter = '\\' + codiconFontCharacters[icon].toString(16);
            iconRegistry.registerIcon(icon, { fontCharacter });
        }
    }
    initialize();
    exports.iconsSchemaId = 'vscode://schemas/icons';
    const schemaRegistry = platform.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(exports.iconsSchemaId, iconRegistry.getIconSchema());
    const delayer = new async_1.RunOnceScheduler(() => schemaRegistry.notifySchemaChanged(exports.iconsSchemaId), 200);
    iconRegistry.onDidChange(() => {
        if (!delayer.isScheduled()) {
            delayer.schedule();
        }
    });
    //setTimeout(_ => console.log(iconRegistry.toString()), 5000);
    // common icons
    exports.widgetClose = registerIcon('widget-close', codicons_1.Codicon.close, (0, nls_1.localize)('widgetClose', 'Icon for the close action in widgets.'));
    exports.gotoPreviousLocation = registerIcon('goto-previous-location', codicons_1.Codicon.arrowUp, (0, nls_1.localize)('previousChangeIcon', 'Icon for goto previous editor location.'));
    exports.gotoNextLocation = registerIcon('goto-next-location', codicons_1.Codicon.arrowDown, (0, nls_1.localize)('nextChangeIcon', 'Icon for goto next editor location.'));
    exports.syncing = themables_1.ThemeIcon.modify(codicons_1.Codicon.sync, 'spin');
    exports.spinningLoading = themables_1.ThemeIcon.modify(codicons_1.Codicon.loading, 'spin');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvblJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90aGVtZS9jb21tb24vaWNvblJlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdTaEcsb0NBRUM7SUFFRCwwQ0FFQztJQXhSRCxvQkFBb0I7SUFHcEIsZ0JBQWdCO0lBQ0gsUUFBQSxVQUFVLEdBQUc7UUFDekIsZ0JBQWdCLEVBQUUsMEJBQTBCO0tBQzVDLENBQUM7SUFpQkYsSUFBaUIsZ0JBQWdCLENBWWhDO0lBWkQsV0FBaUIsZ0JBQWdCO1FBQ2hDLFNBQWdCLGFBQWEsQ0FBQyxZQUE4QixFQUFFLFFBQXVCO1lBQ3BGLElBQUksVUFBVSxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUM7WUFDdkMsT0FBTyxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUMxQyxNQUFNLENBQUMsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNSLE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO2dCQUNELFVBQVUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBQ3pCLENBQUM7WUFDRCxPQUFPLFVBQVUsQ0FBQztRQUNuQixDQUFDO1FBVmUsOEJBQWEsZ0JBVTVCLENBQUE7SUFDRixDQUFDLEVBWmdCLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBWWhDO0lBYUQsSUFBaUIsa0JBQWtCLENBbUJsQztJQW5CRCxXQUFpQixrQkFBa0I7UUFDbEMsU0FBZ0IsWUFBWSxDQUFDLFFBQTRCO1lBQ3hELE9BQU87Z0JBQ04sTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNO2dCQUN2QixLQUFLLEVBQUUsUUFBUSxD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