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

// The real editor has many UL rows, including a date + degree row, followed
// by certificate/attachment controls in the same form. Rows are not records.
const body = {};
const form = {
  id: "resumeEducation", parentElement: body,
  querySelector(selector) { return controls.find((control) => `#${control.id}` === selector) || null; },
  querySelectorAll() { return controls; },
};
const controls = [
  ["schoolCode", "毕业院校", "school"],
  ["schoolChinaName", "院校中文名称", "school"],
  ["educationType", "学历形式", "educationType"],
  ["educationStartDate", "入学时间", "startDate"],
  ["xw", "degree 学位", "degree"],
  ["educationEndDate", "毕业时间", "endDate"],
  ["degreeNumber", "degreeNumber 学位证书编号", null],
  ["xl", "学历", "educationLevel"],
  ["educationNumber", "学历证书编号", null],
  ["major", "专业", "major"],
  ["majorDirection", "专业方向", null],
  ["gradePointType", "绩点制", null],
  ["gradePoint", "学分绩点", "gpa"],
  ["otherDesc", "其他描述", "description"],
  ["transcriptDescribe", "描述", null],
  ["maxEdu", "最高学历", null],
  ["firstEdu", "第一学历", null],
].map(([id, hints, expected]) => ({
  id, hints, expected, disabled: false, getAttribute: () => null,
  closest: (selector) => selector === "form#resumeEducation" ? form : null,
  parentElement: { parentElement: form, querySelectorAll: () => [] },
}));
const context = vm.createContext({
  location: { hostname: "zhaopin.cnpc.com.cn" }, document: { body },
  fieldHints: (control) => control.hints, HTMLInputElement: class {},
  BLOCKED_AUTOCOMPLETE: /password/, CREDENTIAL_HINTS: /password/,
  PAYMENT_HINTS: /payment/, DOCUMENT_HINTS: /passport/,
  isVisible: () => true, isPresenceGateControl: () => false,
  isPersonalInformationGroup: () => false, CONTROL_SELECTOR: "input,select,textarea",
  collectControls: () => controls,
  currentViewGroups: (_section, groups) => groups,
});
vm.runInContext(between("const STRUCTURED_SECTIONS", "const EDUCATION_LEVEL_ALIASES"), context);
vm.runInContext(between("function cnpcEducationForm", "function isVisible"), context);
vm.runInContext(between("function isProtectedField", "function classifyBasicField"), context);
vm.runInContext(between("function boundedStructuredContainer", "function collectStructuredDescriptors"), context);
for (const control of controls) {
  context.control = control;
  assert.equal(vm.runInContext("classifyStructuredField(control, 'education')", context), control.expected,
    `中石油字段 ${control.id} 不能与声明/证书/附件混淆`);
  assert.equal(vm.runInContext("isProtectedField(control)", context), control.expected === null,
    "排除项必须同时阻止 AI 回退写入");
  if (control.expected) assert.equal(vm.runInContext("boundedStructuredContainer(control, 'education')", context), form,
    "日期、学位、学历和院校必须属于同一教育记录，而不是各自的 UL 行");
}
const groups = vm.runInContext("cnpcEducationGroups()", context);
assert.equal(groups.length, 1, "备选院校名称控件不能把同一表单拆成两条教育经历");
assert.ok(groups[0].fields.some(({ key }) => key === "startDate"));
assert.ok(groups[0].fields.some(({ key }) => key === "endDate"));
assert.equal(groups[0].fields.some(({ element }) => element.id === "degreeNumber"), false);
context.control = { id: "educationStartDate", hints: "开始时间", closest: () => null, getAttribute: () => null };
assert.equal(vm.runInContext("cnpcEducationForm(control)", context), null,
  "同名控件在实习/其他表单中不应走教育适配");
context.location.hostname = "job.bankcomm.com";
context.control = controls.find((control) => control.id === "educationStartDate");
assert.equal(vm.runInContext("cnpcEducationForm(control)", context), null);
assert.equal(vm.runInContext("classifyStructuredField(control, 'education')", context), "startDate",
  "其他网站必须继续走原有日期分类");
assert.equal(vm.runInContext("isProtectedField(control)", context), false,
  "中石油保护范围不能影响其他网站");

