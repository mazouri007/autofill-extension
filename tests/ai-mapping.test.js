const assert = require("node:assert/strict");
const { validateAiRequest, validateAiMappings, validateAiSectionRequest, validateAiSectionChoice,
  requestDeepSeek, requestDeepSeekSection, handleAiMessage } = require("../background.js");

const request = {
  section: "project",
  fields: [
    { id: "f0", label: "项目名称", type: "text", options: [] },
    { id: "f1", label: "项目角色", type: "text", options: [] },
  ],
  sources: [
    { key: "name", label: "项目名称", keywords: "" },
    { key: "role", label: "项目角色", keywords: "" },
  ],
  remembered: [{ fieldId: "f0", sourceKey: "name" }],
};

assert.equal(validateAiRequest(request), true);
assert.equal(validateAiRequest({ ...request, fields: [{ ...request.fields[0], id: "arbitrary" }] }), false);
assert.equal(validateAiRequest({ ...request, remembered: [{ fieldId: "f0", sourceKey: "not-allowed" }] }), false);
assert.equal(validateAiMappings({ mappings: [{ fieldId: "f0", sourceKey: "role", confidence: 0.95 }] }, request).length, 1);
assert.equal(validateAiMappings({ mappings: [{ fieldId: "f0", sourceKey: "not-allowed", confidence: 0.95 }] }, request), null);
assert.equal(validateAiMappings({ mappings: [
  { fieldId: "f0", sourceKey: "name", confidence: 0.95 },
  { fieldId: "f0", sourceKey: "role", confidence: 0.95 },
] }, request), null);

const sectionRequest = {
  section: "work",
  groups: [
    { id: "g0", title: "实习经历", fields: [
      { label: "工作单位", type: "text" }, { label: "入职时间", type: "text" },
    ] },
    { id: "g1", title: "教育经历", fields: [
      { label: "学校", type: "text" }, { label: "专业", type: "text" },
    ] },
  ],
  focusedGroupId: "g0",
};
assert.equal(validateAiSectionRequest(sectionRequest), true);
assert.equal(validateAiSectionRequest({ ...sectionRequest, focusedGroupId: "g9" }), false);
assert.equal(validateAiSectionRequest({ ...sectionRequest, groups: [{ ...sectionRequest.groups[0], id: "wrong" }] }), false);
assert.deepEqual(validateAiSectionChoice({ groupId: "g0", confidence: 0.96 }, sectionRequest),
  { groupId: "g0", confidence: 0.96 });
assert.equal(validateAiSectionChoice({ groupId: "g9", confidence: 0.96 }, sectionRequest), null);

(async () => {
  const originalFetch = global.fetch;
  let sentBody;
  global.fetch = async (_url, options) => {
    sentBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ mappings: [
          { fieldId: "f0", sourceKey: "name", confidence: 0.97, reason: "名称匹配" },
        ] }) } }],
      }),
    };
  };
  try {
    const withValues = {
      ...request,
      fields: request.fields.map((field) => ({ ...field, privateValue: "绝不能发送的网页值" })),
      sources: request.sources.map((source) => ({ ...source, value: "绝不能发送的简历值" })),
      record: { name: "绝不能发送的项目" },
    };
    const result = await requestDeepSeek(withValues, "test-key");
    assert.equal(result.ok, true);
    assert.equal(result.mappings[0].sourceKey, "name");
    assert.equal(sentBody.model, "deepseek-flash");
    assert.equal(sentBody.response_format.type, "json_object");
    assert.equal(sentBody.thinking.type, "disabled");
    assert.equal(JSON.stringify(sentBody).includes("绝不能发送"), false);
    assert.equal(sentBody.messages[1].content.includes("项目名称"), true);

    global.fetch = async (_url, options) => {
      sentBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ choices: [{ finish_reason: "stop", message: {
          content: JSON.stringify({ groupId: "g0", confidence: 0.96 }),
        } }] }),
      };
    };
    const sectionWithValues = {
      ...sectionRequest,
      groups: sectionRequest.groups.map((group) => ({ ...group,
        fields: group.fields.map((field) => ({ ...field, value: "绝不能发送的网页值" })),
      })),
      record: { company: "绝不能发送的实习单位" },
    };
    const located = await requestDeepSeekSection(sectionWithValues, "test-key");
    assert.deepEqual({ groupId: located.groupId, confidence: located.confidence },
      { groupId: "g0", confidence: 0.96 });
    assert.equal(JSON.stringify(sentBody).includes("绝不能发送"), false);
    assert.equal(sentBody.messages[1].content.includes("实习经历"), true);

    // Edge supplies sender.tab even for a test initiated by the extension's options tab.
    global.chrome = { storage: { local: { get: async () => ({ aiConfig: { enabled: true, apiKey: "test-key" } }) } } };
    assert.equal((await handleAiMessage({ type: "AI_LOCATE_SECTION", request: sectionRequest },
      { tab: { id: 1 } })).groupId, "g0");
    assert.deepEqual(await handleAiMessage({ type: "AI_LOCATE_SECTION", request: sectionRequest }, {}),
      { ok: false, error: "forbidden" });
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ data: [{ id: "deepseek-flash" }] }),
    });
    assert.deepEqual(await handleAiMessage({ type: "AI_TEST_CONNECTION" }, { tab: { id: 1 } }),
      { ok: true, error: "" });
  } finally {
    global.fetch = originalFetch;
    delete global.chrome;
  }
  console.log("AI 映射与隐私边界测试通过");
})().catch((error) => { console.error(error); process.exitCode = 1; });
