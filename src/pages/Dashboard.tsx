
import { useEffect, useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, Tooltip, Legend } from 'recharts';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import { ArrowDownCircle, ArrowUpCircle, Wallet, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const { transactions, categories, accounts, loading } = useFinance();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    // Calculate totals
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    
    setTotalIncome(income);
    setTotalExpense(expense);
    
    // Calculate total balance from all accounts
    const balance = accounts.reduce((acc, account) => acc + account.balance, 0);
    setTotalBalance(balance);

    // Prepare category data for pie chart
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const category = categories.find(c => c.id === transaction.categoryId);
        if (category) {
          acc[category.name] = (acc[category.name] || 0) + transaction.amount;
        }
        return acc;
      }, {} as Record<string, number>);

    const categoryPieData = Object.entries(expensesByCategory).map(([name, value]) => {
      const category = categories.find(c => c.name === name);
      return {
        name,
        value,
        icon: category?.icon || '🔹',
      };
    });
    
    setCategoryData(categoryPieData);

    // Prepare monthly data for line chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyTransactions = transactions.filter(t => 
      new Date(t.date) >= sixMonthsAgo
    );

    const monthlyGrouped = monthlyTransactions.reduce((acc, transaction) => {
      const month = format(new Date(transaction.date), 'MMM');
      
      if (!acc[month]) {
        acc[month] = { month, income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expense += transaction.amount;
      }
      
      return acc;
    }, {} as Record<string, { month: string; income: number; expense: number }>);
    
    setMonthlyData(Object.values(monthlyGrouped));

  }, [transactions, categories, accounts]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Visão Geral" description="Acompanhe suas finanças em um só lugar" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary to-purple-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Saldo Total</p>
              <h3 className="text-2xl font-bold mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
              </h3>
            </div>
            <Wallet size={32} className="text-white/80" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Receitas</p>
              <h3 className="text-2xl font-bold mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
              </h3>
            </div>
            <ArrowUpCircle size={32} className="text-white/80" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Despesas</p>
              <h3 className="text-2xl font-bold mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
              </h3>
            </div>
            <ArrowDownCircle size={32} className="text-white/80" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Gastos por Categoria">
          <div className="h-80 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-neutral-light">Nenhum dado disponível</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Evolução Mensal">
          <div className="h-80 w-full">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="month" />
                  <Tooltip 
                    formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Receitas" fill="#52c41a" />
                  <Bar dataKey="expense" name="Despesas" fill="#ff4d4f" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-neutral-light">Nenhum dado disponível</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card title="Últimas Transações">
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2">Descrição</th>
                  <th className="pb-2">Data</th>
                  <th className="pb-2">Categoria</th>
                  <th className="pb-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((transaction) => {
                    const category = categories.find(c => c.id === transaction.categoryId);
                    return (
                      <tr key={transaction.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3">{transaction.description}</td>
                        <td className="py-3">{format(new Date(transaction.date), 'dd/MM/yyyy')}</td>
                        <td className="py-3 flex items-center gap-2">
                          <span>{category?.icon}</span>
                          {category?.name}
                        </td>
                        <td className={`py-3 text-right ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'} 
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-neutral-light text-center py-4">Nenhuma transação registrada</p>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
