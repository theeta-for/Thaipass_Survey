import { useEffect, useState } from "react";

export type Language = "en" | "zh";

const LANGUAGE_KEY = "thaipass-survey-language";

export const languageLabels: Record<Language, string> = {
  en: "English",
  zh: "中文",
};

const zhTranslations: Record<string, string> = {
  "Survey": "问卷",
  "Results": "结果",
  "Concept validation": "概念验证",
  "ThaiPass Survey": "ThaiPass 问卷",
  "Help us validate ThaiPass, a Thailand Travel Assistant concept for international travelers. This survey takes around 2-3 minutes and does not require personal data.":
    "帮助我们验证 ThaiPass，一个面向国际旅客的泰国旅行助手概念。本问卷大约需要 2-3 分钟，不需要填写个人资料。",
  "Research survey": "研究问卷",
  "Thank you for your feedback.": "感谢你的反馈。",
  "Your response has been submitted successfully.": "你的回答已成功提交。",
  "Your answers will help us understand whether ThaiPass is useful before the final product is designed.":
    "你的回答将帮助我们在设计最终产品前了解 ThaiPass 是否有用。",
  "Submit another response": "再提交一份回答",
  "View results": "查看结果",
  "Step": "步骤",
  "of": "共",
  "answered": "已回答",
  "Back": "返回",
  "Continue": "继续",
  "Submit response": "提交回答",
  "Submitting your response...": "正在提交回答...",
  "Please select an answer before continuing.": "请先选择一个答案再继续。",
  "Please rate every topic before continuing.": "请为每个项目评分后再继续。",
  "Please rate every topic before submitting.": "请为每个项目评分后再提交。",
  "Please tell us more": "请补充说明",
  "Type your answer": "请输入你的回答",
  "Select your nationality": "选择你的国籍",
  "Nationality": "国籍",

  "What is your nationality?": "你的国籍是？",
  "Have you visited Thailand before, or are you planning to visit Thailand?": "你以前去过泰国，或者正在计划去泰国吗？",
  "Before traveling to Thailand, how easy or difficult is it to prepare for the following areas?":
    "去泰国旅行前，准备以下事项对你来说容易还是困难？",
  "Before arriving in another country, have you ever paid for travel services in advance?":
    "在抵达其他国家之前，你是否曾提前支付过旅行服务？",
  "Before paying for a travel service in Thailand, what would help you feel confident enough to book?":
    "在支付泰国旅行服务前，哪些因素会让你更有信心预订？",
  "Select all that apply": "可多选",
  "Select up to 5": "最多选择 5 项",
  "Entry & Arrival Preparation": "入境与抵达准备",
  "Trip Readiness & Local Support": "行程准备与当地支持",

  "China": "中国",
  "Hong Kong SAR": "中国香港特别行政区",
  "Taiwan": "中国台湾",
  "Japan": "日本",
  "South Korea": "韩国",
  "Singapore": "新加坡",
  "Malaysia": "马来西亚",
  "Vietnam": "越南",
  "Indonesia": "印度尼西亚",
  "Philippines": "菲律宾",
  "India": "印度",
  "Australia": "澳大利亚",
  "United Kingdom": "英国",
  "Germany": "德国",
  "France": "法国",
  "Italy": "意大利",
  "Spain": "西班牙",
  "Netherlands": "荷兰",
  "Switzerland": "瑞士",
  "United States": "美国",
  "Canada": "加拿大",
  "Middle East (Other)": "中东（其他）",
  "Europe (Other)": "欧洲（其他）",
  "Asia (Other)": "亚洲（其他）",
  "Other": "其他",

  "Yes, I have visited Thailand before": "是的，我以前去过泰国",
  "No, but I am planning to visit": "没有，但我正在计划前往",
  "No, but I am interested in visiting": "没有，但我有兴趣前往",
  "No, and I have no plan to visit": "没有，而且目前没有计划前往",

  "Very easy": "非常容易",
  "Very difficult": "非常困难",
  "Understanding entry requirements": "了解入境要求",
  "Preparing travel documents": "准备旅行文件",
  "Going through the immigration process": "办理入境手续",
  "Arranging airport transfer or transportation": "安排机场接送或交通",
  "Getting mobile internet / SIM / eSIM": "获取移动网络 / SIM / eSIM",
  "Understanding payment options": "了解付款方式",
  "Finding trustworthy travel information": "查找可信的旅行信息",
  "Finding things to do": "寻找可体验的活动",
  "Knowing what to do in an emergency": "知道紧急情况下该怎么做",

  "Airport transfer": "机场接送",
  "Travel insurance": "旅行保险",
  "SIM / eSIM": "SIM / eSIM",
  "Attraction tickets": "景点门票",
  "Tours or activities": "旅游团或活动",
  "Fast track / airport service": "快速通关 / 机场服务",
  "Transportation pass": "交通通票",
  "Hotel pickup": "酒店接送",
  "I have not paid for travel services before arrival": "我没有在抵达前支付过旅行服务",

  "Clear price breakdown": "清晰的价格明细",
  "Refund / cancellation policy": "退款 / 取消政策",
  "Reviews and ratings": "评价和评分",
  "Real photos of the service": "服务的真实照片",
  "Secure payment": "安全支付",
  "Accepted payment methods shown clearly": "清楚显示可接受的付款方式",
  "Official partner / verified provider badge": "官方合作伙伴 / 已验证供应商标识",
  "Customer support contact": "客服联系方式",
  "Information available in my language": "提供我的语言版本信息",
  "Clear explanation of what is included": "清楚说明包含哪些内容",
  "Clear explanation of what happens after purchase": "清楚说明购买后会发生什么",
  "Easy comparison between service options": "方便比较不同服务选项",
  "Brand or provider reputation": "品牌或供应商声誉",

  "Internal review": "内部查看",
  "Admin dashboard": "管理面板",
  "Survey Results": "问卷结果",
  "ThaiPass Survey Results": "ThaiPass 问卷结果",
  "Concept Validation Survey": "概念验证问卷",
  "Survey results are available for internal review only.": "问卷结果仅供内部查看。",
  "Enter password": "输入密码",
  "Show password": "显示密码",
  "Hide password": "隐藏密码",
  "Incorrect password. Please try again.": "密码错误，请重试。",
  "Checking password...": "正在验证密码...",
  "Clear results": "清除结果",
  "Clear all results?": "清除所有结果？",
  "This will permanently remove all survey responses from this browser, including soft-deleted responses.":
    "这将从此浏览器中永久删除所有问卷回答，包括已软删除的回答。",
  "Cancel": "取消",
  "Export PDF": "导出 PDF",
};

export function translate(text: string | undefined, language: Language) {
  if (!text || language === "en") {
    return text ?? "";
  }

  return zhTranslations[text] ?? text;
}

function readSavedLanguage(): Language {
  return localStorage.getItem(LANGUAGE_KEY) === "zh" ? "zh" : "en";
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(() => readSavedLanguage());

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  return {
    language,
    setLanguage: setLanguageState,
    t: (text: string | undefined) => translate(text, language),
  };
}
