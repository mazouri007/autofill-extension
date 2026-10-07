const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../content.js"), "utf8");
function between(start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first);
  return source.slice(first, last);
}
class FakeSelect {}
const compact = (value) => String(value || "").trim();
const context = vm.createContext({
  HTMLSelectElement: FakeSelect, HTMLInputElement: class {},
  compactText: compact,
  optionScore: (actual, wanted) => compact(actual) === compact(wanted) ? 100 : 0,
  locationOptionScore: (actual, wanted) => compact(actual) === compact(wanted) ? 100 : 0,
  splitLocationValue: (value) => String(value).split("/"),
  locationProfileKeyFromText: (label) => /籍贯/.test(label) ? "nativePlace" : null,
  textOfLabel: (element) => element.label || "",
  fieldHints: () => "籍贯", normalizeMatchText: compact, controlAtomicHints: () => [],
  window: { getComputedStyle: (element) => ({ display: element.hidden ? "none" : "block", visibility: "visible", opacity: element.opacity || "1" }) },
  wait: async () => {},
  CONTROL_SELECTOR: "input,select,[role='combobox']",
  isProtectedField: (element) => Boolean(element.protected),
});
vm.runInContext(between("function bootstrapSelectParts", "function isCustomControl"), context);
vm.runInContext(between("async function setBootstrapSelectValue", "function wait("), context);
vm.runInContext(between("function locationLevelForField", "function cascaderWrapper"), context);
vm.runInContext(between("function collectControls", "function nearestRecordContainer"), context);

function makeSelect(labels = ["请选择", "汉族", "回族"]) {
  const visible = { isConnected: true, getClientRects: () => [{}], matches: () => false };
  const select = Object.assign(new FakeSelect(), visible, {
    tagName: "SELECT", opacity: "0", value: "", label: "民族",
    options: labels.map((text, index) => ({ textContent: text, value: index ? String(index) : "" })),
  });
  const menu = { ...visible, hidden: true };
  const label = { textContent: "请选择" };
  const button = { ...visible, textContent: "请选择", querySelector: () => label,
    click: () => { menu.hidden = !menu.hidden; },
  };
  const wrapper = { ...visible, matches: (selector) => selector === ".bootstrap-select",
    querySelector(selector) {
      if (selector === ":scope > select") return select;
      if (selector === ":scope > button.dropdown-toggle") return button;
      if (selector === ":scope > .dropdown-menu") return menu;
      return null;
    },
  };
  for (const element of [select, menu, button, wrapper]) {
    element.closest = (selector) => selector === ".bootstrap-select" ? wrapper : null;
    element.getAttribute = () => "";
  }
  let commitModel = true;
  let commitLabel = true;
  menu.querySelector = (selector) => {
    const index = Number(selector.match(/"(\d+)"/)?.[1]);
    if (!select.options[index]) return null;
    const option = { ...visible, getClientRects: () => menu.hidden ? [] : [{}], getAttribute: () => "false",
      click() {
        if (commitModel) select.value = select.options[index].value;
        if (commitLabel) label.textContent = select.options[index].textContent;
        menu.hidden = true;
      },
    };
    return { matches: () => false, querySelector: () => option };
  };
  return { select, menu, button, wrapper, label,
    commit(model, display) { commitModel = model; commitLabel = display; } };
}

