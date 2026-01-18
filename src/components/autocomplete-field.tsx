'use client';

import { useState, Fragment } from 'react';
import { Combobox } from '@headlessui/react';

interface AutocompleteFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
  helperText?: string;
}

export default function AutocompleteField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  helperText,
}: AutocompleteFieldProps) {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) =>
          option.toLowerCase().includes(normalizedQuery)
        );

  // Check for exact match (case-insensitive)
  const exactMatch = options.some(
    (option) => option.toLowerCase() === normalizedQuery
  );

  const showCreateNew = query.length > 0 && !exactMatch;

  return (
    <div className="relative">
      <Combobox value={value} onChange={onChange}>
        <Combobox.Label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </Combobox.Label>

        <div className="relative">
          <Combobox.Input
            id={id}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 text-gray-900"
            placeholder={placeholder}
            onChange={(event) => {
              setQuery(event.target.value);
              onChange(event.target.value);
            }}
            displayValue={(value: string) => value}
            required={required}
          />

          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 8l4 4 4-4"
              />
            </svg>
          </Combobox.Button>

          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg border border-gray-200 focus:outline-none">
          {filteredOptions.length === 0 && !showCreateNew ? (
            <div className="px-4 py-2 text-sm text-gray-500">
              No options found
            </div>
          ) : (
            <>
              {filteredOptions.map((option) => (
                <Combobox.Option
                  key={option}
                  value={option}
                  as={Fragment}
                >
                  {({ active, selected }) => (
                    <li
                      className={`cursor-pointer select-none relative px-4 py-2 ${
                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={selected ? 'font-semibold' : 'font-normal'}>
                          {option}
                        </span>
                        {selected && (
                          <svg
                            className={`h-5 w-5 ${active ? 'text-white' : 'text-blue-600'}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </li>
                  )}
                </Combobox.Option>
              ))}

              {showCreateNew && (
                <Combobox.Option value={query} as={Fragment}>
                  {({ active }) => (
                    <li
                      className={`cursor-pointer select-none relative px-4 py-2 ${
                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                      }`}
                    >
                      <span className="font-normal">
                        <span className={active ? 'text-blue-100' : 'text-gray-500'}>
                          Create new:{' '}
                        </span>
                        <span className="font-semibold">{query}</span>
                      </span>
                    </li>
                  )}
                </Combobox.Option>
              )}
            </>
          )}
          </Combobox.Options>
        </div>
      </Combobox>

      {helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
