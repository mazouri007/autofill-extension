const PROFILE_GROUPS = {
  basic: [
    "lastName", "firstName", "fullName", "nickname", "gender", "birthDate",
    "height", "weight", "healthStatus", "strengths", "workYears",
    "email", "phone", "wechat", "website", "documentType", "documentNumber",
    "addressLine1", "addressLine2", "city", "province", "postalCode", "country",
    "householdRegistration", "nativePlace", "studentOrigin", "birthPlace", "currentResidence",
    "emergencyContactName", "emergencyContactPhone",
  ],
};

const LOCATION_PROFILE_KEYS = [
  "householdRegistration", "nativePlace", "studentOrigin", "birthPlace", "currentResidence",
];

function splitLocationValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];
  const separated = raw.split(/\s*(?:\/|／|>|›|→|\||,|，|;|；)\s*|\s+/).filter(Boolean);
  if (separated.length > 1) return separated.slice(0, 3);
  const compact = raw.replace(/[^\p{L}\p{N}]/gu, "");
  const matched = compact.match(/.+?(?:特别行政区|自治区|自治州|地区|省|市|盟|区|县|旗)/g) || [];
  return matched.length > 1 && matched.join("") === compact ? matched.slice(0, 3) : [raw];
}

function structuredLocation(value) {
  const parts = splitLocationValue(value);
  if (parts.length === 2 && /^(?:北京市|上海市|天津市|重庆市)$/.test(parts[0]) &&
    /(?:区|县|旗)$/.test(parts[1])) {
    return { province: parts[0], city: parts[0], district: parts[1] };
  }
  const [province = "", city = "", district = ""] = parts;
  return { province, city, district };
}

function locationDisplayValue(profile, key) {
  if (typeof profile?.[key] === "string" && profile[key]) return profile[key];
  const location = profile?.locations?.[key];
  if (!location || typeof location !== "object") return "";
  return [location.province, location.city, location.district].filter(Boolean).join(" / ");
}

