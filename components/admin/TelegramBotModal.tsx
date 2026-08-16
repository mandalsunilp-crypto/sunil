'use client'

import React, { useState } from 'react'
import { addTelegramBotAction } from '@/features/telegram/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { X, Send, Bot, Key, Link as LinkIcon } from 'lucide-react'

export function TelegramBotModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [botUsername, setBotUsername] = useState('')
  const [channelUrl, setChannelUrl] = useState('')
  const [apiToken, setApiToken] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('botUsername', botUsername.trim())
    formData.append('channelUrl', channelUrl.trim())
    formData.append('apiToken', apiToken.trim())

    const res = await addTelegramBotAction(formData)
    setIsLoading(false)

    if (!res.success) {
      setErrorMessage(res.message || 'Failed to add bot.')
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Telegram Supplier Bot</h3>
              <p className="text-xs text-neutral-400">Prices auto-sync directly from the API Key.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <Alert variant="error" title="Error">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Bot / Supplier Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. AI Key Wholesaler"
            required
          />

          <Input
            label="Telegram Handle / Username *"
            value={botUsername}
            onChange={(e) => setBotUsername(e.target.value)}
            placeholder="e.g. @AI_Wholesale_Bot"
            required
          />

          <Input
            label="API Key / Token *"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="tg_bot_token_8912..."
            required
          />

          <Input
            label="Channel / Contact Link (Optional)"
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder="https://t.me/your_channel"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="bg-cyan-600 hover:bg-cyan-500 font-semibold text-white"
            >
              <Send className="w-4 h-4 mr-1.5" />
              <span>Add Bot & Sync Prices</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
