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

function testEducationSemantics() {
  const context = vm.createContext({ fieldHints: (field) => field.label });
  vm.runInContext(between("const STRUCTURED_SECTIONS", "const EDUCATION_LEVEL_ALIASES"), context);
  vm.runInContext(between("function classifyStructuredField", "function isVisible"), context);
  for (const [label, key] of [
    ["学位", "degree"], ["年级排名", "classRanking"], ["学制", "studyDuration"],
    ["是否全日制", "fullTimeEducation"], ["是否主要学习经历", "primary"],
    ["学校所属国家", "schoolCountry"], ["受教育类型", "educationType"],
  ]) {
    context.field = { label };
    assert.equal(vm.runInContext("classifyStructuredField(field, 'education')", context), key, label);
  }
  context.HTMLSelectElement = class {};
  context.textOfLabel = () => "";
  vm.runInContext(between("function fieldHints", "function autocompleteToken"), context);
  context.field = {
    matches: (selector) => selector.includes(".el-select"),
    querySelector: () => ({ placeholder: "请选择年级排名", getAttribute: () => null }),
    getAttribute: () => null,
  };
  assert.equal(vm.runInContext("classifyStructuredField(field, 'education')", context), "classRanking",
    "Element 下拉框应读取内层输入框的占位文案");
  vm.runInContext(between("function valueForStructuredField", "function createReport"), context);
  context.record = {
    educationType: "全日制", overseasEducation: "否", location: "武汉市",
    degree: "硕士", classRanking: "前20%", studyDuration: "2年", primary: true,
  };
  assert.equal(vm.runInContext("valueForStructuredField('education', record, 'fullTimeEducation')", context), "全日制");
  assert.equal(vm.runInContext("valueForStructuredField('education', record, 'schoolCountry')", context), "中国");
  context.record = { overseasEducation: "是", location: "武汉市" };
  assert.equal(vm.runInContext("valueForStructuredField('education', record, 'schoolCountry')", context), "");
}

function testElementPlaceholderReading() {
  class Input {}
  const input = Object.assign(new Input(), { value: "", type: "text" });
  const wrapper = {
    textContent: "请选择您的学位",
    matches: (selector) => selector === ".el-select",
    closest: () => null,
    querySelector: () => input,
  };
  const context = vm.createContext({
    element: wrapper, HTMLInputElement: Input, HTMLSelectElement: class {},
  });
  vm.runInContext(between("function readControlValue", "function dispatchValueEvents"), context);
  assert.equal(vm.runInContext("readControlValue(element)", context), "",
    "Element 下拉框的占位文案不是已填写值");
  input.value = "硕士";
  assert.equal(vm.runInContext("readControlValue(element)", context), "硕士");
}

async function testDynamicEducationFields() {
  const first = { disabled: false };
  const later = { disabled: false };
  const container = { isConnected: true, contains: (element) => [first, later].includes(element) };
  let controls = [first];
  let passes = 0;
  const context = vm.createContext({
    container, first, wait: async () => { controls = [first, later]; },
    collectControls: () => controls, isVisible: () => true, isProtectedField: () => false,
    fillKnownStructuredFields: async (_section, _record, _controls, _overwrite, _report, alreadyHandled) => {
      assert.equal(alreadyHandled.has(first), true,
        "动态表单重扫不能再次操作已处理的日期或下拉控件");
      passes += 1;
      return { handled: new Set([later]), sourceKeys: new Set(["classRanking"]) };
    },
  });
  vm.runInContext(between("function refreshedRecordControls", "function profileValue"), context);
  context.known = { handled: new Set([first]), sourceKeys: new Set(["educationLevel"]) };
  await vm.runInContext("fillNewStructuredControls('education', {}, container, [first], false, {}, known)", context);
  assert.equal(passes, 1, "学历选中后新增的字段应在同条记录内补填一次");
  assert.equal(context.known.handled.has(later), true);
  assert.equal(context.known.sourceKeys.has("classRanking"), true);
}

