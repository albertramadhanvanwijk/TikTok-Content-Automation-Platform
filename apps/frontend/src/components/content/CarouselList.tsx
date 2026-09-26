'use client';

import { useEffect, useState, useMemo } from 'react';
import { useContentStore } from '@/store/contentStore';
import CarouselCard from './CarouselCard';
import { Plus, Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/store/toastStore';

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'archived';
type SortOption = 'newest' | 'oldest' | 'title' | 'slides';

export default function CarouselList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSort, setShowSort] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const limit = 12;

  const {
    carousels: allCarousels,
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

  // Filter by search query
  const filteredCarousels = useMemo(() => {
    if (!searchQuery.trim()) return allCarousels;
    const query = searchQuery.toLowerCase();
    return allCarousels.filter(c => 
      c.title.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query) ||
      c.category?.toLowerCase().includes(query) ||
      c.tags?.some(t => t.toLowerCase().includes(query))
    );
  }, [allCarousels, searchQuery]);

  // Sort carousels
  const sortedCarousels = useMemo(() => {
    const arr = [...filteredCarousels];
    switch (sortBy) {
      case 'newest': return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest': return arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'title': return arr.sort((a, b) => a.title.localeCompare(b.title));
      case 'slides': return arr.sort((a, b) => (b.slides_count || 0) - (a.slides_count || 0));
      default: return arr;
    }
  }, [filteredCarousels, sortBy]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(sortedCarousels.map(c => c.id)));
      setSelectAll(true);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Archive ${selectedIds.size} carousels?`)) return;
    
    try {
      for (const id of selectedIds) {
        await archiveCarousel(id);
      }
      toast.success('Archived', `${selectedIds.size} carousels archived`);
      setSelectedIds(new Set());
      setSelectAll(false);
      fetchCarousels(statusFilter === 'all' ? undefined : statusFilter, limit, page * limit);
    } catch (err: any) {
      toast.error('Archive failed', err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} carousels? This cannot be undone.`)) return;
    
    try {
      for (const id of selectedIds) {
        await deleteCarousel(id);
      }
      toast.success('Deleted', `${selectedIds.size} carousels deleted`);
      setSelectedIds(new Set());
      setSelectAll(false);
      fetchCarousels(statusFilter === 'all' ? undefined : statusFilter, limit, page * limit);
    } catch (err: any) {
      toast.error('Delete failed', err.message);
    }
  };

  const statuses: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Published', value: 'published' },
    { label: 'Archived', value: 'archived' },
  ];

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Title A-Z', value: 'title' },
    { label: 'Most Slides', value: 'slides' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Content</h1>
          <p className="text-text-secondary mt-1">Manage your carousel content</p>
        </div>
        <Link href="/content/new">
          <button className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition w-full sm:w-auto">
            <Plus size={18} />
            New Carousel
          </button>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            placeholder="Search title, description, category, tags..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Search carousels"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
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

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition"
          >
            <Filter size={18} />
            <span className="font-medium text-text-secondary">{sortOptions.find(s => s.value === sortBy)?.label}</span>
            <ChevronDown size={16} className={showSort ? 'rotate-180' : ''} />
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg min-w-[160px] z-10">
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-secondary transition ${
                    sortBy === opt.value ? 'text-primary font-medium' : ''
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-blue-900">Select all {sortedCarousels.length} items</span>
            </label>
            <span className="text-sm text-blue-700">{selectedIds.size} selected</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkArchive}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition"
            >
              Archive
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
            >
              Delete
            </button>
            <button
              onClick={() => { setSelectedIds(new Set()); setSelectAll(false); }}
              className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}

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
      ) : sortedCarousels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary mb-4">
            {searchQuery ? `No results for "${searchQuery}"` : 'No carousels found'}
          </p>
          <Link href="/content/new">
            <button className="text-primary hover:underline">
              {searchQuery ? 'Clear search' : 'Create your first carousel'}
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedCarousels.map((carousel) => (
              <CarouselCard
                key={carousel.id}
                carousel={carousel}
                onDelete={deleteCarousel}
                onArchive={archiveCarousel}
                isSelected={selectedIds.has(carousel.id)}
                onSelect={toggleSelect}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.total > limit && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-lg border border-border disabled:opacity-50"
              >
                <ChevronLeft size={18} />
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
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}