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
  id: z.string().optional(),
  title: z.string().min(3, {
    message: "O título deve ter pelo menos 3 caracteres.",
  }),
  value: z.string().refine((value) => {
    const parsedValue = parseFloat(value);
    return !isNaN(parsedValue) && parsedValue > 0;
  }, {
    message: "O valor deve ser um número maior que zero.",
  }),
  due_date: z.date(),
  category_id: z.string().min(1, {
    message: "Selecione uma categoria.",
  }),
  is_paid: z.boolean().default(false).optional(),
});

interface BillFormProps {
  bill?: {
    id: string;
    title: string;
    value: number;
    due_date: string;
    category_id: string;
    is_paid: boolean;
  };
  onSuccess?: () => void;
}

type FormData = z.infer<typeof schema>;

const BillForm = ({ bill, onSuccess }: BillFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: bill?.title || "",
      value: bill?.value?.toString() || "",
      due_date: bill?.due_date ? new Date(bill.due_date) : new Date(),
      category_id: bill?.category_id || "",
      is_paid: bill?.is_paid || false,
    },
  });

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
      const parsedValue = parseFloat(data.value);

      if (isNaN(parsedValue) || parsedValue <= 0) {
        toast({
          title: "Erro ao cadastrar conta",
          description: "O valor deve ser um número maior que zero.",
          variant: "destructive",
        });
        return;
      }

      if (bill) {
        const { error } = await supabase
          .from("bills")
          .update({
            title: data.title,
            value: parsedValue,
            due_date: format(data.due_date, "yyyy-MM-dd"),
            category_id: data.category_id,
            is_paid: data.is_paid,
          })
          .eq("id", bill.id);

        if (error) {
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
        const { error } = await supabase.from("bills").insert({
          title: data.title,
          value: parsedValue,
          due_date: format(data.due_date, "yyyy-MM-dd"),
          category_id: data.category_id,
          is_paid: data.is_paid,
        });

        if (error) {
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

      onSuccess && onSuccess();
      navigate("/contas-a-pagar");
    } catch (error) {
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
          name="title"
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
          name="value"
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
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
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