async function testElementDate() {
  let year = 2023;
  let yearClicks = 0;
  let inputClicks = 0;
  const wrapper = { getBoundingClientRect: () => ({ left: 100, right: 400, top: 100, bottom: 140, width: 300 }) };
  const field = {
    value: "", focus() {}, blur() {}, dispatchEvent() {},
    click() { inputClicks += 1; },
  };
  const cell = { className: "available", textContent: "1" };
  const calendar = {
    getBoundingClientRect: () => ({ left: 100, right: 420, top: 150, bottom: 410, width: 320 }),
    querySelectorAll: () => [cell],
  };
  const otherCalendar = {
    getBoundingClientRect: () => ({ left: 800, right: 1120, top: 150, bottom: 410, width: 320 }),
  };
  const context = vm.createContext({
    field, wrapper, calendar, otherCalendar,
    location: { hostname: "example.test" },
    MouseEvent: class {}, wait: async () => {},
    elementDateWrapper: () => wrapper,
    visibleElementCalendar: () => calendar,
    exactElementDateCell: () => null,
    displayedElementDate: () => ({ year, month: 9 }),
    elementDateNavigationButton: (_calendar, direction, unit) => ({
      click() {
        assert.equal(unit, "year");
        assert.equal(direction, "next");
        yearClicks += 1;
        // A redraw can swallow a click; the next click must be based on the
        // displayed year rather than an assumed number of successful moves.
        if (yearClicks > 1) year += 1;
      },
    }),
    isVisible: () => true,
    clickElementDateCell: () => { field.value = "2025-09-01"; return true; },
    datePartsMatch: (input, y, m, d) => input.value ===
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    directDateInputFallback: () => false,
  });
  vm.runInContext(between("function elementCalendarNearControl", "function datePartsMatch"), context);
  vm.runInContext(between("async function setElementDatePickerValue", "async function setAntDatePickerValue"), context);
  assert.equal(vm.runInContext("elementCalendarNearControl(calendar, field)", context), true);
  assert.equal(vm.runInContext("elementCalendarNearControl(otherCalendar, field)", context), false);
  assert.equal(await vm.runInContext("setElementDatePickerValue(field, '2025-09-01')", context), true);
  assert.equal(inputClicks, 0, "已打开的目标日历不应被第二次点击关闭");
  assert.equal(year, 2025);
  assert.equal(yearClicks, 3, "被动画吞掉的一次导航应安全重试");

  let visible = false;
  field.value = "";
  field.focus = () => { visible = true; };
  context.visibleElementCalendar = () => visible ? calendar : null;
  assert.equal(await vm.runInContext("setElementDatePickerValue(field, '2025-09-01')", context), true);
  assert.equal(inputClicks, 0, "focus 已打开日历时也不能补一次会关闭日历的 click");

  let checks = 0;
  visible = false;
  field.value = "";
  field.focus = () => {};
  context.visibleElementCalendar = () => ++checks >= 5 ? calendar : null;
  assert.equal(await vm.runInContext("setElementDatePickerValue(field, '2025-09-01')", context), true);
  assert.equal(inputClicks, 0, "延迟出现的日期面板不应因第二次点击而关闭");

  year = 2023;
  yearClicks = 0;
  field.value = "";
  context.visibleElementCalendar = () => calendar;
  context.elementDateNavigationButton = (_calendar, direction, unit) => ({
    click() {
      if (unit === "year") {
        assert.equal(direction, "previous");
        yearClicks += 1;
        if (yearClicks !== 2) year -= 1;
      }
    },
  });
  context.clickElementDateCell = () => { field.value = "2018-09-01"; return true; };
  assert.equal(await vm.runInContext("setElementDatePickerValue(field, '2018-09-01')", context), true);
  assert.equal(year, 2018, "高中入学日期需要能跨多个年度回退");

  // This portal can mount the picker well after focus. A second click while it
  // is opening toggles it closed, so the site-specific wait must see it first.
  context.location.hostname = "xiaoyuan.zhaopin.com";
  context.document = { activeElement: field };
  wrapper.matches = (selector) => selector === ".el-date-editor";
  let delayedChecks = 0;
  field.value = "";
  context.visibleElementCalendar = () => ++delayedChecks >= 15 ? calendar : null;
  assert.equal(await vm.runInContext("setElementDatePickerValue(field, '2018-09-01')", context), true);
  assert.equal(inputClicks, 0, "智联迟到的日历出现后，不应再点击输入框将它关闭");

  const shiftedCalendar = {
    ...calendar,
    getBoundingClientRect: () => ({ left: 100, right: 420, top: 500, bottom: 760, width: 320 }),
  };
  field.value = "";
  context.visibleElementCalendar = () => shiftedCalendar;
  assert.equal(await vm.runInContext("setElementDatePickerValue(field, '2018-09-01')", context), true);
  assert.equal(inputClicks, 0, "已聚焦日期框且水平对齐的单个智联弹层，应容忍垂直定位延迟");
}

