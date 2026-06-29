'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  Upload,
  Loader2,
  ExternalLink,
  Download,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface MedicalRecordFile {
  id: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

interface MedicalRecordFilesSectionProps {
  medicalRecordId: string;
  canEdit?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function MedicalRecordFilesSection({
  medicalRecordId,
  canEdit = true,
}: MedicalRecordFilesSectionProps) {
  const [files, setFiles] = useState<MedicalRecordFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient
      .getMedicalRecordFiles(medicalRecordId)
      .then((data: MedicalRecordFile[]) =>
        setFiles(Array.isArray(data) ? data : []),
      )
      .catch(() => setError('Error al cargar archivos.'))
      .finally(() => setLoading(false));
  }, [medicalRecordId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Solo se permiten archivos PDF.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError(
        `El archivo supera el tamaño máximo (5MB). Tamaño: ${formatFileSize(file.size)}`,
      );
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      await apiClient.uploadMedicalRecordFile(medicalRecordId, file);
      fetchFiles();
    } catch (err: unknown) {
      setUploadError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al subir el archivo.',
      );
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (fileId: string) => {
    try {
      const blob = await apiClient.getMedicalRecordFileBlob(fileId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setError('No se pudo abrir el archivo.');
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const blob = await apiClient.getMedicalRecordFileBlob(fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo descargar el archivo.');
    }
  };

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    setError(null);
    try {
      await apiClient.deleteMedicalRecordFile(fileId);
      fetchFiles();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Error al eliminar.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-ensigna-primary" />
          Archivos adjuntos
        </h3>
        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ensigna-primary text-white text-sm font-medium hover:bg-ensigna-primary-dark disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Subir PDF
            </button>
          </>
        )}
      </div>

      {uploadError && (
        <div className="mb-3 flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {uploadError}
        </div>
      )}

      {error && (
        <div className="mb-3 flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando archivos...
        </div>
      ) : files.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          No hay archivos adjuntos. Subí estudios, recetas o informes en PDF.
        </p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white border border-gray-100 hover:border-gray-200"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.fileName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.fileSize)} · {formatDate(file.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleView(file.id)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                  title="Ver"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(file.id, file.fileName)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                  title="Descargar"
                >
                  <Download className="w-4 h-4" />
                </button>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleDelete(file.id)}
                    disabled={deletingId === file.id}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="Eliminar"
                  >
                    {deletingId === file.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
