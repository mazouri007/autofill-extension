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

const classification = vm.createContext({});
vm.runInContext(between("const FIELD_RULES", "const BLOCKED_AUTOCOMPLETE"), classification);
function basicKey(label) {
  classification.label = label;
  return vm.runInContext("COMPACT_CJK_RULES.find(([, pattern]) => pattern.test(label))?.[0]", classification);
}
for (const [label, key] of [
  ["民族", "ethnicity"], ["籍贯", "nativePlace"], ["加入党派时间", "partyJoinDate"],
  ["紧急联系人", "emergencyContactName"], ["紧急联系方式", "emergencyContactPhone"],
  ["期望待遇（万元/年）", "expectedAnnualSalary"],
]) assert.equal(basicKey(label), key);
classification.label = "第二专业";
assert.equal(vm.runInContext(
  "STRUCTURED_SECTIONS.education.fields.find(([, pattern]) => pattern.test(label))?.[0]", classification,
), "secondMajor");
classification.label = "是否最高全日制学历";
assert.equal(vm.runInContext(
  "STRUCTURED_SECTIONS.education.fields.find(([, pattern]) => pattern.test(label))?.[0]", classification,
), "highestFullTime");

// On Phoenix, the two dates live in a different form-part-body than the
// school/major fields. All four must resolve to the same repeatable record.
const phoenixRecord = { querySelectorAll: () => ["startDate", "endDate", "school", "major"].map(
  (key) => ({ key, disabled: false }),
) };
const recordScopeContext = vm.createContext({
  STRUCTURED_INFERENCE_PATTERNS: { education: /学校|专业/ },
  CONTROL_SELECTOR: "input,.phoenix-select",
  isVisible: () => true,
  isProtectedField: () => false,
  isPresenceGateControl: () => false,
  isPersonalInformationGroup: () => false,
  classifyStructuredField: (control) => control.key,
  phoenixRecord,
});
vm.runInContext(between("function boundedStructuredContainer", "function collectStructuredDescriptors"), recordScopeContext);
for (const key of ["startDate", "endDate", "school", "major"]) {
  recordScopeContext.field = { key, closest: () => phoenixRecord };
  assert.equal(vm.runInContext("boundedStructuredContainer(field, 'education')", recordScopeContext), phoenixRecord);
}