const RECORD_TYPES = {
  educations: {
    countId: "educationCount",
    headingCountId: "educationHeadingCount",
    title: "教育经历",
    summaryKeys: ["school", "educationLevel", "major"],
    fields: [
      { key: "school", label: "学校名称", placeholder: "例如：复旦大学", required: true },
      { key: "educationLevel", label: "学历阶段", type: "select", options: ["", "高中", "大专", "本科", "硕士", "博士", "其他"], required: true },
      { key: "educationType", label: "学历类型", type: "select", options: ["", "全日制", "非全日制", "其他"] },
      { key: "degree", label: "学位", placeholder: "例如：工学学士" },
      { key: "degreeType", label: "学位类型", placeholder: "例如：普通学位" },
      { key: "major", label: "主修专业", placeholder: "例如：计算机科学与技术", required: true },
      { key: "college", label: "学院 / 院系", placeholder: "例如：计算机科学技术学院" },
      { key: "location", label: "学校所在地", placeholder: "例如：上海市" },
      { key: "classRanking", label: "班级排名", placeholder: "例如：前 10%" },
      { key: "startDate", label: "入学时间", type: "date" },
      { key: "endDate", label: "毕业时间", type: "date" },
      { key: "current", label: "目前在读", type: "checkbox" },
      { key: "primary", label: "主要教育经历", type: "checkbox" },
      { key: "description", label: "在校经历 / 补充说明", type: "textarea", placeholder: "课程、排名、学生干部或其他经历", wide: true, maxLength: 2000 },
    ],
  },
  workExperiences: {
    countId: "workCount",
    headingCountId: "workHeadingCount",
    title: "工作经历",
    summaryKeys: ["company", "position"],
    fields: [
      { key: "company", label: "工作单位 / 公司", placeholder: "例如：某科技有限公司", required: true },
      { key: "companyType", label: "单位类别 / 性质", placeholder: "例如：民营企业" },
      { key: "position", label: "工作岗位 / 职位", placeholder: "例如：前端工程师", required: true },
      { key: "department", label: "部门", placeholder: "例如：研发部" },
      { key: "location", label: "工作地点", placeholder: "例如：上海市" },
      { key: "workType", label: "工作形式", type: "select", options: ["", "全职", "实习", "兼职", "其他"] },
      { key: "level", label: "岗位级别", placeholder: "例如：高级 / 经理" },
      { key: "startDate", label: "开始时间", type: "date" },
      { key: "endDate", label: "结束时间", type: "date" },
      { key: "current", label: "至今 / 在职", type: "checkbox" },
      { key: "responsibilities", label: "工作内容", type: "textarea", placeholder: "职责、工作内容和使用的技能", wide: true, maxLength: 3000 },
      { key: "achievements", label: "工作业绩", type: "textarea", placeholder: "可量化的成果或代表性贡献", wide: true, maxLength: 3000 },
    ],
  },
  projects: {
    countId: "projectCount",
    headingCountId: "projectHeadingCount",
    title: "项目经历",
    summaryKeys: ["name", "role"],
    fields: [
      { key: "name", label: "项目名称", placeholder: "例如：招聘管理平台", required: true },
      { key: "role", label: "项目角色", placeholder: "例如：项目负责人" },
      { key: "company", label: "所属单位", placeholder: "公司、学校或组织" },
      { key: "technologies", label: "技术 / 工具", placeholder: "例如：Vue、Node.js" },
      { key: "startDate", label: "开始时间", type: "date" },
      { key: "endDate", label: "结束时间", type: "date" },
      { key: "current", label: "仍在进行", type: "checkbox" },
      { key: "description", label: "项目描述", type: "textarea", placeholder: "项目背景、目标及主要工作", wide: true, maxLength: 3000 },
      { key: "achievements", label: "项目成果", type: "textarea", placeholder: "结果、数据指标或个人贡献", wide: true, maxLength: 3000 },
    ],
  },
  familyMembers: {
    countId: "familyCount",
    headingCountId: "familyHeadingCount",
    title: "家庭成员",
    summaryKeys: ["relativeName", "relationship"],
    fields: [
      { key: "relativeName", label: "亲属姓名", placeholder: "例如：张三", required: true },
      { key: "relationship", label: "与本人关系", placeholder: "例如：父亲", required: true },
      { key: "birthDate", label: "出生日期", type: "date" },
      { key: "gender", label: "性别", type: "select", options: ["", "男", "女", "其他"] },
      { key: "worksInSystem", label: "是否移动系统内任职", type: "select", options: ["", "是", "否"] },
      { key: "employer", label: "亲属工作单位", placeholder: "请输入亲属工作单位" },
      { key: "position", label: "亲属职位", placeholder: "请输入亲属职位" },
      { key: "phone", label: "联系电话", placeholder: "请输入联系电话" },
      { key: "politicalStatus", label: "政治面貌", placeholder: "例如：群众" },
      { key: "currentAddress", label: "现居住地址", placeholder: "省、市、区及详细地址", wide: true },
    ],
  },
};

const navButtons = Array.from(document.querySelectorAll("[data-section]"));
const panels = Array.from(document.querySelectorAll("[data-panel]"));
const profileInputs = Array.from(document.querySelectorAll("[data-profile-key]"));
const customFieldsList = document.querySelector("#customFieldsList");
const customFieldsEmpty = document.querySelector("#customFieldsEmpty");
const noSearchResult = document.querySelector("#noSearchResult");
const customSearch = document.querySelector("#customSearch");
const filterResult = document.querySelector("#filterResult");
const addCustomFieldButton = document.querySelector("#addCustomField");
const saveButton = document.querySelector("#saveProfile");
const saveStatus = document.querySelector("#saveStatus");
const overwriteToggle = document.querySelector("#overwriteExisting");
const aiEnabledToggle = document.querySelector("#aiEnabled");
const deepseekApiKeyInput = document.querySelector("#deepseekApiKey");
const testAiConnectionButton = document.querySelector("#testAiConnection");
const toast = document.querySelector("#toast");

