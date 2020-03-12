import * as ts from 'typescript'; // used for types only
import {
  IncrementalCheckerInterface,
  IncrementalCheckerParams
} from './IncrementalCheckerInterface';
import { CancellationToken } from './CancellationToken';
import { CompilerHost } from './CompilerHost';
import { createEslinter } from './createEslinter';
import {
  createIssuesFromTsDiagnostics,
  createIssuesFromEsLintReports
} from './issue';
import { LintReport, LintResult } from './types/eslint';

type GroupedResult = [string, LintResult];

export class ApiIncrementalChecker implements IncrementalCheckerInterface {
  protected readonly tsIncrementalCompiler: CompilerHost;
  protected readonly typescript: typeof ts;

  private currentEsLintErrors = new Map<string, LintReport>();
  private lastUpdatedFiles: string[] = [];
  private lastRemovedFiles: string[] = [];

  private readonly eslinter: ReturnType<typeof createEslinter> | undefined;

  constructor({
    typescript,
    programConfigFile,
    compilerOptions,
    eslinter,
    vue,
    checkSyntacticErrors = false,
    resolveModuleName,
    resolveTypeReferenceDirective
  }: IncrementalCheckerParams) {
    this.eslinter = eslinter;

    this.tsIncrementalCompiler = new CompilerHost(
      typescript,
      vue,
      programConfigFile,
      compilerOptions,
      checkSyntacticErrors,
      resolveModuleName,
      resolveTypeReferenceDirective
    );

    this.typescript = typescript;
  }

  public hasEsLinter(): boolean {
    return this.eslinter !== undefined;
  }

  public isFileExcluded(filePath: string): boolean {
    return filePath.endsWith('.d.ts');
  }

  public nextIteration() {
    // do nothing
  }

  public async getTypeScriptIssues() {
    const tsDiagnostics = await this.tsIncrementalCompiler.processChanges();
    this.lastUpdatedFiles = tsDiagnostics.updatedFiles;
    this.lastRemovedFiles = tsDiagnostics.removedFiles;

    return createIssuesFromTsDiagnostics(
      tsDiagnostics.results,
      this.typescript
    );
  }

  public async getEsLintIssues(cancellationToken: CancellationToken) {
    if (!this.eslinter) {
      throw new Error('EsLint is not enabled in the plugin.');
    }

    for (const removedFile of this.lastRemovedFiles) {
      this.currentEsLintErrors.delete(removedFile);
    }

    const lintableFiles = this.lastUpdatedFiles.filter(
      file => !this.isFileExcluded(file)
    );

    const report = this.eslinter.getReport(lintableFiles);

    cancellationToken.throwIfCancellationRequested();

    if (report) {
      const results: GroupedResult[] = report.results.map(reportEntry => [
        reportEntry.filePath,
        reportEntry
      ]);

      for (const [filePath, result] of results) {
        if (result.messages.length) {
          this.currentEsLintErrors.set(filePath, {
            ...report,
            results: [result]
          });
        } else if (this.currentEsLintErrors.has(filePath)) {
          this.currentEsLintErrors.delete(filePath);
        }
      }
    }

    const reports = Array.from(this.currentEsLintErrors.values());
    return createIssuesFromEsLintReports(reports);
  }
}
