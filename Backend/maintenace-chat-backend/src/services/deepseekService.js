require('dotenv').config();
const axios = require("axios");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
      console.log('🔑 DeepSeek API Key loaded:', this.apiKey ? 'YES' : 'NO');
  console.log('🔑 API Key starts with:', this.apiKey ? this.apiKey.substring(0, 8) : 'UNDEFINED');
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseURL = "https://api.deepseek.com";
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

      console.log("📊 Loading equipment data for DeepSeek analysis...");
      const workbook = XLSX.readFile(dataPath);
      const sheetName = workbook.SheetNames[0];
      this.equipmentData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // Create a summary for efficient AI context
      this.createEquipmentSummary();

      console.log("✅ Equipment data loaded for DeepSeek:", {
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
      sampleData: this.equipmentData.slice(0, 10), // First 10 records as examples
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
          "DeepSeek API key not configured. Please set DEEPSEEK_API_KEY environment variable."
        );
      }

      if (!this.equipmentData || !this.equipmentSummary) {
        throw new Error(
          "Equipment data not loaded. Please ensure clean_equipment_data.xlsx exists in the data folder."
        );
      }

      console.log("🤖 Sending query to DeepSeek:", userQuery.substring(0, 100));

      // Prepare the system prompt with equipment data context
      const systemPrompt = `You are an expert Industrial Equipment Analyst AI assistant. You have access to comprehensive equipment monitoring data from an industrial facility.

EQUIPMENT DATA SUMMARY:
- Total Equipment: ${this.equipmentSummary.totalEquipment} pieces
- Equipment Types: ${Object.entries(this.equipmentSummary.equipmentTypes)
        .map(([type, count]) => `${type} (${count})`)
        .join(", ")}
- Locations: ${Object.entries(this.equipmentSummary.locations)
        .map(([loc, count]) => `${loc} (${count})`)
        .join(", ")}
- Faulty Equipment: ${this.equipmentSummary.faultyEquipment} pieces
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

SAMPLE DATA STRUCTURE:
${JSON.stringify(this.equipmentSummary.sampleData[0], null, 2)}

CAPABILITIES:
- Analyze equipment performance and failure patterns
- Provide maintenance recommendations
- Calculate risk assessments
- Compare equipment across locations
- Identify trends in sensor data
- Generate actionable insights

INSTRUCTIONS:
- Always base your responses on the actual equipment data provided
- Provide specific numbers, percentages, and concrete recommendations
- When asked about specific equipment, reference the actual data
- Format responses clearly with headers, bullet points, and key metrics
- Include relevant context about risk levels, locations, and equipment types
- Be precise with calculations and data analysis

USER QUERY: "${userQuery}"

Please analyze this query using the equipment data and provide a comprehensive, data-driven response.`;

      // Prepare conversation history
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationContext,
        { role: "user", content: userQuery },
      ];

      // Call DeepSeek API
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: "deepseek-chat",
          messages: messages,
          temperature: 0.3,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const aiResponse = response.data.choices[0].message.content;

      console.log("✅ DeepSeek response received, length:", aiResponse.length);

      return {
        success: true,
        response: aiResponse,
        usage: response.data.usage,
        dataSource: `${this.equipmentSummary.totalEquipment} equipment records`,
      };
    } catch (error) {
    console.error('❌ EXACT DeepSeek error response:', JSON.stringify(error.response?.data, null, 2));
  console.error('❌ DeepSeek error status:', error.response?.status);
  console.error('❌ DeepSeek error message:', error.message);
  
      console.error(
        "❌ DeepSeek API error:",
        error.response?.data || error.message
      );

      if (error.response?.status === 401) {
        throw new Error(
          "DeepSeek API authentication failed. Please check your API key."
        );
      } else if (error.response?.status === 429) {
        throw new Error(
          "DeepSeek API rate limit exceeded. Please try again later."
        );
      } else if (error.code === "ECONNABORTED") {
        throw new Error("DeepSeek API request timeout. Please try again.");
      }

      throw new Error(`DeepSeek API error: ${error.message}`);
    }
  }

  async testAPIConnection() {
  try {
    console.log('🧪 Testing DeepSeek API connection...');
    console.log('🧪 Using API Key:', this.apiKey.substring(0, 10) + '...');
    console.log('🧪 Using URL:', this.baseURL);
    
    const response = await axios.post(`${this.baseURL}/chat/completions`, {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ API test successful:', response.status);
    return true;
  } catch (error) {
    console.error('❌ API test failed:', error.response?.status, error.response?.data);
    return false;
  }
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
        headers: { Authorization: `Bearer ${this.apiKey}` },
        timeout: 10000,
      });
      return { connected: true, models: response.data };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
}

module.exports = new DeepSeekService();
