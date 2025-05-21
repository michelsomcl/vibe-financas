
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const schema = z.object({
  description: z.string().min(3, {
    message: "O título deve ter pelo menos 3 caracteres.",
  }),
  amount: z.string().refine((value) => {
    const parsedValue = parseFloat(value);
    return !isNaN(parsedValue) && parsedValue > 0;
  }, {
    message: "O valor deve ser um número maior que zero.",
  }),
  due_date: z.date(),
  category_id: z.string().min(1, {
    message: "Selecione uma categoria.",
  }),
  is_paid: z.boolean().default(false),
  is_recurring: z.boolean().default(false),
  recurrence_type: z.string().nullable().optional(),
  recurrence_end_date: z.date().nullable().optional(),
  is_installment: z.boolean().default(false),
  total_installments: z.string().nullable().optional(),
});

interface BillFormProps {
  bill?: {
    id: string;
    description: string;
    amount: number;
    due_date: string;
    category_id: string;
    status: string;
    is_recurring?: boolean;
    recurrence_type?: string | null;
    recurrence_end_date?: string | null;
    is_installment?: boolean;
    total_installments?: number | null;
  };
  onClose?: () => void;
}

type FormData = z.infer<typeof schema>;

const BillForm = ({ bill, onClose }: BillFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: bill?.description || "",
      amount: bill?.amount?.toString() || "",
      due_date: bill?.due_date ? new Date(bill.due_date) : new Date(),
      category_id: bill?.category_id || "",
      is_paid: bill?.status === "paid" || false,
      is_recurring: bill?.is_recurring || false,
      recurrence_type: bill?.recurrence_type || null,
      recurrence_end_date: bill?.recurrence_end_date ? new Date(bill.recurrence_end_date) : null,
      is_installment: bill?.is_installment || false,
      total_installments: bill?.total_installments?.toString() || null,
    },
  });

  const isRecurring = form.watch("is_recurring");
  const isInstallment = form.watch("is_installment");

  // Reset related fields when toggling options
  useEffect(() => {
    if (!isRecurring) {
      form.setValue("recurrence_type", null);
      form.setValue("recurrence_end_date", null);
    }
    if (!isInstallment) {
      form.setValue("total_installments", null);
    }
    // Ensure users can't select both options
    if (isRecurring && isInstallment) {
      form.setValue("is_installment", false);
    }
  }, [isRecurring, isInstallment, form]);

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*");

      if (error) {
        toast({
          title: "Erro ao carregar categorias",
          description: "Ocorreu um erro ao carregar as categorias.",
          variant: "destructive",
        });
        return [];
      }

      return data;
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const parsedValue = parseFloat(data.amount);

      if (isNaN(parsedValue) || parsedValue <= 0) {
        toast({
          title: "Erro ao cadastrar conta",
          description: "O valor deve ser um número maior que zero.",
          variant: "destructive",
        });
        return;
      }

      const billData = {
        description: data.description,
        amount: parsedValue,
        due_date: format(data.due_date, "yyyy-MM-dd"),
        category_id: data.category_id,
        status: data.is_paid ? "paid" : "pending",
        is_recurring: data.is_recurring,
        recurrence_type: data.is_recurring ? data.recurrence_type : null,
        recurrence_end_date: data.is_recurring && data.recurrence_end_date 
          ? format(data.recurrence_end_date, "yyyy-MM-dd") 
          : null,
        is_installment: data.is_installment,
        total_installments: data.is_installment && data.total_installments 
          ? parseInt(data.total_installments, 10) 
          : null,
      };

      if (bill) {
        const { error } = await supabase
          .from("bills")
          .update(billData)
          .eq("id", bill.id);

        if (error) {
          console.error("Error updating bill:", error);
          toast({
            title: "Erro ao atualizar conta",
            description: "Ocorreu um erro ao atualizar a conta.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Conta atualizada",
          description: "Conta atualizada com sucesso!",
        });
      } else {
        const { error } = await supabase.from("bills").insert(billData);

        if (error) {
          console.error("Error inserting bill:", error);
          toast({
            title: "Erro ao cadastrar conta",
            description: "Ocorreu um erro ao cadastrar a conta.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Conta cadastrada",
          description: "Conta cadastrada com sucesso!",
        });
      }

      onClose && onClose();
      navigate("/contas-a-pagar");
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Erro ao cadastrar conta",
        description: "Ocorreu um erro ao cadastrar a conta.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Aluguel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 150,00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Vencimento</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Selecione a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-medium">Tipo de lançamento</h3>
          
          <FormField
            control={form.control}
            name="is_installment"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Parcelado</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Dividir em várias parcelas
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (checked) form.setValue("is_recurring", false);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {isInstallment && (
            <FormField
              control={form.control}
              name="total_installments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de parcelas</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Ex: 12" 
                      {...field} 
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || parseInt(value) > 0) {
                          field.onChange(value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="is_recurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Recorrente</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Se repete periodicamente
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (checked) form.setValue("is_installment", false);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {isRecurring && (
            <>
              <FormField
                control={form.control}
                name="recurrence_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de recorrência</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurrence_end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data final (opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Selecione a data final</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        <FormField
          control={form.control}
          name="is_paid"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Pago</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Marque se a conta já foi paga.
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || isLoadingCategories}
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              {bill ? "Atualizando..." : "Criando..."}
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {bill ? "Atualizar Conta" : "Cadastrar Conta"}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default BillForm;
