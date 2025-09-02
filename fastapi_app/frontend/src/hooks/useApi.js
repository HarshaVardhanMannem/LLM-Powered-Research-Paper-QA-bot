// src/hooks/useApi.js
import { useCallback } from 'react'
import axios from 'axios'

export const useApi = (baseUrl, showSnackbar) => {
  const checkHealth = useCallback(async () => {
    const response = await axios.get(`${baseUrl}/`)
    return response.data
  }, [baseUrl])

  const fetchPapers = useCallback(async () => {
    const response = await axios.get(`${baseUrl}/papers`)
    return response.data.papers
  }, [baseUrl])

  const fetchFeedbackStats = useCallback(async () => {
    const response = await axios.get(`${baseUrl}/feedback/stats`)
    return response.data
  }, [baseUrl])

  const sendMessage = useCallback(async (text) => {
    const response = await axios.post(`${baseUrl}/chat`, { text })
    return response.data
  }, [baseUrl])

  const addPaper = useCallback(async (paperId) => {
    const response = await axios.post(`${baseUrl}/papers/add`, { paper_id: paperId })
    return response.data
  }, [baseUrl])

  const uploadPaper = useCallback(async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await axios.post(`${baseUrl}/papers/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }, [baseUrl])

  const submitFeedback = useCallback(async (question, answer, type) => {
    const response = await axios.post(`${baseUrl}/feedback`, {
      question,
      answer,
      feedback_type: type
    })
    return response.data
  }, [baseUrl])

  return {
    checkHealth,
    fetchPapers,
    fetchFeedbackStats,
    sendMessage,
    addPaper,
    uploadPaper,
    submitFeedback
  }
}
