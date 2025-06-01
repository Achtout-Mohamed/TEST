// src/services/searchService.js
// Stub implementation of the search service
const searchService = {
    search: async (query) => {
      // Simulated delay
      await new Promise(resolve => setTimeout(resolve, 500));
      // Return empty results for now
      return { success: true, data: { conversations: [], messages: [] } };
    }
  };
  
  export default searchService;