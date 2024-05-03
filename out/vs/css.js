/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.load = load;
    /**
     * Invoked by the loader at run-time
     *
     * @skipMangle
     */
    function load(name, req, load, config) {
        config = config || {};
        const cssConfig = (config['vs/css'] || {});
        if (cssConfig.disabled) {
            // the plugin is asked to not create any style sheets
            load({});
            return;
        }
        const cssUrl = req.toUrl(name + '.css');
        loadCSS(name, cssUrl, () => {
            load({});
        }, (err) => {
            if (typeof load.error === 'function') {
                load.error('Could not find ' + cssUrl + '.');
            }
        });
    }
    function loadCSS(name, cssUrl, callback, errorback) {
        if (linkTagExists(name, cssUrl)) {
            callback();
            return;
        }
        createLinkTag(name, cssUrl, callback, errorback);
    }
    function linkTagExists(name, cssUrl) {
        // eslint-disable-next-line no-restricted-globals
        const links = window.document.getElementsByTagName('link');
        for (let i = 0, len = links.length; i < len; i++) {
            const nameAttr = links[i].getAttribute('data-name');
            const hrefAttr = links[i].getAttribute('href');
            if (nameAttr === name || hrefAttr === cssUrl) {
                return true;
            }
        }
        return false;
    }
    function createLinkTag(name, cssUrl, callback, errorback) {
        const linkNode = document.createElement('link');
        linkNode.setAttribute('rel', 'stylesheet');
        linkNode.setAttribute('type', 'text/css');
        linkNode.setAttribute('data-name', name);
        attachListeners(name, linkNode, callback, errorback);
        linkNode.setAttribute('href', cssUrl);
        // eslint-disable-next-line no-restricted-globals
        const head = window.document.head || window.document.getElementsByTagName('head')[0];
        head.appendChild(linkNode);
    }
    function attachListeners(name, linkNode, callback, errorback) {
        const unbind = () => {
            linkNode.removeEventListener('load', loadEventListener);
            linkNode.removeEventListener('error', errorEventListener);
        };
        const loadEventListener = (e) => {
            unbind();
            callback();
        };
        const errorEventListener = (e) => {
            unbind();
            errorback(e);
        };
        linkNode.addEventListener('load', loadEventListener);
        linkNode.addEventListener('error', errorEventListener);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9jc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsb0JBa0JDO0lBdkJEOzs7O09BSUc7SUFDSCxTQUFnQixJQUFJLENBQUMsSUFBWSxFQUFFLEdBQStCLEVBQUUsSUFBbUMsRUFBRSxNQUF1QztRQUMvSSxNQUFNLEdBQUcsTUFBTSxJQUFJLEVBQUUsQ0FBQztRQUN0QixNQUFNLFNBQVMsR0FBcUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFFN0QsSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDeEIscURBQXFEO1lBQ3JELElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNULE9BQU87UUFDUixDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUM7UUFDeEMsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFO1lBQzFCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNWLENBQUMsRUFBRSxDQUFDLEdBQVEsRUFBRSxFQUFFO1lBQ2YsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQzlDLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFTLE9BQU8sQ0FBQyxJQUFZLEVBQUUsTUFBYyxFQUFFLFFBQW9CLEVBQUUsU0FBNkI7UUFDakcsSUFBSSxhQUFhLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDakMs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