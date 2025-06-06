require('dotenv').config();
const axios = require("axios");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

class DeepSeekService {
  constructor() {
    // 🔑 Use OPENROUTER API key
    this.apiKey = process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY;
    console.log('🔑 OpenRouter API Key loaded:', this.apiKey ? 'YES' : 'NO');
    console.log('🔑 API Key starts with:', this.apiKey ? this.apiKey.substring(0, 8) : 'UNDEFINED');
    
    this.baseURL = "https://openrouter.ai/api/v1";
    this.equipmentData = null;
    this.equipmentSummary = null;
    this.loadEquipmentData();
  }

  loadEquipmentData() {
    try {
      const dataPath = path.join(
        __dirname,
        "../data/clean_equipment_data.xlsx"
      );

      if (!fs.existsSync(dataPath)) {
        console.error("❌ Equipment data file not found at:", dataPath);
        return;
      }

      console.log("📊 Loading equipment data for DeepSeek V3-0324 analysis...");
      const workbook = XLSX.readFile(dataPath);
      const sheetName = workbook.SheetNames[0];
      this.equipmentData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // Create a summary for efficient AI context
      this.createEquipmentSummary();

      console.log("✅ Equipment data loaded for DeepSeek V3-0324:", {
        totalRecords: this.equipmentData.length,
        summaryReady: !!this.equipmentSummary,
      });
    } catch (error) {
      console.error("❌ Error loading equipment data:", error);
    }
  }

  createEquipmentSummary() {
    if (!this.equipmentData) return;

    // Create statistical summary for AI context
    const stats = {
      totalEquipment: this.equipmentData.length,
      equipmentTypes: {},
      locations: {},
      faultyEquipment: 0,
      sensorRanges: {},
      riskDistribution: { high: 0, medium: 0, low: 0 },
      sampleData: this.equipmentData.slice(0, 5), // Reduced for faster processing
    };

    this.equipmentData.forEach((row) => {
      // Equipment types
      if (row.equipment) {
        stats.equipmentTypes[row.equipment] =
          (stats.equipmentTypes[row.equipment] || 0) + 1;
      }

      // Locations
      if (row.location) {
        stats.locations[row.location] =
          (stats.locations[row.location] || 0) + 1;
      }

      // Faulty count
      if (row.faulty === 1) {
        stats.faultyEquipment++;
      }

      // Risk distribution
      if (row.risk_score > 0.7) {
        stats.riskDistribution.high++;
      } else if (row.risk_score > 0.5) {
        stats.riskDistribution.medium++;
      } else {
        stats.riskDistribution.low++;
      }
    });

    // Calculate sensor ranges
    ["temperature", "pressure", "vibration", "humidity"].forEach((sensor) => {
      const values = this.equipmentData
        .map((row) => row[sensor])
        .filter((v) => v != null);
      if (values.length > 0) {
        stats.sensorRanges[sensor] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
        };
      }
    });

    this.equipmentSummary = stats;
  }