let customFields = [];
let resumeData = blankResumeData();
let toastTimer;
let isDirty = false;

function createId(prefix = "record") {
  return crypto.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function blankCustomField() {
  return { id: createId("custom"), label: "", value: "", keywords: "" };
}

function blankResumeData() {
  return {
    schemaVersion: 3,
    educations: [],
    workExperiences: [],
    projects: [],
    familyMembers: [],
  };
}

function blankRecord(type) {
  const record = { id: createId(type) };
  for (const field of RECORD_TYPES[type].fields) {
    record[field.key] = field.type === "checkbox" ? false : "";
  }
  return record;
}

function normalizeCustomFields(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 500).map((item) => ({
    id: String(item?.id || createId("custom")),
    label: String(item?.label || "").slice(0, 80),
    value: String(item?.value || "").slice(0, 1000),
    keywords: String(item?.keywords || "")
      .replace(/[,，;；|\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300),
  }));
}

function normalizeRecordDate(value, key) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!match) return value;
  const [, year, month, suppliedDay] = match;
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  if (Number(month) < 1 || Number(month) > 12 ||
    (suppliedDay && (Number(suppliedDay) < 1 || Number(suppliedDay) > lastDay))) return value;
  const day = suppliedDay || (key === "endDate" ? String(lastDay).padStart(2, "0") : "01");
  return `${year}-${month}-${day}`;
}

function normalizeRecord(type, item) {
  const record = { id: String(item?.id || createId(type)) };
  for (const field of RECORD_TYPES[type].fields) {
    if (field.type === "checkbox") {
      record[field.key] = Boolean(item?.[field.key]);
      continue;
    }
    const maxLength = field.maxLength || 500;
    let value = String(item?.[field.key] || "").trim().slice(0, maxLength);
    if (field.type === "date") value = normalizeRecordDate(value, field.key);
    record[field.key] = value;
  }
  return record;
}

function normalizeResumeData(value) {
  const normalized = blankResumeData();
  for (const type of Object.keys(RECORD_TYPES)) {
    const items = Array.isArray(value?.[type]) ? value[type] : [];
    normalized[type] = items.slice(0, 30).map((item) => normalizeRecord(type, item));
  }
  return normalized;
}

function showToast(message, isError = false, durationMs = 2000) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), durationMs);
}

function aiConnectionError(error) {
  const messages = {
    invalid_key: "API Key 无效（401）",
    http_402: "DeepSeek 账户余额不足（402）",
    http_403: "DeepSeek 拒绝访问（403）",
    http_429: "请求过于频繁（429）",
    model_unavailable: "当前 Key 无法使用 deepseek-flash 模型",
    network: "无法连接 DeepSeek，请检查网络或代理",
    not_configured: "尚未保存 API Key",
    forbidden: "插件内部权限检查失败",
  };
  return messages[error] || `连接异常（${error || "无响应"}）`;
}

function setDirty(dirty = true) {
  isDirty = dirty;
  saveStatus.textContent = dirty ? "有未保存修改" : "已保存";
  saveStatus.classList.toggle("dirty", dirty);
}

function readProfile() {
  const profile = Object.fromEntries(
    profileInputs.map((input) => [input.dataset.profileKey, input.value.trim()]),
  );
  profile.locationSchemaVersion = 1;
  profile.locations = Object.fromEntries(
    LOCATION_PROFILE_KEYS.map((key) => [key, structuredLocation(profile[key])]),
  );
  return profile;
}

function readCustomFields() {
  return Array.from(customFieldsList.querySelectorAll(".custom-row"), (row) => ({
    id: row.dataset.id,
    label: row.querySelector('[data-custom-key="label"]').value.trim(),
    value: row.querySelector('[data-custom-key="value"]').value.trim(),
    keywords: row.querySelector('[data-custom-key="keywords"]').value.trim(),
  }));
}

