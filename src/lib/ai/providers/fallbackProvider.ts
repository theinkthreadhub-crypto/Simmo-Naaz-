import { AIProvider, AIProviderResponse, ModelMessage, GenerateOptions } from '../types';

/**
 * Intelligent Deterministic Fallback Engine
 * Parses natural language commands (English, Hindi, Hinglish) and calls tools
 * directly when external LLM APIs are unreachable or offline.
 */
export class FallbackProvider implements AIProvider {
  name = 'fallback_intelligence';
  model = 'deterministic-local';

  async generate(messages: ModelMessage[], options?: GenerateOptions): Promise<AIProviderResponse> {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const clean = lastUserMsg.trim().toLowerCase();

    // 1. Finance: Expense detection (e.g., "₹450 Meta Ads expense add karo" or "add 500 expense for software")
    const expenseMatch = lastUserMsg.match(/(?:₹\s*|\b(?:rs|inr)\s*)?(\d+(?:\.\d{1,2})?)\s*(?:(?:rupaye|rupees)?\s*)?(.*?)(?:expense|kharcha|spent|spend)/i) ||
      lastUserMsg.match(/(?:add|record|log)?\s*(?:expense|kharcha)\s*(?:of)?\s*(?:₹\s*|\b(?:rs|inr)\s*)?(\d+(?:\.\d{1,2})?)\s*(?:for|on)?\s*(.*)/i);

    if (expenseMatch && (clean.includes('expense') || clean.includes('kharcha') || clean.includes('add karo'))) {
      const amount = parseFloat(expenseMatch[1]);
      let desc = (expenseMatch[2] || 'Operational Expense').trim().replace(/add karo|karo|add/gi, '').trim();
      if (!desc) desc = 'General Expense';

      let category = 'BUSINESS_ADS';
      if (desc.toLowerCase().includes('meta') || desc.toLowerCase().includes('ad') || desc.toLowerCase().includes('marketing')) {
        category = 'BUSINESS_ADS';
      } else if (desc.toLowerCase().includes('tool') || desc.toLowerCase().includes('software') || desc.toLowerCase().includes('subscription')) {
        category = 'SOFTWARE';
      } else if (desc.toLowerCase().includes('inventory') || desc.toLowerCase().includes('fabric') || desc.toLowerCase().includes('stock')) {
        category = 'INVENTORY';
      }

      return {
        content: `Executing financial ledger transaction: Recording ₹${amount} for "${desc}".`,
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'addFinanceTransaction',
            arguments: {
              amount,
              type: 'EXPENSE',
              category,
              description: desc,
              scope: 'BUSINESS'
            }
          }
        ]
      };
    }

    // 2. Finance: Check finance summary
    if (clean.includes('monthly expense') || clean.includes('finance') || clean.includes('kharcha batao') || clean.includes('budget')) {
      return {
        content: 'Retrieving real-time capital velocity and monthly ledger summary.',
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'getFinanceSummary',
            arguments: {}
          }
        ]
      };
    }

    // 3. Daily Plan / Aaj kya karna hai
    if (clean.includes('aaj') && (clean.includes('kya karna') || clean.includes('plan') || clean.includes('today') || clean.includes('missions'))) {
      return {
        content: 'Analyzing your active goals, daily quests, and skill learning trajectory to generate today\'s tactical plan.',
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'getTodayQuests',
            arguments: {}
          }
        ]
      };
    }

    // 4. Quests: Create Quest (e.g. "Kal product upload karne ka quest banao")
    if (clean.includes('quest') && (clean.includes('banao') || clean.includes('create') || clean.includes('add') || clean.includes('set'))) {
      const title = lastUserMsg.replace(/^(?:mentra,?\s*)?(?:ek\s*)?(?:new\s*)?quest\s*(?:banao|add karo|create|set)?/i, '')
        .replace(/(?:ka\s*)?quest\s*(?:banao|add karo|set karo)?$/i, '').trim() || 'Tactical Priority Action';

      const isTomorrow = clean.includes('kal') || clean.includes('tomorrow');
      const targetDate = new Date();
      if (isTomorrow) targetDate.setDate(targetDate.getDate() + 1);

      return {
        content: `Initializing mission: "${title}".`,
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'createQuest',
            arguments: {
              title,
              description: `Created via MENTRA AI Core on ${new Date().toLocaleDateString()}`,
              category: 'BUSINESS',
              type: 'DAILY',
              difficulty: 'MEDIUM',
              due_date: targetDate.toISOString().split('T')[0]
            }
          }
        ]
      };
    }

    // 5. Skills: "Mujhe Public Speaking seekhni hai" or "Python seekhna hai"
    if (clean.includes('seekhn') || clean.includes('learn') || clean.includes('skill')) {
      let skillName = 'Executive Public Speaking';
      if (clean.includes('python')) skillName = 'Python Agent Development';
      else if (clean.includes('sales') || clean.includes('negotiation')) skillName = 'High-Ticket Negotiation & Sales';

      return {
        content: `Initiating skill learning trajectory for "${skillName}".`,
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'createSkill',
            arguments: {
              skillName,
              whyLearn: 'Sovereign personal mastery and high-leverage execution',
              currentExperience: 'Beginner'
            }
          }
        ]
      };
    }

    // 6. Public Speaking practice
    if (clean.includes('practice start') || (clean.includes('public speaking') && clean.includes('practice'))) {
      return {
        content: 'Retrieving your active Public Speaking roadmap and today\'s practice challenge.',
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'getNextLearningActivity',
            arguments: {
              skillId: 'skill_public_speaking'
            }
          }
        ]
      };
    }

    // 7. Journal: Save journal (e.g. "Aaj ka journal save karo: ...")
    if (clean.includes('journal') && (clean.includes('save') || clean.includes('log') || clean.includes('karo'))) {
      const journalBody = lastUserMsg.replace(/^.*?(?:journal\s*(?:me\s*)?(?:save\s*karo|log\s*karo)?\s*:?\s*)/i, '').trim() || lastUserMsg;
      return {
        content: 'Logging reflection checkpoint into your neural chronicle.',
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'saveJournal',
            arguments: {
              content: journalBody,
              mood: 'PRODUCTIVE',
              wins: ['Executed daily action protocol'],
              tomorrowActions: ['Maintain steady focus cadence']
            }
          }
        ]
      };
    }

    // 8. Memory Search: "Maine ads ke bare me last kya decide kiya tha?"
    if (clean.includes('decide') || clean.includes('yaad') || clean.includes('remember') || clean.includes('memory') || clean.includes('search')) {
      const queryTerm = clean.includes('ads') ? 'ads' : clean.includes('pricing') ? 'pricing' : clean.split(' ').slice(0, 3).join(' ');
      return {
        content: `Searching Second Brain neural memory for "${queryTerm}".`,
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'searchMemory',
            arguments: {
              query: queryTerm
            }
          }
        ]
      };
    }

    // 9. Player Progress & Level check
    if (clean.includes('level') || clean.includes('rank') || clean.includes('xp') || clean.includes('progress')) {
      return {
        content: 'Retrieving real-time character telemetry, level, and XP progression.',
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'getPlayerProgress',
            arguments: {}
          }
        ]
      };
    }

    // 10. Research & Market Intelligence (e.g. "Streetwear trends research karo")
    if (clean.includes('research') || clean.includes('trends') || clean.includes('market')) {
      const topic = lastUserMsg.replace(/^(?:mentra,?\s*)?(?:please\s*)?/i, '')
        .replace(/(?:research karo|research|batao|dhundo)$/i, '').trim() || 'Emerging Market Opportunities';

      return {
        content: `Conducting live intelligence scan on "${topic}".`,
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'runWebResearch',
            arguments: {
              topic,
              objective: 'Strategic market intelligence',
              depth: 'STANDARD'
            }
          }
        ]
      };
    }

    // 11. Email Draft / Reply (e.g. "supplier@textilemill.com ko reply draft karo")
    const emailMatch = lastUserMsg.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if ((emailMatch || /\b(?:email|gmail|mail)\b/.test(clean)) && /\b(?:draft|reply|send|bhejo|karo)\b/.test(clean)) {
      if (!emailMatch) return { content: 'Email draft ke liye recipient ka email address bhejiye.' };
      const toEmail = emailMatch[1];
      const subject = clean.includes('quotation') ? 'Re: Revised Pricing & Quotation' : 'Executive Follow-Up';

      return {
        content: `Preparing executive email draft for ${toEmail}.`,
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'draftEmail',
            arguments: {
              to: toEmail,
              subject,
              body: `Hello,\n\nRegarding the recent update, please find our confirmation. We look forward to proceeding with the agreed timeline.\n\nBest regards,\nOperator`
            }
          }
        ]
      };
    }

    // 12. Google Workspace check (e.g. "Gmail check karo", "Calendar check karo")
    if (clean.includes('gmail') || clean.includes('email') || clean.includes('calendar') || clean.includes('drive')) {
      return {
        content: 'Verifying Google Workspace connection status.',
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: 'getConnections',
            arguments: {
              service: 'GOOGLE_ACCOUNT'
            }
          }
        ]
      };
    }

    // 13. Conversational Chat & Small Talk (Hindi, Hinglish, English)
    if (clean.includes('kya kar rahi ho') || clean.includes('kya kr rhi ho') || clean.includes('kya kar rahe ho') || clean.includes('what are you doing') || clean.includes('kya chal raha')) {
      const replies = [
        "Main apke business, brand drops, Google Drive assets aur daily tasks ko monitor kar rahi hoon! Bataiye, aaj kis cheez par kaam karna hai? (T-shirt design, store drop, ya expense record?)",
        "Bas apke commands ke liye ready hoon! Store ke products, WhatsApp automations aur designs dekh rahi hoon. Kuch naya launch karna hai?",
        "Main online hoon aur apke InkThread Hub ecosystem, sales data aur tasks ko coordinate kar rahi hoon. Koi naya design create karein?"
      ];
      return { content: replies[Math.floor(Math.random() * replies.length)] };
    }

    if (clean.includes('kaise ho') || clean.includes('kaisi ho') || clean.includes('how are you') || clean.includes('kaisa hai')) {
      return { content: "Main bilkul badhiya aur 100% active hoon! Aap bataiye, aaj ka din kaisa chal raha hai aur hume kya automate karna hai?" };
    }

    if (clean === 'hi' || clean === 'hello' || clean === 'hey' || clean.includes('namaste') || clean.includes('salam')) {
      return { content: "Hey! MENTRA AI Brain active hai. Aap mujhe koi bhi design photo bhej sakte hain, store pe product publish karne bol sakte hain, ya koi bhi sawal pooch sakte hain!" };
    }

    if (clean.includes('kaun ho') || clean.includes('who are you') || clean.includes('naam kya')) {
      return { content: "Main MENTRA hoon — aapka personal Sovereign AI OS aur Fashion Brand Growth Agent! Main WhatsApp se direct apke brand ke designs generate, Drive sync aur website store publish karti hoon." };
    }

    if (clean.includes('tshirt') || clean.includes('t-shirt') || clean.includes('hoodie') || clean.includes('design') || clean.includes('fashion') || clean.includes('drop')) {
      return { content: "Fashion design drop ke liye: Aap WhatsApp par koi bhi reference image ya prompt bhej dijiye (e.g. 'Oversized acid-wash anime hoodie banake 1299 me publish karo'). Main instant model mockup, tech pack aur live store listing create kar doongi!" };
    }

    // Default conversational response
    return {
      content: `Samajh gayi! MENTRA Brain active hai. Aap mujhse daily plan, expenses, website product launch, Google Drive search, ya normal chat koi bhi baat kar sakte hain. Bataiye kya karein?`
    };
  }

  async stream(
    messages: ModelMessage[],
    options: GenerateOptions,
    callbacks: { onToken: (token: string) => void; onStatus?: (status: string) => void }
  ): Promise<AIProviderResponse> {
    if (callbacks.onStatus) callbacks.onStatus('PROCESSING');
    const res = await this.generate(messages, options);
    
    // Stream tokens
    const words = res.content.split(' ');
    for (const word of words) {
      callbacks.onToken(word + ' ');
      await new Promise(r => setTimeout(r, 15));
    }

    return res;
  }
}
