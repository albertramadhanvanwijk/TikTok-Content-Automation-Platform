'use client';

import { useEffect, useState } from 'react';
import { useContentStore } from '@/store/contentStore';
import { Carousel } from '@/types';
import { Calendar, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { toast } from '@/store/toastStore';

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedCarousel, setSelectedCarousel] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState('09:00');

  const {
    carousels,
    isLoading,
    error,
    fetchCarousels,
    scheduleCarousel,
    clearError,
  } = useContentStore();

  useEffect(() => {
    fetchCarousels('draft', 100, 0);
  }, []);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const scheduleCarousels = carousels.filter(c => c.scheduled_at && isSameMonth(new Date(c.scheduled_at), currentMonth));

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (selectedDate && selectedCarousel && scheduledTime) {
        const scheduledAt = new Date(selectedDate);
        const [hours, minutes] = scheduledTime.split(':');
        scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        await scheduleCarousel(selectedCarousel, scheduledAt.toISOString());
        toast.success('Carousel scheduled', `Will be posted on ${format(scheduledAt, 'MMM dd, yyyy at HH:mm')}`);
        
        setShowScheduleForm(false);
        setSelectedCarousel('');
        setScheduledTime('09:00');
        setSelectedDate(null);
        
        fetchCarousels('draft', 100, 0);
      }
    } catch (err: any) {
      toast.error('Scheduling failed', err.message || 'Failed to schedule carousel');
    }
  };

  const getCarouselsForDate = (date: Date) => {
    return scheduleCarousels.filter(c => {
      const scheduledDate = new Date(c.scheduled_at!);
      return scheduledDate.toDateString() === date.toDateString();
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Schedule</h1>
        <p className="text-text-secondary mt-1">Manage when your carousels are posted</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-text-primary">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="px-3 py-1 hover:bg-secondary rounded transition"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 hover:bg-secondary rounded transition text-sm"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="px-3 py-1 hover:bg-secondary rounded transition"
              >
                →
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-text-tertiary py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {daysInMonth.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const dayCarousels = getCarouselsForDate(day);
              const isSelected = selectedDate?.toDateString() === day.toDateString();

              return (
                <button
                  key={day.toString()}
                  onClick={() => {
                    setSelectedDate(day);
                    setShowScheduleForm(true);
                  }}
                  className={`aspect-square p-2 rounded-lg border-2 transition ${
                    isSelected
                      ? 'border-primary bg-blue-50'
                      : 'border-border hover:border-primary'
                  } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                >
                  <div className="text-sm font-semibold text-text-primary">
                    {day.getDate()}
                  </div>
                  {dayCarousels.length > 0 && (
                    <div className="text-xs text-primary font-bold mt-1">
                      {dayCarousels.length}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule Form */}
        <div className="space-y-4">
          {showScheduleForm && selectedDate && (
            <div className="bg-white rounded-lg border border-border p-4">
              <h3 className="font-bold text-text-primary mb-4">
                Schedule for {format(selectedDate, 'MMM dd, yyyy')}
              </h3>

              <form onSubmit={handleSchedule} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    Select Carousel
                  </label>
                  <select
                    value={selectedCarousel}
                    onChange={(e) => setSelectedCarousel(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    required
                  >
                    <option value="">Choose a carousel...</option>
                    {carousels.map((carousel) => (
                      <option key={carousel.id} value={carousel.id}>
                        {carousel.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !selectedCarousel}
                  className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-opacity-90 disabled:opacity-50 transition text-sm"
                >
                  {isLoading ? 'Scheduling...' : 'Schedule'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowScheduleForm(false)}
                  className="w-full border border-border py-2 rounded-lg text-text-secondary hover:bg-secondary transition text-sm"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {/* Scheduled items */}
          <div className="bg-white rounded-lg border border-border p-4">
            <h3 className="font-bold text-text-primary mb-3">Upcoming</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {scheduleCarousels.length === 0 ? (
                <p className="text-sm text-text-secondary">No scheduled carousels</p>
              ) : (
                scheduleCarousels.map((carousel) => (
                  <div key={carousel.id} className="p-2 bg-blue-50 rounded text-sm">
                    <p className="font-medium text-text-primary truncate">
                      {carousel.title}
                    </p>
                    <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                      <Clock size={12} />
                      {format(new Date(carousel.scheduled_at!), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}