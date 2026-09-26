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

const sections = vm.createContext({ fieldHints: (field) => field.label });
vm.runInContext(between("const STRUCTURED_SECTIONS", "const EDUCATION_LEVEL_ALIASES"), sections);
vm.runInContext(between("function classifyStructuredField", "function isVisible"), sections);
assert.equal(vm.runInContext("STRUCTURED_SECTIONS.education.sectionPattern.test('教育信息')", sections), true);
for (const [label, expected] of [
  ["结束日期", "endDate"], ["学历", "educationLevel"],
  ["学位", "degree"], ["学习形式", "educationType"],
]) {
  sections.field = { label };
  assert.equal(vm.runInContext("classifyStructuredField(field, 'education')", sections), expected);
}
vm.runInContext(between("function valueForStructuredField", "function createReport"), sections);
sections.currentEducation = { current: true, endDate: "2027-06-30" };
assert.equal(vm.runInContext(
  "valueForStructuredField('education', currentEducation, 'endDate')", sections,
), "2027-06-30", "目前在读但填写了预计毕业日期时，不能静默丢弃结束时间");
assert.ok(!between("async function fillCompoundDateFields", "async function fillKnownStructuredFields")
  .includes('sourceKey === "endDate" && record.current'));

async function run() {
  class FakeInput {}
  let inputWidth = 0;
  const nestedInput = Object.assign(new FakeInput(), {
    readOnly: true,
    closest: () => selectRoot,
    getAttribute: () => "",
    getBoundingClientRect: () => ({ width: inputWidth, height: 20 }),
    matches: () => false,
  });
  const selectRoot = {
    closest: () => selectRoot,
    getAttribute: () => "",
    matches: (selector) => selector.includes(".ant-select"),
    querySelector: () => nestedInput,
  };
  const controls = vm.createContext({
    HTMLInputElement: FakeInput, CONTROL_SELECTOR: "input,.ant-select",
    collectRoots: () => [{ querySelectorAll: () => [selectRoot, nestedInput] }],
    isProtectedField: () => false, isVisible: () => true,
  });
  vm.runInContext(between("function collectControls", "function nearestRecordContainer"), controls);
  assert.equal(vm.runInContext("collectControls()[0]", controls), selectRoot,
    "零宽的 Ant 搜索框不应挤掉真正的下拉控件");
  assert.equal(vm.runInContext("collectControls().length", controls), 1);
  inputWidth = 120;
  assert.equal(vm.runInContext("collectControls()[0]", controls), selectRoot,
    "交行的 Ant 输入框虽有宽度，但只读时仍不是可填写目标");
  nestedInput.readOnly = false;
  assert.equal(vm.runInContext("collectControls()[0]", controls), nestedInput,
    "真正可见的搜索输入框仍应保留");

  let selected = "";
  const label = { get textContent() { return selected; } };
  const wrapper = {
    querySelector: (selector) => selector.includes(".ant-select-selection-selected-value") ? label : null,
    matches: (selector) => selector === ".ant-select",
    classList: { contains: () => false },
  };
  const field = { closest: (selector) => selector.includes(".phoenix-select") ? null : wrapper };
  const option = {
    textContent: "本科",
    dispatchEvent() {},
    click() { if (this.commit) selected = this.textContent; },
  };
  const select = vm.createContext({
    field, option, HTMLInputElement: class {}, MouseEvent: class {},
    activateCustomControl() {}, wait: async () => {},
    visibleOptionsFor: () => [option],
    optionScore: (actual, wanted) => actual === wanted ? 100 : 0,
    readControlValue: () => "",
    fieldHints: () => "学历",
    location: { hostname: "test.local" },
  });
  vm.runInContext(between("function selectedCustomValue", "function visiblePhoenixLayer"), select);
  vm.runInContext(between("async function setCustomSelectValue", "function splitLocationValue"), select);
  assert.equal(await vm.runInContext("setCustomSelectValue(field, '本科')", select), false,
    "点击下拉选项后没有选中值时不能报告成功");
  option.commit = true;
  assert.equal(await vm.runInContext("setCustomSelectValue(field, '本科')", select), true);

  let hiddenSearchWrites = 0;
  const hiddenSearch = { readOnly: false };
  wrapper.querySelector = (selector) => selector.includes("input:not") ? hiddenSearch :
    selector.includes(".ant-select-selection-selected-value") ? label : null;
  select.setInputValueWithoutBlur = () => { hiddenSearchWrites += 1; };
  assert.equal(await vm.runInContext("setCustomSelectValue(field, '本科')", select), true);
  assert.equal(hiddenSearchWrites, 0,
    "Ant 非搜索下拉框的隐藏输入不能被改写，否则会关闭或过滤选项");
  wrapper.classList.contains = (name) => name === "ant-select-show-search";
  hiddenSearch.focus = () => {};
  assert.equal(await vm.runInContext("setCustomSelectValue(field, '本科')", select), true);
  assert.equal(hiddenSearchWrites, 1, "可搜索的 Ant 下拉框应保留不触发 blur 的搜索输入");

  const hiddenVirtualOption = { visible: true, matches: () => false,
    getBoundingClientRect: () => ({ width: 0, height: 0 }) };
  const visibleAntOption = { visible: true, matches: () => false,
    getBoundingClientRect: () => ({ width: 100, height: 32 }) };
  const antOptions = vm.createContext({
    document: { querySelectorAll: (selector) => selector.includes(".ant-select-item-option")
      ? [hiddenVirtualOption, visibleAntOption] : [hiddenVirtualOption] },
    isVisible: (item) => item.visible,
  });
  vm.runInContext(between("function visibleOptions()", "function visibleOptionsFor"), antOptions);
  assert.equal(vm.runInContext("visibleOptions()[0]", antOptions), visibleAntOption,
    "Ant 的零尺寸无障碍选项不能盖过实际可点击选项");

  let nativeWrites = 0;
  const dateField = { readOnly: true };
  const date = vm.createContext({
    dateField, document: { dispatchEvent() {} }, KeyboardEvent: class {},
    wait: async () => {}, isInteractiveDateControl: () => false,
    setNativeValue: () => { nativeWrites += 1; }, datePartsMatch: () => true,
  });
  vm.runInContext(between("async function directDateInputFallback", "function exactElementDateCell"), date);
  assert.equal(await vm.runInContext(
    "directDateInputFallback(dateField, '2025-06-30', 2025, 6, 30)", date,
  ), false);
  assert.equal(nativeWrites, 0, "只读日期控件不能靠写 DOM value 伪造成功");
  dateField.readOnly = false;
  date.isInteractiveDateControl = () => true;
  assert.equal(await vm.runInContext(
    "directDateInputFallback(dateField, '2025-06-30', 2025, 6, 30)", date,
  ), false);
  assert.equal(nativeWrites, 0, "交互式日期控件也不能走直接赋值兜底");

  const panel = { matches: (selector) => selector === ".el-picker-panel" };
  const genericField = { focus() {}, dispatchEvent() {}, click() {} };
  let selectedByPicker = false;
  const generic = vm.createContext({
    genericField, MouseEvent: class {}, wait: async () => {},
    adjacentDateActivationTargets: () => [],
    visibleGenericDateCalendar: () => panel,
    setElementDatePickerValue: async () => { selectedByPicker = true; return true; },
    directDateInputFallback: () => { throw new Error("不应直接改写受控日期输入框"); },
  });
  vm.runInContext(between("async function setGenericDatePickerValue", "async function setPhoenixDatePickerValue"), generic);
  assert.equal(await vm.runInContext("setGenericDatePickerValue(genericField, '2022-03-01')", generic), true);
  assert.equal(selectedByPicker, true);

  let displayedMonth = 9;
  let monthClicks = 0;
  const antField = { value: "", dispatchEvent() {}, click() {} };
  const calendarFor = () => ({
    querySelector(selector) {
      if (selector.includes("year-select") || selector.includes("year-btn")) return { textContent: "2027年" };
      if (selector.includes("prev-month-btn") || selector.includes("header-prev-btn")) return {
        click() { displayedMonth -= 1; monthClicks += 1; },
      };
      if (selector.includes("month-select") || selector.includes("month-btn")) return { textContent: `${displayedMonth}月` };
      if (selector === '[title="2027-06-30"]' && displayedMonth === 6) return {
        querySelector: () => ({ dispatchEvent() {}, click() { antField.value = "2027-06-30"; } }),
      };
      return null;
    },
  });
  const ant = vm.createContext({
    antField, MouseEvent: class {}, wait: async () => {},
    visibleAntCalendarFor: calendarFor,
    readControlValue: (field) => field.value,
    datePartsMatch: (field, year, month, day) => field.value ===
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  });
  vm.runInContext(between("async function setAntDatePickerValue", "async function setControlValue"), ant);
  assert.equal(await vm.runInContext("setAntDatePickerValue(antField, '2027-06-30')", ant), true);
  assert.equal(monthClicks, 3, "Ant 日期导航需要每次获取重绘后的按钮");

  const endPopup = { className: "ant-picker-dropdown", getAttribute: () => null,
    getBoundingClientRect: () => ({ left: 500, right: 700, top: 110, bottom: 350, width: 200, height: 240 }) };
  const startPopup = { className: "ant-picker-dropdown", getAttribute: () => null,
    getBoundingClientRect: () => ({ left: 0, right: 200, top: 110, bottom: 350, width: 200, height: 240 }) };
  const pickerBody = {};
  const endPicker = { parentElement: pickerBody,
    getBoundingClientRect: () => ({ left: 500, right: 700, top: 50, bottom: 100 }) };
  const portalContext = vm.createContext({
    document: { body: pickerBody, querySelectorAll: () => [startPopup, endPopup] },
    endPicker, isVisible: () => true,
  });
  vm.runInContext(between("function visibleAntCalendarFor", "function visibleElementCalendar"), portalContext);
  assert.equal(vm.runInContext("visibleAntCalendarFor(endPicker)", portalContext), endPopup,
    "起始和结束日历同时存在时应选结束字段旁的日历");

  let elementYear = 2026;
  let elementMonth = 9;
  const elementField = { value: "", focus() {}, dispatchEvent() {}, click() {} };
  const elementPanel = { querySelectorAll: () => [{ textContent: "1", className: "" }] };
  const element = vm.createContext({
    elementField, MouseEvent: class {}, wait: async () => {},
    elementDateWrapper: () => elementField, visibleElementCalendar: () => elementPanel,
    exactElementDateCell: () => null,
    displayedElementDate: () => ({ year: elementYear, month: elementMonth }),
    elementDateNavigationButton: (_panel, direction, unit) => {
      let clicked = false;
      return { click() {
        if (clicked) return;
        clicked = true;
        if (unit === "year") elementYear += direction === "previous" ? -1 : 1;
        else elementMonth += direction === "previous" ? -1 : 1;
      } };
    },
    isVisible: () => true,
    clickElementDateCell: () => { elementField.value = "2022-03-01"; return true; },
    datePartsMatch: (field) => field.value === "2022-03-01",
    directDateInputFallback: () => { throw new Error("控件提交失败不能降级成写 DOM value"); },
  });
  vm.runInContext(between("async function setElementDatePickerValue", "async function setAntDatePickerValue"), element);
  assert.equal(await vm.runInContext("setElementDatePickerValue(elementField, '2022-03-01')", element), true);
  assert.equal(elementYear, 2022);
  assert.equal(elementMonth, 3);
  elementField.blur = () => { elementField.value = ""; };
  element.directDateInputFallback = () => false;
  assert.equal(await vm.runInContext("setElementDatePickerValue(elementField, '2022-03-01')", element), false,
    "失焦后被网页表单清空的日期不能报告成功");
}

run().then(() => console.log("交行教育字段与平安日期控件测试通过"), (error) => {
  console.error(error);
  process.exitCode = 1;
});
