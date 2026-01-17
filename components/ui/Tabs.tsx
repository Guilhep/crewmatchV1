import React, { createContext, useContext } from 'react';
import { cn } from '../../lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return (
    <div className={cn('flex items-center gap-1 border-b border-white/10', className)}>
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  icon,
  className,
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  
  const { value: selectedValue, onValueChange } = context;
  const isActive = selectedValue === value;
  
  return (
    <button
      onClick={() => onValueChange(value)}
      className={cn(
        'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
        'border-b-2 border-transparent',
        isActive
          ? 'text-[#D4AF37] border-[#D4AF37]'
          : 'text-[#8A8F9A] hover:text-white',
        className
      )}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className,
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  
  const { value: selectedValue } = context;
  if (selectedValue !== value) return null;
  
  return (
    <div
      className={cn(
        'mt-4 animate-in fade-in slide-in-from-top-2 duration-300',
        className
      )}
    >
      {children}
    </div>
  );
};



