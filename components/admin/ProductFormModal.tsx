'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Product } from '@/repositories/productRepository'
import { createProductAction, updateProductAction } from '@/features/products/actions'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { X, Plus, Sparkles, Image, Tag, Zap, Check } from 'lucide-react'

// Popular AI Tool Presets for 1-Click Fast Configuration
const AI_PRESETS = [
  {
    name: 'ChatGPT Plus & Pro',
    slug: 'chatgpt-plus',
    tagline: 'Access GPT-4o, OpenAI o1 Reasoning, and Canvas',
    category: 'AI Assistants',
    image_url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=80',
    features: ['GPT-4o & o1 Reasoning Models', 'DALL·E 3 Image Generation', 'Custom GPTs & Memory', '30 Days Guaranteed Warranty'],
  },
  {
    name: 'Claude 3.7 Pro',
    slug: 'claude-pro',
    tagline: 'Anthropic Claude 3.7 Sonnet & Extended Thinking',
    category: 'AI Assistants',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    features: ['Claude 3.7 Sonnet Hybrid Model', 'Extended Thinking & Code Artifacts', '5x Higher Usage Limits', '30 Days Guaranteed Warranty'],
  },
  {
    name: 'Cursor AI Pro',
    slug: 'cursor-pro',
    tagline: 'The AI-First Code Editor with Claude 3.7 & GPT-4o',
    category: 'Developer Tools',
    image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    features: ['500 Fast Premium AI Requests', 'Unlimited Slow Requests', 'Full Codebase Indexing & Agent Mode', '30 Days Instant Replacement'],
  },
  {
    name: 'Canva Pro Yearly / Lifetime',
    slug: 'canva-pro',
    tagline: 'Unlimited premium templates, brand kit & Magic AI',
    category: 'Design & Creative',
    image_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80',
    features: ['100M+ Premium Stock Photos & Videos', 'Magic Studio AI Tools', 'Unlimited Brand Kits & Resizing', 'Instant Team Invite Activation'],
  },
  {
    name: 'Midjourney Mega / Pro',
    slug: 'midjourney-pro',
    tagline: 'State of the art photorealistic AI image synthesis',
    category: 'Design & Creative',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    features: ['Fast GPU Time', 'Unlimited Relax Generations', 'Stealth Mode Available', 'General Commercial Terms'],
  },
  {
    name: 'Perplexity Pro',
    slug: 'perplexity-pro',
    tagline: 'AI Search Engine with Claude 3.7, GPT-4o & Sonar',
    category: 'AI Assistants',
    image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80',
    features: ['Unlimited Pro Searches', 'Claude 3.7 & GPT-4o Model Selection', 'Document Analysis & File Uploads', '30 Days Guaranteed Warranty'],
  },
  {
    name: 'GitHub Copilot Business',
    slug: 'github-copilot',
    tagline: 'AI Pair Programmer for Visual Studio Code & JetBrains',
    category: 'Developer Tools',
    image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    features: ['Context-aware code completions', 'Copilot Chat in IDE', 'Multi-file code refactoring', '30 Days Instant Warranty'],
  },
  {
    name: 'ElevenLabs Voice AI',
    slug: 'elevenlabs-pro',
    tagline: 'Realistic AI Voice Cloning & Text-to-Speech Engine',
    category: 'Design & Creative',
    image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    features: ['100,000 Characters / Month', 'Instant Voice Cloning', 'Commercial License Included', 'Full Warranty Guarantee'],
  },
]

