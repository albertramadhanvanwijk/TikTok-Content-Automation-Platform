'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useContentStore } from '@/store/contentStore';
import TemplateCard from '@/components/templates/TemplateCard';
import TemplateForm from '@/components/templates/TemplateForm';
import TemplatePreviewModal from '@/components/templates/TemplatePreviewModal';
import { Template } from '@/types';
import { toast } from '@/store/toastStore';
import { Plus } from 'lucide-react';

export default function TemplatesPage() {
  const { templates, fetchTemplates, deleteTemplate, isLoading } = useContentStore();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<Template | null>(null);

  useEffect(() => {
    fetchTemplates().catch(() => {});
  }, [fetchTemplates]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await deleteTemplate(id);
      toast.success('Template deleted');
    } catch (e: any) {
      toast.error('Delete failed', e.message);
    }
  };

  const handleUse = (id: string) => {
    router.push(`/content/new?template_id=${id}`);
  };

  if (isLoading && templates.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Templates</h1>
          <p className="text-text-secondary mt-1">Reusable styles for your carousels. Create, preview, then use in editor.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-opacity-90">
          <Plus size={18} /> Create Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
          <p className="text-text-secondary mb-4">No templates yet</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white">
            <Plus size={18} /> Create Your First Template
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} onDelete={handleDelete} onPreview={setPreview} onUse={handleUse} />
          ))}
        </div>
      )}

      {showForm && <TemplateForm onClose={() => setShowForm(false)} onCreated={() => fetchTemplates()} />}
      <TemplatePreviewModal template={preview} open={!!preview} onClose={() => setPreview(null)} />
    </div>
  );
}
