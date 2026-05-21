export type BotLang = 'km' | 'zh' | 'en';

export function resolveLang(code?: string | null): BotLang {
  if (code === 'zh' || code === 'zh-hans' || code === 'zh-hant') return 'zh';
  if (code === 'en') return 'en';
  return 'km'; // default
}

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  km: {
    langName: '🇰🇭 ភាសាខ្មែរ',
    langChanged: '✅ ភាសាត្រូវបានផ្លាស់ប្ដូរទៅ ភាសាខ្មែរ',
    langChoose: '🌐 សូមជ្រើសរើសភាសា៖',
    langBtn: { km: '🇰🇭 ខ្មែរ', zh: '🇨🇳 中文', en: '🇺🇸 English' },

    welcome: (name: string) =>
      `👋 <b>ស្វាគមន៍មក Finance GM, ${name}!</b>\n` +
      `ជំនួយការហិរញ្ញវត្ថុ AI ផ្ទាល់ខ្លួនរបស់អ្នក 💚\n\n` +
      `━━━━━━━━━━━━━━\n\n` +
      `🔹 <b>មុខងារ</b>\n` +
      `📊 តាមដានចំណូល &amp; ចំណាយ\n` +
      `📈 របាយការណ៍ប្រចាំសប្តាហ៍ &amp; ខែ\n` +
      `🏆 ការចំណាយតាមប្រភេទ\n` +
      `🤖 កត់ត្រាដោយភាសាធម្មជាតិ\n\n` +
      `🔹 <b>ការកត់ត្រារហ័ស</b>\n` +
      `→ "ចំណាយ $12 លើអាហារ"\n` +
      `→ "ទទួលបាន $500 freelance"\n\n` +
      `🔹 <b>ពាក្យបញ្ជា</b>\n` +
      `/summary · /report · /language · /help\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `ត្រៀមខ្លួន? 🚀`,

    help: () =>
      `🤖 <b>Finance GM Bot</b>\n\n` +
      `━━━━━━━━━━━━━━\n\n` +
      `🔹 <b>ពាក្យបញ្ជា</b>\n` +
      `/start — ស្វាគមន៍ &amp; Dashboard\n` +
      `/summary — របាយការណ៍សប្តាហ៍\n` +
      `/report — របាយការណ៍ខែ\n` +
      `/language — ប្ដូរភាសា\n` +
      `/help — ជំនួយ\n\n` +
      `🔹 <b>ការកត់ត្រា</b>\n` +
      `→ "ចំណាយ $12 លើអាហារ"\n` +
      `→ "បង $50 ទិញគ្រឿងទេស"\n` +
      `→ "ទទួលបាន $500 freelance"\n\n` +
      `✅ ចំនួន  ✅ ប្រភេទ  ✅ ចំណូល/ចំណាយ\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `ប្រើ Dashboard សម្រាប់ការវិភាគពេញ 📊`,

    summaryTitle: (s: string, e: string) => `សង្ខេបហិរញ្ញវត្ថុប្រចាំសប្តាហ៍ (${s} - ${e})`,
    incomeLabel: 'ចំណូល:',
    expensesLabel: 'ចំណាយ:',
    netLabel: 'សុទ្ធ:',
    categoriesLabel: 'តាមប្រភេទ',
    accountsLabel: 'គណនី (សរុប)',
    summaryIncome: 'ចំណូល:',
    summaryExpenses: 'ចំណាយ:',
    summaryNet: 'សុទ្ធ:',
    summaryByCategory: '\nតាមប្រភេទ:\n',
    summaryNoExpenses: '\nមិនទាន់មានការចំណាយក្នុងសប្តាហ៍នេះ។\n',
    summaryAccounts: (total: string) => `\nគណនី (សរុប: $${total})\n`,
    motivation: (rate: number, net: number) => {
      if (net < 0) return 'អ្នកចំណាយហួស! ត្រូវកាត់បន្ថយ! 💪';
      if (rate >= 50) return 'អស្ចារ្យណាស់! អ្នកកំពុងប្រើប្រាស់ប្រាក់បានល្អ! 🏆';
      if (rate >= 30) return 'អ្នកធ្វើបានល្អណាស់! 💚';
      if (rate >= 20) return 'អ្នកកំពុងសន្សំបានល្អ! 💪';
      if (rate >= 10) return 'ល្អ! បន្តខិតខំ! 👍';
      return 'រៀងរាល់ដុល្លារសំខាន់ ។ បន្តកត់ត្រា! 📊';
    },

    noUser: 'សូមចាប់ផ្ដើម bot ដំបូងជាមួយ /start',
    noAccount:
      '🏦 *រកមិនឃើញគណនី!*\n\n' +
      'អ្នកត្រូវបង្កើតគណនីចំណូលចំណាយ មុនពេលកត់ត្រា។\n\n' +
      '👉 បើក Dashboard ទៅ *Accounts* ហើយចុច ➕ ដើម្បីបង្កើត (ឧ. "Cash on Hand").\n\n' +
      'ពេលប្រើរួច ត្រឡប់មកកត់ត្រាប្រតិបត្តិការ។',
    insufficientFunds: (name: string, bal: string, amt: string, need: string) =>
      `❌ *សងប្រាក់មិនគ្រប់!*\n\n` +
      `💳 *${name}* ទឹកប្រាក់: *$${bal}*\n` +
      `💸 ចំនួនប្រតិបត្តិការ: *$${amt}*\n\n` +
      `អ្នកត្រូវការ *$${need}* ទៀត!\n\n` +
      `_កត់ចំណូលដំបូង ឬ កាត់បន្ថយចំនួន។_`,
    txLogged: (sign: string, amt: string, icon: string, cat: string, note: string, accIcon: string, accName: string, bal: string) =>
      `${sign === '+' ? '💰' : '💸'} *ប្រតិបត្តិការបានកត់ត្រា!*\n\n` +
      `*ចំនួន:* ${sign}$${amt}\n` +
      `*ប្រភេទ:* ${icon} ${cat}\n` +
      `*កំណត់ចំណាំ:* ${note}\n` +
      `*គណនី:* ${accIcon} ${accName}\n` +
      `*ទឹកប្រាក់ថ្មី:* $${bal}\n\n` +
      `_ប្រើ /summary ដើម្បីមើលរបាយការណ៍សប្តាហ៍។_`,
    txFailed: '❌ ការកត់ត្រាបរាជ័យ! សូមព្យាយាមម្ដងទៀត។',
    summaryFailed: '❌ មិនអាចបង្កើតរបាយការណ៍! សូមព្យាយាមម្ដងទៀត។',
    openDashboard: '💰 Open Dashboard',
    openAccounts: '🏦 Open Accounts',
    renewButton: '💳 បន្តការជាវ',
    paymentApproved: (plan: string, until: string) =>
      `✅ *ការទូទាត់ត្រូវបានអនុម័ត!*\n\n` +
      `$${plan} ⭐ Plan: *${plan}*\n` +
      `📅 អស់រហូតដល់: *${until}*\n\n` +
      `អ្នកអាចកត់ត្រាប្រតិបត្តិការបានដោយសេរី។ យើងនឹងជូនដំណឹងមុនដល់ការបញ្ចប់!`,
    subscriptionExpiring: (daysLeft: number, expiryDate: string) => {
      const urgency = daysLeft === 1 ? '🚨' : '⚠️';
      const dayLabel = daysLeft === 1 ? 'ថ្ងៃស្អែក' : 'ក្នុង 3 ថ្ងៃ';
      const DIV = '━━━━━━━━━━━━━━━━━━';
      return `${urgency} <b>ការជាវអស់ ${daysLeft === 1 ? 'ថ្ងៃស្អែក' : 'ក្នុង 3 ថ្ងៃ'}</b>\n${DIV}\n\n` +
        `ការជាវ Finance GM Premium របស់អ្នកនឹងអស់ <b>${dayLabel}</b>។\n\n` +
        `  អស់នៅថ្ងៃ   <code>${expiryDate}</code>\n\n` +
        `${DIV}\n\n` +
        `បន្តការជាវឥឡូវ ដើម្បីកុំឱ្យខកខានការតាមដានហិរញ្ញវត្ថុ។`;
    },
  },

  zh: {
    langName: '🇨🇳 中文',
    langChanged: '✅ 语言已切换为中文',
    langChoose: '🌐 请选择语言：',
    langBtn: { km: '🇰🇭 ខ្មែរ', zh: '🇨🇳 中文', en: '🇺🇸 English' },

    welcome: (name: string) =>
      `👋 <b>欢迎使用 Finance GM, ${name}!</b>\n` +
      `您的个人 AI 财务助理 💚\n\n` +
      `━━━━━━━━━━━━━━\n\n` +
      `🔹 <b>功能</b>\n` +
      `📊 追踪收入 &amp; 支出\n` +
      `📈 每周 &amp; 每月报告\n` +
      `🏆 分类消费洞察\n` +
      `🤖 自然语言记账\n\n` +
      `🔹 <b>快速记账</b>\n` +
      `→ "花了 $12 吃午饭"\n` +
      `→ "赚了 $500 freelance"\n\n` +
      `🔹 <b>命令</b>\n` +
      `/summary · /report · /language · /help\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `开始吧！🚀`,

    help: () =>
      `🤖 <b>Finance GM Bot</b>\n\n` +
      `━━━━━━━━━━━━━━\n\n` +
      `🔹 <b>命令</b>\n` +
      `/start — 欢迎 &amp; Dashboard\n` +
      `/summary — 本周报告\n` +
      `/report — 月度报告\n` +
      `/language — 切换语言\n` +
      `/help — 帮助\n\n` +
      `🔹 <b>快速记账</b>\n` +
      `→ "花了 $12 吃午饭"\n` +
      `→ "买菜花了 $50"\n` +
      `→ "赚了 $500 freelance"\n\n` +
      `✅ 金额  ✅ 分类  ✅ 收支类型\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `使用 Dashboard 查看完整分析 📊`,

    summaryTitle: (s: string, e: string) => `每周财务摘要 (${s} - ${e})`,
    incomeLabel: '收入:',
    expensesLabel: '支出:',
    netLabel: '净额:',
    categoriesLabel: '分类支出',
    accountsLabel: '账户 (合计)',
    summaryIncome: '收入:',
    summaryExpenses: '支出:',
    summaryNet: '净额:',
    summaryByCategory: '\n分类支出:\n',
    summaryNoExpenses: '\n本周暂无支出记录。\n',
    summaryAccounts: (total: string) => `\n账户 (合计: $${total})\n`,
    motivation: (rate: number, net: number) => {
      if (net < 0) return '您本周超支了，是时候减少开支！💪';
      if (rate >= 50) return '储蓄率超高！您理财非常棒！🏆';
      if (rate >= 30) return '本周表现出色！💚';
      if (rate >= 20) return '储蓄状态良好！💪';
      if (rate >= 10) return '继续保持！👍';
      return '每一分钱都重要，坚持记账！📊';
    },

    noUser: '请先用 /start 启动机器人',
    noAccount:
      '🏦 *未找到账户！*\n\n' +
      '请先创建一个账户，再记录交易。\n\n' +
      '👉 打开 Dashboard，进入 *Accounts* 页面，点击 ➕ 创建第一个账户（如"现金"）。\n\n' +
      '账户创建后，即可正常记录交易。',
    insufficientFunds: (name: string, bal: string, amt: string, need: string) =>
      `❌ *余额不足！*\n\n` +
      `💳 *${name}* 余额: *$${bal}*\n` +
      `💸 交易金额: *$${amt}*\n\n` +
      `还需 *$${need}* 才能完成！\n\n` +
      `_请先添加收入或减少金额。_`,
    txLogged: (sign: string, amt: string, icon: string, cat: string, note: string, accIcon: string, accName: string, bal: string) =>
      `${sign === '+' ? '💰' : '💸'} *交易已记录！*\n\n` +
      `*金额:* ${sign}$${amt}\n` +
      `*分类:* ${icon} ${cat}\n` +
      `*备注:* ${note}\n` +
      `*账户:* ${accIcon} ${accName}\n` +
      `*新余额:* $${bal}\n\n` +
      `_使用 /summary 查看每周报告。_`,
    txFailed: '❌ 记账失败，请重试。',
    summaryFailed: '❌ 生成摘要失败，请重试。',
    openDashboard: '💰 Open Dashboard',
    openAccounts: '🏦 Open Accounts',
    renewButton: '💳 续费订阅',
    paymentApproved: (plan: string, until: string) =>
      `✅ *付款已批准！*\n\n` +
      `⭐ 套餐: *${plan}*\n` +
      `📅 有效期至: *${until}*\n\n` +
      `您现在可以自由记录交易。到期前我们会提醒您续费！`,
    subscriptionExpiring: (daysLeft: number, expiryDate: string) => {
      const urgency = daysLeft === 1 ? '🚨' : '⚠️';
      const dayLabel = daysLeft === 1 ? '明天' : '3天后';
      const DIV = '━━━━━━━━━━━━━━━━━━';
      return `${urgency} <b>订阅将于${daysLeft === 1 ? '明天' : '3天后'}到期</b>\n${DIV}\n\n` +
        `您的 Finance GM Premium 订阅将<b>${dayLabel}</b>到期。\n\n` +
        `  到期日期   <code>${expiryDate}</code>\n\n` +
        `${DIV}\n\n` +
        `请立即续费，以免中断财务记录。`;
    },
  },

  en: {
    langName: '🇺🇸 English',
    langChanged: '✅ Language changed to English',
    langChoose: '🌐 Choose your language:',
    langBtn: { km: '🇰🇭 ខ្មែរ', zh: '🇨🇳 中文', en: '🇺🇸 English' },

    welcome: (name: string) =>
      `👋 <b>Welcome to Finance GM, ${name}!</b>\n` +
      `Your personal AI finance assistant 💚\n\n` +
      `━━━━━━━━━━━━━━\n\n` +
      `🔹 <b>Features</b>\n` +
      `📊 Track income &amp; expenses\n` +
      `📈 Weekly &amp; monthly reports\n` +
      `🏆 Category spending insights\n` +
      `🤖 Natural language logging\n\n` +
      `🔹 <b>Quick Log</b>\n` +
      `→ "Spent $12 on lunch"\n` +
      `→ "Earned $500 freelance"\n\n` +
      `🔹 <b>Commands</b>\n` +
      `/summary · /report · /language · /help\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `Ready to crush it? 🚀`,

    help: () =>
      `🤖 <b>Finance GM Bot</b>\n\n` +
      `━━━━━━━━━━━━━━\n\n` +
      `🔹 <b>Commands</b>\n` +
      `/start — Welcome &amp; Dashboard\n` +
      `/summary — Weekly report\n` +
      `/report — Monthly report\n` +
      `/language — Change language\n` +
      `/help — Help\n\n` +
      `🔹 <b>Quick Log</b>\n` +
      `→ "Spent $12 on lunch"\n` +
      `→ "Paid $50 for groceries"\n` +
      `→ "Earned $500 freelance"\n\n` +
      `✅ Amount  ✅ Category  ✅ Income/Expense\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `Use the Dashboard for full analytics 📊`,

    summaryTitle: (s: string, e: string) => `Weekly Finance Summary (${s} - ${e})`,
    incomeLabel: 'Income:',
    expensesLabel: 'Expenses:',
    netLabel: 'Net:',
    categoriesLabel: 'By Category',
    accountsLabel: 'Accounts (Total)',
    summaryIncome: 'Income:',
    summaryExpenses: 'Expenses:',
    summaryNet: 'Net:',
    summaryByCategory: '\nBy Category:\n',
    summaryNoExpenses: '\nNo expenses logged this week.\n',
    summaryAccounts: (total: string) => `\nAccounts (Total: $${total})\n`,
    motivation: (rate: number, net: number) => {
      if (net < 0) return "You're overspending this week. Time to cut back! 💪";
      if (rate >= 50) return "Incredible savings rate! You're crushing it! 🏆";
      if (rate >= 30) return "You're crushing it this week! 💚";
      if (rate >= 20) return "You're saving strong this week! 💪";
      if (rate >= 10) return "Good progress! Keep it up this week! 👍";
      return "Every dollar counts. Keep tracking! 📊";
    },

    noUser: 'Please start the bot first with /start',
    noAccount:
      '🏦 *No account found!*\n\n' +
      'You need to create a cash account before recording transactions.\n\n' +
      '👉 Open the dashboard, go to *Accounts* tab, and tap ➕ to create your first account (e.g. "Cash on Hand").\n\n' +
      'Once your account is set up, come back and record your transaction normally.',
    insufficientFunds: (name: string, bal: string, amt: string, need: string) =>
      `❌ *Insufficient funds!*\n\n` +
      `💳 *${name}* balance: *$${bal}*\n` +
      `💸 Transaction amount: *$${amt}*\n\n` +
      `You need *$${need}* more to complete this transaction.\n\n` +
      `_Add income first or reduce the amount._`,
    txLogged: (sign: string, amt: string, icon: string, cat: string, note: string, accIcon: string, accName: string, bal: string) =>
      `${sign === '+' ? '💰' : '💸'} *Transaction Logged!*\n\n` +
      `*Amount:* ${sign}$${amt}\n` +
      `*Category:* ${icon} ${cat}\n` +
      `*Note:* ${note}\n` +
      `*Account:* ${accIcon} ${accName}\n` +
      `*New Balance:* $${bal}\n\n` +
      `_Use /summary to see your weekly report._`,
    txFailed: '❌ Failed to log transaction. Please try again.',
    summaryFailed: '❌ Failed to generate summary. Please try again.',
    openDashboard: '💰 Open Dashboard',
    openAccounts: '🏦 Open Accounts',
    renewButton: '💳 Renew Subscription',
    paymentApproved: (plan: string, until: string) =>
      `✅ *Payment Approved!*\n\n` +
      `⭐ Plan: *${plan}*\n` +
      `📅 Active until: *${until}*\n\n` +
      `You can now record transactions freely. We'll remind you before your next billing date.`,
    subscriptionExpiring: (daysLeft: number, expiryDate: string) => {
      const urgency = daysLeft === 1 ? '🚨' : '⚠️';
      const dayLabel = daysLeft === 1 ? 'tomorrow' : 'in 3 days';
      const DIV = '━━━━━━━━━━━━━━━━━━';
      return `${urgency} <b>Subscription Expiring ${daysLeft === 1 ? 'Tomorrow' : 'in 3 Days'}</b>\n${DIV}\n\n` +
        `Your Finance GM Premium subscription expires <b>${dayLabel}</b>.\n\n` +
        `  Expires on   <code>${expiryDate}</code>\n\n` +
        `${DIV}\n\n` +
        `Renew now to keep tracking your finances without interruption.`;
    },
  },
};

export function t(lang: BotLang) {
  return T[lang] ?? T.km;
}
