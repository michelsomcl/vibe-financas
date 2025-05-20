
import { NavLink } from "react-router-dom";
import { 
  Home, 
  BarChart2,
  PlusCircle,
  CreditCard,
  Tags,
  MenuIcon,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-20 lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={toggleSidebar}
      />
      
      <aside 
        className={cn(
          "fixed top-0 left-0 z-30 h-full w-72 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 lg:relative lg:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold text-primary flex items-center">
            <span className="mr-2">💸</span> 
            Vibe Finanças
          </h1>
          <button 
            className="p-1 rounded-full hover:bg-gray-100 lg:hidden"
            onClick={toggleSidebar}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-3">
          <ul className="space-y-1">
            {[
              { to: "/inicio", icon: <Home />, label: "Início" },
              { to: "/transacoes", icon: <BarChart2 />, label: "Transações" },
              { to: "/nova-transacao", icon: <PlusCircle />, label: "Nova Transação" },
              { to: "/categorias", icon: <Tags />, label: "Categorias" },
              { to: "/contas", icon: <CreditCard />, label: "Contas" },
            ].map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-accent text-primary font-medium"
                        : "text-neutral-light hover:bg-accent/50 hover:text-primary"
                    )
                  }
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <button
        className="fixed bottom-5 left-5 z-10 p-2 bg-primary text-white rounded-full shadow-lg lg:hidden"
        onClick={toggleSidebar}
      >
        <MenuIcon size={24} />
      </button>
    </>
  );
};

export default Sidebar;
