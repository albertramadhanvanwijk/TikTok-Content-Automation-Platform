'use client';

import { useEffect, useState } from 'react';
import { useContentStore } from '@/store/contentStore';
import CarouselCard from './CarouselCard';
import { Plus } from 'lucide-react';
import Link from 'next/link';

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'archived';

export default function CarouselList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(0);
  const limit = 12;

  const {
    carousels,
    isLoading,
    error,
    pagination,
    fetchCarousels,
    deleteCarousel,
    archiveCarousel,
    clearError,
  } = useContentStore();

  useEffect(() => {
    fetchCarousels(statusFilter === 'all' ? undefined : statusFilter, limit, page * limit);
  }, [statusFilter, page]);

  const statuses: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Published', value: 'published' },
    { label: 'Archived', value: 'archived' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Content</h1>
          <p className="text-text-secondary mt-1">Manage your carousel content</p>
        </div>
        <Link href="/content/new">
          <button className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition">
            <Plus size={18} />
            New Carousel
          </button>
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => { setStatusFilter(status.value); setPage(0); }}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              statusFilter === status.value
                ? 'bg-primary text-white'
                : 'bg-secondary text-text-secondary hover:bg-tertiary'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Carousel Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-border p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : carousels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary mb-4">No carousels found</p>
          <Link href="/content/new">
            <button className="text-primary hover:underline">Create your first carousel</button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carousels.map((carousel) => (
            <CarouselCard
              key={carousel.id}
              carousel={carousel}
              onDelete={deleteCarousel}
              onArchive={archiveCarousel}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > limit && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg border border-border disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.ceil(pagination.total / limit) }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`px-3 py-1 rounded-lg ${
                  page === i ? 'bg-primary text-white' : 'border border-border hover:bg-secondary'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(Math.min(Math.ceil(pagination.total / limit) - 1, page + 1))}
            disabled={page >= Math.ceil(pagination.total / limit) - 1}
            className="px-4 py-2 rounded-lg border border-border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}