const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../content.js"), "utf8");
function between(start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `缺少 ${start}`);
  return source.slice(first, last);
}

const personalControls = [
  { basic: "fullName", hints: "姓名" },
  { basic: "documentNumber", hints: "身份证号", disabled: true },
  { basic: "phone", hints: "手机号", disabled: true },
  { basic: "email", hints: "个人邮箱" },
  { basic: "ethnicity", hints: "民族" },
  { basic: "maritalStatus", hints: "婚姻状况" },
  { basic: "politicalStatus", record: "politicalStatus", recordSection: "family", hints: "政治面貌" },
  { basic: null, record: "educationLevel", recordSection: "education", hints: "最高学历" },
  { basic: null, record: "location", recordSection: "education", hints: "高考所在地" },
];
const educationControls = [
  { record: "school", hints: "学校" },
  { record: "major", hints: "专业" },
  { record: "startDate", hints: "开始时间" },
  { record: "endDate", hints: "结束时间" },
];
const body = {};
const personalGroup = {
  parentElement: body,
  querySelectorAll: () => personalControls,
};
const educationGroup = {
  parentElement: body,
  querySelectorAll: () => educationControls,
};
for (const control of personalControls) {
  control.parentElement = personalGroup;
  control.closest = () => null;
}
for (const control of educationControls) {
  control.parentElement = educationGroup;
  control.closest = () => null;
}

const context = vm.createContext({
  document: { body },
  CONTROL_SELECTOR: "input",
  STRUCTURED_INFERENCE_PATTERNS: { education: /学校|学历|专业/ },
  classifyBasicField: (control) => control.basic || null,
  classifyStructuredField: (control, section) =>
    !control.recordSection || control.recordSection === section ? control.record || null : null,
  fieldHints: (control) => control.hints,
  isVisible: () => true,
  isProtectedField: () => false,
  isPresenceGateControl: () => false,
});
vm.runInContext(between("function isPersonalInformationGroup", "function confirmedStructuredSection"), context);
context.detectStructuredSection = () => "education";
context.STRUCTURED_SECTIONS = { education: {} };
vm.runInContext(between("function boundedStructuredContainer", "function collectStructuredDescriptors"), context);
vm.runInContext(between("function confirmedStructuredSection", "function classifyStructuredField"), context);

context.personalControls = personalControls;
context.educationControls = educationControls;
assert.equal(vm.runInContext("isPersonalInformationGroup(personalControls, 'education')", context), true);
context.personalWithoutDocument = personalControls.filter((control) => control.basic !== "documentNumber");
assert.equal(vm.runInContext("isPersonalInformationGroup(personalWithoutDocument, 'education')", context), true,
  "分离或隐藏证件号的招聘站点仍应把姓名、联系方式及其他字段认作基本资料");
assert.equal(vm.runInContext("isPersonalInformationGroup(educationControls, 'education')", context), false);

context.field = personalControls[0];
assert.equal(vm.runInContext("boundedStructuredContainer(field, 'education')", context), null);
assert.equal(vm.runInContext("isInsidePersonalInformationGroup(field, 'education')", context), true);
assert.equal(vm.runInContext("confirmedStructuredSection(field)", context), null,
  "个人信息控件不能因页面下方的教育标题而被排除在一键填写外");
context.field = personalControls[6];
assert.equal(vm.runInContext("isInsidePersonalInformationGroup(field, 'education')", context), true,
  "禁用的证件号和手机号仍应帮助识别基本资料区");
assert.equal(vm.runInContext("isInsidePersonalInformationGroup(field, 'family')", context), true,
  "基本资料中的政治面貌不应被当成家庭成员字段");

context.field = educationControls[0];
assert.equal(vm.runInContext("boundedStructuredContainer(field, 'education')", context), educationGroup);
assert.equal(vm.runInContext("isInsidePersonalInformationGroup(field, 'education')", context), false);
assert.equal(vm.runInContext("confirmedStructuredSection(field)", context), "education");

console.log("基本资料与教育经历区域边界测试通过");
