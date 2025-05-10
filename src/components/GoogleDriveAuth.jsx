// src/components/GoogleDriveAuth.jsx

import React, { useState, useEffect, useCallback } from 'react'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'
import { FaGoogle, FaSpinner } from 'react-icons/fa'
import { AnimatePresence, motion } from 'framer-motion'
import NotificationSound from './NotificationSound'

// ─────────────────────────────────────────────────────────────────────────────
// Environment variables (Vite)
// ─────────────────────────────────────────────────────────────────────────────
const CLIENT_ID      = import.meta.env.VITE_GOOGLE_CLIENT_ID
const API_KEY        = import.meta.env.VITE_GOOGLE_API_KEY
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
const SCOPES         = 'https://www.googleapis.com/auth/drive.readonly'

if (!CLIENT_ID) {
  console.warn('[GoogleDriveAuth] VITE_GOOGLE_CLIENT_ID is not set')
}
if (!API_KEY) {
  console.warn('[GoogleDriveAuth] VITE_GOOGLE_API_KEY is not set')
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers to load and init gapi
// ─────────────────────────────────────────────────────────────────────────────
function loadGapiScript() {
  return new Promise((resolve, reject) => {
    if (window.gapi) return resolve()
    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('gapi script load error'))
    document.body.appendChild(script)
  })
}

function initGapiClient() {
  return new Promise((resolve, reject) => {
    window.gapi.load('client', {
      callback: () => {
        window.gapi.client
          .init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES,
          })
          .then(resolve)
          .catch(err => reject(err))
      },
      onerror: () => reject(new Error('gapi.client load error')),
      timeout: 5000,
      ontimeout: () => reject(new Error('gapi.client load timeout')),
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// React component
// ─────────────────────────────────────────────────────────────────────────────
function GoogleDriveAuthInner() {
  const [loading, setLoading]       = useState(false)
  const [folders, setFolders]       = useState([])
  const [images, setImages]         = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [notify, setNotify]         = useState(false)

  // 1️⃣ OAuth login
  const login = useGoogleLogin({
    flow: 'implicit',
    scope: SCOPES,
    onSuccess: async ({ access_token }) => {
      try {
        setLoading(true)
        // Load & init gapi
        await loadGapiScript()
        await initGapiClient()
        // Authorize gapi requests
        window.gapi.client.setToken({ access_token })
        // List folders
        const resp = await window.gapi.client.drive.files.list({
          q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
          fields: 'files(id,name)',
          pageSize: 100,
        })
        setFolders(resp.result.files || [])
        setShowPicker(true)
      } catch (err) {
        console.error('Drive auth/init error:', err)
      } finally {
        setLoading(false)
      }
    },
    onError: (err) => {
      console.error('Login failed:', err)
      setLoading(false)
    },
  })

  // 2️⃣ Pick folder & list images
  const pickFolder = useCallback(
    async (folderId) => {
      try {
        setLoading(true)
        const resp = await window.gapi.client.drive.files.list({
          q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
          fields: 'files(id,name)',
          pageSize: 100,
        })
        const files = resp.result.files || []
        // Fetch each as blob and create URL
        const blobs = await Promise.all(
          files.map(f =>
            window.gapi.client
              .request({
                path: `/drive/v3/files/${f.id}`,
                method: 'GET',
                params: { alt: 'media' },
                responseType: 'blob',
              })
              .then(r => r.body)
          )
        )
        setImages(
          files.map((f, i) => ({
            id: f.id,
            name: f.name,
            url: URL.createObjectURL(blobs[i]),
          }))
        )
        setShowPicker(false)
        setNotify(true)
      } catch (err) {
        console.error('Error fetching images:', err)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // 3️⃣ Auto-hide notification
  useEffect(() => {
    if (notify) {
      const t = setTimeout(() => setNotify(false), 3000)
      return () => clearTimeout(t)
    }
  }, [notify])

  return (
    <div className="p-4">
      {!showPicker ? (
        <button
          onClick={() => login()}
          className="px-4 py-2 bg-red-600 text-white rounded flex items-center gap-2"
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaGoogle />}
          {loading ? 'Loading…' : 'Connect Google Drive'}
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2 mt-4"
          >
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => pickFolder(f.id)}
                className="block w-full text-left px-3 py-2 bg-gray-200 rounded"
              >
                {f.name}
              </button>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {images.map(img => (
          <img
            key={img.id}
            src={img.url}
            alt={img.name}
            className="w-full h-auto object-cover rounded"
          />
        ))}
      </div>

      {notify && (
        <NotificationSound
          volume={0.5}
          onComplete={() => setNotify(false)}
        />
      )}
    </div>
  )
}

export default function GoogleDriveAuth() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <GoogleDriveAuthInner />
    </GoogleOAuthProvider>
  )
}