function dateFixture({ disabledMonth = 0, disabledDay = 0, noCommit = false, stuckHeader = false,
  rejectOnBlur = false, monthCount = 12 } = {}) {
  const log = [];
  let opened = false;
  let activeView = "days";
  let shownYear = 2026;
  let selectedYear = 2026;
  let selectedMonth = 9;
  let modelDate = "";
  let activations = 0;
  const cell = (text, className, clicked) => ({
    textContent: String(text), className, getAttribute: () => null,
    dispatchEvent() {}, click() { log.push(`${className}:${text}`); clicked(); },
  });
  const rect = { left: 100, right: 400, top: 100, bottom: 140, width: 300 };
  const dateInput = {
    id: "educationStartDate", value: "", readOnly: true,
    closest: (selector) => selector === "form#resumeEducation" ? dateForm : null,
    dispatchEvent() {}, getBoundingClientRect: () => rect, scrollIntoView() {}, focus() {},
    click() { opened = true; activeView = "days"; shownYear = 2026; activations += 1; },
    blur() { if (rejectOnBlur) this.value = ""; },
  };
  const dateForm = {
    querySelector: () => dateInput,
    dispatchEvent() { opened = false; },
  };
  const views = Object.fromEntries(["days", "months", "years"].map((unit) => [unit, {
    unit,
    querySelector(selector) {
      if (selector === "th.switch") return cell("header", "switch", () => {
        if (!stuckHeader) activeView = unit === "days" ? "months" : "years";
      });
      if (["th.prev", "th.next"].includes(selector)) return cell(selector, "nav", () => {
        shownYear += selector === "th.prev" ? -10 : 10;
      });
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "span.year") {
        const decade = Math.floor(shownYear / 10) * 10;
        return Array.from({ length: 12 }, (_, index) => {
          const year = decade - 1 + index;
          return cell(year, "year", () => { selectedYear = year; activeView = "months"; });
        });
      }
      if (selector === "span.month") return Array.from({ length: monthCount }, (_, index) =>
        cell(`${index + 1}月`, index + 1 === disabledMonth ? "month disabled" : "month", () => {
          selectedMonth = index + 1; activeView = "days";
        }));
      if (selector === "td.day") return [
        cell(1, "day old", () => { throw new Error("不能选择上月同名日期"); }),
        ...Array.from({ length: 31 }, (_, index) => cell(index + 1,
          index + 1 === disabledDay ? "day disabled" : "day", () => {
            if (noCommit) return;
            modelDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`;
            dateInput.value = modelDate;
          })),
      ];
      return [];
    },
  }]));
  const panel = {
    querySelector(selector) {
      if (selector === ".datetimepicker-days th.switch") return views.days.querySelector("th.switch");
      return views[selector.replace(".datetimepicker-", "")] || null;
    },
    getBoundingClientRect: () => ({ left: 100, right: 320, top: 140, bottom: 400, width: 220 }),
  };
  const sandbox = vm.createContext({
    location: { hostname: "zhaopin.cnpc.com.cn" }, dateInput,
    document: { querySelectorAll: () => opened ? [panel] : [] },
    MouseEvent: class {}, wait: async () => {},
    isVisible: (element) => element?.unit ? opened && activeView === element.unit : Boolean(element),
    readControlValue: (element) => element.value,
  });
  vm.runInContext(between("function cnpcEducationForm", "function classifyStructuredField"), sandbox);
  vm.runInContext(between("function datePartsMatch", "function elementDateNavigationButton"), sandbox);
  vm.runInContext(between("function cnpcDateCalendarFor", "async function setGenericDatePickerValue"), sandbox);
  return { sandbox, dateInput, log, modelDate: () => modelDate, activations: () => activations };
}

async function testDates() {
  const fixture = dateFixture({ disabledMonth: 1 });
  assert.equal(await vm.runInContext("setCnpcEducationDateValue(dateInput, '2018-09-01')", fixture.sandbox), true);
  assert.equal(fixture.modelDate(), "2018-09-01", "必须通过日历事件更新日期模型");
  assert.ok(fixture.log.some((entry) => entry.startsWith("nav:")), "旧教育日期需要跨十年导航");
  fixture.dateInput.id = "educationEndDate";
  assert.equal(await vm.runInContext("setCnpcEducationDateValue(dateInput, '2021-6-30')", fixture.sandbox), true);
  assert.equal(fixture.modelDate(), "2021-06-30");
  assert.equal(fixture.activations(), 2, "结束时间必须重新激活其自己的日历");
  assert.equal(await vm.runInContext("setCnpcEducationDateValue(dateInput, '2021-09-01')", fixture.sandbox), true);
  assert.equal(fixture.modelDate(), "2021-09-01", "09 和 9 必须选择同一月份");
  assert.equal(await vm.runInContext("setCnpcEducationDateValue(dateInput, '2021-9-1')", fixture.sandbox), true);
  assert.equal(fixture.modelDate(), "2021-09-01");
  const previousActivations = fixture.activations();
  for (const invalid of ["2021-02-30", "2021-13-01", "2021-00-01", "2021-09", "invalid"]) {
    fixture.sandbox.dateValue = invalid;
    assert.equal(await vm.runInContext("setCnpcEducationDateValue(dateInput, dateValue)", fixture.sandbox), false);
  }
  assert.equal(fixture.activations(), previousActivations, "无效日期不能操作日历或编造日值");
  fixture.sandbox.location.hostname = "job.bankcomm.com";
  assert.equal(await vm.runInContext("setCnpcEducationDateValue(dateInput, '2021-09-01')", fixture.sandbox), false);
  assert.equal(fixture.activations(), previousActivations, "其他站点不应走中石油的日期适配");
  assert.equal(await vm.runInContext("setBootstrapDatePickerValue(dateInput, '2022-09-24')", fixture.sandbox), true,
    "同型 Bootstrap 控件可通过公共导航提交，不依赖中石油域名");
  assert.equal(fixture.modelDate(), "2022-09-24");
  for (const configuration of [{ disabledMonth: 9 }, { disabledDay: 1 }, { noCommit: true },
    { stuckHeader: true }, { rejectOnBlur: true }, { monthCount: 11 }]) {
    const blocked = dateFixture(configuration);
    assert.equal(await vm.runInContext("setCnpcEducationDateValue(dateInput, '2021-09-01')", blocked.sandbox), false,
      `禁用、不完整或没有实际提交的控件不能报告成功：${JSON.stringify(configuration)}`);
  }
  const owner = dateFixture();
  owner.dateInput.click();
  owner.dateInput.getBoundingClientRect = () => ({ left: 800, right: 1100, top: 100, bottom: 140, width: 300 });
  assert.equal(vm.runInContext("cnpcDateCalendarFor(dateInput)", owner.sandbox), null,
    "不能将仍然打开的开始日历误用于另一列结束日期");
}

testDates().then(() => console.log("中石油教育边界、证书隔离和只读日期模型测试通过"))
  .catch((error) => { console.error(error); process.exitCode = 1; });
