"use client";

import React, { useState } from 'react';
import { ELEMENT_TYPES } from '../types/ElementTypes';


const IconSvg = ({ path }: { path: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

export default function ElementsSidebar() {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  return (
    <div className="bg-gray-50 p-4 rounded-xl h-full border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Form Elements</h3>
      <p className="text-sm text-gray-500 mb-4">Drag and drop elements onto the form or click to add</p>
      <div className="space-y-2">
        {ELEMENT_TYPES.map((el) => (
          <div
            key={el.type}
            draggable
            onDragStart={(e) => {
              setDraggedItem(el.type);

              localStorage.setItem('dragging-element', JSON.stringify({
                type: el.type,
                label: el.label,
              }))

              e.dataTransfer.setData('application/json', JSON.stringify({
                type: el.type,
                label: el.label,
              }));
              document.dispatchEvent(new CustomEvent('sidebar-drag-start'))
            }}
            onDragEnd={() => {
              setDraggedItem(null);
              localStorage.removeItem('dragging-element');
              document.dispatchEvent(new CustomEvent('sidebar-drag-end'))
            }}
            className={`
              flex items-center bg-white p-3 rounded-lg shadow-sm mb-2 border border-gray-200 cursor-grab hover:border-emerald-300 transition-all duration-200
              ${draggedItem === el.type ? 'opacity-50 scale-95' : ''}
              `}
          >

            <div className="mr-3 text-emerald-600">
              <IconSvg path={el.icon} />
            </div>
            <span className="text-gray-700 font-medium">{el.label}</span>

          </div>
        ))}
      </div>
    </div >
  );
} 