async function testZhaopinYearGrid() {
  let mode = "day";
  let decade = 2020;
  let selectedYear = 2027;
  let selectedMonth = 6;
  let decadeClicks = 0;
  const header = {
    get textContent() { return mode === "year" ? `${decade} 年 - ${decade + 9} 年` : `${selectedYear} 年`; },
    click() { mode = "year"; },
  };
  const table = (kind) => ({
    querySelectorAll: () => kind === "year"
      ? Array.from({ length: 10 }, (_, index) => ({ kind, value: decade + index,
        textContent: String(decade + index), className: "available" }))
      : Array.from({ length: 12 }, (_, index) => ({ kind, value: index + 1,
        textContent: `${["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"][index]}月`,
        className: "available" })),
  });
  const calendar = {
    querySelectorAll: (selector) => selector === ".el-date-picker__header-label" ? [header] : [],
    querySelector: (selector) => selector === ".el-date-picker__header-label" ? header :
      selector === ".el-year-table" && mode === "year" ? table("year") :
        selector === ".el-month-table" && mode === "month" ? table("month") :
          selector === ".el-date-table" && mode === "day" ? {} : null,
  };
  const context = vm.createContext({
    calendar, location: { hostname: "xiaoyuan.zhaopin.com" }, wait: async () => {},
    isVisible: () => true, visibleElementCalendar: () => calendar,
    elementDateNavigationButton: () => ({ click() { decade -= 10; decadeClicks += 1; } }),
    clickElementDateCell(cell) {
      if (!cell) return false;
      if (cell.kind === "year") { selectedYear = cell.value; mode = "month"; }
      else { selectedMonth = cell.value; mode = "day"; }
      return true;
    },
  });
  vm.runInContext(between("async function selectZhaopinElementYearMonth", "function reachableDocuments"), context);
  assert.equal(await vm.runInContext("selectZhaopinElementYearMonth({}, calendar, 2018, 9)", context), calendar);
  assert.equal(decadeClicks, 1, "高中年份应通过十年分组快速定位");
  assert.equal(selectedYear, 2018);
  assert.equal(selectedMonth, 9);
  mode = "day";
  decade = 2020;
  assert.equal(await vm.runInContext("selectZhaopinElementYearMonth({}, calendar, 2021, 6)", context), calendar);
  assert.equal(selectedYear, 2021);
  assert.equal(selectedMonth, 6);
}

async function testElementSelect() {
  let selected = false;
  let searchWrites = 0;
  let activations = 0;
  const schoolOption = { textContent: "武汉大学", innerText: "武汉大学", matches: () => false };
  const degreeOption = {
    textContent: "硕士研究生", innerText: "硕士研究生",
    matches: (selector) => selector === ".el-select-dropdown__item.selected" && selected,
    dispatchEvent() {}, click() { selected = true; },
  };
  const schoolPanel = {
    matches: () => false, contains: (option) => option === schoolOption,
  };
  const degreePanel = {
    matches: (selector) => selector === ".el-select-dropdown",
    contains: (option) => option === degreeOption,
  };
  const input = { readOnly: false, focus() {} };
  const wrapper = {
    matches: (selector) => selector === ".el-select",
    closest: () => null,
    querySelector: (selector) => selector === "input:not([type='hidden'])" ? input : null,
    getAttribute: () => null,
  };
  const context = vm.createContext({
    wrapper, schoolOption, degreeOption, schoolPanel, degreePanel,
    document: { querySelectorAll: () => [schoolPanel, degreePanel] },
    HTMLInputElement: class {}, MouseEvent: class {},
    isVisible: () => true,
    visibleOptions: () => [schoolOption, degreeOption],
    activateCustomControl() { activations += 1; }, wait: async () => {},
    setInputValueWithoutBlur() { searchWrites += 1; },
    optionScore: (actual, wanted) => actual.includes("硕士") && wanted === "硕士" ? 70 : 0,
    readControlValue: () => selected ? "硕士研究生" : "硕士",
    fieldHints: () => "学历",
  });
  vm.runInContext(between("function visibleOptionsFor", "function visiblePhoenixLayer"), context);
  vm.runInContext(between("async function setCustomSelectValue", "function splitLocationValue"), context);
  assert.equal(vm.runInContext("visibleOptionsFor(wrapper).length", context), 1,
    "学校自动补全与学历下拉同时打开时，只能看到学历选项");
  assert.equal(vm.runInContext("selectedCustomValue(wrapper, wrapper)", context), "",
    "搜索框中的硕士二字不是已选学历");
  assert.equal(await vm.runInContext("setCustomSelectValue(wrapper, '硕士')", context), true);
  assert.equal(searchWrites, 0, "已有匹配选项时不应改写 Element 的搜索输入框");
  assert.equal(selected, true);
  selected = false;
  wrapper.querySelector = (selector) => selector.includes(".el-select__caret.el-icon-arrow-up") ? {} :
    selector === "input:not([type='hidden'])" ? input : null;
  assert.equal(await vm.runInContext("setCustomSelectValue(wrapper, '硕士')", context), true);
  assert.equal(activations, 1, "已经打开的学历菜单不应被再次点击关闭");
  selected = false;
  degreeOption.click = () => {};
  assert.equal(await vm.runInContext("setCustomSelectValue(wrapper, '硕士')", context), false,
    "选项点击未提交时不能报告成功");
}

testEducationSemantics();
testElementPlaceholderReading();
Promise.all([testElementDate(), testZhaopinYearGrid(), testElementSelect(), testDynamicEducationFields()]).then(() => {
  console.log("智联 Element 日期与学历控件测试通过");
}, (error) => {
  console.error(error);
  process.exitCode = 1;
});
