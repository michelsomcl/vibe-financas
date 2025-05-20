
import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const Transactions = () => {
  const { transactions, categories, accounts, deleteTransaction } = useFinance();
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Get all unique months from transactions
  const uniqueMonths = [...new Set(transactions.map(t => {
    const date = new Date(t.date);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }))].sort((a, b) => b.localeCompare(a));

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by type
    if (selectedType !== 'all' && transaction.type !== selectedType) {
      return false;
    }

    // Filter by category
    if (selectedCategory !== 'all' && transaction.categoryId !== selectedCategory) {
      return false;
    }

    // Filter by month
    if (selectedMonth !== 'all') {
      const date = new Date(transaction.date);
      const transactionMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (transactionMonth !== selectedMonth) {
        return false;
      }
    }

    return true;
  });

  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return format(date, 'MMMM yyyy', { locale: require('date-fns/locale/pt-BR') });
  };

  return (
    <div>
      <PageHeader 
        title="Transações" 
        description="Gerencie suas transações financeiras"
        action={
          <Link to="/nova-transacao">
            <Button className="bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Transação
            </Button>
          </Link>
        }
      />

      <Card>
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-2 text-neutral-light">
            <Filter size={16} />
            <span>Filtros:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm bg-white"
            >
              <option value="all">Todos os meses</option>
              {uniqueMonths.map((month) => (
                <option key={month} value={month}>
                  {formatMonthName(month)}
                </option>
              ))}
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'all' | 'income' | 'expense')}
              className="px-3 py-1 border rounded-md text-sm bg-white"
            >
              <option value="all">Todos os tipos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </select>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm bg-white"
            >
              <option value="all">Todas as categorias</option>
              {categories
                .filter(c => selectedType === 'all' || c.type === selectedType)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium">Categoria</th>
                  <th className="pb-2 font-medium">Conta</th>
                  <th className="pb-2 font-medium text-right">Valor</th>
                  <th className="pb-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => {
                    const category = categories.find(c => c.id === transaction.categoryId);
                    const account = accounts.find(a => a.id === transaction.accountId);
                    return (
                      <tr key={transaction.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3">{transaction.description}</td>
                        <td className="py-3">{format(new Date(transaction.date), 'dd/MM/yyyy')}</td>
                        <td className="py-3 flex items-center gap-2">
                          <span>{category?.icon}</span>
                          {category?.name}
                        </td>
                        <td className="py-3">{account?.name}</td>
                        <td className={`py-3 text-right ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'} 
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                        </td>
                        <td className="py-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
                                deleteTransaction(transaction.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-neutral-light opacity-50" />
            <h3 className="mt-2 text-lg font-medium">Nenhuma transação encontrada</h3>
            <p className="text-neutral-light">Tente mudar os filtros ou adicione uma nova transação</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Transactions;