function readRecords(type) {
  const list = document.querySelector(`[data-record-list="${type}"]`);
  return Array.from(list.querySelectorAll(".record-card"), (card) => {
    const record = { id: card.dataset.id };
    for (const input of card.querySelectorAll("[data-record-key]")) {
      record[input.dataset.recordKey] = input.type === "checkbox" ? input.checked : input.value.trim();
    }
    return record;
  });
}

function syncRecordState(type) {
  resumeData[type] = normalizeResumeData({ [type]: readRecords(type) })[type];
}

function rowSearchText(row) {
  return Array.from(row.querySelectorAll("input"), (input) => input.value.toLowerCase()).join(" ");
}

function applyCustomFilter() {
  const query = customSearch.value.trim().toLowerCase();
  const rows = Array.from(customFieldsList.querySelectorAll(".custom-row"));
  let visibleCount = 0;

  rows.forEach((row) => {
    const visible = !query || rowSearchText(row).includes(query);
    row.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  customFieldsEmpty.hidden = rows.length > 0;
  noSearchResult.hidden = !query || visibleCount > 0 || rows.length === 0;
  filterResult.textContent = query && rows.length ? `显示 ${visibleCount} / ${rows.length}` : "";
}

function updateCounts() {
  const profile = readProfile();
  for (const [group, keys] of Object.entries(PROFILE_GROUPS)) {
    document.querySelector(`#${group}Count`).textContent = keys.filter((key) => profile[key]).length;
  }

  const customCount = customFieldsList.querySelectorAll(".custom-row").length;
  document.querySelector("#customCount").textContent = customCount;
  document.querySelector("#customHeadingCount").textContent = customCount;

  for (const [type, definition] of Object.entries(RECORD_TYPES)) {
    const count = document.querySelector(`[data-record-list="${type}"]`).querySelectorAll(".record-card").length;
    document.querySelector(`#${definition.countId}`).textContent = count;
    document.querySelector(`#${definition.headingCountId}`).textContent = count;
    document.querySelector(`[data-record-empty="${type}"]`).hidden = count > 0;
  }
}

function renderCustomFields({ focusId } = {}) {
  customFieldsList.replaceChildren();

  customFields.forEach((item) => {
    const row = document.createElement("div");
    row.className = "custom-row";
    row.dataset.id = item.id;
    row.innerHTML = `
      <div class="custom-cell"><input data-custom-key="label" maxlength="80" aria-label="项目名称" placeholder="例如：微信号" /></div>
      <div class="custom-cell"><input data-custom-key="value" maxlength="1000" aria-label="填写内容" placeholder="填写内容" /></div>
      <div class="custom-cell"><input data-custom-key="keywords" maxlength="300" aria-label="匹配关键词" placeholder="多个关键词用空格分隔" /></div>
      <button class="remove-button" type="button" aria-label="删除项目">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>
      </button>
    `;

    for (const input of row.querySelectorAll("[data-custom-key]")) {
      input.value = item[input.dataset.customKey] || "";
    }
    customFieldsList.append(row);
  });

  applyCustomFilter();
  updateCounts();
  if (focusId) {
    customFieldsList.querySelector(`[data-id="${CSS.escape(focusId)}"] [data-custom-key="label"]`)?.focus();
  }
}

function createRecordControl(field, value) {
  const label = document.createElement("label");
  label.className = field.wide ? "wide" : "";
  if (field.type === "checkbox") label.classList.add("record-checkbox");

  const labelText = document.createElement("span");
  labelText.textContent = field.required ? `${field.label} *` : field.label;
  label.append(labelText);

  let control;
  if (field.type === "textarea") {
    control = document.createElement("textarea");
    control.rows = 4;
  } else if (field.type === "select") {
    control = document.createElement("select");
    for (const optionValue of field.options) {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue || "请选择";
      control.append(option);
    }
  } else {
    control = document.createElement("input");
    control.type = field.type || "text";
  }

  control.dataset.recordKey = field.key;
  control.setAttribute("aria-label", field.label);
  if (field.placeholder) control.placeholder = field.placeholder;
  if (field.maxLength) control.maxLength = field.maxLength;
  if (field.type === "checkbox") control.checked = Boolean(value);
  else control.value = String(value || "");
  label.append(control);
  return label;
}

function recordSummary(type, record, index) {
  const parts = RECORD_TYPES[type].summaryKeys.map((key) => record[key]).filter(Boolean);
  return parts.length ? parts.join(" · ") : `${RECORD_TYPES[type].title} ${index + 1}`;
}

function renderRecordList(type, { focusId } = {}) {
  const definition = RECORD_TYPES[type];
  const list = document.querySelector(`[data-record-list="${type}"]`);
  list.replaceChildren();

  resumeData[type].forEach((record, index) => {
    const card = document.createElement("article");
    card.className = "record-card";
    card.dataset.id = record.id;

    const header = document.createElement("header");
    const heading = document.createElement("div");
    const position = document.createElement("span");
    const summary = document.createElement("strong");
    position.textContent = `${index + 1}`;
    summary.textContent = recordSummary(type, record, index);
    heading.append(position, summary);

    const actions = document.createElement("div");
    actions.className = "record-actions";
    for (const [action, title, glyph] of [
      ["up", "上移", "↑"],
      ["down", "下移", "↓"],
      ["remove", "删除", "×"],
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.recordAction = action;
      button.title = title;
      button.setAttribute("aria-label", `${title}${definition.title}`);
      button.textContent = glyph;
      if ((action === "up" && index === 0) || (action === "down" && index === resumeData[type].length - 1)) {
        button.disabled = true;
      }
      actions.append(button);
    }
    header.append(heading, actions);

    const grid = document.createElement("div");
    grid.className = "record-grid";
    for (const field of definition.fields) grid.append(createRecordControl(field, record[field.key]));
    card.append(header, grid);
    list.append(card);
  });

  updateCounts();
  if (focusId) {
    list.querySelector(`[data-id="${CSS.escape(focusId)}"] [data-record-key]`)?.focus();
  }
}

function setActiveSection(section) {
  const selected = panels.find((panel) => panel.dataset.panel === section) ? section : "basic";
  navButtons.forEach((button) => {
    const active = button.dataset.section === selected;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  panels.forEach((panel) => {
    const active = panel.dataset.panel === selected;
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });
  history.replaceState(null, "", `#${selected}`);
}

async function saveProfile() {
  const apiKey = deepseekApiKeyInput.value.trim();
  if (aiEnabledToggle.checked && !apiKey) {
    showToast("启用 AI 前请填写 DeepSeek API Key", true);
    return;
  }
  customFields = normalizeCustomFields(readCustomFields());
  for (const type of Object.keys(RECORD_TYPES)) syncRecordState(type);
  const profile = readProfile();
  const settings = {
    overwriteExisting: overwriteToggle.checked,
  };

  await chrome.storage.local.set({
    profile, customFields, resumeData, settings,
    aiConfig: { enabled: aiEnabledToggle.checked, apiKey },
  });
  setDirty(false);
  showToast("资料已保存到当前浏览器");
}

async function loadProfile() {
  const stored = await chrome.storage.local.get(["profile", "customFields", "resumeData", "settings", "aiConfig"]);
  const profile = stored.profile || {};

  profileInputs.forEach((input) => {
    input.value = locationDisplayValue(profile, input.dataset.profileKey) || profile[input.dataset.profileKey] || "";
  });
  customFields = normalizeCustomFields(stored.customFields);
  resumeData = normalizeResumeData(stored.resumeData);
  overwriteToggle.checked = Boolean(stored.settings?.overwriteExisting);
  aiEnabledToggle.checked = Boolean(stored.aiConfig?.enabled);
  deepseekApiKeyInput.value = stored.aiConfig?.apiKey || "";
  renderCustomFields();
  for (const type of Object.keys(RECORD_TYPES)) renderRecordList(type);
  setActiveSection(location.hash.slice(1) || "basic");
  setDirty(false);
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveSection(button.dataset.section));
});

profileInputs.forEach((input) => {
  input.addEventListener("input", () => {
    updateCounts();
    setDirty();
  });
});

customFieldsList.addEventListener("input", () => {
  applyCustomFilter();
  setDirty();
});

customFieldsList.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-button");
  if (!removeButton) return;
  const row = removeButton.closest(".custom-row");
  customFields = readCustomFields().filter((item) => item.id !== row.dataset.id);
  renderCustomFields();
  setDirty();
});

customSearch.addEventListener("input", applyCustomFilter);

addCustomFieldButton.addEventListener("click", () => {
  customFields = readCustomFields();
  if (customFields.length >= 500) {
    showToast("最多可保存 500 个自定义项目", true);
    return;
  }

  const item = blankCustomField();
  customFields.push(item);
  customSearch.value = "";
  renderCustomFields({ focusId: item.id });
  setDirty();
});

for (const [type] of Object.entries(RECORD_TYPES)) {
  const list = document.querySelector(`[data-record-list="${type}"]`);
  list.addEventListener("input", () => {
    syncRecordState(type);
    setDirty();
  });
  list.addEventListener("change", () => {
    syncRecordState(type);
    setDirty();
  });
  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-record-action]");
    if (!button) return;
    syncRecordState(type);
    const card = button.closest(".record-card");
    const index = resumeData[type].findIndex((item) => item.id === card.dataset.id);
    if (index < 0) return;

    if (button.dataset.recordAction === "remove") {
      resumeData[type].splice(index, 1);
    } else {
      const offset = button.dataset.recordAction === "up" ? -1 : 1;
      const targetIndex = index + offset;
      if (targetIndex < 0 || targetIndex >= resumeData[type].length) return;
      [resumeData[type][index], resumeData[type][targetIndex]] = [resumeData[type][targetIndex], resumeData[type][index]];
    }
    renderRecordList(type);
    setDirty();
  });
}

