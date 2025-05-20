
import { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';

// Types
export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'bank' | 'cash' | 'credit' | 'investment';
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: Date;
  categoryId: string;
  accountId: string;
  description: string;
}

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  editTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  editCategory: (id: string, category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  editAccount: (id: string, account: Omit<Account, 'id'>) => void;
  deleteAccount: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;
  getAccountById: (id: string) => Account | undefined;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Default data
const defaultCategories: Category[] = [
  { id: '1', name: 'Alimentação', type: 'expense', icon: '🍔' },
  { id: '2', name: 'Transporte', type: 'expense', icon: '🚗' },
  { id: '3', name: 'Lazer', type: 'expense', icon: '🎬' },
  { id: '4', name: 'Saúde', type: 'expense', icon: '🏥' },
  { id: '5', name: 'Educação', type: 'expense', icon: '📚' },
  { id: '6', name: 'Moradia', type: 'expense', icon: '🏠' },
  { id: '7', name: 'Salário', type: 'income', icon: '💰' },
  { id: '8', name: 'Freelancer', type: 'income', icon: '💻' },
  { id: '9', name: 'Investimentos', type: 'income', icon: '📈' },
];

const defaultAccounts: Account[] = [
  { id: '1', name: 'Carteira', balance: 500, type: 'cash' },
  { id: '2', name: 'Banco', balance: 2000, type: 'bank' },
];

const defaultTransactions: Transaction[] = [
  {
    id: '1',
    type: 'expense',
    amount: 50,
    date: new Date('2023-05-15'),
    categoryId: '1',
    accountId: '1',
    description: 'Almoço',
  },
  {
    id: '2',
    type: 'expense',
    amount: 100,
    date: new Date('2023-05-16'),
    categoryId: '2',
    accountId: '1',
    description: 'Uber',
  },
  {
    id: '3',
    type: 'income',
    amount: 3000,
    date: new Date('2023-05-05'),
    categoryId: '7',
    accountId: '2',
    description: 'Salário mensal',
  },
];

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [accounts, setAccounts] = useState<Account[]>(defaultAccounts);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };
    setTransactions([...transactions, newTransaction]);
    toast.success('Transação adicionada com sucesso!');
  };

  const editTransaction = (id: string, transaction: Omit<Transaction, 'id'>) => {
    setTransactions(
      transactions.map((t) => (t.id === id ? { ...transaction, id } : t))
    );
    toast.success('Transação atualizada com sucesso!');
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
    toast.success('Transação excluída com sucesso!');
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = {
      ...category,
      id: crypto.randomUUID(),
    };
    setCategories([...categories, newCategory]);
    toast.success('Categoria adicionada com sucesso!');
  };

  const editCategory = (id: string, category: Omit<Category, 'id'>) => {
    setCategories(
      categories.map((c) => (c.id === id ? { ...category, id } : c))
    );
    toast.success('Categoria atualizada com sucesso!');
  };

  const deleteCategory = (id: string) => {
    // Check if any transactions use this category
    const transactionsWithCategory = transactions.filter(t => t.categoryId === id);
    
    if (transactionsWithCategory.length > 0) {
      toast.error('Não é possível excluir uma categoria que está sendo utilizada em transações.');
      return;
    }
    
    setCategories(categories.filter((c) => c.id !== id));
    toast.success('Categoria excluída com sucesso!');
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount = {
      ...account,
      id: crypto.randomUUID(),
    };
    setAccounts([...accounts, newAccount]);
    toast.success('Conta adicionada com sucesso!');
  };

  const editAccount = (id: string, account: Omit<Account, 'id'>) => {
    setAccounts(
      accounts.map((a) => (a.id === id ? { ...account, id } : a))
    );
    toast.success('Conta atualizada com sucesso!');
  };

  const deleteAccount = (id: string) => {
    // Check if any transactions use this account
    const transactionsWithAccount = transactions.filter(t => t.accountId === id);
    
    if (transactionsWithAccount.length > 0) {
      toast.error('Não é possível excluir uma conta que está sendo utilizada em transações.');
      return;
    }
    
    setAccounts(accounts.filter((a) => a.id !== id));
    toast.success('Conta excluída com sucesso!');
  };

  const getCategoryById = (id: string) => {
    return categories.find((c) => c.id === id);
  };

  const getAccountById = (id: string) => {
    return accounts.find((a) => a.id === id);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        accounts,
        addTransaction,
        editTransaction,
        deleteTransaction,
        addCategory,
        editCategory,
        deleteCategory,
        addAccount,
        editAccount,
        deleteAccount,
        getCategoryById,
        getAccountById,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
