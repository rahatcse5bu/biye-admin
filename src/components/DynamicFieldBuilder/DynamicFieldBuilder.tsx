import React, { useState } from "react";
import { FaTrash, FaPlus, FaGripVertical } from "react-icons/fa";
import { MdOutlineViewHeadline } from "react-icons/md";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface IExtraField {
  label: string;
  value: string | number | boolean;
  fieldType: "section" | "text" | "multi-line" | "numeric" | "email" | "phone" | "select" | "boolean";
  options?: string[];
}

interface DynamicFieldBuilderProps {
  value?: IExtraField[];
  fields?: IExtraField[];
  onChange: (fields: IExtraField[]) => void;
  errors?: string[];
}

const FIELD_TYPES: Array<{ value: IExtraField["fieldType"]; label: string; description: string }> = [
  { value: "text", label: "Text", description: "Single line text" },
  { value: "multi-line", label: "Multi-line", description: "Paragraph / multi-line text" },
  { value: "numeric", label: "Numeric", description: "Numbers only" },
  { value: "email", label: "Email", description: "Email format" },
  { value: "phone", label: "Phone", description: "Phone number" },
  { value: "select", label: "Select", description: "Dropdown with options" },
  { value: "boolean", label: "Boolean", description: "Yes/No" },
];

// ── Sortable item wrapper ──────────────────────────────────────────────────
interface SortableItemProps {
  id: string;
  children: (dragHandleProps: React.HTMLAttributes<HTMLDivElement>, isDragging: boolean) => React.ReactNode;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ ...attributes, ...listeners }, isDragging)}
    </div>
  );
};

