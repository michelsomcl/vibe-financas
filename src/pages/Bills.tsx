
import { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Calendar, Plus, Check, Loader2 } from 'lucide-react';
import { format, isBefore, isToday } from 'date-fns';
import BillForm from '@/components/BillForm';
import BillPaymentForm from '@/components/BillPaymentForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Bills = () => {
  const { bills, categories, billsLoading } = useFinance();
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [isPayingBill, setIsPayingBill] = useState(false);
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [localBills, setLocalBills] = useState<any[]>([]);

  // Fetch bills directly from Supabase
  useEffect(() => {
    const loadBills = async () => {
      try {
        const { data, error } = await supabase
          .from('bills')
          .select('*, categories(name, icon)')
          .order('due_date', { ascending: true });
        
        if (error) {
          console.error('Error fetching bills:', error);
          toast({
            title: 'Erro ao carregar contas',
            description: error.message,
            variant: 'destructive'
          });
          return;
        }

        setLocalBills(data || []);
      } catch (error) {
        console.error('Unexpected error fetching bills:', error);
      }
    };

    loadBills();

    // Set up realtime subscription
    const channel = supabase
      .channel('bills-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bills'
      }, () => {
        loadBills();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePayBill = (billId: string) => {
    setSelectedBill(billId);
    setIsPayingBill(true);
  };

  // Use the locally fetched bills rather than from context
  const displayBills = localBills.filter(bill => {
    if (bill.status !== 'pending') return false;
    
    const today = new Date();
    const dueDate = new Date(bill.due_date);
    
    switch (activeTab) {
      case 'overdue':
        return isBefore(dueDate, today) && !isToday(dueDate);
      case 'today':
        return isToday(dueDate);
      case 'upcoming':
        return isBefore(today, dueDate);
      default:
        return true;
    }
  });

  // Group bills by due date
  const groupedBills: Record<string, typeof displayBills> = {};
  displayBills.forEach(bill => {
    const dateKey = format(new Date(bill.due_date), 'yyyy-MM-dd');
    if (!groupedBills[dateKey]) {
      groupedBills[dateKey] = [];
    }
    groupedBills[dateKey].push(bill);
  });

  // Sort dates
  const sortedDates = Object.keys(groupedBills).sort();

  const handleAddBillClose = () => {
    setIsAddingBill(false);
    // Force a refresh of bills
    supabase
      .from('bills')
      .select('*, categories(name, icon)')
      .order('due_date', { ascending: true })
      .then(({ data }) => {
        if (data) setLocalBills(data);
      });
  };

  const handlePayBillClose = () => {
    setIsPayingBill(false);
    setSelectedBill(null);
    // Force a refresh of bills
    supabase
      .from('bills')
      .select('*, categories(name, icon)')
      .order('due_date', { ascending: true })
      .then(({ data }) => {
        if (data) setLocalBills(data);
      });
  };

  if (billsLoading && localBills.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando contas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas a Pagar"
        description="Gerencie suas contas e parcelas"
        action={
          <Button onClick={() => setIsAddingBill(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Conta
          </Button>
        }
      />

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="overdue">Vencidas</TabsTrigger>
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {displayBills.length > 0 ? (
            sortedDates.map(dateKey => (
              <div key={dateKey} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">
                    {format(new Date(dateKey), 'dd/MM/yyyy')}
                    {isToday(new Date(dateKey)) && " (Hoje)"}
                  </h3>
                </div>

                {groupedBills[dateKey].map((bill) => {
                  const isOverdue = isBefore(new Date(bill.due_date), new Date()) && !isToday(new Date(bill.due_date));
                  
                  return (
                    <Card key={bill.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{bill.categories?.icon || '💰'}</span>
                            <div>
                              <h3 className="font-medium">
                                {bill.description}
                                {bill.is_installment && bill.current_installment && bill.total_installments && 
                                  ` (${bill.current_installment}/${bill.total_installments})`
                                }
                              </h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-neutral-light">
                                <p>{bill.categories?.name}</p>
                                {isOverdue && <span className="text-red-500 font-medium">Vencida</span>}
                                {bill.is_recurring && <span className="text-blue-500">Recorrente</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-lg">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}
                          </span>
                          <Button 
                            size="sm" 
                            onClick={() => handlePayBill(bill.id)}
                            className="mt-2"
                          >
                            <Check className="mr-1 h-3 w-3" /> Pagar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-neutral-light">Não há contas a pagar {activeTab !== 'all' ? 'neste período' : ''}</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Bill Sheet */}
      <Sheet open={isAddingBill} onOpenChange={setIsAddingBill}>
        <SheetContent className="sm:max-w-md overflow-y-auto max-h-screen">
          <SheetHeader>
            <SheetTitle>Nova Conta a Pagar</SheetTitle>
            <SheetDescription>
              Adicione uma nova conta, parcela ou conta recorrente
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <BillForm onClose={handleAddBillClose} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Pay Bill Sheet */}
      <Sheet open={isPayingBill} onOpenChange={setIsPayingBill}>
        <SheetContent className="sm:max-w-md overflow-y-auto max-h-screen">
          <SheetHeader>
            <SheetTitle>Registrar Pagamento</SheetTitle>
            <SheetDescription>
              Selecione a conta para realizar o pagamento
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <BillPaymentForm 
              billId={selectedBill || ''}
              onClose={handlePayBillClose} 
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Bills;
