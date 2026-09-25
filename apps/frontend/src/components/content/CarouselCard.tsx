'use client';

import { Carousel } from '@/types';
import Link from 'next/link';
import { Trash2, Edit, Share2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface CarouselCardProps {
  carousel: Carousel;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

export default function CarouselCard({ carousel, onDelete, onArchive }: CarouselCardProps) {
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
          <button
            onClick={() => onArchive(carousel.id)}
            className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition"
          >
            <Share2 size={14} />
          </button>
        )}

        <button
          onClick={() => onDelete(carousel.id)}
          className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 transition"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
