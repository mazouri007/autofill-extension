const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const optionsSource = fs.readFileSync(path.join(root, "options.js"), "utf8");
const optionsHtml = fs.readFileSync(path.join(root, "options.html"), "utf8");
const popupSource = fs.readFileSync(path.join(root, "popup.js"), "utf8");
const contentSource = fs.readFileSync(path.join(root, "content.js"), "utf8");
const { validateAiRequest, validateAiSectionRequest } = require("../background.js");

for (const token of [
  'data-section="practice"', 'data-panel="practice"',
  'data-add-record="extracurricularPractices"', 'data-record-list="extracurricularPractices"',
]) assert.ok(optionsHtml.includes(token), `资料页缺少 ${token}`);
assert.match(popupSource, /key: "extracurricularPractices", label: "校外实践"/);

const inert = { addEventListener() {} };
const options = vm.createContext({
  crypto: { randomUUID: () => "test-id" },
  document: { querySelector: () => inert, querySelectorAll: () => [], addEventListener() {} },
  window: { addEventListener() {} },
  chrome: { storage: { local: { get: () => new Promise(() => {}) } } },
});
vm.runInContext(optionsSource, options);
const normalized = vm.runInContext(`normalizeResumeData({
  educations: [{ id: "old", school: "测试大学", educationLevel: "本科", startDate: "2021-09", endDate: "2025-06" }],
  extracurricularPractices: [{ id: "practice", organization: "测试单位", mainContent: "社区服务", startDate: "2024-07", endDate: "2024-08" }],
})`, options);
assert.equal(normalized.educations[0].school, "测试大学");
for (const key of ["studyDuration", "gpa", "overseasEducation", "advisor", "laboratory"]) {
  assert.equal(normalized.educations[0][key], "");
}
assert.equal(normalized.extracurricularPractices[0].startDate, "2024-07-01");
assert.equal(normalized.extracurricularPractices[0].endDate, "2024-08-31");
assert.equal(normalized.extracurricularPractices[0].mainContent, "社区服务");
assert.equal(vm.runInContext("blankResumeData().extracurricularPractices.length", options), 0);
assert.equal(vm.runInContext("RECORD_TYPES.educations.fields.find(field => field.key === 'overseasEducation').type", options), "select");

const start = contentSource.indexOf("const STRUCTURED_SECTIONS");
const end = contentSource.indexOf("const EDUCATION_LEVEL_ALIASES", start);
const classifyStart = contentSource.indexOf("function classifyStructuredField");
const classifyEnd = contentSource.indexOf("function isVisible", classifyStart);
assert.ok(start >= 0 && end > start && classifyStart >= 0 && classifyEnd > classifyStart);
const content = vm.createContext({ fieldHints: (element) => element.label });
vm.runInContext(contentSource.slice(start, end), content);
vm.runInContext(contentSource.slice(classifyStart, classifyEnd), content);

for (const [label, key] of [
  ["学制", "studyDuration"], ["平均学分绩点", "gpa"],
  ["是否海外教育经历", "overseasEducation"], ["海外学历", "overseasEducation"],
  ["导师", "advisor"], ["实验室", "laboratory"],
]) {
  content.element = { label };
  assert.equal(vm.runInContext("classifyStructuredField(element, 'education')", content), key, label);
}
for (const [label, key] of [
  ["开始日期", "startDate"], ["结束日期", "endDate"],
  ["实践单位或部门", "organization"], ["主要内容", "mainContent"],
]) {
  content.element = { label };
  assert.equal(vm.runInContext("classifyStructuredField(element, 'practice')", content), key, label);
}
assert.equal(vm.runInContext("STRUCTURED_SECTIONS.practice.sectionPattern.test('社会实践经历')", content), true);
assert.equal(vm.runInContext("STRUCTURED_SECTIONS.practice.sectionPattern.test('项目实践经历')", content), false);
assert.equal(vm.runInContext("STRUCTURED_SECTIONS.practice.recordsKey", content), "extracurricularPractices");

const containerStart = contentSource.indexOf("function boundedStructuredContainer");
const containerEnd = contentSource.indexOf("function collectStructuredDescriptors", containerStart);
const controls = ["开始日期", "结束日期", "单位或部门", "主要内容"].map((label) => ({
  label, disabled: false, closest: () => null,
}));
const body = {};
const form = {
  parentElement: body,
  querySelectorAll: () => controls,
  matches: () => false,
  querySelector: () => null,
};
for (const control of controls) control.parentElement = form;
content.document = { body };
content.CONTROL_SELECTOR = "input, textarea";
content.isVisible = () => true;
content.isProtectedField = () => false;
content.isPresenceGateControl = () => false;
content.isPersonalInformationGroup = () => false;
content.form = form;
content.control = controls[0];
vm.runInContext(contentSource.slice(containerStart, containerEnd), content);
assert.equal(vm.runInContext("boundedStructuredContainer(control, 'practice')", content), form);

assert.equal(validateAiRequest({ section: "practice", fields: [
  { id: "f0", label: "实践单位", type: "text", options: [] },
], sources: [{ key: "organization", label: "实践单位或部门", keywords: "" }] }), true);
assert.equal(validateAiSectionRequest({ section: "practice", groups: [
  { id: "g0", title: "校外实践", fields: [
    { label: "实践单位", type: "text" }, { label: "主要内容", type: "textarea" },
  ] },
] }), true);

console.log("校外实践与教育新增字段测试通过");
