
import { useState } from 'react';
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

const Bills = () => {
  const { bills, categories, billsLoading } = useFinance();
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [isPayingBill, setIsPayingBill] = useState(false);
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const handlePayBill = (billId: string) => {
    setSelectedBill(billId);
    setIsPayingBill(true);
  };

  // Filter bills based on active tab
  const filteredBills = bills.filter(bill => {
    if (bill.status !== 'pending') return false;
    
    const today = new Date();
    const dueDate = new Date(bill.dueDate);
    
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
  const groupedBills: Record<string, typeof filteredBills> = {};
  filteredBills.forEach(bill => {
    const dateKey = format(new Date(bill.dueDate), 'yyyy-MM-dd');
    if (!groupedBills[dateKey]) {
      groupedBills[dateKey] = [];
    }
    groupedBills[dateKey].push(bill);
  });

  // Sort dates
  const sortedDates = Object.keys(groupedBills).sort();

  if (billsLoading) {
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
          {filteredBills.length > 0 ? (
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
                  const category = categories.find(c => c.id === bill.categoryId);
                  const isOverdue = isBefore(new Date(bill.dueDate), new Date()) && !isToday(new Date(bill.dueDate));
                  
                  return (
                    <Card key={bill.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{category?.icon || '💰'}</span>
                            <div>
                              <h3 className="font-medium">
                                {bill.description}
                                {bill.isInstallment && bill.currentInstallment && bill.totalInstallments && 
                                  ` (${bill.currentInstallment}/${bill.totalInstallments})`
                                }
                              </h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-neutral-light">
                                <p>{category?.name}</p>
                                {isOverdue && <span className="text-red-500 font-medium">Vencida</span>}
                                {bill.isRecurring && <span className="text-blue-500">Recorrente</span>}
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
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Nova Conta a Pagar</SheetTitle>
            <SheetDescription>
              Adicione uma nova conta, parcela ou conta recorrente
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <BillForm onClose={() => setIsAddingBill(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Pay Bill Sheet */}
      <Sheet open={isPayingBill} onOpenChange={setIsPayingBill}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Registrar Pagamento</SheetTitle>
            <SheetDescription>
              Selecione a conta para realizar o pagamento
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <BillPaymentForm 
              billId={selectedBill || ''}
              onClose={() => {
                setIsPayingBill(false);
                setSelectedBill(null);
              }} 
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Bills;
