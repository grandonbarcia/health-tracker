'use client';
import { useState, useEffect } from 'react';
import { VitalSigns } from '../types/vitalSigns';
import VitalSignsCard from './VitalSignsCard';
import { Button } from './ui/button';

interface Props {
  currentUser: any;
  onEdit: (record: VitalSigns) => void;
  refreshTrigger?: number;
  tempUnit?: 'celsius' | 'fahrenheit';
}

type FilterPeriod = 'today' | 'week' | 'month' | 'all';

export default function VitalSignsHistory({
  currentUser,
  onEdit,
  refreshTrigger,
  tempUnit = 'celsius',
}: Props) {
  const [records, setRecords] = useState<VitalSigns[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterPeriod>('week');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, [filter, refreshTrigger]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let url = '/api/vital-signs?';

      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        url += `date=${today}`;
      } else if (filter === 'week') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        url += `startDate=${startDate.toISOString().split('T')[0]}&endDate=${
          endDate.toISOString().split('T')[0]
        }`;
      } else if (filter === 'month') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        url += `startDate=${startDate.toISOString().split('T')[0]}&endDate=${
          endDate.toISOString().split('T')[0]
        }`;
      } else {
        url += 'limit=100';
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch records');

      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching vital signs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/vital-signs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete record');

      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const groupRecordsByDate = () => {
    const grouped: Record<string, VitalSigns[]> = {};

    records.forEach((record) => {
      const date = record.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
    });

    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  };

  const groupedRecords = groupRecordsByDate();

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('today')}
        >
          Today
        </Button>
        <Button
          variant={filter === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('week')}
        >
          Last 7 Days
        </Button>
        <Button
          variant={filter === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('month')}
        >
          Last 30 Days
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Time
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Records List */}
      {!loading && groupedRecords.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No vital signs found for this period</p>
          <p className="text-xs mt-1">
            Record your first measurement to get started
          </p>
        </div>
      )}

      {!loading && groupedRecords.length > 0 && (
        <div className="space-y-6">
          {groupedRecords.map(([date, dateRecords]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 sticky top-0 bg-gray-50 dark:bg-gray-900 py-2 z-10">
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  ({dateRecords.length}{' '}
                  {dateRecords.length === 1 ? 'reading' : 'readings'})
                </span>
              </h3>
              <div className="space-y-3">
                {dateRecords.map((record) => (
                  <VitalSignsCard
                    key={record.id}
                    record={record}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                    tempUnit={tempUnit}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
