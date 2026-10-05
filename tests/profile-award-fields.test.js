const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const content = fs.readFileSync(path.join(root, "content.js"), "utf8");
const optionsSource = fs.readFileSync(path.join(root, "options.js"), "utf8");
const optionsHtml = fs.readFileSync(path.join(root, "options.html"), "utf8");
const popup = fs.readFileSync(path.join(root, "popup.js"), "utf8");
function between(source, start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, start);
  return source.slice(first, last);
}

const profileInputs = [
  { dataset: { profileKey: "fullName" }, value: "测试资料", addEventListener() {} },
  { dataset: { profileKey: "graduationDate" }, value: "2027-06-30", addEventListener() {} },
];
const inert = { addEventListener() {} };
const options = vm.createContext({
  crypto: { randomUUID: () => "test-id" },
  document: {
    querySelector: () => inert,
    querySelectorAll: (selector) => selector === "[data-profile-key]" ? profileInputs : [],
    addEventListener() {},
  },
  window: { addEventListener() {} },
  chrome: { storage: { local: { get: () => new Promise(() => {}) } } },
});
vm.runInContext(optionsSource, options);
assert.match(optionsHtml, /<span>毕业时间<\/span><input data-profile-key="graduationDate" type="date"/);
assert.equal(vm.runInContext("readProfile().graduationDate", options), "2027-06-30");
assert.equal(vm.runInContext("PROFILE_GROUPS.basic.includes('graduationDate')", options), true);
assert.equal(vm.runInContext("blankRecord('awards').awardingOrganization", options), "");
assert.equal(vm.runInContext("RECORD_TYPES.awards.fields.find(f => f.key === 'awardingOrganization').label", options), "授予机构（颁发单位）");
const oldAwards = vm.runInContext(`normalizeResumeData({awards:[{
  id:'existing', awardName:'优秀毕业生', awardDate:'2024-06-30', description:'原有说明中可能包含单位名称'
}]}).awards[0]`, options);
assert.equal(oldAwards.awardingOrganization, "", "不能从旧说明中猜测颁发单位");
assert.equal(oldAwards.description, "原有说明中可能包含单位名称");
assert.equal(oldAwards.awardName, "优秀毕业生");
assert.equal(oldAwards.awardDate, "2024-06-30");
assert.equal(vm.runInContext("normalizeRecord('awards', {awardingOrganization:' 教育部 '}).awardingOrganization", options), "教育部");

const popupContext = vm.createContext({});
vm.runInContext(between(popup, "const PROFILE_KEYS", "const fillButton"), popupContext);
vm.runInContext(between(popup, "function countBasicItems", "async function sendMessageWithRecovery"), popupContext);
assert.equal(vm.runInContext("countBasicItems({graduationDate:'2027-06-30'}, [])", popupContext), 1,
  "只保存毕业时间时也必须允许一键填写");

class Input {}
const engine = vm.createContext({
  HTMLInputElement: Input, HTMLSelectElement: class {},
  fieldHints: (field) => field.label || "",
  textOfLabel: (field) => field.label || "",
  isProtectedField: () => false, autocompleteToken: () => null,
  compactText: (text) => String(text).replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase(),
});
vm.runInContext(between(content, "const FIELD_RULES", "const BLOCKED_AUTOCOMPLETE"), engine);
engine.CUSTOM_ONLY_HINTS = /紧急联系人关系/;
engine.DECLARATION_HINTS = /本人承诺/;
vm.runInContext(between(content, "function classifyBasicField", "function sectionFromText"), engine);
vm.runInContext(between(content, "function classifyStructuredField", "function isVisible"), engine);
for (const label of ["毕业时间", "预计毕业日期", "毕业年月", "毕 业 日 期 *", "graduationDate", "expected_graduation_date", "Date of Graduation"]) {
  engine.field = { label, getAttribute: () => "text" };
  assert.equal(vm.runInContext("classifyBasicField(field)", engine), "graduationDate", label);
}
for (const label of ["授予机构", "颁发单位", "颁发机构", "奖项颁发单位", "授奖单位", "Awarding Organization", "Issuing Authority", "Awarded by"]) {
  engine.field = { label };
  assert.equal(vm.runInContext("classifyStructuredField(field, 'award')", engine), "awardingOrganization", label);
}
engine.field = { label: "毕业时间" };
assert.equal(vm.runInContext("classifyStructuredField(field, 'education')", engine), "endDate",
  "教育经历仍使用自身记录的 endDate，不切换成基础毕业时间");
