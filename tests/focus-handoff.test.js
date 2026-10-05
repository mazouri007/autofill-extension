const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { handleFocusedFillMessage } = require("../background.js");

const content = fs.readFileSync(path.join(__dirname, "../content.js"), "utf8");
const popup = fs.readFileSync(path.join(__dirname, "../popup.js"), "utf8");
function between(source, start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, start);
  return source.slice(first, last);
}
const recordTypes = ["educations", "workExperiences", "projects", "extracurricularPractices", "awards", "familyMembers"];
const recordRequest = (recordType = "familyMembers") => ({
  type: "FILL_SELECTED_RECORD", recordType, record: { id: "record-1", birthDate: "1974-11-08" },
  useAi: true, overwriteExisting: false,
});

function coordinator({ focused = () => true, visible = true, childFrame = false, navigate = "" } = {}) {
  const dispatched = [];
  const statuses = [];
  let listener;
  let polls = 0;
  const currentLocation = { href: "https://zhaopin.chng.com.cn/resume", hostname: "zhaopin.chng.com.cn" };
  const pageWindow = {};
  pageWindow.top = childFrame ? {} : pageWindow;
  const context = vm.createContext({
    window: pageWindow, location: currentLocation,
    document: { hasFocus: () => focused(polls), visibilityState: visible ? "visible" : "hidden" },
    STRUCTURED_SECTIONS: Object.fromEntries(recordTypes.map((recordsKey) => [recordsKey, { recordsKey }])),
    recordHasContent: (record) => Boolean(record.birthDate),
    wait: async () => { polls += 1; if (navigate) currentLocation.href = navigate; },
    chrome: { runtime: {
      onMessage: { addListener: (fn) => { listener = fn; } },
      sendMessage: async (message) => {
        assert.equal(focused(polls), true, "不能在弹窗仍占用焦点时发送实际填写请求");
        dispatched.push(message);
        return { status: "filled", filled: 1, failed: 0 };
      },
    } },
  });
  vm.runInContext(content.slice(content.indexOf("let deferredFillPending"), content.lastIndexOf("})();")), context);
  context.statuses = statuses;
  vm.runInContext("showDeferredRecordStatus = message => statuses.push(message)", context);
  return {
    context, dispatched, statuses,
    send(message) {
      let response;
      listener(message, {}, (value) => { response = value; });
      return response;
    },
    queue(request = recordRequest()) {
      let response;
      const returned = listener({ type: "QUEUE_FILL_AFTER_POPUP_CLOSES", request }, {}, (value) => { response = value; });
      assert.equal(returned, false, "确认接收后即结束弹窗消息通道");
      return response;
    },
  };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));