// ── Field editor ──────────────────────────────────────────────────────────
interface FieldEditorProps {
  field: IExtraField;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<IExtraField>) => void;
  onRemove: () => void;
  onAddOption: () => void;
  onRemoveOption: (optIdx: number) => void;
  onUpdateOption: (optIdx: number, val: string) => void;
  dragHandleProps: React.HTMLAttributes<HTMLDivElement>;
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  field, index, isExpanded, onToggle, onUpdate, onRemove,
  onAddOption, onRemoveOption, onUpdateOption, dragHandleProps,
}) => {
  if (field.fieldType === "section") {
    return (
      <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-3">
        <div {...dragHandleProps} className="text-indigo-400 cursor-grab active:cursor-grabbing shrink-0 touch-none">
          <FaGripVertical size={16} />
        </div>
        <MdOutlineViewHeadline className="text-indigo-500 shrink-0" size={20} />
        <input
          type="text"
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Section title…"
          className="flex-1 bg-transparent font-semibold text-indigo-800 text-base border-none outline-none placeholder-indigo-300"
        />
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 p-1 rounded">
          <FaTrash size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg bg-gray-50 overflow-hidden ml-4">
      {/* Header row */}
      <div
        className="bg-gray-100 px-3 py-3 flex items-center gap-2"
        onClick={onToggle}
      >
        <div
          {...dragHandleProps}
          className="text-gray-400 cursor-grab active:cursor-grabbing shrink-0 touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <FaGripVertical size={14} />
        </div>
        <div className="flex-1 min-w-0 cursor-pointer">
          <p className="font-medium text-gray-800 truncate text-sm">
            {field.label || `Field ${index + 1}`}
          </p>
          <p className="text-xs text-gray-400">{field.fieldType}</p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-red-400 hover:text-red-600 p-1 rounded ml-1 shrink-0"
        >
          <FaTrash size={13} />
        </button>
      </div>

      {/* Expanded editor */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-white">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field Label</label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="e.g., পেশা / Profession"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
            <select
              value={field.fieldType}
              onChange={(e) => onUpdate({
                fieldType: e.target.value as IExtraField["fieldType"],
                value: e.target.value === "boolean" ? false : "",
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label} — {t.description}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
            {field.fieldType === "boolean" ? (
              <div className="flex gap-4">
                {([true, false] as const).map((v) => (
                  <label key={String(v)} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name={`field-val-${index}`} checked={field.value === v} onChange={() => onUpdate({ value: v })} />
                    {v ? "Yes / হ্যাঁ" : "No / না"}
                  </label>
                ))}
              </div>
            ) : field.fieldType === "numeric" ? (
              <input type="number" value={field.value as number} onChange={(e) => onUpdate({ value: e.target.value })} placeholder="Enter number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            ) : field.fieldType === "multi-line" ? (
              <textarea rows={5} value={field.value as string} onChange={(e) => onUpdate({ value: e.target.value })} placeholder="Enter multi-line text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm" />
            ) : field.fieldType === "text" ? (
              <textarea rows={3} value={field.value as string} onChange={(e) => onUpdate({ value: e.target.value })} placeholder="Enter text value"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm" />
            ) : (
              <input type="text" value={field.value as string} onChange={(e) => onUpdate({ value: e.target.value })} placeholder={`Enter ${field.fieldType} value`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            )}
          </div>

          {field.fieldType === "select" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="space-y-2">
                {(field.options || []).map((opt, optIdx) => (
                  <div key={optIdx} className="flex gap-2">
                    <input type="text" value={opt} onChange={(e) => onUpdateOption(optIdx, e.target.value)} placeholder={`Option ${optIdx + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    <button type="button" onClick={() => onRemoveOption(optIdx)} className="text-red-400 hover:text-red-600 p-2 rounded">
                      <FaTrash size={13} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={onAddOption} className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-1">
                  <FaPlus size={11} /> Add Option
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
export const DynamicFieldBuilder: React.FC<DynamicFieldBuilderProps> = ({
  value, fields, onChange, errors = [],
}) => {
  const fieldsList = value || fields || [];
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // stable ids: use array index as string key
  const ids = fieldsList.map((_, i) => String(i));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setExpandedIndex(null); // collapse all on drag start
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = Number(active.id);
    const newIndex = Number(over.id);
    onChange(arrayMove(fieldsList, oldIndex, newIndex));
  };

  const addField = () => onChange([...fieldsList, { label: "", value: "", fieldType: "text", options: [] }]);
  const addSection = () => onChange([...fieldsList, { label: "নতুন সেকশন", value: "", fieldType: "section" }]);

  const removeField = (index: number) => {
    onChange(fieldsList.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const updateField = (index: number, updates: Partial<IExtraField>) => {
    const updated = [...fieldsList];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const activeField = activeId !== null ? fieldsList[Number(activeId)] : null;

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Custom Fields (Additional Information)
      </h3>

      {errors.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          {errors.map((err, i) => <p key={i} className="text-red-700 text-sm mb-1">• {err}</p>)}
        </div>
      )}

      {fieldsList.length === 0 && (
        <p className="text-gray-400 text-center py-6 text-sm">
          No fields yet. Add a section or field below.
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {fieldsList.map((field, index) => (
              <SortableItem key={index} id={String(index)}>
                {(dragHandleProps) => (
                  <FieldEditor
                    field={field}
                    index={index}
                    isExpanded={expandedIndex === index}
                    onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    onUpdate={(updates) => updateField(index, updates)}
                    onRemove={() => removeField(index)}
                    onAddOption={() => {
                      const f = fieldsList[index];
                      if (f.fieldType === "select") updateField(index, { options: [...(f.options || []), ""] });
                    }}
                    onRemoveOption={(optIdx) => {
                      const f = fieldsList[index];
                      if (f.fieldType === "select" && f.options)
                        updateField(index, { options: f.options.filter((_, i) => i !== optIdx) });
                    }}
                    onUpdateOption={(optIdx, val) => {
                      const f = fieldsList[index];
                      if (f.fieldType === "select" && f.options) {
                        const opts = [...f.options];
                        opts[optIdx] = val;
                        updateField(index, { options: opts });
                      }
                    }}
                    dragHandleProps={dragHandleProps}
                  />
                )}
              </SortableItem>
            ))}
          </div>
        </SortableContext>

        {/* Drag overlay — ghost preview */}
        <DragOverlay>
          {activeField && (
            <div className={`rounded-lg border px-4 py-3 shadow-xl text-sm font-medium ${
              activeField.fieldType === "section"
                ? "bg-indigo-100 border-indigo-300 text-indigo-800"
                : "bg-white border-gray-300 text-gray-700"
            }`}>
              {activeField.label || `Field`}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <div className="mt-4 flex gap-3">
        <button type="button" onClick={addSection}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm">
          <MdOutlineViewHeadline size={16} /> Add Section
        </button>
        <button type="button" onClick={addField}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
          <FaPlus size={14} /> Add Field
        </button>
      </div>
    </div>
  );
};

export default DynamicFieldBuilder;
