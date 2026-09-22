const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const inertElement = { addEventListener() {} };
const context = vm.createContext({
  console,
  crypto: { randomUUID: () => "test-id" },
  document: { querySelector: () => inertElement, querySelectorAll: () => [], addEventListener() {} },
  window: { addEventListener() {} },
  chrome: { storage: { local: { get: () => new Promise(() => {}) } } },
});
vm.runInContext(fs.readFileSync(path.join(__dirname, "../options.js"), "utf8"), context);

const result = vm.runInContext(`normalizeResumeData({
  educations: [{ id: "old", startDate: "2021-09", endDate: "2024-02" }],
  workExperiences: [{ id: "full", startDate: "2022-03-14", endDate: "2023-02-28" }],
  projects: [{ id: "leap", startDate: "2024-02", endDate: "2024-02" }],
  familyMembers: [{ id: "family", birthDate: "1970-11-19" }],
})`, context);

assert.equal(result.educations[0].startDate, "2021-09-01");
assert.equal(result.educations[0].endDate, "2024-02-29");
assert.equal(result.workExperiences[0].startDate, "2022-03-14");
assert.equal(result.workExperiences[0].endDate, "2023-02-28");
assert.equal(result.projects[0].startDate, "2024-02-01");
assert.equal(result.projects[0].endDate, "2024-02-29");
assert.equal(result.familyMembers[0].birthDate, "1970-11-19");
assert.equal(vm.runInContext(`Object.values(RECORD_TYPES).flatMap((type) => type.fields)
  .filter((field) => ["startDate", "endDate", "birthDate"].includes(field.key))
  .every((field) => field.type === "date")`, context), true);
console.log("日期资料兼容测试通过");