export function ProductFormModal({
  product,
  onClose,
  onSuccess,
}: {
  product?: Product | null
  onClose: () => void
  onSuccess: () => void
}) {
  const isEditing = Boolean(product)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // Form State
  const [name, setName] = useState(product?.name || '')
  const [slug, setSlug] = useState(product?.slug || '')
  const [tagline, setTagline] = useState((product as any)?.tagline || '')
  const [category, setCategory] = useState(product?.category || 'AI Assistants')
  const [description, setDescription] = useState(product?.description || '')
  const [imageUrl, setImageUrl] = useState(product?.image_url || '')
  const [features, setFeatures] = useState(
    Array.isArray(product?.features) ? (product.features as string[]).join('\n') : ''
  )
  const [isFeatured, setIsFeatured] = useState(Boolean((product as any)?.is_featured))
  const [status, setStatus] = useState(product?.status || 'active')

  function applyPreset(preset: typeof AI_PRESETS[0]) {
    setName(preset.name)
    setSlug(preset.slug)
    setTagline(preset.tagline)
    setCategory(preset.category)
    setDescription(`Official ${preset.name} subscription in Nepal with instant local payment and 100% replacement warranty guarantee.`)
    setImageUrl(preset.image_url)
    setFeatures(preset.features.join('\n'))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setFieldErrors({})

    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('slug', slug.trim())
    formData.append('tagline', tagline.trim())
    formData.append('category', category.trim())
    formData.append('description', description.trim())
    formData.append('image_url', imageUrl.trim())
    formData.append('features', features)
    formData.append('is_featured', isFeatured ? 'true' : 'false')
    formData.append('status', status)

    let result
    if (isEditing && product) {
      result = await updateProductAction(product.id, formData)
    } else {
      result = await createProductAction(formData)
    }

    setIsLoading(false)
    if (!result.success) {
      setErrorMessage(result.message || 'Operation failed.')
      if (result.errors) {
        setFieldErrors(result.errors)
      }
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Edit AI Tool Product' : 'Add New AI Subscription Product'}
              </h3>
              <p className="text-xs text-neutral-400">Configure public catalog details, pricing categories, and warranty terms.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click AI Presets (Only when creating new product) */}
        {!isEditing && (
          <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <span className="text-[11px] font-semibold text-purple-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              1-Click Fast Fill Preset Templates:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {AI_PRESETS.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-purple-600 hover:text-white border border-neutral-700/60 text-[11px] text-neutral-300 transition-colors font-medium"
                >
                  + {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {errorMessage && (
          <Alert variant="error" title="Error">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Product Title *"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!isEditing && !slug) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                }
              }}
              placeholder="e.g. ChatGPT Plus & Pro"
              required
              error={fieldErrors.name?.[0]}
            />

            <Input
              label="URL Slug *"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. chatgpt-plus"
              required
              helperText="Used in public link: /products/[slug]"
              error={fieldErrors.slug?.[0]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="AI Assistants">AI Assistants (ChatGPT, Claude, Perplexity)</option>
                <option value="Developer Tools">Developer Tools (Cursor, GitHub Copilot, v0)</option>
                <option value="Design & Creative">Design & Creative (Midjourney, Canva, Runway)</option>
                <option value="Audio & Video">Audio & Video (ElevenLabs, Sora, Suno)</option>
                <option value="Productivity & Office">Productivity & Office (Notion AI, Office 365)</option>
                <option value="Writing & Research">Writing & Research (Grammarly, Jasper, Quillbot)</option>
              </select>
            </div>

            <Input
              label="Tagline / Short Hook"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. GPT-4o, OpenAI o1 Reasoning, and Canvas access"
            />
          </div>

          <div className="space-y-3">
            <ImageUploader
              label="Product Banner / Logo (Upload from Local Device)"
              value={imageUrl}
              onChange={(url) => setImageUrl(url)}
              helperText="Upload any photo/screenshot from your computer or phone"
            />
            
            <Input
              label="Or Direct Image URL"
              value={imageUrl.startsWith('data:') ? 'Photo loaded from local device' : imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              disabled={imageUrl.startsWith('data:')}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">Product Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe access methods, capabilities, and setup..."
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">
              Key Features & Benefits (One feature per line)
            </label>
            <textarea
              rows={3}
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="GPT-4o with unlimited reasoning&#10;DALL-E 3 Image Generation&#10;30 Days Guaranteed Warranty"
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="active">Active (Visible in Store)</option>
                <option value="inactive">Inactive (Hidden)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-200">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded bg-neutral-900 border-neutral-800 text-purple-600 focus:ring-0"
                />
                <span>Featured Product on Homepage</span>
              </label>
            </div>
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
              className="bg-purple-600 hover:bg-purple-500 font-semibold"
            >
              {isEditing ? 'Update Product' : 'Create AI Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