async function testFocusGate() {
  const page = coordinator({ focused: (polls) => polls >= 4 });
  assert.equal(page.queue().queued, true);
  assert.equal(page.dispatched.length, 0, "同步回复 queued 时不能已经开始填写");
  assert.equal(page.queue().error, "busy", "同一网页不能并行运行两条填写任务");
  await settle();
  assert.equal(page.dispatched.length, 1);
  assert.equal(page.dispatched[0].request.recordType, "familyMembers");
  assert.match(page.statuses.at(-1), /已填 1 项/);
  assert.equal(page.queue().queued, true, "完成后应释放公共锁");
  await settle();

  for (const options of [{ focused: () => false }, { visible: false }]) {
    const blocked = coordinator(options);
    assert.equal(blocked.queue().queued, true);
    await settle();
    assert.equal(blocked.dispatched.length, 0, "未恢复焦点或隐藏页面都不能填写");
    assert.match(blocked.statuses.at(-1), /未获得焦点/);
    assert.equal(blocked.queue().queued, true, "取消或超时后也要释放锁");
    await settle();
  }
  for (const navigate of [
    "https://zhaopin.chng.com.cn/resume#/education",
    "https://zhaopin.chng.com.cn/resume?section=education",
    "https://zhaopin.chng.com.cn/other",
  ]) {
    const routed = coordinator({ navigate });
    assert.equal(routed.queue().queued, true);
    await settle();
    assert.equal(routed.dispatched.length, 1, "同一文档地址变化不再拦截恢复焦点后的填写");
    assert.equal("pageUrl" in routed.dispatched[0], false, "交接不再携带完整网址作比对");
    assert.match(routed.statuses.at(-1), /已填 1 项/);
  }
  const child = coordinator({ childFrame: true });
  assert.equal(child.queue(), undefined, "子框架不能抢先回复或各自等待焦点");
  const invalid = coordinator();
  assert.equal(invalid.queue({ type: "SAVE_OR_SUBMIT" }).error, "invalid_request");
  assert.equal(invalid.queue({ ...recordRequest(), recordType: "unknown" }).error, "invalid_request");

  const unstable = coordinator({ focused: (polls) => [2, 4, 5].includes(polls) });
  unstable.queue();
  await settle();
  assert.equal(unstable.dispatched.length, 1, "必须等到连续两次恢复焦点才允许执行");

  const failure = coordinator();
  failure.context.chrome.runtime.sendMessage = async () => { throw new Error("worker disconnected"); };
  failure.queue();
  await settle();
  assert.match(failure.statuses.at(-1), /填写过程出错/);
  assert.equal(failure.queue().queued, true, "后台连接失败后也要释放锁");
  await settle();

  const basic = coordinator();
  const basicRequest = { type: "FILL_PERSONAL_INFO", profile: {}, customFields: [], useAi: false, overwriteExisting: true };
  assert.equal(basic.queue(basicRequest).queued, true);
  await settle();
  assert.equal(basic.dispatched[0].request, basicRequest);
  assert.equal(basic.dispatched[0].request.useAi, false, "关闭 AI 时必须保留本地填写路径");

  const legacy = coordinator();
  legacy.context.location.hostname = "xiaoyuan.zhaopin.com";
  const legacyFilled = [];
  legacy.context.fillSelectedRecord = async (...args) => { legacyFilled.push(args); return { filled: 1 }; };
  assert.equal(legacy.send({ type: "QUEUE_ZHAOPIN_EDUCATION_RECORD", recordType: "educations", record: { school: "测试学校" } }).queued, true);
  await settle();
  assert.equal(legacyFilled.length, 1, "旧智联接口仍须能使用公共焦点等待后填写");
  assert.equal(legacy.dispatched.length, 0, "旧接口不重复转发，避免填写两次");
  legacy.context.result = { status: "ai_unavailable", filled: 2, error: "timeout" };
  assert.match(vm.runInContext("deferredFillResultText(result)", legacy.context), /已填 2 项.*AI 暂时不可用/,
    "AI 失败时不能隐瞒已成功填入的本地字段");
}

async function testEveryEntryPoint() {
  const requests = [];
  const context = vm.createContext({
    chrome: { storage: { local: { get: async () => ({
      profile: { fullName: "测试资料" }, customFields: [], settings: { overwriteExisting: false },
      aiConfig: { enabled: true, apiKey: "test-key" },
      resumeData: Object.fromEntries(recordTypes.map((key) => [key, [{ id: "record-1", birthDate: "1974-11-08" }]])),
    }) } }, tabs: { query: async () => [{ id: 11, url: "https://zhaopin.chng.com.cn/resume" }] } },
    countBasicItems: () => 1,
    queueFillAfterPopupCloses: async (tabId, request) => requests.push({ tabId, request }),
    showToast: (message) => assert.fail(message),
  });
  vm.runInContext(between(popup, "async function sendFillRequest", "fillButton.addEventListener"), context);
  await vm.runInContext("sendFillRequest()", context);
  assert.equal(requests[0].request.type, "FILL_PERSONAL_INFO");
  for (const recordType of recordTypes) {
    context.button = { disabled: false, dataset: { recordType, recordId: "record-1", recordIndex: "0" } };
    await vm.runInContext("sendManualFillRequest(button)", context);
    assert.equal(requests.at(-1).request.recordType, recordType);
    assert.equal(requests.at(-1).request.useAi, true);
    assert.equal(requests.at(-1).request.overwriteExisting, false);
    assert.equal(context.button.disabled, false);
  }
}

