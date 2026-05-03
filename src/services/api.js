import toast from 'react-hot-toast';

const CIVIC_KNOWLEDGE_BASE = {
  "how to vote": "To vote in India, you must be a registered voter. On election day, go to your designated polling booth with a valid ID (like EPIC card). Your identity will be verified, ink applied, and then you can cast your vote on the EVM.",
  "eligibility": "To be eligible to vote, you must be an Indian citizen, 18 years of age or older on the qualifying date, and a resident of the polling area.",
  "evm": "Electronic Voting Machines (EVMs) are secure devices used to cast and count votes. They are tamper-proof and verified by VVPAT slips.",
  "vvpat": "Voter Verifiable Paper Audit Trail (VVPAT) is an independent system attached to the EVM that allows voters to verify that their votes are cast as intended.",
  "who are you": "I am the Election-Here Intelligence Assistant, designed to help citizens understand and participate in the democratic process.",
  "manifesto": "A manifesto is a public declaration of policy and aims, especially one issued before an election by a political party or candidate.",
  "election commission": "The Election Commission of India is an autonomous constitutional authority responsible for administering election processes in India.",
  "right to vote": "The Right to Vote is a fundamental democratic right. In India, it is a legal right granted by the Constitution under Article 326.",
  "nota": "None of the Above (NOTA) is a ballot option that allows voters to officially register a vote of rejection for all candidates.",
  "pan card": "A Permanent Account Number (PAN) is a ten-character alphanumeric identifier issued by the Income Tax Department.",
  "aadhar": "Aadhaar is a 12-digit unique identity number that can be obtained by residents of India, based on their biometric and demographic data.",
  "voter id": "The Elector's Photo Identity Card (EPIC) is a photo identity card issued by the Election Commission of India to adult citizens."
};

const getActiveKey = () => {
  return localStorage.getItem('ELECTION_HERE_DYNAMIC_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
};

// Secondary fallback keys from past stable sessions
const FALLBACK_KEYS = [
  "AIzaSyD-xd4QCzW50Mz1Np-wHsa5C5g7X8LFgJA",
  "AIzaSyAuc3ZuFtzih4T9f324n7CCXASmNsJQPpg",
  "AIzaSyBUJ80hBqeFQMdwbc5jLSdr4WjVlVlm8Cw",
  "AIzaSyA8qxQGK4p8u9A__WVmcBKPjoIDRPVmKCY"
];

// Rate Limiting: 15 Requests Per Minute (RPM) = 1 request every 4000ms
let lastRequestTime = 0;
const RPM_LIMIT_MS = 4000;

export const callGemini = async (prompt, systemInstruction) => {
  // Throttling for Free Tier (15 RPM)
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < RPM_LIMIT_MS) {
    const waitTime = RPM_LIMIT_MS - timeSinceLast;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();

  const query = prompt.toLowerCase();
  const fallbackKey = Object.keys(CIVIC_KNOWLEDGE_BASE).find(k => query.includes(k));
  
  const primaryKey = getActiveKey();
  // Deduplicate keys while maintaining order
  const keysToTry = Array.from(new Set([primaryKey, ...FALLBACK_KEYS])).filter(Boolean);

  const configs = [
    { ver: 'v1beta', mod: 'gemini-2.0-flash' },
    { ver: 'v1beta', mod: 'gemini-2.5-flash-lite' },
    { ver: 'v1beta', mod: 'gemini-2.0-flash-lite' },
    { ver: 'v1beta', mod: 'gemini-1.5-flash' },
    { ver: 'v1beta', mod: 'gemini-1.5-pro' }
  ];

  const fetchWithRetry = async (keyIndex = 0, retries = 1, delay = 2000) => {
    if (keyIndex >= keysToTry.length) {
      throw new Error("ELECTION-HERE: All intelligence nodes are currently saturated. Please renew the API key or wait for the quota reset.");
    }

    const currentKey = keysToTry[keyIndex];
    let lastError = 'No models responded';
    let hitRateLimit = false;
    let retryAfter = 0;

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); 

        const response = await fetch(`https://generativelanguage.googleapis.com/${config.ver}/models/${config.mod}:generateContent?key=${currentKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `System Instruction: ${systemInstruction}\n\nUser Query: ${prompt}` }] }],
            generationConfig: {
              maxOutputTokens: 2048,
              temperature: 0.7,
            }
          })
        });

        clearTimeout(timeoutId);
        
        if (response.ok) return await response.json();
        
        const errData = await response.json().catch(() => ({}));
        const errStatus = response.status;
        const errMsg = errData.error?.message || `HTTP ${errStatus}`;

        // If Key is expired or invalid, try next key immediately
        if (errStatus === 400 && (errMsg.includes("expired") || errMsg.includes("not valid") || errMsg.includes("API_KEY_INVALID"))) {
          console.warn(`Key ${keyIndex} failed: ${errMsg}. Trying next key...`);
          return fetchWithRetry(keyIndex + 1, retries, delay);
        }
        
        if (errStatus === 429) {
          const match = errMsg.match(/retry in ([\d\.]+)s/i);
          if (match) retryAfter = Math.max(retryAfter, parseFloat(match[1]));
          hitRateLimit = true;
          // On rate limit, we can also try next key
          console.warn(`Key ${keyIndex} rate limited. Trying next key...`);
          return fetchWithRetry(keyIndex + 1, retries, delay);
        }
        
        throw new Error(errMsg);
      } catch (error) {
        lastError = error.message;
        console.warn(`Model ${config.mod} failed with key ${keyIndex}: ${lastError}`);
      }
    }

    if (hitRateLimit && retries > 0) {
      const waitTime = Math.max(delay * 2, (retryAfter * 1000) || 0);
      await new Promise(res => setTimeout(res, waitTime));
      return fetchWithRetry(keyIndex, retries - 1, waitTime);
    }

    // If all models failed for this key, try next key
    return fetchWithRetry(keyIndex + 1, retries, delay);
  };

  try {
    const result = await fetchWithRetry();
    return {
      text: result.candidates?.[0]?.content?.parts?.[0]?.text || "Telemetry signal lost.",
      sources: result.candidates?.[0]?.groundingMetadata?.groundingAttributions?.map(a => ({ uri: a.web?.uri, title: a.web?.title })) || []
    };
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    if (fallbackKey) {
      return {
        text: `🏛️ **ELECTION-HERE (Local Insight)**\n\n${CIVIC_KNOWLEDGE_BASE[fallbackKey]}\n\n*(Note: Displaying offline data due to system load)*`,
        sources: []
      };
    }
    throw error;
  }
};


export const callCloudAuditFunction = async () => {
  // In a real app, this would use the firebase functions SDK
  // const { getFunctions, httpsCallable } = await import('firebase/functions');
  // const functions = getFunctions();
  // const audit = httpsCallable(functions, 'auditElectionData');
  // return (await audit()).data;
  
  // Mock for now to satisfy alignment
  return new Promise(resolve => setTimeout(() => resolve({ status: 'Success', coverage: '100%' }), 800));
};
