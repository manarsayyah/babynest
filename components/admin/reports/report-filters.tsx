"use client"

import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import {
  reportCategoryOptions,
  reportDateRangeOptions,
  reportTypeOptions,
  type ReportDateRangeKey,
  type ReportType,
} from "@/lib/mock/admin-reports"

export type ReportFiltersValue = {
  dateRange: ReportDateRangeKey
  reportType: ReportType
  category: string
  customStart: string
  customEnd: string
}

export type ReportFiltersProps = {
  value: ReportFiltersValue
  onChange: (value: ReportFiltersValue) => void
  onApply: () => void
}

/** "Report Filters" — draft state, applied only when "Apply Filters" is clicked. */
function ReportFilters({ value, onChange, onApply }: ReportFiltersProps) {
  function update<K extends keyof ReportFiltersValue>(key: K, next: ReportFiltersValue[K]) {
    onChange({ ...value, [key]: next })
  }

  return (
    <Card className="gap-4 p-5">
      <div className="flex items-center gap-2 text-small font-semibold text-foreground">
        <Filter className="size-4 text-muted-foreground" />
        Report Filters
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-date-range">Date Range</Label>
          <Select
            value={value.dateRange}
            onValueChange={(v) => update("dateRange", (v as ReportDateRangeKey) ?? value.dateRange)}
          >
            <SelectTrigger id="report-date-range" className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reportDateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-type">Report Type</Label>
          <Select value={value.reportType} onValueChange={(v) => update("reportType", (v as ReportType) ?? value.reportType)}>
            <SelectTrigger id="report-type" className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reportTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-category">Category (optional)</Label>
          <Select value={value.category} onValueChange={(v) => update("category", v ?? value.category)}>
            <SelectTrigger id="report-category" className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {reportCategoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col justify-end">
          <Button onClick={onApply} className="w-full">
            Apply Filters
          </Button>
        </div>
      </div>

      {value.dateRange === "custom" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-custom-start">Start Date</Label>
            <Input
              id="report-custom-start"
              type="date"
              value={value.customStart}
              onChange={(e) => update("customStart", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-custom-end">End Date</Label>
            <Input
              id="report-custom-end"
              type="date"
              value={value.customEnd}
              onChange={(e) => update("customEnd", e.target.value)}
            />
          </div>
        </div>
      ) : null}
    </Card>
  )
}

export { ReportFilters }
