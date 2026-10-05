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

// A small DOM tree, not mocked label extraction: the production code walks the
// same Phoenix/BEM ancestry, preceding siblings and owning groups as the page.
class Element {
  constructor(tag = "div", cls = "", text = "") {
    this.tagName = tag.toUpperCase();
    this.className = cls;
    this.ownText = text;
    this.children = [];
    this.attributes = {};
    this.nodeType = 1;
    this.isConnected = true;
    this.dataset = {};
  }
  get textContent() { return this.ownText + this.children.map((c) => c.textContent).join(""); }
  get innerText() { return this.textContent; }
  get previousElementSibling() {
    const siblings = this.parentElement?.children || [];
    return siblings[siblings.indexOf(this) - 1] || null;
  }
  get previousSibling() { return this.previousElementSibling; }
  get childNodes() { return this.children; }
  append(child) {
    child.parentElement = this;
    child.ownerDocument = this.ownerDocument;
    this.children.push(child);
    return child;
  }
  matches(selector) {
    return selector.split(",").some((part) => {
      let rule = part.trim();
      if (rule.includes(":not([class*='__'])")) {
        if (this.className.includes("__")) return false;
        rule = rule.replace(":not([class*='__'])", "");
      }
      const substring = rule.match(/^\[class\*=['"](.+)['"]\]$/);
      if (substring) return this.className.includes(substring[1]);
      if (/^\.[\w-]+$/.test(rule)) return this.className.split(/\s+/).includes(rule.slice(1));
      const attribute = rule.match(/^\[([\w-]+)(?:=['"]([^'"]*)['"])?\]$/);
      if (attribute) return attribute[2] === undefined
        ? this.getAttribute(attribute[1]) !== null : this.getAttribute(attribute[1]) === attribute[2];
      return rule.toUpperCase() === this.tagName;
    });
  }
  closest(selector) {
    for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node;
    return null;
  }
  querySelectorAll(selector) {
    return this.children.flatMap((child) => [
      ...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector),
    ]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  getClientRects() { return [{}]; }
  getBoundingClientRect() { return { width: 240, height: 26 }; }
  cloneNode() { return new Element(this.tagName, this.className, this.ownText); }
}
class Input extends Element {
  constructor() {
    super("input");
    this.name = this.id = this.placeholder = this.value = "";
    this.type = "text";
    this.readOnly = this.disabled = false;
    this.attributes.type = "text";
  }
}
const body = new Element("body");
const document = { body, querySelector: () => null, getElementById: () => null };
body.ownerDocument = document;
const context = vm.createContext({
  document, Element, HTMLInputElement: Input, HTMLSelectElement: class {}, HTMLTextAreaElement: class {},
  Node: { TEXT_NODE: 3, ELEMENT_NODE: 1 }, CSS: { escape: (text) => text },
});
vm.runInContext(between("const AUTOCOMPLETE_MAP", "let lastUserTarget"), context);
vm.runInContext(between("function normalizeMatchText", "function directText"), context);
vm.runInContext(between("function cleanFieldLabelText", "function sectionFromText"), context);
vm.runInContext(between("function classifyStructuredField", "function isVisible"), context);

function field(label, wrappers = []) {
  const group = body.append(new Element("div", "form-item form-item--phoenix"));
  group.append(new Element("label", "form-item__label", label));
  let parent = group.append(new Element("div", "form-item__control"));
  for (const cls of wrappers) parent = parent.append(new Element("div", cls));
  return parent.append(new Input());
}
const phoenixLayers = [
  "phoenix-unmodeled-layer block", "phoenix-unmodeled-layer__inner",
  "phoenix-unmodeled-layer__protect", "phoenix-unmodeled-layer__content",
  "phoenix-select", "phoenix-select__content", "phoenix-select__inputWrapper",
];
for (const [label, key] of [
  ["政治面貌", "politicalStatus"], ["民族", "ethnicity"], ["婚姻状况", "maritalStatus"],
  ["籍贯（具体到市/区）", "nativePlace"], ["政治面貌参加年月", "partyJoinDate"],
  ["出生日期", "birthDate"], ["入学时间", null],
]) {
  context.field = field(label, phoenixLayers);
  assert.equal(vm.runInContext("textOfLabel(field)", context), label);
  assert.equal(vm.runInContext("classifyBasicField(field)", context), key);
}
context.field = field("毕业日期", Array(12).fill("unlabelled-wrapper"));
assert.equal(vm.runInContext("textOfLabel(field)", context), "毕业日期", "深层容器仍能读取自己的标签");
// Shanghai Bank uses the same deep Phoenix wrappers for both date endpoints.
// Basic-label fixes must not change the source key of education/work dates.
for (const section of ["education", "work", "project", "practice"]) {
  for (const [label, key] of [["开始时间", "startDate"], ["结束时间", "endDate"]]) {
    context.field = field(label, phoenixLayers);
    context.section = section;
    assert.equal(vm.runInContext("textOfLabel(field)", context), label);
    assert.equal(vm.runInContext("classifyStructuredField(field, section)", context), key);
  }
}
const anonymousGroup = body.append(new Element());
anonymousGroup.append(new Element("span", "", "民族"));
let anonymousParent = anonymousGroup;
for (let i = 0; i < 10; i++) anonymousParent = anonymousParent.append(new Element());
context.field = anonymousParent.append(new Input());
assert.equal(vm.runInContext("textOfLabel(field)", context), "民族", "没有标准 form-item 也能读取深层相邻标签");

// Do not borrow a neighbouring labelled field, or a committed cascader value.
const row = body.append(new Element("div", "form-item"));
const unknownGroup = row.append(new Element("div", "form-item"));
context.field = unknownGroup.append(new Input());
const sibling = row.append(new Element("div", "form-item"));
sibling.append(new Element("label", "", "姓名"));
sibling.append(new Input());
assert.equal(vm.runInContext("textOfLabel(field)", context), "");
const locationInput = field("户籍");
const cascader = locationInput.parentElement.append(new Element("div", "ant-cascader-picker"));
cascader.append(new Element("span", "ant-cascader-picker-label", "某省某市"));
context.field = locationInput;
assert.equal(vm.runInContext("textOfLabel(field)", context), "户籍");

for (const label of [
  "如有亲属在本集团工作，请在此补充亲属姓名、和本人关系，如无请填写无",
  "在校期间是否有过惩处，如有请描述惩处类别、发生日期、给予惩处单位、是否解除以及解除日期",
  "亲属姓名", "配偶出生日期", "母亲联系方式", "事故发生日期",
  "家属的姓名", "亲属所在单位", "家庭成员政治面貌", "导师联系电话",
]) {
  context.field = field(label);
  assert.equal(vm.runInContext("classifyBasicField(field)", context), null, label);
  assert.equal(vm.runInContext("basicFieldRequiresReview(field)", context), true, label);
}
for (const [label, key] of [
  ["姓名", "fullName"], ["生日", "birthDate"], ["您的生日", "birthDate"],
  ["紧急联系人姓名", "emergencyContactName"], ["紧急联系电话", "emergencyContactPhone"],
  ["是否接受岗位调剂", "willingToRelocate"], ["期望税前年薪（万元）", "expectedAnnualSalary"],
  ["个人特长和爱好", "strengths"], ["出生年月日", "birthDate"],
]) {
  context.field = field(label);
  assert.equal(vm.runInContext("classifyBasicField(field)", context), key, label);
}
context.label = "发生日期";
assert.equal(vm.runInContext("COMPACT_CJK_RULES.find(([, re])=>re.test(label))?.[0]", context), undefined,
  "发生日期中的生日二字不得识别为出生日期");

async function testFallbackAndSpeed() {
  let popupCalls = 0;
  const locations = vm.createContext({
    HTMLSelectElement: class {}, splitLocationValue: (v) => v.split("/"),
    isCustomControl: () => false, cascaderWrapper: () => null, locationLevelForField: () => null,
    hasLocationControlHints: () => true,
    setNativeValue: (e, v) => { e.value = v; },
    setGenericPopupLocationValue: async () => { popupCalls++; return true; },
    setPhoenixAreaValue: async () => { popupCalls++; return true; },
  });
  vm.runInContext(between("function hasLocationPopupEvidence", "function dateFormatHints"), locations);
  const plain = new Input();
  locations.field = plain;
  assert.equal(await vm.runInContext("setLocationControlValue(field,'某省/某市/某区')", locations), true);
  assert.equal(plain.value, "某省/某市/某区");
  assert.equal(popupCalls, 0, "普通地址输入框不应花两秒轮询弹层");
  for (const attribute of ["onfocus", "onclick", "aria-haspopup", "aria-controls", "list"]) {
    locations.field = new Input();
    locations.field.attributes[attribute] = "popup";
    const before = popupCalls;
    assert.equal(await vm.runInContext("setLocationControlValue(field,'某省/某市')", locations), true);
    assert.equal(popupCalls, before + 1, `${attribute} 控件保留原有弹层适配`);
  }
  locations.field = new Input();
  locations.field.readOnly = true;
  const beforeReadonly = popupCalls;
  assert.equal(await vm.runInContext("setLocationControlValue(field,'某省/某市')", locations), true);
  assert.equal(popupCalls, beforeReadonly + 1);

  const successful = field("姓名"), existing = field("邮箱"), missing = field("毕业时间");
  const unknown = field("陌生字段"), failed = field("民族"), structured = field("姓名");
  const disabled = field("姓名");
  existing.value = "existing@example.test";
  disabled.disabled = true;
  structured.structured = true;
  const controls = [successful, existing, missing, unknown, failed, structured, disabled];
  context.collectControls = () => controls;
  context.isVisible = () => true;
  context.confirmedStructuredSection = (e) => e.structured ? "family" : null;
  context.aiHasExistingValue = (e) => Boolean(e.value);
  context.profileValue = (p, key) => p[key] || "";
  context.customFieldValue = () => "";
  context.payload = { profile: { fullName: "测试姓名", email: "test@example.test", ethnicity: "汉族" }, customFields: [] };
  context.done = new WeakSet([successful]);
  vm.runInContext(between("function aiBasicTargetElements", "function aiDescribeElements"), context);
  const remaining = vm.runInContext("aiBasicTargetElements(false,done,payload)", context);
  assert.deepEqual(Array.from(remaining), [unknown, failed],
    "AI 只检查未解决字段，不重新分析成功、已有值、缺资料、禁用或经历字段");
  const overwrite = vm.runInContext("aiBasicTargetElements(true,done,payload)", context);
  assert.deepEqual(Array.from(overwrite), [existing, unknown, failed],
    "显式覆盖仍允许已有值，本轮已成功填写的控件仍不重复请求 AI");

  // High confidence and remembered mappings do not waive review for explanatory
  // questions. Exercise the production orchestration, not just the classifier.
  const question = field("请描述惩处的发生日期、事由及解除日期");
  context.question = question;
  context.aiReviewCleanup = null;
  context.aiSources = () => [{ key: "birthDate", label: "出生日期", keywords: "" }];
  context.aiSourceValue = () => "2000-01-01";
  context.aiDescribeElements = (_section, elements) => elements.map((element, i) => ({
    element, id: `f${i}`, fingerprint: `q${i}`, label: element.parentElement.textContent,
  }));
  context.aiRequestMappings = async () => ({ ok: true, siteKey: "test", mappings: [
    { fieldId: "f0", sourceKey: "birthDate", confidence: 1 },
  ], rememberedForSite: { q0: "birthDate" } });
  context.aiExpectedSource = () => null;
  context.aiValuesEquivalent = () => false;
  let writes = 0, review = [];
  context.aiFillOne = async () => { writes++; return true; };
  context.aiShowReview = (_section, _payload, pending) => { review = pending; };
  vm.runInContext(between("function createReport", "function chinaMobileFamilyEditor"), context);
  vm.runInContext(between("async function fillWithAi", "// The bundled demo page"), context);
  const report = await vm.runInContext("fillWithAi('basic',payload,false,{status:'ready',elements:[question]})", context);
  assert.equal(report.pendingReview, 1);
  assert.equal(review.length, 1);
  assert.equal(writes, 0, "AI 即使高置信或记住旧错误映射，也不能自动写说明题");

  let requests = 0;
  context.aiDescribeElements = () => [];
  context.aiRequestMappings = async () => { requests++; throw new Error("不应发起云端请求"); };
  await vm.runInContext("fillWithAi('basic',payload,false,{status:'ready',elements:[]})", context);
  assert.equal(requests, 0, "没有剩余字段时不请求 AI");

  let sent = null, cleanupCount = 0;
  context.aiReviewCleanup = () => { cleanupCount++; };
  context.fillPage = async (_payload, state, report) => {
    state.filledElements.add(successful);
    report.filled = 1;
    report.sections.basic = 1;
  };
  context.wait = async () => {};
  context.fillWithAi = async (_section, _payload, _overwrite, selected) => {
    sent = selected.elements;
    return { status: "no_match", pendingReview: 0, ...vm.runInContext("createReport()", context) };
  };
  vm.runInContext(between("async function fillPageWithRetries", "function sanitizeAiText"), context);
  await vm.runInContext("fillBasicWithAi(payload)", context);
  assert.deepEqual(Array.from(sent), [unknown, failed]);
  assert.equal(cleanupCount, 1, "新一次基础填写应清除上一轮确认框");
}

testFallbackAndSpeed().then(() => console.log("通用深层标签、语义边界、AI 剩余字段与地址快路径测试通过"), (error) => {
  console.error(error);
  process.exitCode = 1;
});
