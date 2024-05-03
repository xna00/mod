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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/workbench/contrib/speech/common/speechService", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/types", "vs/base/common/themables", "vs/base/common/codicons", "vs/base/browser/ui/aria/aria", "vs/nls"], function (require, exports, async_1, cancellation_1, lifecycle_1, configuration_1, instantiation_1, accessibilityConfiguration_1, speechService_1, terminal_1, types_1, themables_1, codicons_1, aria_1, nls_1) {
    "use strict";
    var TerminalVoiceSession_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalVoiceSession = void 0;
    const symbolMap = {
        'Ampersand': '&',
        'ampersand': '&',
        'Dollar': '$',
        'dollar': '$',
        'Percent': '%',
        'percent': '%',
        'Asterisk': '*',
        'asterisk': '*',
        'Plus': '+',
        'plus': '+',
        'Equals': '=',
        'equals': '=',
        'Exclamation': '!',
        'exclamation': '!',
        'Slash': '/',
        'slash': '/',
        'Backslash': '\\',
        'backslash': '\\',
        'Dot': '.',
        'dot': '.',
        'Period': '.',
        'period': '.',
        'Quote': '\'',
        'quote': '\'',
        'double quote': '"',
        'Double quote': '"',
    };
    let TerminalVoiceSession = class TerminalVoiceSession extends lifecycle_1.Disposable {
        static { TerminalVoiceSession_1 = this; }
        static { this._instance = undefined; }
        static getInstance(instantiationService) {
            if (!TerminalVoiceSession_1._instance) {
                TerminalVoiceSession_1._instance = instantiationService.createInstance(TerminalVoiceSession_1);
            }
            return TerminalVoiceSession_1._instance;
        }
        constructor(_speechService, _terminalService, configurationService, _instantationService) {
            super();
            this._speechService = _speechService;
            this._terminalService = _terminalService;
            this.configurationService = configurationService;
            this._instantationService = _instantationService;
            this._input = '';
            this._register(this._terminalService.onDidChangeActiveInstance(() => this.stop()));
            this._register(this._terminalService.onDidDisposeInstance(() => this.stop()));
            this._disposables = this._register(new lifecycle_1.DisposableStore());
        }
        async start() {
            this.stop();
            let voiceTimeout = this.configurationService.getValue("accessibility.voice.speechTimeout" /* AccessibilityVoiceSettingId.SpeechTimeout */);
            if (!(0, types_1.isNumber)(voiceTimeout) || voiceTimeout < 0) {
                voiceTimeout = accessibilityConfiguration_1.SpeechTimeoutDefault;
            }
            this._acceptTranscriptionScheduler = this._disposables.add(new async_1.RunOnceScheduler(() => {
                this._sendText();
                this.stop();
            }, voiceTimeout));
            this._cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            this._register((0, lifecycle_1.toDisposable)(() => this._cancellationTokenSource?.dispose(true)));
            const session = await this._speechService.createSpeechToTextSession(this._cancellationTokenSource?.token, 'terminal');
            this._disposables.add(session.onDidChange((e) => {
                if (this._cancellationTokenSource?.token.isCancellationRequested) {
                    return;
                }
                switch (e.status) {
                    case speechService_1.SpeechToTextStatus.Started:
                        // TODO: play start audio cue
                        if (!this._decoration) {
                            this._createDecoration();
                        }
                        break;
                    case speechService_1.SpeechToTextStatus.Recognizing: {
                        this._updateInput(e);
                        this._renderGhostText(e);
                        if (voiceTimeout > 0) {
                            this._acceptTranscriptionScheduler.cancel();
                        }
                        break;
                    }
                    case speechService_1.SpeechToTextStatus.Recognized:
                        this._updateInput(e);
                        if (voiceTimeout > 0) {
                            this._acceptTranscriptionScheduler.schedule();
                        }
                        break;
                    case speechService_1.SpeechToTextStatus.Stopped:
                        // TODO: play stop audio cue
                        this.stop();
                        break;
                }
            }));
        }
        stop(send) {
            this._setInactive();
            if (send) {
                this._acceptTranscriptionScheduler.cancel();
                this._sendText();
            }
            this._marker?.dispose();
            this._ghostTextMarker?.dispose();
            this._ghostText?.dispose();
            this._ghostText = undefined;
            this._decoration?.dispose();
            this._decoration = undefined;
            this._cancellationTokenSource?.cancel();
            this._disposables.clear();
            this._input = '';
        }
        _sendText() {
            this._terminalService.activeInstance?.sendText(this._input, false);
            (0, aria_1.alert)((0, nls_1.localize)('terminalVoiceTextInserted', '{0} inserted', this._input));
        }
        _updateInput(e) {
            if (e.text) {
                let input = e.text.replaceAll(/[.,?;!]/g, '');
                for (const symbol of Object.entries(symbolMap)) {
                    input = input.replace(new RegExp('\\b' + symbol[0] + '\\b'), symbol[1]);
                }
                this._input = ' ' + input;
            }
        }
        _createDecoration() {
            const activeInstance = this._terminalService.activeInstance;
            const xterm = activeInstance?.xterm?.raw;
            if (!xterm) {
                return;
            }
            const onFirstLine = xterm.buffer.active.cursorY === 0;
            this._marker = activeInstance.registerMarker(onFirstLine ? 0 : -1);
            if (!this._marker) {
                return;
            }
            this._decoration = xterm.registerDecoration({
                marker: this._marker,
                layer: 'top',
                x: xterm.buffer.active.cursorX ?? 0,
            });
            this._decoration?.onRender((e) => {
                e.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.micFilled), 'terminal-voice', 'recording');
                e.style.transform = onFirstLine ? 'translate(10px, -2px)' : 'translate(-6px, -5px)';
            });
        }
        _setInactive() {
            this._decoration?.element?.classList.remove('recording');
        }
        _renderGhostText(e) {
            this._ghostText?.dispose();
            const text = e.text;
            if (!text) {
                return;
            }
            const activeInstance = this._terminalService.activeInstance;
            const xterm = activeInstance?.xterm?.raw;
            if (!xterm) {
                return;
            }
            this._ghostTextMarker = activeInstance.registerMarker();
            if (!this._ghostTextMarker) {
                return;
            }
            const onFirstLine = xterm.buffer.active.cursorY === 0;
            this._ghostText = xterm.registerDecoration({
                marker: this._ghostTextMarker,
                layer: 'top',
                x: onFirstLine ? xterm.buffer.active.cursorX + 4 : xterm.buffer.active.cursorX + 1 ?? 0,
            });
            this._ghostText?.onRender((e) => {
                e.classList.add('terminal-voice-progress-text');
                e.textContent = text;
                e.style.width = (xterm.cols - xterm.buffer.active.cursorX) / xterm.cols * 100 + '%';
            });
        }
    };
    exports.TerminalVoiceSession = TerminalVoiceSession;
    exports.TerminalVoiceSession = TerminalVoiceSession = TerminalVoiceSession_1 = __decorate([
        __param(0, speechService_1.ISpeechService),
        __param(1, terminal_1.ITerminalService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, instantiation_1.IInstantiationService)
    ], TerminalVoiceSession);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxWb2ljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbFZvaWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFrQmhHLE1BQU0sU0FBUyxHQUE4QjtRQUM1QyxXQUFXLEVBQUUsR0FBRztRQUNoQixXQUFXLEVBQUUsR0FBRztRQUNoQixRQUFRLEVBQUUsR0FBRztRQUNiLFFBQVEsRUFBRSxHQUFHO1FBQ2IsU0FBUyxFQUFFLEdBQUc7UUFDZCxTQUFTLEVBQUUsR0FBRztRQUNkLFVBQVUsRUFBRSxHQUFHO1FBQ2YsVUFBVSxFQUFFLEdBQUc7UUFDZixNQUFNLEVBQUUsR0FBRztRQUNYLE1BQU0sRUFBRSxHQUFHO1FBQ1gsUUFBUSxFQUFFLEdBQUc7UUFDYixRQUFRLEVBQUUsR0FBRztRQUNiLGFBQWEsRUFBRSxHQUFHO1FBQ2xCLGFBQWEsRUFBRSxHQUFHO1FBQ2xCLE9BQU8sRUFBRSxHQUFHO1FBQ1osT0FBTyxFQUFFLEdBQUc7UUFDWixXQUFXLEVBQUUsSUFBSTtRQUNqQixXQUFXLEVBQUUsSUFBSTtRQUNqQixLQUFLLEVBQUUsR0FBRztRQUNWLEtBQUssRUFBRSxHQUFHO1FBQ1YsUUFBUSxFQUFFLEdBQUc7UUFDYixRQUFRLEVBQUUsR0FBRztRQUNiLE9BQU8sRUFBRSxJQUFJO1FBQ2IsT0FBTyxFQUFFLElBQUk7UUFDYixjQUFjLEVBQUUsR0FBRztRQUNuQixjQUFjLEVBQUUsR0FBRztLQUNuQixDQUFDO0lBRUssSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTs7aUJBTXBDLGNBQVMsR0FBcUMsU0FBUyxBQUE5QyxDQUErQztRQUV2RSxNQUFNLENBQUMsV0FBVyxDQUFD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