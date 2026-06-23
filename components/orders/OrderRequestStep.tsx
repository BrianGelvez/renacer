'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  apiClient,
  type MedicalOrderTemplateCategory,
  type MedicalOrderTemplateDto,
} from '@/lib/api';

export type LocalOrderRequestItem = {
  key: string;
  description: string;
  category: MedicalOrderTemplateCategory;
};

type TabId = MedicalOrderTemplateCategory;

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'MANUAL', label: 'Manual' },
  { id: 'IMAGING', label: 'Estudio por imágenes' },
  { id: 'LABORATORY', label: 'Laboratorio' },
];

type Props = {
  items: LocalOrderRequestItem[];
  onChange: (items: LocalOrderRequestItem[]) => void;
};

function newKey(): string {
  return crypto.randomUUID();
}

export default function OrderRequestStep({ items, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('MANUAL');
  const [templates, setTemplates] = useState<MedicalOrderTemplateDto[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [selectedTemplateItems, setSelectedTemplateItems] = useState<string[]>(
    [],
  );

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [itemDescription, setItemDescription] = useState('');

  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

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

  const selectedTemplate = filteredTemplates.find(
    (t) => t.id === selectedTemplateId,
  );

  const openAddModal = () => {
    setEditingKey(null);
    setItemDescription('');
    setItemModalOpen(true);
  };

  const openEditModal = (item: LocalOrderRequestItem) => {
    setEditingKey(item.key);
    setItemDescription(item.description);
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
      onChange([
        ...items,
        { key: newKey(), description: text, category: activeTab },
      ]);
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
        key: newKey(),
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
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-100"
        >
          <Plus className="h-4 w-4" />
          Agregar solicitud
        </button>
        <button
          type="button"
          onClick={() => setCreateTemplateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Crear plantilla
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Plantillas
        </label>
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
                className="rounded-full border border-teal-200 bg-white px-3 py-1.5 text-sm text-teal-800 hover:bg-teal-50"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Solicitudes ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">
            Agregá al menos una solicitud para continuar.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.key}
                className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">
                {editingKey ? 'Editar solicitud' : 'Agregar solicitud'}
              </h4>
              <button type="button" onClick={() => setItemModalOpen(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <textarea
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              rows={4}
              placeholder="Ej: Placa de tórax, Resonancia de columna…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveItemModal}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {templatePickerOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">
                Plantilla: {selectedTemplate.name}
              </h4>
              <button type="button" onClick={() => setTemplatePickerOpen(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {selectedTemplate.items.map((item) => (
                <li key={item.id}>
                  <label className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 text-sm cursor-pointer hover:bg-gray-50">
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
                className="rounded-lg px-4 py-2 text-sm text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={applyTemplateSelection}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white"
              >
                <Check className="h-4 w-4" />
                Agregar seleccionadas
              </button>
            </div>
          </div>
        </div>
      )}

      {createTemplateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h4 className="font-semibold text-gray-900 mb-3">Crear plantilla</h4>
            <p className="text-sm text-gray-500 mb-3">
              Se guardarán las solicitudes de la pestaña activa ({activeTab}).
            </p>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="Nombre de la plantilla"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateTemplateOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingTemplate}
                onClick={() => void handleCreateTemplate()}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
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
