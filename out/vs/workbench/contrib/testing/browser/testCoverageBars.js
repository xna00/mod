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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/common/assert", "vs/base/common/htmlContent", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/observable", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/testCoverage", "vs/workbench/contrib/testing/common/testCoverageService"], function (require, exports, dom_1, hoverDelegateFactory_1, updatableHoverWidget_1, assert_1, htmlContent_1, lazy_1, lifecycle_1, numbers_1, observable_1, types_1, nls_1, configuration_1, colorRegistry_1, configuration_2, testCoverage_1, testCoverageService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExplorerTestCoverageBars = exports.ManagedTestCoverageBars = void 0;
    let ManagedTestCoverageBars = class ManagedTestCoverageBars extends lifecycle_1.Disposable {
        /** Gets whether coverage is currently visible for the resource. */
        get visible() {
            return !!this._coverage;
        }
        constructor(options, configurationService) {
            super();
            this.options = options;
            this.configurationService = configurationService;
            this.el = new lazy_1.Lazy(() => {
                if (this.options.compact) {
                    const el = (0, dom_1.h)('.test-coverage-bars.compact', [
                        (0, dom_1.h)('.tpc@overall'),
                        (0, dom_1.h)('.bar@tpcBar'),
                    ]);
                    this.attachHover(el.tpcBar, getOverallHoverText);
                    return el;
                }
                else {
                    const el = (0, dom_1.h)('.test-coverage-bars', [
                        (0, dom_1.h)('.tpc@overall'),
                        (0, dom_1.h)('.bar@statement'),
                        (0, dom_1.h)('.bar@function'),
                        (0, dom_1.h)('.bar@branch'),
                    ]);
                    this.attachHover(el.statement, stmtCoverageText);
                    this.attachHover(el.function, fnCoverageText);
                    this.attachHover(el.branch, branchCoverageText);
                    return el;
                }
            });
            this.visibleStore = this._register(new lifecycle_1.DisposableStore());
            this.customHovers = [];
        }
        attachHover(target, factory) {
            this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'), target, () => this._coverage && factory(this._coverage)));
        }
        setCoverageInfo(coverage) {
            const ds = this.visibleStore;
            if (!coverage) {
                if (this._coverage) {
                    this._coverage = undefined;
                    this.customHovers.forEach(c => c.hide());
                    ds.clear();
                }
                return;
            }
            if (!this._coverage) {
                const root = this.el.value.root;
                ds.add((0, lifecycle_1.toDisposable)(() => this.options.container.removeChild(root)));
                this.options.container.appendChild(root);
                ds.add(this.configurationService.onDidChangeConfiguration(c => {
                    if (!this._coverage) {
                        return;
                    }
                    if (c.affectsConfiguration("testing.displayedCoveragePercent" /* TestingConfigKeys.CoveragePercent */) || c.affectsConfiguration("testing.coverageBarThresholds" /* TestingConfigKeys.CoverageBarThresholds */)) {
                        this.doRender(this._coverage);
                    }
                }));
            }
            this._coverage = coverage;
            this.doRender(coverage);
        }
        doRender(coverage) {
            const el = this.el.value;
            const precision = this.options.compact ? 0 : 2;
            const thresholds = (0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.coverageBarThresholds" /* TestingConfigKeys.CoverageBarThresholds */);
            const overallStat = calculateDisplayedStat(coverage, (0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.displayedCoveragePercent" /* TestingConfigKeys.CoveragePercent */));
            el.overall.textContent = displayPercent(overallStat, precision);
            if ('tpcBar' in el) { // compact mode
                renderBar(el.tpcBar, overallStat, false, thresholds);
            }
            else {
                renderBar(el.statement, percent(coverage.statement), coverage.statement.total === 0, thresholds);
                renderBar(el.function, coverage.declaration && percent(coverage.declaration), coverage.declaration?.total === 0, thresholds);
                renderBar(el.branch, coverage.branch && percent(coverage.branch), coverage.branch?.total === 0, thresholds);
            }
        }
    };
    exports.ManagedTestCoverageBars = ManagedTestCoverageBars;
    exports.ManagedTestCoverageBars = ManagedTestCoverageBars = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], ManagedTestCoverageBars);
    const percent = (cc) => (0, numbers_1.clamp)(cc.total === 0 ? 1 : cc.covered / cc.total, 0, 1);
    const epsilon = 10e-8;
    const barWidth = 16;
    const renderBar = (bar, pct, isZero, thresholds) => {
        if (pct === undefined) {
            bar.style.display = 'none';
            return;
        }
        bar.style.display = 'block';
        bar.style.width = `${barWidth}px`;
        // this is floored so the bar is only completely filled at 100% and not 99.9%
        bar.style.setProperty('--test-bar-width', `${Math.floor(pct * 16)}px`);
        if (isZero) {
            bar.style.color = 'currentColor';
            bar.style.opacity = '0.5';
            return;
        }
        let best = colorThresholds[0].color; //  red
        let distance = pct;
        for (const { key, color } of colorThresholds) {
            const t = thresholds[key] / 100;
            if (t && pct >= t && pct - t < distance) {
                best = color;
                distance = pct - t;
            }
        }
        bar.style.color = best;
        bar.style.opacity = '1';
    };
    const colorThresholds = [
        { color: `var(${(0, colorRegistry_1.asCssVariableName)(colorRegistry_1.chartsRed)})`, key: 'red' },
        { color: `var(${(0, colorRegistry_1.asCssVariableName)(colorRegistry_1.chartsYellow)})`, key: 'yellow' },
        { color: `var(${(0, colorRegistry_1.asCssVariableName)(colorRegistry_1.chartsGreen)})`, key: 'green' },
    ];
    const calculateDisplayedStat = (coverage, method) => {
        switch (method) {
            case "statement" /* TestingDisplayedCoveragePercent.Statement */:
                return percent(coverage.statement);
            case "minimum" /* TestingDisplayedCoveragePercent.Minimum */: {
                let value = percent(coverage.statement);
                if (coverage.branch) {
                    value = Math.min(value, percent(coverage.branch));
                }
                if (coverage.declaration) {
                    value = Math.min(value, percent(coverage.declaration));
                }
                return value;
            }
            case "totalCoverage" /* TestingDisplayedCoveragePercent.TotalCoverage */:
                return (0, testCoverage_1.getTotalCoveragePercent)(coverage.statement, coverage.branch, coverage.declaration);
            default:
                (0, assert_1.assertNever)(method);
        }
    };
    const displayPercent = (value, precision = 2) => {
        const display = (value * 100).toFixed(precision);
        // avoid showing 100% coverage if it just rounds up:
        if (value < 1 - epsilon && display === '100') {
            return `${100 - (10 ** -precision)}%`;
        }
        return `${display}%`;
    };
    const nf = new Intl.NumberFormat();
    const stmtCoverageText = (coverage) => (0, nls_1.localize)('statementCoverage', '{0}/{1} statements covered ({2})', nf.format(coverage.statement.covered), nf.format(coverage.statement.total), displayPercent(percent(coverage.statement)));
    const fnCoverageText = (coverage) => coverage.declaration && (0, nls_1.localize)('functionCoverage', '{0}/{1} functions covered ({2})', nf.format(coverage.declaration.covered), nf.format(coverage.declaration.total), displayPercent(percent(coverage.declaration)));
    const branchCoverageText = (coverage) => coverage.branch && (0, nls_1.localize)('branchCoverage', '{0}/{1} branches covered ({2})', nf.format(coverage.branch.covered), nf.format(coverage.branch.total), displayPercent(percent(coverage.branch)));
    const getOverallHoverText = (coverage) => {
        const str = [
            stmtCoverageText(coverage),
            fnCoverageText(coverage),
            branchCoverageText(coverage),
        ].filter(types_1.isDefined).join('\n\n');
        return {
            markdown: new htmlContent_1.MarkdownString().appendText(str),
            markdownNotSupportedFallback: str
        };
    };
    /**
     * Renders test coverage bars for a resource in the given container. It will
     * not render anything unless a test coverage report has been opened.
     */
    let ExplorerTestCoverageBars = class ExplorerTestCoverageBars extends ManagedTestCoverageBars {
        constructor(options, configurationService, testCoverageService) {
            super(options, configurationService);
            this.resource = (0, observable_1.observableValue)(this, undefined);
            const isEnabled = (0, configuration_2.observeTestingConfiguration)(configurationService, "testing.showCoverageInExplorer" /* TestingConfigKeys.ShowCoverageInExplorer */);
            this._register((0, observable_1.autorun)(async (reader) => {
                let info;
                const coverage = testCoverageService.selected.read(reader);
                if (coverage && isEnabled.read(reader)) {
                    const resource = this.resource.read(reader);
                    if (resource) {
                        info = coverage.getComputedForUri(resource);
                    }
                }
                this.setCoverageInfo(info);
            }));
        }
        /** @inheritdoc */
        setResource(resource, transaction) {
            this.resource.set(resource, transaction);
        }
        setCoverageInfo(coverage) {
            super.setCoverageInfo(coverage);
            this.options.container?.classList.toggle('explorer-item-with-test-coverage', this.visible);
        }
    };
    exports.ExplorerTestCoverageBars = ExplorerTestCoverageBars;
    exports.ExplorerTestCoverageBars = ExplorerTestCoverageBars = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, testCoverageService_1.ITestCoverageService)
    ], ExplorerTestCoverageBars);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdENvdmVyYWdlQmFycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9icm93c2VyL3Rlc3RDb3ZlcmFnZUJhcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUN6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHNCQUFVO1FBMkJ0RCxtRUFBbUU7UUFDbkUsSUFBVyxPQUFPO1lBQ2pCLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDekIsQ0FBQztRQUVELFlBQ29CLE9BQWdDLEVBQzVCLG9CQUE0RDtZQUVuRixLQUFLLEVBQUUsQ0FBQztZQUhXLFlBQU8sR0FBUCxPQUFPLENBQXlCO1lBQ1gseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQWhDbkUsT0FBRSxHQUFHLElBQUksV0FBSSxDQUFDLEdBQUcsRUFBRTtnQkFDbkMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUMxQixNQUFNLEVBQUUsR0FBRyxJQUFBLE9BQUMsRUFBQyw2QkFBNkIsRUFBRTt3QkFDM0MsSUFBQSxPQUFDLEVBQUMsY0FBYyxDQUFDO3dCQUNqQixJQUFBLE9BQUMsRUFBQyxhQUFhLENBQUM7cUJBQ2hCLENBQUMsQ0FBQztvQkFDSCxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztvQkFDakQsT0FBTyxFQUFFLENBQUM7Z0JBQ1gsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sRUFBRSxHQUFHLElBQUEsT0FBQyxFQUFDLHFCQUFxQixFQUFFO3dCQUNuQyxJQUFBLE9BQUMsRUFBQyxjQUFjLENBQUM7d0JBQ2pCLElBQUEsT0FBQyxFQUFDLGdCQUFnQixDQUFDO3dCQUNuQixJQUFBLE9BQUMsRUFBQyxlQUFlLENBQUM7d0JBQ2xCLElBQUEsT0FBQyxFQUFDLGFBQWEsQ0FBQztxQkFDaEIsQ0FBQyxDQUFDO29CQUNILElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO29CQUNqRCxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsY0FBYyxDQUFDLENBQUM7b0JBQzlDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO29CQUNoRCxPQUFPLEVBQUUsQ0FBQztnQkFDWCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFYyxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUNyRCxpQkFBWSxHQUFtQixFQUFFLENBQUM7UUFZbkQsQ0FBQztRQUVPLFdBQVcsQ0FBQyxNQUFtQixFQUFFLE9BQXFGO1lBQzdILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx1Q0FBZ0IsRUFBQyxJQUFBLDhDQUF1QixFQUFDLFNBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9ILENBQUM7UUFFTSxlQUFlLENBQUMsUUFBdUM7WUFDN0QsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUM3QixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO29CQUMzQixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO29CQUN6QyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osQ0FBQztnQkFDRCxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3JCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztnQkFDaEMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN6QyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDN0QsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQzt3QkFDckIsT0FBTztvQkFDUixDQUFDO29CQUVELElBQUksQ0FBQyxDQUFDLG9CQUFvQiw0RUFBbUMsSUFBSSxDQUFDLENBQUMsb0JBQW9CLCtFQUF5QyxFQUFFLENBQUM7d0JBQ2xJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUMvQixDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1lBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7WUFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN6QixDQUFDO1FBRU8sUUFBUSxDQUFDLFFBQTJCO1lBQzNDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDO1lBRXpCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvQyxNQUFNLFVBQVUsR0FBRyxJQUFBLHVDQUF1QixFQUFDLElBQUksQ0FBQyxvQkFBb0IsZ0ZBQTBDLENBQUM7WUFDL0csTUFBTSxXQUFXLEdBQUcsc0JBQXNCLENBQUMsUUFBUSxFQUFFLElBQUEsdUNBQXVCLEVBQUMsSUFBSSxDQUFDLG9CQUFvQiw2RUFBb0MsQ0FBQyxDQUFDO1lBQzVJLEVBQUUsQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLGNBQWMsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDaEUsSUFBSSxRQUFRLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxlQUFlO2dCQUNwQyxTQUFTLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3RELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxTQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxLQUFLLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDakcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFdBQVcsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUUsS0FBSyxLQUFLLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDN0gsU0FBUyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxLQUFLLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUM3RyxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUF4RlksMERBQXVCO3NDQUF2Qix1QkFBdUI7UUFrQ2pDLFdBQUEscUNBQXFCLENBQUE7T0FsQ1gsdUJBQXVCLENBd0ZuQztJQUVELE1BQU0sT0FBTyxHQUFHLENBQUMsRUFBa0IsRUFBRSxFQUFFLENBQUMsSUFBQSxlQUFLLEVBQUMsRUFBRSxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNoRyxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUM7SUFDdEIsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBRXBCLE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBZ0IsRUFBRSxHQUF1QixFQUFFLE1BQWUsRUFBRSxVQUF5QyxFQUFFLEVBQUU7UUFDM0gsSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDdkIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQzNCLE9BQU87UUFDUixDQUFDO1FBRUQsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQzVCLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsUUFBUSxJQUFJLENBQUM7UUFDbEMsNkVBQTZFO1FBQzdFLEdBQUcsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXZFLElBQUksTUFBTSxFQUFFLENBQUM7WUFDWixHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxjQUFjLENBQUM7WUFDakMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQzFCLE9BQU87UUFDUixDQUFDO1FBRUQsSUFBSSxJQUFJLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU87UUFDNUMsSUFBSSxRQUFRLEdBQUcsR0FBRyxDQUFDO1FBQ25CLEtBQUssTUFBTSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxlQUFlLEVBQUUsQ0FBQztZQUM5QyxNQUFNLENBQUMsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxHQUFHLEtBQUssQ0FBQztnQkFDYixRQUFRLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNwQixDQUFDO1FBQ0YsQ0FBQztRQUVELEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUN2QixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7SUFDekIsQ0FBQyxDQUFDO0lBRUYsTUFBTSxlQUFlLEdBQUc7UUFDdkIsRUFBRSxLQUFLLEVBQUUsT0FBTyxJQUFBLGlDQUFpQixFQUFDLHlCQUFTLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUU7UUFDN0QsRUFBRSxLQUFLLEVBQUUsT0FBTyxJQUFBLGlDQUFpQixFQUFDLDRCQUFZLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUU7UUFDbkUsRUFBRSxLQUFLLEVBQUUsT0FBTyxJQUFBLGlDQUFpQixFQUFDLDJCQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUU7S0FDeEQsQ0FBQztJQUVYLE1BQU0sc0JBQXNCLEdBQUcsQ0FBQyxRQUEyQixFQUFFLE1BQXVDLEVBQUUsRUFBRTtRQUN2RyxRQUFRLE1BQU0sRUFBRSxDQUFDO1lBQ2hCO2dCQUNDLE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNwQyw0REFBNEMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3hDLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQUMsQ0FBQztnQkFDM0UsSUFBSSxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFBQyxDQUFDO2dCQUNyRixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRDtnQkFDQyxPQUFPLElBQUEsc0NBQXVCLEVBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMzRjtnQkFDQyxJQUFBLG9CQUFXLEVBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEIsQ0FBQztJQUVGLENBQUMsQ0FBQztJQUVGLE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBYSxFQUFFLFNBQVMsR0FBRyxDQUFDLEVBQUUsRUFBRTtRQUN2RCxNQUFNLE9BQU8sR0FBRyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFakQsb0RBQW9EO1FBQ3BELElBQUksS0FBSyxHQUFHLENBQUMsR0FBRyxPQUFPLElBQUksT0FBTyxLQUFLLEtBQUssRUFBRSxDQUFDO1lBQzlDLE9BQU8sR0FBRyxHQUFHLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxPQUFPLEdBQUcsT0FBTyxHQUFHLENBQUM7SUFDdEIsQ0FBQyxDQUFDO0lBRUYsTUFBTSxFQUFFLEdBQUcsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDbkMsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLFFBQTJCLEVBQUUsRUFBRSxDQUFDLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLGtDQUFrQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsY0FBYyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JQLE1BQU0sY0FBYyxHQUFHLENBQUMsUUFBMkIsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsSUFBSSxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxpQ0FBaUMsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxFQUFFLGNBQWMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvUSxNQUFNLGtCQUFrQixHQUFHLENBQUMsUUFBMkIsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxnQ0FBZ0MsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLGNBQWMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU1UCxNQUFNLG1CQUFtQixHQUFHLENBQUMsUUFBMkIsRUFBMEIsRUFBRTtRQUNuRixNQUFNLEdBQUcsR0FBRztZQUNYLGdCQUFnQixDQUFDLFFBQVEsQ0FBQztZQUMxQixjQUFjLENBQUMsUUFBUSxDQUFDO1lBQ3hCLGtCQUFrQixDQUFDLFFBQVEsQ0FBQztTQUM1QixDQUFDLE1BQU0sQ0FBQyxpQkFBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRWpDLE9BQU87WUFDTixRQUFRLEVBQUUsSUFBSSw0QkFBYyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztZQUM5Qyw0QkFBNEIsRUFBRSxHQUFHO1NBQ2pDLENBQUM7SUFDSCxDQUFDLENBQUM7SUFFRjs7O09BR0c7SUFDSSxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHVCQUF1QjtRQUdwRSxZQUNDLE9BQWdDLEVBQ1Qsb0JBQTJDLEVBQzVDLG1CQUF5QztZQUUvRCxLQUFLLENBQUMsT0FBTyxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFQckIsYUFBUSxHQUFHLElBQUEsNEJBQWUsRUFBa0IsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBUzdFLE1BQU0sU0FBUyxHQUFHLElBQUEsMkNBQTJCLEVBQUMsb0JBQW9CLGtGQUEyQyxDQUFDO1lBRTlHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSxvQkFBTyxFQUFDLEtBQUssRUFBQyxNQUFNLEVBQUMsRUFBRTtnQkFDckMsSUFBSSxJQUFzQyxDQUFDO2dCQUMzQyxNQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLFFBQVEsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQ3hDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUM1QyxJQUFJLFFBQVEsRUFBRSxDQUFDO3dCQUNkLElBQUksR0FBRyxRQUFRLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQzdDLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsa0JBQWtCO1FBQ1gsV0FBVyxDQUFDLFFBQXlCLEVBQUUsV0FBMEI7WUFDdkUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFZSxlQUFlLENBQUMsUUFBMEM7WUFDekUsS0FBSyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1RixDQUFDO0tBQ0QsQ0FBQTtJQW5DWSw0REFBd0I7dUNBQXhCLHdCQUF3QjtRQUtsQyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsMENBQW9CLENBQUE7T0FOVix3QkFBd0IsQ0FtQ3BDIn0=