async function run() {
  const field = makeSelect();
  context.field = field.select;
  context.collectRoots = () => [{ querySelectorAll: () => [field.select, field.menu] }];
  assert.equal(vm.runInContext("collectControls().length", context), 1, "菜单与原生 select 只形成一个字段");
  assert.equal(vm.runInContext("collectControls()[0]", context), field.select);
  assert.equal(vm.runInContext("isVisible(field)", context), true, "只对有可见按钮的 Bootstrap 原生 select 放行");
  field.button.hidden = true;
  assert.equal(vm.runInContext("isVisible(field)", context), false, "隐藏区域仍不能填写");
  field.button.hidden = false;
  field.select.protected = true;
  assert.equal(vm.runInContext("collectControls().length", context), 0, "保护字段过滤在规范化之后执行");
  field.select.protected = false;
  assert.equal(await vm.runInContext("setBootstrapSelectValue(field, '汉族')", context), true);
  assert.equal(field.select.value, "1");
  assert.equal(field.label.textContent, "汉族");
  field.commit(false, true);
  assert.equal(await vm.runInContext("setBootstrapSelectValue(field, '回族')", context), false, "只变显示文本不是成功");
  field.commit(true, false);
  assert.equal(await vm.runInContext("setBootstrapSelectValue(field, '汉族')", context), false, "只变原生值不是成功");
  assert.equal(field.menu.hidden, true);
  field.commit(true, true);
  field.select.classList = { contains: (name) => name === "ng-empty" };
  assert.equal(await vm.runInContext("setBootstrapSelectValue(field, '汉族')", context), false,
    "Angular 模型仍为空时，原生值和显示一致也不能报告成功");
  field.select.classList = { contains: () => false };
  field.commit(true, true);
  field.select.disabled = true;
  assert.equal(await vm.runInContext("setBootstrapSelectValue(field, '汉族')", context), false);
  field.select.disabled = false;
  field.select.options.push({ value: "other", textContent: "汉族" });
  assert.equal(await vm.runInContext("setBootstrapSelectValue(field, '汉族')", context), false, "相同分数的不同选项不猜测");
  const relationship = makeSelect(["请选择", "父子", "父女"]);
  context.relationship = relationship.select;
  const originalScore = context.optionScore;
  context.optionScore = (actual, wanted) => /父[子女]/.test(actual) && wanted === "父子" ? 100 : originalScore(actual, wanted);
  assert.equal(await vm.runInContext("setBootstrapSelectValue(relationship, '父子')", context), true,
    "明确的父子选项优先于同一亲属别名组的父女，不应因别名并列而跳过");
  assert.equal(relationship.select.value, "1");
  context.optionScore = originalScore;
  const plain = { isConnected: true, tagName: "SELECT", opacity: "0", getClientRects: () => [{}] };
  context.plain = plain;
  assert.equal(vm.runInContext("isVisible(plain)", context), false, "不放行普通透明 select");

  const province = makeSelect(["请选择", "山西省"]);
  const city = makeSelect(["请选择"]);
  const pair = [province.select, city.select];
  const searchInputs = [province, city].map(({ wrapper }) => ({
    closest: (selector) => selector === ".bootstrap-select" ? wrapper : null,
  }));
  const group = {
    label: "籍贯",
    querySelectorAll: (selector) => selector.startsWith("input") ? [...pair, ...searchInputs] : pair,
  };
  province.wrapper.parentElement = group;
  city.wrapper.parentElement = group;
  province.select.label = city.select.label = "籍贯";
  context.province = province.select;
  context.city = city.select;
  assert.equal(vm.runInContext("locationLevelForField(province)", context), 0);
  assert.equal(vm.runInContext("locationLevelForField(city)", context), 1);
  assert.equal(await vm.runInContext("setBootstrapSelectValue(province, '山西省/晋中市/平遥县', true)", context), true);
  let waits = 0;
  context.wait = async () => {
    waits += 1;
    if (waits === 2) city.select.options.push({ value: "c1", textContent: "晋中市" });
  };
  assert.equal(await vm.runInContext("setBootstrapSelectValue(city, '山西省/晋中市/平遥县', true)", context), true);
  assert.equal(city.select.value, "c1", "只写城市精度并等待级联选项更新");
  group.querySelectorAll = (selector) => selector.startsWith("input") ? [...pair, {}] : pair;
  assert.equal(vm.runInContext("locationLevelForField(city)", context), null, "不把包含其他字段的区域当省市组");

  const readContext = vm.createContext({
    HTMLInputElement: class {}, HTMLSelectElement: FakeSelect,
    field: field.select,
  });
  vm.runInContext(between("function readControlValue", "function setNativeValue"), readContext);
  field.select.classList = { contains: (name) => name === "ng-empty" };
  assert.equal(vm.runInContext("readControlValue(field)", readContext), "", "未确认的自动首项不阻止本地及 AI 填写");
  field.select.classList = { contains: () => false };
  assert.equal(vm.runInContext("readControlValue(field)", readContext), field.select.value);

  let aiAdapterCalls = 0;
  context.aiSourceValue = () => "回族";
  context.aiHasExistingValue = () => false;
  context.aiValuesEquivalent = () => true;
  context.LOCATION_PROFILE_KEYS = new Set();
  context.setControlValue = async (element, value, key) => {
    assert.equal(element, field.select);
    assert.equal(value, "回族");
    assert.equal(key, "ethnicity");
    aiAdapterCalls += 1;
    return false;
  };
  context.field.dataset = {};
  vm.runInContext(between("async function aiFillOne", "async function aiSaveCorrections"), context);
  assert.equal(await vm.runInContext("aiFillOne('basic', {}, {fieldId:'f1', sourceKey:'ethnicity'}, [{id:'f1', element:field}], true)", context), false);
  assert.equal(aiAdapterCalls, 1, "AI 必须使用同一实际控件适配器，不能绕过菜单直接改隐藏值");

  let writes = 0;
  const compound = vm.createContext({
    controls: pair, profile: { nativePlace: "山西省/晋中市" },
    confirmedStructuredSection: () => false,
    locationLevelForField: (element) => pair.indexOf(element),
    locationGroupKey: () => "nativePlace", profileValue: (profile, key) => profile[key],
    isUsable: () => true, locationOptionScore: () => 100,
    splitLocationValue: (value) => value.split("/"),
    setLocationControlValue: async () => { writes += 1; return false; },
    state: { filledElements: new WeakSet() },
    report: { filled: 0, failed: 0, skipped: 0, sections: { basic: 0 } },
  });
  vm.runInContext(between("async function fillCompoundBasicLocations", "function customFieldValue"), compound);
  await vm.runInContext("fillCompoundBasicLocations(profile, controls, false, state, report)", compound);
  assert.equal(writes, 1, "省份失败时不继续向城市控件填写");
  compound.confirmedStructuredSection = () => "family";
  writes = 0;
  await vm.runInContext("fillCompoundBasicLocations(profile, controls, false, state, report)", compound);
  assert.equal(writes, 0, "一键基础填写不能借新地区适配器写入家庭等多条经历");
  console.log("Bootstrap Select 识别、菜单提交、真假成功与省市级联测试通过");
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
