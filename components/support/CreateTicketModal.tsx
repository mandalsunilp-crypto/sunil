'use client'

import React, { useState } from 'react'
import { createTicketAction } from '@/features/support/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { ImageUploader } from '@/components/ui/ImageUploader'
import {
  X,
  LifeBuoy,
  Send,
  MessageSquare,
  AlertCircle,
  Paperclip,
} from 'lucide-react'

export function CreateTicketModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('account')
  const [priority, setPriority] = useState('medium')
  const [message, setMessage] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    if (!subject.trim() || !message.trim()) {
      setErrorMessage('Please fill in both the ticket subject and message.')
      setIsLoading(false)
      return
    }

    const formData = new FormData()
    formData.append('subject', subject.trim())
    formData.append('category', category)
    formData.append('priority', priority)
    formData.append('message', message.trim())
    if (attachmentUrl) {
      formData.append('attachment_url', attachmentUrl)
    }

    const result = await createTicketAction(formData)
    setIsLoading(false)

    if (!result.success) {
      setErrorMessage(result.message || 'Failed to submit ticket.')
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Support Ticket</h3>
              <p className="text-xs text-neutral-400">
                Our support team is available 24/7 in Nepal to assist you.
              </p>
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
            label="Ticket Subject *"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Need assistance setting up Claude 3.7 API key"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="account">Account & Credentials</option>
                <option value="technical">Technical Support</option>
                <option value="billing">Billing & Invoices</option>
                <option value="warranty">Warranty & Replacement</option>
                <option value="other">General Inquiry</option>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="low">Low (General question)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="high">High (Urgent access need)</option>
                <option value="urgent">Critical / System Down</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">Message / Issue Details *</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what you need help with in detail..."
              required
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Screenshot / Photo Attachment from Device */}
          <div className="space-y-2">
            <ImageUploader
              label="Attach Screenshot / Photo (Optional)"
              value={attachmentUrl}
              onChange={(url) => setAttachmentUrl(url)}
              helperText="Upload any screenshot or proof from your device"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="bg-blue-600 hover:bg-blue-500 font-semibold"
            >
              <Send className="w-4 h-4 mr-1.5" />
              <span>Submit Ticket</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
