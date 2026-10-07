const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../content.js"), "utf8");
function between(start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first);
  return source.slice(first, last);
}
const body = {};
const all = [];
function record(titleText, labels, sharedEditor = null) {
  const editor = sharedEditor || { titles: [], querySelectorAll() { return this.titles; } };
  const title = { textContent: titleText, closest: () => editor, querySelector: () => null };
  editor.titles.push(title);
  const container = {
    editor,
    matches: (selector) => selector === ".tableDiv > .mdf-table",
    closest: (selector) => selector === ".edit-resume-div" ? editor : null,
    controls: [], contains: (element) => container.controls.includes(element),
  };
  container.controls = labels.map((hints) => ({
    hints, isConnected: true, visible: true, viewport: true,
    closest: (selector) => selector === ".tableDiv > .mdf-table" ? container : null,
    compareDocumentPosition: () => 4,
    contains: () => false,
  }));
  all.push(...container.controls);
  return container;
}
const work = record("实习经历", ["企业名称", "开始时间", "结束时间", "职位名称", "工作描述"]);
const family = record("家庭关系", ["姓名", "* 关系", "工作单位", "亲属职务/岗位（含层级）"]);
const award = record("奖励荣誉", ["奖励名称", "获奖时间", "奖励级别", "颁发单位"]);
const basic = record("个人基本信息", ["姓名", "出生日期", "政治面貌", "户口所在地"]);
const context = vm.createContext({
  document: { body }, Node: { DOCUMENT_POSITION_FOLLOWING: 4 },
  location: { hostname: "test.invalid" }, CONTROL_SELECTOR: "input,select",
  fieldHints: (element) => element.hints,
  collectControls: (scope) => scope ? scope.controls : all,
  isVisible: (element) => element.visible, isProtectedField: () => false,
  isPresenceGateControl: () => false, isPersonalInformationGroup: () => false,
  datePartForControl: () => null, isInViewport: (element) => element.viewport,
  nearestRecordContainer: () => null,
});
vm.runInContext(between("const STRUCTURED_SECTIONS", "const EDUCATION_LEVEL_ALIASES"), context);
vm.runInContext(between("function sectionFromText", "function structuralText"), context);
vm.runInContext(between("function winTalentRecordContext", "function detectStructuredSection"), context);
vm.runInContext(between("function detectStructuredSection", "function isPersonalInformationGroup"), context);
vm.runInContext(between("function classifyStructuredField", "function bootstrapSelectParts"), context);
vm.runInContext(between("function boundedStructuredContainer", "function recordHasContent"), context);
vm.runInContext(between("const CURRENT_VIEW_ONLY_SECTIONS", "function isPresenceGateControl"), context);
vm.runInContext(between("function manualCandidateGroups", "async function fillSelectedRecord"), context);
context.work = work; context.family = family; context.award = award; context.basic = basic;
for (const [name, section, key] of [["work", "work", "company"], ["family", "family", "relativeName"], ["award", "award", "awardName"]]) {
  assert.equal(vm.runInContext(`detectStructuredSection(${name}.controls[0])`, context), section);
  assert.equal(vm.runInContext(`boundedStructuredContainer(${name}.controls[1], '${section}')`, context), context[name]);
  assert.equal(vm.runInContext(`classifyStructuredField(${name}.controls[0], '${section}')`, context), key);
  const groups = vm.runInContext(`manualCandidateGroups('${section}')`, context);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].container, context[name]);
  assert.equal(groups[0].fields.length, context[name].controls.length, "完整记录必须包含日期、身份及描述字段");
}
assert.equal(vm.runInContext("classifyStructuredField(family.controls[1], 'family')", context), "relationship");
context.telecomFlag = { hints: "是否在电信集团及下属单位工作" };
assert.equal(vm.runInContext("classifyStructuredField(telecomFlag, 'family')", context), null,
  "电信集团从业问题不能套用移动系统任职资料");
assert.ok(source.includes('section === "family" && mapping.sourceKey === "worksInSystem" && expected !== "worksInSystem"'),
  "AI 对另一家公司从业标记的映射必须人工确认");
assert.equal(vm.runInContext("boundedStructuredContainer(family.controls[0], 'work')", context), null,
  "家庭的工作单位不能被当作实习记录");
assert.equal(vm.runInContext("winTalentRecordContext(basic.controls[0])", context), null,
  "基本信息不能被记录适配器吞入");
work.controls.forEach((element) => { element.viewport = false; });
assert.equal(vm.runInContext("manualCandidateGroups('work').length", context), 0, "不填写屏幕外的实习记录");
work.controls.forEach((element) => { element.viewport = true; });
const secondWork = record("实习经历", ["企业名称", "开始时间", "结束时间", "职位名称", "工作描述"]);
context.secondWork = secondWork;
const candidates = vm.runInContext("manualCandidateGroups('work')", context);
assert.equal(candidates.length, 2, "两条同时显示的实习必须保留为两个目标");
context.lastUserTarget = secondWork.controls[0];
context.candidates = candidates;
assert.equal(vm.runInContext("candidates.filter(g => targetMatchesGroup(lastUserTarget,g)).length", context), 1);
assert.equal(vm.runInContext("candidates.find(g => targetMatchesGroup(lastUserTarget,g)).container", context), secondWork);
const secondFamily = record("* 家庭关系", ["姓名", "* 关系", "工作单位", "亲属职务/岗位（含层级）"], family.editor);
context.secondFamily = secondFamily;
context.lastUserTarget = secondFamily.controls[0];
assert.equal(vm.runInContext("winTalentRecordContext(secondFamily.controls[0]).record", context), secondFamily,
  "同一栏目中新增加的记录应共享栏目标题，但保留独立记录边界");
assert.equal(vm.runInContext("manualCandidateGroups('family').length", context), 2);
assert.equal(vm.runInContext("manualCandidateGroups('family').find(g => targetMatchesGroup(lastUserTarget,g)).container", context), secondFamily,
  "第二位成员必须按点击的新增表单填入，而不是覆盖第一位成员");
console.log("WinTalent 三类记录边界、企业/关系语义、完整字段及多记录隔离测试通过");
