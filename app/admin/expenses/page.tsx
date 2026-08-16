import { AuthService } from '@/services/authService'
import { ExpenseRepository } from '@/repositories/expenseRepository'
import { ExpensesClient } from '@/components/admin/ExpensesClient'

export const dynamic = 'force-dynamic'

export default async function AdminExpensesPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance'])

  const expenses = await ExpenseRepository.getAllAdmin()

  return <ExpensesClient initialExpenses={expenses} />
}
