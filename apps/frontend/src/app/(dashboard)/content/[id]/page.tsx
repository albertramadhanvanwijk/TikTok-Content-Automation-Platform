'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useContentStore } from '@/store/contentStore';
import { Carousel } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CarouselEditorPage() {
  const router = useRouter();
  const params = useParams();
  const carouselId = params.id as string;
  const isNew = carouselId === 'new';

  const [formData, setFormData] = useState<Partial<Carousel>>({
    title: '',
    description: '',
    category: '',
    tags: [],
  });

  const {
    currentCarousel,
    isLoading,
    error,
    fetchCarouselById,
    createCarousel,
    updateCarousel,
    clearError,
  } = useContentStore();

  useEffect(() => {
    if (!isNew && carouselId) {
      fetchCarouselById(carouselId);
    }
  }, [carouselId, isNew]);

  useEffect(() => {
    if (currentCarousel && !isNew) {
      setFormData(currentCarousel);
    }
  }, [currentCarousel, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (isNew) {
        const carousel = await createCarousel(formData);
        router.push(`/content/${carousel.id}`);
      } else {
        await updateCarousel(carouselId, formData);
        router.push('/content');
      }
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/content">
          <button className="p-2 hover:bg-secondary rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            {isNew ? 'Create Carousel' : 'Edit Carousel'}
          </h1>
          <p className="text-text-secondary mt-1">
            {isNew ? 'Create a new carousel' : `Edit ${currentCarousel?.title}`}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Carousel title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Description
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Carousel description"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., education"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()) })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="trading, tips"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 transition"
          >
            <Save size={18} />
            {isLoading ? 'Saving...' : 'Save Carousel'}
          </button>
          <Link href="/content">
            <button type="button" className="px-6 py-2 rounded-lg border border-border text-text-secondary hover:bg-secondary transition">
              Cancel
            </button>
          </Link>
        </div>
      </form>

      {/* Slides Section */}
      {!isNew && currentCarousel && (
        <div className="bg-white rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">Slides ({currentCarousel.slides_count})</h2>
          <p className="text-text-secondary">Slide editor coming soon...</p>
        </div>
      )}
    </div>
  );
}