vm.runInContext(between(content, "const AI_SOURCE_LABELS", "let lastUserTarget"), engine);
assert.equal(vm.runInContext("AI_SOURCE_LABELS.basic.graduationDate", engine), "毕业时间");
assert.equal(vm.runInContext("AI_SOURCE_LABELS.award.awardingOrganization", engine), "授予机构或颁发单位");

engine.dateFormatHints = (field) => field.hints || "毕业时间";
vm.runInContext(between(content, "function targetDatePrecision", "function visibleAntCalendarFor"), engine);
function field(type = "text", hints = "毕业时间") {
  return Object.assign(new Input(), {
    label: "毕业时间", hints, maxLength: -1, type, value: "", dataset: {},
    getAttribute: (name) => name === "type" ? type : "",
    closest: () => null,
  });
}
for (const [target, expected] of [
  [field("date"), "2027-06-30"], [field("month"), "2027-06"],
  [field("text", "YYYY-MM"), "2027-06"], [field("text", "YYYY/MM/DD"), "2027/06/30"],
]) {
  engine.field = target;
  assert.equal(vm.runInContext("formatDateValue(field, '2027-06-30', 'graduationDate')", engine), expected);
}
engine.field = field("date");
assert.equal(vm.runInContext("formatDateValue(field, '2024-02', 'graduationDate')", engine), "2024-02-29");

engine.LOCATION_PROFILE_KEYS = new Set();
engine.elementDateWrapper = () => null;
engine.isInteractiveDateControl = () => false;
engine.isCustomControl = () => false;
engine.setNativeValue = (target, value) => { target.value = value; };
const adapterCalls = [];
for (const adapter of ["setPhoenixDatePickerValue", "setElementDatePickerValue", "setAntDatePickerValue", "setGenericDatePickerValue"]) {
  engine[adapter] = async (_target, value) => { adapterCalls.push([adapter, value]); return true; };
}
vm.runInContext(between(content, "async function setControlValue", "function optionNumbers"), engine);

(async () => {
  engine.field = field("text", "YYYY-MM");
  assert.equal(await vm.runInContext("setControlValue(field, '2027-06-30', 'graduationDate')", engine), true);
  assert.equal(engine.field.value, "2027-06", "普通年月文本框应直接填入截取后的年月");
  for (const [widget, adapter] of [
    [".phoenix-select", "setPhoenixDatePickerValue"], [".ant-picker", "setAntDatePickerValue"],
    [".el-date-editor", "setElementDatePickerValue"], ["", "setGenericDatePickerValue"],
  ]) {
    const input = field();
    input.readOnly = true;
    input.closest = (selector) => widget && selector.split(/\s*,\s*/).includes(widget) ? {} : null;
    engine.elementDateWrapper = () => widget === ".el-date-editor" ? {} : null;
    engine.field = input;
    assert.equal(await vm.runInContext("setControlValue(field, '2027-06-30', 'graduationDate')", engine), true);
    assert.deepEqual(adapterCalls.at(-1), [adapter, "2027-06-30"], "新增毕业时间应复用原有日期控件适配器");
  }

  const basicDate = field();
  const educationDate = field();
  educationDate.section = "education";
  engine.collectControls = () => [basicDate, educationDate];
  engine.confirmedStructuredSection = (input) => input.section || null;
  engine.isUsable = () => true;
  engine.customFieldValue = () => "";
  engine.fillCompoundBasicLocations = async () => {};
  const written = [];
  engine.setControlValue = async (input, value, key) => { written.push([input, value, key]); return true; };
  vm.runInContext(between(content, "function profileValue", "function locationProfileKeyFromText"), engine);
  vm.runInContext(between(content, "async function fillBasicFields", "async function fillPage("), engine);
  engine.report = { filled: 0, failed: 0, sections: { basic: 0 } };
  await vm.runInContext("fillBasicFields({graduationDate:'2027-06-30'}, [], false, {filledElements:new WeakSet()}, report)", engine);
  assert.deepEqual(written, [[basicDate, "2027-06-30", "graduationDate"]], "一键填写毕业时间不能侵入教育记录区域");
  console.log("奖励授予机构保存兼容、基础毕业时间识别与日期精度/区域隔离测试通过");
})().catch((error) => { console.error(error); process.exitCode = 1; });
