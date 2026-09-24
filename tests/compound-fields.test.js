const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../content.js"), "utf8");
function sourceBetween(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(start, -1, `缺少 ${startMarker}`);
  assert.notEqual(end, -1, `缺少 ${endMarker}`);
  return source.slice(start, end);
}

class FakeSelect {}
const context = vm.createContext({
  HTMLSelectElement: FakeSelect,
  normalizeMatchText: (value) => String(value || "").toLowerCase().replace(/\s+/g, ""),
  compactText: (value) => String(value || "").toLowerCase().replace(/\s+/g, ""),
  fieldHints: (element) => element.hints || "",
  controlAtomicHints: (element) => element.atomicHints || [],
  optionNumbers: (element) => element.numbers || [],
  isVisible: () => true,
  aliasesFor: (value) => [value],
  isInteractiveDateControl: (element) => Boolean(element.interactive),
  dateFormatHints: (element) => element.dateHints || element.hints || "",
  adjacentDateActivationTargets: (element) => element.adjacent ? [{}] : [],
});
vm.runInContext([
  sourceBetween("function splitLocationValue", "function shortLocationPart"),
  sourceBetween("function locationLevelForField", "function cascaderWrapper"),
  sourceBetween("function numericOptionValue", "function optionScore"),
  sourceBetween("function optionScore", "function setSelectValue"),
  sourceBetween("function datePartForControl", "function dateSourceFromText"),
  sourceBetween("function dateParts(value)", "function numericControlValue"),
  sourceBetween("function isWholeDateControl", "async function fillCompoundDateFields"),
].join("\n"), context);

assert.equal(vm.runInContext(`JSON.stringify(splitLocationValue("山西省晋中市平遥县"))`, context),
  JSON.stringify(["山西省", "晋中市", "平遥县"]));
assert.equal(vm.runInContext(`optionScore("09", "9")`, context), 100);
assert.equal(vm.runInContext(`optionScore("09月", "9")`, context), 100);
assert.equal(vm.runInContext(`optionScore("09月份", "9")`, context), 100);
assert.equal(vm.runInContext(`optionScore("19", "9")`, context), 0);
assert.equal(vm.runInContext(`numericDateOptionValue({ value: "8", textContent: "09月" })`, context), 9);
assert.equal(vm.runInContext(`numericDateOptionValue({ value: "9", textContent: "10月" })`, context), 10);
assert.equal(vm.runInContext(`locationLevelForField({ atomicHints: ["省"] })`, context), 0);
assert.equal(vm.runInContext(`locationLevelForField({ atomicHints: ["市"] })`, context), 1);
assert.equal(vm.runInContext(`locationLevelForField({ atomicHints: ["区县"] })`, context), 2);