for (const button of document.querySelectorAll("[data-add-record]")) {
  button.addEventListener("click", () => {
    const type = button.dataset.addRecord;
    syncRecordState(type);
    if (resumeData[type].length >= 30) {
      showToast("每类经历最多保存 30 条", true);
      return;
    }
    const record = blankRecord(type);
    resumeData[type].push(record);
    renderRecordList(type, { focusId: record.id });
    setDirty();
  });
}

overwriteToggle.addEventListener("change", () => setDirty());
aiEnabledToggle.addEventListener("change", () => setDirty());
deepseekApiKeyInput.addEventListener("input", () => setDirty());
testAiConnectionButton.addEventListener("click", async () => {
  if (isDirty) {
    showToast("请先保存 AI 设置，再测试连接", true);
    return;
  }
  testAiConnectionButton.disabled = true;
  try {
    const result = await chrome.runtime.sendMessage({ type: "AI_TEST_CONNECTION" });
    showToast(result?.ok ? "DeepSeek 连接成功" : `连接失败：${aiConnectionError(result?.error)}`,
      !result?.ok, 5000);
  } catch (_) {
    showToast("连接失败：插件消息未送达，请重新加载扩展", true, 5000);
  } finally {
    testAiConnectionButton.disabled = false;
  }
});

saveButton.addEventListener("click", () => {
  saveProfile().catch(() => showToast("保存失败，请稍后再试", true));
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveButton.click();
  }
});

window.addEventListener("beforeunload", (event) => {
  if (!isDirty) return;
  event.preventDefault();
  event.returnValue = "";
});

loadProfile().catch(() => showToast("读取本地资料失败", true));
