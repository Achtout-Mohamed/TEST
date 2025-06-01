// services/advancedRAGService.js
const axios = require('axios');
const XLSX = require('xlsx');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

class AdvancedRAGService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseURL = 'https://api.deepseek.com/v1';
    this.equipmentKnowledgeBase = [];
    this.documentKnowledgeBase = new Map(); // conversationId -> documents
    this.loadEquipmentData();
  }

  // Load equipment dataset
  async loadEquipmentData() {
    try {
      const filePath = path.join(__dirname, '../data/clean_equipment_data.xlsx');
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Create searchable knowledge base from equipment data
      this.equipmentKnowledgeBase = this.createEquipmentKnowledgeChunks(jsonData);
      console.log(`Loaded ${this.equipmentKnowledgeBase.length} equipment knowledge chunks`);
    } catch (error) {
      console.error('Error loading equipment data:', error);
    }
  }

  // Create searchable chunks from equipment data
  createEquipmentKnowledgeChunks(data) {
    const chunks = [];
    
    // Summary statistics chunks
    const equipmentTypes = [...new Set(data.map(r => r.equipment))];
    const locations = [...new Set(data.map(r => r.location))];
    
    equipmentTypes.forEach(type => {
      const typeData = data.filter(r => r.equipment === type);
      const faultyCount = typeData.filter(r => r.faulty === 1).length;
      const avgRisk = (typeData.reduce((sum, r) => sum + r.risk_score, 0) / typeData.length).toFixed(3);
      
      chunks.push({
        type: 'equipment_summary',
        content: `${type} Equipment Summary: Total units: ${typeData.length}, Faulty units: ${faultyCount}, Average risk score: ${avgRisk}. Located across ${[...new Set(typeData.map(r => r.location))].join(', ')}.`,
        metadata: { equipment: type, totalUnits: typeData.length, faultyCount, avgRisk }
      });
    });

    // Location-based chunks
    locations.forEach(location => {
      const locationData = data.filter(r => r.location === location);
      const equipmentBreakdown = {};
      locationData.forEach(r => {
        equipmentBreakdown[r.equipment] = (equipmentBreakdown[r.equipment] || 0) + 1;
      });
      
      chunks.push({
        type: 'location_summary',
        content: `${location} Location Analysis: ${locationData.length} total units. Equipment breakdown: ${Object.entries(equipmentBreakdown).map(([eq, count]) => `${eq}: ${count}`).join(', ')}. Faulty equipment: ${locationData.filter(r => r.faulty === 1).length} units.`,
        metadata: { location, totalUnits: locationData.length, equipmentBreakdown }
      });
    });

    // Risk analysis chunks
    const highRiskUnits = data.filter(r => r.risk_score > 0.7);
    const mediumRiskUnits = data.filter(r => r.risk_score >= 0.3 && r.risk_score <= 0.7);
    const lowRiskUnits = data.filter(r => r.risk_score < 0.3);

    chunks.push({
      type: 'risk_analysis',
      content: `Risk Assessment Overview: High risk (>0.7): ${highRiskUnits.length} units, Medium risk (0.3-0.7): ${mediumRiskUnits.length} units, Low risk (<0.3): ${lowRiskUnits.length} units. High-risk equipment requires immediate attention.`,
      metadata: { highRisk: highRiskUnits.length, mediumRisk: mediumRiskUnits.length, lowRisk: lowRiskUnits.length }
    });

    // Sensor analysis chunks
    ['temperature', 'pressure', 'vibration', 'humidity'].forEach(sensor => {
      const values = data.map(r => r[sensor]).filter(v => v != null);
      const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
      const min = Math.min(...values).toFixed(2);
      const max = Math.max(...values).toFixed(2);
      const alertCount = data.filter(r => r[`high_${sensor}`] === 1).length;

      chunks.push({
        type: 'sensor_analysis',
        content: `${sensor.charAt(0).toUpperCase() + sensor.slice(1)} Sensor Analysis: Average reading: ${avg}, Range: ${min} to ${max}, High ${sensor} alerts: ${alertCount} units. Normal operating ranges and alert thresholds are being monitored.`,
        metadata: { sensor, average: avg, min, max, alertCount }
      });
    });

    // Individual equipment records for detailed queries
    data.forEach((record, index) => {
      if (record.faulty === 1 || record.risk_score > 0.6) { // Only include problematic equipment
        chunks.push({
          type: 'equipment_record',
          content: `${record.equipment} unit in ${record.location}: Temperature: ${record.temperature.toFixed(1)}°C, Pressure: ${record.pressure.toFixed(1)} bar, Vibration: ${record.vibration.toFixed(2)} Hz, Humidity: ${record.humidity.toFixed(1)}%. Risk score: ${record.risk_score.toFixed(3)}. Status: ${record.faulty ? 'FAULTY' : 'Operational'}.`,
          metadata: { ...record, recordIndex: index }
        });
      }
    });

    return chunks;
  }

  // Process uploaded document
  async processUploadedDocument(filePath, filename, conversationId) {
    try {
      let content = '';
      const fileExtension = path.extname(filename).toLowerCase();

      switch (fileExtension) {
        case '.pdf':
          const pdfBuffer = fs.readFileSync(filePath);
          const pdfData = await pdf(pdfBuffer);
          content = pdfData.text;
          break;

        case '.docx':
          const docxResult = await mammoth.extractRawText({ path: filePath });
          content = docxResult.value;
          break;

        case '.txt':
          content = fs.readFileSync(filePath, 'utf8');
          break;

        case '.xlsx':
        case '.xls':
          const workbook = XLSX.readFile(filePath);
          const sheets = workbook.SheetNames;
          let excelContent = '';
          sheets.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            excelContent += `Sheet: ${sheetName}\n`;
            jsonData.forEach(row => {
              excelContent += row.join('\t') + '\n';
            });
          });
          content = excelContent;
          break;

        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // Create document chunks
      const chunks = this.createDocumentChunks(content, filename);
      
      // Store in conversation-specific knowledge base
      if (!this.documentKnowledgeBase.has(conversationId)) {
        this.documentKnowledgeBase.set(conversationId, []);
      }
      
      this.documentKnowledgeBase.get(conversationId).push({
        filename,
        content,
        chunks,
        uploadedAt: new Date()
      });

      return {
        success: true,
        filename,
        chunks: chunks.length,
        contentLength: content.length
      };
    } catch (error) {
      console.error('Document processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create searchable chunks from document content
  createDocumentChunks(content, filename) {
    const chunks = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Create overlapping chunks of ~500 characters
    const chunkSize = 500;
    const overlap = 100;
    
    for (let i = 0; i < sentences.length; i++) {
      let chunk = sentences[i];
      let charCount = chunk.length;
      let sentenceIndex = i + 1;
      
      // Add more sentences until we reach chunk size
      while (sentenceIndex < sentences.length && charCount < chunkSize) {
        chunk += '. ' + sentences[sentenceIndex];
        charCount += sentences[sentenceIndex].length + 2;
        sentenceIndex++;
      }
      
      if (chunk.trim().length > 50) {
        chunks.push({
          type: 'document_content',
          content: chunk.trim(),
          metadata: {
            filename,
            chunkIndex: chunks.length,
            startSentence: i,
            endSentence: sentenceIndex - 1
          }
        });
      }
      
      // Skip ahead by chunk size minus overlap
      i = Math.max(i, sentenceIndex - Math.floor(overlap / 50));
    }

    return chunks;
  }

  // Semantic search in knowledge bases
  searchKnowledgeBases(query, conversationId) {
    const results = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    // Search equipment knowledge base
    this.equipmentKnowledgeBase.forEach(chunk => {
      let score = 0;
      const contentLower = chunk.content.toLowerCase();
      
      // Exact phrase matches
      if (contentLower.includes(queryLower)) score += 10;
      
      // Word matches
      queryWords.forEach(word => {
        if (contentLower.includes(word)) score += 1;
      });
      
      // Metadata matches
      if (chunk.metadata) {
        Object.values(chunk.metadata).forEach(value => {
          if (String(value).toLowerCase().includes(queryLower)) score += 5;
        });
      }
      
      if (score > 0) {
        results.push({ ...chunk, score, source: 'equipment_data' });
      }
    });

    // Search conversation documents
    if (this.documentKnowledgeBase.has(conversationId)) {
      const conversationDocs = this.documentKnowledgeBase.get(conversationId);
      
      conversationDocs.forEach(doc => {
        doc.chunks.forEach(chunk => {
          let score = 0;
          const contentLower = chunk.content.toLowerCase();
          
          if (contentLower.includes(queryLower)) score += 10;
          
          queryWords.forEach(word => {
            if (contentLower.includes(word)) score += 1;
          });
          
          if (score > 0) {
            results.push({ 
              ...chunk, 
              score, 
              source: 'uploaded_document',
              filename: doc.filename 
            });
          }
        });
      });
    }

    // Sort by relevance score and return top results
    return results.sort((a, b) => b.score - a.score).slice(0, 15);
  }

  // Generate comprehensive AI response
  async generateResponse(query, conversationId) {
    try {
      // Search both knowledge bases
      const relevantChunks = this.searchKnowledgeBases(query, conversationId);
      
      // Build context from relevant information
      let context = "KNOWLEDGE BASE:\n\n";
      
      const equipmentChunks = relevantChunks.filter(c => c.source === 'equipment_data');
      const documentChunks = relevantChunks.filter(c => c.source === 'uploaded_document');
      
      if (equipmentChunks.length > 0) {
        context += "EQUIPMENT DATA:\n";
        equipmentChunks.forEach((chunk, i) => {
          context += `${i + 1}. ${chunk.content}\n`;
        });
        context += "\n";
      }
      
      if (documentChunks.length > 0) {
        context += "UPLOADED DOCUMENTS:\n";
        const docGroups = {};
        documentChunks.forEach(chunk => {
          if (!docGroups[chunk.filename]) docGroups[chunk.filename] = [];
          docGroups[chunk.filename].push(chunk.content);
        });
        
        Object.entries(docGroups).forEach(([filename, contents]) => {
          context += `From ${filename}:\n`;
          contents.forEach((content, i) => {
            context += `${i + 1}. ${content}\n`;
          });
          context += "\n";
        });
      }

      // Create comprehensive system prompt
      const systemPrompt = `You are an advanced AI assistant with access to both equipment monitoring data and user-uploaded documents. 

Your capabilities:
- Analyze industrial equipment data (turbines, compressors, pumps)
- Process and understand uploaded documents (PDFs, Word docs, Excel files, etc.)
- Combine information from multiple sources
- Provide detailed technical analysis and recommendations
- Answer any question using available knowledge

Guidelines:
- Use ALL available information to provide comprehensive answers
- Cross-reference equipment data with uploaded documents when relevant
- Be specific and cite your sources (equipment data vs uploaded documents)
- If information is missing, clearly state what you don't know
- Provide actionable insights and recommendations
- Handle any topic - not just equipment (the user may ask about anything in their documents)

${context}`;

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        response: response.data.choices[0].message.content,
        sources: {
          equipmentChunks: equipmentChunks.length,
          documentChunks: documentChunks.length,
          totalSources: relevantChunks.length
        },
        success: true
      };
    } catch (error) {
      console.error('AI Response error:', error);
      
      // Fallback with available data
      const relevantChunks = this.searchKnowledgeBases(query, conversationId);
      let fallbackResponse = "Based on available data:\n\n";
      
      relevantChunks.slice(0, 5).forEach((chunk, i) => {
        fallbackResponse += `${i + 1}. ${chunk.content}\n\n`;
      });
      
      if (relevantChunks.length === 0) {
        fallbackResponse = "I don't have enough relevant information to answer your question. Please upload relevant documents or ask about equipment monitoring data.";
      }
      
      return {
        response: fallbackResponse,
        sources: { equipmentChunks: 0, documentChunks: 0, totalSources: relevantChunks.length },
        success: false,
        error: 'AI service temporarily unavailable'
      };
    }
  }

  // Get conversation document list
  getConversationDocuments(conversationId) {
    if (!this.documentKnowledgeBase.has(conversationId)) {
      return [];
    }
    
    return this.documentKnowledgeBase.get(conversationId).map(doc => ({
      filename: doc.filename,
      uploadedAt: doc.uploadedAt,
      chunks: doc.chunks.length,
      contentLength: doc.content.length
    }));
  }

  // Clear conversation documents
  clearConversationDocuments(conversationId) {
    this.documentKnowledgeBase.delete(conversationId);
  }
}

module.exports = new AdvancedRAGService();