function dateControl(atomicHints, hints = "", numbers = []) {
  return { atomicHints, hints, numbers, querySelector: () => null, getAttribute: () => "" };
}
context.control = dateControl(["年"]);
assert.equal(vm.runInContext("datePartForControl(control)", context), "year");
context.control = dateControl(["月"]);
assert.equal(vm.runInContext("datePartForControl(control)", context), "month");
context.control = dateControl(["日"]);
assert.equal(vm.runInContext("datePartForControl(control)", context), "day");
context.control = dateControl([], "开始日期");
assert.equal(vm.runInContext("datePartForControl(control)", context), null);
context.control = dateControl([], "结束日期");
assert.equal(vm.runInContext("datePartForControl(control)", context), null);
context.control = dateControl([], "请选择日期 起始日期");
assert.equal(vm.runInContext("datePartForControl(control)", context), null);
context.control = dateControl([], "请选择日期 结束日期");
assert.equal(vm.runInContext("datePartForControl(control)", context), null);
context.control = dateControl([], "起止时间", [2025, 2026, 2027]);
assert.equal(vm.runInContext("datePartForControl(control)", context), "year");
context.control = dateControl([], "起止时间", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
assert.equal(vm.runInContext("datePartForControl(control)", context), "month");
context.control = dateControl([], "专业排名", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
assert.equal(vm.runInContext("datePartForControl(control)", context), null);
context.control = { hints: "起止时间", atomicHints: [], numbers: [], querySelector: () => null,
  getAttribute: (name) => name === "type" ? "date" : "" };
assert.equal(vm.runInContext("isWholeDateControl(control)", context), true);

// A closing start-date popup may coexist with the open end-date popup. The
// calendar lookup must stay inside the input's own form-item before falling back.
const startCalendar = { name: "start" };
const endCalendar = { name: "end" };
const startParent = { parentElement: null, querySelectorAll: () => [startCalendar] };
const endParent = { parentElement: null, querySelectorAll: () => [endCalendar] };
const pageBody = { querySelectorAll: () => [startCalendar, endCalendar] };
startParent.parentElement = pageBody;
endParent.parentElement = pageBody;
const calendarContext = vm.createContext({
  document: { body: pageBody, querySelectorAll: () => [startCalendar, endCalendar] },
  isVisible: () => true,
  startInput: { closest: () => ({ parentElement: startParent }) },
  endInput: { closest: () => ({ parentElement: endParent }) },
});
vm.runInContext(sourceBetween("function visibleAntCalendarFor", "function visibleElementCalendar"), calendarContext);
assert.equal(vm.runInContext("visibleAntCalendarFor(startInput)", calendarContext), startCalendar);
assert.equal(vm.runInContext("visibleAntCalendarFor(endInput)", calendarContext), endCalendar);
calendarContext.unscopedInput = { closest: () => ({ parentElement: {
  parentElement: pageBody, querySelectorAll: () => [],
} }) };
assert.equal(vm.runInContext("visibleAntCalendarFor(unscopedInput)", calendarContext), null);
context.control = { hints: "", atomicHints: [], numbers: [], readOnly: true, adjacent: true,
  querySelector: () => null, getAttribute: () => "" };
assert.equal(vm.runInContext("isWholeDateControl(control)", context), true);

assert.equal(vm.runInContext(`JSON.stringify(dateParts("2026-09-21"))`, context),
  JSON.stringify({ year: 2026, month: 9, day: 21 }));
assert.equal(vm.runInContext(`JSON.stringify(dateParts("2026-09"))`, context),
  JSON.stringify({ year: 2026, month: 9, day: null }));

const currentViewSource = sourceBetween("const CURRENT_VIEW_ONLY_SECTIONS", "function targetMatchesGroup");
const currentViewContext = vm.createContext({
  isInViewport: (element) => Boolean(element.inViewport),
});
vm.runInContext(currentViewSource, currentViewContext);
currentViewContext.groups = [
  { fields: [{ element: { inViewport: false } }] },
  { fields: [{ element: { inViewport: true } }, { element: { inViewport: false } }] },
];
assert.equal(vm.runInContext(`currentViewGroups("work", groups).length`, currentViewContext), 1);
assert.equal(vm.runInContext(`currentViewGroups("education", groups).length`, currentViewContext), 1);
assert.equal(vm.runInContext(`currentViewGroups("project", groups).length`, currentViewContext), 1);
assert.equal(vm.runInContext(`currentViewGroups("family", groups).length`, currentViewContext), 2);

const manualCandidateSource = sourceBetween("function manualCandidateGroups", "async function fillSelectedRecord");
assert.match(manualCandidateSource, /CURRENT_VIEW_ONLY_SECTIONS\.has\(section\) \? \[\]/);
assert.doesNotMatch(manualCandidateSource, /viewportGroups\.length \? viewportGroups : semanticGroups\.length/);

const fixture = fs.readFileSync(path.join(__dirname, "compound-fields.html"), "utf8");
for (const id of ["startYear", "startMonth", "endYear", "endMonth", "projectStart", "projectEnd",
  "nativeProvince", "nativeCity", "birthProvince"]) {
  assert.match(fixture, new RegExp(`id=["']${id}["']`));
}

console.log("复合字段拆分与精度适配测试通过");
