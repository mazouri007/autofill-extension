(() => {
  "use strict";

  const AUTOCOMPLETE_MAP = {
    name: "fullName",
    nickname: "nickname",
    "given-name": "firstName",
    "additional-name": "fullName",
    "family-name": "lastName",
    email: "email",
    tel: "phone",
    url: "website",
    sex: "gender",
    bday: "birthDate",
    organization: "company",
    "organization-title": "jobTitle",
    "street-address": "addressLine1",
    "address-line1": "addressLine1",
    "address-line2": "addressLine2",
    "address-level2": "city",
    "address-level1": "province",
    "postal-code": "postalCode",
    country: "country",
    "country-name": "country",
  };

  const FIELD_RULES = [
    ["emergencyContactPhone", /(?:^|\b)(?:emergency[-_ ]?(?:contact[-_ ]?)?(?:phone|mobile|tel)|紧急联系人(?:手机|电话|联系方式)|紧急联系电话|应急联系人(?:手机|电话)|应急电话)(?:\b|$)/i],
    ["emergencyContactName", /(?:^|\b)(?:emergency[-_ ]?contact[-_ ]?name|紧急联系人姓名|应急联系人姓名)(?:\b|$)/i],
    ["email", /(?:^|\b)(?:e[-_ ]?mail|email address|电子邮箱|邮箱|邮件)(?:\b|$)/i],
    ["phone", /(?:^|\b)(?:mobile|cell(?:phone)?|phone|telephone|tel|手机(?:号码)?|联系电话|电话)(?:\b|$)/i],
    ["wechat", /(?:^|\b)(?:wechat|weixin|微信号|微信)(?:\b|$)/i],
    ["nickname", /(?:^|\b)(?:nickname|nick name|preferred name|alias|昵称)(?:\b|$)/i],
    ["birthDate", /(?:^|\b)(?:birth[-_ ]?date|birthday|date of birth|dob|出生日期|生日)(?:\b|$)/i],
    ["birthPlace", /(?:^|\b)(?:birth[-_ ]?place|place[-_ ]?of[-_ ]?birth|birthplace|出生地点|出生地)(?:\b|$)/i],
    ["gender", /(?:^|\b)(?:gender|sex|性别)(?:\b|$)/i],
    ["height", /(?:^|\b)(?:height|身高)(?:\b|$)/i],
    ["weight", /(?:^|\b)(?:weight|体重)(?:\b|$)/i],
    ["healthStatus", /(?:^|\b)(?:health[-_ ]?(?:status|condition)|physical[-_ ]?condition|健康状况|健康状态|身体状况)(?:\b|$)/i],
    ["workYears", /(?:^|\b)(?:years?[-_ ]?of[-_ ]?(?:work|experience)|work[-_ ]?(?:years|experience)|工作年限|工作经验年限|从业年限)(?:\b|$)/i],
    ["strengths", /(?:^|\b)(?:strengths?|specialties|speciality|specialty|talents?|特长|个人特长)(?:\b|$)/i],
    ["firstName", /(?:^|\b)(?:first|given)[-_ ]?name(?:\b|$)|(?:^|\b)(?:名)(?:\b|$)/i],
    ["lastName", /(?:^|\b)(?:last|family|sur)[-_ ]?name(?:\b|$)|(?:^|\b)(?:姓氏?|姓)(?:\b|$)/i],
    ["fullName", /(?:^|\b)(?:full[-_ ]?name|your[-_ ]?name|name|姓名|联系人姓名)(?:\b|$)/i],
    ["jobTitle", /(?:^|\b)(?:job[-_ ]?title|title|position|role|职位|职务)(?:\b|$)/i],
    ["department", /(?:^|\b)(?:department|division|team|部门|所属部门)(?:\b|$)/i],
    ["company", /(?:^|\b)(?:company|organization|organisation|employer|单位|公司|企业)(?:\b|$)/i],
    ["website", /(?:^|\b)(?:personal[-_ ]?(?:website|site|homepage)|website|homepage|profile[-_ ]?url|个人主页|个人网站|主页)(?:\b|$)/i],
    ["householdRegistration", /(?:^|\b)(?:household[-_ ]?(?:registration|register)|hukou|户籍所在地|户籍地址|户籍|户口所在地|户口地址|户口)(?:\b|$)/i],
    ["nativePlace", /(?:^|\b)(?:native[-_ ]?place|place[-_ ]?of[-_ ]?origin|籍贯)(?:\b|$)/i],
    ["studentOrigin", /(?:^|\b)(?:student[-_ ]?origin|source[-_ ]?of[-_ ]?student|生源所在地|生源地)(?:\b|$)/i],
    ["currentResidence", /(?:^|\b)(?:current[-_ ]?(?:residence|location)|residential[-_ ]?(?:place|location)|现居住地|现居地|现居住地址|现住址)(?:\b|$)/i],
    ["postalCode", /(?:^|\b)(?:zip|postal)(?:[-_ ]?code)?|邮政编码|邮编(?:\b|$)/i],
    ["country", /(?:^|\b)(?:country|nationality|国家|地区|国籍)(?:\b|$)/i],
    ["province", /(?:^|\b)(?:state|province|region|省|州)(?:\b|$)/i],
    ["city", /(?:^|\b)(?:city|town|城市|市)(?:\b|$)/i],
    ["addressLine2", /(?:^|\b)(?:address[-_ ]?(?:line[-_ ]?)?2|suite|unit|apartment|apt|地址补充|详细地址2)(?:\b|$)/i],
    ["addressLine1", /(?:^|\b)(?:street[-_ ]?address|address[-_ ]?(?:line[-_ ]?)?1|address|street|详细地址|收货地址|联系地址|家庭住址|家庭地址|住址|地址)(?:\b|$)/i],
  ];

  const COMPACT_CJK_RULES = [
    ["emergencyContactPhone", /紧急联系人(?:手机|电话|联系方式)|紧急联系电话|应急联系人(?:手机|电话)|应急电话/],
    ["emergencyContactName", /紧急联系人姓名|应急联系人姓名/],
    ["documentNumber", /证件号码|证件号|身份证号码|身份证号|护照号码|护照号|document(?:number|no)|identification(?:number|no)|id(?:number|no)|passport(?:number|no)|cert(?:ificate)?(?:number|no)/i],
    ["documentType", /证件类型|证件类别|证件种类|documenttype|idtype|identitytype|cert(?:ificate)?type/i],
    ["email", /电子邮箱|邮箱|邮件/],
    ["phone", /手机号码|手机号|联系电话|电话/],
    ["wechat", /微信号|微信/],
    ["nickname", /昵称/],
    ["birthDate", /出生日期|生日/],
    ["birthPlace", /出生地点|出生地/],
    ["gender", /性别/],
    ["height", /身高/],
    ["weight", /体重/],
    ["healthStatus", /健康状况|健康状态|身体状况/],
    ["workYears", /工作年限|工作经验年限|从业年限/],
    ["strengths", /个人特长|特长/],
    ["lastName", /姓氏/],
    ["firstName", /名字/],
    ["fullName", /姓名|联系人姓名/],
    ["department", /所属部门|部门/],
    ["jobTitle", /职位|职务/],
    ["company", /公司|企业|单位/],
    ["website", /个人主页|个人网站|主页/],
    ["householdRegistration", /户籍所在地|户籍地址|户籍|户口所在地|户口地址|户口/],
    ["nativePlace", /籍贯/],
    ["studentOrigin", /生源所在地|生源地/],
    ["currentResidence", /现居住地址|现居住地|现居地|现住址/],
    ["postalCode", /邮政编码|邮编/],
    ["country", /国家|地区|国籍/],
    ["province", /省份|省州/],
    ["city", /城市/],
    ["addressLine2", /地址补充|详细地址2/],
    ["addressLine1", /收货地址|联系地址|家庭住址|家庭地址|详细地址|住址|地址/],
  ];

  const STRUCTURED_SECTIONS = {
    education: {
      recordsKey: "educations",
      sectionPattern: /教育经历|学历信息|学历经历|教育背景|学习经历|education|academic/i,
      strongPattern: /学校|院校|学历|学位|专业|入学|毕业|school|university|college|degree|major/i,
      addPattern: /新增|添加|add|new/i,
      fields: [
        ["educationType", /学历类型|学历性质|培养方式|教育类型|education\s*type|schoolAgeType/i],
        ["educationLevel", /最高学历|学历阶段|学历层次|学历|教育程度|education\s*level|qualification/i],
        ["degreeType", /学位类型|学位性质|degree\s*type/i],
        ["degree", /学位类型|学位|degree/i],
        ["college", /学院名称|学院|院系|系别|academy|institute|faculty/i],
        ["school", /学校名称|毕业院校|所在学校|院校名称|学校|school\s*name|university|college\s*name/i],
        ["major", /主修专业|所学专业|专业名称|专业|speciality|specialty|major/i],
        ["location", /学校所在地|学校地点|院校所在地|school\s*(?:place|location)|所在地/i],
        ["classRanking", /班级排名|专业排名|成绩排名|class\s*ranking|rank/i],
        ["startDate", /入学时间|入校时间|教育开始|开始(?:时间|日期)|起始(?:时间|日期)|entrance|start|begin|from/i],
        ["endDate", /毕业时间|教育结束|结束(?:时间|日期)|截止(?:时间|日期)|graduate|graduation|end|to/i],
        ["current", /目前在读|正在就读|在读|至今|current/i],
        ["primary", /主要教育经历|是否主要|最高学历经历|primary/i],
        ["description", /在校经历|教育描述|补充说明|课程|学生干部|description|detail/i],
      ],
    },
    work: {
      recordsKey: "workExperiences",
      sectionPattern: /工作经历|任职经历|职业经历|实习经历|工作经验|employment|work\s*experience|career/i,
      strongPattern: /工作单位|公司|雇主|工作岗位|职位|岗位级别|工作形式|工作内容|company|employer|position|job\s*title/i,
      addPattern: /新增|添加|add|new/i,
      fields: [
        ["company", /工作单位|单位名称|公司名称|任职公司|雇主|company|employer|organization/i],
        ["companyType", /单位类别|单位性质|公司类型|公司性质|unit\s*prop|unitprop|company\s*type/i],
        ["position", /工作岗位|岗位名称|职位名称|职位|职务|position|job\s*title|role/i],
        ["department", /所在部门|任职部门|部门|department|division|team/i],
        ["location", /工作地点|工作所在地|任职地点|work\s*(?:place|location)|location/i],
        ["workType", /工作形式|工作类型|任职类型|用工类型|work\s*type|employment\s*type/i],
        ["level", /岗位级别|职级|职位级别|duty\s*level|job\s*level/i],
        ["startDate", /入职时间|工作开始|开始(?:时间|日期)|起始(?:时间|日期)|start|begin|from/i],
        ["endDate", /离职时间|工作结束|结束(?:时间|日期)|截止(?:时间|日期)|end|to/i],
        ["current", /目前在职|仍在职|在职|至今|current/i],
        ["responsibilities", /工作内容|主要职责|岗位职责|职责描述|工作描述|responsibilit|description/i],
        ["achievements", /工作业绩|主要业绩|工作成果|业绩描述|performance|achievement/i],
      ],
    },
    project: {
      recordsKey: "projects",
      sectionPattern: /项目经历|项目经验|代表项目|项目实践|project\s*experience|projects?/i,
      strongPattern: /项目名称|项目角色|项目描述|项目成果|项目职责|project\s*name|project\s*role/i,
      addPattern: /新增|添加|add|new/i,
      fields: [
        ["name", /项目名称|课题名称|project\s*name|project\s*title/i],
        ["role", /项目角色|担任角色|项目岗位|职责角色|project\s*role|role/i],
        ["company", /所属单位|项目单位|公司|organization|company/i],
        ["technologies", /技术栈|使用技术|技术工具|开发工具|technolog|tools?/i],
        ["startDate", /项目开始|开始(?:时间|日期)|起始(?:时间|日期)|start|begin|from/i],
        ["endDate", /项目结束|结束(?:时间|日期)|截止(?:时间|日期)|end|to/i],
        ["current", /仍在进行|进行中|至今|current|ongoing/i],
        ["description", /项目描述|项目内容|项目介绍|主要工作|项目职责|description|detail/i],
        ["achievements", /项目成果|项目业绩|项目成就|产出|achievement|result/i],
      ],
    },
    family: {
      recordsKey: "familyMembers",
      sectionPattern: /家庭成员|家庭关系|亲属信息|亲属情况|家属信息|直系亲属|family\s*members?|relatives?/i,
      strongPattern: /亲属姓名|与本人关系|亲属工作单位|亲属职位|政治面貌|现居住地址|relative\s*name|relationship/i,
      fields: [
        ["relativeName", /亲属姓名|家属姓名|成员姓名|家庭成员姓名|(?:^|\s)姓名(?:\s|$)|relative\s*name|family\s*member\s*name/i],
        ["relationship", /与本人关系|与申请人关系|亲属关系|家庭关系|称谓|relationship|relation/i],
        ["birthDate", /出生日期|出生年月|生日|date\s*of\s*birth|birth\s*date|birthday/i],
        ["gender", /性别|gender|sex/i],
        ["worksInSystem", /是否移动(?:系统|体系)内任职|是否(?:系统|体系)内任职|(?:系统|体系)内任职|是否在职|work(?:s|ing)?\s*in\s*system/i],
        ["employer", /亲属工作单位|家属工作单位|工作单位|所在单位|任职单位|employer|organization/i],
        ["position", /亲属职位|家属职位|亲属职务|工作职位|职务|职位|position|job\s*title/i],
        ["phone", /联系电话|手机号码|手机号|电话|mobile|phone|telephone/i],
        ["politicalStatus", /政治面貌|政治身份|political\s*status/i],
        ["currentAddress", /现居住地址|现住址|居住地址|家庭住址|现居住地|current\s*address|residential\s*address/i],
      ],
    },
  };

  // Common personal fields (phone, gender, address) also occur in family records.
  // Do not infer a repeated-record section from those shared fields alone.
  const STRUCTURED_INFERENCE_PATTERNS = {
    education: /学校|院校|学历|学位|专业|school|university|degree|major/i,
    work: /工作单位|任职公司|雇主|工作岗位|岗位名称|公司名称|employer|company\s*name/i,
    project: /项目名称|课题名称|项目角色|project\s*(?:name|title|role)/i,
    family: /亲属姓名|家属姓名|家庭成员姓名|与本人关系|亲属关系|家庭关系|relative\s*name|relationship/i,
  };

  const EDUCATION_LEVEL_ALIASES = {
    高中: ["高中", "高级中学", "high school", "secondary school"],
    大专: ["大专", "专科", "高职", "college diploma", "associate"],
    本科: ["本科", "大学本科", "学士", "bachelor", "undergraduate"],
    硕士: ["硕士", "硕士研究生", "研究生", "master", "postgraduate"],
    博士: ["博士", "博士研究生", "phd", "doctorate", "doctoral"],
  };

  const WORK_TYPE_ALIASES = {
    全职: ["全职", "正式", "正式员工", "full time", "full-time"],
    实习: ["实习", "实习生", "intern", "internship"],
    兼职: ["兼职", "part time", "part-time"],
  };

  const EDUCATION_TYPE_ALIASES = {
    全日制: ["全日制", "统招", "普通全日制", "full time", "full-time"],
    非全日制: ["非全日制", "在职", "成人教育", "part time", "part-time"],
  };

  const FAMILY_RELATIONSHIP_ALIASES = {
    父亲: ["父亲", "父子", "父女", "爸爸"],
    母亲: ["母亲", "母子", "母女", "妈妈"],
    配偶: ["配偶", "夫妻", "丈夫", "妻子"],
    儿子: ["儿子", "父子", "母子"],
    女儿: ["女儿", "父女", "母女"],
    兄弟姐妹: ["兄弟姐妹", "兄弟", "姐妹", "哥哥", "弟弟", "姐姐", "妹妹"],
  };

  const BLOCKED_AUTOCOMPLETE = /(?:^|\s)(?:current-password|new-password|one-time-code|cc-|transaction-)/i;
  const CREDENTIAL_HINTS = /password|passwd|passcode|pwd|密码|验证码/i;
  const PAYMENT_HINTS = /credit|debit|payment|card[-_ ]?(?:number|no|num|holder|expiry|expiration)|cvv|cvc|iban|银行卡|信用卡|借记卡/i;
  const DOCUMENT_HINTS = /证件|身份证|护照|passport|national[-_ ]?id|identity[-_ ]?card|id[-_ ]?card|identification/i;
  const CUSTOM_ONLY_HINTS = /紧急联系人关系|应急联系人关系|emergencycontactrelationship/i;
  const GENERIC_CUSTOM_TERMS = new Set(["id", "no", "num", "number", "code", "type", "name", "value", "field", "input"]);
  const ALLOWED_INPUT_TYPES = new Set(["", "text", "email", "tel", "search", "url", "number", "date", "month", "checkbox", "radio"]);
  const CONTROL_SELECTOR = [
    "input", "textarea", "select", "[contenteditable='true']", "[role='combobox']",
    // A number of older Ant Design / Element UI builds expose the combobox only to
    // accessibility APIs while the visible DOM wrapper has no role attribute. Include the
    // stable framework roots so both deterministic matching and AI can see those controls.
    ".ant-select", ".ant-cascader-picker", ".el-select", ".el-cascader",
    ".ivu-select", ".ivu-cascader",
  ].join(", ");
  const LOCATION_PROFILE_KEYS = new Set([
    "householdRegistration", "nativePlace", "studentOrigin", "birthPlace", "currentResidence",
  ]);
  const RECORD_CONTAINER_SELECTOR = [
    "[data-autofill-record]", "fieldset", "article", "[role='group']",
    ".form-wrapper", "[class*='form-wrapper']", "[class*='formWrapper']",
    "[class*='experience-card']", "[class*='experienceCard']", "[class*='record-card']",
    "[class*='recordCard']", "[class*='resume-item']", "[class*='resumeItem']",
  ].join(", ");
  const AI_SOURCE_LABELS = {
    basic: {
      lastName: "姓", firstName: "名", fullName: "完整姓名", nickname: "昵称", gender: "性别",
      birthDate: "出生日期", email: "电子邮箱", phone: "手机号码", wechat: "微信号",
      website: "个人主页", documentType: "证件类型", documentNumber: "证件号码",
      addressLine1: "详细地址", addressLine2: "地址补充", city: "城市", province: "省份",
      postalCode: "邮政编码", country: "国家或地区", height: "身高", weight: "体重",
      healthStatus: "健康状况", strengths: "特长", workYears: "工作年限",
      householdRegistration: "户籍", nativePlace: "籍贯", studentOrigin: "生源地", birthPlace: "出生地",
      currentResidence: "现居住地", emergencyContactName: "紧急联系人姓名",
      emergencyContactPhone: "紧急联系人电话",
    },
    education: {
      school: "学校名称", educationLevel: "学历阶段", educationType: "学历类型", degree: "学位",
      degreeType: "学位类型", major: "专业", college: "学院", location: "学校所在地",
      classRanking: "排名", startDate: "入学时间", endDate: "毕业时间", current: "目前在读",
      primary: "主要教育经历", description: "在校经历",
    },
    work: {
      company: "工作单位", companyType: "单位性质", position: "岗位或职位", department: "部门",
      location: "工作地点", workType: "工作形式", level: "岗位级别", startDate: "开始时间",
      endDate: "结束时间", current: "目前在职", responsibilities: "工作内容与职责", achievements: "工作业绩",
    },
    project: {
      name: "项目名称", role: "项目角色或职责", company: "所属单位", technologies: "技术或工具",
      startDate: "项目开始时间", endDate: "项目结束时间", current: "仍在进行",
      description: "项目描述或工作描述", achievements: "项目成果",
    },
    family: {
      relativeName: "亲属姓名", relationship: "与本人关系", birthDate: "亲属出生日期", gender: "亲属性别",
      worksInSystem: "是否移动系统内任职", employer: "亲属工作单位", position: "亲属职位",
      phone: "亲属联系电话", politicalStatus: "亲属政治面貌", currentAddress: "现居住地址",
    },
  };
  let lastUserTarget = null;
  let aiReviewCleanup = null;

  for (const eventName of ["pointerdown", "focusin"]) {
    document.addEventListener(eventName, (event) => {
      if (!event.isTrusted || !(event.target instanceof Element)) return;
      if (eventName === "focusin") {
        if (event.target.matches(CONTROL_SELECTOR)) lastUserTarget = event.target;
        return;
      }
      const control = event.target.closest(CONTROL_SELECTOR);
      const label = event.target.closest("label");
      if (control || label) lastUserTarget = control || label;
    }, true);
  }

  function normalizeMatchText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[_\-./\\#]+/g, " ")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function compactText(value) {
    return normalizeMatchText(value).replace(/\s+/g, "");
  }

  function directText(element) {
    if (!element) return "";
    return Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent || "")
      .join(" ")
      .trim();
  }

  function cleanFieldLabelText(value) {
    return String(value || "")
      .replace(/(?:最多|不超过|限)\s*\d+\s*(?:个?字|字符)?/gi, " ")
      .replace(/已输入\s*\d+\s*(?:个?字|字符)?/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isHelperOnlyLabel(value) {
    const cleaned = cleanFieldLabelText(value).replace(/[：:*＊\s]/g, "");
    return !cleaned || /^(?:必填|选填|内容|请输入|请选择)$/.test(cleaned);
  }

  function textOfLabel(element) {
    const labels = [];
    if (element.labels) labels.push(...Array.from(element.labels, (label) => label.innerText));

    const labelledBy = (element.getAttribute?.("aria-labelledby") || "").split(/\s+/).filter(Boolean);
    for (const id of labelledBy) {
      const label = element.ownerDocument.getElementById(id);
      if (label) labels.push(label.innerText || label.textContent);
    }

    if (element.id) {
      try {
        const explicit = element.ownerDocument.querySelector(`label[for="${CSS.escape(element.id)}"]`);
        if (explicit) labels.push(explicit.innerText);
      } catch (_) {
        // Generated ids can contain invalid selector characters.
      }
    }

    const parentLabel = element.closest?.("label");
    if (parentLabel) labels.push(parentLabel.innerText);

    const definitionRow = element.closest?.("dl");
    const definitionTerm = definitionRow?.querySelector?.(":scope > dt");
    if (definitionTerm && definitionRow.querySelector(":scope > dd")?.contains(element)) {
      labels.push(definitionTerm.innerText || definitionTerm.textContent);
    }

    const formItem = element.closest?.(
      ".form-group, .form-item, .el-form-item, .ant-form-item, [class*='formItem'], [class*='form-item'], td",
    );
    if (formItem) {
      const nearbyLabel = formItem.querySelector(
        "label, legend, .form-label, .control-label, .el-form-item__label, .ant-form-item-label, [class*='label']",
      );
      if (nearbyLabel) labels.push(nearbyLabel.innerText || nearbyLabel.textContent);
      if (formItem.matches("td")) {
        const previousCell = formItem.previousElementSibling;
        if (previousCell) labels.push(previousCell.innerText || previousCell.textContent);
      }
    }

    // Several recruitment SPAs render a visual label as a plain sibling div/span rather than
    // a real <label> or a framework-specific form-item label. Walk only to the nearest concise
    // preceding sibling, and stop at another control group, so we gain that label without
    // accidentally borrowing text from the previous field or another resume section.
    if (!labels.some((label) => String(label || "").trim())) {
      let node = element;
      siblingSearch: for (let depth = 0; node && node !== document.body && depth < 8;
        depth += 1, node = node.parentElement) {
        let sibling = node.previousSibling;
        for (let count = 0; sibling && count < 4; count += 1, sibling = sibling.previousSibling) {
          if (sibling.nodeType === Node.TEXT_NODE) {
            const text = String(sibling.textContent || "").replace(/\s+/g, " ").trim();
            if (text && text.length <= 120 && !isHelperOnlyLabel(text)) {
              labels.push(cleanFieldLabelText(text));
              break siblingSearch;
            }
            continue;
          }
          if (sibling.nodeType !== Node.ELEMENT_NODE) continue;
          if (sibling.matches?.(CONTROL_SELECTOR) || sibling.querySelector?.(CONTROL_SELECTOR)) break;
          const text = String(sibling.innerText || sibling.textContent || "").replace(/\s+/g, " ").trim();
          if (text && text.length <= 120 && !isHelperOnlyLabel(text)) {
            labels.push(cleanFieldLabelText(text));
            break siblingSearch;
          }
        }
      }
    }

    // Legacy forms often put a visual caption and character counter around a deeply nested
    // textarea without a label element or sibling relationship. For a small container that
    // owns exactly one control, remove the control from a clone and use the remaining text as
    // its local label. This stays bounded so text from adjacent fields cannot leak in.
    if (!labels.some((label) => String(label || "").trim())) {
      for (let ancestor = element.parentElement, depth = 0;
        ancestor && ancestor !== document.body && depth < 6;
        ancestor = ancestor.parentElement, depth += 1) {
        const controls = Array.from(ancestor.querySelectorAll(CONTROL_SELECTOR));
        if (controls.length !== 1 || controls[0] !== element) {
          if (controls.length > 4) break;
          continue;
        }
        const clone = ancestor.cloneNode(true);
        clone.querySelectorAll(`${CONTROL_SELECTOR}, script, style, button`).forEach((node) => node.remove());
        const text = cleanFieldLabelText(clone.textContent).replace(/^[：:*＊\s,，;；]+|[：:*＊\s,，;；]+$/g, "");
        if (text && text.length <= 180 && !isHelperOnlyLabel(text)) {
          labels.push(text);
          break;
        }
      }
    }

    return [...new Set(labels.map(cleanFieldLabelText).filter(Boolean))].join(" ");
  }

  function fieldHints(element) {
    const selectPlaceholder = element instanceof HTMLSelectElement ? element.options[0]?.text : "";
    return [
      element.name,
      element.id,
      element.placeholder,
      element.getAttribute?.("aria-label"),
      element.getAttribute?.("title"),
      element.getAttribute?.("data-testid"),
      element.getAttribute?.("data-field"),
      element.getAttribute?.("data-name"),
      selectPlaceholder,
      textOfLabel(element),
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function autocompleteToken(element) {
    const tokens = (element.getAttribute?.("autocomplete") || "").toLowerCase().split(/\s+/).filter(Boolean);
    return tokens.find((token) => AUTOCOMPLETE_MAP[token]);
  }

  function isProtectedField(element) {
    const autocomplete = element.getAttribute?.("autocomplete") || "";
    const hints = fieldHints(element);
    const type = (element.getAttribute?.("type") || "").toLowerCase();
    return BLOCKED_AUTOCOMPLETE.test(autocomplete) ||
      CREDENTIAL_HINTS.test(hints) ||
      (PAYMENT_HINTS.test(hints) && !DOCUMENT_HINTS.test(hints)) ||
      (element instanceof HTMLInputElement && !ALLOWED_INPUT_TYPES.has(type));
  }

  function classifyBasicField(element) {
    if (isProtectedField(element)) return null;
    const type = (element.getAttribute?.("type") || "").toLowerCase();
    const hints = fieldHints(element);
    const token = autocompleteToken(element);
    if (token) return AUTOCOMPLETE_MAP[token];
    if (type === "email") return "email";
    if (type === "tel") return "phone";

    const compactHints = compactText(hints);
    if (CUSTOM_ONLY_HINTS.test(compactHints)) return null;
    if (/电话所在区域|电话区域|国家区号|国际区号|手机区号/.test(compactHints)) return null;
    return COMPACT_CJK_RULES.find(([, pattern]) => pattern.test(compactHints))?.[0] ||
      FIELD_RULES.find(([, pattern]) => pattern.test(hints))?.[0] ||
      null;
  }

  function sectionFromText(text) {
    const matches = Object.entries(STRUCTURED_SECTIONS)
      .filter(([, definition]) => definition.sectionPattern.test(String(text || "")))
      .map(([key]) => key);
    return matches.length === 1 ? matches[0] : null;
  }

  function structuralText(element) {
    return [
      element.id,
      element.className,
      element.getAttribute?.("aria-label"),
      element.getAttribute?.("data-section"),
      element.getAttribute?.("data-type"),
      directText(element),
    ].filter(Boolean).join(" ");
  }

  function detectStructuredSection(element) {
    const explicit = element.closest?.("[data-autofill-section]")?.getAttribute("data-autofill-section");
    if (STRUCTURED_SECTIONS[explicit]) return explicit;

    let ancestor = element.parentElement;
    for (let depth = 0; ancestor && ancestor !== document.body && depth < 8; depth += 1, ancestor = ancestor.parentElement) {
      const structuralMatch = sectionFromText(structuralText(ancestor));
      if (structuralMatch) return structuralMatch;

      const headings = Array.from(ancestor.children || [])
        .filter((child) => child.matches?.("h1, h2, h3, h4, h5, legend, [role='heading'], [class*='title'], [class*='header']"))
        .slice(0, 4)
        .map((child) => child.innerText || child.textContent)
        .join(" ");
      const headingMatch = sectionFromText(headings);
      if (headingMatch) return headingMatch;
    }

    let node = element;
    for (let depth = 0; node && depth < 7; depth += 1, node = node.parentElement) {
      let sibling = node.previousElementSibling;
      for (let count = 0; sibling && count < 5; count += 1, sibling = sibling.previousElementSibling) {
        const headingLike = sibling.matches?.("h1, h2, h3, h4, h5, legend, [role='heading'], [class*='section-title'], [class*='section-header']") ||
          (!sibling.querySelector?.(CONTROL_SELECTOR) && sibling.querySelector?.(":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > [role='heading']"));
        if (!headingLike) continue;
        const match = sectionFromText(`${structuralText(sibling)} ${sibling.innerText || ""}`);
        if (match) return match;
      }
    }

    const recordContainer = nearestRecordContainer(element);
    if (!recordContainer) return null;
    const groupHints = Array.from(recordContainer.querySelectorAll(CONTROL_SELECTOR))
      .map(fieldHints)
      .join(" ");
    const inferred = Object.entries(STRUCTURED_SECTIONS)
      .map(([key, definition]) => ({
        key,
        score: definition.fields.filter(([, pattern]) => pattern.test(groupHints)).length,
      }))
      .filter((item) => item.score >= 2 && STRUCTURED_INFERENCE_PATTERNS[item.key].test(groupHints))
      .sort((a, b) => b.score - a.score);
    return inferred.length && inferred[0].score > (inferred[1]?.score || 0) ? inferred[0].key : null;
  }

  // `detectStructuredSection` deliberately searches fairly far up the DOM so it can find
  // headings on unusual recruitment forms. On a single-page resume editor, however, that
  // far ancestor can contain both the basic-information controls and later headings such as
  // "教育经历". Treat a control as structured only when the section is also confirmed by a
  // nearby, reasonably-sized editor. This keeps those later headings from hiding every basic
  // field from both the deterministic and AI-assisted fill paths.
  function confirmedStructuredSection(element) {
    let section = detectStructuredSection(element);
    // Some SPAs render section titles as plain text nodes rather than headings. In that
    // layout, infer a structured editor only when a bounded group contains several fields
    // characteristic of one record type. This keeps open work/education editors out of the
    // basic one-click and AI passes without relying on site-specific class names.
    if (!section) {
      section = Object.keys(STRUCTURED_SECTIONS).find((candidate) =>
        Boolean(boundedStructuredContainer(element, candidate))) || null;
      if (!section) return null;
    }

    const explicit = element.closest?.("[data-autofill-section]")?.getAttribute("data-autofill-section");
    if (explicit === section) return section;
    if (boundedStructuredContainer(element, section)) return section;

    let ancestor = element.parentElement;
    for (let depth = 0; ancestor && ancestor !== document.body && depth < 8;
      depth += 1, ancestor = ancestor.parentElement) {
      const controls = ancestor.querySelectorAll?.(CONTROL_SELECTOR).length || 0;
      if (controls < 2 || controls > 40) continue;
      if (sectionFromText(structuralText(ancestor)) === section) return section;

      let branch = element;
      while (branch?.parentElement && branch.parentElement !== ancestor) branch = branch.parentElement;
      const children = Array.from(ancestor.children || []);
      const branchIndex = children.indexOf(branch);
      if (branchIndex < 0) continue;
      const precedingHeading = children.slice(0, branchIndex).reverse().find((child) =>
        child.matches?.(
          "h1, h2, h3, h4, h5, legend, [role='heading'], [class*='section-title'], [class*='section-header']"));
      if (precedingHeading && sectionFromText(
        `${structuralText(precedingHeading)} ${precedingHeading.innerText || precedingHeading.textContent || ""}`) === section) {
        return section;
      }
    }
    return null;
  }

  function classifyStructuredField(element, section) {
    const definition = STRUCTURED_SECTIONS[section];
    if (!definition) return null;
    const hints = fieldHints(element);
    return definition.fields.find(([, pattern]) => pattern.test(hints))?.[0] || null;
  }

  function isVisible(element) {
    if (!element?.isConnected || element.getClientRects().length === 0) return false;
    const style = (element.ownerDocument?.defaultView || window).getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  function isCustomControl(element) {
    return element.getAttribute?.("role") === "combobox" || Boolean(element.closest?.(
      ".ant-select, .el-select, [class*='select-wrapper'], [class*='selectWrapper'], [class*='cascader']",
    ));
  }

  function elementDateWrapper(element) {
    return element.closest?.(
      ".el-date-editor, [class*='date-editor'], [class*='dateEditor'], [data-picker='date'], [data-picker='month']",
    ) || null;
  }

  function isInteractiveDateControl(element) {
    return Boolean(element.closest?.(".ant-calendar-picker, .ant-picker") || elementDateWrapper(element) ||
      element.closest?.([
        ".ivu-date-picker", ".mx-datepicker", ".van-calendar", ".react-datepicker-wrapper",
        "[class*='date-picker']", "[class*='datePicker']", "[class*='datepicker']",
        "[class*='calendar-picker']", "[class*='calendarPicker']",
      ].join(", ")));
  }

  function hasLocationControlHints(element) {
    return /户籍|籍贯|生源|出生地|现居住|province|city|district|county|location|address/i
      .test(fieldHints(element));
  }

  function isUsable(element, overwriteExisting, semanticKey = "") {
    if (element.disabled) return false;
    if (element.readOnly && !isCustomControl(element) && !isInteractiveDateControl(element) &&
      !hasLocationControlHints(element) && !["birthDate", "startDate", "endDate"].includes(semanticKey)) return false;
    if (!overwriteExisting && readControlValue(element)) return false;
    return isVisible(element);
  }

  function readControlValue(element) {
    if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio")) {
      return element.checked ? String(element.value || "true") : "";
    }
    if (element.isContentEditable) return String(element.innerText || "").trim();
    if ("value" in element) return String(element.value || "").trim();
    const nestedValue = element.querySelector?.("input:not([type='hidden']), textarea, select")?.value;
    if (nestedValue) return String(nestedValue).trim();
    const selectedText = element.querySelector?.([
      ".ant-select-selection-selected-value", ".ant-select-selection__rendered",
      ".ant-cascader-picker-label", ".el-input__inner", ".el-cascader__tags",
      ".ivu-select-selected-value", ".ivu-cascader-label",
    ].join(", "))?.textContent || element.textContent || "";
    const text = String(selectedText).replace(/\s+/g, " ").trim();
    return /^(?:请选择|选择|select|please select)$/i.test(text) ? "" : text;
  }

  function dispatchValueEvents(element) {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function setNativeValue(element, value) {
    if (element.isContentEditable) {
      element.focus();
      element.textContent = value;
      dispatchValueEvents(element);
      return;
    }

    const prototype = element instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(element, value);
    else element.value = value;
    dispatchValueEvents(element);
  }

  function setChecked(element, checked) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked")?.set;
    if (setter) setter.call(element, checked);
    else element.checked = checked;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function aliasesFor(value) {
    const normalized = normalizeMatchText(value);
    const aliasGroups = [
      ...Object.values(EDUCATION_LEVEL_ALIASES),
      ...Object.values(WORK_TYPE_ALIASES),
      ...Object.values(EDUCATION_TYPE_ALIASES),
      ...Object.values(FAMILY_RELATIONSHIP_ALIASES),
    ];
    const matchingGroup = aliasGroups.find((group) => group.some((alias) => normalizeMatchText(alias) === normalized));
    return matchingGroup ? [value, ...matchingGroup] : [value];
  }

  function numericOptionValue(value) {
    const text = String(value || "").trim();
    const match = text.match(/^0*(\d{1,4})\s*(?:年|月份?|日|号)?$/);
    return match ? Number(match[1]) : null;
  }

  function numericDateLabelValue(value) {
    const exact = numericOptionValue(value);
    if (exact !== null) return exact;
    const numbers = String(value || "").match(/\d{1,4}/g) || [];
    const unique = [...new Set(numbers.map(Number))];
    return unique.length === 1 ? unique[0] : null;
  }

  function numericDateOptionValue(option) {
    const labelNumber = numericDateLabelValue(option?.textContent);
    return labelNumber !== null ? labelNumber : numericDateLabelValue(option?.value);
  }

  function optionScore(optionText, value) {
    const option = normalizeMatchText(optionText);
    const optionNumber = numericOptionValue(optionText);
    const expectedNumber = numericOptionValue(value);
    if (optionNumber !== null && expectedNumber !== null) {
      return optionNumber === expectedNumber ? 100 : 0;
    }
    let best = 0;
    for (const alias of aliasesFor(value)) {
      const expected = normalizeMatchText(alias);
      if (!option || !expected) continue;
      if (option === expected) best = Math.max(best, 100);
      else if (option.includes(expected) || expected.includes(option)) best = Math.max(best, 70);
    }
    return best;
  }

  function setSelectValue(select, value) {
    const option = Array.from(select.options)
      .map((item) => ({ item, score: Math.max(optionScore(item.text, value), optionScore(item.value, value)) }))
      .sort((a, b) => b.score - a.score)[0];
    if (!option?.score) return false;
    setNativeValue(select, option.item.value);
    return true;
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function customControlActivationTarget(element) {
    return element.querySelector?.([
      ".ant-cascader-picker-label", ".ant-select-selection", ".ant-select-selector",
      ".el-input", ".el-input__wrapper", ".ivu-select-selection", ".ivu-cascader-rel",
      "input:not([type='hidden'])",
    ].join(", ")) || element;
  }

  function activateCustomControl(element) {
    const target = customControlActivationTarget(element);
    target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    target.click?.();
    return target;
  }

  function visibleOptions() {
    const selectors = [
      "[role='option']", ".ant-select-dropdown-menu-item", ".ant-cascader-menu-item",
      ".el-select-dropdown__item", ".el-cascader-node", "[class*='select-option']",
    ].join(", ");
    return Array.from(document.querySelectorAll(selectors)).filter((option) => {
      return isVisible(option) && !option.matches("[aria-disabled='true'], .disabled, [class*='disabled']");
    });
  }

  async function setCustomSelectValue(element, value) {
    const wrapper = element.closest?.(
      ".ant-select, .el-select, [class*='select-wrapper'], [class*='selectWrapper'], [class*='cascader']",
    ) || element;
    activateCustomControl(wrapper);
    await wait(80);

    const searchInput = wrapper.querySelector?.("input:not([type='hidden'])") ||
      (element instanceof HTMLInputElement ? element : null);
    if (searchInput && !searchInput.readOnly) {
      searchInput.focus();
      setNativeValue(searchInput, value);
      const searchDelay = /学校|院校|school|university|college/i.test(fieldHints(searchInput)) ? 680 : 260;
      await wait(searchDelay);
    }

    const option = visibleOptions()
      .map((item) => ({ item, score: optionScore(item.innerText || item.textContent, value) }))
      .sort((a, b) => b.score - a.score)[0];
    if (!option?.score) {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      return false;
    }
    option.item.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    option.item.click();
    await wait(60);
    return true;
  }

  function splitLocationValue(value) {
    const raw = String(value || "").trim();
    if (!raw) return [];
    const separated = raw.split(/\s*(?:\/|／|>|›|→|\||,|，|;|；)\s*|\s+/).filter(Boolean);
    if (separated.length > 1) return separated.slice(0, 3);
    const compact = raw.replace(/[^\p{L}\p{N}]/gu, "");
    const matched = compact.match(/.+?(?:特别行政区|自治区|自治州|地区|省|市|盟|区|县|旗)/g) || [];
    return matched.length > 1 && matched.join("") === compact ? matched.slice(0, 3) : [raw];
  }

  function shortLocationPart(value) {
    return normalizeMatchText(value).replace(
      /(?:特别行政区|自治区|自治州|地区|省|市|盟|区|县|旗)$/,
      "",
    );
  }

  function locationOptionScore(optionText, value) {
    const option = normalizeMatchText(optionText);
    const expected = normalizeMatchText(value);
    if (!option || !expected) return 0;
    if (option === expected) return 100;
    const optionShort = shortLocationPart(option);
    const expectedShort = shortLocationPart(expected);
    if (optionShort.length >= 2 && optionShort === expectedShort) return 90;
    if (option.includes(expected) || expected.includes(option)) return 70;
    if (optionShort.length >= 2 && expectedShort.length >= 2 &&
      (optionShort.includes(expectedShort) || expectedShort.includes(optionShort))) return 60;
    return 0;
  }

  function controlAtomicHints(element) {
    const control = element.querySelector?.("input:not([type='hidden']), select") || element;
    const labelledBy = control.getAttribute?.("aria-labelledby")
      ?.split(/\s+/).map((id) => control.ownerDocument?.getElementById(id)?.textContent || "").join(" ");
    const parentLabel = control.closest?.("label");
    return [
      control.name, control.id, control.getAttribute?.("placeholder"), control.getAttribute?.("aria-label"),
      control.getAttribute?.("title"), control.getAttribute?.("data-field"),
      control instanceof HTMLSelectElement ? control.options[0]?.textContent : "",
      labelledBy, directText(parentLabel),
    ].map(compactText).filter(Boolean);
  }

  function locationLevelForField(element) {
    const hints = normalizeMatchText(fieldHints(element));
    const atomicHints = controlAtomicHints(element);
    const levels = [
      /province|state|省份|所属省|户籍省|籍贯省|生源省|出生省|居住省|(?:^|户籍|户口|籍贯|生源|出生地?|现居|现住)省(?:份)?$/.test(hints) ||
        atomicHints.some((hint) => /^(?:省|省份|province|state)$/.test(hint)),
      /city|prefecture|城市|所属市|户籍市|籍贯市|生源市|出生市|居住市|(?:^|户籍|户口|籍贯|生源|出生地?|现居|现住)市$/.test(hints) ||
        atomicHints.some((hint) => /^(?:市|城市|city|prefecture)$/.test(hint)),
      /district|county|区县|县区|所属区|所属县|户籍区|籍贯区|生源区|出生区|居住区|(?:^|户籍|户口|籍贯|生源|出生地?|现居|现住)(?:区|县|区县)$/.test(hints) ||
        atomicHints.some((hint) => /^(?:区|县|区县|县区|district|county)$/.test(hint)),
    ];
    return levels.filter(Boolean).length === 1 ? levels.findIndex(Boolean) : null;
  }

  function cascaderWrapper(element) {
    const known = element.closest?.(
      ".ant-cascader-picker, .ant-cascader, .el-cascader, [data-picker='cascader'], " +
      "[class*='cascader-wrapper'], [class*='cascaderWrapper'], [class*='Cascader']",
    );
    if (known) return known;
    for (let ancestor = element.parentElement, depth = 0;
      ancestor && depth < 6;
      ancestor = ancestor.parentElement, depth += 1) {
      if (/cascader/i.test(String(ancestor.className || ""))) return ancestor;
    }
    return null;
  }

  function visibleCascaderOptions() {
    const candidates = new Set(document.querySelectorAll([
      ".ant-cascader-menu-item", ".el-cascader-node", "[class*='cascader-option']",
      "[class*='cascaderOption']", "[class*='Cascader-option']", "[class*='CascaderOption']",
    ].join(", ")));
    for (const option of document.querySelectorAll("[role='option']")) {
      if (option.closest("[class*='cascader'], [class*='Cascader']")) candidates.add(option);
    }
    return Array.from(candidates).filter((option) => {
      return isVisible(option) && !option.matches(
        "[aria-disabled='true'], .disabled, [class*='disabled'], [class*='Disabled']",
      );
    });
  }

  function visibleLocationPopupOptions() {
    const candidates = new Set(visibleCascaderOptions());
    const roots = new Set(Array.from(document.querySelectorAll([
      ".el-popper", ".el-select-dropdown", ".ant-cascader-menus", ".ant-cascader-dropdown",
      ".ant-select-dropdown", ".ivu-cascader-transfer", ".ivu-select-dropdown",
      "[class*='cascader-panel']", "[class*='cascaderPanel']", "[class*='CascaderPanel']",
      "[class*='address-picker']", "[class*='addressPicker']", "[class*='area-picker']",
      "[class*='areaPicker']", "[class*='city-picker']", "[class*='cityPicker']",
      "[role='listbox']", "[role='menu']",
    ].join(", "))).filter(isVisible));

    // Some recruitment sites use an unlabelled, self-built three-column region popup.
    // Discover its smallest visible root through the location-search box instead of
    // depending on a specific framework or generated CSS class name.
    const locationSearchInputs = Array.from(document.querySelectorAll(
      "input[placeholder], [role='searchbox'][aria-label], [role='searchbox'][placeholder]",
    )).filter((input) => isVisible(input) &&
      /(?:搜索|查找).{0,8}(?:城市|省份|省市|地区|行政区|区县)|(?:城市|地区|行政区|区县).{0,8}(?:搜索|查找)/i
        .test(`${input.getAttribute("placeholder") || ""} ${input.getAttribute("aria-label") || ""}`));
    for (const input of locationSearchInputs) {
      for (let node = input.parentElement, depth = 0;
        node && node !== document.body && depth < 8;
        node = node.parentElement, depth += 1) {
        const optionCount = node.querySelectorAll(
          "li, [role='option'], [role='menuitem'], button, a",
        ).length;
        if (optionCount >= 3) {
          roots.add(node);
          break;
        }
      }
    }
    for (const root of roots) {
      for (const option of root.querySelectorAll(
        "li, [role='option'], [role='menuitem'], .ant-select-item-option, .ant-cascader-menu-item, " +
        ".el-cascader-node, .ivu-cascader-menu-item, [class*='cascader-option'], button, a",
      )) {
        const text = compactText(option.textContent || "");
        if (text && text.length <= 60) candidates.add(option);
      }
    }
    return Array.from(candidates).filter((option) => {
      return isVisible(option) && !option.matches(
        "[aria-disabled='true'], .disabled, [class*='disabled'], [class*='Disabled']",
      );
    });
  }

  function locationDisplayMatches(element, wrapper, parts) {
    const visibleValue = [
      readControlValue(element),
      wrapper?.querySelector?.("input:not([type='hidden'])")?.value,
      wrapper?.textContent,
    ].filter(Boolean).join(" ");
    const normalized = normalizeMatchText(visibleValue);
    return parts.every((part) => {
      const full = normalizeMatchText(part);
      const short = shortLocationPart(part);
      return normalized.includes(full) || (short.length >= 2 && normalized.includes(short));
    });
  }

  async function setCascaderLocationValue(element, value) {
    const parts = splitLocationValue(value);
    const wrapper = cascaderWrapper(element);
    if (!wrapper || !parts.length) return false;
    activateCustomControl(wrapper);
    await wait(100);
    if (!visibleLocationPopupOptions().length && wrapper !== element) {
      activateCustomControl(element);
      await wait(100);
    }

    const selected = [];
    for (const [index, part] of parts.entries()) {
      let ranked = [];
      for (let attempt = 0; attempt < 20 && !ranked.length; attempt += 1) {
        ranked = visibleLocationPopupOptions()
          .map((option) => ({ option, score: locationOptionScore(option.textContent, part) }))
          .filter(({ score }) => score >= 90)
          .sort((a, b) => b.score - a.score);
        if (!ranked.length) await wait(100);
      }
      if (!ranked.length && index === 1 && parts.length === 2 &&
        /^(?:北京市|上海市|天津市|重庆市)$/.test(parts[0]) && /(?:区|县|旗)$/.test(part)) {
        const intermediary = visibleLocationPopupOptions()
          .map((option) => ({ option, score: locationOptionScore(option.textContent, parts[0]) }))
          .filter(({ score }) => score >= 90)
          .sort((a, b) => b.score - a.score)[0];
        if (intermediary) {
          intermediary.option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
          intermediary.option.click();
          await wait(100);
          ranked = visibleLocationPopupOptions()
            .map((option) => ({ option, score: locationOptionScore(option.textContent, part) }))
            .filter(({ score }) => score >= 90)
            .sort((a, b) => b.score - a.score);
        }
      }
      if (!ranked.length || (ranked[1]?.score === ranked[0].score &&
        normalizeMatchText(ranked[1].option.textContent) !== normalizeMatchText(ranked[0].option.textContent))) {
        // Some cascaders accept only province + city even when the saved profile
        // also contains a district, and may leave their popup open after committing.
        if (selected.length >= 2 && locationDisplayMatches(element, wrapper, selected)) {
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
          return true;
        }
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        return false;
      }
      ranked[0].option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      ranked[0].option.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      ranked[0].option.click();
      selected.push(part);
      await wait(140);
    }
    await wait(40);
    return locationDisplayMatches(element, wrapper, parts);
  }


  async function setGenericPopupLocationValue(element, value) {
    const parts = splitLocationValue(value);
    if (!parts.length) return false;
    const wrapper = element.closest?.(
      ".el-input, .ant-input-affix-wrapper, [class*='input-wrapper'], [class*='inputWrapper'], " +
      "[class*='address'], [class*='location'], [class*='area'], [class*='city']",
    ) || element.parentElement || element;
    activateCustomControl(wrapper);
    await wait(140);
    if (!visibleLocationPopupOptions().length && wrapper !== element) {
      activateCustomControl(element);
      await wait(140);
    }

    const selected = [];
    for (const part of parts) {
      let ranked = [];
      for (let attempt = 0; attempt < 20 && !ranked.length; attempt += 1) {
        ranked = visibleLocationPopupOptions()
          .map((option) => ({ option, score: locationOptionScore(option.textContent, part) }))
          .filter(({ score }) => score >= 90)
          .sort((a, b) => b.score - a.score);
        if (!ranked.length) await wait(100);
      }
      if (!ranked.length || (ranked[1]?.score === ranked[0].score &&
        normalizeMatchText(ranked[1].option.textContent) !== normalizeMatchText(ranked[0].option.textContent))) {
        if (selected.length >= 2 && locationDisplayMatches(element, wrapper, selected)) {
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
          return true;
        }
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        return false;
      }
      ranked[0].option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      ranked[0].option.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      ranked[0].option.click();
      selected.push(part);
      await wait(140);
    }
    await wait(80);
    return locationDisplayMatches(element, wrapper, selected);
  }

  function setLocationSelectValue(select, value) {
    const parts = splitLocationValue(value);
    if (!parts.length) return false;
    const level = locationLevelForField(select);
    const wanted = level === null ? parts : [parts[level]].filter(Boolean);
    const ranked = Array.from(select.options).flatMap((option) => wanted.map((part) => ({
      option, score: locationOptionScore(option.textContent || option.value, part),
    }))).filter(({ score }) => score >= 90).sort((a, b) => b.score - a.score);
    if (!ranked.length || (ranked[1]?.score === ranked[0].score && ranked[1].option !== ranked[0].option)) return false;
    setNativeValue(select, ranked[0].option.value);
    return true;
  }

  async function setLocationControlValue(element, value) {
    const parts = splitLocationValue(value);
    if (!parts.length) return false;
    if (element instanceof HTMLSelectElement) return setLocationSelectValue(element, value);
    if (cascaderWrapper(element)) return setCascaderLocationValue(element, value);
    const level = locationLevelForField(element);
    const projectedValue = level === null ? String(value) : parts[level];
    if (!projectedValue) return false;
    if (isCustomControl(element)) {
      if (level !== null) return setCustomSelectValue(element, projectedValue);
      const selected = await setGenericPopupLocationValue(element, value);
      if (selected) return true;
      return parts.length === 1 ? setCustomSelectValue(element, parts[0]) : false;
    }
    if (!element.readOnly && level !== null) {
      setNativeValue(element, projectedValue);
      return true;
    }
    if (element.readOnly || hasLocationControlHints(element)) {
      const selected = await setGenericPopupLocationValue(element, projectedValue);
      if (selected) return true;
      if (element.readOnly) return false;
    }
    setNativeValue(element, projectedValue);
    return true;
  }

  function dateFormatHints(element) {
    return [
      element.getAttribute?.("data-date-format"),
      element.getAttribute?.("data-format"),
      element.getAttribute?.("datefmt"),
      element.getAttribute?.("format"),
      element.getAttribute?.("pattern"),
      element.getAttribute?.("onfocus"),
      element.getAttribute?.("onclick"),
      fieldHints(element),
    ].filter(Boolean).join(" ");
  }

  function targetDatePrecision(element, hints) {
    const type = (element.getAttribute?.("type") || "").toLowerCase();
    if (type === "date") return "day";
    if (type === "month") return "month";
    if (element.closest?.(".ant-picker-month, .ant-calendar-month-picker, [data-picker='month']")) return "month";
    if (element instanceof HTMLInputElement && element.maxLength > 0 && element.maxLength <= 7) return "month";
    // Explicit format tokens take precedence over a surrounding semantic label. A YYYY-MM
    // input is still month-precision even when its field caption is the generic “结束日期”.
    if (/y{2,4}\s*[-/.年]?\s*m{1,2}\s*[-/.月]?\s*d{1,2}|年.{0,8}月.{0,8}日|年月日/i.test(hints)) return "day";
    if (/y{2,4}\s*[-/.年]?\s*m{1,2}|年月|year[-_ ]?month/i.test(hints)) return "month";
    if (/日期|生日|birth[-_ ]?date|birthday/i.test(hints)) return "day";
    if (/月份/i.test(hints)) return "month";
    return "day";
  }

  function formatDateValue(element, value, semanticKey = "") {
    const type = (element.getAttribute?.("type") || "").toLowerCase();
    if (!["startDate", "endDate", "birthDate"].includes(semanticKey) && type !== "date" && type !== "month") return value;
    const match = String(value || "").match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
    if (!match) return value;
    const [, year, month, suppliedDay] = match;
    const day = suppliedDay || (semanticKey === "endDate"
      ? String(new Date(Number(year), Number(month), 0).getDate()).padStart(2, "0")
      : "01");
    const hints = dateFormatHints(element);
    const precision = targetDatePrecision(element, hints);
    if (type === "date") return `${year}-${month}-${day}`;
    if (type === "month") return `${year}-${month}`;
    if (/y{2,4}\s*年\s*m{1,2}\s*月/i.test(hints)) {
      return precision === "month" ? `${year}年${month}月` : `${year}年${month}月${day}日`;
    }
    if (/y{2,4}\s*\/\s*m{1,2}/i.test(hints)) {
      return precision === "month" ? `${year}/${month}` : `${year}/${month}/${day}`;
    }
    if (/y{2,4}\s*\.\s*m{1,2}/i.test(hints)) {
      return precision === "month" ? `${year}.${month}` : `${year}.${month}.${day}`;
    }
    return precision === "month" ? `${year}-${month}` : `${year}-${month}-${day}`;
  }

  function visibleAntCalendarFor(element) {
    const selector = ".ant-calendar-picker-container, .ant-picker-dropdown";
    const wrapper = element.closest?.(".ant-calendar-picker, .ant-picker") || element;
    // Ant Design can leave the previous picker visible during its closing animation.
    // Some sites render each popup beside its own input instead of under document.body.
    for (let ancestor = wrapper.parentElement, depth = 0;
      ancestor && ancestor !== document.body && depth < 5;
      ancestor = ancestor.parentElement, depth += 1) {
      const calendars = Array.from(ancestor.querySelectorAll(selector)).filter(isVisible);
      if (calendars.length === 1) return calendars[0];
    }
    const calendars = Array.from(document.querySelectorAll(selector)).filter(isVisible);
    // If two body-level popups are still visible, choosing either by DOM order risks
    // writing an end date into the start field. Leave the field for manual review.
    return calendars.length === 1 ? calendars[0] : null;
  }

  function visibleElementCalendar() {
    return Array.from(document.querySelectorAll([
      ".el-picker-panel.el-date-picker",
      ".el-picker-panel.el-date-range-picker",
      ".el-picker__popper .el-picker-panel",
      ".el-picker-panel",
    ].join(", "))).find((calendar) => {
      return isVisible(calendar) && Boolean(calendar.querySelector(
        ".el-date-table, .el-month-table, .el-year-table, .el-date-picker__header",
      ));
    });
  }

  function datePartsMatch(element, year, month, day = null) {
    const parts = readControlValue(element).match(/\d+/g) || [];
    if (Number(parts[0]) !== year || Number(parts[1]) !== month) return false;
    return day === null || Number(parts[2]) === day;
  }

  function elementDateNavigationButton(calendar, direction, unit) {
    const directionPattern = direction === "previous" ? /prev|left|上一|前/ : /next|right|下一|后/;
    const yearPattern = /d-arrow|double|super|year|年/;
    return Array.from(calendar.querySelectorAll("button, [role='button']")).find((button) => {
      if (!isVisible(button) || button.disabled || button.getAttribute("aria-disabled") === "true") return false;
      const hints = [
        button.className, button.getAttribute("aria-label"), button.getAttribute("title"), button.textContent,
      ].filter(Boolean).join(" ").toLowerCase();
      if (!directionPattern.test(hints)) return false;
      return unit === "year" ? yearPattern.test(hints) : !yearPattern.test(hints);
    }) || null;
  }

  function displayedElementDate(calendar) {
    const labels = Array.from(calendar.querySelectorAll(
      ".el-date-picker__header-label, .el-picker-panel__header-label, [class*='header-label']",
    )).filter(isVisible);
    const allText = labels.map((item) => item.textContent || "").join(" ") ||
      calendar.querySelector(".el-date-picker__header, .el-picker-panel__header")?.textContent || "";
    const year = Number(allText.match(/(?:19|20)\d{2}/)?.[0]);
    const monthMatches = allText.match(/(?:^|\D)(1[0-2]|0?[1-9])\s*(?:月|month)/i);
    return { year, month: Number(monthMatches?.[1]) };
  }

  function clickElementDateCell(cell) {
    if (!cell) return false;
    const tableCell = cell.matches?.("td") ? cell : cell.closest?.("td") || cell;
    const target = tableCell.querySelector?.(
      ".el-date-table-cell, .cell, [class*='date-table-cell'], [class*='dateTableCell'], span, div",
    ) || tableCell;
    target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    target.click();
    return true;
  }

  async function directDateInputFallback(element, dateValue, year, month, day) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await wait(30);
    setNativeValue(element, dateValue);
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    element.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
    element.blur?.();
    await wait(80);
    return datePartsMatch(element, year, month, day);
  }

  function exactElementDateCell(calendar, dateValue) {
    const candidates = Array.from(calendar.querySelectorAll(
      `[data-date="${dateValue}"], [title="${dateValue}"], [aria-label="${dateValue}"]`,
    ));
    return candidates.find((candidate) => {
      const cell = candidate.closest?.("td") || candidate;
      return isVisible(candidate) && !/disabled|prev-month|next-month/.test(String(cell.className));
    }) || null;
  }

  function reachableDocuments(rootDocument = document, seen = new Set()) {
    if (!rootDocument || seen.has(rootDocument)) return [];
    seen.add(rootDocument);
    const documents = [rootDocument];
    for (const frame of rootDocument.querySelectorAll("iframe, frame")) {
      try {
        if (frame.contentDocument) documents.push(...reachableDocuments(frame.contentDocument, seen));
      } catch (_) { /* Cross-origin frames are handled by the content script running in that frame. */ }
    }
    return documents;
  }

  function visibleGenericDateCalendar() {
    const selectors = [
      ".ivu-date-picker-transfer", ".ivu-select-dropdown", ".mx-datepicker-popup",
      ".react-datepicker-popper", ".van-calendar__popup", "[class*='date-picker-panel']",
      "[class*='datePickerPanel']", "[class*='datepicker-panel']", "[class*='calendar-panel']",
      "[class*='calendarPanel']", "[class*='picker-panel']", "[role='dialog']", "[role='grid']",
      "#_my97DP", "[id*='datePicker']", "[id*='datepicker']",
    ].join(", ");
    for (const currentDocument of reachableDocuments()) {
      const explicit = Array.from(currentDocument.querySelectorAll(selectors)).find((calendar) =>
        isVisible(calendar) && Boolean(calendar.querySelector(
          "td, [role='gridcell'], [data-date], [data-day], [aria-label], button, select",
        )));
      if (explicit) return explicit;
      if (currentDocument !== document && currentDocument.body && isVisible(currentDocument.body) &&
        currentDocument.body.querySelector("td, [role='gridcell'], [data-date], button, select")) {
        return currentDocument.body;
      }
    }
    return null;
  }

  function adjacentDateActivationTargets(element) {
    const parent = element.parentElement;
    if (!parent) return [];
    const candidates = Array.from(parent.querySelectorAll("a, button, [role='button']"))
      .filter((candidate) => candidate !== element && isVisible(candidate));
    const likely = candidates.filter((candidate) => /date|calendar|日期|时间|日历|wdate|my97/i.test([
      candidate.className, candidate.id, candidate.getAttribute("title"), candidate.getAttribute("aria-label"),
      candidate.getAttribute("href"), candidate.getAttribute("onclick"), candidate.textContent,
    ].filter(Boolean).join(" ")));
    if (likely.length) return likely.slice(0, 3);
    return candidates.length === 1 && !String(candidates[0].textContent || "").trim() ? candidates : [];
  }

  function dateCellParts(candidate) {
    const hints = [
      candidate.getAttribute?.("data-date"), candidate.getAttribute?.("data-day"),
      candidate.getAttribute?.("title"), candidate.getAttribute?.("aria-label"),
    ].filter(Boolean).join(" ");
    const parts = hints.match(/\d+/g) || [];
    return parts.length >= 3 ? parts.slice(0, 3).map(Number) : [];
  }

  function genericDateCell(calendar, year, month, day) {
    const candidates = Array.from(calendar.querySelectorAll(
      "td, [role='gridcell'], [data-date], [data-day], button",
    )).filter((candidate) => {
      if (!isVisible(candidate) || candidate.disabled || candidate.getAttribute?.("aria-disabled") === "true") return false;
      const className = String(candidate.className || "");
      return !/disabled|outside|other-month|prev-month|next-month|old|new/i.test(className);
    });
    const exact = candidates.find((candidate) => {
      const parts = dateCellParts(candidate);
      return parts.length === 3 && parts[0] === year && parts[1] === month && parts[2] === day;
    });
    if (exact) return exact;
    const calendarText = `${calendar.textContent || ""} ${calendar.getAttribute?.("aria-label") || ""}`;
    const displayedYear = Number(calendarText.match(/(?:19|20)\d{2}/)?.[0]);
    const displayedMonth = Number(calendarText.match(/(?:^|\D)(1[0-2]|0?[1-9])\s*(?:月|month)/i)?.[1]);
    if (displayedYear && displayedYear !== year) return null;
    if (displayedMonth && displayedMonth !== month) return null;
    return candidates.find((candidate) => {
      const text = (candidate.textContent || "").trim();
      return /^\d{1,2}$/.test(text) && Number(text) === day;
    }) || null;
  }

  async function setGenericDatePickerValue(element, value) {
    const match = String(value).match(/^(\d{4})\D?(\d{2})(?:\D?(\d{2}))?\D*$/);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = match[3] ? Number(match[3]) : null;
    if (await directDateInputFallback(element, value, year, month, day)) return true;

    let calendar = null;
    for (const target of [element, ...adjacentDateActivationTargets(element)]) {
      target.focus?.();
      target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      target.click?.();
      await wait(140);
      calendar = visibleGenericDateCalendar();
      if (calendar) break;
    }
    if (!calendar || day === null) return false;
    const cell = genericDateCell(calendar, year, month, day);
    if (!cell) return false;
    const target = cell.querySelector?.("button, a, span, div") || cell;
    target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    target.click?.();
    await wait(140);
    return datePartsMatch(element, year, month, day);
  }

  async function setElementDatePickerValue(element, value) {
    const match = String(value).match(/^(\d{4})\D?(\d{2})(?:\D?(\d{2}))?\D*$/);
    if (!match) return false;
    const targetYear = Number(match[1]);
    const targetMonth = Number(match[2]);
    const targetDay = match[3] ? Number(match[3]) : null;
    const wrapper = elementDateWrapper(element) || element;

    element.focus?.();
    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    element.click?.();
    await wait(120);
    let calendar = visibleElementCalendar();
    if (!calendar && wrapper !== element) {
      wrapper.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      wrapper.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      wrapper.click?.();
      await wait(120);
      calendar = visibleElementCalendar();
    }
    const dateValue = `${String(targetYear).padStart(4, "0")}-${String(targetMonth).padStart(2, "0")}` +
      (targetDay === null ? "" : `-${String(targetDay).padStart(2, "0")}`);
    if (!calendar) return directDateInputFallback(
      element, dateValue, targetYear, targetMonth, targetDay,
    );
    const exactCell = exactElementDateCell(calendar, dateValue);
    if (exactCell) {
      clickElementDateCell(exactCell);
      await wait(150);
      if (datePartsMatch(element, targetYear, targetMonth, targetDay)) return true;
      return directDateInputFallback(element, dateValue, targetYear, targetMonth, targetDay);
    }

    let displayed = displayedElementDate(calendar);
    if (!displayed.year) return directDateInputFallback(
      element, dateValue, targetYear, targetMonth, targetDay,
    );
    const yearDifference = targetYear - displayed.year;
    if (Math.abs(yearDifference) > 80) return directDateInputFallback(
      element, dateValue, targetYear, targetMonth, targetDay,
    );
    if (yearDifference) {
      const yearButton = elementDateNavigationButton(
        calendar, yearDifference < 0 ? "previous" : "next", "year",
      );
      if (!yearButton) return directDateInputFallback(
        element, dateValue, targetYear, targetMonth, targetDay,
      );
      for (let count = 0; count < Math.abs(yearDifference); count += 1) {
        yearButton.click();
        await wait(90);
      }
    }

    calendar = visibleElementCalendar() || calendar;
    if (targetDay !== null) {
      displayed = displayedElementDate(calendar);
      if (!displayed.month) return directDateInputFallback(
        element, dateValue, targetYear, targetMonth, targetDay,
      );
      const monthDifference = targetMonth - displayed.month;
      if (monthDifference) {
        const monthButton = elementDateNavigationButton(
          calendar, monthDifference < 0 ? "previous" : "next", "month",
        );
        if (!monthButton) return directDateInputFallback(
          element, dateValue, targetYear, targetMonth, targetDay,
        );
        for (let count = 0; count < Math.abs(monthDifference); count += 1) {
          monthButton.click();
          await wait(90);
        }
      }

      const dayCell = exactElementDateCell(calendar, dateValue) || Array.from(calendar.querySelectorAll(
        ".el-date-table td, [class*='date-table'] td",
      )).find((cell) => {
        return isVisible(cell) && !/disabled|prev-month|next-month/.test(String(cell.className)) &&
          Number((cell.textContent || "").trim()) === targetDay;
      });
      if (!clickElementDateCell(dayCell)) return directDateInputFallback(
        element, dateValue, targetYear, targetMonth, targetDay,
      );
    } else {
      const monthCell = Array.from(calendar.querySelectorAll(
        ".el-month-table td, [class*='month-table'] td",
      )).find((cell) => {
        const numeric = Number((cell.textContent || "").match(/\d{1,2}/)?.[0]);
        return isVisible(cell) && !/disabled/.test(String(cell.className)) && numeric === targetMonth;
      });
      if (!clickElementDateCell(monthCell)) return directDateInputFallback(
        element, dateValue, targetYear, targetMonth, targetDay,
      );
    }
    await wait(150);
    if (datePartsMatch(element, targetYear, targetMonth, targetDay)) return true;
    return directDateInputFallback(element, dateValue, targetYear, targetMonth, targetDay);
  }

  async function setAntDatePickerValue(element, value) {
    const match = String(value).match(/^(\d{4})\D?(\d{2})(?:\D?(\d{2}))?\D*$/);
    if (!match) return false;
    const targetYear = Number(match[1]);
    const targetMonth = Number(match[2]);
    const targetDay = match[3] ? Number(match[3]) : null;

    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    element.click();
    await wait(100);
    let calendar = visibleAntCalendarFor(element);
    if (!calendar) return false;

    const yearSelect = calendar.querySelector(".ant-calendar-year-select, .ant-picker-year-btn");
    const displayedYear = Number((yearSelect?.innerText || yearSelect?.textContent || "").match(/\d{4}/)?.[0]);
    if (displayedYear) {
      const yearDifference = targetYear - displayedYear;
      const yearButton = yearDifference < 0
        ? calendar.querySelector(".ant-calendar-prev-year-btn, .ant-picker-header-super-prev-btn")
        : calendar.querySelector(".ant-calendar-next-year-btn, .ant-picker-header-super-next-btn");
      if (!yearButton && yearDifference) return false;
      for (let count = 0; count < Math.min(Math.abs(yearDifference), 20); count += 1) {
        yearButton.click();
        await wait(16);
      }
      if (Math.abs(yearDifference) > 20) return false;
      calendar = visibleAntCalendarFor(element) || calendar;
    }

    if (targetDay === null) {
      const monthCells = Array.from(calendar.querySelectorAll(
        ".ant-calendar-month-panel-cell, .ant-picker-month-panel .ant-picker-cell",
      )).filter((cell) => isVisible(cell) && !/disabled/.test(cell.className));
      const monthCell = monthCells.find((cell) => {
        const title = cell.getAttribute("title") || cell.querySelector("[title]")?.getAttribute("title") || "";
        return title === `${match[1]}-${match[2]}`;
      }) || monthCells.find((cell) => Number.parseInt(cell.textContent.trim(), 10) === targetMonth);
      if (!monthCell) return false;
      monthCell.click();
      await wait(80);
      const selected = readControlValue(element).match(/\d+/g) || [];
      return Number(selected[0]) === targetYear && Number(selected[1]) === targetMonth;
    }

    const monthSelect = calendar.querySelector(".ant-calendar-month-select, .ant-picker-month-btn");
    const displayedMonthText = monthSelect?.innerText || monthSelect?.textContent || "";
    const displayedMonth = Number(displayedMonthText.match(/\d{1,2}/)?.[0]);
    if (displayedMonth) {
      const monthDifference = targetMonth - displayedMonth;
      const monthButton = monthDifference < 0
        ? calendar.querySelector(".ant-calendar-prev-month-btn, .ant-picker-header-prev-btn")
        : calendar.querySelector(".ant-calendar-next-month-btn, .ant-picker-header-next-btn");
      if (!monthButton && monthDifference) return false;
      for (let count = 0; count < Math.abs(monthDifference); count += 1) {
        monthButton.click();
        await wait(16);
      }
      calendar = visibleAntCalendarFor(element) || calendar;
    }

    const dateValue = `${String(targetYear).padStart(4, "0")}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
    const titledCell = calendar.querySelector(`[title="${dateValue}"]`);
    let dateButton = titledCell?.querySelector?.(".ant-calendar-date, .ant-picker-cell-inner") || titledCell;
    if (!dateButton) {
      dateButton = Array.from(calendar.querySelectorAll(".ant-calendar-date, .ant-picker-cell-in-view .ant-picker-cell-inner"))
        .find((item) => Number(item.innerText || item.textContent) === targetDay);
    }
    if (!dateButton) return false;
    dateButton.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    dateButton.click();
    await wait(80);
    return readControlValue(element).startsWith(dateValue);
  }

  async function setControlValue(element, value, semanticKey = "") {
    if (value === undefined || value === null || value === "") return false;
    if (LOCATION_PROFILE_KEYS.has(semanticKey)) {
      return setLocationControlValue(element, value);
    }
    if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio")) {
      setChecked(element, Boolean(value));
      return true;
    }
    if (element instanceof HTMLSelectElement) return setSelectValue(element, value);
    let formatted = formatDateValue(element, String(value), semanticKey);
    if (element instanceof HTMLInputElement && element.type === "number" &&
      ["height", "weight", "workYears"].includes(semanticKey)) {
      formatted = String(value).match(/-?\d+(?:\.\d+)?/)?.[0] || "";
      if (!formatted) return false;
    }
    if (element.closest?.(".ant-calendar-picker, .ant-picker")) {
      return setAntDatePickerValue(element, formatted);
    }
    if (elementDateWrapper(element)) {
      return setElementDatePickerValue(element, formatted);
    }
    if (["birthDate", "startDate", "endDate"].includes(semanticKey) &&
      (element.readOnly || isInteractiveDateControl(element) || /日期|时间|date|month|calendar/i.test(dateFormatHints(element)))) {
      return setGenericDatePickerValue(element, formatted);
    }
    if (isCustomControl(element)) {
      const selected = await setCustomSelectValue(element, String(value));
      if (selected) return true;
      return false;
    }
    setNativeValue(element, formatted);
    return true;
  }

  function optionNumbers(element) {
    const nativeOptions = element instanceof HTMLSelectElement ? Array.from(element.options) : [];
    const nestedOptions = nativeOptions.length ? nativeOptions : Array.from(element.querySelectorAll?.(
      "option, [role='option'], li",
    ) || []);
    return nestedOptions.map((option) => Number(String(
      option.textContent || option.getAttribute?.("value") || "",
    ).match(/\d{1,4}/)?.[0])).filter(Number.isFinite);
  }

  function datePartForControl(element) {
    const nested = element.querySelector?.("input:not([type='hidden']), select");
    const control = nested && isVisible(nested) ? nested : element;
    const type = String(control.getAttribute?.("type") || "").toLowerCase();
    if (["date", "month"].includes(type)) return null;
    const hints = compactText([
      control.getAttribute?.("placeholder"), control.getAttribute?.("aria-label"),
      control.getAttribute?.("title"), control.getAttribute?.("data-field"), fieldHints(element),
    ].filter(Boolean).join(" "));
    const atomicHints = controlAtomicHints(element);
    const flags = [
      /(?:^|时间|日期|开始|结束|出生|入学|毕业|入职|离职)(?:年份?|year)|年份|选择年|^年$/i.test(hints) ||
        atomicHints.some((hint) => /^(?:年|年份|year)$/.test(hint)),
      /(?:^|时间|日期|开始|结束|出生|入学|毕业|入职|离职)(?:月份?|month)|月份|选择月|^月$/i.test(hints) ||
        atomicHints.some((hint) => /^(?:月|月份|month)$/.test(hint)),
      /(?:^|时间|日期|开始|结束|出生)(?:日(?!期)|day)|选择日(?!期)|^日$/i.test(hints) ||
        atomicHints.some((hint) => /^(?:日|day)$/.test(hint)),
    ];
    if (flags.filter(Boolean).length === 1) return ["year", "month", "day"][flags.findIndex(Boolean)];
    if (!/时间|日期|年份?|月份?|年月|start|end|date|from|to|毕业|入学|入职|离职|出生/i.test(hints)) {
      return null;
    }
    const numbers = optionNumbers(element);
    if (numbers.filter((number) => number >= 1900 && number <= 2200).length >= 2) return "year";
    if (numbers.length >= 6 && numbers.every((number) => number >= 1 && number <= 12)) return "month";
    if (numbers.length >= 13 && numbers.every((number) => number >= 1 && number <= 31)) return "day";
    return null;
  }

  function dateSourceFromText(value, section) {
    const text = compactText(value);
    if (section === "family" && /出生|生日|birth/.test(text)) return "birthDate";
    if (/入学|入校|入职|开始|起始|起聘|from|start|begin|entrance/i.test(text)) return "startDate";
    if (/毕业|离职|结束|截止|终止|退休|to|end|graduate/i.test(text)) return "endDate";
    return null;
  }

  function commonElementAncestor(elements) {
    if (!elements.length) return null;
    let current = elements[0].parentElement;
    while (current && current !== document.body) {
      if (elements.every((element) => current.contains(element))) return current;
      current = current.parentElement;
    }
    return null;
  }

  function compoundContextText(elements) {
    const ancestor = commonElementAncestor(elements);
    if (!ancestor) return elements.map(fieldHints).join(" ");
    const headings = Array.from(ancestor.querySelectorAll(
      ":scope > legend, :scope > h1, :scope > h2, :scope > h3, :scope > h4, " +
      ":scope > [role='heading'], :scope > [class*='title'], :scope > [class*='label']",
    )).slice(0, 8).map((item) => item.textContent || "");
    return [directText(ancestor), ...headings, ...elements.map(fieldHints)].join(" ").slice(0, 1000);
  }

  function dateParts(value) {
    const match = String(value || "").match(/^(\d{4})\D?(\d{1,2})(?:\D?(\d{1,2}))?/);
    return match ? { year: Number(match[1]), month: Number(match[2]), day: match[3] ? Number(match[3]) : null } : null;
  }

  function numericControlValue(element) {
    if (element instanceof HTMLSelectElement) {
      const selected = element.selectedOptions[0];
      const selectedNumber = numericDateOptionValue(selected);
      return selectedNumber === null ? Number.NaN : selectedNumber;
    }
    const displayed = readControlValue(element);
    const number = numericDateLabelValue(displayed);
    return number === null ? Number.NaN : number;
  }

  async function setDatePartControl(element, component, part) {
    if (!Number.isFinite(part)) return false;
    if (element instanceof HTMLSelectElement) {
      const matches = Array.from(element.options).filter((option) =>
        numericDateOptionValue(option) === part);
      if (matches.length !== 1) return false;
      setNativeValue(element, matches[0].value);
      await wait(30);
      return numericControlValue(element) === part;
    }
    if (isCustomControl(element)) {
      if (!await setCustomSelectValue(element, String(part))) return false;
      await wait(40);
      return numericControlValue(element) === part;
    }
    const plain = String(part);
    const padded = plain.padStart(2, "0");
    const values = component === "year" ? [plain] : [...new Set([padded, plain])];
    for (const value of values) {
      setNativeValue(element, value);
      await wait(50);
      if (numericControlValue(element) === part) return true;
    }
    return false;
  }

  function controlCapability(element) {
    return {
      datePart: datePartForControl(element),
      locationLevel: locationLevelForField(element),
      adjacentDateTrigger: adjacentDateActivationTargets(element).length > 0,
      readOnly: Boolean(element.readOnly || element.querySelector?.("input[readonly]")),
    };
  }

  function isWholeDateControl(element) {
    if (datePartForControl(element)) return false;
    const nested = element.querySelector?.("input:not([type='hidden']), select");
    const control = nested && isVisible(nested) ? nested : element;
    const type = String(control.getAttribute?.("type") || "").toLowerCase();
    if (["date", "month"].includes(type) || isInteractiveDateControl(element)) return true;
    const hints = dateFormatHints(element);
    if (/yyyy|yy[-/.年]m|datefmt|datepicker|calendar|日期|出生年月|开始时间|结束时间|入职时间|离职时间/i.test(hints)) {
      return true;
    }
    return Boolean((control.readOnly || element.readOnly) && adjacentDateActivationTargets(element).length);
  }

  async function fillCompoundDateFields(section, record, elements, overwriteExisting, report) {
    const candidates = Array.from(new Set(elements || []))
      .filter((element) => element?.isConnected && isVisible(element) && !element.disabled)
      .map((element) => ({
        element,
        component: datePartForControl(element) || (isWholeDateControl(element) ? "whole" : null),
      }))
      .filter(({ component }) => Boolean(component))
      .sort((a, b) => a.element === b.element ? 0 :
        a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    const handled = new Set();
    handled.sourceKeys = new Set();
    if (!candidates.length) return handled;

    const context = compoundContextText(candidates.map(({ element }) => element));
    const contextSource = dateSourceFromText(context, section);
    const supportsRange = section !== "family" && (record?.startDate || record?.endDate);
    let activeSource = section === "family" ? "birthDate" : contextSource || "startDate";
    const seenParts = new Set();

    for (const candidate of candidates) {
      const explicit = classifyStructuredField(candidate.element, section);
      let sourceKey = ["startDate", "endDate", "birthDate"].includes(explicit) ? explicit : null;
      if (!sourceKey) sourceKey = dateSourceFromText(fieldHints(candidate.element), section);
      if (!sourceKey) {
        if (supportsRange && seenParts.has(candidate.component)) {
          activeSource = "endDate";
          seenParts.clear();
        }
        sourceKey = activeSource;
      } else {
        activeSource = sourceKey;
        if (sourceKey === "endDate" && seenParts.size) seenParts.clear();
      }
      seenParts.add(candidate.component);
      if (!record?.[sourceKey] || (sourceKey === "endDate" && record.current)) {
        handled.add(candidate.element);
        continue;
      }
      handled.sourceKeys.add(sourceKey);
      handled.add(candidate.element);
      if (candidate.component === "whole") {
        if (aiValuesEquivalent(candidate.element, record[sourceKey], sourceKey)) {
          report.unchanged += 1;
          continue;
        }
        if (!isUsable(candidate.element, overwriteExisting, sourceKey)) {
          report.skipped += 1;
          continue;
        }
        try {
          if (!await setControlValue(candidate.element, record[sourceKey], sourceKey)) {
            report.failed += 1;
            continue;
          }
          candidate.element.dataset.personalAutofill = "filled";
          report.filled += 1;
          report.sections[section] += 1;
        } catch (_) {
          report.failed += 1;
        }
        continue;
      }
      const parts = dateParts(record[sourceKey]);
      const wanted = parts?.[candidate.component];
      if (!Number.isFinite(wanted)) continue;
      const existing = numericControlValue(candidate.element);
      if (existing === wanted) {
        report.unchanged += 1;
        continue;
      }
      if (existing && !overwriteExisting) {
        report.skipped += 1;
        continue;
      }
      try {
        if (!await setDatePartControl(candidate.element, candidate.component, wanted)) {
          report.failed += 1;
          continue;
        }
        candidate.element.dataset.personalAutofill = "filled";
        report.filled += 1;
        report.sections[section] += 1;
      } catch (_) {
        report.failed += 1;
      }
    }
    return handled;
  }

  async function fillKnownStructuredFields(section, record, elements, overwriteExisting, report, initialHandled) {
    const handled = initialHandled || new Set();
    const sourceKeys = new Set(initialHandled?.sourceKeys || []);
    const usedKeys = new Set();
    const fallbackKeysBySection = {
      education: ["description"],
      work: ["responsibilities", "achievements"],
      project: ["description", "achievements"],
    };
    const unclassifiedTextareas = (elements || []).filter((element) =>
      (element instanceof HTMLTextAreaElement || element.isContentEditable) &&
      !classifyStructuredField(element, section) && !handled.has(element) &&
      element.isConnected && isVisible(element) && !isProtectedField(element));
    const fallbackAssignments = new Map();
    const fallbackKeys = (fallbackKeysBySection[section] || []).filter((key) => {
      const value = valueForStructuredField(section, record, key);
      return value !== "" && value !== undefined && value !== null && value !== false;
    });
    for (let index = 0; index < Math.min(unclassifiedTextareas.length, fallbackKeys.length); index += 1) {
      fallbackAssignments.set(unclassifiedTextareas[index], fallbackKeys[index]);
    }
    for (const element of elements || []) {
      if (handled.has(element) || !element?.isConnected || !isVisible(element) || isProtectedField(element)) continue;
      const key = classifyStructuredField(element, section) || fallbackAssignments.get(element);
      if (!key || usedKeys.has(key)) continue;
      const value = valueForStructuredField(section, record, key);
      if (value === "" || value === undefined || value === null || value === false) continue;
      if (element instanceof HTMLInputElement && ["checkbox", "radio"].includes(element.type) &&
        typeof value !== "boolean") continue;
      usedKeys.add(key);
      sourceKeys.add(key);
      handled.add(element);
      if (aiValuesEquivalent(element, value, key)) {
        report.unchanged += 1;
        continue;
      }
      if (!isUsable(element, overwriteExisting, key)) {
        report.skipped += 1;
        continue;
      }
      try {
        if (!await setControlValue(element, value, key)) {
          report.failed += 1;
          continue;
        }
        element.dataset.personalAutofill = "filled";
        report.filled += 1;
        report.sections[section] += 1;
      } catch (_) {
        report.failed += 1;
      }
    }
    return { handled, sourceKeys };
  }

  function profileValue(profile, key) {
    if (profile[key]) return profile[key];
    if (LOCATION_PROFILE_KEYS.has(key) && profile.locations?.[key]) {
      const location = profile.locations[key];
      return [location.province, location.city, location.district].filter(Boolean).join(" / ");
    }
    if (key === "fullName") return `${profile.lastName || ""}${profile.firstName || ""}`.trim();
    return "";
  }

  function locationProfileKeyFromText(value) {
    const text = compactText(value);
    const matches = [
      ["householdRegistration", /户籍|户口|household|hukou/i],
      ["nativePlace", /籍贯|nativeplace|placeoforigin/i],
      ["studentOrigin", /生源|studentorigin/i],
      ["birthPlace", /出生地|出生地点|birthplace/i],
      ["currentResidence", /现居|现住|currentresidence|residential/i],
    ].filter(([, pattern]) => pattern.test(text));
    return matches.length === 1 ? matches[0][0] : null;
  }

  function locationGroupKey(element) {
    const directKey = classifyBasicField(element);
    if (LOCATION_PROFILE_KEYS.has(directKey)) return directKey;
    let node = element.parentElement;
    for (let depth = 0; node && node !== document.body && depth < 7; depth += 1, node = node.parentElement) {
      const controls = Array.from(node.querySelectorAll(CONTROL_SELECTOR)).filter(isVisible);
      if (!controls.length || controls.length > 6) continue;
      const headings = Array.from(node.querySelectorAll(
        ":scope > legend, :scope > h1, :scope > h2, :scope > h3, :scope > h4, " +
        ":scope > [role='heading'], :scope > [class*='title']",
      )).map((item) => item.textContent || "");
      const key = locationProfileKeyFromText(`${structuralText(node)} ${directText(node)} ${headings.join(" ")}`);
      if (key) return key;
    }
    return null;
  }

  async function fillCompoundBasicLocations(profile, controls, overwriteExisting, state, report) {
    const groups = new Map();
    for (const element of controls) {
      const level = locationLevelForField(element);
      if (level === null) continue;
      const key = locationGroupKey(element);
      if (!key || !profileValue(profile, key)) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ element, level });
    }
    for (const [key, fields] of groups) {
      const uniqueLevels = new Set(fields.map(({ level }) => level));
      if (uniqueLevels.size !== fields.length) continue;
      const value = profileValue(profile, key);
      for (const { element } of fields) {
        state.filledElements.add(element);
        if (!isUsable(element, overwriteExisting, key)) {
          report.skipped += 1;
          continue;
        }
        try {
          if (!await setLocationControlValue(element, value)) {
            report.failed += 1;
            continue;
          }
          element.dataset.personalAutofill = "filled";
          report.filled += 1;
          report.sections.basic += 1;
        } catch (_) {
          report.failed += 1;
        }
      }
    }
  }

  function customFieldValue(element, customFields) {
    if (!Array.isArray(customFields) || !customFields.length) return "";
    const hints = normalizeMatchText(fieldHints(element));
    if (!hints) return "";

    const matches = customFields
      .filter((item) => item?.label && item?.value)
      .map((item) => {
        const keywordTerms = String(item.keywords || "").replace(/[,，;；|\n]+/g, " ").trim().split(/\s+/);
        const terms = [item.label, ...keywordTerms].map(normalizeMatchText).filter(Boolean);
        const score = terms.reduce((best, term) => {
          if (/^[a-z0-9 ]+$/i.test(term)) {
            if (term.replace(/\s+/g, "").length < 3 || GENERIC_CUSTOM_TERMS.has(term)) {
              return Math.max(best, hints === term ? 100 : 0);
            }
            if (` ${hints} `.includes(` ${term} `)) return Math.max(best, hints === term ? 100 : 70);
            return best;
          }
          const compactTerm = term.replace(/\s+/g, "");
          const compactHints = hints.replace(/\s+/g, "");
          if (compactTerm.length < 2 || !compactHints.includes(compactTerm)) return best;
          return Math.max(best, compactHints === compactTerm ? 100 : 70);
        }, 0);
        return { item, score };
      })
      .filter((match) => match.score)
      .sort((a, b) => b.score - a.score);
    return matches[0] ? String(matches[0].item.value) : "";
  }

  function collectRoots(root = document) {
    const roots = [root];
    for (const node of root.querySelectorAll("*")) {
      if (node.shadowRoot) roots.push(...collectRoots(node.shadowRoot));
    }
    return roots;
  }

  function collectControls() {
    const controls = [];
    const seen = new Set();
    for (const root of collectRoots()) {
      for (const element of root.querySelectorAll(CONTROL_SELECTOR)) {
        if (seen.has(element) || isProtectedField(element)) continue;
        if (element.getAttribute?.("role") === "combobox" || element.matches?.(
          ".ant-select, .ant-cascader-picker, .el-select, .el-cascader, .ivu-select, .ivu-cascader")) {
          // Ant Design and similar libraries often keep a zero-sized search input inside
          // the visible combobox. Skipping the wrapper in that case drops the control
          // completely because the hidden descendant is not usable. Deduplicate only when
          // the nested native control is itself visible and can actually receive a value.
          const nestedControl = element.querySelector?.("input, textarea, select");
          if (nestedControl && isVisible(nestedControl)) continue;
        }
        seen.add(element);
        controls.push(element);
      }
    }
    return controls;
  }

  function nearestRecordContainer(element) {
    const explicit = element.closest?.(RECORD_CONTAINER_SELECTOR);
    if (explicit && explicit.querySelectorAll(CONTROL_SELECTOR).length >= 2) return explicit;

    let ancestor = element.parentElement;
    for (let depth = 0; ancestor && ancestor !== document.body && depth < 6; depth += 1, ancestor = ancestor.parentElement) {
      const count = ancestor.querySelectorAll(CONTROL_SELECTOR).length;
      if (count < 2 || count > 30) continue;
      const siblings = Array.from(ancestor.parentElement?.children || []).filter((sibling) => {
        if (sibling === ancestor || sibling.tagName !== ancestor.tagName) return false;
        return sibling.querySelectorAll?.(CONTROL_SELECTOR).length >= 2;
      });
      if (siblings.length) return ancestor;
    }
    return null;
  }

  function boundedStructuredContainer(element, section) {
    const inferencePattern = STRUCTURED_INFERENCE_PATTERNS[section];
    if (!inferencePattern) return null;
    let ancestor = element.parentElement;
    for (let depth = 0; ancestor && ancestor !== document.body && depth < 12;
      depth += 1, ancestor = ancestor.parentElement) {
      const controls = Array.from(ancestor.querySelectorAll(CONTROL_SELECTOR))
        .filter((control) => isVisible(control) && !control.disabled && !isProtectedField(control) &&
          !isPresenceGateControl(control));
      if (controls.length < 2 || controls.length > 40) continue;
      const descriptors = controls.map((control) => ({
        element: control,
        key: classifyStructuredField(control, section),
      })).filter(({ key }) => Boolean(key));
      if (new Set(descriptors.map(({ key }) => key)).size < 2) continue;
      const anchors = descriptors.filter(({ element: control }) => inferencePattern.test(fieldHints(control)));
      if (!anchors.length) continue;
      const directBranch = (node) => {
        let branch = node;
        while (branch?.parentElement && branch.parentElement !== ancestor) branch = branch.parentElement;
        return branch;
      };
      const elementBranch = directBranch(element);
      const anchorBranches = new Set(anchors.map(({ element: control }) => directBranch(control)).filter(Boolean));
      if (!anchorBranches.has(elementBranch) && (elementBranch?.matches?.("section, article, fieldset") ||
        elementBranch?.querySelector?.("h1, h2, h3, h4, h5, legend, [role='heading']"))) continue;
      return ancestor;
    }
    return null;
  }

  function collectStructuredDescriptors(section) {
    return collectControls()
      .filter((element) => isVisible(element) && detectStructuredSection(element) === section)
      .map((element) => ({
        element,
        key: classifyStructuredField(element, section),
        container: boundedStructuredContainer(element, section),
      }))
      .filter((descriptor) => descriptor.key && descriptor.container);
  }

  function groupDescriptors(descriptors) {
    const groups = [];
    const groupByContainer = new Map();
    const loose = [];
    for (const descriptor of descriptors) {
      if (!descriptor.container) {
        loose.push(descriptor);
        continue;
      }
      const currentGroup = groupByContainer.get(descriptor.container);
      const duplicate = currentGroup?.fields.some((field) => field.key === descriptor.key);
      const compoundDateDuplicate = duplicate && ["startDate", "endDate", "birthDate"].includes(descriptor.key) &&
        Boolean(datePartForControl(descriptor.element)) && currentGroup.fields
          .filter((field) => field.key === descriptor.key)
          .every((field) => Boolean(datePartForControl(field.element)));
      if (!currentGroup || (duplicate && !compoundDateDuplicate)) {
        const group = { container: descriptor.container, fields: [] };
        groupByContainer.set(descriptor.container, group);
        groups.push(group);
      }
      groupByContainer.get(descriptor.container).fields.push(descriptor);
    }

    let current = null;
    for (const descriptor of loose) {
      const duplicate = current?.fields.some((field) => field.key === descriptor.key);
      const compoundDateDuplicate = duplicate && ["startDate", "endDate", "birthDate"].includes(descriptor.key) &&
        Boolean(datePartForControl(descriptor.element)) && current.fields
          .filter((field) => field.key === descriptor.key)
          .every((field) => Boolean(datePartForControl(field.element)));
      if (!current || (duplicate && !compoundDateDuplicate)) {
        current = { container: null, fields: [] };
        groups.push(current);
      }
      current.fields.push(descriptor);
    }

    return groups.sort((a, b) => {
      const firstA = a.fields[0]?.element;
      const firstB = b.fields[0]?.element;
      if (!firstA || !firstB || firstA === firstB) return 0;
      return firstA.compareDocumentPosition(firstB) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  }

  function recordHasContent(record) {
    return Object.entries(record || {}).some(([key, value]) => key !== "id" && value !== false && String(value || "").trim());
  }

  function isHighSchoolEducation(record) {
    return /高中|高级中学|high\s*school|secondary\s*school/i.test(record?.educationLevel || "");
  }

  function fieldIdentityText(element) {
    const parentLabel = element.closest?.("label");
    const formItem = element.closest?.(".form-item, .el-form-item, .ant-form-item, [class*='formItem'], [class*='form-item']");
    const separateLabel = formItem?.querySelector?.(
      ".form-label, .control-label, .el-form-item__label, .ant-form-item-label, label",
    );
    return [
      element.id,
      element.name,
      element.placeholder,
      element.getAttribute?.("aria-label"),
      directText(parentLabel),
      separateLabel && (directText(separateLabel) || separateLabel.innerText || separateLabel.textContent),
    ].filter(Boolean).join(" ");
  }

  function valueForStructuredField(section, record, key) {
    if (!record) return "";
    if (key === "endDate" && record.current) return "";
    if (section === "education" && key === "educationLevel" && !record.educationLevel) return record.degree || "";
    if (section === "work" && key === "responsibilities") return record.responsibilities || record.achievements || "";
    if (section === "project" && key === "description") return record.description || record.achievements || "";
    return record[key];
  }

  function createReport() {
    return { filled: 0, skipped: 0, unchanged: 0, failed: 0,
      sections: { basic: 0, education: 0, work: 0, project: 0, family: 0 } };
  }

  function chinaMobileFamilyEditor() {
    const isSite = location.hostname === "job.10086.cn" && location.pathname === "/personal/resume_campus.html";
    const isFixture = location.hostname === "localhost" &&
      document.documentElement.hasAttribute("data-autofill-demo-mobile");
    if (!isSite && !isFixture) return null;
    const section = document.querySelector("#familyInfo");
    const editor = Array.from(section?.children || []).filter((child) => child.classList.contains("secC"))[1];
    return editor && isVisible(editor) ? editor : null;
  }

  function is51jobProjectPage() {
    const isSite = location.hostname === "xyz.51job.com" &&
      /^\/External\/MyResume\/FillInResume\.aspx$/i.test(location.pathname);
    const isFixture = ["localhost", "127.0.0.1"].includes(location.hostname) &&
      document.documentElement.hasAttribute("data-autofill-demo-51job");
    return isSite || isFixture;
  }

  function is51jobFamilyPage() {
    return is51jobProjectPage();
  }

  function fiftyOneJobFamilyFieldKey(label) {
    const text = String(label || "").replace(/[\s*＊:：]/g, "");
    if (/^是否移动系统内任职$/.test(text)) return "worksInSystem";
    if (/^(?:亲属|家属)姓名$/.test(text)) return "relativeName";
    if (/^(?:亲属|家属)关系$/.test(text)) return "relationship";
    if (/^(?:亲属|家属)性别$/.test(text)) return "gender";
    if (/^(?:亲属|家属)出生日期$/.test(text)) return "birthDate";
    if (/^(?:亲属|家属)政治面貌$/.test(text)) return "politicalStatus";
    if (/^(?:亲属|家属)工作单位$/.test(text)) return "employer";
    if (/^(?:亲属|家属)职位$/.test(text)) return "position";
    if (/^现居住地址$/.test(text)) return "currentAddress";
    if (/^(?:亲属|家属)联系电话$/.test(text)) return "phone";
    return null;
  }

  function fiftyOneJobFamilyGroups() {
    const rows = Array.from(document.querySelectorAll("dl"))
      .filter((row) => isVisible(row))
      .map((row) => {
        const key = fiftyOneJobFamilyFieldKey(row.querySelector(":scope > dt")?.textContent);
        const detail = row.querySelector(":scope > dd");
        const controls = Array.from(detail?.querySelectorAll("input:not([type='hidden']):not([type='radio']), select, textarea") || [])
          .filter((control) => isVisible(control) && !control.disabled);
        return key && controls.length ? { key, controls } : null;
      })
      .filter(Boolean);

    const groups = [];
    let group = null;
    for (const field of rows) {
      if (field.key === "worksInSystem" || (field.key === "relativeName" && group?.fields.some(({ key }) => key === "relativeName"))) {
        if (group?.fields.length) groups.push(group);
        group = { fields: [] };
      }
      if (!group) group = { fields: [] };
      if (!group.fields.some(({ key }) => key === field.key)) group.fields.push(field);
    }
    if (group?.fields.length) groups.push(group);
    return groups.filter(({ fields }) => {
      const keys = new Set(fields.map(({ key }) => key));
      return keys.has("relativeName") && keys.has("relationship") && keys.has("birthDate");
    });
  }

  function fiftyOneJobFamilyTargetMatches(target, group) {
    if (!target?.isConnected) return false;
    return group.fields.some(({ controls }) => controls.some((element) =>
      element === target || element.contains(target) || target.contains(element)));
  }

  function fiftyOneJobSelectOption(select, value, key) {
    const expected = normalizeMatchText(value);
    const relationshipAliases = {
      父亲: ["父亲", "父子", "父女"],
      母亲: ["母亲", "母子", "母女"],
      配偶: ["配偶", "夫妻", "丈夫", "妻子"],
    };
    const exact = Array.from(select.options).filter((option) =>
      [option.textContent, option.value].some((text) => normalizeMatchText(text) === expected));
    if (exact.length === 1) return exact[0];
    if (exact.length > 1) return null;
    const aliases = key === "relationship" ? relationshipAliases[String(value).trim()] || [] : [];
    const aliasMatches = Array.from(select.options).filter((option) =>
      aliases.some((alias) => normalizeMatchText(option.textContent) === normalizeMatchText(alias)));
    return aliasMatches.length === 1 ? aliasMatches[0] : null;
  }

  async function set51jobFamilySelect(select, value, key) {
    const option = fiftyOneJobSelectOption(select, value, key);
    if (!option) return false;
    if (select.value === option.value) return true;
    setNativeValue(select, option.value);
    await wait(50);
    return select.value === option.value;
  }

  async function set51jobFamilyAddress(controls, value) {
    const selects = controls.filter((control) => control instanceof HTMLSelectElement);
    const textInput = controls.find((control) => control instanceof HTMLInputElement && !control.readOnly);
    if (!selects.length && textInput) {
      setNativeValue(textInput, String(value));
      return { filled: readControlValue(textInput) === String(value), remainder: "" };
    }
    if (!selects.length) return { filled: false, remainder: "" };

    let remaining = normalizeChinaMobileLocation(value);
    let selected = 0;
    for (const select of selects) {
      let match = null;
      for (let attempt = 0; attempt < 10; attempt += 1) {
        match = matchChinaMobileLocationOption(select.options, remaining);
        if (match || attempt === 9) break;
        await wait(50);
      }
      if (!match) break;
      if (select.value !== match.option.value) {
        setNativeValue(select, match.option.value);
        await wait(80);
      }
      if (select.value !== match.option.value) break;
      selected += 1;
      remaining = remaining.slice(match.consumed).replace(/^[省市县区]/, "");
      select.dataset.personalAutofill = "filled";
      if (!remaining) break;
    }
    return { filled: selected > 0, remainder: remaining };
  }

  async function fill51jobFamily(record, overwriteExisting) {
    const report = createReport();
    if (!String(record.relativeName || "").trim()) return { status: "no_match", ...report };
    const groups = fiftyOneJobFamilyGroups();
    if (!groups.length) return { status: "no_target", ...report };
    const focused = groups.filter((group) => fiftyOneJobFamilyTargetMatches(lastUserTarget, group));
    const group = focused.length === 1 ? focused[0] : groups.length === 1 ? groups[0] : null;
    if (!group) return { status: "ambiguous", ...report };

    const nameInput = group.fields.find(({ key }) => key === "relativeName")?.controls[0];
    const existingName = nameInput && readControlValue(nameInput);
    if (existingName && normalizeMatchText(existingName) !== normalizeMatchText(record.relativeName)) {
      return { status: "record_conflict", ...report };
    }

    let matched = 0;
    let addressRemainder = "";
    for (const { key, controls } of group.fields) {
      const value = record[key];
      if (value === "" || value === undefined || value === null) continue;
      matched += 1;
      const element = controls[0];
      if (key !== "currentAddress" && !(element instanceof HTMLSelectElement) &&
        !overwriteExisting && readControlValue(element)) {
        report.skipped += 1;
        continue;
      }
      if (key !== "currentAddress" && element instanceof HTMLSelectElement &&
        element.value === fiftyOneJobSelectOption(element, value, key)?.value) {
        report.skipped += 1;
        continue;
      }
      if (element instanceof HTMLSelectElement && existingName && !overwriteExisting &&
        readControlValue(element) && !/^(?:--)?请选择(?:--)?$/.test(element.selectedOptions[0]?.textContent?.trim() || "")) {
        report.skipped += 1;
        continue;
      }
      try {
        let filled = false;
        if (key === "currentAddress") {
          const result = await set51jobFamilyAddress(controls, value);
          filled = result.filled;
          addressRemainder = result.remainder;
        } else if (element instanceof HTMLSelectElement) {
          filled = await set51jobFamilySelect(element, value, key);
        } else {
          const formatted = formatDateValue(element, String(value), key);
          setNativeValue(element, formatted);
          await wait(30);
          filled = readControlValue(element) === formatted;
        }
        if (!filled) {
          report.failed += 1;
          continue;
        }
        element.dataset.personalAutofill = "filled";
        report.filled += 1;
        report.sections.family += 1;
      } catch (_) {
        report.failed += 1;
      }
    }
    if (report.filled) lastUserTarget = null;
    const reviews = [];
    if (addressRemainder) reviews.push("地址剩余区县或详细地址请手动补充");
    if (record.worksInSystem === "是") reviews.push("如出现亲属所在部门，请手动填写");
    return {
      status: report.filled ? "filled" : matched ? "no_empty" : "no_match",
      manualReview: reviews.join("；"),
      ...report,
    };
  }

  function fiftyOneJobProjectFieldKey(label) {
    const text = String(label || "").replace(/[\s*＊:：]/g, "");
    if (/^项目开始时间$/.test(text)) return "startDate";
    if (/^项目结束时间$/.test(text)) return "endDate";
    if (/^项目名称$/.test(text)) return "name";
    if (/^项目职责$/.test(text)) return "role";
    if (/^工作描述$/.test(text)) return "description";
    return null;
  }

  function fiftyOneJobProjectGroups() {
    const rows = Array.from(document.querySelectorAll("dl"))
      .filter((row) => isVisible(row))
      .map((row) => {
        const term = row.querySelector(":scope > dt");
        const detail = row.querySelector(":scope > dd");
        const key = fiftyOneJobProjectFieldKey(term?.textContent);
        const controls = Array.from(detail?.querySelectorAll("input:not([type='hidden']):not([type='radio']), textarea") || [])
          .filter((control) => isVisible(control) && !control.disabled);
        return key && controls.length === 1 ? { key, element: controls[0] } : null;
      })
      .filter(Boolean);

    const groups = [];
    let group = null;
    for (const field of rows) {
      if (field.key === "startDate") {
        if (group) groups.push(group);
        group = { fields: [] };
      }
      if (group && !group.fields.some(({ key }) => key === field.key)) group.fields.push(field);
    }
    if (group) groups.push(group);
    return groups.filter(({ fields }) => {
      const keys = new Set(fields.map(({ key }) => key));
      return keys.has("name") && keys.has("startDate") && keys.has("endDate") &&
        (keys.has("role") || keys.has("description"));
    });
  }

  async function fill51jobProject(record, overwriteExisting) {
    const report = createReport();
    if (!String(record.name || "").trim()) return { status: "no_match", ...report };
    const groups = currentViewGroups("project", fiftyOneJobProjectGroups());
    if (!groups.length) return { status: "no_target", ...report };
    const focused = groups.filter((group) => targetMatchesGroup(lastUserTarget, group));
    const group = focused.length === 1 ? focused[0] : groups.length === 1 ? groups[0] : null;
    if (!group) return { status: "ambiguous", ...report };

    const nameInput = group.fields.find(({ key }) => key === "name")?.element;
    const existingName = nameInput && readControlValue(nameInput);
    if (existingName &&
      normalizeMatchText(existingName) !== normalizeMatchText(record.name)) {
      return { status: "project_conflict", ...report };
    }

    let matched = 0;
    for (const { key, element } of group.fields) {
      const value = valueForStructuredField("project", record, key);
      if (value === "" || value === undefined || value === null) continue;
      matched += 1;
      if (!overwriteExisting && readControlValue(element)) {
        report.skipped += 1;
        continue;
      }
      try {
        const formatted = formatDateValue(element, String(value), key);
        setNativeValue(element, formatted);
        await wait(30);
        if (readControlValue(element) !== formatted) {
          report.failed += 1;
          continue;
        }
        element.dataset.personalAutofill = "filled";
        report.filled += 1;
        report.sections.project += 1;
      } catch (_) {
        report.failed += 1;
      }
    }
    if (report.filled) lastUserTarget = null;
    return {
      status: report.filled ? "filled" : matched ? "no_empty" : "no_match",
      manualReview: report.filled ? "请核对日期与项目内容，再手动保存" : "",
      ...report,
    };
  }

  function chinaMobileDisplayValue(element) {
    if (element instanceof HTMLInputElement) return readControlValue(element);
    return (element.querySelector(":scope > span")?.textContent || "").trim();
  }

  function chinaMobileValueIsEmpty(element) {
    const value = chinaMobileDisplayValue(element);
    if (!value || value === "请选择") return true;
    return element instanceof HTMLInputElement && value === element.defaultValue.trim();
  }

  async function chooseChinaMobileOption(element, value) {
    element.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    const expected = normalizeMatchText(value);
    const matches = Array.from(element.querySelectorAll(":scope > ul > li"))
      .filter((option) => normalizeMatchText(option.textContent) === expected);
    if (matches.length !== 1) return false;
    matches[0].click();
    await wait(30);
    return normalizeMatchText(chinaMobileDisplayValue(element)) === expected;
  }

  async function chooseChinaMobileBirthday(element, value) {
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;
    const [, year, month, day] = match;
    element.click();
    const yearPanel = element.querySelector(":scope > .slideConYear");
    if (!yearPanel || !isVisible(yearPanel)) return false;

    let yearOption;
    for (let attempt = 0; attempt < 18; attempt += 1) {
      yearOption = Array.from(yearPanel.querySelectorAll("ul > li"))
        .find((item) => item.textContent.trim() === year);
      if (yearOption) break;
      const years = yearPanel.querySelector(".slideP font")?.textContent.match(/(\d{4})\s*-\s*(\d{4})/);
      if (!years) return false;
      const arrow = Number(year) < Number(years[1])
        ? yearPanel.querySelector(".slideP .lf")
        : yearPanel.querySelector(".slideP .rg");
      if (!arrow) return false;
      arrow.click();
      await wait(15);
    }
    if (!yearOption) return false;
    yearOption.click();

    const monthPanel = element.querySelector(":scope > .slideConMon");
    const monthOption = Array.from(monthPanel?.querySelectorAll("ul > li") || [])
      .find((item) => Number(item.textContent.trim()) === Number(month));
    if (!monthOption || !isVisible(monthPanel)) return false;
    monthOption.click();

    const dayPanel = element.querySelector(":scope > .slideConDay");
    const dayOption = Array.from(dayPanel?.querySelectorAll("ul > li") || [])
      .find((item) => Number(item.textContent.trim()) === Number(day));
    if (!dayOption || !isVisible(dayPanel)) return false;
    dayOption.click();
    await wait(20);
    return chinaMobileDisplayValue(element) === `${year}-${month}-${day}`;
  }

  function normalizeChinaMobileLocation(value) {
    return String(value || "").replace(/[^\p{L}\p{N}]/gu, "");
  }

  function matchChinaMobileLocationOption(options, remaining) {
    const candidates = Array.from(options, (option) => {
      const full = normalizeChinaMobileLocation(option.textContent);
      const short = full.replace(/(?:特别行政区|自治区|自治州|省|市|县|区)$/, "");
      const consumed = remaining.startsWith(full) ? full.length
        : short.length >= 2 && remaining.startsWith(short) ? short.length : 0;
      return { option, consumed, length: full.length };
    }).filter((candidate) => candidate.consumed)
      .sort((a, b) => b.consumed - a.consumed || b.length - a.length);
    if (!candidates.length || (candidates[0].consumed === candidates[1]?.consumed &&
      candidates[0].length === candidates[1]?.length)) return null;
    return candidates[0];
  }

  async function chooseChinaMobileAddress(element, value) {
    const panel = element.closest("dd")?.querySelector(":scope > .citySlide");
    if (!panel) return false;
    let remaining = normalizeChinaMobileLocation(value);
    if (!remaining) return false;
    element.click();
    for (const level of ["dl_1", "dl_2", "dl_3"]) {
      const options = panel.querySelectorAll(`.chooseCon .${level} dd > a`);
      if (!options.length) continue;
      const match = matchChinaMobileLocationOption(options, remaining);
      if (!match) {
        panel.querySelector(".btnP .cancel, .shut")?.click();
        return false;
      }
      match.option.click();
      remaining = remaining.slice(match.consumed).replace(/^[省市县区]/, "");
      await wait(20);
    }
    if (remaining) {
      panel.querySelector(".btnP .cancel, .shut")?.click();
      return false;
    }
    panel.querySelector(".btnP .save")?.click();
    await wait(30);
    return !chinaMobileValueIsEmpty(element);
  }

  async function fillChinaMobileFamily(record, overwriteExisting, editor) {
    const report = createReport();
    const existingName = editor.querySelector("#folkName");
    if (!overwriteExisting && existingName && !chinaMobileValueIsEmpty(existingName) &&
      normalizeMatchText(readControlValue(existingName)) !== normalizeMatchText(record.relativeName)) {
      return { status: "record_conflict", ...report };
    }
    let matched = 0;
    const fields = [
      ["relativeName", "#folkName", "text"],
      ["relationship", "#folkRelationship", "select"],
      ["birthDate", "#family_birthday", "birthday"],
      ["gender", "#family_sex", "select"],
      ["worksInSystem", "#family_isEmployed", "select"],
      ["employer", "#folkCompany", "text"],
      ["position", "#folkJob", "text"],
      ["phone", "#family_contactMobile", "text"],
      ["politicalStatus", "#family_political", "select"],
      ["currentAddress", "#livePlace", "address"],
    ];

    for (const [key, selector, kind] of fields) {
      const value = record[key];
      if (value === undefined || value === null || String(value).trim() === "") continue;
      matched += 1;
      const element = editor.querySelector(selector);
      if (!element || !isVisible(element)) {
        report.failed += 1;
        continue;
      }
      if (!overwriteExisting && !chinaMobileValueIsEmpty(element)) {
        report.skipped += 1;
        continue;
      }
      try {
        let filled = false;
        if (kind === "text") {
          setNativeValue(element, String(value));
          filled = readControlValue(element) === String(value);
        } else if (kind === "select") {
          filled = await chooseChinaMobileOption(element, value);
        } else if (kind === "birthday") {
          filled = await chooseChinaMobileBirthday(element, value);
        } else {
          filled = await chooseChinaMobileAddress(element, value);
        }
        if (!filled) {
          report.failed += 1;
          continue;
        }
        element.dataset.personalAutofill = "filled";
        report.filled += 1;
        report.sections.family += 1;
      } catch (_) {
        report.failed += 1;
      }
    }
    if (report.filled) lastUserTarget = null;
    return {
      status: report.filled ? "filled" : matched ? "no_empty" : "no_match",
      manualReview: record.worksInSystem === "是" ? "若显示“亲属所在部门”，请手动填写" : "",
      ...report,
    };
  }

  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
  }

  const CURRENT_VIEW_ONLY_SECTIONS = new Set(["education", "work", "project"]);

  function groupHasViewportField(group) {
    return group.fields.some(({ element }) => isInViewport(element));
  }

  function currentViewGroups(section, groups) {
    return CURRENT_VIEW_ONLY_SECTIONS.has(section) ? groups.filter(groupHasViewportField) : groups;
  }

  function targetMatchesGroup(target, group) {
    if (!target?.isConnected) return false;
    return group.fields.some(({ element }) =>
      element === target || element.contains(target) || target.contains(element));
  }

  function isPresenceGateControl(element) {
    const hints = compactText(fieldHints(element));
    return /是否(?:有|具有|拥有).{0,18}(?:教育|学历|实习|工作|项目|科研|研究|家庭|亲属|经历)/.test(hints) ||
      /do\s*you\s*have.{0,30}(?:education|work|intern|project|research|family|experience)/i.test(hints);
  }

  function presenceGateMatchesSection(section, element) {
    const hints = compactText(fieldHints(element));
    const patterns = {
      education: /教育|学历|education|academic/i,
      work: /实习|工作|任职|work|intern|employment/i,
      project: /项目|科研|研究|project|research/i,
      family: /家庭|亲属|家属|family|relative/i,
    };
    return isPresenceGateControl(element) && Boolean(patterns[section]?.test(hints));
  }

  async function waitForStructuredControls(section, previousControlCount) {
    // Framework-driven forms often mount their real fields only after a presence gate changes.
    // Wait for semantic fields (preferred) or a clear increase in visible controls instead of
    // relying on one short fixed delay, which races React/Vue rendering on busy recruitment pages.
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const visibleControls = collectControls().filter((element) =>
        isVisible(element) && !element.disabled && !isPresenceGateControl(element));
      const semanticFields = visibleControls.filter((element) =>
        Boolean(classifyStructuredField(element, section)));
      if (semanticFields.length >= 2 || visibleControls.length >= previousControlCount + 2) return;
      await wait(120);
    }
  }

  async function prepareStructuredSection(section, record) {
    let changed = false;
    const controls = collectControls().filter((element) => isVisible(element) && !element.disabled);
    const previousControlCount = controls.filter((element) => !isPresenceGateControl(element)).length;
    const gate = controls.find((element) => presenceGateMatchesSection(section, element) &&
      (!CURRENT_VIEW_ONLY_SECTIONS.has(section) || isInViewport(element)));
    if (gate && !aiHasExistingValue(gate)) {
      try {
        changed = await setControlValue(gate, "是", "") || changed;
      } catch (_) { /* Leave the gate for manual handling. */ }
    }

    if (section === "family" && record?.worksInSystem) {
      const systemControl = controls.find((element) =>
        classifyStructuredField(element, "family") === "worksInSystem");
      if (systemControl && !aiHasExistingValue(systemControl)) {
        try {
          changed = await setControlValue(systemControl, record.worksInSystem, "worksInSystem") || changed;
        } catch (_) { /* Dynamic fields remain available for the normal mapping pass. */ }
      }
    }
    if (changed) {
      await waitForStructuredControls(section, previousControlCount);
      await wait(80);
    }
    return changed;
  }

  function explicitEducationStage(group) {
    const container = group.container;
    const heading = container?.querySelector?.("h1, h2, h3, h4, h5, legend, [role='heading']");
    const labelText = group.fields.map(({ element }) => fieldIdentityText(element)).join(" ");
    const text = `${heading?.textContent || ""} ${container?.getAttribute?.("data-record-kind") || ""} ${labelText}`;
    if (/高中|high\s*school|highSchool/i.test(text)) return "高中";
    for (const [stage, pattern] of [
      ["博士", /博士|doctoral|phd/i],
      ["硕士", /硕士|master/i],
      ["本科", /本科|bachelor|undergraduate/i],
      ["大专", /大专|专科|associate/i],
    ]) {
      if (pattern.test(text)) return stage;
    }
    if (/高校|大学|higherEducation|university|college/i.test(text)) return "higherEducation";
    return null;
  }

  function recordEducationStage(record) {
    const level = String(record.educationLevel || "");
    if (isHighSchoolEducation(record)) return "高中";
    if (/博士|doctoral|phd/i.test(level)) return "博士";
    if (/硕士|master/i.test(level)) return "硕士";
    if (/本科|bachelor|undergraduate/i.test(level)) return "本科";
    if (/大专|专科|associate/i.test(level)) return "大专";
    return null;
  }

  function manualCandidateGroups(section) {
    const detectedGroups = currentViewGroups(
      section,
      groupDescriptors(collectStructuredDescriptors(section)).filter((group) => {
        const keys = new Set(group.fields.map(({ key }) => key));
        return keys.size >= 2;
      }),
    );
    if (detectedGroups.length) return detectedGroups;

    const semanticDescriptors = collectControls()
      .filter((element) => isVisible(element) && !element.disabled && !isProtectedField(element) &&
        !isPresenceGateControl(element))
      .map((element) => ({
        element,
        key: classifyStructuredField(element, section),
        container: boundedStructuredContainer(element, section),
      }))
      .filter(({ key, container }) => Boolean(key && container));
    const semanticGroups = groupDescriptors(semanticDescriptors).filter((group) =>
      new Set(group.fields.map(({ key }) => key)).size >= 2);
    const viewportGroups = currentViewGroups(section, semanticGroups).filter(groupHasViewportField);
    if (viewportGroups.length) return viewportGroups;
    return CURRENT_VIEW_ONLY_SECTIONS.has(section) ? []
      : semanticGroups.length === 1 ? semanticGroups : [];
  }

  async function fillSelectedRecord(recordType, record, overwriteExisting) {
    const section = Object.keys(STRUCTURED_SECTIONS)
      .find((key) => STRUCTURED_SECTIONS[key].recordsKey === recordType);
    if (!section || !recordHasContent(record)) return { status: "no_target", ...createReport() };

    await prepareStructuredSection(section, record);

    if (section === "project" && is51jobProjectPage()) {
      return fill51jobProject(record, overwriteExisting);
    }

    if (section === "family") {
      if (is51jobFamilyPage()) return fill51jobFamily(record, overwriteExisting);
      const chinaMobileEditor = chinaMobileFamilyEditor();
      if (chinaMobileEditor) return fillChinaMobileFamily(record, overwriteExisting, chinaMobileEditor);
      if (location.hostname === "job.10086.cn" && location.pathname === "/personal/resume_campus.html") {
        return { status: "no_target", ...createReport() };
      }
    }

    const candidates = manualCandidateGroups(section);
    if (!candidates.length) return { status: "no_target", ...createReport() };
    const focused = candidates.filter((group) => targetMatchesGroup(lastUserTarget, group));
    const group = focused.length === 1 ? focused[0] : candidates.length === 1 ? candidates[0] : null;
    if (!group) return { status: "ambiguous", ...createReport() };

    if (section === "education") {
      const stage = explicitEducationStage(group);
      const recordStage = recordEducationStage(record);
      if (stage && recordStage && (stage === "higherEducation"
        ? recordStage === "高中"
        : stage !== recordStage)) {
        return { status: "wrong_stage", ...createReport() };
      }
    }

    const report = createReport();
    const groupElements = group.container
      ? Array.from(group.container.querySelectorAll(CONTROL_SELECTOR))
        .filter((element) => isVisible(element) && !element.disabled && !isProtectedField(element))
      : group.fields.map(({ element }) => element);
    const compoundHandled = await fillCompoundDateFields(
      section, record, groupElements, overwriteExisting, report,
    );
    const known = await fillKnownStructuredFields(
      section, record, groupElements, overwriteExisting, report, compoundHandled,
    );
    const matched = known.sourceKeys.size;
    if (report.filled) lastUserTarget = null;
    return { status: report.filled ? "filled" : matched ? "no_empty" : "no_match", ...report };
  }

  async function fillBasicFields(profile, customFields, overwriteExisting, state, report) {
    const controls = collectControls();
    await fillCompoundBasicLocations(profile, controls, overwriteExisting, state, report);
    for (const field of controls) {
      if (state.filledElements.has(field) || confirmedStructuredSection(field)) continue;
      const customValue = customFieldValue(field, customFields);
      const key = classifyBasicField(field);
      if (!isUsable(field, overwriteExisting, key || "")) continue;
      const value = customValue || (key ? profileValue(profile, key) : "");
      if (!value) continue;
      try {
        const didFill = await setControlValue(field, value, customValue ? "" : key || "");
        if (!didFill) {
          report.failed += 1;
          continue;
        }
        field.dataset.personalAutofill = "filled";
        state.filledElements.add(field);
        report.filled += 1;
        report.sections.basic += 1;
      } catch (_) {
        report.failed += 1;
      }
    }
  }

  async function fillPage(payload, state, report) {
    await fillBasicFields(
      payload.profile || {},
      payload.customFields || [],
      Boolean(payload.overwriteExisting),
      state,
      report,
    );
  }

  async function fillPageWithRetries(payload) {
    const state = { filledElements: new WeakSet() };
    const report = createReport();
    await fillPage(payload, state, report);
    for (const delay of [320]) {
      await wait(delay);
      await fillPage(payload, state, report);
    }
    return report;
  }

  async function fillBasicWithAi(payload) {
    // Known fields and complex widgets (date pickers/cascaders/custom selects) are more
    // reliable through the local adapters. AI then sees the remaining unfamiliar controls
    // instead of replacing those adapters entirely.
    const local = await fillPageWithRetries(payload);
    const ai = await fillWithAi("basic", payload, Boolean(payload.overwriteExisting));
    const merged = createReport();
    for (const key of ["filled", "skipped", "unchanged", "failed"]) {
      merged[key] = Number(local[key] || 0) + Number(ai[key] || 0);
    }
    for (const key of Object.keys(merged.sections)) {
      merged.sections[key] = Number(local.sections?.[key] || 0) + Number(ai.sections?.[key] || 0);
    }
    return {
      ...ai,
      ...merged,
      status: merged.filled ? "filled" : ai.status,
      pendingReview: Number(ai.pendingReview || 0),
    };
  }

  function sanitizeAiText(value, limit = 180) {
    return String(value || "")
      .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[邮箱]")
      .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, "[手机号]")
      .replace(/(?<!\d)\d{17}[\dXx](?!\d)/g, "[证件号]")
      .replace(/https?:\/\/\S+/gi, "[网址]")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, limit);
  }

  function aiSources(section, payload) {
    const labels = AI_SOURCE_LABELS[section] || {};
    const sources = Object.entries(labels).map(([key, label]) => ({ key, label, keywords: "" }));
    if (section === "basic") {
      for (const item of (payload.customFields || []).slice(0, 40)) {
        if (!item?.id || !item?.label || !item?.value) continue;
        sources.push({
          key: `custom:${String(item.id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 70)}`,
          label: sanitizeAiText(item.label, 120),
          keywords: sanitizeAiText(item.keywords, 300),
        });
      }
    }
    return sources.slice(0, 80);
  }

  function aiTargetScope(target) {
    if (!(target instanceof Element) || !target.isConnected) return null;
    let best = null;
    for (let ancestor = target.parentElement, depth = 0;
      ancestor && ancestor !== document.body && depth < 9;
      ancestor = ancestor.parentElement, depth += 1) {
      const controls = Array.from(ancestor.querySelectorAll(CONTROL_SELECTOR))
        .filter((element) => isVisible(element) && !isProtectedField(element));
      if (controls.length < 3 || controls.length > 40) continue;
      const labels = controls.map((element) => compactText(textOfLabel(element) || element.getAttribute("aria-label") || ""))
        .filter(Boolean);
      if (new Set(labels).size < labels.length - 1) continue;
      best = ancestor;
      const siblings = Array.from(ancestor.parentElement?.children || [])
        .filter((sibling) => sibling !== ancestor && sibling.tagName === ancestor.tagName &&
          sibling.querySelectorAll?.(CONTROL_SELECTOR).length >= 3);
      if (siblings.length) return ancestor;
    }
    return best;
  }

  function aiGroupTitle(container) {
    const heading = Array.from(container.querySelectorAll(
      "h1, h2, h3, h4, h5, legend, [role='heading'], [class*='section-title'], [class*='sectionTitle']",
    )).find((element) => {
      const nestedRecord = element.closest(RECORD_CONTAINER_SELECTOR);
      return isVisible(element) && !element.querySelector(CONTROL_SELECTOR) &&
        (!nestedRecord || nestedRecord === container || !container.contains(nestedRecord));
    });
    if (heading) return sanitizeAiText(heading.innerText || heading.textContent, 180);
    const firstChildTitle = Array.from(container.children || []).slice(0, 4)
      .find((element) => !element.querySelector(CONTROL_SELECTOR) &&
        /title|header|heading/i.test(String(element.className || "")) && isVisible(element));
    if (firstChildTitle) return sanitizeAiText(firstChildTitle.innerText || firstChildTitle.textContent, 180);
    const ownText = directText(container);
    return ownText.length <= 80 ? sanitizeAiText(ownText, 180) : "";
  }

  function aiCandidateGroups() {
    const controls = collectControls().filter((element) => isVisible(element) && !element.disabled);
    const bySignature = new Map();
    const considered = new Set();
    for (const control of controls.slice(0, 120)) {
      for (let node = control.parentElement, depth = 0;
        node && node !== document.body && depth < 14;
        node = node.parentElement, depth += 1) {
        if (considered.has(node)) continue;
        considered.add(node);
        const elements = controls.filter((element) => node.contains(element));
        if (elements.length < 2 || elements.length > 40 || !elements.some(isInViewport)) continue;
        const title = aiGroupTitle(node);
        const semantic = node.matches("form, fieldset, section, article, [role='group'], [role='dialog'], [data-autofill-record]");
        const classHint = /form|section|record|card|panel|editor|detail/i.test(String(node.className || ""));
        if (!title && !semantic && !classHint) continue;
        const signature = elements.map((element) => controls.indexOf(element)).join(",");
        const score = (title ? 12 : 0) + (semantic ? 5 : 0) + (classHint ? 2 : 0);
        const previous = bySignature.get(signature);
        if (!previous || score > previous.score || (score === previous.score && node.contains(previous.container))) {
          bySignature.set(signature, { container: node, elements, title, score });
        }
      }
    }
    const allGroups = Array.from(bySignature.values());
    const groups = allGroups.filter((group) => {
      const titledChildren = allGroups.filter((other) => other !== group && other.title &&
        group.container.contains(other.container));
      if (titledChildren.some((first) => titledChildren.some((second) => first !== second &&
        !first.elements.some((element) => second.elements.includes(element))))) return false;
      return group.title || !allGroups.some((other) => other !== group && other.title &&
        other.elements.length >= group.elements.length &&
        group.elements.every((element) => other.container.contains(element)));
    });
    groups.sort((a, b) => b.score - a.score || b.elements.length - a.elements.length);
    return groups.slice(0, 20).map((group, index) => ({ ...group, id: `g${index}` }));
  }

  async function aiLocateManualSection(section, payload, overwriteExisting, forceReview = false) {
    const groups = aiCandidateGroups();
    if (!groups.length) return { status: "no_target", ...createReport() };
    const describedGroups = groups.map((group) => ({
      group,
      description: {
        id: group.id,
        title: group.title,
        fields: aiDescribeElements(section, group.elements).slice(0, 40)
          .map(({ label, type }) => ({ label, type })),
      },
    })).filter(({ description }) => description.fields.length >= 2);
    if (!describedGroups.length) return { status: "no_target", ...createReport() };
    const viableGroups = describedGroups.map(({ group }) => group);
    const focused = viableGroups.filter((group) => lastUserTarget?.isConnected && group.container.contains(lastUserTarget));
    focused.sort((a, b) => b.score - a.score || b.elements.length - a.elements.length);
    const focusedGroupId = focused[0]?.id || "";
    const request = {
      section,
      groups: describedGroups.map(({ description }) => description),
      focusedGroupId,
    };
    const localMock = ["localhost", "127.0.0.1"].includes(location.hostname) &&
      document.documentElement.hasAttribute("data-autofill-demo") && window.__personalAutofillDemoAiLocator;
    let answer;
    try {
      answer = localMock ? await window.__personalAutofillDemoAiLocator(request)
        : await chrome.runtime.sendMessage({ type: "AI_LOCATE_SECTION", request });
    } catch (_) {
      answer = { ok: false, error: "network" };
    }
    if (!answer?.ok) return { status: "ai_unavailable", error: answer?.error || "network", ...createReport() };
    const selected = viableGroups.find((group) => group.id === answer.groupId);
    const plausible = viableGroups.filter((group) => {
      if (STRUCTURED_SECTIONS[section].sectionPattern.test(group.title)) return true;
      const hints = group.elements.map(fieldHints).join(" ");
      const keys = new Set(group.elements.map((element) => classifyStructuredField(element, section)).filter(Boolean));
      return keys.size >= 2 && STRUCTURED_INFERENCE_PATTERNS[section].test(hints);
    });
    const focusConflict = focusedGroupId && selected && selected.id !== focusedGroupId;
    const multiplePlausible = !focusedGroupId && plausible.length > 1;
    const plausibleAlternative = plausible.length && !plausible.includes(selected);
    const unlabelledChoices = !focusedGroupId && !plausible.length && viableGroups.length > 1;
    if (selected && answer.confidence >= 0.9 && !forceReview && !focusConflict &&
      !multiplePlausible && !plausibleAlternative && !unlabelledChoices) {
      return { status: "ready", special: "", elements: selected.elements };
    }
    aiShowGroupReview(section, payload, overwriteExisting, plausible.length ? plausible : viableGroups,
      selected?.id || "");
    return { status: "pending_target_review", pendingTargetReview: true, ...createReport() };
  }

  function aiManualTargetElements(section) {
    if (section === "family") {
      const mobileEditor = chinaMobileFamilyEditor();
      if (mobileEditor) {
        const selectors = ["#folkName", "#folkRelationship", "#family_birthday", "#family_sex",
          "#family_isEmployed", "#folkCompany", "#folkJob", "#family_contactMobile",
          "#family_political", "#livePlace"];
        return { status: "ready", special: "mobile_family", elements: selectors
          .map((selector) => mobileEditor.querySelector(selector)).filter((element) => element && isVisible(element)) };
      }
      if (is51jobFamilyPage()) {
        const groups = fiftyOneJobFamilyGroups();
        const focused = groups.filter((group) => fiftyOneJobFamilyTargetMatches(lastUserTarget, group));
        const group = focused.length === 1 ? focused[0] : groups.length === 1 ? groups[0] : null;
        return group ? { status: "ready", special: "51job_family", elements: group.fields.flatMap(({ controls }) => controls) }
          : { status: groups.length ? "ambiguous" : "no_target" };
      }
    }
    if (section === "project" && is51jobProjectPage()) {
      const groups = currentViewGroups("project", fiftyOneJobProjectGroups());
      const focused = groups.filter((group) => targetMatchesGroup(lastUserTarget, group));
      const group = focused.length === 1 ? focused[0] : groups.length === 1 ? groups[0] : null;
      return group ? { status: "ready", special: "51job_project", elements: group.fields.map(({ element }) => element) }
        : { status: groups.length ? "ambiguous" : "no_target" };
    }

    const candidates = manualCandidateGroups(section);
    const focused = candidates.filter((group) => targetMatchesGroup(lastUserTarget, group));
    const group = focused.length === 1 ? focused[0] : candidates.length === 1 ? candidates[0] : null;
    if (group) {
      const container = group.container;
      const elements = container ? Array.from(container.querySelectorAll(CONTROL_SELECTOR))
        .filter((element) => isVisible(element) && !isProtectedField(element)) : group.fields.map(({ element }) => element);
      return { status: "ready", special: "", elements: elements.length <= 40 ? elements : group.fields.map(({ element }) => element) };
    }
    if (candidates.length > 1) return { status: "ambiguous" };

    // Some recruitment SPAs render the active editor as anonymous nested divs: the fields have
    // clear labels/placeholders, but no nearby form/section heading that detectStructuredSection
    // can associate with them. Group those semantic fields directly, preserving duplicate-key
    // boundaries so multiple visible record editors still require an explicit user target.
    const semanticDescriptors = collectControls()
      .filter((element) => isVisible(element) && !element.disabled && !isProtectedField(element) &&
        !isPresenceGateControl(element))
      .map((element) => ({
        element,
        key: classifyStructuredField(element, section),
        container: boundedStructuredContainer(element, section),
      }))
      .filter(({ key, container }) => Boolean(key && container));
    const semanticGroups = groupDescriptors(semanticDescriptors).filter((candidate) => {
      const keys = new Set(candidate.fields.map(({ key }) => key));
      return keys.size >= 2;
    });
    const viewportSemanticGroups = semanticGroups.filter(groupHasViewportField);
    const selectableSemanticGroups = CURRENT_VIEW_ONLY_SECTIONS.has(section)
      ? viewportSemanticGroups
      : viewportSemanticGroups.length ? viewportSemanticGroups : semanticGroups;
    const focusedSemantic = selectableSemanticGroups.filter((candidate) => targetMatchesGroup(lastUserTarget, candidate));
    const semanticGroup = focusedSemantic.length === 1 ? focusedSemantic[0]
      : selectableSemanticGroups.length === 1 ? selectableSemanticGroups[0] : null;
    if (semanticGroup) {
      const container = semanticGroup.container;
      const elements = container ? Array.from(container.querySelectorAll(CONTROL_SELECTOR))
        .filter((element) => isVisible(element) && !isProtectedField(element) && !isPresenceGateControl(element))
        : semanticGroup.fields.map(({ element }) => element);
      return { status: "ready", special: "", elements: elements.length <= 40
        ? elements : semanticGroup.fields.map(({ element }) => element) };
    }
    if (selectableSemanticGroups.length > 1) return { status: "ambiguous" };

    // A labelled section can be recognizable even when none of its individual fields match our legacy rules.
    const sectionControls = collectControls().filter((element) => isVisible(element) && !isProtectedField(element) &&
      detectStructuredSection(element) === section);
    const sectionGroups = new Map();
    for (const element of sectionControls) {
      const container = nearestRecordContainer(element) || element.closest("form, [data-autofill-section]") || document.body;
      if (!sectionGroups.has(container)) sectionGroups.set(container, []);
      sectionGroups.get(container).push(element);
    }
    const eligibleGroups = Array.from(sectionGroups.values()).filter((elements) =>
      elements.length >= 2 && elements.some(isInViewport));
    const focusedGroups = eligibleGroups.filter((elements) =>
      lastUserTarget?.isConnected && elements.some((element) =>
        element === lastUserTarget || element.contains(lastUserTarget) || lastUserTarget.contains(element)));
    const selectedGroup = focusedGroups.length === 1 ? focusedGroups[0]
      : eligibleGroups.length === 1 ? eligibleGroups[0] : null;
    if (selectedGroup && selectedGroup.length <= 40) {
      const labels = selectedGroup.map((element) => compactText(textOfLabel(element) ||
        element.getAttribute?.("aria-label") || element.getAttribute?.("placeholder") || element.id || element.name))
        .filter(Boolean);
      if (new Set(labels).size === labels.length) return { status: "ready", special: "", elements: selectedGroup };
    }
    if (eligibleGroups.length > 1 && !selectedGroup) return { status: "ambiguous" };
    const scope = CURRENT_VIEW_ONLY_SECTIONS.has(section) &&
      (!lastUserTarget?.isConnected || !isInViewport(lastUserTarget))
      ? null : aiTargetScope(lastUserTarget);
    if (!scope) return { status: "no_target" };
    const scopedElements = Array.from(scope.querySelectorAll(CONTROL_SELECTOR))
      .filter((element) => isVisible(element) && !isProtectedField(element) && detectStructuredSection(element) === section);
    return scopedElements.length >= 2
      ? { status: "ready", special: "", elements: scopedElements }
      : { status: "no_target" };
  }

  function aiBasicTargetElements() {
    return collectControls().filter((element) => isVisible(element) && !confirmedStructuredSection(element) &&
      !isProtectedField(element) && !element.disabled);
  }

  function aiDescribeElements(section, elements) {
    const seen = new Set();
    const counts = new Map();
    const described = [];
    for (const element of elements) {
      if (!element?.isConnected || seen.has(element) || !isVisible(element) || isProtectedField(element)) continue;
      if (section !== "basic" && isPresenceGateControl(element)) continue;
      seen.add(element);
      const label = sanitizeAiText(textOfLabel(element) || element.getAttribute?.("aria-label") ||
        element.getAttribute?.("placeholder") || element.id || element.name);
      if (!label) continue;
      const baseType = element instanceof HTMLSelectElement ? "select" : element instanceof HTMLTextAreaElement
        ? "textarea" : element.getAttribute?.("type") || element.getAttribute?.("role") || "text";
      const capability = controlCapability(element);
      const type = capability.datePart ? `${baseType}:date-${capability.datePart}`
        : capability.locationLevel !== null
          ? `${baseType}:location-${["province", "city", "district"][capability.locationLevel]}`
          : capability.adjacentDateTrigger ? `${baseType}:date-trigger` : baseType;
      const options = element instanceof HTMLSelectElement
        ? Array.from(element.options).slice(0, 40).map((option) => sanitizeAiText(option.textContent, 100))
        : Array.from(element.querySelectorAll?.(":scope > ul > li") || []).slice(0, 40)
          .map((option) => sanitizeAiText(option.textContent, 100));
      const base = `${section}|${compactText(label)}|${type}`;
      const occurrence = counts.get(base) || 0;
      counts.set(base, occurrence + 1);
      described.push({
        element,
        fingerprint: `${base}|${occurrence}`,
        id: `f${described.length}`,
        label,
        type: sanitizeAiText(type, 40),
        options,
      });
      if (described.length >= 80) break;
    }
    return described;
  }

  function aiSiteCacheKey() {
    return `${location.hostname}${location.pathname}`.slice(0, 300);
  }

  async function aiRequestMappings(section, described, sources) {
    const siteKey = aiSiteCacheKey();
    const stored = globalThis.chrome?.storage?.local
      ? await chrome.storage.local.get("aiMappings") : {};
    const aiMappings = stored.aiMappings || {};
    const rememberedForSite = aiMappings[siteKey]?.[section] || {};
    const remembered = described
      .filter(({ fingerprint }) => sources.some(({ key }) => key === rememberedForSite[fingerprint]))
      .map(({ id, fingerprint }) => ({ fieldId: id, sourceKey: rememberedForSite[fingerprint] }));
    const request = {
      section,
      fields: described.map(({ id, label, type, options }) => ({ id, label, type, options })),
      sources,
      remembered,
    };
    const localMock = ["localhost", "127.0.0.1"].includes(location.hostname) &&
      document.documentElement.hasAttribute("data-autofill-demo") &&
      window.__personalAutofillDemoAiMapper;
    const result = localMock ? await window.__personalAutofillDemoAiMapper(request)
      : await chrome.runtime.sendMessage({ type: "AI_MAP_FIELDS", request });
    if (!result?.ok) return { ok: false, error: result?.error || "unknown" };
    const fieldIds = new Set(described.map(({ id }) => id));
    const sourceKeys = new Set(sources.map(({ key }) => key));
    const used = new Set();
    const mappings = [];
    for (const item of result.mappings || []) {
      if (!fieldIds.has(item?.fieldId) || !sourceKeys.has(item?.sourceKey) || used.has(item.fieldId) ||
        typeof item.confidence !== "number" || item.confidence < 0 || item.confidence > 1) {
        return { ok: false, error: "invalid_mapping" };
      }
      used.add(item.fieldId);
      mappings.push({ fieldId: item.fieldId, sourceKey: item.sourceKey, confidence: item.confidence });
    }
    return { ok: true, mappings, rememberedForSite, siteKey };
  }

  function aiSourceValue(section, payload, sourceKey) {
    if (section === "basic") {
      if (sourceKey.startsWith("custom:")) {
        const id = sourceKey.slice(7);
        const item = (payload.customFields || []).find((field) => String(field.id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 70) === id);
        return item?.value || "";
      }
      return profileValue(payload.profile || {}, sourceKey);
    }
    return valueForStructuredField(section, payload.record, sourceKey);
  }

  function aiExpectedSource(section, element) {
    if (section === "basic") return classifyBasicField(element);
    if (section === "project" && is51jobProjectPage()) return fiftyOneJobProjectFieldKey(textOfLabel(element));
    if (section === "family" && is51jobFamilyPage()) return fiftyOneJobFamilyFieldKey(textOfLabel(element));
    return classifyStructuredField(element, section);
  }

  function aiHasExistingValue(element) {
    if (element instanceof HTMLSelectElement) {
      const text = element.selectedOptions[0]?.textContent?.trim() || "";
      return Boolean(readControlValue(element) && !/^(?:--)?请选择(?:--)?$/.test(text));
    }
    return Boolean(readControlValue(element));
  }

  function aiValuesEquivalent(element, sourceValue, sourceKey) {
    if (!aiHasExistingValue(element)) return false;
    if (element instanceof HTMLInputElement && element.type === "checkbox" &&
      typeof sourceValue === "boolean") return element.checked === sourceValue;
    const actual = readControlValue(element);
    const observed = [actual];
    if (element instanceof HTMLSelectElement) observed.push(element.selectedOptions[0]?.textContent?.trim() || "");
    if (element instanceof HTMLInputElement && ["checkbox", "radio"].includes(element.type)) {
      observed.push(textOfLabel(element));
    }
    const wanted = String(sourceValue);
    const candidates = [wanted, formatDateValue(element, wanted, sourceKey), ...aliasesFor(wanted)];
    if (LOCATION_PROFILE_KEYS.has(sourceKey)) {
      const parts = splitLocationValue(wanted);
      const wrapper = cascaderWrapper(element);
      if (wrapper) return locationDisplayMatches(element, wrapper, parts);
      const level = locationLevelForField(element);
      const expected = level === null ? parts : [parts[level]].filter(Boolean);
      const normalizedObserved = normalizeMatchText(observed.join(" "));
      const matchesPart = (part) => {
        const full = normalizeMatchText(part);
        const short = shortLocationPart(part);
        return normalizedObserved.includes(full) || (short.length >= 2 && normalizedObserved.includes(short));
      };
      if (level === null ? expected.every(matchesPart) : expected.some(matchesPart)) return true;
    }
    if (["height", "weight", "workYears"].includes(sourceKey)) {
      const numeric = wanted.match(/-?\d+(?:\.\d+)?/)?.[0];
      if (numeric) candidates.push(numeric);
    }
    if (observed.some((existing) => existing && candidates.some((candidate) =>
      compactText(existing) === compactText(candidate)))) return true;
    if (["birthDate", "startDate", "endDate"].includes(sourceKey)) {
      const actualParts = actual.match(/\d+/g) || [];
      const wantedParts = wanted.match(/\d+/g) || [];
      if (actualParts.length >= 2 && wantedParts.length >= 2 && actualParts.length <= 3) {
        return actualParts.every((part, index) => Number(part) === Number(wantedParts[index]));
      }
    }
    return false;
  }

  async function aiFillOne(section, payload, mapping, described, overwriteExisting) {
    const target = described.find(({ id }) => id === mapping.fieldId);
    if (!target?.element?.isConnected || !isVisible(target.element) || isProtectedField(target.element)) return false;
    const value = aiSourceValue(section, payload, mapping.sourceKey);
    if (value === "" || value === undefined || value === null || value === false) return false;
    if (!overwriteExisting && aiHasExistingValue(target.element)) return false;

    const element = target.element;
    if (element instanceof HTMLInputElement && element.readOnly && !isCustomControl(element) &&
      !isInteractiveDateControl(element) && !LOCATION_PROFILE_KEYS.has(mapping.sourceKey) &&
      !["birthDate", "startDate", "endDate"].includes(mapping.sourceKey)) return false;
    if (element instanceof HTMLInputElement && ["checkbox", "radio"].includes(element.type) &&
      typeof value !== "boolean" && ![element.value, textOfLabel(element)]
        .some((candidate) => aliasesFor(value).some((alias) =>
          compactText(candidate) === compactText(alias)))) return false;
    if (element instanceof HTMLSelectElement) {
      const accepted = new Set(aliasesFor(value).map(compactText));
      const exact = Array.from(element.options).filter((option) =>
        accepted.has(compactText(option.textContent)) || accepted.has(compactText(option.value)));
      if (exact.length !== 1) return false;
      setNativeValue(element, exact[0].value);
      await wait(30);
      if (!aiValuesEquivalent(element, value, mapping.sourceKey)) return false;
    } else {
      const didFill = await setControlValue(element, value, mapping.sourceKey);
      if (!didFill) return false;
      await wait(30);
      if (!aiValuesEquivalent(element, value, mapping.sourceKey)) return false;
    }
    element.dataset.personalAutofill = "filled";
    return true;
  }

  async function aiSaveCorrections(siteKey, section, corrections) {
    if (!corrections.length || !globalThis.chrome?.storage?.local) return;
    const { aiMappings = {} } = await chrome.storage.local.get("aiMappings");
    const site = aiMappings[siteKey] || {};
    const sectionMap = site[section] || {};
    for (const { fingerprint, sourceKey } of corrections) sectionMap[fingerprint] = sourceKey;
    site[section] = Object.fromEntries(Object.entries(sectionMap).slice(-120));
    aiMappings[siteKey] = site;
    const entries = Object.entries(aiMappings).slice(-100);
    await chrome.storage.local.set({ aiMappings: Object.fromEntries(entries) });
  }

  function aiShowReview(section, payload, pending, described, sources, siteKey) {
    aiReviewCleanup?.();
    const host = document.createElement("div");
    host.setAttribute("data-personal-autofill-review", "");
    host.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;width:min(390px,calc(100vw - 32px));";
    const shadow = host.attachShadow({ mode: document.documentElement.hasAttribute("data-autofill-demo") ? "open" : "closed" });
    const style = document.createElement("style");
    style.textContent = `
      *{box-sizing:border-box} .card{font:13px/1.45 system-ui,-apple-system,"Microsoft YaHei",sans-serif;color:#1f2937;background:white;border:1px solid #cbd5e1;border-radius:12px;box-shadow:0 16px 44px #0004;max-height:70vh;overflow:auto;padding:16px}
      h2{font-size:16px;margin:0 0 6px} p{font-size:12px;color:#64748b;margin:0 0 12px} .row{border-top:1px solid #e5e7eb;padding:10px 0} .row strong{display:block;margin-bottom:6px} select{width:100%;padding:7px;border:1px solid #cbd5e1;border-radius:6px;background:white;color:#1f2937} label{display:block;margin-top:6px;color:#a34b16;font-size:12px} .actions{position:sticky;bottom:0;display:flex;gap:8px;justify-content:flex-end;margin:12px -16px -16px;padding:12px 16px 16px;background:white;border-top:1px solid #e5e7eb} button{padding:8px 12px;border:1px solid #cbd5e1;border-radius:7px;background:white;color:#1f2937;cursor:pointer} button.primary{background:#3457d5;border-color:#3457d5;color:white} .status{color:#3457d5;margin:10px 0 0}
    `;
    const card = document.createElement("section");
    card.className = "card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", "AI 字段确认");
    const heading = document.createElement("h2");
    heading.textContent = "确认不确定的字段";
    const description = document.createElement("p");
    description.textContent = "请核对网页字段与资料项的对应关系。已有内容默认不覆盖。";
    card.append(heading, description);
    const rows = [];
    const originals = [];
    for (const mapping of pending) {
      const target = described.find(({ id }) => id === mapping.fieldId);
      if (!target?.element?.isConnected) continue;
      const element = target.element;
      originals.push({ element, outline: element.style.outline, outlineOffset: element.style.outlineOffset });
      element.style.outline = "2px solid #f59e0b";
      element.style.outlineOffset = "2px";
      const row = document.createElement("div");
      row.className = "row";
      const label = document.createElement("strong");
      label.textContent = `网页字段：${target.label}`;
      const select = document.createElement("select");
      const skip = document.createElement("option");
      skip.value = "";
      skip.textContent = "不填写此字段";
      select.append(skip);
      for (const source of sources) {
        const option = document.createElement("option");
        option.value = source.key;
        option.textContent = source.label;
        select.append(option);
      }
      select.value = mapping.sourceKey;
      row.append(label, select);
      let replace = null;
      if (aiHasExistingValue(element)) {
        const replaceLabel = document.createElement("label");
        replace = document.createElement("input");
        replace.type = "checkbox";
        replaceLabel.append(replace, document.createTextNode(" 允许覆盖网页已有内容"));
        row.append(replaceLabel);
      }
      card.append(row);
      rows.push({ target, select, replace });
    }
    const actions = document.createElement("div");
    actions.className = "actions";
    const skipButton = document.createElement("button");
    skipButton.type = "button";
    skipButton.textContent = "跳过";
    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "primary";
    confirmButton.textContent = "确认并填写";
    actions.append(skipButton, confirmButton);
    card.append(actions);
    shadow.append(style, card);
    document.documentElement.append(host);
    const cleanup = () => {
      for (const { element, outline, outlineOffset } of originals) {
        if (!element.isConnected) continue;
        element.style.outline = outline;
        element.style.outlineOffset = outlineOffset;
      }
      host.remove();
      if (aiReviewCleanup === cleanup) aiReviewCleanup = null;
    };
    aiReviewCleanup = cleanup;
    skipButton.addEventListener("click", cleanup);
    confirmButton.addEventListener("click", async () => {
      confirmButton.disabled = true;
      let filled = 0;
      let failed = 0;
      const corrections = [];
      for (const { target, select, replace } of rows) {
        if (!select.value || (replace && !replace.checked)) continue;
        const mapped = { fieldId: target.id, sourceKey: select.value };
        try {
          if (await aiFillOne(section, payload, mapped, described, Boolean(replace?.checked))) {
            filled += 1;
            corrections.push({ fingerprint: target.fingerprint, sourceKey: select.value });
          } else failed += 1;
        } catch (_) {
          failed += 1;
        }
      }
      await aiSaveCorrections(siteKey, section, corrections).catch(() => {});
      cleanup();
      const result = document.createElement("div");
      result.setAttribute("role", "status");
      result.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;background:#1f2937;color:white;padding:10px 14px;border-radius:8px;font:13px system-ui";
      result.textContent = `已确认填写 ${filled} 项${failed ? `，${failed} 项未能填入` : ""}；请核对后手动保存`;
      document.documentElement.append(result);
      window.setTimeout(() => result.remove(), 5000);
    });
  }

  function aiShowGroupReview(section, payload, overwriteExisting, groups, recommendedId) {
    aiReviewCleanup?.();
    const host = document.createElement("div");
    host.setAttribute("data-personal-autofill-section-review", "");
    host.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;width:min(390px,calc(100vw - 32px));";
    const shadow = host.attachShadow({ mode: document.documentElement.hasAttribute("data-autofill-demo") ? "open" : "closed" });
    const style = document.createElement("style");
    style.textContent = `
      *{box-sizing:border-box}.card{font:13px/1.45 system-ui,-apple-system,"Microsoft YaHei",sans-serif;color:#1f2937;background:white;border:1px solid #cbd5e1;border-radius:12px;box-shadow:0 16px 44px #0004;max-height:70vh;overflow:auto;padding:16px}h2{font-size:16px;margin:0 0 6px}p{font-size:12px;color:#64748b;margin:0 0 12px}.choice{display:block;width:100%;text-align:left;margin:6px 0;padding:9px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#1f2937;cursor:pointer}.choice:hover,.choice:focus{border-color:#3457d5;background:#eef3ff}.choice small{display:block;color:#64748b;margin-top:3px}.actions{position:sticky;bottom:0;background:white;text-align:right;padding-top:10px}.skip{padding:8px 12px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;cursor:pointer}
    `;
    const card = document.createElement("section");
    card.className = "card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", "确认目标表单区域");
    const heading = document.createElement("h2");
    heading.textContent = "请选择要填写的表单";
    const description = document.createElement("p");
    description.textContent = "AI 无法安全确定唯一目标。点击对应区域后才会匹配字段并填写；不会保存或提交。";
    card.append(heading, description);
    const originals = groups.map(({ container }) => ({
      container, outline: container.style.outline, outlineOffset: container.style.outlineOffset,
    }));
    let active = null;
    const highlight = (group) => {
      if (active?.container?.isConnected) {
        const original = originals.find(({ container }) => container === active.container);
        active.container.style.outline = original?.outline || "";
        active.container.style.outlineOffset = original?.outlineOffset || "";
      }
      active = group;
      if (group?.container?.isConnected) {
        group.container.style.outline = "2px solid #3457d5";
        group.container.style.outlineOffset = "2px";
      }
    };
    const cleanup = () => {
      for (const { container, outline, outlineOffset } of originals) {
        if (!container.isConnected) continue;
        container.style.outline = outline;
        container.style.outlineOffset = outlineOffset;
      }
      host.remove();
      if (aiReviewCleanup === cleanup) aiReviewCleanup = null;
    };
    aiReviewCleanup = cleanup;
    for (const [index, group] of groups.entries()) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      const samples = aiDescribeElements(section, group.elements).slice(0, 3).map(({ label }) => label).join("、");
      button.textContent = `区域 ${index + 1}：${group.title || samples || "未命名表单"}${group.id === recommendedId ? "（AI 建议）" : ""}`;
      const sub = document.createElement("small");
      sub.textContent = `字段示例：${samples || "无"}`;
      button.append(sub);
      button.addEventListener("mouseenter", () => highlight(group));
      button.addEventListener("focus", () => highlight(group));
      button.addEventListener("click", async () => {
        if (!group.container.isConnected || !group.elements.some(isVisible)) return;
        cleanup();
        const status = document.createElement("div");
        status.setAttribute("role", "status");
        status.style.cssText = "position:fixed;right:16px;top:16px;z-index:2147483647;background:#1f2937;color:#fff;padding:10px 14px;border-radius:8px;font:13px system-ui";
        status.textContent = "AI 正在匹配所选表单字段…";
        document.documentElement.append(status);
        try {
          const result = await fillWithAi(section, payload, overwriteExisting,
            { status: "ready", special: "", elements: group.elements });
          status.textContent = result.pendingReview
            ? `已填 ${result.filled || 0} 项，${result.pendingReview} 项请在网页确认${result.failed ? `，${result.failed} 项需手动处理` : ""}`
            : result.status === "filled" ? `已填 ${result.filled} 项${result.failed ? `，${result.failed} 项需手动处理` : ""}；请核对后手动保存`
              : result.status === "wrong_stage" ? "学历阶段不符，未填写"
                : result.status === "record_conflict" ? "该区域已有另一条记录，未覆盖"
                : result.status === "ai_unavailable" ? "AI 不可用，未填写"
                  : "所选区域没有可安全填写的字段";
        } catch (_) {
          status.textContent = "字段匹配失败，未继续填写";
        }
        window.setTimeout(() => status.remove(), 5000);
      });
      card.append(button);
    }
    const actions = document.createElement("div");
    actions.className = "actions";
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "skip";
    skip.textContent = "取消";
    skip.addEventListener("click", cleanup);
    actions.append(skip);
    card.append(actions);
    shadow.append(style, card);
    document.documentElement.append(host);
  }

  function aiEducationStageMismatch(record) {
    const candidates = manualCandidateGroups("education");
    const focused = candidates.filter((group) => targetMatchesGroup(lastUserTarget, group));
    const group = focused.length === 1 ? focused[0] : candidates.length === 1 ? candidates[0] : null;
    if (!group) return false;
    const stage = explicitEducationStage(group);
    const recordStage = recordEducationStage(record);
    return Boolean(stage && recordStage && (stage === "higherEducation"
      ? recordStage === "高中" : stage !== recordStage));
  }

  async function fillWithAi(section, payload, overwriteExisting, selectedOverride = null) {
    const report = createReport();
    if (!selectedOverride) aiReviewCleanup?.();
    if (!selectedOverride && section !== "basic") {
      await prepareStructuredSection(section, payload.record);
    }
    if (!selectedOverride && section === "education" && aiEducationStageMismatch(payload.record)) {
      return { status: "wrong_stage", ...report };
    }
    let selected = selectedOverride || (section === "basic"
      ? { status: "ready", special: "", elements: aiBasicTargetElements() }
      : aiManualTargetElements(section));
    if (!selectedOverride && section !== "basic" && selected.status !== "ready") {
      selected = await aiLocateManualSection(section, payload, overwriteExisting, selected.status === "ambiguous");
    }
    if (selected.status !== "ready") {
      return { status: selected.status, error: selected.error,
        pendingTargetReview: Boolean(selected.pendingTargetReview), ...report };
    }
    if (section === "education" && selected.elements.length) {
      const selectedGroup = {
        container: selected.elements[0].closest?.(RECORD_CONTAINER_SELECTOR) ||
          selected.elements[0].closest?.("[data-autofill-section], form"),
        fields: selected.elements.map((element) => ({ element })),
      };
      const stage = explicitEducationStage(selectedGroup);
      const recordStage = recordEducationStage(payload.record);
      if (stage && recordStage && (stage === "higherEducation"
        ? recordStage === "高中" : stage !== recordStage)) {
        return { status: "wrong_stage", ...report };
      }
    }
    // Site adapters and deterministic semantics run before the cloud request. AI is a
    // fallback for unknown labels/regions, not a prerequisite for controls we already know.
    if (selected.special) {
      const legacy = await fillSelectedRecord(STRUCTURED_SECTIONS[section].recordsKey, payload.record, overwriteExisting);
      return { ...legacy, aiChecked: false };
    }
    const identityKey = { education: "school", work: "company", project: "name", family: "relativeName" }[section];
    if (identityKey && payload.record?.[identityKey]) {
      const knownIdentity = selected.elements.find((element) => aiExpectedSource(section, element) === identityKey);
      const existing = knownIdentity && readControlValue(knownIdentity);
      if (existing && normalizeMatchText(existing) !== normalizeMatchText(payload.record[identityKey])) {
        return { status: "record_conflict", ...report };
      }
    }
    const compoundHandled = section === "basic" ? new Set() : await fillCompoundDateFields(
      section, payload.record, selected.elements, overwriteExisting, report,
    );
    const known = section === "basic"
      ? { handled: compoundHandled, sourceKeys: new Set() }
      : await fillKnownStructuredFields(
        section, payload.record, selected.elements, overwriteExisting, report, compoundHandled,
      );
    const remainingElements = selected.elements.filter((element) => !known.handled.has(element));
    const described = aiDescribeElements(section, remainingElements);
    const sources = aiSources(section, payload).filter(({ key }) => {
      const value = aiSourceValue(section, payload, key);
      return !known.sourceKeys.has(key) && value !== "" && value !== undefined && value !== null && value !== false;
    });
    if (!described.length || !sources.length) {
      const status = report.filled ? "filled"
        : report.unchanged || report.skipped ? "no_empty" : report.failed ? "no_match" : "no_target";
      if (report.filled) lastUserTarget = null;
      return { status, ...report };
    }
    let aiResult;
    try {
      aiResult = await aiRequestMappings(section, described, sources);
    } catch (_) {
      aiResult = { ok: false, error: "network" };
    }
    if (!aiResult.ok) return { status: "ai_unavailable", error: aiResult.error, ...report };

    // Keep AI for unfamiliar layouts, but always add deterministic mappings for labels we know exactly.
    // This prevents a sparse AI response from dropping obvious fields such as gender or phone.
    const mappedFieldIds = new Set(aiResult.mappings.map(({ fieldId }) => fieldId));
    const validSourceKeys = new Set(sources.map(({ key }) => key));
    for (const target of described) {
      if (mappedFieldIds.has(target.id)) continue;
      const expected = aiExpectedSource(section, target.element);
      const value = expected ? aiSourceValue(section, payload, expected) : "";
      if (!expected || !validSourceKeys.has(expected) || value === "" || value === undefined ||
        value === null || value === false) continue;
      aiResult.mappings.push({ fieldId: target.id, sourceKey: expected, confidence: 1 });
      mappedFieldIds.add(target.id);
    }

    const fieldMap = new Map(described.map((item) => [item.id, item]));
    if (identityKey && payload.record?.[identityKey]) {
      const identityMapping = aiResult.mappings.find(({ sourceKey }) => sourceKey === identityKey);
      const identityElement = described.find(({ element }) =>
        aiExpectedSource(section, element) === identityKey)?.element ||
        fieldMap.get(identityMapping?.fieldId)?.element;
      const existing = identityElement && readControlValue(identityElement);
      if (existing && normalizeMatchText(existing) !== normalizeMatchText(payload.record[identityKey])) {
        return { status: "record_conflict", ...report };
      }
    }

    const pending = [];
    const usedSources = new Set();
    let matched = 0;
    for (const mapping of aiResult.mappings) {
      const target = fieldMap.get(mapping.fieldId);
      const value = aiSourceValue(section, payload, mapping.sourceKey);
      if (!target || value === "" || value === undefined || value === null || value === false) continue;
      matched += 1;
      if (aiValuesEquivalent(target.element, value, mapping.sourceKey)) {
        report.unchanged += 1;
        continue;
      }
      const expected = aiExpectedSource(section, target.element);
      const duplicateSource = section !== "basic" && usedSources.has(mapping.sourceKey);
      usedSources.add(mapping.sourceKey);
      const remembered = aiResult.rememberedForSite[target.fingerprint];
      const uncertain = mapping.confidence < 0.9 || duplicateSource ||
        (expected && expected !== mapping.sourceKey && remembered !== mapping.sourceKey);
      if (uncertain || aiHasExistingValue(target.element)) {
        pending.push(mapping);
        continue;
      }
      try {
        if (await aiFillOne(section, payload, mapping, described, overwriteExisting)) {
          report.filled += 1;
          report.sections[section] += 1;
        } else report.failed += 1;
      } catch (_) {
        report.failed += 1;
      }
    }
    if (pending.length) aiShowReview(section, payload, pending, described, sources, aiResult.siteKey);
    if (report.filled || pending.length) lastUserTarget = null;
    return {
      status: report.filled ? "filled" : pending.length ? "pending_review" : matched ? "no_empty" : "no_match",
      pendingReview: pending.length,
      ...report,
    };
  }

  // The bundled demo page can exercise the same explicit record selection flow.
  if (document.documentElement.hasAttribute("data-autofill-demo")) {
    window.__personalAutofillDemoClassify = (element) => classifyBasicField(element);
    window.__personalAutofillDemoFill = (payload) => fillPageWithRetries(payload);
    window.__personalAutofillDemoRecord = (type, record) => fillSelectedRecord(type, record, false);
    window.__personalAutofillDemoAiFill = (payload) => fillWithAi("basic", payload, Boolean(payload.overwriteExisting));
    window.__personalAutofillDemoAiRecord = (type, record) => {
      const section = Object.keys(STRUCTURED_SECTIONS)
        .find((key) => STRUCTURED_SECTIONS[key].recordsKey === type);
      return section ? fillWithAi(section, { record }, false) : { status: "no_target", ...createReport() };
    };
  }

  if (!globalThis.chrome?.runtime?.onMessage || !globalThis.chrome?.storage?.local) return;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "FILL_SELECTED_RECORD") {
      const section = Object.keys(STRUCTURED_SECTIONS)
        .find((key) => STRUCTURED_SECTIONS[key].recordsKey === message.recordType);
      const operation = message.useAi && section
        ? fillWithAi(section, { record: message.record }, Boolean(message.overwriteExisting))
        : fillSelectedRecord(message.recordType, message.record, Boolean(message.overwriteExisting));
      operation
        .then((result) => sendResponse(result))
        .catch(() => sendResponse({ status: "no_match", ...createReport() }));
      return true;
    }
    if (message?.type !== "FILL_PERSONAL_INFO") return false;
    const operation = message.useAi
      ? fillBasicWithAi(message)
      : fillPageWithRetries(message);
    operation
      .then((report) => sendResponse(report))
      .catch(() => sendResponse(createReport()));
    return true;
  });

})();
