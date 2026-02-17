import React, { useState } from 'react';
import { CaretUp, CaretDown, Trash, Check, Fire, WarningCircle, Clock, Info, DotsSixVertical, Plus, X, ArrowsOutSimple } from '@phosphor-icons/react';
import clsx from 'clsx';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

export const SECTIONS = ["topPriority", "secondary", "must", "should", "could", "wont"];
export const LIMITS = { topPriority: 1, secondary: 3 };

const SECTION_META = {
  topPriority: { num: '01', label: 'Top Priority', desc: 'The one thing that matters most' },
  secondary:   { num: '02', label: 'Secondary',    desc: 'Important supporting work' },
  must:        { num: '03', label: 'Must Do',       desc: 'Non-negotiable commitments' },
  should:      { num: '04', label: 'Should Do',     desc: 'High-value if time permits' },
  could:       { num: '05', label: 'Could Do',      desc: 'Nice to have' },
  wont:        { num: '06', label: "Won't Do",      desc: 'Consciously deferred' },
};

export const PRIORITIES = [
  { value: "critical", label: "Critical", accent: "bg-rose-500",    text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/20",     border: "border-rose-200 dark:border-rose-900/40", icon: Fire },
  { value: "high",     label: "High",     accent: "bg-amber-500",   text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20",  border: "border-amber-200 dark:border-amber-900/40", icon: WarningCircle },
  { value: "medium",   label: "Medium",   accent: "bg-primary",     text: "text-primary",                     bg: "bg-primary/5 dark:bg-primary/10",    border: "border-primary/20", icon: Clock },
  { value: "low",      label: "Low",      accent: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-900/40", icon: Info },
  { value: "minimal",  label: "Minimal",  accent: "bg-slate-400",   text: "text-slate-500 dark:text-slate-400",   bg: "bg-slate-50 dark:bg-slate-900/20",  border: "border-slate-200 dark:border-slate-800", icon: Info }
];

// --- Priority Badge ---
export const PriorityBadge = ({ priority }) => {
  const config = PRIORITIES.find(p => p.value === priority) || PRIORITIES[2];
  return (
    <span className={clsx("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider", config.text, config.bg)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", config.accent)} />
      {config.label}
    </span>
  );
};

// --- Section Header (Magazine-style) ---
export const SectionHeader = ({ section, count }) => {
  const meta = SECTION_META[section] || { num: '00', label: section, desc: '' };
  const limit = LIMITS[section];
  const fillPercent = limit ? Math.min((count / limit) * 100, 100) : 0;

  return (
    <div className="flex items-end gap-5 mt-14 mb-5 first:mt-4 group">
      {/* Decorative number */}
      <span className="text-5xl font-serif font-extralight text-primary/15 leading-none select-none tracking-tighter group-hover:text-primary/25 transition-colors duration-500">
        {meta.num}
      </span>

      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-baseline gap-3 mb-1">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/80">
            {meta.label}
          </h3>
          {limit ? (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1 rounded-full bg-muted/40 overflow-hidden">
                <motion.div
                  className={clsx("h-full rounded-full", count >= limit ? "bg-primary" : "bg-primary/50")}
                  initial={{ width: 0 }}
                  animate={{ width: `${fillPercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className="text-[9px] font-mono text-muted-foreground/50">
                {count}/{limit}
              </span>
            </div>
          ) : (
            <span className="text-[9px] font-mono text-muted-foreground/40">
              {count > 0 ? count : '—'}
            </span>
          )}
        </div>
        <div className="h-px bg-gradient-to-r from-border/60 via-border/30 to-transparent" />
      </div>
    </div>
  );
};

// --- Sortable Task Item Wrapper ---
export const SortableTaskItem = ({ task, onToggle, onDelete, onMove, onMoveScope, onUpdate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task._id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={clsx("touch-none", isDragging && "z-50 opacity-40")}>
       <TaskItem 
          task={task} 
          onToggle={onToggle} 
          onDelete={onDelete} 
          onMove={onMove}
          onMoveScope={onMoveScope}
          onUpdate={onUpdate}
          dragHandleProps={{ ...attributes, ...listeners }}
       />
    </div>
  );
};

// --- Task Item (Editorial Card) ---
export const TaskItem = ({ task, onToggle, onDelete, onMove, onMoveScope, onUpdate, dragHandleProps, isOverlay }) => {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const priorityConfig = PRIORITIES.find(p => p.value === task.priority) || PRIORITIES[2];

  return (
  <motion.div 
    initial={isOverlay ? false : { opacity: 0, y: 8 }}
    animate={isOverlay ? false : { opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
    layout
    className={clsx(
      "group relative flex items-start gap-3 py-3.5 px-4 mb-1.5 rounded-xl transition-all duration-200",
      task.completed 
        ? "opacity-50" 
        : "hover:bg-card hover:shadow-sm hover:shadow-primary/5",
      isOverlay && "shadow-2xl bg-card border border-primary/20 scale-[1.02] rotate-[0.5deg] z-50 rounded-2xl"
    )}
  >
    {/* Priority accent bar */}
    <div className={clsx(
      "absolute left-0 top-2 bottom-2 w-[3px] rounded-full transition-all duration-300",
      task.completed ? "bg-muted/30" : priorityConfig.accent,
      !task.completed && "group-hover:h-[calc(100%-8px)]"
    )} />
    
    {/* Drag Handle */}
    <div 
      className={clsx(
        "mt-1.5 cursor-grab active:cursor-grabbing text-muted-foreground/15 hover:text-muted-foreground/40 transition-colors",
        isOverlay && "cursor-grabbing"
      )} 
      {...dragHandleProps}
    >
      <DotsSixVertical size={16} weight="bold" />
    </div>

    {/* Checkbox */}
    <button 
      onClick={() => onToggle(task)} 
      className={clsx(
        "mt-0.5 w-[22px] h-[22px] rounded-md border-[1.5px] flex items-center justify-center transition-all duration-300 shrink-0",
        task.completed 
          ? "border-primary/40 bg-primary/10 text-primary" 
          : "border-muted-foreground/25 hover:border-primary/60 bg-transparent text-transparent hover:text-primary/30"
      )}
    >
      <Check size={12} weight="bold" className={clsx("transition-all duration-300", task.completed ? "scale-100" : "scale-0")} />
    </button>

    {/* Content */}
    <div className="flex-1 min-w-0 mt-0.5">
      <div className="flex items-baseline gap-2.5">
        <p className={clsx(
            "text-[14px] leading-snug transition-all duration-300 truncate", 
            task.completed 
              ? "text-muted-foreground/60 line-through decoration-primary/20 decoration-1" 
              : "text-foreground font-medium"
          )}>
          {task.title}
        </p>
          <div className="relative">
            <button 
              onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              className="transition-transform active:scale-95"
            >
              <PriorityBadge priority={task.priority || 'medium'} />
            </button>
            
            <AnimatePresence>
              {showPriorityMenu && (
                <>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 4 }}
                    className="absolute left-0 top-full mt-1.5 w-32 bg-card/95 backdrop-blur-xl border border-border/60 shadow-xl rounded-xl overflow-hidden z-50 py-1"
                  >
                    {PRIORITIES.map(p => (
                      <button 
                        key={p.value}
                        onClick={() => {
                          onUpdate(task, { priority: p.value });
                          setShowPriorityMenu(false);
                        }}
                        className={clsx(
                          "w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-primary/5 flex items-center gap-2",
                          task.priority === p.value ? "text-primary bg-primary/5" : "text-foreground/60"
                        )}
                      >
                        <span className={clsx("w-2 h-2 rounded-full", p.accent)} />
                        {p.label}
                      </button>
                    ))}
                  </motion.div>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPriorityMenu(false)} />
                </>
              )}
            </AnimatePresence>
          </div>
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground/60 font-serif italic mt-0.5 truncate">{task.description}</p>
      )}
    </div>

    {/* Actions — slide in on hover */}
    <div className={clsx(
      "flex items-center gap-0.5 transition-all duration-300",
      isOverlay ? "opacity-0" : "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
    )}>
      {onMove && (
         <div className="flex flex-col">
            <button onClick={() => onMove(task, -1)} className="p-0.5 hover:text-primary transition-colors hover:bg-primary/5 rounded"><CaretUp size={13} weight="bold" /></button>
            <button onClick={() => onMove(task, 1)} className="p-0.5 hover:text-primary transition-colors hover:bg-primary/5 rounded"><CaretDown size={13} weight="bold" /></button>
         </div>
      )}
      <button onClick={() => onDelete(task._id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground/40 hover:text-destructive transition-all">
        <Trash size={15} weight="duotone" />
      </button>
      
      {/* Move Scope Menu */}
      <div className="relative">
        <button 
            onClick={() => setShowMoveMenu(!showMoveMenu)} 
            className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground/40 hover:text-primary transition-all"
            title="Move to…"
        >
            <ArrowsOutSimple size={15} weight="duotone" />
        </button>
        
        <AnimatePresence>
          {showMoveMenu && (
            <>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                className="absolute right-0 top-full mt-1.5 w-36 bg-card/95 backdrop-blur-xl border border-border/60 shadow-xl shadow-black/5 rounded-xl overflow-hidden z-50 py-1"
              >
                <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Move to</div>
                {["daily", "weekly", "monthly", "quarterly", "yearly"].filter(s => s !== task.scope).map(scope => (
                    <button 
                        key={scope}
                        onClick={() => {
                            onMoveScope(task, scope);
                            setShowMoveMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-primary/5 capitalize text-foreground/80 hover:text-primary transition-colors"
                    >
                        {scope}
                    </button>
                ))}
              </motion.div>
              <div className="fixed inset-0 z-40" onClick={() => setShowMoveMenu(false)} />
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  </motion.div>
);
};

// --- Quick Task Input ---
export const QuickTaskForm = ({ section, onAdd }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title, section, priority });
    setTitle('');
    setIsExpanded(false);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!isExpanded ? (
        <motion.button 
          key="add-btn"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-2 text-[11px] font-medium text-muted-foreground/40 hover:text-primary mt-2 px-4 py-2 rounded-lg w-full transition-all duration-200 hover:bg-primary/[0.03]"
        >
          <Plus size={12} weight="bold" className="opacity-40 group-hover:opacity-100 transition-opacity" />
          <span className="tracking-wide">Add task…</span>
        </motion.button>
      ) : (
        <motion.form 
          key="add-form"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          onSubmit={handleSubmit} 
          className="mt-2 flex items-center gap-2 bg-card/80 backdrop-blur-sm p-2 rounded-xl border border-border/40 shadow-sm"
        >
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title…"
            className="flex-1 text-sm bg-transparent outline-none min-w-0 placeholder:text-muted-foreground/30 pl-2 text-foreground font-medium"
          />
          
          <div className="flex items-center gap-1 border-l border-border/30 pl-2">
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={clsx(
                  "w-3 h-3 rounded-full transition-all",
                  p.accent,
                  priority === p.value ? "ring-2 ring-offset-1 ring-offset-card scale-125" : "opacity-30 hover:opacity-60"
                )}
                title={p.label}
              />
            ))}
          </div>

          <button type="submit" className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Plus size={14} weight="bold" />
          </button>
          <button type="button" onClick={() => setIsExpanded(false)} className="p-1.5 text-muted-foreground/40 hover:text-destructive rounded-lg transition-colors">
            <X size={14} weight="bold" />
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

// --- Section Droppable ---
const SectionDroppable = ({ section, count, tasks, onToggle, onDelete, onMove, onMoveScope, onUpdate, onAdd }) => {
  const { setNodeRef } = useDroppable({
    id: section,
    data: { section }
  });

  return (
    <div ref={setNodeRef}>
      <SectionHeader section={section} count={count} />
      
      <SortableContext 
        id={section} 
        items={tasks.map(t => t._id)} 
        strategy={verticalListSortingStrategy}
      >
        <div className={clsx(
            "min-h-[8px] transition-all duration-200", 
            tasks.length === 0 && "py-6 border border-dashed border-border/30 rounded-xl flex items-center justify-center bg-muted/[0.03]"
          )}>
             {tasks.length === 0 && (
               <span className="text-[10px] text-muted-foreground/30 font-medium tracking-wide">
                 Drop tasks here or add below
               </span>
             )}
             {tasks.map(task => (
                 <SortableTaskItem key={task._id} task={task} onToggle={onToggle} onDelete={onDelete} onMove={onMove} onMoveScope={onMoveScope} onUpdate={onUpdate} />
             ))}
        </div>
      </SortableContext>
      
      <QuickTaskForm section={section} onAdd={onAdd} />
    </div>
  );
};

// --- Task Sections Container ---
export const TaskSections = ({ tasks, onToggle, onDelete, onMove, onMoveScope, onReorder, onUpdate, onAdd }) => {
  const [activeId, setActiveId] = useState(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const grouped = SECTIONS.reduce((acc, s) => ({ 
    ...acc, 
    [s]: tasks
      .filter(t => t.section === s)
      .sort((a,b) => a.priorityRank - b.priorityRank) 
  }), {});

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find(t => t._id === active.id);
    if (!activeTask) return;

    let targetSection = activeTask.section;
    let newRank = activeTask.priorityRank;

    if (SECTIONS.includes(over.id)) {
      targetSection = over.id;
      const targetTasks = grouped[targetSection];
      newRank = targetTasks.length > 0 ? targetTasks[targetTasks.length - 1].priorityRank + 1 : 0;
    } else {
      const overTask = tasks.find(t => t._id === over.id);
      if (overTask) {
        targetSection = overTask.section;
        const sectionTasks = grouped[targetSection];
        const overIndex = sectionTasks.findIndex(t => t._id === over.id);
        const activeIndex = sectionTasks.findIndex(t => t._id === active.id);
        
        if (targetSection === activeTask.section && activeIndex < overIndex) {
             newRank = overTask.priorityRank;
        } else {
             newRank = overTask.priorityRank;
        }
      }
    }

    if (activeTask.section !== targetSection || activeTask.priorityRank !== newRank) {
       onReorder(activeTask, targetSection, newRank);
    }
  };

  const activeTask = activeId ? tasks.find(t => t._id === activeId) : null;

  return (
    <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
    >
      <div className="space-y-0">
        {SECTIONS.map(section => (
          <SectionDroppable 
            key={section} 
            section={section} 
            count={grouped[section].length} 
            tasks={grouped[section]} 
            onToggle={onToggle} 
            onDelete={onDelete} 
            onMove={onMove}
            onMoveScope={onMoveScope}
            onUpdate={onUpdate}
            onAdd={onAdd} 
          />
        ))}
      </div>
      
      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
         {activeTask ? <TaskItem task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};

// --- Main Task Form (Command Bar) ---
export const TaskForm = ({ onSubmit, label, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
  <motion.form 
    onSubmit={onSubmit} 
    className={clsx(
      "group relative rounded-2xl border transition-all duration-500 overflow-hidden",
      isFocused 
        ? "bg-card shadow-xl shadow-primary/5 border-primary/30 ring-1 ring-primary/10" 
        : "bg-card/60 border-border/40 shadow-sm hover:shadow-md hover:border-border/60"
    )}
  >
    {/* Textured top stripe */}
    <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    
    <div className="flex items-center gap-3 px-5 py-1">
      {/* Main input */}
      <div className="flex-1 py-3">
        <input 
          name="title" 
          required 
          placeholder={placeholder} 
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full text-[15px] font-medium bg-transparent outline-none placeholder:text-muted-foreground/30 placeholder:font-normal text-foreground" 
        />
      </div>

      <div className="h-6 w-px bg-border/30" />
      
      {/* Priority Selector */}
      <select 
        name="priority" 
        defaultValue="medium"
        className="bg-transparent text-[10px] font-bold uppercase tracking-wider px-2 py-2 outline-none cursor-pointer text-muted-foreground/60 hover:text-primary transition-colors appearance-none"
      >
        {PRIORITIES.map(p => (
          <option key={p.value} value={p.value} className="bg-card text-foreground">
            {p.label}
          </option>
        ))}
      </select>
      
      <div className="h-6 w-px bg-border/30" />
      
      {/* Section Selector */}
      <select 
        name="section" 
        className="bg-transparent text-[10px] font-bold uppercase tracking-wider px-2 py-2 outline-none cursor-pointer text-muted-foreground/60 hover:text-primary transition-colors appearance-none"
      >
        {SECTIONS.map(s => {
          const meta = SECTION_META[s];
          return <option key={s} value={s} className="bg-card text-foreground">{meta?.label || s}</option>;
        })}
      </select>

      <button 
        type="submit" 
        className={clsx(
          "h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-300 active:scale-90",
          "bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25"
        )}
      >
        <Plus size={18} weight="bold" />
      </button>
    </div>
  </motion.form>
);
};
