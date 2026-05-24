// src/hooks/useApi.js
import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export const useApi = (baseUrl, showSnackbar) => {
  const { authAxios } = useAuth()

  const api = useCallback(() => authAxios(), [authAxios])

  const checkHealth = useCallback(async () => {
    const response = await api().get(`${baseUrl}/`)
    return response.data
  }, [baseUrl, api])

  const fetchPapers = useCallback(async () => {
    const response = await api().get(`${baseUrl}/papers`)
    return response.data.papers
  }, [baseUrl, api])

  const fetchFeedbackStats = useCallback(async () => {
    const response = await api().get(`${baseUrl}/feedback/stats`)
    return response.data
  }, [baseUrl, api])

  const sendMessage = useCallback(async (text) => {
    const response = await api().post(`${baseUrl}/chat`, { text })
    return response.data
  }, [baseUrl, api])

  const addPaper = useCallback(async (paperId) => {
    const response = await api().post(`${baseUrl}/papers/add`, { paper_id: paperId })
    return response.data
  }, [baseUrl, api])

  const uploadPaper = useCallback(async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api().post(`${baseUrl}/papers/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }, [baseUrl, api])

  const submitFeedback = useCallback(async (question, answer, type) => {
    const response = await api().post(`${baseUrl}/feedback`, {
      question,
      answer,
      feedback_type: type
    })
    return response.data
  }, [baseUrl, api])

  const fetchConversations = useCallback(async () => {
    const response = await api().get(`${baseUrl}/conversations`)
    return response.data.conversations
  }, [baseUrl, api])

  return {
    checkHealth,
    fetchPapers,
    fetchFeedbackStats,
    sendMessage,
    addPaper,
    uploadPaper,
    submitFeedback,
    fetchConversations
  }
}
