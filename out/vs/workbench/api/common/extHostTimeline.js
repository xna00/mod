/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHost.protocol", "vs/base/common/lifecycle", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostTypeConverters", "vs/platform/extensions/common/extensions", "vs/base/common/types"], function (require, exports, uri_1, instantiation_1, extHost_protocol_1, lifecycle_1, extHostTypes_1, extHostTypeConverters_1, extensions_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTimeline = exports.IExtHostTimeline = void 0;
    exports.IExtHostTimeline = (0, instantiation_1.createDecorator)('IExtHostTimeline');
    class ExtHostTimeline {
        constructor(mainContext, commands) {
            this._providers = new Map();
            this._itemsBySourceAndUriMap = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadTimeline);
            commands.registerArgumentProcessor({
                processArgument: (arg, extension) => {
                    if (arg && arg.$mid === 12 /* MarshalledId.TimelineActionContext */) {
                        if (this._providers.get(arg.source) && extensions_1.ExtensionIdentifier.equals(extension, this._providers.get(arg.source)?.extension)) {
                            const uri = arg.uri === undefined ? undefined : uri_1.URI.revive(arg.uri);
                            return this._itemsBySourceAndUriMap.get(arg.source)?.get(getUriKey(uri))?.get(arg.handle);
                        }
                        else {
                            return undefined;
                        }
                    }
                    return arg;
                }
            });
        }
        async $getTimeline(id, uri, options, token) {
            const item = this._providers.get(id);
            return item?.provider.provideTimeline(uri_1.URI.revive(uri), options, token);
        }
        registerTimelineProvider(scheme, provider, extensionId, commandConverter) {
            const timelineDisposables = new lifecycle_1.DisposableStore();
            const convertTimelineItem = this.convertTimelineItem(provider.id, commandConverter, timelineDisposables).bind(this);
            let disposable;
            if (provider.onDidChange) {
                disposable = provider.onDidChange(e => this._proxy.$emitTimelineChangeEvent({ uri: undefined, reset: true, ...e, id: provider.id }), this);
            }
            const itemsBySourceAndUriMap = this._itemsBySourceAndUriMap;
            return this.registerTimelineProviderCore({
                ...provider,
                scheme: scheme,
                onDidChange: undefined,
                async provideTimeline(uri, options, token) {
                    if (options?.resetCache) {
                        timelineDisposables.clear();
                        // For now, only allow the caching of a single Uri
                        // itemsBySourceAndUriMap.get(provider.id)?.get(getUriKey(uri))?.clear();
                        itemsBySourceAndUriMap.get(provider.id)?.clear();
                    }
                    const result = await provider.provideTimeline(uri, options, token);
                    if (result === undefined || result === null) {
                        return undefined;
                    }
                    // TODO: Should we bother converting all the data if we aren't caching? Meaning it is being requested by an extension?
                    const convertItem = convertTimelineItem(uri, options);
                    return {
                        ...result,
                        source: provider.id,
                        items: result.items.map(convertItem)
                    };
                },
                dispose() {
                    for (const sourceMap of itemsBySourceAndUriMap.values()) {
                        sourceMap.get(provider.id)?.clear();
                    }
                    disposable?.dispose();
                    timelineDisposables.dispose();
                }
            }, extensionId);
        }
        convertTimelineItem(source, commandConverter, disposables) {
            return (uri, options) => {
                let items;
                if (options?.cacheResults) {
                    let itemsByUri = this._itemsBySourceAndUriMap.get(source);
                    if (itemsByUri === undefined) {
                        itemsByUri = new Map();
                        this._itemsBySourceAndUriMap.set(source, itemsByUri);
                    }
                    const uriKey = getUriKey(uri);
                    items = itemsByUri.get(uriKey);
                    if (items === undefined) {
                        items = new Map();
                        itemsByUri.set(uriKey, items);
                    }
                }
                return (item) => {
                    const { iconPath, ...props } = item;
                    const handle = `${source}|${item.id ?? item.timestamp}`;
                    items?.set(handle, item);
                    let icon;
                    let iconDark;
                    let themeIcon;
                    if (item.iconPath) {
                        if (iconPath instanceof extHostTypes_1.ThemeIcon) {
                            themeIcon = { id: iconPath.id, color: iconPath.color };
                        }
                        else if (uri_1.URI.isUri(iconPath)) {
                            icon = iconPath;
                            iconDark = iconPath;
                        }
                        else {
                            ({ light: icon, dark: iconDark } = iconPath);
                        }
                    }
                    let tooltip;
                    if (extHostTypes_1.MarkdownString.isMarkdownString(props.tooltip)) {
                        tooltip = extHostTypeConverters_1.MarkdownString.from(props.tooltip);
                    }
                    else if ((0, types_1.isString)(props.tooltip)) {
                        tooltip = props.tooltip;
                    }
                    // TODO @jkearl, remove once migration complete.
                    else if (extHostTypes_1.MarkdownString.isMarkdownString(props.detail)) {
                        console.warn('Using deprecated TimelineItem.detail, migrate to TimelineItem.tooltip');
                        tooltip = extHostTypeConverters_1.MarkdownString.from(props.detail);
                    }
                    else if ((0, types_1.isString)(props.detail)) {
                        console.warn('Using deprecated TimelineItem.detail, migrate to TimelineItem.tooltip');
                        tooltip = props.detail;
                    }
                    return {
                        ...props,
                        id: props.id ?? undefined,
                        handle: handle,
                        source: source,
                        command: item.command ? commandConverter.toInternal(item.command, disposables) : undefined,
                        icon: icon,
                        iconDark: iconDark,
                        themeIcon: themeIcon,
                        tooltip,
                        accessibilityInformation: item.accessibilityInformation
                    };
                };
            };
        }
        registerTimelineProviderCore(provider, extension) {
            // console.log(`ExtHostTimeline#registerTimelineProvider: id=${provider.id}`);
            const existing = this._providers.get(provider.id);
            if (existing) {
                throw new Error(`Timeline Provider ${provider.id} already exists.`);
            }
            this._proxy.$registerTimelineProvider({
                id: provider.id,
                label: provider.label,
                scheme: provider.scheme
            });
            this._providers.set(provider.id, { provider, extension });
            return (0, lifecycle_1.toDisposable)(() => {
                for (const sourceMap of this._itemsBySourceAndUriMap.values()) {
                    sourceMap.get(provider.id)?.clear();
                }
                this._providers.delete(provider.id);
                this._proxy.$unregisterTimelineProvider(provider.id);
                provider.dispose();
            });
        }
    }
    exports.ExtHostTimeline = ExtHostTimeline;
    function getUriKey(uri) {
        return uri?.toString();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRpbWVsaW5lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0VGltZWxpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUJuRixRQUFBLGdCQUFnQixHQUFHLElBQUEsK0JBQWUsRUFBbUIsa0JBQWtCLENBQUMsQ0FBQztJQUV0RixNQUFhLGVBQWU7UUFTM0IsWUFDQyxXQUF5QixFQUN6QixRQUF5QjtZQU5sQixlQUFVLEdBQUcsSUFBSSxHQUFHLEVBQTBFLENBQUM7WUFFL0YsNEJBQXVCLEdBQUcsSUFBSSxHQUFHLEVBQXFFLENBQUM7WUFNOUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUVuRSxRQUFRLENBQUMseUJBQXlCLENBQUM7Z0JBQ2xDLGVBQWUsRUFBRSxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsRUFBRTtvQkFDbkMsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksZ0RBQXVDLEVBQUUsQ0FBQzt3QkFDNUQsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksZ0NBQW1CLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQzs0QkFDMUgsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7NEJBQ3BF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