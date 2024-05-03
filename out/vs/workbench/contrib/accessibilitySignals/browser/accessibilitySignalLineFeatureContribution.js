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
define(["require", "exports", "vs/base/common/cache", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/observableInternal/utils", "vs/editor/browser/editorBrowser", "vs/editor/contrib/folding/browser/folding", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/markers/common/markers", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/editor/common/editorService"], function (require, exports, cache_1, event_1, lifecycle_1, observable_1, utils_1, editorBrowser_1, folding_1, accessibilitySignalService_1, configuration_1, instantiation_1, markers_1, debug_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SignalLineFeatureContribution = void 0;
    let SignalLineFeatureContribution = class SignalLineFeatureContribution extends lifecycle_1.Disposable {
        constructor(editorService, instantiationService, accessibilitySignalService, _configurationService) {
            super();
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.accessibilitySignalService = accessibilitySignalService;
            this._configurationService = _configurationService;
            this.store = this._register(new lifecycle_1.DisposableStore());
            this.features = [
                this.instantiationService.createInstance(MarkerLineFeature, accessibilitySignalService_1.AccessibilitySignal.error, markers_1.MarkerSeverity.Error),
                this.instantiationService.createInstance(MarkerLineFeature, accessibilitySignalService_1.AccessibilitySignal.warning, markers_1.MarkerSeverity.Warning),
                this.instantiationService.createInstance(FoldedAreaLineFeature),
                this.instantiationService.createInstance(BreakpointLineFeature),
            ];
            this.isEnabledCache = new cache_1.CachedFunction((cue) => (0, observable_1.observableFromEvent)(event_1.Event.any(this.accessibilitySignalService.onSoundEnabledChanged(cue), this.accessibilitySignalService.onAnnouncementEnabledChanged(cue)), () => this.accessibilitySignalService.isSoundEnabled(cue) || this.accessibilitySignalService.isAnnouncementEnabled(cue)));
            this._someAccessibilitySignalIsEnabled = (0, observable_1.derived)(this, (reader) => this.features.some((feature) => this.isEnabledCache.get(feature.signal).read(reader)));
            this._activeEditorObservable = (0, observable_1.observableFromEvent)(this.editorService.onDidActiveEditorChange, (_) => {
                const activeTextEditorControl = this.editorService.activeTextEditorControl;
                const editor = (0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)
                    ? activeTextEditorControl.getOriginalEditor()
                    : (0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)
                        ? activeTextEditorControl
                        : undefined;
                return editor && editor.hasModel() ? { editor, model: editor.getModel() } : undefined;
            });
            this._register((0, observable_1.autorun)(reader => {
                /** @description updateSignalsEnabled */
                this.store.clear();
                if (!this._someAccessibilitySignalIsEnabled.read(reader)) {
                    return;
                }
                const activeEditor = this._activeEditorObservable.read(reader);
                if (activeEditor) {
                    this.registerAccessibilitySignalsForEditor(activeEditor.editor, activeEditor.model, this.store);
                }
            }));
        }
        registerAccessibilitySignalsForEditor(editor, editorModel, store) {
            const curPosition = (0, observable_1.observableFromEvent)(editor.onDidChangeCursorPosition, (args) => {
                /** @description editor.onDidChangeCursorPosition (caused by user) */
                if (args &&
                    args.reason !== 3 /* CursorChangeReason.Explicit */ &&
                    args.reason !== 0 /* CursorChangeReason.NotSet */) {
                    // Ignore cursor changes caused by navigation (e.g. which happens when execution is paused).
                    return undefined;
                }
                return editor.getPosition();
            });
            const debouncedPosition = (0, utils_1.debouncedObservable2)(curPosition, this._configurationService.getValue('accessibility.signals.debouncePositionChanges') ? 300 : 0);
            const isTyping = (0, observable_1.wasEventTriggeredRecently)(e => editorModel.onDidChangeContent(e), 1000, store);
            const featureStates = this.features.map((feature) => {
                const lineFeatureState = feature.createSource(editor, editorModel);
                const isFeaturePresent = (0, observable_1.derivedOpts)({ debugName: `isPresentInLine:${feature.signal.name}` }, (reader) => {
                    if (!this.isEnabledCache.get(feature.signal).read(reader)) {
                        return false;
                    }
                    const position = debouncedPosition.read(reader);
                    if (!position) {
                        return false;
                    }
                    return lineFeatureState.isPresent(position, reader);
                });
                return (0, observable_1.derivedOpts)({ debugName: `typingDebouncedFeatureState:\n${feature.signal.name}` }, (reader) => feature.debounceWhileTyping && isTyping.read(reader)
                    ? (debouncedPosition.read(reader), isFeaturePresent.get())
                    : isFeaturePresent.read(reader));
            });
            const state = (0, observable_1.derived)((reader) => /** @description states */ ({
                lineNumber: debouncedPosition.read(reader),
                featureStates: new Map(this.features.map((feature, idx) => [
                    feature,
                    featureStates[idx].read(reader),
                ])),
            }));
            store.add((0, observable_1.autorunDelta)(state, ({ lastValue, newValue }) => {
                /** @description Play Accessibility Signal */
                const newFeatures = this.features.filter(feature => newValue?.featureStates.get(feature) &&
                    (!lastValue?.featureStates?.get(feature) || newValue.lineNumber !== lastValue.lineNumber));
                this.accessibilitySignalService.playSignals(newFeatures.map(f => f.signal));
            }));
        }
    };
    exports.SignalLineFeatureContribution = SignalLineFeatureContribution;
    exports.SignalLineFeatureContribution = SignalLineFeatureContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(3, configuration_1.IConfigurationService)
    ], SignalLineFeatureContribution);
    let MarkerLineFeature = class MarkerLineFeature {
        constructor(signal, severity, markerService) {
            this.signal = signal;
            this.severity = severity;
            this.markerService = markerService;
            this.debounceWhileTyping = true;
            this._previousLine = 0;
        }
        createSource(editor, model) {
            const obs = (0, utils_1.observableSignalFromEvent)('onMarkerChanged', this.markerService.onMarkerChanged);
            return {
                isPresent: (position, reader) => {
                    obs.read(reader);
                    const lineChanged = position.lineNumber !== this._previousLine;
                    this._previousLine = position.lineNumber;
                    const hasMarker = this.markerService
                        .read({ resource: model.uri })
                        .some((m) => {
                        const onLine = m.severity === this.severity && m.startLineNumber <= position.lineNumber && position.lineNumber <= m.endLineNumber;
                        return lineChanged ? onLine : onLine && (position.lineNumber <= m.endLineNumber && m.startColumn <= position.column && m.endColumn >= position.column);
                    });
                    return hasMarker;
                },
            };
        }
    };
    MarkerLineFeature = __decorate([
        __param(2, markers_1.IMarkerService)
    ], MarkerLineFeature);
    class FoldedAreaLineFeature {
        constructor() {
            this.signal = accessibilitySignalService_1.AccessibilitySignal.foldedArea;
        }
        createSource(editor, _model) {
            const foldingController = folding_1.FoldingController.get(editor);
            if (!foldingController) {
                return { isPresent: () => false, };
            }
            const foldingModel = (0, observable_1.observableFromPromise)(foldingController.getFoldingModel() ?? Promise.resolve(undefined));
            return {
                isPresent: (position, reader) => {
                    const m = foldingModel.read(reader);
                    const regionAtLine = m.value?.getRegionAtLine(position.lineNumber);
                    const hasFolding = !regionAtLine
                        ? false
                        : regionAtLine.isCollapsed &&
                            regionAtLine.startLineNumber === position.lineNumber;
                    return hasFolding;
                },
            };
        }
    }
    let BreakpointLineFeature = class BreakpointLineFeature {
        constructor(debugService) {
            this.debugService = debugService;
            this.signal = accessibilitySignalService_1.AccessibilitySignal.break;
        }
        createSource(editor, model) {
            const signal = (0, utils_1.observableSignalFromEvent)('onDidChangeBreakpoints', this.debugService.getModel().onDidChangeBreakpoints);
            return {
                isPresent: (position, reader) => {
                    signal.read(reader);
                    const breakpoints = this.debugService
                        .getModel()
                        .getBreakpoints({ uri: model.uri, lineNumber: position.lineNumber });
                    const hasBreakpoints = breakpoints.length > 0;
                    return hasBreakpoints;
                },
            };
        }
    };
    BreakpointLineFeature = __decorate([
        __param(0, debug_1.IDebugService)
    ], BreakpointLineFeature);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eVNpZ25hbExpbmVGZWF0dXJlQ29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9hY2Nlc3NpYmlsaXR5U2lnbmFscy9icm93c2VyL2FjY2Vzc2liaWxpdHlTaWduYWxMaW5lRmVhdHVyZUNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQnpGLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQ1osU0FBUSxzQkFBVTtRQXlDbEIsWUFDaUIsYUFBOEMsRUFDdkMsb0JBQTRELEVBQ3RELDBCQUF3RSxFQUM5RSxxQkFBNkQ7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFMeUIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3RCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDckMsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUM3RCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBM0NwRSxVQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBRTlDLGFBQVEsR0FBa0I7Z0JBQzFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsZ0RBQW1CLENBQUMsS0FBSyxFQUFFLHdCQUFjLENBQUMsS0FBSyxDQUFDO2dCQUM1RyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlCQUFpQixFQUFFLGdEQUFtQixDQUFDLE9BQU8sRUFBRSx3QkFBYyxDQUFDLE9BQU8sQ0FBQztnQkFDaEgsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxxQkFBcUIsQ0FBQztnQkFDL0QsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNB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