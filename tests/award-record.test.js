const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../content.js"), "utf8");
const optionsHtml = fs.readFileSync(path.join(__dirname, "../options.html"), "utf8");
const popupSource = fs.readFileSync(path.join(__dirname, "../popup.js"), "utf8");
assert.match(optionsHtml, /data-section="award"/);
assert.match(optionsHtml, /data-panel="award"/);
assert.match(optionsHtml, /data-add-record="awards"/);
assert.match(popupSource, /key: "awards", label: "奖励信息"/);
const start = source.indexOf("const STRUCTURED_SECTIONS");
const end = source.indexOf("const EDUCATION_LEVEL_ALIASES", start);
assert.ok(start >= 0 && end > start);
const context = vm.createContext({ fieldHints: (element) => element.label });
vm.runInContext(source.slice(start, end), context);
const classifyStart = source.indexOf("function classifyStructuredField");
const classifyEnd = source.indexOf("function isVisible", classifyStart);
assert.ok(classifyStart >= 0 && classifyEnd > classifyStart);
vm.runInContext(source.slice(classifyStart, classifyEnd), context);

for (const [label, expected] of [
  ["奖励时间", "awardDate"],
  ["获奖日期", "awardDate"],
  ["奖励级别", "awardLevel"],
  ["奖励名称", "awardName"],
  ["说明", "description"],
]) {
  context.element = { label };
  assert.equal(vm.runInContext("classifyStructuredField(element, 'award')", context), expected);
}
context.element = { label: "是否获得过奖学金" };
assert.equal(vm.runInContext("classifyStructuredField(element, 'award')", context), null);
assert.equal(vm.runInContext("STRUCTURED_SECTIONS.award.recordsKey", context), "awards");
assert.equal(vm.runInContext("STRUCTURED_SECTIONS.award.sectionPattern.test('奖励信息')", context), true);

const dateStart = source.indexOf("function dateSourceFromText");
const dateEnd = source.indexOf("function commonElementAncestor", dateStart);
assert.ok(dateStart >= 0 && dateEnd > dateStart);
context.compactText = (value) => String(value || "").replace(/\s+/g, "");
vm.runInContext(source.slice(dateStart, dateEnd), context);
assert.equal(vm.runInContext("dateSourceFromText('奖励时间', 'award')", context), "awardDate");

const fillStart = source.indexOf("async function fillCompoundDateFields");
const fillEnd = source.indexOf("async function fillKnownStructuredFields", fillStart);
assert.ok(fillStart >= 0 && fillEnd > fillStart);
const dateControl = {
  isConnected: true, disabled: false, dataset: {}, label: "奖励时间",
  compareDocumentPosition: () => 0,
};
const filled = [];
const fillContext = vm.createContext({
  Node: { DOCUMENT_POSITION_FOLLOWING: 4 },
  isVisible: () => true,
  datePartForControl: () => null,
  isWholeDateControl: () => true,
  compoundContextText: () => "奖励信息",
  dateSourceFromText: (_text, section) => section === "award" ? "awardDate" : null,
  classifyStructuredField: () => "awardDate",
  fieldHints: (element) => element.label,
  aiValuesEquivalent: (element, value) => element.value === value,
  readControlValue: (element) => element.value || "",
  isUsable: () => true,
  setControlValue: async (element, value, key) => {
    element.value = value;
    filled.push([key, value]);
    return true;
  },
  wait: async () => {},
  dateControl,
});
vm.runInContext(source.slice(fillStart, fillEnd), fillContext);
(async () => {
  const report = { filled: 0, skipped: 0, unchanged: 0, failed: 0, sections: { award: 0 } };
  fillContext.report = report;
  await vm.runInContext("fillCompoundDateFields('award', { awardDate: '2024-09-24' }, [dateControl], false, report)", fillContext);
  assert.deepEqual(filled, [["awardDate", "2024-09-24"]]);
  assert.equal(report.sections.award, 1);
  console.log("奖励信息模块字段识别与日期填写测试通过");
})().catch((error) => { console.error(error); process.exitCode = 1; });
