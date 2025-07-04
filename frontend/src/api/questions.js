import axios from "axios";

export async function updateQuestion(question) {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/update-question`, { question });
    return response.data;
  } catch (error) {
    throw new Error('Failed to update question');
  }
}
