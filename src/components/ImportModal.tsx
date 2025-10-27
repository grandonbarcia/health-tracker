'use client';
import { useState } from 'react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
  date: string;
  localItems: number;
  serverItems: number;
}

export default function ImportModal({
  isOpen,
  onClose,
  onImport,
  date,
  localItems,
  serverItems,
}: ImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Import Local Data?</h3>

        <div className="mb-4 text-sm text-gray-600">
          <p className="mb-2">
            You have local food entries for{' '}
            <strong>{new Date(date).toLocaleDateString()}</strong>
            that differ from your account data:
          </p>

          <div className="bg-gray-50 rounded p-3 space-y-2">
            <div className="flex justify-between">
              <span>Local storage:</span>
              <span className="font-medium">{localItems} item(s)</span>
            </div>
            <div className="flex justify-between">
              <span>Your account:</span>
              <span className="font-medium">{serverItems} item(s)</span>
            </div>
          </div>
        </div>

        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
          <strong>⚠️ Warning:</strong> Importing will overwrite your account
          data for this date.
        </div>

        <div className="flex gap-3">
          <button
            onClick={onImport}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Import Local Data
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Keep Account Data
          </button>
        </div>
      </div>
    </div>
  );
}
