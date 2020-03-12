"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Issue_1 = require("../Issue");
var IssueOrigin_1 = require("../IssueOrigin");
var IssueSeverity_1 = require("../IssueSeverity");
function createIssueFromEsLintMessage(message) {
    return {
        origin: IssueOrigin_1.IssueOrigin.ESLINT,
        code: message.ruleId ? String(message.ruleId) : '[unknown]',
        severity: message.severity === 1 ? IssueSeverity_1.IssueSeverity.WARNING : IssueSeverity_1.IssueSeverity.ERROR,
        message: message.message,
        file: message.filePath,
        line: message.line,
        character: message.column
    };
}
function createFileAwareEsLintMessagesFromEsLintResult(result) {
    return result.messages.map(function (message) { return (__assign(__assign({}, message), { filePath: result.filePath })); });
}
function createFileAwareEsLintMessagesFromEsLintReport(report) {
    return report.results.reduce(function (messages, result) { return __spreadArrays(messages, createFileAwareEsLintMessagesFromEsLintResult(result)); }, []);
}
function createFileAwareEsLintMessagesFromEsLintReports(reports) {
    return reports.reduce(function (messages, report) { return __spreadArrays(messages, createFileAwareEsLintMessagesFromEsLintReport(report)); }, []);
}
function createIssuesFromEsLintMessages(messages) {
    return Issue_1.deduplicateAndSortIssues(messages.map(createIssueFromEsLintMessage));
}
function createIssuesFromEsLintReports(reports) {
    return createIssuesFromEsLintMessages(createFileAwareEsLintMessagesFromEsLintReports(reports));
}
exports.createIssuesFromEsLintReports = createIssuesFromEsLintReports;
//# sourceMappingURL=EsLintIssueFactory.js.map