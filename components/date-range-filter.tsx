"use client"

import { Calendar } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type DateRange = '30' | '60' | '90' | '180' | '365'

interface DateRangeFilterProps {
  selectedRange: DateRange
  onRangeChange: (range: DateRange) => void
}

const dateRangeOptions = [
  { value: '30' as DateRange, label: 'Last 30 days' },
  { value: '60' as DateRange, label: 'Last 60 days' },
  { value: '90' as DateRange, label: 'Last 90 days' },
  { value: '180' as DateRange, label: 'Last 6 months' },
  { value: '365' as DateRange, label: 'Last 12 months' },
]

export function DateRangeFilter({ selectedRange, onRangeChange }: DateRangeFilterProps) {
  const selectedOption = dateRangeOptions.find(option => option.value === selectedRange)

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm">
      <Calendar className="w-4 h-4 text-slate-500" />
      <Select value={selectedRange} onValueChange={onRangeChange}>
        <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none focus:ring-0">
          <SelectValue>
            <span className="text-sm font-medium text-slate-700">
              {selectedOption?.label || 'Last 30 days'}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {dateRangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}