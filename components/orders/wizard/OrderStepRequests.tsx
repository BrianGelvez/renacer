'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  apiClient,
  type MedicalOrderTemplateCategory,
  type MedicalOrderTemplateDto,
} from '@/lib/api';
import type { LocalOrderRequestItem } from '@/components/orders/OrderRequestStep';
import {
  CATEGORY_GROUPS,
  CATEGORY_LABELS,
  newRequestKey,
} from '@/components/orders/wizard/helpers';

type OrderStepRequestsProps = {
  items: LocalOrderRequestItem[];
  onChange: (items: LocalOrderRequestItem[]) => void;
  onDuplicate: (key: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  stepError: string | null;
};

type TabId = MedicalOrderTemplateCategory;

export default function OrderStepRequests({
  items,
  onChange,
  onDuplicate,
  onReorder,
  stepError,
}: OrderStepRequestsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('LABORATORY');
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<MedicalOrderTemplateDto[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [selectedTemplateItems, setSelectedTemplateItems] = useState<string[]>([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [itemDescription, setItemDescription] = useState('');
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const dragIndex = { current: null as number | null };

  const loadTemplates = useCallback(async (category: TabId) => {
    setLoadingTemplates(true);
    try {
      const data = await apiClient.listMedicalOrderTemplates(category);
      setTemplates(data);
    } catch {
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates(activeTab);
    setSelectedTemplateId('');
  }, [activeTab, loadTemplates]);

  const filteredTemplates = useMemo(
    () => templates.filter((t) => t.category === activeTab),
    [templates, activeTab],
  );

  const selectedTemplate = filteredTemplates.find((t) => t.id === selectedTemplateId);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.description.toLowerCase().includes(q) ||
        CATEGORY_LABELS[i.category].toLowerCase().includes(q),
    );
  }, [items, searchTerm]);

  const openAddModal = () => {
    setEditingKey(null);
    setItemDescription('');
    setItemModalOpen(true);
  };

  const openEditModal = (item: LocalOrderRequestItem) => {
    setEditingKey(item.key);
    setItemDescription(item.description);
    setActiveTab(item.category);
    setItemModalOpen(true);
  };

  const saveItemModal = () => {
    const text = itemDescription.trim();
    if (!text) return;

    if (editingKey) {
      onChange(
        items.map((i) =>
          i.key === editingKey ? { ...i, description: text, category: activeTab } : i,
        ),
      );
    } else {
      onChange([...items, { key: newRequestKey(), description: text, category: activeTab }]);
    }
    setItemModalOpen(false);
  };

  const removeItem = (key: string) => {
    onChange(items.filter((i) => i.key !== key));
  };

  const applyTemplateSelection = () => {
    if (!selectedTemplate || selectedTemplateItems.length === 0) return;
    const toAdd = selectedTemplate.items
      .filter((i) => selectedTemplateItems.includes(i.id))
      .map((i) => ({
        key: newRequestKey(),
        description: i.description,
        category: activeTab,
      }));
    onChange([...items, ...toAdd]);
    setTemplatePickerOpen(false);
    setSelectedTemplateItems([]);
    setSelectedTemplateId('');
  };

  const handleCreateTemplate = async () => {
    const name = newTemplateName.trim();
    if (!name || items.length === 0) return;
    const tabItems = items.filter((i) => i.category === activeTab);
    if (tabItems.length === 0) return;

    setSavingTemplate(true);
    try {
      await apiClient.createMedicalOrderTemplate({
        name,
        category: activeTab,
        items: tabItems.map((i) => ({ description: i.description })),
      });
      setCreateTemplateOpen(false);
      setNewTemplateName('');
      await loadTemplates(activeTab);
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Solicitudes médicas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Agregá estudios, laboratorio o interconsultas. Cada solicitud es una card editable.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Agregar solicitud
        </button>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filtrar solicitudes agregadas…"
          className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          aria-label="Filtrar solicitudes"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => setActiveTab(group.id)}
            className={`shrink-0 rounded-xl border px-4 py-2.5 text-left transition-all ${
              activeTab === group.id
                ? 'border-teal-600 bg-teal-50 shadow-sm'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <span className="block text-sm font-semibold text-gray-900">{group.label}</span>
            <span className="mt-0.5 block text-xs text-gray-500">{group.hint}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Plantillas · {CATEGORY_LABELS[activeTab]}
          </p>
          <button
            type="button"
            onClick={() => setCreateTemplateOpen(true)}
            className="text-xs font-medium text-teal-700 hover:text-teal-900"
          >
            Guardar como plantilla
          </button>
        </div>
        {loadingTemplates ? (
          <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
        ) : filteredTemplates.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay plantillas en esta categoría. Creá una desde las solicitudes actuales.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTemplateId(t.id);
                  setSelectedTemplateItems(t.items.map((i) => i.id));
                  setTemplatePickerOpen(true);
                }}
                className="rounded-full border border-teal-200 bg-white px-3 py-1.5 text-sm text-teal-800 transition-colors hover:bg-teal-50"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900">
          Solicitudes agregadas ({items.length})
        </h4>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center">
            <p className="text-sm text-gray-500">Todavía no agregaste solicitudes.</p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-700"
            >
              <Plus className="h-4 w-4" />
              Agregar la primera solicitud
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="text-sm text-gray-500">Ninguna solicitud coincide con el filtro.</p>
        ) : (
          <ul className="space-y-3">
            {filteredItems.map((item) => {
              const index = items.findIndex((i) => i.key === item.key);
              return (
                <li
                  key={item.key}
                  draggable
                  onDragStart={() => {
                    dragIndex.current = index;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex.current === null || dragIndex.current === index) return;
                    onReorder(dragIndex.current, index);
                    dragIndex.current = null;
                  }}
                  className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="mt-1 cursor-grab rounded-lg p-1 text-gray-400 hover:bg-gray-100 active:cursor-grabbing"
                      aria-label="Reordenar solicitud"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                          {CATEGORY_LABELS[item.category]}
                        </span>
                      </div>
                      <p className="mt-2 font-medium text-gray-900">{item.description}</p>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                        aria-label="Editar solicitud"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicate(item.key)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                        aria-label="Duplicar solicitud"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        aria-label="Eliminar solicitud"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {stepError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {stepError}
        </p>
      )}

      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">
                {editingKey ? 'Editar solicitud' : 'Nueva solicitud'}
              </h4>
              <button type="button" onClick={() => setItemModalOpen(false)} aria-label="Cerrar">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="mb-2 text-xs text-gray-500">
              Categoría: {CATEGORY_LABELS[activeTab]}
            </p>
            <textarea
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              rows={4}
              placeholder="Ej: Hemograma completo, Ecografía abdominal…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveItemModal}
                className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {templatePickerOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Plantilla: {selectedTemplate.name}</h4>
              <button type="button" onClick={() => setTemplatePickerOpen(false)} aria-label="Cerrar">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {selectedTemplate.items.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 p-3 text-sm hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedTemplateItems.includes(item.id)}
                      onChange={(e) => {
                        setSelectedTemplateItems((prev) =>
                          e.target.checked
                            ? [...prev, item.id]
                            : prev.filter((id) => id !== item.id),
                        );
                      }}
                    />
                    {item.description}
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTemplatePickerOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={applyTemplateSelection}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white"
              >
                <Check className="h-4 w-4" />
                Agregar seleccionadas
              </button>
            </div>
          </div>
        </div>
      )}

      {createTemplateOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <h4 className="mb-3 font-semibold text-gray-900">Crear plantilla</h4>
            <p className="mb-3 text-sm text-gray-500">
              Se guardarán las solicitudes de {CATEGORY_LABELS[activeTab]}.
            </p>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="Nombre de la plantilla"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateTemplateOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingTemplate}
                onClick={() => void handleCreateTemplate()}
                className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {savingTemplate ? 'Guardando…' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
