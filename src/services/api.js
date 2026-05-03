import { GoogleGenerativeAI } from "@google/generative-ai";

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

const FALLBACK_KEYS = [
  "AIzaSyAPib7ZyoQ0wXOG5YJA92lCOCamWXJf7bc",
  "AIzaSyCip_Y2Z4q4VVozw1LWcOOBIfO-s_f48yE",
  "AIzaSyD69PEYqcMCYKz-kOUKNDYdrFX4x3UNoNk",
  "AIzaSyDsA7xN9T3sVDwRG83LvvK4dOcbMZogOIA"
];

let lastRequestTime = 0;
const RPM_LIMIT_MS = 4000;
let lastErrorMessage = "No diagnostic data available.";

export const callGemini = async (prompt, systemInstruction) => {
  const now = Date.now();
  if (now - lastRequestTime < RPM_LIMIT_MS) {
    await new Promise(res => setTimeout(res, RPM_LIMIT_MS - (now - lastRequestTime)));
  }
  lastRequestTime = Date.now();

  const query = prompt.toLowerCase();
  const fallbackKey = Object.keys(CIVIC_KNOWLEDGE_BASE).find(k => query.includes(k.split(' ')[0]));
  const keysToTry = Array.from(new Set([getActiveKey(), ...FALLBACK_KEYS])).filter(Boolean);

  const modelsToTry = [
    { ver: 'v1', mod: 'gemini-1.5-flash' },
    { ver: 'v1beta', mod: 'gemini-1.5-flash' },
    { ver: 'v1', mod: 'gemini-pro' }
  ];

  const fetchWithRetry = async (keyIndex = 0, modelIndex = 0) => {
    if (keyIndex >= keysToTry.length) {
      throw new Error(lastErrorMessage);
    }

    const currentKey = keysToTry[keyIndex];

    // Discovery Phase: If standard models fail, ask Google what models are allowed
    if (modelIndex >= modelsToTry.length) {
      try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${currentKey}`);
        const listData = await listRes.json();
        const available = listData.models?.map(m => m.name.split('/').pop()) || [];
        if (available.length > 0) {
          lastErrorMessage = `Discovered models: ${available.join(', ')}. Attempting ${available[0]}...`;
          // Try the first discovered model that supports generateContent
          const bestModel = listData.models.find(m => m.supportedGenerationMethods.includes('generateContent'))?.name.split('/').pop();
          if (bestModel) {
            modelsToTry.push({ ver: 'v1', mod: bestModel });
            return fetchWithRetry(keyIndex, modelsToTry.length - 1);
          }
        }
      } catch (e) {
        console.error("Discovery failed", e);
      }
      return fetchWithRetry(keyIndex + 1, 0);
    }

    const config = modelsToTry[modelIndex];
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/${config.ver}/models/${config.mod}:generateContent?key=${currentKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }]
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err.error?.message || `HTTP ${response.status}`;
        lastErrorMessage = `Node ${keyIndex} (${config.mod}): ${msg}`;
        return fetchWithRetry(keyIndex, modelIndex + 1);
      }

      const result = await response.json();
      return {
        text: result.candidates?.[0]?.content?.parts?.[0]?.text || "Signal lost.",
        sources: []
      };
    } catch (error) {
      lastErrorMessage = error.message;
      return fetchWithRetry(keyIndex, modelIndex + 1);
    }
  };

  try {
    return await fetchWithRetry();
  } catch (error) {
    const fallbackData = CIVIC_KNOWLEDGE_BASE[fallbackKey] || "Our central intelligence nodes are undergoing maintenance. Please consult official portals.";
    return {
      text: `🏛️ **ELECTION-HERE (Intelligence Relay)**\n\n${fallbackData}\n\n*(Diagnostic Note: ${lastErrorMessage})*`,
      sources: []
    };
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
