import { LintReport, Options as EslintOptions } from './types/eslint';
export declare function createEslinter(eslintOptions: EslintOptions): {
    getReport: (filepaths: string[]) => LintReport | undefined;
};