async function testPhoenixControls() {
  const phoenixInput = {
    value: "汉族", matches: () => true,
    closest: () => ({ textContent: "请选择" }),
  };
  const phoenixReadContext = vm.createContext({
    element: phoenixInput, HTMLInputElement: class {},
  });
  vm.runInContext(between("function readControlValue", "function dispatchValueEvents"), phoenixReadContext);
  assert.equal(vm.runInContext("readControlValue(element)", phoenixReadContext), "",
    "Phoenix 搜索框文字不能冒充已选民族");
  phoenixInput.closest = () => ({ textContent: "汉族" });
  assert.equal(vm.runInContext("readControlValue(element)", phoenixReadContext), "汉族",
    "Phoenix 应读取选择器展示值，而非内部输入框");

  const pageField = { value: "", closest() { return this; }, dispatchEvent() {}, click() {} };
  const dateInput = {
    focus() {},
    dispatchEvent(event) { if (event.key === "Enter" && event.type === "keydown") pageField.value = this.value; },
  };
  const dateContext = vm.createContext({
    activateCustomControl() {}, wait: async () => {},
    visiblePhoenixLayer: () => ({ querySelector: () => dateInput }),
    setInputValueWithoutBlur: (input, value) => { input.value = value; },
    MouseEvent: class {},
    KeyboardEvent: class { constructor(type, props) { this.type = type; this.key = props.key; } },
    datePartsMatch: (field, year, month, day) => field.value ===
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    pageField,
  });
  vm.runInContext(between("async function setPhoenixDatePickerValue", "async function setElementDatePickerValue"), dateContext);
  assert.equal(await vm.runInContext("setPhoenixDatePickerValue(pageField, '2020-09-01')", dateContext), true);

  const start = { value: "", closest() { return this; }, dispatchEvent() {}, click() { activeField = this; } };
  const end = { value: "", closest() { return this; }, dispatchEvent() {}, click() { activeField = this; } };
  let activeField = start;
  const dateLayers = new Map([start, end].map((field) => [field, {
    querySelector: () => ({
      focus() {},
      dispatchEvent(event) {
        if (event.key === "Enter" && event.type === "keydown") activeField.value = this.value;
      },
    }),
  }]));
  const staleLayerContext = vm.createContext({
    activateCustomControl: (field) => { activeField = field; }, wait: async () => {},
    visiblePhoenixLayer: () => dateLayers.get(activeField),
    setInputValueWithoutBlur: (input, date) => { input.value = date; },
    MouseEvent: class {},
    KeyboardEvent: class { constructor(type, props) { this.type = type; this.key = props.key; } },
    datePartsMatch: (field, year, month, day) => field.value ===
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    start, end,
  });
  vm.runInContext(between("async function setPhoenixDatePickerValue", "async function setElementDatePickerValue"), staleLayerContext);
  assert.equal(await vm.runInContext("setPhoenixDatePickerValue(start, '2021-09-01')", staleLayerContext), true);
  assert.equal(await vm.runInContext("setPhoenixDatePickerValue(end, '2025-06-30')", staleLayerContext), true);
  assert.equal(start.value, "2021-09-01");
  assert.equal(end.value, "2025-06-30");

  // Phoenix briefly keeps the start calendar visible after switching to the
  // end field. The new calendar must win even if both layers match the same
  // selector and the previous input retains focus.
  const rect = (left, top = 50) => ({ left, top, bottom: top + 40, width: 220, height: 40 });
  const oldInput = { getBoundingClientRect: () => rect(100), focus() {}, dispatchEvent() {} };
  const newInput = {
    getBoundingClientRect: () => rect(500), focus() {},
    dispatchEvent(event) {
      if (event.key === "Enter" && event.type === "keydown") end.value = this.value;
    },
  };
  const oldLayer = {
    querySelector(selector) {
      return selector === ".phoenix-date-picker" ? { getBoundingClientRect: () => rect(100) } : oldInput;
    },
    contains(node) { return node === oldInput; },
  };
  const newLayer = {
    querySelector(selector) {
      return selector === ".phoenix-date-picker" ? { getBoundingClientRect: () => rect(500) } : newInput;
    },
    contains(node) { return node === newInput; },
  };
  const endWrapper = {
    getBoundingClientRect: () => ({ left: 500, bottom: 50 }),
    dispatchEvent() {}, click() {},
  };
  end.value = "";
  end.closest = () => endWrapper;
  const overlappingContext = vm.createContext({
    document: {
      activeElement: oldInput,
      querySelectorAll: () => [oldLayer, newLayer],
      elementFromPoint: (x) => x < 400 ? oldInput : newInput,
    },
    isVisible: () => true,
    wait: async () => {},
    setInputValueWithoutBlur: (input, date) => { input.value = date; },
    MouseEvent: class {},
    KeyboardEvent: class { constructor(type, props) { this.type = type; this.key = props.key; } },
    datePartsMatch: (field, year, month, day) => field.value ===
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    end,
  });
  vm.runInContext(between("function visiblePhoenixLayer", "function setInputValueWithoutBlur"), overlappingContext);
  vm.runInContext(between("async function setPhoenixDatePickerValue", "async function setElementDatePickerValue"), overlappingContext);
  assert.equal(await vm.runInContext("setPhoenixDatePickerValue(end, '2026-09-22')", overlappingContext), true);
  assert.equal(end.value, "2026-09-22");

  // If two panels overlap geometrically, only use one when it is uniquely
  // topmost; otherwise the caller must leave the field for manual review.
  overlappingContext.newLayer = newLayer;
  overlappingContext.oldLayer = oldLayer;
  overlappingContext.endWrapper = endWrapper;
  overlappingContext.oldInput = oldInput;
  overlappingContext.newInput = newInput;
  vm.runInContext("endWrapper.getBoundingClientRect = () => ({ left: 300, bottom: 50 });", overlappingContext);
  vm.runInContext("oldLayer.querySelector = () => oldInput; newLayer.querySelector = () => newInput;", overlappingContext);
  vm.runInContext("oldInput.getBoundingClientRect = newInput.getBoundingClientRect = () => ({ left: 300, top: 50, width: 220, height: 40 });", overlappingContext);
  vm.runInContext("document.elementFromPoint = () => newInput;", overlappingContext);
  assert.equal(vm.runInContext("visiblePhoenixLayer('.phoenix-calendar-input', endWrapper)", overlappingContext), newLayer);
  vm.runInContext("document.elementFromPoint = () => null;", overlappingContext);
  assert.equal(vm.runInContext("visiblePhoenixLayer('.phoenix-calendar-input', endWrapper)", overlappingContext), null);

  const options = ["本科", "硕士研究生"].map((textContent) => ({ textContent }));
  const selectLayer = {
    querySelector: () => null,
    querySelectorAll: () => options,
  };
  const selectContext = vm.createContext({
    activateCustomControl() {}, wait: async () => {},
    visiblePhoenixLayer: () => selectLayer,
    isVisible: () => true,
    optionScore: (observed, wanted) => observed === wanted ? 100 : 0,
    normalizeMatchText: (value) => String(value),
    clickPhoenixOption: (option) => { pageField.value = option.textContent; },
    readControlValue: (field) => field.value,
    pageField,
  });
  vm.runInContext(between("async function setPhoenixSelectValue", "async function setCustomSelectValue"), selectContext);
  assert.equal(await vm.runInContext("setPhoenixSelectValue(pageField, '本科')", selectContext), true);
  assert.equal(pageField.value, "本科");

  const areaParts = ["山西省", "晋中市", "平遥县"];
  let level = 0;
  const areaLayer = {
    querySelectorAll(selector) {
      if (selector === ".area-item-container") return [{ textContent: areaParts[level] }];
      if (selector === ".phoenix-button__content") return [{ textContent: "确定" }];
      return [];
    },
  };
  const areaContext = vm.createContext({
    splitLocationValue: (value) => value.split(" / "),
    activateCustomControl() {}, wait: async () => {},
    visiblePhoenixLayer: () => areaLayer,
    isVisible: () => true,
    locationOptionScore: (observed, wanted) => observed === wanted ? 100 : 0,
    normalizeMatchText: (value) => String(value),
    shortLocationPart: (value) => String(value).slice(0, -1),
    clickPhoenixOption: (option) => {
      if (option.textContent === "确定") pageField.value = areaParts.join("/");
      else level += 1;
    },
    readControlValue: (field) => field.value,
    pageField,
  });
  vm.runInContext(between("async function setPhoenixAreaValue", "function setLocationSelectValue"), areaContext);
  assert.equal(await vm.runInContext(
    "setPhoenixAreaValue(pageField, '山西省 / 晋中市 / 平遥县')", areaContext,
  ), true);
}

testPhoenixControls().then(() => console.log("中国人寿 Phoenix 控件回归测试通过"), (error) => {
  console.error(error);
  process.exitCode = 1;
});