async analyzeWithDeepSeek(userQuery, conversationContext = []) {
    try {
      if (!this.apiKey) {
        throw new Error(
          "OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable."
        );
      }

      if (!this.equipmentData || !this.equipmentSummary) {
        throw new Error(
          "Equipment data not loaded. Please ensure clean_equipment_data.xlsx exists in the data folder."
        );
      }

      console.log("🚀 Sending query to DeepSeek V3-0324 via OpenRouter:", userQuery.substring(0, 100));

      // Smart context selection based on query type
      const isSimpleQuery = userQuery.length < 30 && !userQuery.toLowerCase().includes('analyze');
      const isEquipmentQuery = userQuery.toLowerCase().includes('equipment') || 
                              userQuery.toLowerCase().includes('fix') || 
                              userQuery.toLowerCase().includes('maintenance');

      let systemPrompt;
      
      if (isSimpleQuery && !isEquipmentQuery) {
        // Minimal context for simple queries
        systemPrompt = `You are an Industrial Equipment AI Assistant. You have access to ${this.equipmentSummary.totalEquipment} equipment records with ${this.equipmentSummary.faultyEquipment} faulty units requiring attention.

Respond concisely and helpfully to: "${userQuery}"`;
      } else {
        // Full context for equipment-related queries
        systemPrompt = `You are an expert Industrial Equipment Analyst AI assistant. You have access to comprehensive equipment monitoring data from an industrial facility.

EQUIPMENT DATA SUMMARY:
- Total Equipment: ${this.equipmentSummary.totalEquipment} pieces
- Equipment Types: ${Object.entries(this.equipmentSummary.equipmentTypes)
        .map(([type, count]) => `${type} (${count})`)
        .join(", ")}
- Locations: ${Object.entries(this.equipmentSummary.locations)
        .map(([loc, count]) => `${loc} (${count})`)
        .join(", ")}
- Faulty Equipment: ${this.equipmentSummary.faultyEquipment} pieces needing immediate repair
- Risk Distribution: High Risk (${
        this.equipmentSummary.riskDistribution.high
      }), Medium Risk (${
        this.equipmentSummary.riskDistribution.medium
      }), Low Risk (${this.equipmentSummary.riskDistribution.low})

SENSOR RANGES:
${Object.entries(this.equipmentSummary.sensorRanges)
  .map(
    ([sensor, range]) =>
      `- ${
        sensor.charAt(0).toUpperCase() + sensor.slice(1)
      }: ${range.min.toFixed(2)} to ${range.max.toFixed(
        2
      )} (avg: ${range.avg.toFixed(2)})`
  )
  .join("\n")}

CRITICAL EQUIPMENT DATA:
${JSON.stringify(this.equipmentSummary.sampleData[0], null, 2)}

For queries about equipment that needs fixing, prioritize:
1. Equipment with faulty=1 AND high risk_score (>0.7)
2. Recent sensor anomalies (temperature >100°F, vibration >3.0g)
3. Equipment by location and type

USER QUERY: "${userQuery}"

Provide specific, actionable analysis based on the actual equipment data.`;
      }

      // Prepare conversation history (limit to last 3 messages for speed)
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationContext.slice(-3), // Only last 3 messages
        { role: "user", content: userQuery },
      ];

      // 🚀 Call DeepSeek V3-0324 via OpenRouter
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: "deepseek/deepseek-chat-v3-0324:free", // ✨ Updated to V3-0324
          messages: messages,
          temperature: 0.3, // Optimal for V3-0324
          max_tokens: isSimpleQuery ? 500 : 1500, // Adaptive token limits
        },
        {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Equipment Analysis Chat",
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      // 🔍 ROBUST RESPONSE EXTRACTION with debugging
      console.log('🔍 API Response Status:', response.status);
      console.log('🔍 Response Data Keys:', Object.keys(response.data));
      console.log('🔍 Choices Array:', response.data.choices?.length);
      
      let aiResponse = '';

      // Try multiple possible response locations
      if (response.data.choices?.[0]?.message?.content) {
        aiResponse = response.data.choices[0].message.content;
        console.log('✅ Found content in choices[0].message.content');
      } else if (response.data.choices?.[0]?.delta?.content) {
        aiResponse = response.data.choices[0].delta.content;
        console.log('✅ Found content in choices[0].delta.content');
      } else if (response.data.content) {
        aiResponse = response.data.content;
        console.log('✅ Found content in response.data.content');
      } else if (response.data.text) {
        aiResponse = response.data.text;
        console.log('✅ Found content in response.data.text');
      } else {
        // Log full response for debugging
        console.error('❌ NO CONTENT FOUND! Full response:');
        console.error(JSON.stringify(response.data, null, 2));
        
        // Smart fallback based on query
        if (userQuery.toLowerCase().includes('fix') || userQuery.toLowerCase().includes('repair')) {
          const urgentEquipment = this.equipmentData
            .filter(eq => eq.faulty === 1 && eq.risk_score > 0.7)
            .slice(0, 10);
            
          aiResponse = `🚨 **CRITICAL EQUIPMENT REQUIRING IMMEDIATE REPAIR**

${urgentEquipment.length > 0 ? urgentEquipment.map((eq, idx) => 
  `${idx + 1}. **${eq.equipment}** (ID: ${eq.equipment_id})
   - Location: ${eq.location}
   - Risk Score: ${(eq.risk_score * 100).toFixed(1)}%
   - Temperature: ${eq.temperature}°F
   - Vibration: ${eq.vibration}g
   - Status: ⚠️ FAULTY - IMMEDIATE ACTION REQUIRED`
).join('\n\n') : 'No critical equipment found requiring immediate repair.'}

**Total Faulty Equipment**: ${this.equipmentSummary.faultyEquipment} units
**High Risk**: ${this.equipmentSummary.riskDistribution.high} units (>70% risk)

**IMMEDIATE ACTIONS:**
1. 🔧 Dispatch maintenance teams to high-risk faulty equipment
2. 📊 Monitor sensor readings for anomalies
3. 🚨 Prioritize equipment with risk scores >0.7

*Note: This analysis uses your actual equipment database with ${this.equipmentSummary.totalEquipment} monitored units.*`;
        } else {
          aiResponse = `I'm ready to help with your equipment analysis. 

Your facility has:
- **${this.equipmentSummary.totalEquipment}** total equipment pieces
- **${this.equipmentSummary.faultyEquipment}** faulty units requiring attention
- **${this.equipmentSummary.riskDistribution.high}** high-risk equipment pieces

Ask me about specific equipment, maintenance needs, or system analysis!

*Note: DeepSeek V3-0324 response parsing issue - showing cached data instead.*`;
        }
      }

      // Validate response is not empty
      if (!aiResponse || aiResponse.trim() === '') {
        throw new Error('DeepSeek V3-0324 returned empty response');
      }

      console.log("✅ DeepSeek V3-0324 response extracted, length:", aiResponse.length);

      return {
        success: true,
        response: aiResponse,
        usage: response.data.usage,
        dataSource: `${this.equipmentSummary.totalEquipment} equipment records via DeepSeek V3-0324`,
      };
    } catch (error) {
      console.error('❌ DeepSeek V3-0324 error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      console.error(
        "❌ DeepSeek V3-0324 API error:",
        error.response?.data || error.message
      );

      if (error.response?.status === 401) {
        throw new Error(
          "OpenRouter API authentication failed. Please check your OPENROUTER_API_KEY."
        );
      } else if (error.response?.status === 402) {
        throw new Error(
          "OpenRouter API payment required. Please add credits at https://openrouter.ai/account"
        );
      } else if (error.response?.status === 429) {
        throw new Error(
          "OpenRouter API rate limit exceeded. Please try again later."
        );
      } else if (error.response?.status === 400) {
        throw new Error(
          `OpenRouter API bad request: ${error.response?.data?.error?.message || 'Invalid request format'}`
        );
      } else if (error.code === "ECONNABORTED") {
        throw new Error("OpenRouter API request timeout. Please try again.");
      }

      throw new Error(`DeepSeek V3-0324 API error: ${error.message}`);
    }
  }

  async testAPIConnection() {
    try {
      console.log('🧪 Testing DeepSeek V3-0324 API connection...');
      console.log('🧪 Using API Key:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'NONE');
      console.log('🧪 Using URL:', this.baseURL);
      
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [{ role: 'user', content: 'Hello, test response' }],
        max_tokens: 50
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Equipment Analysis Chat',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ DeepSeek V3-0324 API test successful:', response.status);
      console.log('✅ Response content:', response.data.choices?.[0]?.message?.content?.substring(0, 100));
      return true;
    } catch (error) {
      console.error('❌ DeepSeek V3-0324 API test failed:', error.response?.status, error.response?.data);
      return false;
    }
  }

  // Quick method to get faulty equipment for emergency queries
  getFaultyEquipmentData() {
    if (!this.equipmentData) return [];
    
    return this.equipmentData
      .filter(eq => eq.faulty === 1)
      .sort((a, b) => b.risk_score - a.risk_score) // Highest risk first
      .slice(0, 20); // Top 20 critical pieces
  }

  // Method to get specific equipment data for detailed analysis
  getEquipmentDataForQuery(query) {
    if (!this.equipmentData) return null;

    const queryLower = query.toLowerCase();
    let filteredData = [...this.equipmentData];

    // Filter by equipment type
    if (queryLower.includes("turbine")) {
      filteredData = filteredData.filter((eq) =>
        eq.equipment.toLowerCase().includes("turbine")
      );
    } else if (queryLower.includes("compressor")) {
      filteredData = filteredData.filter((eq) =>
        eq.equipment.toLowerCase().includes("compressor")
      );
    } else if (queryLower.includes("pump")) {
      filteredData = filteredData.filter((eq) =>
        eq.equipment.toLowerCase().includes("pump")
      );
    }

    // Filter by location
    const locations = [
      "atlanta",
      "chicago",
      "san francisco",
      "new york",
      "houston",
    ];
    const mentionedLocation = locations.find((loc) => queryLower.includes(loc));
    if (mentionedLocation) {
      filteredData = filteredData.filter((eq) =>
        eq.location.toLowerCase().includes(mentionedLocation)
      );
    }

    // Filter by risk level
    if (queryLower.includes("high risk")) {
      filteredData = filteredData.filter((eq) => eq.risk_score > 0.7);
    } else if (queryLower.includes("medium risk")) {
      filteredData = filteredData.filter(
        (eq) => eq.risk_score > 0.5 && eq.risk_score <= 0.7
      );
    }

    // Filter by faulty equipment
    if (queryLower.includes("faulty") || queryLower.includes("failed")) {
      filteredData = filteredData.filter((eq) => eq.faulty === 1);
    }

    return filteredData.slice(0, 50); // Return max 50 records for context
  }

  // Health check method
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/models`, {
        headers: { 
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000'
        },
        timeout: 10000,
      });
      return { connected: true, models: response.data };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
}

module.exports = new DeepSeekService();