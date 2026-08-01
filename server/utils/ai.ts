import { createError } from 'h3'
import { prisma } from './db'
import crypto from 'node:crypto'

// Retry delay mechanism
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

/**
 * Validates AI settings from the database and returns the API key.
 */
export async function getGeminiSettings(): Promise<{ apiKey: string; systemPrompt: string | null }> {
  const setting = await prisma.schoolSetting.findFirst()
  
  if (!setting || !setting.aiEnabled) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Integrasi AI sedang dinonaktifkan. Silakan aktifkan di menu Pengaturan.'
    })
  }

  if (!setting.geminiApiKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Gemini API Key belum dikonfigurasi. Silakan lengkapi di menu Pengaturan.'
    })
  }

  return {
    apiKey: setting.geminiApiKey,
    systemPrompt: setting.aiSystemPrompt || null
  }
}

/**
 * Calls Gemini API with exponential backoff retry logic.
 */
export async function callGeminiApi(prompt: string, maxRetries = 2): Promise<string> {
  const { apiKey, systemPrompt } = await getGeminiSettings()
  
  // Gunakan header X-goog-api-key sesuai dengan format token pengguna
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`
  
  const payload: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json' // Request JSON explicitly
    }
  }

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }]
    }
  }

  let attempt = 0
  let lastError = null

  while (attempt <= maxRetries) {
    try {
      const response = await $fetch<any>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        },
        body: payload
      })

      if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.candidates[0].content.parts[0].text
      }
      
      throw new Error('Invalid response structure from Gemini API')
    } catch (error: any) {
      lastError = error
      console.error(`Gemini API Error (Attempt ${attempt + 1}):`, error?.data || error?.message)
      
      if (error?.status === 400 || error?.status === 403) {
        // Bad request or unauthorized, don't retry
        throw createError({
          statusCode: 500,
          statusMessage: 'Gagal menghubungi Gemini API. Periksa kembali API Key Anda.'
        })
      }
      
      attempt++
      if (attempt <= maxRetries) {
        await delay(1000 * Math.pow(2, attempt)) // 2s, 4s...
      }
    }
  }

  throw createError({
    statusCode: 500,
    statusMessage: 'Gagal mendapatkan analisis dari AI setelah beberapa percobaan.'
  })
}

/**
 * Generates an MD5 hash for a given object to detect data changes
 */
export function generateDataHash(data: any): string {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')
}
