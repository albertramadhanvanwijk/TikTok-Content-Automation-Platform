'use client';

import { useState } from 'react';
import { Carousel } from '@/types';
import Link from 'next/link';
import { Trash2, Edit, Share2, Calendar, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/store/toastStore';

interface CarouselCardProps {
  carousel: Carousel;
  onDelete: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

export default function CarouselCard({ carousel, onDelete, onArchive }: CarouselCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setShowDeleteConfirm(false);

    try {
      await onDelete(carousel.id);
      toast.success('Carousel deleted', 'The carousel has been permanently removed');
    } catch (err: any) {
      toast.error('Delete failed', err.message || 'Failed to delete carousel');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    if (isArchiving) return;
    setIsArchiving(true);
    setShowArchiveConfirm(false);

    try {
      await onArchive(carousel.id);
      toast.success('Carousel archived', 'The carousel has been moved to archive');
    } catch (err: any) {
      toast.error('Archive failed', err.message || 'Failed to archive carousel');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-border p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Link href={`/content/${carousel.id}`}>
            <h3 className="text-lg font-semibold text-text-primary hover:text-primary cursor-pointer">
              {carousel.title}
            </h3>
          </Link>
          <p className="text-sm text-text-secondary mt-1">{carousel.description}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(carousel.status)}`}>
          {carousel.status}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-text-tertiary mb-3">
        <span>{carousel.slides_count} slides</span>
        {carousel.scheduled_at && (
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {format(new Date(carousel.scheduled_at), 'MMM dd, yyyy HH:mm')}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Link href={`/content/${carousel.id}`} className="flex-1">
          <button className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition">
            <Edit size={14} />
            Edit
          </button>
        </Link>

        {carousel.status === 'draft' && (
          <>
            <button
              onClick={() => setShowArchiveConfirm(true)}
              disabled={isArchiving}
              className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition disabled:opacity-50"
              title="Schedule/Publish"
            >
              <Calendar size={14} />
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}

        {carousel.status !== 'draft' && (
          <button
            onClick={() => setShowArchiveConfirm(true)}
            disabled={isArchiving}
            className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-50"
            title="Archive"
          >
            <Archive size={14} />
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Delete Carousel</h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete "{carousel.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {carousel.status === 'draft' ? 'Schedule or Publish' : 'Archive Carousel'}
            </h3>
            <p className="text-text-secondary mb-6">
              {carousel.status === 'draft'
                ? 'Go to the edit page to schedule or publish this carousel.'
                : `Are you sure you want to archive "${carousel.title}"?`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              {carousel.status !== 'draft' && (
                <button
                  onClick={handleArchive}
                  disabled={isArchiving}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50"
                >
                  {isArchiving ? 'Archiving...' : 'Archive'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}