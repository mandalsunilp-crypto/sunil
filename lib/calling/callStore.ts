'use client'

/**
 * Real-time Call Store & Broadcast Channel Manager
 * Syncs online internet calls between Customer tabs and Admin Panel tabs in real time.
 */

export interface ActiveCallState {
  id: string
  callerName: string
  callerPhone: string
  callerRole: 'customer' | 'admin'
  status: 'ringing' | 'connected' | 'ended' | 'declined'
  startedAt: string
  direction: 'incoming_to_admin' | 'outgoing_to_customer'
}

class CallStoreManager {
  private listeners: Set<(call: ActiveCallState | null) => void> = new Set()
  private currentCall: ActiveCallState | null = null
  private channel: BroadcastChannel | null = null

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('vh_online_calls')
      this.channel.onmessage = (event) => {
        if (event.data) {
          this.currentCall = event.data.call
          this.notifyListeners()
        }
      }
    }
  }

  public getCall(): ActiveCallState | null {
    return this.currentCall
  }

  public subscribe(callback: (call: ActiveCallState | null) => void): () => void {
    this.listeners.add(callback)
    callback(this.currentCall)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.currentCall))
  }

  private broadcast(call: ActiveCallState | null) {
    this.currentCall = call
    this.notifyListeners()
    if (this.channel) {
      this.channel.postMessage({ call })
    }
  }

  /** Customer initiates call to Admin */
  public initiateCustomerCall(name: string, phone: string) {
    const call: ActiveCallState = {
      id: `call-${Date.now()}`,
      callerName: name || 'Online Customer',
      callerPhone: phone || '+977 9800000000',
      callerRole: 'customer',
      status: 'ringing',
      startedAt: new Date().toISOString(),
      direction: 'incoming_to_admin',
    }
    this.broadcast(call)
  }

  /** Admin initiates Call Back to Customer */
  public initiateAdminCallBack(customerName: string, customerPhone: string) {
    const call: ActiveCallState = {
      id: `call-${Date.now()}`,
      callerName: customerName || 'Verified Hub Customer',
      callerPhone: customerPhone || '+977 9800000000',
      callerRole: 'admin',
      status: 'ringing',
      startedAt: new Date().toISOString(),
      direction: 'outgoing_to_customer',
    }
    this.broadcast(call)
  }

  /** Accept call */
  public acceptCall() {
    if (this.currentCall) {
      const updated = { ...this.currentCall, status: 'connected' as const }
      this.broadcast(updated)
    }
  }

  /** Decline / End call */
  public endCall() {
    if (this.currentCall) {
      const updated = { ...this.currentCall, status: 'ended' as const }
      this.broadcast(updated)
      setTimeout(() => {
        this.broadcast(null)
      }, 1000)
    }
  }
}

export const CallStore = new CallStoreManager()
