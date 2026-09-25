'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useContentStore } from '@/store/contentStore';
import { Carousel, Slide } from '@/types';
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/store/toastStore';

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

  const [slides, setSlides] = useState<Slide[]>([]);
  const [isEditingSlide, setIsEditingSlide] = useState<Slide | null>(null);
  const [showSlideForm, setShowSlideForm] = useState(false);

  const {
    currentCarousel,
    isLoading,
    error,
    fetchCarouselById,
    createCarousel,
    updateCarousel,
    fetchSlides,
    createSlide,
    updateSlide,
    deleteSlide,
    clearError,
  } = useContentStore();

  useEffect(() => {
    if (!isNew && carouselId) {
      fetchCarouselById(carouselId);
      fetchSlides(carouselId);
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
        toast.success('Carousel created', 'You can now add slides');
        router.push(`/content/${carousel.id}`);
      } else {
        await updateCarousel(carouselId, formData);
        toast.success('Carousel updated', 'Changes saved successfully');
        router.push('/content');
      }
    } catch (err: any) {
      toast.error('Save failed', err.message || 'Failed to save carousel');
    }
  };

  const handleSlideSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!carouselId) return;

    const formData = new FormData(e.currentTarget);
    const slideData: Partial<Slide> = {
      slide_number: parseInt(formData.get('slide_number') as string),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      content_text: formData.get('content_text') as string,
      image_url: formData.get('image_url') as string,
    };

    try {
      if (isEditingSlide) {
        await updateSlide(isEditingSlide.id, slideData);
        toast.success('Slide updated', 'Changes saved');
      } else {
        await createSlide(carouselId, slideData);
        toast.success('Slide added', 'New slide created');
      }
      setIsEditingSlide(null);
      setShowSlideForm(false);
      fetchSlides(carouselId);
      fetchCarouselById(carouselId);
    } catch (err: any) {
      toast.error('Save failed', err.message || 'Failed to save slide');
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm('Delete this slide?')) return;

    try {
      await deleteSlide(slideId);
      toast.success('Slide deleted', 'Slide removed from carousel');
      fetchSlides(carouselId!);
      fetchCarouselById(carouselId!);
    } catch (err: any) {
      toast.error('Delete failed', err.message || 'Failed to delete slide');
    }
  };

  const handleEditSlide = (slide: Slide) => {
    setIsEditingSlide(slide);
    setShowSlideForm(true);
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary">Slides ({slides.length})</h2>
            <button
              onClick={() => { setIsEditingSlide(null); setShowSlideForm(true); }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition"
            >
              <Plus size={18} />
              Add Slide
            </button>
          </div>

          {slides.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <p>No slides yet. Click "Add Slide" to create your first slide.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {slides.map((slide) => (
                <div key={slide.id} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-secondary/50 transition">
                  <GripVertical className="text-text-tertiary cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      Slide {slide.slide_number}: {slide.title}
                    </p>
                    <p className="text-sm text-text-secondary truncate">
                      {slide.content_text || slide.description || 'No content'}
                    </p>
                    {slide.image_url && (
                      <p className="text-xs text-text-tertiary flex items-center gap-1 mt-1">
                        <span>🖼️</span> Image attached
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditSlide(slide)}
                      className="p-2 hover:bg-secondary rounded-lg transition"
                      title="Edit"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Slide Form Modal */}
          {showSlideForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  {isEditingSlide ? 'Edit Slide' : 'Add Slide'}
                </h3>
                <form onSubmit={handleSlideSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Slide Number *
                    </label>
                    <input
                      type="number"
                      name="slide_number"
                      value={isEditingSlide?.slide_number || slides.length + 1}
                      onChange={(e) => {}}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={isEditingSlide?.title || ''}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Slide title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      defaultValue={isEditingSlide?.description || ''}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Slide description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Content Text
                    </label>
                    <textarea
                      name="content_text"
                      defaultValue={isEditingSlide?.content_text || ''}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Main content for this slide"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      name="image_url"
                      defaultValue={isEditingSlide?.image_url || ''}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => { setIsEditingSlide(null); setShowSlideForm(false); }}
                      className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90"
                    >
                      {isEditingSlide ? 'Update Slide' : 'Add Slide'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}