async function testPopupAcknowledgement() {
  const events = [];
  let accepted = true;
  const context = vm.createContext({
    window: { close: () => events.push("close") },
    showToast: (message) => events.push(message),
    sendMessageWithRecovery: async (tabId, message, options) => {
      events.push("queued");
      assert.equal(tabId, 11);
      assert.equal(message.type, "QUEUE_FILL_AFTER_POPUP_CLOSES");
      assert.equal(options.frameId, 0);
      return accepted ? { queued: true } : { queued: false, error: "busy" };
    },
  });
  vm.runInContext("let popupFillPending = false;" + between(popup, "async function queueFillAfterPopupCloses", "function renderRecordPicker"), context);
  await vm.runInContext("queueFillAfterPopupCloses(11, {})", context);
  assert.deepEqual(events, ["queued", "close"], "收到网页确认之后才关闭弹窗");
  accepted = false;
  events.length = 0;
  await vm.runInContext("queueFillAfterPopupCloses(11, {})", context);
  assert.equal(events.includes("close"), false, "网页拒绝请求时保留弹窗和失败提示");
  assert.match(events.at(-1), /正在填写/);

  let attempts = 0;
  const recovery = vm.createContext({ chrome: {
    tabs: { sendMessage: async (_id, _message, options) => {
      assert.equal(options.frameId, 0);
      if (++attempts === 1) throw new Error("no receiver");
      return { queued: true };
    } },
    scripting: { executeScript: async (options) => {
      assert.equal(options.target.allFrames, true, "恢复连接时仍向所有框架注入原引擎");
    } },
  } });
  vm.runInContext(between(popup, "async function sendMessageWithRecovery", "async function queueFillAfterPopupCloses"), recovery);
  await vm.runInContext("sendMessageWithRecovery(11, {}, {frameId:0})", recovery);
  assert.equal(attempts, 2);
}

async function testFrameRelay() {
  const forwarded = [];
  let tab = { id: 11, windowId: 2, active: true, url: "https://zhaopin.chng.com.cn/resume" };
  let windowFocused = true;
  global.chrome = {
    runtime: { id: "autofill-test" },
    tabs: { get: async () => tab, sendMessage: async (...args) => {
      forwarded.push(args);
      return { status: "filled", filled: 1 };
    } },
    windows: { get: async () => ({ focused: windowFocused }) },
  };
  const sender = { id: "autofill-test", frameId: 0, tab: { id: 11 }, url: tab.url };
  const request = recordRequest();
  const message = { type: "RUN_FOCUSED_FILL", request };
  assert.equal((await handleFocusedFillMessage(message, sender)).filled, 1);
  assert.equal(forwarded[0].length, 2, "实际填写不能带 frameId:0，须保持原来的全部框架广播");
  assert.equal(forwarded[0][1], request, "原有 AI、覆盖和记录参数必须原样转交");
  forwarded.length = 0;
  for (const invalid of [{ ...sender, id: "other-extension" }, { ...sender, frameId: 1 }, { ...sender, tab: undefined }]) {
    assert.equal((await handleFocusedFillMessage(message, invalid)).error, "forbidden");
  }
  assert.equal((await handleFocusedFillMessage({ ...message, request: { type: "SUBMIT" } }, sender)).error, "invalid_request");
  assert.equal(forwarded.length, 0, "不可信调用或非法操作不能转发资料");
  for (const url of [
    "https://zhaopin.chng.com.cn/resume#/education",
    "https://zhaopin.chng.com.cn/resume?section=education",
    "https://zhaopin.chng.com.cn/other",
  ]) {
    tab = { ...tab, url };
    const legacyMessage = { ...message, pageUrl: "https://zhaopin.chng.com.cn/resume" };
    assert.equal((await handleFocusedFillMessage(legacyMessage, sender)).filled, 1,
      "网址及旧内容脚本的 sender.url 不一致时仍能在原标签页填写");
    assert.equal(forwarded.at(-1)[0], sender.tab.id, "始终向发起请求的标签页转发，不能改投其他标签页");
    assert.equal(forwarded.at(-1).length, 2, "地址变化后仍须保留 iframe 广播");
  }
  forwarded.length = 0;
  tab = { ...tab, active: false };
  assert.equal((await handleFocusedFillMessage(message, sender)).status, "page_not_focused");
  tab.active = true;
  windowFocused = false;
  assert.equal((await handleFocusedFillMessage(message, sender)).status, "page_not_focused");
  assert.equal(forwarded.length, 0, "目标标签页不在前台或窗口无焦点时不能转发资料");
  delete global.chrome;
}

(async () => {
  await testFocusGate();
  await testEveryEntryPoint();
  await testPopupAcknowledgement();
  await testFrameRelay();
  console.log("公共焦点交接、一键/六类记录、地址变化不拦截、超时取消及 iframe 转交测试通过");
})().catch((error) => { console.error(error); process.exitCode = 1; });
