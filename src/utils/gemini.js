// Client wrapper for Google Gemini API and offline dialog simulator

export async function sendMessageToGemini(apiKey, chatHistory, npcProfile) {
  // If API Key is not set or empty, automatically use offline simulator
  if (!apiKey || apiKey.trim() === "") {
    return simulateOfflineResponse(chatHistory, npcProfile);
  }

  try {
    const formattedContents = chatHistory.map(msg => ({
      role: msg.sender === "player" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    const payload = {
      contents: formattedContents,
      systemInstruction: {
        parts: [{ text: npcProfile.persona }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 250
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Gemini API call failed, falling back to simulator:", errText);
      return simulateOfflineResponse(chatHistory, npcProfile) + " \n*(System: Gemini API error. Switched to offline simulation)*";
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (reply) {
      return reply;
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (err) {
    console.error("Gemini API Exception, falling back to simulator:", err);
    return simulateOfflineResponse(chatHistory, npcProfile) + " \n*(System: Offline simulation active)*";
  }
}

function simulateOfflineResponse(chatHistory, npcProfile) {
  // Get the last message sent by the player
  const lastPlayerMessage = [...chatHistory]
    .reverse()
    .find(msg => msg.sender === "player");

  if (!lastPlayerMessage) {
    return npcProfile.openingMessage;
  }

  const promptText = lastPlayerMessage.text.toLowerCase();

  // Find keyword match
  for (const item of npcProfile.offlineDialog) {
    for (const keyword of item.keywords) {
      if (promptText.includes(keyword)) {
        // Return simulated response, adding a small delay to simulate typing
        return item.response;
      }
    }
  }

  // No keyword matches, return default response
  return npcProfile.offlineDefault;
}
