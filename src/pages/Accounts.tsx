import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { Wallet, CreditCard, Landmark, TrendingUp, PlusCircle, Loader2 } from 'lucide-react';

const accountTypes = [
  { id: 'cash', name: 'Dinheiro', icon: <Wallet size={20} /> },
  { id: 'bank', name: 'Conta Bancária', icon: <Landmark size={20} /> },
  { id: 'credit', name: 'Cartão de Crédito', icon: <CreditCard size={20} /> },
  { id: 'investment', name: 'Investimento', icon: <TrendingUp size={20} /> },
];

const Accounts = () => {
  const { accounts, addAccount, deleteAccount, loading } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<'bank' | 'cash' | 'credit' | 'investment'>('bank');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isNaN(parseFloat(balance))) {
      setSubmitting(true);
      try {
        await addAccount({
          name,
          balance: parseFloat(balance),
          type,
        });
        setName('');
        setBalance('');
        setType('bank');
        setShowForm(false);
      } catch (error) {
        console.error('Error adding account:', error);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getAccountIcon = (accountType: string) => {
    switch (accountType) {
      case 'cash':
        return <Wallet className="text-green-500" />;
      case 'bank':
        return <Landmark className="text-blue-500" />;
      case 'credit':
        return <CreditCard className="text-purple-500" />;
      case 'investment':
        return <TrendingUp className="text-amber-500" />;
      default:
        return <Wallet />;
    }
  };

  const getAccountTypeLabel = (accountType: string) => {
    return accountTypes.find(t => t.id === accountType)?.name || 'Conta';
  };

  const totalBalance = accounts.reduce((total, account) => total + account.balance, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando contas...</span>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Contas" 
        description="Gerencie suas contas financeiras"
        action={
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowForm(!showForm)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        }
      />
      
      <div className="space-y-6">
        {showForm && (
          <Card title="Nova Conta">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Conta</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Nubank, Carteira, etc"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="balance">Saldo Inicial</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {accountTypes.map((accountType) => (
                    <Button
                      key={accountType.id}
                      type="button"
                      variant={type === accountType.id ? 'default' : 'outline'}
                      className={type === accountType.id ? 'bg-primary text-white' : ''}
                      onClick={() => setType(accountType.id as any)}
                    >
                      <span className="mr-2">{accountType.icon}</span>
                      {accountType.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Conta'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}
        
        <Card 
          title="Saldo Total" 
          className="bg-gradient-to-br from-primary to-purple-700 text-white font-semibold"
        >
          <h3 className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
          </h3>
          <p className="text-sm mt-1 text-white/80">Somando todas as suas contas</p>
        </Card>
        
        <Card title="Suas Contas">
          {accounts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <div key={account.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        {getAccountIcon(account.type)}
                      </div>
                      <div>
                        <h3 className="font-medium">{account.name}</h3>
                        <p className="text-xs text-neutral-light">{getAccountTypeLabel(account.type)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
                      </div>
                    </div>
                  </div>
                  <div className="border-t p-2 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-700 text-xs"
                      onClick={() => deleteAccount(account.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-neutral-light opacity-50 mx-auto" />
              <h3 className="mt-2 text-lg font-medium">Nenhuma conta cadastrada</h3>
              <p className="text-neutral-light">Adicione suas contas para começar</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Accounts;
