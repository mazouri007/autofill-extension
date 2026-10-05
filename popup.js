const PROFILE_KEYS = [
  "lastName", "firstName", "fullName", "nickname", "gender", "birthDate",
  "ethnicity", "politicalStatus", "partyJoinDate", "maritalStatus", "graduationDate",
  "email", "phone", "wechat", "website", "documentType", "documentNumber",
  "addressLine1", "addressLine2", "city", "province", "postalCode", "country",
  "householdRegistration", "nativePlace", "studentOrigin", "birthPlace", "currentResidence",
  "height", "weight", "healthStatus", "strengths", "workYears",
  "emergencyContactName", "emergencyContactPhone", "communicationAddress",
  "willingToRelocate", "willingCountyWork", "relativesInGroup", "relativesRetiredRecently",
  "hasScholarship", "studentLeader", "preferredWorkCity", "expectedAnnualSalary",
  "hobbies", "advantagesWeaknesses", "selfEvaluation",
];

const fillButton = document.querySelector("#fillPage");
const manageProfileButton = document.querySelector("#manageProfile");
const recordPicker = document.querySelector("#recordPicker");
const toast = document.querySelector("#toast");
const aiModeBadge = document.querySelector("#aiModeBadge");

const RECORD_TYPES = [
  { key: "educations", label: "教育经历", summary: (item) => [item.school, item.educationLevel, item.major] },
  { key: "workExperiences", label: "工作 / 实习经历", summary: (item) => [item.company, item.position, item.workType] },
  { key: "projects", label: "项目经历", summary: (item) => [item.name, item.role] },
  { key: "extracurricularPractices", label: "校外实践", summary: (item) => [item.organization, item.startDate, item.endDate] },
  { key: "awards", label: "奖励信息", summary: (item) => [item.awardName, item.awardLevel, item.awardDate] },
  { key: "familyMembers", label: "家庭成员", summary: (item) => [item.relativeName, item.relationship] },
];

let toastTimer;
let popupFillPending = false;

function showToast(message, isError = false) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 4000);
}

function countBasicItems(profile = {}, customFields = []) {
  return PROFILE_KEYS.filter((key) => String(profile[key] || "").trim()).length +
    customFields.filter((item) => item?.label && item?.value).length;
}

async function sendMessageWithRecovery(tabId, message, options) {
  try {
    return await chrome.tabs.sendMessage(tabId, message, options);
  } catch (initialError) {
    if (!chrome.scripting?.executeScript) throw initialError;
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ["content.js"],
    });
    return chrome.tabs.sendMessage(tabId, message, options);
  }
}

async function queueFillAfterPopupCloses(tabId, request) {
  if (popupFillPending) return;
  popupFillPending = true;
  try {
    // Only the main frame coordinates focus. The existing fill request is later
    // broadcast to all frames, so embedded recruitment forms keep working.
    const response = await sendMessageWithRecovery(tabId, {
      type: "QUEUE_FILL_AFTER_POPUP_CLOSES", request,
    }, { frameId: 0 });
    if (response?.queued) {
      window.close();
      return;
    }
    showToast(response?.error === "busy"
      ? "当前网页正在填写，请完成后再试"
      : "页面暂时无法接收填写请求，请重新加载插件后重试", true);
  } finally {
    popupFillPending = false;
  }
}

function renderRecordPicker(resumeData = {}) {
  recordPicker.replaceChildren();
  let anyRecords = false;
  let openedGroup = false;
  for (const type of RECORD_TYPES) {
    const records = Array.isArray(resumeData[type.key]) ? resumeData[type.key] : [];
    if (!records.length) continue;
    anyRecords = true;
    const details = document.createElement("details");
    details.className = "record-type";
    details.open = !openedGroup;
    openedGroup = true;
    const heading = document.createElement("summary");
    heading.textContent = `${type.label} · ${records.length}`;
    details.append(heading);
    for (const [index, item] of records.entries()) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "record-fill-button";
      button.dataset.recordType = type.key;
      button.dataset.recordId = item.id || "";
      button.dataset.recordIndex = String(index);
      const title = document.createElement("span");
      title.textContent = type.summary(item).filter(Boolean).join(" · ") || `${type.label} ${index + 1}`;
      const action = document.createElement("span");
      action.textContent = "填入";
      button.append(title, action);
      details.append(button);
    }
    recordPicker.append(details);
  }
  if (!anyRecords) {
    const empty = document.createElement("p");
    empty.className = "record-picker-empty";
    empty.textContent = "尚未保存经历、校外实践、奖励或家庭成员，可在资料管理页新增。";
    recordPicker.append(empty);
  }
}

async function loadRecords() {
  const { resumeData, aiConfig } = await chrome.storage.local.get(["resumeData", "aiConfig"]);
  renderRecordPicker(resumeData);
  if (aiConfig?.enabled && aiConfig?.apiKey) aiModeBadge.lastChild.textContent = " AI 辅助已开启";
}

async function sendFillRequest() {
  const stored = await chrome.storage.local.get(["profile", "customFields", "settings", "aiConfig"]);
  if (!countBasicItems(stored.profile, stored.customFields)) {
    showToast("请先添加个人信息或自定义项目", true);
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    showToast("没有找到当前网页", true);
    return;
  }

  try {
    const useAi = Boolean(stored.aiConfig?.enabled && stored.aiConfig?.apiKey);
    await queueFillAfterPopupCloses(tab.id, {
      type: "FILL_PERSONAL_INFO",
      profile: stored.profile || {},
      customFields: stored.customFields || [],
      overwriteExisting: Boolean(stored.settings?.overwriteExisting),
      useAi,
    });
  } catch (_) {
    showToast("页面连接失败，请刷新当前网页后重试", true);
  }
}

async function sendManualFillRequest(button) {
  const { resumeData = {}, settings = {}, aiConfig = {} } = await chrome.storage.local.get(["resumeData", "settings", "aiConfig"]);
  const type = button.dataset.recordType;
  const record = (resumeData[type] || []).find((item) => item.id === button.dataset.recordId) ||
    (resumeData[type] || [])[Number(button.dataset.recordIndex)];
  if (!record) {
    showToast("这条资料已变化，请重新打开插件", true);
    return;
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    showToast("没有找到当前网页", true);
    return;
  }
  button.disabled = true;
  try {
    const useAi = Boolean(aiConfig.enabled && aiConfig.apiKey);
    await queueFillAfterPopupCloses(tab.id, {
      type: "FILL_SELECTED_RECORD",
      recordType: type,
      record,
      overwriteExisting: Boolean(settings.overwriteExisting),
      useAi,
    });
  } catch (_) {
    showToast("页面连接失败，请刷新当前网页后重试", true);
  } finally {
    button.disabled = false;
  }
}

fillButton.addEventListener("click", sendFillRequest);
recordPicker.addEventListener("click", (event) => {
  const button = event.target.closest("[data-record-type]");
  if (button && !button.disabled) sendManualFillRequest(button);
});
manageProfileButton.addEventListener("click", () => chrome.runtime.openOptionsPage());

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    sendFillRequest();
  }
});

loadRecords().catch(() => showToast("读取本地资料失败", true));
