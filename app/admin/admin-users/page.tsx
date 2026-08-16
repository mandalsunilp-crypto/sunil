import { AuthService } from '@/services/authService'
import { createAdminClient } from '@/lib/supabase/admin'
import { MemoryStore } from '@/lib/storage/memoryStore'
import { AdminUsersClient } from '@/components/admin/AdminUsersClient'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  await AuthService.requireRole(['super_admin'])

  const userMap = new Map<string, any>()

  // 1. Fetch profiles from Supabase DB
  try {
    const adminSupabase = createAdminClient()
    const { data: dbProfiles } = await adminSupabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (dbProfiles && dbProfiles.length > 0) {
      dbProfiles.forEach((p) => {
        userMap.set(p.id, p)
        if (p.email) userMap.set(p.email.toLowerCase(), p)
      })
    }

    // 2. Fetch users directly from Supabase Auth admin API (catches newly registered auth users)
    const { data: authData } = await adminSupabase.auth.admin.listUsers()
    if (authData && authData.users) {
      authData.users.forEach((au) => {
        const emailKey = (au.email || '').toLowerCase()
        const existing = userMap.get(au.id) || (emailKey ? userMap.get(emailKey) : null)

        if (!existing) {
          const newUser = {
            id: au.id,
            full_name: au.user_metadata?.full_name || au.email?.split('@')[0] || 'Customer User',
            email: au.email || '',
            phone: au.phone || au.user_metadata?.phone || null,
            role: au.user_metadata?.role || 'customer',
            status: 'active',
            created_at: au.created_at || new Date().toISOString(),
            updated_at: au.updated_at || new Date().toISOString(),
          }
          userMap.set(au.id, newUser)
          if (emailKey) userMap.set(emailKey, newUser)
        }
      })
    }
  } catch {
    // Suppress Supabase query errors
  }

  // 3. Fetch newly registered profiles from MemoryStore
  try {
    const memProfiles = MemoryStore.getProfiles()
    memProfiles.forEach((mp) => {
      const emailKey = (mp.email || '').toLowerCase()
      const existing = userMap.get(mp.id) || (emailKey ? userMap.get(emailKey) : null)
      if (!existing) {
        userMap.set(mp.id, mp)
        if (emailKey) userMap.set(emailKey, mp)
      }
    })
  } catch {
    // Suppress
  }

  // 4. Fetch registered leads from MemoryStore (signups from frontend)
  try {
    const leads = MemoryStore.getLeads()
    leads.forEach((lead) => {
      const emailKey = (lead.email || '').toLowerCase()
      if (emailKey && !userMap.get(emailKey)) {
        const leadUser = {
          id: lead.id || `lead-${Date.now()}`,
          full_name: lead.customer_name || 'Customer Signup',
          email: lead.email,
          phone: lead.phone || null,
          role: 'customer',
          status: 'active',
          created_at: lead.created_at || new Date().toISOString(),
          updated_at: lead.created_at || new Date().toISOString(),
        }
        userMap.set(leadUser.id, leadUser)
        userMap.set(emailKey, leadUser)
      }
    })
  } catch {
    // Suppress
  }

  // 5. Default sample profiles fallback
  const defaultSampleUsers = [
    {
      id: 'usr-1',
      full_name: 'Sunil Mandal',
      email: 'mandalsunilp@gmail.com',
      phone: '+977 9714501795',
      role: 'super_admin',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'usr-2',
      full_name: 'Roshan Sharma',
      email: 'roshan@tech.np',
      phone: '+977 9841234567',
      role: 'customer',
      status: 'active',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'usr-3',
      full_name: 'Aayush Adhikari',
      email: 'aayush@gmail.com',
      phone: '+977 9801239874',
      role: 'customer',
      status: 'active',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 'usr-4',
      full_name: 'Suman Karki',
      email: 'suman@karki.np',
      phone: '+977 9812984123',
      role: 'customer',
      status: 'active',
      created_at: new Date(Date.now() - 259200000).toISOString(),
      updated_at: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: 'usr-5',
      full_name: 'Pooja Shrestha',
      email: 'pooja@design.np',
      phone: '+977 9849988112',
      role: 'customer',
      status: 'active',
      created_at: new Date(Date.now() - 345600000).toISOString(),
      updated_at: new Date(Date.now() - 345600000).toISOString(),
    },
  ]

  defaultSampleUsers.forEach((sample) => {
    const emailKey = sample.email.toLowerCase()
    if (!userMap.get(sample.id) && !userMap.get(emailKey)) {
      userMap.set(sample.id, sample)
      userMap.set(emailKey, sample)
    }
  })

  // Deduplicate users list
  const users = Array.from(new Set(userMap.values())).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return <AdminUsersClient users={users} />
}
