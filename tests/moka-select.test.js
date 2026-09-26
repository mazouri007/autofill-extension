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

class FakeInput { constructor() { this.value = "09"; this.readOnly = false; } }
let selected = "";
const input = new FakeInput();
const display = { get textContent() { return selected; } };
const option = {
  innerText: "9", textContent: "9", dispatchEvent() {},
  click() { selected = "9"; input.value = ""; },
};
const wrapper = {
  matches: (selector) => selector.includes("sd-Dropdown-container"),
  closest: (selector) => selector.includes("sd-Dropdown-container") ? wrapper : null,
  querySelector: (selector) => selector.includes("sd-Input-display-value") ? display :
    selector.includes("input:not") ? input : null,
  classList: { contains: () => false },
};
input.closest = (selector) => selector.includes("sd-Dropdown-container") ? wrapper : null;
input.matches = (selector) => selector.includes("input");
input.getAttribute = () => null;
const context = vm.createContext({
  input, wrapper, HTMLInputElement: FakeInput, HTMLSelectElement: class {},
  MouseEvent: class {}, location: { hostname: "test.local" },
  fieldHints: () => "就读时间 月", activateCustomControl() {},
  wait: async () => {}, visibleOptionsFor: () => [option],
  optionScore: (actual, wanted) => Number(actual) === Number(wanted) ? 100 : 0,
  setInputValueWithoutBlur() { throw new Error("可见月份选项不应被搜索输入覆盖"); },
  isCustomControl: () => true,
});
vm.runInContext(between("function readControlValue", "function dispatchValueEvents"), context);
vm.runInContext(between("function selectedCustomValue", "function visiblePhoenixLayer"), context);
vm.runInContext(between("async function setCustomSelectValue", "function splitLocationValue"), context);

async function run() {
  assert.equal(vm.runInContext("readControlValue(input)", context), "",
    "09 是未提交的搜索文字，不能冒充已选择的月份");
  assert.equal(await vm.runInContext("setCustomSelectValue(input, '9')", context), true);
  assert.equal(vm.runInContext("readControlValue(input)", context), "9",
    "只有点击 Moka 真实选项后才算写入");

  // Moka preselects January when a year is chosen. That generated default
  // must not be mistaken for a month the user had already entered.
  const fields = ["year", "month", "year", "month"].map((component, index) => ({
    component, index, value: Number.NaN, isConnected: true, disabled: false,
    compareDocumentPosition(other) { return this.index < other.index ? 4 : 0; },
    dataset: {},
  }));
  const dateContext = vm.createContext({
    fields, Node: { DOCUMENT_POSITION_FOLLOWING: 4 },
    isVisible: () => true,
    datePartForControl: (field) => field.component,
    isWholeDateControl: () => false,
    compoundContextText: () => "起止时间",
    dateSourceFromText: () => null,
    classifyStructuredField: () => null,
    fieldHints: () => "",
    dateParts: (value) => ({ year: Number(value.slice(0, 4)), month: Number(value.slice(5, 7)) }),
    numericControlValue: (field) => field.value,
    wait: async () => {},
    setDatePartControl: async (field, component, wanted) => {
      field.value = wanted;
      if (component === "year") fields[field.index + 1].value = 1;
      return true;
    },
  });
  vm.runInContext(between("async function fillCompoundDateFields", "async function fillKnownStructuredFields"), dateContext);
  const result = await vm.runInContext(`fillCompoundDateFields("work", {
    startDate: "2026-07-01", endDate: "2026-09-22"
  }, fields, false, report)`, Object.assign(dateContext, {
    report: { filled: 0, skipped: 0, unchanged: 0, failed: 0,
      sections: { work: 0 } },
  }));
  assert.equal(result.size, 4);
  assert.deepEqual(fields.map((field) => field.value), [2026, 7, 2026, 9]);
  assert.equal(dateContext.report.skipped, 0);
}

run().then(() => console.log("作业帮 Moka 月份选择器测试通过"), (error) => {
  console.error(error);
  process.exitCode = 1;
});
